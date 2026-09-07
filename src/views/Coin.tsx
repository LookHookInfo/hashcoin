import { Flex, SimpleGrid, Image, Text, Box, Title, Grid, Card, Table, Progress, Container, Divider, Tooltip, CopyButton, ActionIcon } from "@mantine/core";
import { DonutChart } from '@mantine/charts';
import '@mantine/charts/styles.css';
import { PageTitle } from "@/components/Htm";
import { CardTitle, ContractBox, Page, Subtitle } from '@/components/Page';
import p from '@/source/coin';
import { useState, useMemo } from 'react';
import { Helmet } from "react-helmet-async";
import { IconShieldCheck, IconCopy, IconCheck } from '@tabler/icons-react';
import { ListingInfo } from "@/components/ListingInfo";
import { formatEther } from 'viem';
import { useCoinFeed } from '@/hooks/useCoreAggregator';
import { HASH_WALLET_ADDRESSES, HASH_WALLET_LABELS } from "@/utils/constants";
import { memeClient } from "@/hooks/useAggregatorClient";
import { useContractRead } from "@/hooks/useContractRead";
import { erc20Abi } from "viem";
import { CONTRACT_ADDRESSES } from "@/utils/constants";

export default function Coin() {
   return (
      <>
         <Helmet>
            <title>$HASH Tokenomics | Mining Hash</title>
            <meta name="description" content="Discover the tokenomics of the $HASH token. Learn about the total supply, circulating supply, distribution, and the utility that drives the Mining Hash ecosystem." />
         </Helmet>
         <Container fluid>
            <Flex direction='column' >
               <PageTitle title={p.title} subtitle={p.subtitle} />
               <FirstRow />
               < SecondRow />
               <ListingInfo />
               <Grid>
                  <Grid.Col span={12}>
                     <Page>
                        <CirculatingSupplyDisplay />
                     </Page>
                  </Grid.Col>
               </Grid>
            </Flex>
         </Container>
      </>
   );
}

interface WalletBalance {
   balance: number;
   address: string;
}

interface WalletBalances {
   [key: string]: WalletBalance;
}

