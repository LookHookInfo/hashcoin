import React from 'react';
import { Accordion, Button, Text, Group, Box, Title, CopyButton, Tooltip, ActionIcon, Blockquote, SimpleGrid, Divider } from '@mantine/core';
import { IconCopy, IconCheck, IconInfoCircle } from '@tabler/icons-react';

const miniDescription = "Mining Hash is a Web3 platform that lets you mine $HASH tokens through interactive NFT inventory.";
const fullDescription = "Mining Hash is an innovative Web3 project offering a green and accessible way to mine the $HASH token through NFT-based devices and gamified quests. Instead of expensive hardware, users utilize NFT inventory (from basic GPUs to industrial Containers), each generating tokens at a unique rate. The project integrates with quest platforms (Intract, Guild, Galxe) where users can complete tasks, earn additional NFTs, and unlock rewards. Key Features:\n- Fair Launch: 80% of tokens distributed via mining.\n- NFT Utility: Grants access to mining, quests, and exclusive roles.\n- Eco-Friendly: No energy-intensive computations.\n- Transparency: Traded on DEX within the Base network.\n- Experienced Team: Built by the Look Hook Dev team, creators of multiple crypto products.\n\nMining Hash brings mining into the digital age-making it social, sustainable, and open to all. \nHASH token has practical utility across the team’s ecosystem of products.";


const socialLinks = {
  "Twitter": "https://twitter.com/HashCoinFarm",
  "Telegram News": "https://t.me/HashCoinNews",
  "Telegram Chat": "https://t.me/ChainInside/524",
  "Discord": "https://discord.com/invite/D55sWhNgcb",
  "Medium": "https://medium.com/@mininghash",
  "LinkedIn": "https://www.linkedin.com/products/lookhook-mining-hash/",
  "Github": "https://github.com/LookHookInfo/hashcoin",
  "Whitepaper": "https://hashcoin.farm/paper",
  "BitcoinTalk": "https://bitcointalk.org/index.php?topic=5561907",
};

const exchanges = {
  "Uniswap USDC": "https://app.uniswap.org/explore/pools/base/0x9ab05414f0a3872a78459693f3e3c9ea3f0d6e71",
  "Uniswap ETH": "https://app.uniswap.org/explore/pools/base/0x272ebdef2a48efba45135b9db30fc8d8e51e4bbeb47ba287e8754f1c3f9f4534",
};

const blockExplorers = {
  "Basescan": "https://basescan.org/token/0xa9b631abcc4fd0bc766d7c0c8fcbf866e2bb0445",
  "Blockscout": "https://base.blockscout.com/address/0xA9B631ABcc4fd0bc766d7C0C8fCbf866e2bB0445",
};

const articles = {
    "Medium": "https://medium.com/@mininghash",
    "Mirror 1": "https://mirror.xyz/0x10a06aff00967f9dEa148d64302F799d9d239173/b5dJfLDBZItrwkS7AW2qYSGTez1lJuJ_sqwRWDfXBmw",
    "LinkedIn": "https://www.linkedin.com/pulse/one-year-later-mining-hash-look-hook-rise-ecosystem-lookhook-nwxwf",
    "Substack": "https://open.substack.com/pub/chaininside525790/p/hash-is-now-on-debank-a-major-milestone",
    "Mirror 2": "https://mirror.xyz/0xCC6261C7F9C29A1F69e4021c83AA20a02a225a84/_MEqDTaPBMDj86s9PT7iBvmgigylj4WjFhHF6DpFlq0?referrerAddress=0xCC6261C7F9C29A1F69e4021c83AA20a02a225a84",
    "Read.cash": "https://read.cash/@Coinmart/plasma-cat-and-catsh-turning-meme-energy-into-web3-utility-98215e6d",
};

const investors = {
    "Konstantin Moiseev": "https://www.linkedin.com/in/konstantin-moiseev/",
};

