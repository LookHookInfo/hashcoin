import { Modal, Tabs, Stack, Group, Text, Title, TextInput, Button, Badge, SimpleGrid, Box, ActionIcon, Progress, Image, Loader, Card, Center, Slider, Tooltip, Pagination } from '@mantine/core';
import { IconChartLine, IconPick, IconArrowLeft, IconRocket, IconCopy, IconCheck, IconBrandX, IconWorld, IconBrandTelegram, IconBrandDiscord, IconFileText, IconBolt, IconUser, IconEdit, IconLock } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { useTokenLogic, formatAmount, getIpfsUrl, type UserStake, CURVE_SUPPLY, MINING_RESERVE } from '@/hooks/useTokenLogic';
import { formatEther, parseAbi, parseEther } from 'viem';
import { AppTransactionButton } from './AppTransactionButton';
import { contractGemFun, hashcoinContract, contractTools } from '@/utils/contracts';
import { prepareContractCall, sendAndConfirmTransaction, getContract } from 'thirdweb';
import { approve as prepareApprove } from "thirdweb/extensions/erc20";
import { setApprovalForAll, getNFTs } from "thirdweb/extensions/erc1155";
import { useActiveAccount, MediaRenderer } from 'thirdweb/react';
import { useQuery } from '@tanstack/react-query';
import { useClipboard, useDisclosure } from '@mantine/hooks';
import { client } from "@/lib/thirdweb/client";
import { chain } from "@/lib/thirdweb/chain";
import { useDisplayName } from '@/hooks/useNameContract';
import { WhitepaperModal } from './WhitepaperModal';
import { useAlchemyReadContract } from '@/hooks/useAlchemyRead';

interface Props {
  address: string;
  onClose: () => void;
  onTradeConfirmed?: (address: string) => void;
}

const BUY_SLIPPAGE_BPS = 11_000n;
const SELL_SLIPPAGE_BPS = 9_000n;
const BPS_BASE = 10_000n;
const DETAIL_REFRESH_INTERVAL_MS = 30_000;
const TOOLS_PER_PAGE = 20;
const erc20Abi = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
]);
const erc1155Abi = parseAbi([
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
]);
const gemfunAbi = parseAbi([
  "function rates(uint256) view returns (uint256)",
]);
type DetailLinks = {
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
};
type ToolNft = Awaited<ReturnType<typeof getNFTs>>[number];

const calculateReserveFor = (sold: bigint) => {
  return sold / 1000n + (sold * sold) / (45_000_000_000n * 10n ** 18n);
};

const safeParseAmount = (value: string) => {
  if (!value) return 0n;
  if (!/^\d*\.?\d*$/.test(value)) return null;
  try {
    return parseEther(value);
  } catch {
    return null;
  }
};

