import { Card, Image, Stack, Group, Text, Badge, Skeleton, Box } from '@mantine/core';
import { getIpfsUrl, calculateCurveProgress, calculateMiningProgress } from '@/hooks/useTokenLogic';
import { IconFlame } from '@tabler/icons-react';

export function GemTokenCard({ address, onClick, name, info, metadata, isLoading, isHot }: any) {
  const isMigrated = info?.[0] || false;
  const logoUrl = getIpfsUrl(metadata?.[0] || "");

  // АВТОМАТИЧЕСКИЙ ВЫБОР ПРОГРЕССА:
  // До миграции показываем Bonding Curve (info[2] = sold)
  // После миграции показываем Mining Progress (info[4] = miningReserve)
  const getProgress = () => {
    if (!info) return 0;
    if (isMigrated) {
        return calculateMiningProgress(info[4]);
    }
    return calculateCurveProgress(info[2]);
  };

  const progress = getProgress();
  const percentageDisplay = `${progress.toFixed(1)}%`;

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
        transition: 'all 0.3s ease',
        height: '100%',
        borderColor: isHot ? 'rgba(255, 165, 0, 0.8)' : undefined,
        boxShadow: isHot ? '0 0 15px rgba(255, 165, 0, 0.3)' : undefined,
        transform: isHot ? 'scale(1.02)' : 'scale(1)',
        zIndex: isHot ? 10 : 1
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
             {isHot && (
                 <Badge 
                    variant="filled" 
                    color="orange" 
                    size="xs" 
                    leftSection={<IconFlame size={10} />}
                    style={{ position: 'absolute', top: 5, left: 5, zIndex: 2, animation: 'pulse 1.5s infinite' }}
                >
                    TRADING
                </Badge>
             )}
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
            <Text fw={700} size="sm" truncate style={{ flex: 1 }} c={isHot ? "orange.4" : "white"}>{name || 'Unnamed'}</Text>
            <Text fw={800} size="sm" c={isMigrated ? "green.4" : "blue.4"} style={{ whiteSpace: 'nowrap' }}>
                {percentageDisplay}
            </Text>
          </Group>
        </Stack>
      )}
    </Card>
  );
}