const apiUrls = {
    "Circulating Supply": "https://api-hash-dex-guru.vercel.app/api/circulating_supply",
    "Balances": "https://api-hash-dex-guru.vercel.app/api/balances",
};


const devTeam = "https://lookhook.info";

export function ListingInfo() {
  const logoUrl = '/assets/Hash coin 200.png';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = logoUrl;
    link.download = 'Mining_Hash_Logo_200x200.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderLinkList = (title: string, links: { [key: string]: string }): React.ReactNode => (
    <Box mt="lg">
        <Title order={5} mb="sm">{title}</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            {Object.entries(links).map(([name, url]: [string, string]) => (
                <Group key={name} wrap="nowrap">
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Text size="sm" truncate>{name}</Text>
                    </a>
                    <CopyButton value={url} timeout={2000}>
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                                <ActionIcon variant="subtle" color={copied ? 'teal' : 'blue.6'} onClick={copy}>
                                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </CopyButton>
                </Group>
            ))}
        </SimpleGrid>
    </Box>
);


  return (
    <Box mb="md">
      <Accordion variant="separated" defaultValue="listing-info">
        <Accordion.Item value="listing-info">
          <Accordion.Control>
            <Title order={4}>Listing Information</Title>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" mb="md">
                A fair-launch token deployed on Thirdweb (15 May 2024). Smart contract ownership is renounced.
            </Text>
            <Group mb="md">
                <Title order={5}>Mini Description:</Title>
                <CopyButton value={miniDescription} timeout={2000}>
                    {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                            <ActionIcon variant="subtle" color={copied ? 'teal' : 'blue.6'} onClick={copy}>
                                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                            </ActionIcon>
                        </Tooltip>
                    )}
                </CopyButton>
            </Group>
            <Blockquote color="blue" cite={`- ${miniDescription.length} characters`} icon={<IconInfoCircle />} mb="xl">
                {miniDescription}
            </Blockquote>

            <Group mb="md">
                <Title order={5}>Full Description:</Title>
                <CopyButton value={fullDescription} timeout={2000}>
                    {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                            <ActionIcon variant="subtle" color={copied ? 'teal' : 'blue.6'} onClick={copy}>
                                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                            </ActionIcon>
                        </Tooltip>
                    )}
                </CopyButton>
            </Group>
            <Blockquote color="blue" cite={`- ${fullDescription.length} characters`} icon={<IconInfoCircle />} mb="xl" style={{ whiteSpace: 'pre-line' }}>
                {fullDescription}
            </Blockquote>

            <Group mb="xl">
                <Button onClick={handleDownload}>
                  Download Logo 200x200
                </Button>
                <Button
                  component="a"
                  href="https://drive.google.com/drive/folders/1uStwAUZ2e179CQf9ZPTbVvdDW9DbxjuF?usp=drive_link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Banners
                </Button>
            </Group>
            
            <Divider my="lg" label="Project Links" labelPosition="center" />

            {renderLinkList("Social Media & Docs", socialLinks)}
            {renderLinkList("Block Explorers", blockExplorers)}
            {renderLinkList("Supported Exchanges", exchanges)}
            
            <Divider my="lg" label="Media & Community" labelPosition="center" />

            {renderLinkList("Articles", articles)}
            {renderLinkList("Investors", investors)}
            
            <Divider my="lg" label="Technical" labelPosition="center" />
            
            {renderLinkList("API", apiUrls)}
            
            <Box mt="lg">
                <Title order={5} mb="sm">Dev Team</Title>
                <Group>
                    <a href={devTeam} target="_blank" rel="noopener noreferrer">{devTeam}</a>
                    <CopyButton value={devTeam} timeout={2000}>
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                                <ActionIcon variant="subtle" color={copied ? 'teal' : 'blue.6'} onClick={copy}>
                                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </CopyButton>
                </Group>
            </Box>

          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  );
}
