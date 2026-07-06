import { Box, Card, Group, SimpleGrid, Stack, Text, Center, Loader } from '@mantine/core';
import { useState } from 'react';
import { IconTrophy } from '@tabler/icons-react';
import { useGemFeedByMarketCap } from '@/hooks/useGemAggregator';
import { getIpfsUrl, calculateCurveProgress } from '@/hooks/useTokenLogic';

interface Props {
  onSelect: (address: string) => void;
}

const RANK_COLORS = [
  {
    trophy: '#ffd34d',
    border: 'rgba(255, 211, 77, 0.55)',
    borderHover: 'rgba(255, 211, 77, 0.95)',
    glow: '0 0 18px rgba(255, 211, 77, 0.22)',
    glowHover: '0 10px 28px rgba(255, 211, 77, 0.38)',
    pct: 'yellow.4',
  },
  {
    trophy: '#dde3ec',
    border: 'rgba(221, 227, 236, 0.45)',
    borderHover: 'rgba(221, 227, 236, 0.85)',
    glow: '0 0 14px rgba(221, 227, 236, 0.15)',
    glowHover: '0 10px 24px rgba(221, 227, 236, 0.28)',
    pct: 'gray.2',
  },
  {
    trophy: '#c98a63',
    border: 'rgba(201, 138, 99, 0.4)',
    borderHover: 'rgba(201, 138, 99, 0.8)',
    glow: '0 0 10px rgba(201, 138, 99, 0.12)',
    glowHover: '0 10px 22px rgba(201, 138, 99, 0.24)',
    pct: 'orange.3',
  },
] as const;

const HOVER_STYLES = `
  .gem-top-card {
    border-color: var(--rank-border);
    box-shadow: var(--rank-glow);
    transition:
      transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1),
      border-color 220ms ease;
    will-change: transform;
  }
  .gem-top-card:hover {
    transform: translateY(-4px);
    border-color: var(--rank-border-hover);
    box-shadow: var(--rank-glow-hover);
  }
  .gem-top-card:active {
    transform: translateY(-2px);
    transition-duration: 90ms;
  }
  .gem-top-trophy {
    transition: transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .gem-top-card:hover .gem-top-trophy {
    transform: rotate(-12deg) scale(1.12);
  }
  .gem-top-logo {
    transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .gem-top-card:hover .gem-top-logo {
    transform: scale(1.05);
  }
  @media (prefers-reduced-motion: reduce) {
    .gem-top-card,
    .gem-top-card:hover,
    .gem-top-trophy,
    .gem-top-card:hover .gem-top-trophy,
    .gem-top-logo,
    .gem-top-card:hover .gem-top-logo {
      transform: none;
      transition: box-shadow 120ms ease, border-color 120ms ease;
    }
  }
`;

function TopLogo({ logoUrl, symbol, name }: { logoUrl: string; symbol: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const showFallback = !logoUrl || failed;
  const letters = (symbol ?? 'G').toString().substring(0, 2);
  return (
    <Box
      w={56}
      h={56}
      className="gem-top-logo"
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'black',
        flexShrink: 0,
        display: showFallback ? 'flex' : undefined,
        alignItems: showFallback ? 'center' : undefined,
        justifyContent: showFallback ? 'center' : undefined,
      }}
    >
      {showFallback ? (
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{letters}</div>
      ) : (
        <img
          src={logoUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </Box>
  );
}

function resolveLogo(t: any): string {
  let logo = t.logoHash ?? "";
  const desc = t.description ?? '';
  if (desc.includes('|')) {
    const head = desc.slice(0, desc.indexOf('|'));
    if (head.startsWith('ipfs://') || head.startsWith('Qm') || head.startsWith('ba') || head.length > 40) {
      logo = head;
    }
  }
  return getIpfsUrl(logo);
}

export function GemTopMarketCap({ onSelect }: Props) {
  const { data, isLoading } = useGemFeedByMarketCap(0, 3, true);
  const items = data?.tokens ?? [];

  if (!isLoading && items.length === 0) return null;

  return (
    <Stack gap="sm" mb="lg">
      <style>{HOVER_STYLES}</style>
      <Group gap="xs" align="center">
        <IconTrophy size={22} color="#fab005" />
        <Text fw={800} c="white" size="lg">Top Progress</Text>
      </Group>

      {isLoading ? (
        <Center py="md"><Loader color="blue" size="sm" /></Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {items.map((t: any, idx: number) => {
            const pct = calculateCurveProgress(t.sold).toFixed(1);
            const logoUrl = resolveLogo(t);
            const rank = RANK_COLORS[idx] ?? RANK_COLORS[2];
            return (
              <Card
                key={t.token}
                className="gem-top-card"
                padding="md"
                radius="md"
                withBorder
                onClick={() => onSelect(t.token)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  ['--rank-border' as any]: rank.border,
                  ['--rank-border-hover' as any]: rank.borderHover,
                  ['--rank-glow' as any]: rank.glow,
                  ['--rank-glow-hover' as any]: rank.glowHover,
                }}
              >
                <Group justify="space-between" wrap="nowrap" gap="sm">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                    <TopLogo logoUrl={logoUrl} symbol={t.symbol} name={t.name} />
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text fw={700} c="white" size="md" truncate>{t.name}</Text>
                      <Text size="xs" c="dimmed">Curve Progress</Text>
                      <Text fw={800} size="sm" c={rank.pct}>
                        {pct}%
                      </Text>
                    </Stack>
                  </Group>
                  <IconTrophy
                    size={28}
                    color={rank.trophy}
                    className="gem-top-trophy"
                    style={{ flexShrink: 0 }}
                  />
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Stack>
  );
}
