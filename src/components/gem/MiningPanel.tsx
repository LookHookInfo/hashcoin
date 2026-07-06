import { Stack, Card, Group, Text, Progress, Title, SimpleGrid, Center, Loader, Pagination, Box } from '@mantine/core';
import { IconLock, IconPick, IconBolt } from '@tabler/icons-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { formatEther } from 'viem';
import { contractGemFun } from '@/utils/contracts';
import { AppTransactionButton } from '../AppTransactionButton';
import { formatAmount, type UserStake } from '@/hooks/useTokenLogic';
import { useContractRead } from '@/hooks/useContractRead';
import { memeClient } from '@/hooks/useAggregatorClient';
import { erc20Abi } from 'viem';
import { TOOL_METADATA, CONTRACT_ADDRESSES } from '@/utils/constants';

const TOOLS_PER_PAGE = 20;

export function MiningPanel({ tokenAddress, pendingRewards, userStake, symbol, onActionConfirmed, onStakeConfirmed, onWithdrawConfirmed, onClaimMiningConfirmed, isMigrated, curveProgress, miningReserve, isVisible }: any) {
  const account = useAccount();
  const { data: toolBalances, isLoading, refetch: refetchPanel } = useMiningToolBalances(account?.address, isVisible !== false);
  const [currentPage, setCurrentPage] = useState(1);

  const anchorRef = useRef<{ pending: bigint; ts: number }>({ pending: 0n, ts: Date.now() });
  const [, setTick] = useState(0);

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

  if (isLoading) return <Center py="xl"><Loader color="blue" /></Center>;

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
                    else onActionConfirmed();
                }}
            >
                Claim Rewards
            </AppTransactionButton>
        </Group>

        <Title order={5}>Staking Tools</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {visibleTools.map((tool) => (
                <GemMiningTool
                    key={tool.id}
                    nft={tool}
                    tokenAddress={tokenAddress}
                    symbol={symbol}
                    userStake={userStake}
                    onActionConfirmed={() => { refetchPanel(); onActionConfirmed(); }}
                    onStakeConfirmed={onStakeConfirmed}
                    onWithdrawConfirmed={onWithdrawConfirmed}
                    isMigrated={isMigrated}
                    panelData={toolBalances}
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

function useMiningToolBalances(user?: string, enabled = true) {
    return useContractRead<{ isApproved: boolean; balances: { id: string; balance: string }[] }>({
        fetchFn: async () => {
            if (!user) return { isApproved: false, balances: [] };
            const calls = TOOL_METADATA.map((t) => ({
                address: CONTRACT_ADDRESSES.TOOLS as `0x${string}`,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [user as `0x${string}`, BigInt(t.id)],
            }));
            const results = await memeClient.multicall({ contracts: calls as any });
            return {
                isApproved: false,
                balances: TOOL_METADATA.map((t, i) => ({
                    id: String(t.id),
                    balance: String(BigInt((results[i]?.result as bigint) ?? 0n)),
                })),
            };
        },
        deps: [user],
        enabled: !!user && enabled,
        intervalMs: 15_000,
    });
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
    panelData: { isApproved: boolean; balances: { id: string; balance: string }[] } | undefined;
}

function GemMiningTool({ nft, tokenAddress, symbol, userStake, onActionConfirmed, onStakeConfirmed, onWithdrawConfirmed, isMigrated, panelData }: GemMiningToolProps) {
    const account = useAccount();
    const stakedAmtBigInt = userStake?.amounts ? userStake.amounts[Number(nft.id)] : 0n;
    const stakedAmount = Number(stakedAmtBigInt);

    const ownedBalanceStr = panelData?.balances.find((b) => b.id === String(nft.id))?.balance ?? '0';
    const ownedBalance = BigInt(ownedBalanceStr);

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
                        return {
                            address: contractGemFun.address,
                            abi: contractGemFun.abi,
                            functionName: "stake",
                            args: [tokenAddress, BigInt(nft.id), 1n],
                        };
                    }}
                    onTransactionConfirmed={() => {
                        if (onStakeConfirmed) onStakeConfirmed(String(nft.id), 1n);
                        else onActionConfirmed();
                    }}
                    disabled={!canStake}
                >
                    Stake
                </AppTransactionButton>
                <AppTransactionButton
                    size="xs"
                    style={{ background: canWithdraw ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600, fontSize: '12px', cursor: canWithdraw ? 'pointer' : 'not-allowed', opacity: canWithdraw ? 1 : 0.3 }}
                    transaction={() => ({ address: contractGemFun.address, abi: contractGemFun.abi, functionName: "withdraw", args: [tokenAddress, BigInt(nft.id), 1n] })}
                    onTransactionConfirmed={() => {
                        if (onWithdrawConfirmed) onWithdrawConfirmed(String(nft.id), 1n);
                        else onActionConfirmed();
                    }}
                    disabled={!canWithdraw}
                >
                    Withdraw
                </AppTransactionButton>
            </Group>
        </Card>
    );
}
