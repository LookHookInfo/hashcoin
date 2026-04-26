import { Stack, Group, Button, Box, Text, TextInput, Slider, Badge, Progress, Tooltip } from '@mantine/core';
import { IconRocket } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { formatEther, parseEther } from 'viem';
import { prepareContractCall, sendAndConfirmTransaction, getContract } from 'thirdweb';
import { approve as prepareApprove } from "thirdweb/extensions/erc20";
import { contractGemFun, hashcoinContract } from '@/utils/contracts';
import { client } from "@/lib/thirdweb/client";
import { chain } from "@/lib/thirdweb/chain";
import { useAlchemyReadContract } from '@/hooks/useAlchemyRead';
import { AppTransactionButton } from '../AppTransactionButton';
import { formatAmount } from '@/hooks/useTokenLogic';
import { CURVE_SUPPLY, SLIPPAGE, REFRESH_INTERVALS } from '@/utils/constants';
import { parseAbi } from 'viem';

const erc20Abi = parseAbi(["function allowance(address owner, address spender) view returns (uint256)"]);

const calculateReserveFor = (sold: bigint) => {
  return sold / 1000n + (sold * sold) / (45_000_000_000n * 10n ** 18n);
};

const safeParseAmount = (value: string) => {
  if (!value) return 0n;
  if (!/^\d*\.?\d*$/.test(value)) return null;
  try { return parseEther(value); } catch { return null; }
};

export function TradePanel({ address, info, tokenBalance, symbol, account, refetchPending, onTradeConfirmed }: any) {
  const [tradeAmount, setTradeAmount] = useState('0');
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [sliderVal, setSliderVal] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  const { data: hashAllowance, refetch: refetchHashAllowance } = useAlchemyReadContract<any, any, any, bigint>({
    queryKey: ['gem-token', 'hash-allowance', account?.address],
    address: hashcoinContract.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: account?.address ? [account.address as `0x${string}`, contractGemFun.address as `0x${string}`] : undefined,
    enabled: !!account?.address,
    staleTime: 5_000,
    refetchInterval: REFRESH_INTERVALS.ALLOWANCE,
  });

  const { data: memeAllowance, refetch: refetchMemeAllowance } = useAlchemyReadContract<any, any, any, bigint>({
    queryKey: ['gem-token', 'meme-allowance', address, account?.address],
    address: address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: account?.address ? [account.address as `0x${string}`, contractGemFun.address as `0x${string}`] : undefined,
    enabled: !!account?.address && !!address,
    staleTime: 5_000,
    refetchInterval: REFRESH_INTERVALS.ALLOWANCE,
  });

  const handleSliderChange = (percent: number) => {
    setSliderVal(percent);
    let amountWei = 0n;
    if (mode === 'sell') {
        if (tokenBalance) amountWei = (tokenBalance * BigInt(percent)) / 100n;
    } else {
        const remaining = info ? CURVE_SUPPLY - info[2] : 0n;
        amountWei = remaining > 0n ? (remaining * BigInt(percent)) / 100n : 0n;
    }
    setTradeAmount(formatEther(amountWei));
  };

  useEffect(() => { setSliderVal(0); setTradeAmount("0"); }, [mode]);

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

  const needsHashApprove = mode === 'buy' && (BigInt(hashAllowance || 0n)) < expectedHash;
  const needsMemeApprove = mode === 'sell' && amountBigInt !== null && (BigInt(memeAllowance || 0n)) < amountBigInt;
  
  const curveProgress = info ? Number(BigInt(info[2]) * 10000n / CURVE_SUPPLY) / 100 : 0;
  const isCurveCompleted = info?.[1] || false;
  const isMigrated = info?.[0] || false;
  const canMigrate = isCurveCompleted && !isMigrated;
  
  const canSubmitTrade = !!account && !isCurveCompleted && !isMigrated && (mode === 'buy' ? (amountBigInt !== null && amountBigInt > 0n && amountBigInt <= remainingCurveSupply) : (amountBigInt !== null && amountBigInt > 0n && amountBigInt <= (tokenBalance || 0n) && amountBigInt <= soldOnCurve));

  const handleConfirmed = () => {
    refetchPending();
    refetchHashAllowance();
    refetchMemeAllowance();
    onTradeConfirmed?.(address);
    
    // Trigger flash effect for attracting attention
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 3000);
  };

  return (
    <Stack gap="lg">
        <Group grow>
            <Button variant={mode === 'buy' ? "filled" : "light"} color="green" onClick={() => setMode('buy')} disabled={isCurveCompleted}>Buy</Button>
            <Button variant={mode === 'sell' ? "filled" : "light"} color="red" onClick={() => setMode('sell')} disabled={isCurveCompleted}>Sell</Button>
        </Group>

        <Box p="md" style={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: 'rgba(0,0,0,0.2)', opacity: isCurveCompleted ? 0.6 : 1 }}>
            <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">{isCurveCompleted ? 'Curve Completed' : (mode === 'buy' ? 'I want to buy' : 'I want to sell')}</Text>
                <Text size="sm" c="dimmed">Balance: {tokenBalance ? formatAmount(formatEther(tokenBalance)) : '0.00'} {symbol}</Text>
            </Group>
            
            <TextInput size="lg" placeholder="0.0" value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)} disabled={isCurveCompleted} rightSection={<Text size="sm" pr="md" fw={700}>{symbol}</Text>} styles={{ input: { backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '24px' } }} />

            <Box mt="xl" px="xs">
                <Slider value={sliderVal} onChange={handleSliderChange} disabled={isCurveCompleted} color="blue" marks={[{ value: 0, label: '0%' }, { value: 25, label: '25%' }, { value: 50, label: '50%' }, { value: 75, label: '75%' }, { value: 100, label: '100%' }]} styles={{ markLabel: { color: '#666', fontSize: '10px' }, track: { backgroundColor: '#333' } }} />
            </Box>

            <Group justify="space-between" mt={40}>
                <Text size="sm" c="dimmed">{mode === 'buy' ? 'You pay' : 'You receive'}</Text>
                <Text fw={700} c="white">{formatAmount(formatEther(expectedHash))} HASH</Text>
            </Group>
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
                            await sendAndConfirmTransaction({ 
                                transaction: prepareApprove({ contract: hashcoinContract, spender: contractGemFun.address, amount: (expectedHash * 100n).toString() }), 
                                account 
                            });
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                        return prepareContractCall({ contract: contractGemFun, method: "function buy(address tokenAddr, uint256 memeOut, uint256 maxHashIn)", params: [address, amountBigInt!, (expectedHash * SLIPPAGE.BUY_BPS) / SLIPPAGE.BASE] });
                    } else {
                        if (needsMemeApprove) {
                            await sendAndConfirmTransaction({ 
                                transaction: prepareApprove({ contract: getContract({ client, chain, address }), spender: contractGemFun.address, amount: (amountBigInt! * 100n).toString() }), 
                                account 
                            });
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                        return prepareContractCall({ contract: contractGemFun, method: "function sell(address tokenAddr, uint256 memeIn, uint256 minHashOut)", params: [address, amountBigInt!, (expectedHash * SLIPPAGE.SELL_BPS) / SLIPPAGE.BASE] });
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
                                transaction={() => {
                                    console.log("Launching TGE for token:", address);
                                    return prepareContractCall({ 
                                        contract: contractGemFun, 
                                        method: "function migrate(address tokenAddr)", 
                                        params: [address] 
                                    });
                                }}
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