function CirculatingSupplyDisplay() {
   const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
   const { data: coinData } = useCoinFeed();
   const { data: walletBalancesMap } = useHashWalletBalances();

   const totalSupply = coinData ? Number(formatEther(coinData.totalSupply)) : 10_000_000_000;

   const walletBalances = useMemo<WalletBalances | null>(() => {
      if (!walletBalancesMap) return null;
      return walletBalancesMap;
   }, [walletBalancesMap]);

   const totalWalletSum = useMemo(() => {
      if (!walletBalances) return 0;
      return Object.values(walletBalances).reduce((sum, wb) => sum + wb.balance, 0);
   }, [walletBalances]);

   const circulatingSupply = totalSupply - totalWalletSum;
   const circulatingPercentage = totalSupply > 0 ? (circulatingSupply / totalSupply) * 100 : 0;
   const formattingOptions = { minimumFractionDigits: 0, maximumFractionDigits: 0 };

   const coinIcon = '/assets/Hashcoin.png';
   const projectColors = [
      '#A5D8FF', '#74C0FC', '#4DABF7', '#339AF0', '#228BE6', '#1C7ED6', '#1971C2',
      '#748FFC', '#5C7CFA', '#4C6EF5', '#4263EB', '#3B5BDB', '#364FC7',
      '#BAC8FF', '#91A7FF', '#748FFC', '#5C7CFA', '#4C6EF5'
   ];

   const donutChartData = walletBalances ? Object.entries(walletBalances)
      .filter(([, data]) => data.balance > 0)
      .map(([name, data], index) => {
         const label = name;
         const originalColor = projectColors[index % projectColors.length];
         const color = hoveredSegment === null ? originalColor : (hoveredSegment === label ? originalColor : 'var(--mantine-color-dark-5)');

         return {
            name: label,
            value: data.balance,
            color: color,
            onMouseEnter: () => setHoveredSegment(label),
            onMouseLeave: () => setHoveredSegment(null),
         };
      }) : [];

   if (circulatingSupply > 0) {
      const label = "Circulating Supply";
      const originalColor = projectColors[donutChartData.length % projectColors.length];
      const color = hoveredSegment === null ? originalColor : (hoveredSegment === label ? originalColor : 'var(--mantine-color-dark-5)');

      donutChartData.push({
         name: label,
         value: circulatingSupply,
         color: color,
         onMouseEnter: () => setHoveredSegment(label),
         onMouseLeave: () => setHoveredSegment(null),
      });
   }

   return (
      <Flex direction="column" gap="md" >
         <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" >
            <StatCard title="Total Supply" value={totalSupply.toLocaleString('en-US', formattingOptions)} icon={coinIcon} />
            <StatCard title="Circulating Supply" value={circulatingSupply.toLocaleString('en-US', formattingOptions)} icon={coinIcon} />
            <StatCard title="Circulating %" value={`${circulatingPercentage.toFixed(2)}%`} icon={coinIcon} />
         </SimpleGrid>

         <Card radius="md" padding="md" bg="dark.7">
            <Text fw={500} size="lg" mb="sm" > Supply Overview </Text>
            < Progress.Root size="xl" >
               <Progress.Section value={circulatingPercentage} color="#A5D8FF" >
                  <Progress.Label>{`${circulatingPercentage.toFixed(2)}%`}</Progress.Label>
               </Progress.Section>
            </Progress.Root>
         </Card>

         <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
               {walletBalances ? (
                  <Card radius="md" padding="lg" bg="dark.7" h="100%">
                     <Text fw={500} size="lg" mb="md">Strategic Balances</Text>
                     <Table>
                        <Table.Thead>
                           <Table.Tr>
                              <Table.Th>Addresses </Table.Th>
                              <Table.Th>Balance</Table.Th>
                           </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                           {Object.entries(walletBalances)
                              .sort(([, a], [, b]) => b.balance - a.balance)
                              .map(([name, data]) => {
                                 const label = name;
                                 const isHovered = hoveredSegment === label;

                                 return (
                                    <Table.Tr
                                       key={name}
                                       style={{ backgroundColor: isHovered ? 'var(--mantine-color-dark-5)' : undefined }}
                                       onMouseEnter={() => setHoveredSegment(label)}
                                       onMouseLeave={() => setHoveredSegment(null)}
                                    >
                                       <Table.Td>
                                          <Flex align="center" gap="xs">
                                             <Text size="sm">{label}</Text>
                                             {data.address && (
                                                <CopyButton value={data.address} timeout={2000}>
                                                   {({ copied, copy }) => (
                                                      <Tooltip label={copied ? 'Copied' : 'Copy address'} withArrow position="right">
                                                         <ActionIcon variant="subtle" color={copied ? 'teal' : '#A5D8FF'} onClick={copy} size="sm">
                                                            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                                         </ActionIcon>
                                                      </Tooltip>
                                                   )}
                                                </CopyButton>
                                             )}
                                          </Flex>
                                       </Table.Td>
                                       <Table.Td>{data.balance.toLocaleString('en-US', formattingOptions)}</Table.Td>
                                    </Table.Tr>
                                 );
                              })}
                           {circulatingSupply > 0 && (
                              <Table.Tr
                                 style={{ backgroundColor: hoveredSegment === 'Circulating Supply' ? 'var(--mantine-color-dark-5)' : undefined }}
                                 onMouseEnter={() => setHoveredSegment('Circulating Supply')}
                                 onMouseLeave={() => setHoveredSegment(null)}
                              >
                                 <Table.Td>Circulating Supply</Table.Td>
                                 <Table.Td>{circulatingSupply.toLocaleString('en-US', formattingOptions)}</Table.Td>
                              </Table.Tr>
                           )}
                        </Table.Tbody>
                     </Table>
                  </Card>
               ) : (
                  <Text>Loading wallet balances...</Text>
               )}
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
               {walletBalances ? (
                  <Card radius="md" padding="lg" bg="dark.7" h="100%">
                     <Flex direction="column" justify="center" align="center" h="100%">
                        <Text fw={500} size="lg" mb="md" ta="center">Balances Distribution</Text>
                        <DonutChart
                           data={donutChartData}
                           size={200}
                           thickness={30}
                           chartLabel="Hashcoin"
                           withTooltip={false}
                        />
                     </Flex>
                  </Card>
               ) : (
                  <Text>Loading wallet balances...</Text>
               )}
            </Grid.Col>
         </Grid>
      </Flex>
   );
}

