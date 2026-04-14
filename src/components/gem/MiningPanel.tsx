import { Stack, Card, Group, Text, Progress, Title, SimpleGrid, Center, Loader, Pagination, Box } from '@mantine/core';
import { IconLock, IconPick, IconBolt } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNFTs, setApprovalForAll } from "thirdweb/extensions/erc1155";
import { MediaRenderer, useActiveAccount } from 'thirdweb/react';
import { formatEther } from 'viem';
import { prepareContractCall, sendAndConfirmTransaction } from 'thirdweb';
import { contractTools, contractGemFun } from '@/utils/contracts';
import { client } from "@/lib/thirdweb/client";
import { useAlchemyReadContract } from '@/hooks/useAlchemyRead';
import { AppTransactionButton } from '../AppTransactionButton';
import { formatAmount, type UserStake } from '@/hooks/useTokenLogic';
import { REFRESH_INTERVALS } from '@/utils/constants';
import { parseAbi } from 'viem';

const TOOLS_PER_PAGE = 20;
const erc1155Abi = parseAbi([
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
]);
const gemfunAbi = parseAbi([
  "function rates(uint256) view returns (uint256)",
]);

type ToolNft = Awaited<ReturnType<typeof getNFTs>>[number];

export function MiningPanel({ tokenAddress, pendingRewards, userStake, symbol, onActionConfirmed, isMigrated, curveProgress, miningReserve, isVisible }: any) {
  const { data: nfts, isLoading } = useQuery({ queryKey: ["allTools"], queryFn: () => getNFTs({ contract: contractTools }) });
  const [currentPage, setCurrentPage] = useState(1);
  const [visualPending, setVisualPending] = useState(0n);
  
  useEffect(() => {
    if (pendingRewards !== undefined) setVisualPending(pendingRewards);
    const interval = setInterval(() => {
        if (isVisible && userStake?.totalHashrate > 0n) {
            setVisualPending(prev => prev + (userStake.totalHashrate / 60n));
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingRewards, userStake?.totalHashrate, isVisible]);

  const totalPages = Math.max(1, Math.ceil((nfts?.length || 0) / TOOLS_PER_PAGE));
  const visibleTools = useMemo(() => {
    if (!nfts) return [];
    const startIndex = (currentPage - 1) * TOOLS_PER_PAGE;
    return nfts.slice(startIndex, startIndex + TOOLS_PER_PAGE);
  }, [currentPage, nfts]);

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
                transaction={() => prepareContractCall({ contract: contractGemFun, method: "function claim(address tokenAddr)", params: [tokenAddress] })}
                onTransactionConfirmed={onActionConfirmed}
            >
                Claim Rewards
            </AppTransactionButton>
        </Group>

        <Title order={5}>Staking Tools</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {visibleTools.map((nft) => (
                <GemMiningTool key={nft.id.toString()} nft={nft} tokenAddress={tokenAddress} symbol={symbol} userStake={userStake} onActionConfirmed={onActionConfirmed} isMigrated={isMigrated} isVisible={isVisible} />
            ))}
        </SimpleGrid>
        {(nfts?.length || 0) > TOOLS_PER_PAGE && (
            <Center>
                <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="blue" radius="xl" />
            </Center>
        )}
    </Stack>
  );
}

function GemMiningTool({ nft, tokenAddress, symbol, userStake, onActionConfirmed, isMigrated, isVisible }: { nft: ToolNft, tokenAddress: string, symbol: string, userStake: UserStake, onActionConfirmed: () => void, isMigrated: boolean, isVisible: boolean }) {
    const account = useActiveAccount();
    const stakedAmtBigInt = userStake?.amounts ? userStake.amounts[Number(nft.id)] : 0n;
    const stakedAmount = Number(stakedAmtBigInt);

    const { data: ownedBalance, refetch: refetchOwned } = useAlchemyReadContract<typeof erc1155Abi, "balanceOf", [`0x${string}`, bigint], bigint>({
        queryKey: ['gem-mining-tool', 'owned-balance', account?.address, nft.id.toString()],
        address: contractTools.address as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'balanceOf',
        args: account?.address ? [account.address as `0x${string}`, BigInt(nft.id)] : undefined,
        enabled: !!account?.address && isVisible,
        staleTime: 5_000,
        refetchInterval: isVisible ? REFRESH_INTERVALS.DETAIL : 0,
    });

    const { data: isApproved } = useAlchemyReadContract<typeof erc1155Abi, "isApprovedForAll", [`0x${string}`, `0x${string}`], boolean>({
        queryKey: ['gem-mining-tool', 'is-approved', account?.address],
        address: contractTools.address as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'isApprovedForAll',
        args: account?.address ? [account.address as `0x${string}`, contractGemFun.address as `0x${string}`] : undefined,
        enabled: !!account?.address && isVisible,
        staleTime: 5_000,
        refetchInterval: isVisible ? REFRESH_INTERVALS.DETAIL : 0,
    });

    const { data: rates } = useAlchemyReadContract<typeof gemfunAbi, "rates", [bigint], bigint>({
        queryKey: ['gem-mining-tool', 'rate', nft.id.toString()],
        address: contractGemFun.address as `0x${string}`,
        abi: gemfunAbi,
        functionName: 'rates',
        args: [BigInt(nft.id)],
        staleTime: Infinity,
    });

    const speedPerHour = rates ? (Number(formatEther(rates as bigint)) * 60).toFixed(2) : '0.00';
    const canStake = isMigrated && BigInt(ownedBalance || 0n) > 0n;
    const canWithdraw = stakedAmount > 0;

    const handleConfirmed = () => {
        refetchOwned();
        onActionConfirmed();
    };

    return (
        <Card withBorder padding="sm" style={{ 
            backgroundColor: 'rgba(255,255,255,0.02)', 
            borderColor: stakedAmount > 0 ? 'rgba(0, 123, 255, 0.4)' : 'rgba(255,255,255,0.1)',
            opacity: isMigrated ? 1 : 0.7
        }}>
            <Group wrap="nowrap" mb="xs">
                <Box w={40} h={40}>
                    <MediaRenderer client={client} src={nft.metadata.image} style={{ width: '100%', height: '100%', borderRadius: '4px' }} />
                </Box>
                <Stack gap={0} flex={1}>
                    <Text size="sm" fw={700} c="white" truncate>{nft.metadata.name}</Text>
                    <Group gap="xs">
                        <Text size="xs" c="dimmed">Owned: {ownedBalance?.toString() || '0'}</Text>
                        <Text size="xs" c="blue" fw={700}>Staked: {stakedAmount}</Text>
                    </Group>
                    <Group gap={2}>
                        <IconBolt size={12} color="cyan" />
                        <Text size="xs" c="cyan" fw={500}>{speedPerHour}/{symbol}/h</Text>
                    </Group>
                </Stack>
            </Group>
            
            <Group gap="xs" grow wrap="nowrap">
                <AppTransactionButton
                    size="xs"
                    style={{ background: canStake ? 'linear-gradient(45deg, #007bff, #00d2ff)' : 'rgba(255, 255, 255, 0.05)', color: 'white', border: 'none', fontWeight: 600, fontSize: '12px', cursor: canStake ? 'pointer' : 'not-allowed', opacity: canStake ? 1 : 0.3 }}
                    transaction={async () => {
                        if (!account) throw new Error("Connect wallet");
                        if (!isApproved) {
                            const tx = setApprovalForAll({ contract: contractTools, operator: contractGemFun.address, approved: true });
                            await sendAndConfirmTransaction({ transaction: tx, account });
                        }
                        return prepareContractCall({ contract: contractGemFun, method: "function stake(address tokenAddr, uint256 id, uint256 amount)", params: [tokenAddress, BigInt(nft.id), 1n] });
                    }}
                    onTransactionConfirmed={handleConfirmed}
                    disabled={!canStake}
                >
                    Stake
                </AppTransactionButton>
                <AppTransactionButton
                    size="xs"
                    style={{ background: canWithdraw ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600, fontSize: '12px', cursor: canWithdraw ? 'pointer' : 'not-allowed', opacity: canWithdraw ? 1 : 0.3 }}
                    transaction={() => prepareContractCall({ contract: contractGemFun, method: "function withdraw(address tokenAddr, uint256 id, uint256 amount)", params: [tokenAddress, BigInt(nft.id), 1n] })}
                    onTransactionConfirmed={handleConfirmed}
                    disabled={!canWithdraw}
                >
                    Withdraw
                </AppTransactionButton>
            </Group>
        </Card>
    );
}
