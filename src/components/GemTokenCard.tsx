import { Card, Stack, Group, Text, Badge, Box } from '@mantine/core';
import { getIpfsUrl, calculateCurveProgress, calculateMiningProgress } from '@/hooks/useTokenLogic';
import { IconFlame } from '@tabler/icons-react';

export function GemTokenCard({ meta, onClick }: any) {
  if (!meta || !meta.stats) return null;

  const stats = meta.stats;
  const isMigrated = stats[0] === "1";
  
  // КРИТИЧЕСКИЙ ФИКС КАРТИНОК:
  // Если meta.logo - это hex (0x...), getIpfsUrl должен это обработать.
  const logoUrl = getIpfsUrl(meta.logo);

  const getProgress = () => {
    try {
        if (isMigrated) return calculateMiningProgress(stats[4]);
        return calculateCurveProgress(stats[2]);
    } catch (e) { return 0; }
  };

  const progress = getProgress();
  // Порог "горячего" токена - активность в последние 45 секунд
  const isHot = (Date.now() - (meta.lastActivity || 0)) < 45000;

  return (
    <Card 
      shadow="sm" padding="sm" radius="md" withBorder onClick={onClick} 
      style={{ 
        cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.02)', transition: 'all 0.3s ease', height: '100%',
        borderColor: isHot ? 'rgba(255, 165, 0, 0.8)' : 'rgba(255,255,255,0.1)',
        transform: isHot ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHot ? '0 0 15px rgba(255,165,0,0.2)' : undefined,
        zIndex: isHot ? 10 : 1
      }}
    >
      <Stack gap="xs">
        <Box h={100} style={{ overflow: 'hidden', borderRadius: '8px', backgroundColor: 'black', position: 'relative' }}>
           <img 
              src={logoUrl} 
              alt={meta.name} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
              loading="lazy"
              onError={(e: any) => { 
                  // Если картинка не загрузилась, ставим цветную заглушку с символом
                  e.target.onerror = null; 
                  e.target.style.display = 'none';
                  e.target.parentNode.style.display = 'flex';
                  e.target.parentNode.style.alignItems = 'center';
                  e.target.parentNode.style.justifyContent = 'center';
                  e.target.parentNode.innerHTML = `<div style="color: white; font-weight: bold; font-size: 24px;">${meta.symbol?.substring(0,2) || 'G'}</div>`;
              }}
           />
           {isHot && (
               <Badge variant="filled" color="orange" size="xs" leftSection={<IconFlame size={10} />} style={{ position: 'absolute', top: 5, left: 5, zIndex: 2 }}>
                  ACTIVE
               </Badge>
           )}
           {isMigrated && (
               <Badge variant="filled" color="green" size="xs" style={{ position: 'absolute', top: 5, right: 5, zIndex: 2 }}>
                  LIVE
               </Badge>
           )}
        </Box>
        <Group justify="space-between" wrap="nowrap" gap={4}>
          <Text fw={700} size="sm" truncate style={{ flex: 1 }} c={isHot ? "orange.3" : "white"}>
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
