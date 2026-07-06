import { Box, Group, Title, Button, Card, Image, Stack, Text, Tooltip, ActionIcon } from '@mantine/core';
import { IconEdit, IconUser, IconCopy, IconWorld, IconBrandX, IconBrandTelegram, IconBrandDiscord, IconFileText } from '@tabler/icons-react';
import { getIpfsUrl } from '@/hooks/useTokenLogic';

export function TokenAbout({ name, logoUrl, description, creatorName, tokenCreator, isCreator, links, openEdit, openWP, clipboard }: any) {
    return (
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
                            <Text size="xs" c="dimmed">Founder: <Text span c="blue.4" fw={600}>{creatorName}</Text></Text>
                            <Tooltip label="Copy founder address" withArrow>
                                <ActionIcon variant="subtle" size="xs" color="gray" onClick={() => clipboard.copy(tokenCreator)}>
                                    <IconCopy size={12} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                        <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>{description}</Text>
                        <Group gap="xs" align="center">
                            {links.website && <Tooltip label="Website" withArrow><ActionIcon component="a" href={getIpfsUrl(links.website)} target="_blank" variant="subtle" color="gray"><IconWorld size={18} /></ActionIcon></Tooltip>}
                            {links.twitter && <Tooltip label="Twitter" withArrow><ActionIcon component="a" href={links.twitter} target="_blank" variant="subtle" color="gray"><IconBrandX size={18} /></ActionIcon></Tooltip>}
                            {links.telegram && <Tooltip label="Telegram" withArrow><ActionIcon component="a" href={links.telegram} target="_blank" variant="subtle" color="gray"><IconBrandTelegram size={18} /></ActionIcon></Tooltip>}
                            {links.discord && <Tooltip label="Discord" withArrow><ActionIcon component="a" href={links.discord} target="_blank" variant="subtle" color="gray"><IconBrandDiscord size={18} /></ActionIcon></Tooltip>}
                            <Tooltip label="Whitepaper" withArrow><ActionIcon variant="subtle" color="blue" onClick={openWP}><IconFileText size={18} /></ActionIcon></Tooltip>
                        </Group>
                    </Stack>
                </Group>
            </Card>
        </Box>
    );
}
