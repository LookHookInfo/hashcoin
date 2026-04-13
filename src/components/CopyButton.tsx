import { Group, Text, CopyButton, ActionIcon, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { shortenAddress } from '@/utils/addressUtils';

export function CopyAddressButton({ address }: { address: string }) {
  return (
    <Group gap="xs" wrap="nowrap">
      <Text size="sm" c="dimmed">({shortenAddress(address)})</Text>
      <CopyButton value={address} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied' : 'Copy Address'} withArrow>
            <ActionIcon color={copied ? 'teal' : '#A5D8FF'} variant="subtle" onClick={copy}>
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
}
