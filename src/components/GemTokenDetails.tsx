import { Modal, Tabs, Stack, Group, Text, Button, Box, ActionIcon, Loader, Center, Tooltip, TextInput } from '@mantine/core';
import { IconChartLine, IconPick, IconArrowLeft, IconCopy, IconCheck } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useTokenLogic, getIpfsUrl } from '@/hooks/useTokenLogic';
import { useClipboard, useDisclosure } from '@mantine/hooks';
import { useDisplayName } from '@/hooks/useNameContract';
import { WhitepaperModal } from './WhitepaperModal';
import { prepareContractCall } from 'thirdweb';
import { contractGemFun } from '@/utils/contracts';
import { AppTransactionButton } from './AppTransactionButton';

// Optimized Sub-components
import { TradePanel } from './gem/TradePanel';
import { MiningPanel } from './gem/MiningPanel';
import { TokenAbout } from './gem/TokenAbout';

interface Props {
  address: string;
  onClose: () => void;
  onTradeConfirmed?: (address: string) => void;
}

export function GemTokenDetails({ address, onClose, onTradeConfirmed }: Props) {
  const { account, tokenBalance, name, symbol, info, metadata, pendingRewards, userStake, isLoading, tokenCreator, isCreator, refetchPending } = useTokenLogic(address);
  const { displayName: creatorName } = useDisplayName(tokenCreator);
  const [activeTab, setActiveTab] = useState<string | null>('trade');
  const clipboard = useClipboard({ timeout: 2000 });
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [wpOpened, { open: openWP, close: closeWP }] = useDisclosure(false);

  // Auto-switch to Mining for migrated tokens
  useEffect(() => {
    if (info?.[0] && activeTab === 'trade') setActiveTab('mining');
  }, [info?.[0]]);

  if (isLoading && !name) return <Box py="xl"><Center><Loader color="blue" /></Center></Box>;

  const isMigrated = info?.[0] || false;
  const curveProgress = info ? Number(BigInt(info[2]) * 10000n / (300_000_000n * 10n ** 18n)) / 100 : 0;
  const logoUrl = getIpfsUrl(metadata[0] || "");
  const links = { website: metadata[2], twitter: metadata[3], telegram: metadata[4], discord: metadata[5] };

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" onClick={onClose} color="gray"><IconArrowLeft size={20} /></ActionIcon>
          <Text fw={700} size="xl" c="white" truncate maw={250}>{name}</Text>
        </Group>
        <Tooltip label={clipboard.copied ? "Copied!" : "Copy Address"} withArrow>
            <Button variant="light" color="blue" size="xs" leftSection={clipboard.copied ? <IconCheck size={14} /> : <IconCopy size={14} />} onClick={() => clipboard.copy(address)}>
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
          <TradePanel address={address} info={info} tokenBalance={tokenBalance} symbol={symbol} account={account} refetchPending={refetchPending} onTradeConfirmed={onTradeConfirmed} />
          <TokenAbout name={name} logoUrl={logoUrl} description={metadata[1]} creatorName={creatorName} tokenCreator={tokenCreator} isCreator={isCreator} links={links} openEdit={openEdit} openWP={openWP} clipboard={clipboard} />
        </Tabs.Panel>

        <Tabs.Panel value="mining" pt="md">
          <MiningPanel tokenAddress={address} pendingRewards={pendingRewards} userStake={userStake} symbol={symbol} onActionConfirmed={refetchPending} isMigrated={isMigrated} curveProgress={curveProgress} miningReserve={info?.[4] || 0n} isVisible={activeTab === 'mining'} />
        </Tabs.Panel>
      </Tabs>

      <UpdateMetadataModal opened={editOpened} onClose={closeEdit} tokenAddress={address} initialLinks={links} onUpdated={refetchPending} />
      <WhitepaperModal opened={wpOpened} onClose={closeWP} tokenName={name} tokenSymbol={symbol} />
    </Stack>
  );
}

function UpdateMetadataModal({ opened, onClose, tokenAddress, initialLinks, onUpdated }: any) {
    const [meta, setMeta] = useState({ website: initialLinks.website, twitter: initialLinks.twitter, telegram: initialLinks.telegram, guild: initialLinks.discord });
    return (
        <Modal opened={opened} onClose={onClose} title="Update Token Links" centered size="md" styles={{ content: { backgroundColor: '#1a1b1e', color: 'white' }, header: { backgroundColor: '#1a1b1e', color: 'white' } }}>
            <Stack>
                <Text size="xs" c="dimmed">Logo and description are fixed at launch.</Text>
                <TextInput label="Website" value={meta.website} onChange={(e) => setMeta({...meta, website: e.target.value})} />
                <TextInput label="Twitter" value={meta.twitter} onChange={(e) => setMeta({...meta, twitter: e.target.value})} />
                <TextInput label="Telegram" value={meta.telegram} onChange={(e) => setMeta({...meta, telegram: e.target.value})} />
                <TextInput label="Discord/Guild" value={meta.guild} onChange={(e) => setMeta({...meta, guild: e.target.value})} />
                <AppTransactionButton style={{ background: 'linear-gradient(45deg, #007bff, #00d2ff)', color: 'white', border: 'none', fontWeight: 700, marginTop: '10px' }} transaction={() => prepareContractCall({ contract: contractGemFun, method: "function setTokenMetadata(address token, (string website, string twitter, string telegram, string guild) meta)", params: [tokenAddress, meta] })} onTransactionConfirmed={() => { onUpdated(); onClose(); }}>
                    Save Changes
                </AppTransactionButton>
            </Stack>
        </Modal>
    );
}
