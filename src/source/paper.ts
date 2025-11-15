export interface PaperSection {
  title: string;
  content: (string | { type: 'table'; headers: string[]; rows: string[][] })[];
  addresses?: { title: string; val: string }[];
  icon?: string;
}

export const paperHeader = {
  title: 'Mining Hash - White Paper',
  subtitle: 'Official document on ecosystem architecture, tokenomics, and NFT-based mining',
};

export const paperData: PaperSection[] = [
  {
    title: 'Introduction',
    content: [
      'Mining Hash is a “green” Web3 mining ecosystem where the $HASH token is generated not through computational power, but through NFT inventory and user activity.',
      'Developed by Look Hook Dev, a Web3-focused team building decentralized products since 2023, Mining Hash aims to make mining:',
      '• Accessible',
      '• Environmentally friendly',
      '• Fair',
      '• Sustainable',
      'The project features no presales, no VC allocation, and no hidden emissions, ensuring a transparent, community-oriented distribution model.',
    ],
  },
  {
    title: 'Architecture and Smart Contracts',
    content: [
      'Mining Hash runs on the Base network (Ethereum L2).',
      'Key contracts:',
    ],
    addresses: [
      { title: 'Inventory Contract', val: '0x13CE10a3e09FA8000BA8A13fCbe8813f476584e7' },
      { title: 'Rewards Contract', val: '0xA9B631ABcc4fd0bc766d7C0C8fCbf866e2bB0445' },
      { title: 'Staking Contract', val: '0xBBc4f75874930EB4d8075FCB3f48af2535A8E848' },
    ],
  },
  {
    title: '$HASH Tokenomics',
    content: [
      '• Total supply: 10,000,000,000 $HASH',
      '• Distribution is fixed and permanently locked in smart contracts',
      {
        type: 'table',
        headers: ['Allocation', 'Share', 'Purpose'],
        rows: [
          ['Mining', '80%', 'NFT-based mining rewards'],
          ['Ecosystem Development', '20%', 'Campaigns, Dev, liquidity, partnerships'],
        ],
      },
      'No private sales, no VCs, no presales - distribution is based solely on mining and ecosystem activity.',
    ],
  },
  {
    title: 'NFT Mining Mechanics',
    content: [
      'Mining is performed by staking NFT devices of varying tiers.',
      {
        type: 'table',
        headers: ['NFT', 'Price', 'Mining Speed'],
        rows: [
          ['GPU', '$1.99', '0.042 HASH/hr'],
          ['ASIC', '$9.50', '0.42 HASH/hr'],
          ['FARM', '$29.20', '2.42 HASH/hr'],
          ['RIG', '$14.99', '0.335 HASH/hr'],
          ['RACK', '$109.50', '5.05 HASH/hr'],
          ['CONTAINER', '$290', '24.2 HASH/hr'],
        ],
      },
      'Mining Process:',
      '1. Acquire NFT equipment',
      '2. Stake inside the DApp',
      '3. Earn $HASH rewards in real time',
      'Users can withdraw NFTs, stop mining, sell equipment, or claim rewards at any time.',
    ],
  },
  {
    title: 'Revenue Model From NFT Sales',
    content: [
      'All revenue from NFT sales goes directly to the team’s operational address and is used exclusively for executing the public roadmap, including:',
      '• Product development & maintenance',
      '• Liquidity support',
      '• Creation of new DApps',
      '• Infrastructure & backend services',
      '• User incentives and quests',
      '• Marketing & ecosystem growth',
      '• Operational expenses',
      'Funds are fully transparent on-chain and not distributed to outside investors.',
    ],
  },
  {
    title: 'Mining Hash Ecosystem',
    content: [
      'Mining Hash is part of the Look Hook Ecosystem, which includes:',
      '• NFT collections & claim pages',
      '• Lock-staking & mining contracts',
      '• DApps: Name Service, Hash Market, DeVote',
      '• Community integrations: Guild, Intract, Galxe',
      '• Media partnerships: creators & crypto publishers',
      '• Hook Capital: on-chain transparent reserve fund',
      'Each product adds utility and strengthens $HASH token value.',
    ],
  },
  {
    title: 'Security and Transparency Principles',
    content: [
      '• Fully open smart contracts',
      '• Fixed tokenomics',
      '• No presale or private allocation',
      '• No hidden emissions or mint functions',
      '• On-chain reserves & revenue flows',
      '• Fair distribution through mining & activity',
    ],
  },
  {
    icon: '✔️',
    title: 'Conclusion',
    content: [
      'Mining Hash introduces a new era of Web3 mining - accessible, eco-friendly, transparent, and sustainable. The ecosystem is built to grow, expand utilities, and remain relevant long-term. Partnerships, integrations, and listings are actively welcome.',
    ],
  },
];