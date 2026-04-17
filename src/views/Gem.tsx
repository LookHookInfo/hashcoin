import { Container, Title, Text, Button, Group, SimpleGrid, Stack, TextInput, Modal, Center, Loader, Badge, Box, Paper, Pagination } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch, IconTrophy, IconFlame, IconWallet, IconPick, IconRocket } from '@tabler/icons-react';
import { useState, useMemo, useEffect } from 'react';
import { useGemFun, useTokenData, type CachedGemTokenMeta } from '@/hooks/useGemFun';
import { GemTokenCard } from '@/components/GemTokenCard';
import { GemTokenDetails } from '@/components/GemTokenDetails';
import { useActiveAccount } from 'thirdweb/react';
import { formatEther } from 'viem';
import { formatAmount, getIpfsUrl } from '@/hooks/useTokenLogic';
import { LaunchTokenModal } from '@/components/LaunchTokenModal';

type FilterType = 'all' | 'hold' | 'mining' | 'migrated';

const TOKENS_PER_PAGE = 20;
const EMPTY_METADATA: [string, string, string, string, string, string] = ["", "", "", "", "", ""];
const EMPTY_INFO: [boolean, boolean, bigint, bigint, bigint] = [false, false, 0n, 0n, 0n];

export default function Gem() {
  const account = useActiveAccount();
  const [opened, { open, close }] = useDisclosure(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setFilter] = useState<FilterType>('all');

  const gemData = useGemFun();
  const tokenIndex = gemData.tokenIndex || {};
  const topMcapTokens = gemData.topMcapTokens || [];
  const isLoading = gemData.isLoading;
  const lists = gemData.lists;
  const bumpTokenActivity = gemData.bumpTokenActivity;

  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter]);

  // Списки уже приходят отсортированными по активности из Goldsky + Live
  const filteredAddresses = useMemo(() => {
    let baseList: string[] = [];
    if (activeFilter === 'all') baseList = lists.active;
    else if (activeFilter === 'hold') baseList = lists.hold;
    else if (activeFilter === 'mining') baseList = lists.mining;
    else if (activeFilter === 'migrated') baseList = lists.migrated;

    if (!search) return baseList;
    const s = search.toLowerCase();
    return baseList.filter(addr => addr.toLowerCase().includes(s));
  }, [lists, search, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAddresses.length / TOKENS_PER_PAGE));
  const pageAddresses = useMemo(() => {
    const startIndex = (currentPage - 1) * TOKENS_PER_PAGE;
    return filteredAddresses.slice(startIndex, startIndex + TOKENS_PER_PAGE);
  }, [filteredAddresses, currentPage]);

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end">
          <div>
            <Group gap="xs" align="center">
              <Title order={1} c="white">GemFun</Title>
              <Badge variant="filled" color="blue" size="sm" className="pulse-beta">Launchpad</Badge>
            </Group>
            <Box maw={600}>
              <Text c="dimmed">
                Create and mine your own Gem tokens with HASH.
                <Text span c="blue.4" fw={500}> Compete for the top spot!</Text>
              </Text>
            </Box>
          </div>
          <Group gap="md">
            <Button 
                leftSection={<IconPlus size={20} />} 
                size="lg" 
                variant="gradient" 
                gradient={{ from: 'blue', to: 'cyan' }}
                onClick={open}
                disabled={!account}
            >
                {account ? "Launch Token" : "Connect Wallet"}
            </Button>
          </Group>
        </Group>

        {!isLoading && topMcapTokens.length > 0 && !search && (
            <Box>
                <Group gap="xs" mb="md">
                    <IconTrophy size={20} color="gold" />
                    <Text fw={700} c="white" size="lg">Top Market Cap</Text>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {topMcapTokens.map((addr) => (
                        <TopTokenCard key={addr} address={addr} cachedMeta={tokenIndex[addr.toLowerCase()] || null} onClick={() => setSelectedToken(addr)} />
                    ))}
                </SimpleGrid>
            </Box>
        )}

        <Box mt="md">
            <Group gap="xl" mb="lg" align="center" wrap="wrap">
                <Group gap="xs" onClick={() => setFilter('all')} style={{ cursor: 'pointer', opacity: activeFilter === 'all' ? 1 : 0.4, transition: 'all 0.2s ease', borderBottom: activeFilter === 'all' ? '2px solid orange' : '2px solid transparent', paddingBottom: '4px' }}>
                    <IconFlame size={20} color="orange" />
                    <Text fw={700} c="white" size="lg">Recently Active</Text>
                </Group>
                <Group gap="xs" onClick={() => setFilter('hold')} style={{ cursor: 'pointer', opacity: activeFilter === 'hold' ? 1 : 0.4, transition: 'all 0.2s ease', borderBottom: activeFilter === 'hold' ? '2px solid #228be6' : '2px solid transparent', paddingBottom: '4px' }}>
                    <IconWallet size={20} color="#00d2ff" />
                    <Text fw={700} c="white" size="lg">Hold Assets</Text>
                </Group>
                <Group gap="xs" onClick={() => setFilter('mining')} style={{ cursor: 'pointer', opacity: activeFilter === 'mining' ? 1 : 0.4, transition: 'all 0.2s ease', borderBottom: activeFilter === 'mining' ? '2px solid #fab005' : '2px solid transparent', paddingBottom: '4px' }}>
                    <IconPick size={20} color="#00d2ff" />
                    <Text fw={700} c="white" size="lg">Mining Assets</Text>
                </Group>
                <Group gap="xs" onClick={() => setFilter('migrated')} style={{ cursor: 'pointer', opacity: activeFilter === 'migrated' ? 1 : 0.4, transition: 'all 0.2s ease', borderBottom: activeFilter === 'migrated' ? '2px solid #00d2ff' : '2px solid transparent', paddingBottom: '4px' }}>
                    <IconRocket size={20} color="#00d2ff" />
                    <Text fw={700} c="white" size="lg">Mining Live</Text>
                </Group>
            </Group>

            <TextInput
                placeholder="Search by address"
                size="md"
                mb="lg"
                leftSection={<IconSearch size={18} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                styles={{ input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)' } }}
            />

            {isLoading ? (
            <Center py="xl"><Loader color="blue" /></Center>
            ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
                {pageAddresses.map((addr) => (
                    <GemTokenFilterItem 
                        key={addr} 
                        address={addr} 
                        filter={activeFilter}
                        cachedMeta={tokenIndex[addr.toLowerCase()] || null}
                        onClick={() => setSelectedToken(addr)} 
                        liveActivity={gemData.liveActivity}
                    />
                ))}
            </SimpleGrid>
            )}
            
            {!isLoading && totalPages > 1 && (
                <Center mt="xl">
                    <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="blue" radius="xl" />
                </Center>
            )}
        </Box>
      </Stack>

      <Modal opened={!!selectedToken} onClose={() => setSelectedToken(null)} centered size="xl" styles={{ content: { backgroundColor: '#1a1b1e', color: 'white' }, header: { backgroundColor: '#1a1b1e', color: 'white' } }}>
        {selectedToken && (
          <GemTokenDetails 
            address={selectedToken} 
            onClose={() => setSelectedToken(null)} 
            onTradeConfirmed={(addr) => {
                bumpTokenActivity(addr);
                setCurrentPage(1);
            }} 
          />
        )}
      </Modal>

      <LaunchTokenModal opened={opened} onClose={close} onSuccess={gemData.refreshAll} />
    </Container>
  );
}

