import { Stack, Card, Group, Text, Progress, Title, SimpleGrid, Center, Pagination, Box, Button, NumberInput } from '@mantine/core';
import { IconLock, IconPick, IconBolt } from '@tabler/icons-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { formatEther } from 'viem';
import { contractGemFun, ERC1155_ABI } from '@/utils/contracts';
import { writeAndWait } from '@/lib/wagmi/tx';
import { AppTransactionButton } from '../AppTransactionButton';
import { formatAmount, type UserStake } from '@/hooks/useTokenLogic';
import { TOOL_METADATA, CONTRACT_ADDRESSES } from '@/utils/constants';

const TOOLS_PER_PAGE = 20;

export function MiningPanel({ tokenAddress, pendingRewards, userStake, symbol, toolBalances, onActionConfirmed, onStakeConfirmed, onWithdrawConfirmed, onClaimMiningConfirmed, isMigrated, curveProgress, miningReserve, isVisible }: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const [stakeQty, setStakeQty] = useState(1);

  const anchorRef = useRef<{ pending: bigint; ts: number }>({ pending: 0n, ts: Date.now() });
  const [, setTick] = useState(0);

  const handleActionConfirmed = useCallback(() => {
    onActionConfirmed?.();
    setTimeout(() => onActionConfirmed?.(), 2000);
  }, [onActionConfirmed]);

  useEffect(() => {
    anchorRef.current = { pending: pendingRewards ?? 0n, ts: Date.now() };
    setTick((t) => t + 1);
  }, [pendingRewards]);

  useEffect(() => {
    if (!isVisible) return;
    setTick((t) => t + 1);
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const rate = (userStake?.totalHashrate as bigint) ?? 0n;
  const elapsedSec = BigInt(Math.max(0, Math.floor((Date.now() - anchorRef.current.ts) / 1000)));
  const visualPending = anchorRef.current.pending + (rate > 0n ? (elapsedSec * rate) / 60n : 0n);

  const totalPages = Math.max(1, Math.ceil(TOOL_METADATA.length / TOOLS_PER_PAGE));
  const visibleTools = useMemo(() => {
    const startIndex = (currentPage - 1) * TOOLS_PER_PAGE;
    return TOOL_METADATA.slice(startIndex, startIndex + TOOLS_PER_PAGE);
  }, [currentPage]);

  return (
    <Stack>
        {!isMigrated && (
            <Card withBorder style={{ backgroundColor: 'rgba(255, 165, 0, 0.05)', borderColor: 'orange' }}>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Group gap="xs">
                            <IconLock size={18} color="orange" />
                            <Text size="sm" fw={700} c="orange">Mining Locked</Text>
                        </Group>
                        <Text size="xs" fw={700} c="orange">{curveProgress.toFixed(1)}% / 100%</Text>
                    </Group>
                    <Progress value={curveProgress} color="orange" size="sm" radius="xl" />
                    <Text size="10px" c="dimmed">Mining becomes available automatically after the token migrates to Uniswap V3.</Text>
                </Stack>
            </Card>
        )}

        <Group justify="space-between" p="md" style={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: 'rgba(0,123,255,0.05)', opacity: isMigrated ? 1 : 0.5 }}>
            <Group>
                <IconPick size={24} color={(visualPending > 0n && isMigrated) ? "blue" : "gray"} />
                <div>
                    <Text size="xs" c="dimmed">Pending Rewards ({symbol})</Text>
                    <Group gap={4} align="baseline">
                        <Text size="xl" fw={700} c="blue">{formatAmount(formatEther(visualPending))}</Text>
                        <Text size="sm" fw={500} c="dimmed">/ {Math.floor(Number(formatEther(miningReserve))).toLocaleString()}</Text>
                    </Group>
                </div>
            </Group>
            <AppTransactionButton
                disabled={!isMigrated || visualPending === 0n}
                style={{ background: 'linear-gradient(45deg, #007bff, #00d2ff)', color: 'white', border: 'none', fontWeight: 700, opacity: (!isMigrated || visualPending === 0n) ? 0.5 : 1 }}
                transaction={() => ({ address: contractGemFun.address, abi: contractGemFun.abi, functionName: "claim", args: [tokenAddress] })}
                onTransactionConfirmed={() => {
                    anchorRef.current = { pending: 0n, ts: Date.now() };
                    setTick((t) => t + 1);
                    if (onClaimMiningConfirmed) onClaimMiningConfirmed();
                    else handleActionConfirmed();
                }}
            >
                Claim Rewards
            </AppTransactionButton>
        </Group>

        <Group justify="space-between" align="center">
            <Title order={5}>Staking Tools</Title>
            <Group gap="xs" align="center">
                <Button size="compact-xs" variant="default" onClick={() => setStakeQty(q => Math.max(1, q - 1))}>-</Button>
                <NumberInput
                    value={stakeQty}
                    onChange={(v) => setStakeQty(typeof v === 'number' ? Math.max(1, v) : 1)}
                    min={1}
                    max={99}
                    w={60}
                    size="xs"
                    hideControls
                    styles={{ input: { textAlign: 'center', height: 28, minHeight: 28 } }}
                />
                <Button size="compact-xs" variant="default" onClick={() => setStakeQty(q => Math.min(99, q + 1))}>+</Button>
            </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {visibleTools.map((tool) => (
                <GemMiningTool
                    key={tool.id}
                    nft={tool}
                    tokenAddress={tokenAddress}
                    symbol={symbol}
                    userStake={userStake}
                    onActionConfirmed={handleActionConfirmed}
                    onStakeConfirmed={onStakeConfirmed}
                    onWithdrawConfirmed={onWithdrawConfirmed}
                    isMigrated={isMigrated}
                    toolBalances={toolBalances}
                    stakeQty={stakeQty}
                />
            ))}
        </SimpleGrid>
        {TOOL_METADATA.length > TOOLS_PER_PAGE && (
            <Center>
                <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="blue" radius="xl" />
            </Center>
        )}
    </Stack>
  );
}

interface GemMiningToolProps {
    nft: typeof TOOL_METADATA[number];
    tokenAddress: string;
    symbol: string;
    userStake: UserStake;
    onActionConfirmed: () => void;
    onStakeConfirmed?: (toolId: string, qty: bigint) => void;
    onWithdrawConfirmed?: (toolId: string, qty: bigint) => void;
    isMigrated: boolean;
    toolBalances: bigint[];
    stakeQty: number;
}

function GemMiningTool({ nft, tokenAddress, symbol, userStake, onActionConfirmed, onStakeConfirmed, onWithdrawConfirmed, isMigrated, toolBalances, stakeQty }: GemMiningToolProps) {
    const account = useAccount();
    const stakedAmtBigInt = userStake?.amounts ? userStake.amounts[Number(nft.id)] : 0n;
    const stakedAmount = Number(stakedAmtBigInt);
    const ownedBalance = toolBalances[Number(nft.id)] ?? 0n;

    const stakeQtyBigInt = BigInt(Math.min(stakeQty, Number(ownedBalance)));
    const withdrawQtyBigInt = BigInt(Math.min(stakeQty, stakedAmount));

    const canStake = isMigrated && ownedBalance > 0n;
    const canWithdraw = stakedAmount > 0;

    return (
        <Card withBorder padding="sm" style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderColor: stakedAmount > 0 ? 'rgba(0, 123, 255, 0.4)' : 'rgba(255,255,255,0.1)',
            opacity: isMigrated ? 1 : 0.7
        }}>
            <Group wrap="nowrap" mb="xs">
                <Box w={40} h={40}>
                    <img src={nft.image} style={{ width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover' }} alt={nft.name} />
                </Box>
                <Stack gap={0} flex={1}>
                    <Text size="sm" fw={700} c="white" truncate>{nft.name}</Text>
                    <Group gap="xs">
                        <Text size="xs" c="dimmed">Owned: {ownedBalance.toString()}</Text>
                        <Text size="xs" c="blue" fw={700}>Staked: {stakedAmount}</Text>
                    </Group>
                    <Group gap={2}>
                        <IconBolt size={12} color="cyan" />
                        <Text size="xs" c="cyan" fw={500}>{(nft.hashPower * 100).toFixed(2)}/{symbol}/h</Text>
                    </Group>
                </Stack>
            </Group>

            <Group gap="xs" grow wrap="nowrap">
                <AppTransactionButton
                    size="xs"
                    style={{ background: canStake ? 'linear-gradient(45deg, #007bff, #00d2ff)' : 'rgba(255, 255, 255, 0.05)', color: 'white', border: 'none', fontWeight: 600, fontSize: '12px', cursor: canStake ? 'pointer' : 'not-allowed', opacity: canStake ? 1 : 0.3 }}
                    transaction={async () => {
                        if (!account) throw new Error("Connect wallet");
                        await writeAndWait({
                            address: CONTRACT_ADDRESSES.TOOLS as `0x${string}`,
                            abi: ERC1155_ABI,
                            functionName: "setApprovalForAll",
                            args: [contractGemFun.address, true],
                        });
                        return {
                            address: contractGemFun.address,
                            abi: contractGemFun.abi,
                            functionName: "stake",
                            args: [tokenAddress, BigInt(nft.id), stakeQtyBigInt],
                        };
                    }}
                    onTransactionConfirmed={() => {
                        onStakeConfirmed?.(String(nft.id), stakeQtyBigInt);
                        onActionConfirmed();
                    }}
                    disabled={!canStake}
                >
                    Stake {stakeQty > 1 ? `(${stakeQty})` : ''}
                </AppTransactionButton>
                <AppTransactionButton
                    size="xs"
                    style={{ background: canWithdraw ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600, fontSize: '12px', cursor: canWithdraw ? 'pointer' : 'not-allowed', opacity: canWithdraw ? 1 : 0.3 }}
                    transaction={() => ({ address: contractGemFun.address, abi: contractGemFun.abi, functionName: "withdraw", args: [tokenAddress, BigInt(nft.id), withdrawQtyBigInt] })}
                    onTransactionConfirmed={() => {
                        onWithdrawConfirmed?.(String(nft.id), withdrawQtyBigInt);
                        onActionConfirmed();
                    }}
                    disabled={!canWithdraw}
                >
                    Withdraw {stakeQty > 1 ? `(${Math.min(stakeQty, stakedAmount)})` : ''}
                </AppTransactionButton>
            </Group>
        </Card>
    );
}
