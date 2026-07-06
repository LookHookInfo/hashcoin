import { Stack, Group, Button, Box, Text, TextInput, Slider, Badge, Progress, Tooltip, Transition } from '@mantine/core';
import { IconRocket, IconCheck } from '@tabler/icons-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { erc20Abi, formatEther, parseEther } from 'viem';
import { writeAndWait } from '@/lib/wagmi/tx';
import { contractGemFun, hashcoinContract } from '@/utils/contracts';
import { AppTransactionButton } from '../AppTransactionButton';
import { formatAmount } from '@/hooks/useTokenLogic';
import { CURVE_SUPPLY, SLIPPAGE } from '@/utils/constants';

const calculateReserveFor = (sold: bigint) => {
  return sold / 1000n + (sold * sold) / (45_000_000_000n * 10n ** 18n);
};

const tokensForHashSpend = (
  targetHash: bigint,
  soldOnCurve: bigint,
  maxTokens: bigint,
): bigint => {
  if (targetHash <= 0n || maxTokens <= 0n) return 0n;
  const reserveBefore = calculateReserveFor(soldOnCurve);
  const costAtMax = calculateReserveFor(soldOnCurve + maxTokens) - reserveBefore;
  if (costAtMax <= targetHash) return maxTokens;
  let lo = 0n;
  let hi = maxTokens;
  while (lo < hi) {
    const mid = (lo + hi + 1n) / 2n;
    const cost = calculateReserveFor(soldOnCurve + mid) - reserveBefore;
    if (cost <= targetHash) lo = mid;
    else hi = mid - 1n;
  }
  return lo;
};

const safeParseAmount = (value: string) => {
  if (!value) return 0n;
  if (!/^\d*\.?\d*$/.test(value)) return null;
  try { return parseEther(value); } catch { return null; }
};

const truncDecimals = (value: string, maxDecimals = 2): string => {
  if (!value) return value;
  const idx = value.indexOf(".");
  if (idx < 0) return value;
  if (maxDecimals <= 0) return value.slice(0, idx);
  return value.slice(0, idx + 1 + maxDecimals);
};

interface Toast {
  mode: 'buy' | 'sell';
  amount: string;
  symbol: string;
  hash: string;
}

