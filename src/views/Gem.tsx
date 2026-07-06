import { Container, Title, Text, Button, Group, SimpleGrid, Stack, TextInput, Modal, Center, Loader, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch, IconWallet, IconPick, IconRocket, IconTrendingUp } from '@tabler/icons-react';
import { useState, lazy, Suspense } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useGemFun, type GemFilter } from '@/hooks/useGemFun';
import { GemTokenCard } from '@/components/GemTokenCard';
import { GemTopMarketCap } from '@/components/GemTopMarketCap';
import { useAccount } from '@/hooks/useAccount';

const GemTokenDetails = lazy(() =>
  import('@/components/GemTokenDetails').then((m) => ({ default: m.GemTokenDetails })),
);
const LaunchTokenModal = lazy(() =>
  import('@/components/LaunchTokenModal').then((m) => ({ default: m.LaunchTokenModal })),
);

const TOKENS_PER_PAGE = 20;

export default function Gem() {
  const account = useAccount();
  const [opened, { open, close }] = useDisclosure(false);
  const [launchEverOpened, setLaunchEverOpened] = useState(false);
  const handleLaunchOpen = () => { setLaunchEverOpened(true); open(); };
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [activeFilter, setFilter] = useState<GemFilter>('marketcap');
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const { tokenIndex, addresses, isLoading, hasMore, isLoadingMore, loadMore, refresh } = useGemFun({
    filter: activeFilter,
    limit: TOKENS_PER_PAGE,
    q: debouncedSearch,
    userAddress: account?.address,
  });

  const handleTradeConfirmed = async () => {
    refresh();
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1} c="white">GemFun</Title>
            <Text c="dimmed">The most active gems across the network.</Text>
          </div>
          <Button
            leftSection={<IconPlus size={20} />} size="lg" variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }} onClick={handleLaunchOpen} disabled={!account}
          >
            {account ? "Launch Token" : "Connect Wallet"}
          </Button>
        </Group>

        <Box>
            <GemTopMarketCap onSelect={setSelectedToken} />

            <Group gap="xl" mb="lg" wrap="wrap">
                <FilterTab label="Top Market Cap" icon={<IconTrendingUp size={20} color="#9775fa" />} active={activeFilter === 'marketcap'} onClick={() => setFilter('marketcap')} />
                <FilterTab label="Hold Assets" icon={<IconWallet size={20} color="#00d2ff" />} active={activeFilter === 'hold'} onClick={() => setFilter('hold')} />
                <FilterTab label="Mining Assets" icon={<IconPick size={20} color="#fab005" />} active={activeFilter === 'mining'} onClick={() => setFilter('mining')} />
                <FilterTab label="Mining Live" icon={<IconRocket size={20} color="#40c057" />} active={activeFilter === 'migrated'} onClick={() => setFilter('migrated')} />
            </Group>

            <TextInput
                placeholder="Search gems..." size="md" mb="xl" leftSection={<IconSearch size={18} />}
                value={search} onChange={(e) => setSearch(e.currentTarget.value)}
                styles={{ input: { backgroundColor: 'rgba(255, 255, 255, 0.03)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.05)' } }}
            />

            {isLoading ? (
                <Center py={100}><Loader color="blue" variant="dots" size="xl" /></Center>
            ) : (
                <>
                    <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
                        {addresses.map((addr) => (
                            <GemTokenCard
                                key={addr} address={addr} meta={tokenIndex[addr]}
                                onClick={() => setSelectedToken(addr)}
                            />
                        ))}
                    </SimpleGrid>

                    {hasMore && (
                        <Center mt={40}>
                            <Button
                                variant="default" radius="xl" size="md"
                                loading={isLoadingMore} onClick={() => loadMore()}
                            >
                                Load more
                            </Button>
                        </Center>
                    )}
                </>
            )}
        </Box>
      </Stack>

      <Modal opened={!!selectedToken} onClose={() => setSelectedToken(null)} centered size="xl" styles={{ content: { backgroundColor: '#1a1b1e', color: 'white' } }}>
        {selectedToken && (
          <Suspense fallback={<Center py={50}><Loader color="blue" /></Center>}>
            <GemTokenDetails address={selectedToken} onClose={() => setSelectedToken(null)} onTradeConfirmed={handleTradeConfirmed} />
          </Suspense>
        )}
      </Modal>

      {launchEverOpened && (
        <Suspense fallback={null}>
          <LaunchTokenModal opened={opened} onClose={close} onSuccess={refresh} />
        </Suspense>
      )}
    </Container>
  );
}

function FilterTab({ label, icon, active, onClick }: any) {
    return (
        <Group
            gap="xs" onClick={onClick}
            style={{
                cursor: 'pointer', opacity: active ? 1 : 0.4, transition: '0.2s',
                borderBottom: active ? '2px solid white' : '2px solid transparent', paddingBottom: 6
            }}
        >
            {icon}
            <Text fw={700} c="white" size="lg">{label}</Text>
        </Group>
    );
}