function useHashWalletBalances() {
   return useContractRead<Record<string, { balance: number; address: string }> | null>({
      fetchFn: async () => {
         const results = await memeClient.multicall({
            contracts: HASH_WALLET_ADDRESSES.map((addr) => ({
               address: CONTRACT_ADDRESSES.HASH_COIN as `0x${string}`,
               abi: erc20Abi,
               functionName: "balanceOf",
               args: [addr as `0x${string}`],
            })),
         });
         const out: Record<string, { balance: number; address: string }> = {};
         HASH_WALLET_ADDRESSES.forEach((addr, i) => {
            const label = HASH_WALLET_LABELS[addr.toLowerCase()] ?? addr;
            const bal = BigInt(results[i]?.result ?? 0);

            out[label] = {
               balance: Number(formatEther(bal)),
               address: addr,
            };
         });
         return out;
      },
      deps: [],
      intervalMs: 60_000,
   });
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon?: string }) {
   const displayValue = typeof value === 'string' && value.endsWith('%') ? (
      <Text fz="xl" fw={700} >
         {value.slice(0, -1)}
         < Text span c="red" fz="xl" fw={700} > % </Text>
      </Text>
   ) : (
      <Text fz="xl" fw={700} > {value} </Text>
   );

   return (
      <Card withBorder radius="md" padding="xl">
         <Flex align="center" justify="center" >
            {icon && (
               <Box w={40} h={40} mr="md">
                  <Image src={icon} alt={title} width={40} height={40} />
               </Box>
            )}
            <div>
               <Text fz="xs" tt="uppercase" fw={700} c="dimmed" > {title} </Text>
               {displayValue}
            </div>
         </Flex>
      </Card>
   );
}

function FirstRow(): React.ReactNode {
   return (
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
         <Page>
            <Flex direction="column" justify="space-between" h="100%" align="center">
               <div>
                  <Flex align="center" justify="center" mb="md">
                     <Box w={40} h={40} mr="md">
                        <Image src="/assets/base.png" alt="Base Ecosystem Logo" width={40} height={40} />
                     </Box>
                     <Text size="xl" fw="bold">Built on Base</Text>
                  </Flex>

                  <Divider w="50%" mx="auto" my="md" />

                  <CardTitle v={p.p1.title} ta="center" />
                  {
                     p.p1.list.map((item: any, index: number) => (
                        <Text py={2} key={index} ta="center">
                           <Text component='span' fw='bold' > {item.title} </Text>
                           {item.val.startsWith('https://') ? (
                              <a href={item.val.split(' ')[0]} target="_blank" rel="noopener noreferrer" style={{ color: '#A5D8FF', textDecoration: 'underline' }}>
                                 {item.val.substring(item.val.indexOf(' ') + 1)}
                                 <IconShieldCheck size={16} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                              </a>
                           ) : (
                              item.val
                           )}
                        </Text>
                     ))
                  }
               </div>
               < ContractBox title={p.p1.contact.title} val={p.p1.contact.val} />
            </Flex>
         </Page>
         < Page >
            <Flex direction="column" justify="space-between" h="100%">
               <div>
                  <CardTitle v={p.p2.title} />
                  {
                     p.p2.list.map((item: any, index: number) => (
                        <Box key={index} >
                           <Title order={5} my={10} > {item.title[0]} {item.title[1]} </Title>
                           < Text mb={10} > {item.val} </Text>
                        </Box>
                     ))
                  }
               </div>
               < ContractBox title={p.p2.contact.title} val={p.p2.contact.val} />
            </Flex>
         </Page>
         < Page >
            <Flex direction="column" justify="space-between" h="100%">
               <div>
                  <CardTitle v={p.p3.title} />
                  < Subtitle v={p.p3.subtitle} />
                  {
                     p.p3.list.map((item: any, index: number) => (
                        <Box key={index} >
                           <Text mb={10} > {item} </Text>
                        </Box>
                     ))
                  }
               </div>
               < ContractBox title={p.p3.contact.title} val={p.p3.contact.val} />
            </Flex>
         </Page>
      </SimpleGrid>
   );
}

function SecondRow(): React.ReactNode {
   return (
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
         <Page>
            <Flex direction="column" justify="space-between" h="100%">
               <div>
                  <CardTitle v={p.p4.title} />
                  < Subtitle v={p.p4.subtitle} />
                  {
                     p.p4.list.map((item: any, index: number) => (
                        <Text mb={10} key={index} > {item} </Text>
                     ))
                  }
               </div>
               < ContractBox title={p.p4.contact.title} val={p.p4.contact.val} />
            </Flex>
         </Page>
         < Page >
            <Flex direction="column" justify="space-between" h="100%">
               <div>
                  <CardTitle v={p.p5.title} />
                  < Subtitle v={p.p5.subtitle} />
                  {
                     p.p5.list.map((item: any, index: number) => (
                        <Text mb={10} key={index} > {item} </Text>
                     ))
                  }
               </div>
               < ContractBox title={p.p5.contact.title} val={p.p5.contact.val} />
            </Flex>
         </Page>
         < Page >
            <Flex direction="column" justify="space-between" h="100%">
               <div>
                  <CardTitle v={p.p6.title} />
                  {
                     p.p6.list.map((item: any, index: number) => (
                        <Text mb={10} key={index} > {item} </Text>
                     ))
                  }
               </div>
            </Flex>
         </Page>
      </SimpleGrid>
   );
}