export function TradePanel({ address, info, tokenBalance, hashBalance, hashAllowance, memeAllowance, symbol, account, refetchPending, onTradeConfirmed, onTradeConfirmedLocal }: any) {
  const [tradeAmount, setTradeAmount] = useState('0');
  const [displayAmount, setDisplayAmount] = useState('0');
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [sliderVal, setSliderVal] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const handleSliderChange = (percent: number) => {
    setSliderVal(percent);
    let amountWei = 0n;
    if (mode === 'sell') {
        if (tokenBalance) amountWei = (tokenBalance * BigInt(percent)) / 100n;
    } else {
        const sold = info ? info[2] : 0n;
        const remaining = sold < CURVE_SUPPLY ? CURVE_SUPPLY - sold : 0n;
        const hb = typeof hashBalance === 'bigint' ? hashBalance : 0n;
        const maxBuyable = tokensForHashSpend(hb, sold, remaining);
        amountWei = (maxBuyable * BigInt(percent)) / 100n;
    }
    const full = formatEther(amountWei);
    setTradeAmount(full);
    setDisplayAmount(truncDecimals(full, 2));
  };

  useEffect(() => { setSliderVal(0); setTradeAmount("0"); setDisplayAmount("0"); }, [mode]);

  const amountBigInt = safeParseAmount(tradeAmount);
  const soldOnCurve = info ? info[2] : 0n;
  const remainingCurveSupply = soldOnCurve < CURVE_SUPPLY ? CURVE_SUPPLY - soldOnCurve : 0n;
  const expectedHash = useMemo(() => {
    if (!info || amountBigInt === null || amountBigInt <= 0n) return 0n;
    const reserveBefore = calculateReserveFor(soldOnCurve);
    if (mode === 'buy') {
      if (amountBigInt > remainingCurveSupply) return 0n;
      return calculateReserveFor(soldOnCurve + amountBigInt) - reserveBefore;
    }
    if (amountBigInt > soldOnCurve) return 0n;
    return reserveBefore - calculateReserveFor(soldOnCurve - amountBigInt);
  }, [amountBigInt, info, mode, remainingCurveSupply, soldOnCurve]);

  const needsHashApprove = mode === 'buy' && hashAllowance < expectedHash;
  const needsMemeApprove = mode === 'sell' && amountBigInt !== null && memeAllowance < amountBigInt;

  const curveProgress = info ? Number(BigInt(info[2]) * 10000n / CURVE_SUPPLY) / 100 : 0;
  const isCurveCompleted = info?.[1] || false;
  const isMigrated = info?.[0] || false;
  const canMigrate = isCurveCompleted && !isMigrated;

  const hb = typeof hashBalance === 'bigint' ? hashBalance : 0n;
  const insufficientHash = mode === 'buy' && expectedHash > 0n && expectedHash > hb;
  const canSubmitTrade = !!account && !isCurveCompleted && !isMigrated && (mode === 'buy' ? (amountBigInt !== null && amountBigInt > 0n && amountBigInt <= remainingCurveSupply && !insufficientHash) : (amountBigInt !== null && amountBigInt > 0n && amountBigInt <= (tokenBalance || 0n) && amountBigInt <= soldOnCurve));

  const handleConfirmed = () => {
    const confirmedMode = mode;
    const confirmedAmount = amountBigInt;
    const confirmedHash = expectedHash;

    if (onTradeConfirmedLocal && confirmedAmount !== null && confirmedAmount > 0n) {
      onTradeConfirmedLocal(confirmedMode, confirmedAmount, confirmedHash);
    } else {
      refetchPending();
    }
    onTradeConfirmed?.(address);

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 3000);

    setTradeAmount('0');
    setDisplayAmount('0');
    setSliderVal(0);

    if (confirmedAmount !== null && confirmedAmount > 0n) {
      setToast({
        mode: confirmedMode,
        amount: formatAmount(formatEther(confirmedAmount)),
        symbol,
        hash: formatAmount(formatEther(confirmedHash)),
      });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <Stack gap="lg" style={{ position: 'relative' }}>
        <Transition mounted={!!toast} transition="slide-down" duration={220} timingFunction="ease">
          {(styles) => toast ? (
            <Box
              style={{
                ...styles,
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: `${styles.transform ?? ''} translateX(-50%)`,
                zIndex: 5,
                backgroundColor: 'rgba(20, 22, 28, 0.96)',
                border: `1px solid ${toast.mode === 'buy' ? 'rgba(64, 192, 87, 0.55)' : 'rgba(250, 82, 82, 0.55)'}`,
                borderRadius: 8,
                padding: '8px 14px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              <Group gap={8} wrap="nowrap">
                <IconCheck size={16} color={toast.mode === 'buy' ? '#40c057' : '#fa5252'} />
                <Text size="sm" c="white" fw={500}>
                  {toast.mode === 'buy' ? 'Bought' : 'Sold'} {toast.amount} {toast.symbol}
                </Text>
                <Text size="xs" c="dimmed">
                  {toast.mode === 'buy' ? `for ${toast.hash} HASH` : `for ${toast.hash} HASH`}
                </Text>
              </Group>
            </Box>
          ) : <></>}
        </Transition>

        <Group grow>
            <Button variant={mode === 'buy' ? "filled" : "light"} color="green" onClick={() => setMode('buy')} disabled={isCurveCompleted}>Buy</Button>
            <Button variant={mode === 'sell' ? "filled" : "light"} color="red" onClick={() => setMode('sell')} disabled={isCurveCompleted}>Sell</Button>
        </Group>

        <Box p="md" style={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: 'rgba(0,0,0,0.2)', opacity: isCurveCompleted ? 0.6 : 1 }}>
            <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">{isCurveCompleted ? 'Curve Completed' : (mode === 'buy' ? 'I want to buy' : 'I want to sell')}</Text>
                {mode === 'buy' ? (
                  <Text size="sm" c="dimmed">Balance: {hashBalance ? formatAmount(formatEther(hashBalance)) : '0.00'} HASH</Text>
                ) : (
                  <Text size="sm" c="dimmed">Balance: {tokenBalance ? formatAmount(formatEther(tokenBalance)) : '0.00'} {symbol}</Text>
                )}
            </Group>

            <TextInput
              size="lg"
              placeholder="0.0"
              value={displayAmount}
              onChange={(e) => {
                const v = e.target.value;
                setTradeAmount(v);
                setDisplayAmount(v);
              }}
              disabled={isCurveCompleted}
              rightSection={<Text size="sm" pr="md" fw={700}>{symbol}</Text>}
              styles={{ input: { backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '24px' } }}
            />

            <Box mt="xl" px="xs">
                <Slider value={sliderVal} onChange={handleSliderChange} disabled={isCurveCompleted} color="blue" marks={[{ value: 0, label: '0%' }, { value: 25, label: '25%' }, { value: 50, label: '50%' }, { value: 75, label: '75%' }, { value: 100, label: '100%' }]} styles={{ markLabel: { color: '#666', fontSize: '10px' }, track: { backgroundColor: '#333' } }} />
            </Box>

            <Group justify="space-between" mt={40}>
                <Text size="sm" c="dimmed">{mode === 'buy' ? 'You pay' : 'You receive'}</Text>
                <Text fw={700} c={insufficientHash ? 'red' : 'white'}>{formatAmount(formatEther(expectedHash))} HASH</Text>
            </Group>
            {insufficientHash && (
                <Text size="xs" c="red" ta="right" mt={4}>Insufficient HASH balance</Text>
            )}
        </Box>

        {!isCurveCompleted ? (
            <AppTransactionButton
                size="lg"
                disabled={!canSubmitTrade}
                style={{ background: mode === 'buy' ? 'linear-gradient(45deg, #40c057, #82c91e)' : 'linear-gradient(45deg, #fa5252, #ff8787)', color: 'white', border: 'none', fontWeight: 700, opacity: canSubmitTrade ? 1 : 0.5 }}
                onTransactionConfirmed={handleConfirmed}
                transaction={async () => {
                    if (!account) throw new Error("Connect wallet");

                    if (mode === 'buy') {
                        if (needsHashApprove) {
                            await writeAndWait({
                                address: hashcoinContract.address,
                                abi: erc20Abi,
                                functionName: "approve",
                                args: [contractGemFun.address, expectedHash * 100n],
                            });
                        }
                        return {
                            address: contractGemFun.address,
                            abi: contractGemFun.abi,
                            functionName: "buy",
                            args: [address, amountBigInt!, (expectedHash * SLIPPAGE.BUY_BPS) / SLIPPAGE.BASE],
                        };
                    } else {
                        if (needsMemeApprove) {
                            await writeAndWait({
                                address: address as `0x${string}`,
                                abi: erc20Abi,
                                functionName: "approve",
                                args: [contractGemFun.address, amountBigInt! * 100n],
                            });
                        }
                        return {
                            address: contractGemFun.address,
                            abi: contractGemFun.abi,
                            functionName: "sell",
                            args: [address, amountBigInt!, (expectedHash * SLIPPAGE.SELL_BPS) / SLIPPAGE.BASE],
                        };
                    }
                }}
            >
                {mode === 'buy' ? (needsHashApprove ? "Approve & Buy" : "Buy") : (needsMemeApprove ? "Approve & Sell" : "Sell")}
            </AppTransactionButton>
        ) : (
            <Badge size="xl" variant="light" color="blue" py="lg">Bonding Curve is 100% complete!</Badge>
        )}

        <Box mt="md">
            <Text size="xs" c="dimmed" mb={5}>Bonding Curve Progress</Text>
            <Group gap="md" wrap="nowrap">
                <Box flex={1}>
                    <Progress value={curveProgress} color="blue" size="xl" radius="xl" />
                </Box>
                {!isMigrated && (
                    <Tooltip label="Eternal Pool on Uniswap" withArrow position="top">
                        <Box>
                            <AppTransactionButton
                                size="md"
                                disabled={!canMigrate}
                                className={(curveProgress > 50 || isFlashing) ? 'tge-glow' : ''}
                                style={{
                                    background: canMigrate ? 'linear-gradient(45deg, #007bff, #00d2ff)' : 'rgba(255, 255, 255, 0.05)',
                                    color: (canMigrate || isFlashing) ? 'white' : '#999',
                                    fontWeight: 700,
                                    animation: canMigrate ? 'pulse 1s infinite' : ((curveProgress > 80 || isFlashing) ? 'pulse-subtle 2s infinite' : 'none'),
                                    border: (curveProgress > 80 || isFlashing) ? '1px solid rgba(0, 210, 255, 0.8)' : 'none',
                                    boxShadow: isFlashing ? '0 0 15px rgba(0, 210, 255, 0.8)' : undefined,
                                    transition: 'all 0.5s ease'
                                }}
                                leftSection={<IconRocket size={18} className={(curveProgress > 20 || isFlashing) ? 'rocket-animate' : ''} />}
                                onTransactionConfirmed={handleConfirmed}
                                transaction={() => ({
                                    address: contractGemFun.address,
                                    abi: contractGemFun.abi,
                                    functionName: "migrate",
                                    args: [address],
                                })}
                            >
                                TGE
                            </AppTransactionButton>
                        </Box>
                    </Tooltip>
                )}
                {isMigrated && (
                    <Tooltip label="Eternal Pool on Uniswap" withArrow position="top">
                        <Box>
                            <Button size="md" disabled variant="outline" color="blue" leftSection={<IconRocket size={18} />}>TGE Live</Button>
                        </Box>
                    </Tooltip>
                )}
            </Group>
            <Text size="xs" fw={700} c="blue" ta="right" mt={5}>{curveProgress.toFixed(1)}%</Text>
        </Box>
    </Stack>
  );

}
