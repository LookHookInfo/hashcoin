export const CURVE_SUPPLY = 300_000_000n * 10n ** 18n;
export const MINING_RESERVE = 300_000_000n * 10n ** 18n;

export const CONTRACT_ADDRESSES = {
    GEM_FUN: "0xea4831Df95738d6Ef0f2b47e5345fa75A2E59e86",
    HASH_COIN: "0xA9B631ABcc4fd0bc766d7C0C8fCbf866e2bB0445",
    TOOLS: "0x13CE10a3e09FA8000BA8A13fCbe8813f476584e7",
    STAKING: "0xBBc4f75874930EB4d8075FCB3f48af2535A8E848",
    FARMROLE: "0xFB284cA86D797DA6f9176E51cb7836C2794111e5",
    GALXE: "0x5Ce07C4b826094F932940571512664EED26412f7",
    NAME: "0xA8e00E2ca8b183Edb7EbB6bD7EeBB90047416F95",
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

export const AGGREGATOR_ADDRESSES = {
    CORE: "0xEA894566417d222F8246fD5Af392fA08B0b8b440",
    GEM: "0x198B5E5Cd556f8A6c272239514A5eB359cb908C8",
};

export const REFRESH_INTERVALS = {
    SHOP: 60_000,
    WALLET: 60_000,
    GEM_LIST: 60_000,
    GEM_DETAIL: 30_000,
    COIN: 60_000,
};

export const SLIPPAGE = {
    BUY_BPS: 11_000n,
    SELL_BPS: 9_000n,
    BASE: 10_000n,
};

export const TOOL_METADATA = [
    { id: 0, name: "GPU",       description: "Graphics processing unit.",   hashPower: 0.042,   image: "/assets/tools/0.png" },
    { id: 1, name: "ASIC",      description: "Application-specific integrated circuit.", hashPower: 0.42,    image: "/assets/tools/1.png" },
    { id: 2, name: "FARM",      description: "Mining farm setup.",          hashPower: 2.42,    image: "/assets/tools/2.png" },
    { id: 3, name: "RIG",       description: "Mining rig system.",          hashPower: 0.335,   image: "/assets/tools/3.png" },
    { id: 4, name: "RACK",      description: "Server rack miner.",          hashPower: 5.05,    image: "/assets/tools/4.png" },
    { id: 5, name: "CONTAINER",  description: "Container mining facility.",  hashPower: 24.2,    image: "/assets/tools/5.png" },
] as const;

export const HASH_WALLET_ADDRESSES = [
    "0xbbc4f75874930eb4d8075fcb3f48af2535a8e848",
    "0xfbd020556247446de4d528d86f25584536978aef",
    "0xa45b36062b50cde45f9dc72f6ea805aae0b3f21c",
    "0xd9cefbff9dfa7ae9438d1fc227982048af270e2d",
    "0x9ab05414f0a3872a78459693f3e3c9ea3f0d6e71",
    "0x498581ff718922c3f8e6a244956af099b2652b2b",
    "0xfd69e0dfa9a12c43b563a1903092befb5e71db0e",
    "0x241ca211bae9b84b675ffe0ae3e7cfdfdda5c24d",
    "0xb3a9fb099c0733281722e23004c2923d3318fd22",
    "0xa2116b995a314c0f5bcb67c32b62d5e2f17a5424",
    "0x3e65390edd46ec98f792d0122ed4f1a105bab281",
    "0x9951b4db6198b04e5b4ca6684a8e7d1c2148dd6b",
    "0x3eb421c3fc1bfcd50fe539a5f92d01bb74aa27e2",
    "0x14fa3fa097fcff7439c7378d8deaa40c8d1e6b15",
    "0xec655d008c76eb606d7c79e8a3405c7eb247b653",
    "0x2253c002902c1cb63485bcd026617e3cff813c13",
    "0x33de46ccb070936f64fb8bb0fc6c4495a29a4602",
    "0x5ce07c4b826094f932940571512664eed26412f7",
    "0xea4831df95738d6ef0f2b47e5345fa75a2e59e86",
];

export const HASH_WALLET_LABELS: Record<string, string> = {
    "0xbbc4f75874930eb4d8075fcb3f48af2535a8e848": "Mining Contract",
    "0xfbd020556247446de4d528d86f25584536978aef": "Storage Address",
    "0xa45b36062b50cde45f9dc72f6ea805aae0b3f21c": "Community Address",
    "0xd9cefbff9dfa7ae9438d1fc227982048af270e2d": "Team Address",
    "0x9ab05414f0a3872a78459693f3e3c9ea3f0d6e71": "Uniswap v3 Pool",
    "0x498581ff718922c3f8e6a244956af099b2652b2b": "Uniswap v4 Pool",
    "0xfd69e0dfa9a12c43b563a1903092befb5e71db0e": "Lock Staking",
    "0x241ca211bae9b84b675ffe0ae3e7cfdfdda5c24d": "NFT Role Award",
    "0xb3a9fb099c0733281722e23004c2923d3318fd22": "X Role Award",
    "0xa2116b995a314c0f5bcb67c32b62d5e2f17a5424": "Welcome Role Award",
    "0x3e65390edd46ec98f792d0122ed4f1a105bab281": "Stake Role Award",
    "0x9951b4db6198b04e5b4ca6684a8e7d1c2148dd6b": "Name Role Award",
    "0x3eb421c3fc1bfcd50fe539a5f92d01bb74aa27e2": "Heli reward",
    "0x14fa3fa097fcff7439c7378d8deaa40c8d1e6b15": "Vote reward",
    "0xec655d008c76eb606d7c79e8a3405c7eb247b653": "Voting contract",
    "0x2253c002902c1cb63485bcd026617e3cff813c13": "Staking $CATSH",
    "0x33de46ccb070936f64fb8bb0fc6c4495a29a4602": "Lambo reward",
    "0x5ce07c4b826094f932940571512664eed26412f7": "Farm Role Award",
    "0xea4831df95738d6ef0f2b47e5345fa75a2e59e86": "GemFun Contract",
};

export const HASH_WALLET_EXPLANATIONS: Record<string, string> = {
    "Mining Contract": "Available for mining.",
    "Storage Address": "Strategic partnerships.",
    "Community Address": "Airdrops, testnets, quests, and initiatives.",
    "Team Address": "Liquidity, motivation, and additional rewards.",
    "Uniswap v3 Pool": "Liquidity on Uniswap v3.",
    "Uniswap v4 Pool": "Liquidity on Uniswap v4.",
    "Lock Staking": "Lock Staking",
    "GemFun Contract": "Meme-token launcher and bonding curve contract.",
    "NFT Role Award": "Rewards for NFT holders.",
    "X Role Award": "Rewards for Twitter (X) activities.",
    "Welcome Role Award": "Welcome bonuses for new users.",
    "Stake Role Award": "Staking-related rewards.",
    "Name Role Award": "Rewards for naming activities.",
    "Heli reward": "Special Heli rewards.",
    "Vote reward": "Governance voting rewards.",
    "Voting contract": "Ecosystem governance contract.",
    "Staking $CATSH": "Staking for $CATSH tokens.",
    "Lambo reward": "Special Lambo rewards.",
    "Farm Role Award": "Rewards for farming activities.",
};
