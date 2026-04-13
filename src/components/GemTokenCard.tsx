import { Card, Image, Stack, Group, Text, Badge, Skeleton, Box } from '@mantine/core';
import { getIpfsUrl, CURVE_SUPPLY, MINING_RESERVE } from '@/hooks/useTokenLogic';

export function GemTokenCard({ address, onClick, name, info, metadata, isLoading }: any) {
  const isMigrated = info?.[0] || false;
  const sold = BigInt(info?.[2] || 0n);
  const miningReserve = BigInt(info?.[4] || 0n);
  
  const logoUrl = getIpfsUrl(metadata?.[0] || "");

  // Просто считаем % от констант
  let percentageDisplay = "";
  if (isMigrated) {
      const mined = MINING_RESERVE - miningReserve;
      const p = Number(mined * 10000n / MINING_RESERVE) / 100;
      percentageDisplay = `${p.toFixed(1)}%`;
  } else {
      const p = Number(sold * 10000n / CURVE_SUPPLY) / 100;
      percentageDisplay = `${p.toFixed(1)}%`;
  }

  return (
    <Card 
      shadow="sm" 
      padding="sm" 
      radius="md" 
      withBorder 
      onClick={onClick} 
      style={{ 
        cursor: 'pointer', 
        backgroundColor: 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s ease',
        height: '100%'
      }}
      className="gem-card-hover"
    >
      {isLoading ? (
        <Stack gap="xs">
          <Skeleton height={100} radius="md" />
          <Skeleton height={16} width="80%" />
        </Stack>
      ) : (
        <Stack gap="xs">
          <Box h={100} style={{ overflow: 'hidden', borderRadius: '8px', backgroundColor: 'black', position: 'relative' }}>
             <Image 
                src={logoUrl || `https://placehold.co/200x200/202020/white?text=${name?.substring(0,1) || '?'}`} 
                height={100} 
                alt={name} 
                fit="contain"
             />
             {isMigrated && (
                 <Badge 
                    variant="filled" 
                    color="green" 
                    size="xs" 
                    style={{ position: 'absolute', top: 5, right: 5, boxShadow: '0 0 10px rgba(0,255,0,0.5)' }}
                >
                    LIVE
                </Badge>
             )}
          </Box>
          <Group justify="space-between" wrap="nowrap" gap={4}>
            <Text fw={700} size="sm" truncate style={{ flex: 1 }}>{name || 'Unnamed'}</Text>
            <Text fw={800} size="sm" c={isMigrated ? "green.4" : "blue.4"} style={{ whiteSpace: 'nowrap' }}>
                {percentageDisplay}
            </Text>
          </Group>
        </Stack>
      )}
    </Card>
  );
}
