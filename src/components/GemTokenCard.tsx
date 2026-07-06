import { Card, Stack, Group, Text, Badge, Box } from '@mantine/core';
import { useState } from 'react';
import { getIpfsUrl, calculateCurveProgress, calculateMiningProgress } from '@/hooks/useTokenLogic';

export function GemTokenCard({ meta, onClick }: any) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!meta || !meta.stats) return null;

  const stats = meta.stats;
  const isMigrated = stats[0] === "1";

  // If meta.logo is a hex hash (0x...), getIpfsUrl will return "" and we
  // render the fallback below.
  const logoUrl = getIpfsUrl(meta.logo);
  const showFallback = !logoUrl || imgFailed;

  const getProgress = () => {
    try {
        if (isMigrated) return calculateMiningProgress(stats[4]);
        return calculateCurveProgress(stats[2]);
    } catch (e) { return 0; }
  };

  const progress = getProgress();
  const fallbackLetters = (meta.symbol ?? 'G').toString().substring(0, 2);

  return (
    <Card 
      shadow="sm" padding="sm" radius="md" withBorder onClick={onClick} 
      style={{ 
        cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.02)', transition: 'all 0.3s ease', height: '100%',
        borderColor: 'rgba(255,255,255,0.1)',
        transform: 'scale(1)',
        boxShadow: undefined,
        zIndex: 1
      }}
    >
      <Stack gap="xs">
        <Box h={100} style={{
            overflow: 'hidden', borderRadius: '8px', backgroundColor: 'black', position: 'relative',
            display: showFallback ? 'flex' : undefined,
            alignItems: showFallback ? 'center' : undefined,
            justifyContent: showFallback ? 'center' : undefined,
        }}>
           {showFallback ? (
               <div style={{ color: 'white', fontWeight: 'bold', fontSize: 24 }}>{fallbackLetters}</div>
           ) : (
               <img
                  src={logoUrl}
                  alt={meta.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgFailed(true)}
               />
           )}
           {isMigrated && (
               <Badge variant="filled" color="green" size="xs" style={{ position: 'absolute', top: 5, right: 5, zIndex: 2 }}>
                  LIVE
               </Badge>
           )}
        </Box>
        <Group justify="space-between" wrap="nowrap" gap={4}>
          <Text fw={700} size="sm" truncate style={{ flex: 1 }} c="white">
            {meta.name}
          </Text>
          <Text fw={800} size="sm" c={isMigrated ? "green.4" : "blue.4"}>
            {progress.toFixed(1)}%
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
