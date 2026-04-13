import { Modal, Stack, Title, Text, Divider, Box, ScrollArea, Group, List } from '@mantine/core';
import { IconFileText, IconShieldCheck, IconCoins, IconTrendingUp, IconPick, IconCircleFilled } from '@tabler/icons-react';

interface Props {
  opened: boolean;
  onClose: () => void;
  tokenName: string;
  tokenSymbol: string;
}

export function WhitepaperModal({ opened, onClose, tokenName, tokenSymbol }: Props) {
  const brandColor = "#00d2ff";

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={
        <Group gap="xs">
          <IconFileText size={20} color={brandColor} />
          <Text fw={700}>Whitepaper: {tokenName} ({tokenSymbol})</Text>
        </Group>
      }
      centered 
      size="lg"
      scrollAreaComponent={ScrollArea.Autosize}
      styles={{ 
        content: { backgroundColor: '#1a1b1e', color: 'white' }, 
        header: { backgroundColor: '#1a1b1e', color: 'white' } 
      }}
    >
      <Stack gap="md" py="md">
        <Box p="md" style={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <Group gap="xs" mb="sm">
            <IconCoins size={18} color={brandColor} />
            <Title order={4}>1. Tokenomics & Distribution</Title>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            The token operates on the GemFun protocol within the Base network. Total supply is strictly capped, and distribution is enforced by the smart contract code:
          </Text>
          <List spacing="xs" size="sm" center>
            <List.Item icon={<IconCircleFilled size={8} color={brandColor} />}>
              <Text span fw={700} c="white">Total Supply:</Text> 1,000,000,000 (1 Billion) tokens.
            </List.Item>
            <List.Item icon={<IconCircleFilled size={8} color={brandColor} />}>
              <Text span fw={700} c="white">Bonding Curve (30%):</Text> Available for the community at the early stage. The price increases gradually according to a mathematical bonding curve.
            </List.Item>
            <List.Item icon={<IconCircleFilled size={8} color={brandColor} />}>
              <Text span fw={700} c="white">Liquidity Lock (30%):</Text> Upon completion of the sale, these tokens are automatically burned along with the liquidity pair on Uniswap V3. Rug-pull is impossible.
            </List.Item>
            <List.Item icon={<IconCircleFilled size={8} color={brandColor} />}>
              <Text span fw={700} c="white">Mining Reserve (40%):</Text> Locked within the smart contract. Accessible only through NFT Inventory staking.
            </List.Item>
          </List>
        </Box>

        <Box p="md" style={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <Group gap="xs" mb="sm">
            <IconTrendingUp size={18} color={brandColor} />
            <Title order={4}>2. Trading & Transfer Rules</Title>
          </Group>
          <Text size="sm" c="dimmed" mb="xs">
            All early trading is conducted exclusively against <Text span fw={700} c={brandColor}>HASH</Text> token via the bonding curve.
          </Text>
          <Stack gap="xs">
            <Text size="sm"><Text span fw={700}>Transfer Lock:</Text> To prevent front-running and OTC-scams, token transfers between wallets are disabled during the bonding curve stage.</Text>
            <Text size="sm"><Text span fw={700}>Fair Launch:</Text> 0% protocol fees. No pre-sales or VCs. Every participant buys under the same transparent conditions.</Text>
          </Stack>
        </Box>

        <Box p="md" style={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <Group gap="xs" mb="sm">
            <IconPick size={18} color={brandColor} />
            <Title order={4}>3. Post-Migration: DEX & Mining</Title>
          </Group>
          <Text size="sm" c="dimmed" mb="xs">
            Transition to the Decentralized Exchange (Uniswap V3) and mining rewards:
          </Text>
          <Stack gap="xs">
            <Text size="sm"><Text span fw={700}>Trading Unlock:</Text> Full trading and transfers are automatically enabled only after successful migration to Uniswap V3.</Text>
            <Text size="sm"><Text span fw={700}>NFT Mining:</Text> Staking items from the Inventory collection to mine the 40% reserve starts only after the DEX listing is complete.</Text>
            <Text size="sm"><Text span fw={700}>Efficiency:</Text> Standard 0.3% Uniswap V3 fees apply post-migration to ensure long-term pool stability.</Text>
          </Stack>
        </Box>

        <Box p="md" style={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <Group gap="xs" mb="sm">
            <IconShieldCheck size={18} color={brandColor} />
            <Title order={4}>4. Security & Governance</Title>
          </Group>
          <Stack gap="xs">
            <Text size="sm"><Text span fw={700}>Atomic Activation:</Text> The startTrading() trigger is hardcoded to execute at the final step of the migration process.</Text>
            <Text size="sm"><Text span fw={700}>Basescan Verified:</Text> All contracts are open-source and automatically verified for public audit.</Text>
            <Text size="sm"><Text span fw={700}>Ownership Renounced:</Text> After migration, liquidity management is transferred to a "dead address" permanently, ensuring the pool can never be withdrawn.</Text>
          </Stack>
        </Box>

        <Divider mt="sm" label="GemFun Protocol Document" labelPosition="center" />
        <Text size="10px" c="dimmed" ta="center">
          This whitepaper is a standardized document for all tokens launched via GemFun. Final parameters are enforced by smart contracts on the Base network.
        </Text>
      </Stack>
    </Modal>
  );
}