function GemTokenFilterItem({ address, filter, cachedMeta, onClick, liveActivity }: { address: string, filter: FilterType, cachedMeta: CachedGemTokenMeta | null, onClick: () => void, liveActivity?: Record<string, number> }) {
    const { userStats, info, name, metadata, isLoading, triggerRefresh, lastSynced } = useTokenData(address, {
        includeUserStats: true, 
        initialMeta: cachedMeta,
    });
    
    const isMigrated = info?.[0] || false;
    const matchesFilter = (filter !== 'hold' || userStats.hasBalance) && 
                         (filter !== 'mining' || userStats.hasMining) && 
                         (filter !== 'migrated' || isMigrated) && 
                         (filter !== 'all' || !isMigrated);

    if (!matchesFilter) return null;

    const lastActive = liveActivity?.[address.toLowerCase()] || 0;
    const isHot = (Date.now() - lastActive) < 15000; // Активен в последние 15 сек

    return (
        <GemTokenCard 
            address={address} 
            onClick={onClick} 
            name={name || cachedMeta?.name || "..."} 
            info={info || EMPTY_INFO} 
            metadata={(metadata as [string, string, string, string, string, string]) || EMPTY_METADATA} 
            isLoading={isLoading} 
            onRefresh={triggerRefresh} 
            lastSynced={lastSynced}
            isHot={isHot} 
        />
    );
}

function TopTokenCard({ address, cachedMeta, onClick }: { address: string, cachedMeta: CachedGemTokenMeta | null, onClick: () => void }) {
    const { name, info, metadata, isLoading } = useTokenData(address, { includeUserStats: true, initialMeta: cachedMeta });
    const mcap = info ? formatEther(info[3]) : '0';
    const logo = (metadata as any)?.[0] || "";
    const color = '#00d2ff';

    return (
        <Paper p="md" withBorder onClick={onClick} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: color, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <Box style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}><IconTrophy size={80} color={color} /></Box>
            <Group wrap="nowrap">
                <Box style={{ position: 'relative' }}>
                    <Box w={60} h={60} style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: 'black' }}>
                        <img src={getIpfsUrl(logo) || `https://placehold.co/60x60/202020/white?text=${name?.substring(0,1) || '?'}`} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </Box>
                </Box>
                <Stack gap={0} flex={1} style={{ minWidth: 0 }}>
                    <Text fw={700} c="white" truncate>{isLoading ? 'Loading...' : (name || 'Unnamed')}</Text>
                    <Text size="xs" c="dimmed">Market Cap</Text>
                    <Text fw={700} size="sm" c="blue">{formatAmount(mcap)} HASH</Text>
                </Stack>
            </Group>
        </Paper>
    );
}
