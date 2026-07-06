# Mining Hash (MinigHash)

**Mining Hash** is a Web3 dApp on **Base** (Ethereum L2) combining NFT-based $HASH mining with **GemFun** — a meme token launcher with bonding curves.

Built by **Look Hook Dev**.

---

## Features

### 🛠 Shop (`/`)
- Buy 6 tiers of NFT mining tools (GPU, ASIC, FARM, RIG, RACK, CONTAINER)
- Stake NFTs → passive $HASH mining
- Unstake and claim rewards
- Claim Galxe rewards and FarmRole badge

### 🪙 Coin (`/coin`)
- $HASH tokenomics: total supply, circulating supply, distribution
- Live balances of 19 strategic wallets
- Donut chart breakdown

### 💎 Gem (`/gem`)
- **GemFun** — meme token launcher with bonding curve
- Browse trending tokens (by market cap, holders, mining, migrated)
- Buy/sell meme tokens
- Mine $HASH inside each token
- Create your own token (with logo upload via IPFS Pinata)

### 🗺 Road (`/road`)
- Project roadmap 2024–2026

### 📄 Paper (`/paper`)
- Whitepaper & technical documentation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| UI | Mantine UI 8 + Mantine Charts |
| Web3 | wagmi + viem + RainbowKit |
| Network | Base (chain ID 8453) |
| Contracts | Solidity (aggregators for batch reads) |
| IPFS | Pinata |
| Hosting | Vercel (SPA with index.html rewrite) |

---

## Local Development

### Prerequisites
- Node.js >= 18
- npm or yarn

### Setup

```bash
npm install
# or
yarn
```

### Environment Variables

Copy `.env` to the project root (it already exists). It contains:

| Variable | Description |
|---|---|
| `VITE_ALCHEMY_BASE_RPC_URL` | RPC for coreClient (Shop, Coin) |
| `VITE_ALCHEMY2_BASE_RPC_URL` | RPC for gemClient (Gem page) |
| `VITE_ALCHEMY3_BASE_RPC_URL` | RPC for memeClient (wallet balances) |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID |
| `VITE_PINATA_JWT` | JWT for IPFS image uploads |

### Start Dev Server

```bash
npm run dev
```

Open `http://localhost:3000`.

### Production Build

```bash
npm run build
npm run preview
```

---

## RPC Load Distribution

Three RPC clients split the load by vertical:

| Client | Purpose | Interval |
|---|---|---|
| **coreClient** (RPC1) | Shop aggregator (`getShopFeed`, `getShopPrices`) + Coin (`getCoinFeed`) | every 60s |
| **gemClient** (RPC2) | Gem aggregator (`getFeed*`, `getDetail`, `getCardFeed`, `getLogs`) + blocks | every 20–60s |
| **memeClient** (RPC3) | Multicall of 19 HASH wallet balances | every 60s |
| **Wagmi fallback** (all 3) | User wallet transactions | on demand |

---

## Contracts on Base

| Contract | Address |
|---|---|
| GemFun (meme token factory) | `0xea4831Df95738d6Ef0f2b47e5345fa75A2E59e86` |
| Hash Coin ($HASH) | `0xA9B631ABcc4fd0bc766d7C0C8fCbf866e2bB0445` |
| Tools (NFT mining tools) | `0x13CE10a3e09FA8000BA8A13fCbe8813f476584e7` |
| Staking | `0xBBc4f75874930EB4d8075FCB3f48af2535A8E848` |
| Core Aggregator | `0xEA894566417d222F8246fD5Af392fA08B0b8b440` |
| Gem Aggregator | `0x198B5E5Cd556f8A6c272239514A5eB359cb908C8` |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

---

## Project Structure

```
src/
├── App.tsx              # Router (lazy-loaded views)
├── main.tsx             # Entry point (Wagmi + RainbowKit + Mantine)
├── components/
│   ├── gem/             # TradePanel, MiningPanel, TokenAbout
│   ├── AppLayout.tsx    # Layout with header/navbar
│   ├── GemTokenCard.tsx
│   ├── GemTokenDetails.tsx
│   ├── GemTopMarketCap.tsx
│   ├── ToolCard.tsx     # NFT tool card
│   └── LaunchTokenModal.tsx
├── hooks/
│   ├── useAggregatorClient.ts  # 3 RPC clients (core/gem/meme)
│   ├── useContractRead.ts      # Generic polling hook
│   ├── useCoreAggregator.ts    # Shop/Coin feeds
│   ├── useGemAggregator.ts     # Gem feeds
│   ├── useGemFun.ts            # Gem filters & pagination
│   ├── useTokenLogic.ts        # Token details
│   └── useShopLogic.ts         # Shop logic
├── lib/
│   ├── abi/             # Contract JSON ABIs
│   └── wagmi/           # wagmi config + tx helper
├── utils/
│   ├── constants.ts     # Contract addresses, configs
│   ├── contracts.ts     # ContractRef objects
│   └── ipfs.ts          # IPFS upload via Pinata
└── views/
    ├── Shop.tsx
    ├── Coin.tsx
    ├── Gem.tsx
    ├── Road.tsx
    └── Paper.tsx
```

---

## Security

- `.env` is in `.gitignore` — secrets never reach the repo
- All keys (Ankr, WalletConnect, Pinata JWT) are stored locally and on Vercel only
- On Vercel, set env vars via Dashboard → Settings → Environment Variables

---

## Deploy to Vercel

1. Connect your repository to Vercel
2. Add all `VITE_*` environment variables from `.env`
3. Vercel runs `vite build` automatically and serves static files
4. `vercel.json` is pre-configured for SPA routing
