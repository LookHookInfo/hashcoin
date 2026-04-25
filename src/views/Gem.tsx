import { Container, Title, Text, Button, Group, SimpleGrid, Stack, TextInput, Modal, Center, Loader, Box, Pagination } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch, IconFlame, IconWallet, IconPick, IconRocket } from '@tabler/icons-react';
import { useState, useMemo, useEffect } from 'react';
import { useGemFun } from '@/hooks/useGemFun';
import { GemTokenCard } from '@/components/GemTokenCard';
import { GemTokenDetails } from '@/components/GemTokenDetails';
import { useActiveAccount } from 'thirdweb/react';
import { LaunchTokenModal } from '@/components/LaunchTokenModal';

type FilterType = 'active' | 'hold' | 'mining' | 'migrated';
const TOKENS_PER_PAGE = 30;

export default function Gem() {
  const account = useActiveAccount();
  const [opened, { open, close }] = useDisclosure(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setFilter] = useState<FilterType>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const { tokenIndex, lists, isLoading, refresh } = useGemFun();

  useEffect(() => { setCurrentPage(1); }, [search, activeFilter]);

  const filteredAddresses = useMemo(() => {
    const baseList = lists[activeFilter] || [];
    if (!search) return baseList;
    const s = search.toLowerCase();
    return baseList.filter(addr => {
        const meta = tokenIndex[addr];
        return addr.includes(s) || meta?.name?.toLowerCase().includes(s) || meta?.symbol?.toLowerCase().includes(s);
    });
  }, [lists, tokenIndex, search, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAddresses.length / TOKENS_PER_PAGE));
  const pageAddresses = filteredAddresses.slice((currentPage - 1) * TOKENS_PER_PAGE, currentPage * TOKENS_PER_PAGE);

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
            gradient={{ from: 'blue', to: 'cyan' }} onClick={open} disabled={!account}
          >
            {account ? "Launch Token" : "Connect Wallet"}
          </Button>
        </Group>

        <Box>
            <Group gap="xl" mb="lg" wrap="wrap">
                <FilterTab label="Top Market" icon={<IconFlame size={20} color="orange" />} active={activeFilter === 'active'} onClick={() => setFilter('active')} />
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
                        {pageAddresses.map((addr) => (
                            <GemTokenCard 
                                key={addr} address={addr} meta={tokenIndex[addr]} 
                                onClick={() => setSelectedToken(addr)} 
                            />
                        ))}
                    </SimpleGrid>
                    
                    {totalPages > 1 && (
                        <Center mt={40}>
                            <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="blue" radius="xl" />
                        </Center>
                    )}
                </>
            )}
        </Box>
      </Stack>

      <Modal opened={!!selectedToken} onClose={() => setSelectedToken(null)} centered size="xl" styles={{ content: { backgroundColor: '#1a1b1e', color: 'white' } }}>
        {selectedToken && <GemTokenDetails address={selectedToken} onClose={() => setSelectedToken(null)} onTradeConfirmed={refresh} />}
      </Modal>

      <LaunchTokenModal opened={opened} onClose={close} onSuccess={refresh} />
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
