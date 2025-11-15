export interface RoadmapItem {
  status: 'completed' | 'partial' | 'planned';
  text: string;
  subItems?: string[];
  address?: string;
}

export interface RoadmapPhase {
  icon: string;
  title: string;
  items: RoadmapItem[];
}

export const roadmapData: RoadmapPhase[] = [
  {
    icon: '🔵',
    title: 'Phase 1 - Concept Development and Launch',
    items: [
      {
        status: 'completed',
        text: 'Idea and Project Architecture',
        subItems: [
          'Formation of the Mining Hash concept as NFT-based mining.',
          'Definition of mining mechanics through NFT inventory and community activities.',
        ],
      },
      {
        status: 'completed',
        text: 'Launch of the $HASH Token',
        address: '0xa9b631abcc4fd0bc766d7c0c8fcbf866e2bb0445',
        subItems: [
          'Token release with a fixed supply.',
          'Tokenomics structure:',
          '• 80% - mined through NFT inventory',
          '• 20% - ecosystem growth via quests, contests, and development',
        ],
      },
      {
        status: 'completed',
        text: 'EVM Integration',
        subItems: [
          'Deployment of smart contracts on the Base network.',
          'Configuration of the Mining Hash DApp and its reward distribution system.',
        ],
      },
      {
        status: 'completed',
        text: 'Creation of the HASH Ecosystem',
        subItems: [
          'First Look Hook ecosystem products integrated with $HASH.',
          'Launch of the first NFT collection, Plasma Cat, with upcoming quests.',
        ],
      },
    ],
  },
  {
    icon: '🟣',
    title: 'Phase 2 - Community, Roles, and Early Engagement',
    items: [
      {
        status: 'completed',
        text: 'Discord Community Structure',
        subItems: [
          'Introduction of roles (#Hold, #Farm, #Pool, #Early, #Tips).',
          'Development of mechanics for guild participants.',
        ],
      },
      {
        status: 'partial',
        text: 'NFT Mining Distribution',
        subItems: [
          'Airdrop of NFT inventory for early supporters.',
          'Setup of base mining speeds.',
        ],
      },
      {
        status: 'partial',
        text: 'Integrations and Analytics',
        subItems: [
          'Listings on CoinGecko, CoinMarketCap, and other aggregators.',
          'Token analytics and mining statistics added.',
        ],
      },
      {
        status: 'completed',
        text: 'Ambassador Program',
        subItems: [
          'Launch of the #Amba role.',
          'Reward system for active content creators.',
        ],
      },
    ],
  },
  {
    icon: '🟠',
    title: 'Phase 3 - Expansion and Gamification',
    items: [
      {
        status: 'completed',
        text: 'Quest System and Activities',
        subItems: [
          'Campaigns launched on Intract, Guild.xyz, and Galxe.',
          'Missions, roles, and reward mechanics created for participants.',
        ],
      },
      {
        status: 'completed',
        text: 'First Product Launches',
        subItems: [
          'Name Service for multilingual usernames.',
          'Plasma Cat NFT claim page.',
        ],
      },
      {
        status: 'planned',
        text: 'Flagship NFT Collection',
        subItems: [
          'TAG Collection with ecosystem utility.',
          'Development of NFT roles and mining boosts.',
        ],
      },
      {
        status: 'partial',
        text: 'Airdrops and Community Rewards',
        subItems: [
          'Multi-phase claim pages for early users.',
          'Engagement incentives for attracting new participants.',
        ],
      },
    ],
  },
  {
    icon: '🟢',
    title: 'Phase 4 - Product Development and Infrastructure Growth',
    items: [
      {
        status: 'planned',
        text: 'New DApps and Features',
        subItems: [
          'Hash Market - event-based prediction and staking market.',
          'DeVote - governance system for active community members.',
        ],
      },
      {
        status: 'partial',
        text: 'Strategic Ecosystem Products',
        subItems: [
          'Lock-staking with fixed APR and duration.',
          'Development of a collateral-backed DeFi stablecoin.',
        ],
      },
      {
        status: 'completed',
        text: 'Look Hook Team Platform',
        subItems: [
          'Ecosystem information hub.',
          'Hook Capital - transparent reserve fund of the team.',
        ],
      },
      {
        status: 'planned',
        text: 'Global Expansion',
        subItems: [
          'Token Launchpad with NFT-based mining integration.',
          'Hash Chain - the project’s own blockchain.',
        ],
      },
    ],
  },
];

export const roadmapHeader = {
  title: 'Mining Hash - Roadmap 2024–2026',
  subtitle: 'Updated version based on current progress and the development plans of the Look Hook ecosystem.',
  legend: '✅ = completed ✔️ = partially completed ☑️ = planned',
};

export const roadmapFooter = {
  icon: '✔️',
  title: 'Conclusion',
  text: 'Mining Hash is evolving from a simple NFT-mining concept into a complete Web3 ecosystem. The project combines gamification, economic incentives, and sustainable tokenomics. Each phase brings the project closer to becoming a major platform for green, accessible, and transparent mining.',
};