export function GemTokenDetails({ address, onClose, onTradeConfirmed }: Props) {
  const { account, tokenBalance, name, symbol, info, metadata, pendingRewards, userStake, isLoading, tokenCreator, isCreator, refetchPending } = useTokenLogic(address);
  const { displayName: creatorName } = useDisplayName(tokenCreator);
  const [activeTab, setActiveTab] = useState<string | null>('trade');
  const clipboard = useClipboard({ timeout: 2000 });
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [wpOpened, { open: openWP, close: closeWP }] = useDisclosure(false);

  // Trade state
  const [tradeAmount, setTradeAmount] = useState('0');
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [sliderVal, setSliderVal] = useState(0);

  const handleSliderChange = (percent: number) => {
    setSliderVal(percent);
    let amountWei = 0n;
    if (mode === 'sell') {
        if (tokenBalance) {
            amountWei = (tokenBalance * BigInt(percent)) / 100n;
        }
    } else {
        const remaining = info ? CURVE_SUPPLY - info[2] : 0n;
        amountWei = remaining > 0n ? (remaining * BigInt(percent)) / 100n : 0n;
    }
    setTradeAmount(formatEther(amountWei));
  };

  useEffect(() => {
    setSliderVal(0);
    setTradeAmount("0");
  }, [mode]);

  const { data: hashAllowance, refetch: refetchHashAllowance } = useAlchemyReadContract<typeof erc20Abi, "allowance", [`0x${string}`, `0x${string}`], bigint>({
    queryKey: ['gem-token', 'hash-allowance', account?.address],
    address: hashcoinContract.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: account?.address
      ? [account.address as `0x${string}`, contractGemFun.address as `0x${string}`]
      : undefined,
    enabled: !!account?.address,
    staleTime: 5_000,
    refetchInterval: DETAIL_REFRESH_INTERVAL_MS,
  });

  const { data: memeAllowance, refetch: refetchMemeAllowance } = useAlchemyReadContract<typeof erc20Abi, "allowance", [`0x${string}`, `0x${string}`], bigint>({
    queryKey: ['gem-token', 'meme-allowance', address, account?.address],
    address: address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: account?.address
      ? [account.address as `0x${string}`, contractGemFun.address as `0x${string}`]
      : undefined,
    enabled: !!account?.address && !!address,
    staleTime: 5_000,
    refetchInterval: DETAIL_REFRESH_INTERVAL_MS,
  });

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
  
  // ЮНИФИЦИРОВАННЫЙ РАСЧЕТ ПРОГРЕССА
  const curveProgress = info ? Number(BigInt(info[2]) * 10000n / CURVE_SUPPLY) / 100 : 0;
  const isCurveCompleted = curveProgress >= 99.99 || (info?.[1] || false);
  const isMigrated = info?.[0] || false;
  const canMigrate = isCurveCompleted && !isMigrated;
  const hasValidAmount = amountBigInt !== null && amountBigInt > 0n;
  const canBuy = hasValidAmount && expectedHash > 0n && amountBigInt! <= remainingCurveSupply;
  const canSell = hasValidAmount && expectedHash > 0n && amountBigInt! <= (tokenBalance || 0n) && amountBigInt! <= soldOnCurve;
  const canSubmitTrade = !!account && !isCurveCompleted && (mode === 'buy' ? canBuy : canSell);
  
  const handleTradeConfirmed = () => {
    refetchPending();
    refetchHashAllowance();
    refetchMemeAllowance();
    onTradeConfirmed?.(address);
  };

  const logoUrl = getIpfsUrl(metadata[0] || "");
  const description = metadata[1] || "No description provided.";
  const links: DetailLinks = {
    website: metadata[2] || "",
    twitter: metadata[3] || "",
    telegram: metadata[4] || "",
    discord: metadata[5] || ""
  };

  if (isLoading && !name) {
    return (
        <Box py="xl">
            <Center><Loader color="blue" /></Center>
        </Box>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" onClick={onClose} color="gray">
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Text fw={700} size="xl" c="white" truncate maw={250}>{name}</Text>
        </Group>
        
        <Tooltip label={clipboard.copied ? "Copied!" : "Copy Address"} withArrow>
            <Button 
                variant="light" 
                color="blue" 
                size="xs" 
                leftSection={clipboard.copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                onClick={() => clipboard.copy(address)}
            >
                {address.slice(0, 6)}...{address.slice(-4)}
            </Button>
        </Tooltip>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color="blue" variant="pills">
        <Tabs.List grow>
          <Tabs.Tab value="trade" leftSection={<IconChartLine size={16} />}>Trade</Tabs.Tab>
          <Tabs.Tab value="mining" leftSection={<IconPick size={16} />}>Mining</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="trade" pt="md">
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
                
                <TextInput 
                    size="lg" 
                    placeholder="0.0" 
                    value={tradeAmount} 
                    onChange={(e) => setTradeAmount(e.target.value)}
                    disabled={isCurveCompleted}
                    rightSection={<Text size="sm" pr="md" fw={700}>{symbol}</Text>}
                    styles={{ input: { backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '24px' } }}
                />

                <Box mt="xl" px="xs">
                    <Slider 
                        value={sliderVal} 
                        onChange={handleSliderChange}
                        disabled={isCurveCompleted}
                        color="blue"
                        marks={[
                            { value: 0, label: '0%' },
                            { value: 25, label: '25%' },
                            { value: 50, label: '50%' },
                            { value: 75, label: '75%' },
                            { value: 100, label: '100%' },
                        ]}
                        styles={{ 
                            markLabel: { color: '#666', fontSize: '10px' },
                            track: { backgroundColor: '#333' }
                        }}
                    />
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
                    style={{
                        background: mode === 'buy' ? 'linear-gradient(45deg, #40c057, #82c91e)' : 'linear-gradient(45deg, #fa5252, #ff8787)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 700,
                        opacity: canSubmitTrade ? 1 : 0.5,
                        cursor: canSubmitTrade ? 'pointer' : 'not-allowed',
                    }}
                    onTransactionConfirmed={handleTradeConfirmed}
                    transaction={async () => {
                        if (!canSubmitTrade || amountBigInt === null || amountBigInt <= 0n) {
                            throw new Error("Invalid amount");
                        }
                        if (!account) throw new Error("Connect wallet");
                        
                        if (mode === 'buy') {
                            if (needsHashApprove) {
                                const tx = prepareApprove({
                                    contract: hashcoinContract,
                                    spender: contractGemFun.address,
                                    amount: (expectedHash * 2n).toString()
                                });
                                await sendAndConfirmTransaction({ transaction: tx, account });
                            }
                            const maxHashIn = (expectedHash * BUY_SLIPPAGE_BPS) / BPS_BASE;
                            return prepareContractCall({
                                contract: contractGemFun,
                                method: "function buy(address tokenAddr, uint256 memeOut, uint256 maxHashIn)",
                                params: [address, amountBigInt, maxHashIn]
                            });
                        } else {
                            if (needsMemeApprove) {
                                const memeTokenContract = getContract({
                                    client, chain, address: address
                                });
                                const tx = prepareApprove({
                                    contract: memeTokenContract,
                                    spender: contractGemFun.address,
                                    amount: (amountBigInt * 2n).toString()
                                });
                                await sendAndConfirmTransaction({ transaction: tx, account });
                            }
                            const minHashOut = (expectedHash * SELL_SLIPPAGE_BPS) / BPS_BASE;
                            return prepareContractCall({
                                contract: contractGemFun,
                                method: "function sell(address tokenAddr, uint256 memeIn, uint256 minHashOut)",
                                params: [address, amountBigInt, minHashOut]
                            });
                        }
                    }}
                >
                    {mode === 'buy' ? (needsHashApprove ? "Approve & Buy" : "Buy") : (needsMemeApprove ? "Approve & Sell" : "Sell")}
                </AppTransactionButton>
            ) : (
                <Badge size="xl" variant="light" color="blue" py="lg">
                    Bonding Curve is 100% complete!
                </Badge>
            )}
            
            <Box mt="md">
                <Text size="xs" c="dimmed" mb={5}>Bonding Curve Progress</Text>
                <Group gap="md" wrap="nowrap">
                    <Box flex={1}>
                        <Progress value={curveProgress} color="blue" size="xl" radius="xl" />
                    </Box>
                    
                    {!isMigrated && (
                        <AppTransactionButton
                            size="md"
                            disabled={!canMigrate}
                            style={{ 
                                background: canMigrate 
                                    ? 'linear-gradient(45deg, #007bff, #00d2ff)' 
                                    : 'rgba(255, 255, 255, 0.05)',
                                color: canMigrate ? 'white' : '#666',
                                border: canMigrate ? 'none' : '1px solid #333',
                                fontWeight: 700,
                                boxShadow: canMigrate ? '0 0 20px rgba(0, 123, 255, 0.6)' : 'none',
                                animation: canMigrate ? 'pulse 2s infinite' : 'none',
                                cursor: canMigrate ? 'pointer' : 'not-allowed'
                            }}
                            leftSection={<IconRocket size={18} color={canMigrate ? 'white' : '#666'} />}
                            onTransactionConfirmed={refetchPending}
                            transaction={() => prepareContractCall({
                                contract: contractGemFun,
                                method: "function migrate(address tokenAddr)",
                                params: [address]
                            })}
                        >
                            Migrate
                        </AppTransactionButton>
                    )}
                    {isMigrated && (
                        <Button size="md" disabled variant="outline" color="blue" leftSection={<IconRocket size={18} />}>
                            Migrated
                        </Button>
                    )}
                </Group>
                <Text size="xs" fw={700} c="blue" ta="right" mt={5}>{curveProgress.toFixed(1)}%</Text>
            </Box>

            <Box mt="xl">
                <Group justify="space-between" mb="xs">
                    <Title order={5}>About {name}</Title>
                    {isCreator && (
                        <Button variant="subtle" size="xs" leftSection={<IconEdit size={14} />} onClick={openEdit}>
                            Update Info
                        </Button>
                    )}
                </Group>
                
                <Card withBorder style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: '#333' }}>
                    <Group wrap="nowrap" align="flex-start" gap="md">
                        {logoUrl && <Image src={logoUrl} w={80} h={80} radius="md" fallbackSrc={`https://placehold.co/80x80/202020/white?text=${name?.substring(0,1) || '?'}`} />}
                        <Stack gap="xs" flex={1}>
                            <Group gap={6} mb={8} align="center">
                                <IconUser size={14} color="#666" />
                                <Text size="xs" c="dimmed">
                                    Founder:{' '}
                                    <Text span c="blue.4" fw={600}>{creatorName}</Text>
                                </Text>
                                <Tooltip label="Copy founder address" withArrow>
                                    <ActionIcon variant="subtle" size="xs" color="gray" onClick={() => clipboard.copy(tokenCreator)}>
                                        <IconCopy size={12} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                            
                            <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                                {description}
                            </Text>
                            
                            <Group gap="xs" align="center">
                                {links.website && (
                                    <Tooltip label="Website" withArrow>
                                        <ActionIcon component="a" href={getIpfsUrl(links.website)} target="_blank" variant="subtle" color="gray">
                                            <IconWorld size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                                {links.twitter && (
                                    <Tooltip label="Twitter" withArrow>
                                        <ActionIcon component="a" href={links.twitter} target="_blank" variant="subtle" color="gray">
                                            <IconBrandX size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                                {links.telegram && (
                                    <Tooltip label="Telegram" withArrow>
                                        <ActionIcon component="a" href={links.telegram} target="_blank" variant="subtle" color="gray">
                                            <IconBrandTelegram size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                                {links.discord && (
                                    <Tooltip label="Discord" withArrow>
                                        <ActionIcon component="a" href={links.discord} target="_blank" variant="subtle" color="gray">
                                            <IconBrandDiscord size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                                <Tooltip label="Whitepaper" withArrow>
                                    <ActionIcon variant="subtle" color="blue" onClick={openWP}>
                                        <IconFileText size={18} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Stack>
                    </Group>
                </Card>
            </Box>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="mining" pt="md">
          <MiningPanel 
            tokenAddress={address} 
            pendingRewards={pendingRewards} 
            userStake={userStake} 
            symbol={symbol} 
            onActionConfirmed={refetchPending} 
            isMigrated={isMigrated}
            curveProgress={curveProgress}
            miningReserve={info?.[4] || 0n}
            isVisible={activeTab === 'mining'}
          />
        </Tabs.Panel>
      </Tabs>

      <UpdateMetadataModal opened={editOpened} onClose={closeEdit} tokenAddress={address} initialLinks={links} onUpdated={refetchPending} />
      <WhitepaperModal opened={wpOpened} onClose={closeWP} tokenName={name} tokenSymbol={symbol} />
    </Stack>
  );
}

function UpdateMetadataModal({ opened, onClose, tokenAddress, initialLinks, onUpdated }: { opened: boolean, onClose: () => void, tokenAddress: string, initialLinks: DetailLinks, onUpdated: () => void }) {
    const [meta, setMeta] = useState({
        website: initialLinks.website,
        twitter: initialLinks.twitter,
        telegram: initialLinks.telegram,
        guild: initialLinks.discord
    });

    return (
        <Modal opened={opened} onClose={onClose} title="Update Token Links" centered size="md" styles={{ content: { backgroundColor: '#1a1b1e', color: 'white' }, header: { backgroundColor: '#1a1b1e', color: 'white' } }}>
            <Stack>
                <Text size="xs" c="dimmed">Logo and description are fixed at launch.</Text>
                <TextInput label="Website" value={meta.website} onChange={(e) => setMeta({...meta, website: e.target.value})} placeholder="https://..." />
                <TextInput label="Twitter" value={meta.twitter} onChange={(e) => setMeta({...meta, twitter: e.target.value})} placeholder="https://x.com/..." />
                <TextInput label="Telegram" value={meta.telegram} onChange={(e) => setMeta({...meta, telegram: e.target.value})} placeholder="https://t.me/..." />
                <TextInput label="Discord/Guild" value={meta.guild} onChange={(e) => setMeta({...meta, guild: e.target.value})} placeholder="https://discord.gg/..." />
                <AppTransactionButton
                    style={{ background: 'linear-gradient(45deg, #007bff, #00d2ff)', color: 'white', border: 'none', fontWeight: 700, marginTop: '10px' }}
                    transaction={() => prepareContractCall({
                        contract: contractGemFun,
                        method: "function setTokenMetadata(address token, (string website, string twitter, string telegram, string guild) meta)",
                        params: [tokenAddress, {
                            website: meta.website,
                            twitter: meta.twitter,
                            telegram: meta.telegram,
                            guild: meta.guild
                        }]
                    })}
                    onTransactionConfirmed={() => { onUpdated(); onClose(); }}
                >
                    Save Changes
                </AppTransactionButton>
            </Stack>
        </Modal>
    );
}

function MiningPanel({ tokenAddress, pendingRewards, userStake, symbol, onActionConfirmed, isMigrated, curveProgress, miningReserve, isVisible }: { tokenAddress: string, pendingRewards: bigint | undefined, userStake: UserStake, symbol: string, onActionConfirmed: () => void, isMigrated: boolean, curveProgress: number, miningReserve: bigint, isVisible: boolean }) {
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
        refetchInterval: isVisible ? DETAIL_REFRESH_INTERVAL_MS : 0,
    });

    const { data: isApproved } = useAlchemyReadContract<typeof erc1155Abi, "isApprovedForAll", [`0x${string}`, `0x${string}`], boolean>({
        queryKey: ['gem-mining-tool', 'is-approved', account?.address],
        address: contractTools.address as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'isApprovedForAll',
        args: account?.address ? [account.address as `0x${string}`, contractGemFun.address as `0x${string}`] : undefined,
        enabled: !!account?.address && isVisible,
        staleTime: 5_000,
        refetchInterval: isVisible ? DETAIL_REFRESH_INTERVAL_MS : 0,
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
