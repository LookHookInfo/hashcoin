# Mining Hash Game

This project is a "Mining Hash Game" application built with React and powered by the Thirdweb Framework. It provides a platform for users to interact with a simulated mining environment, stake NFTs, and earn $HASH tokens.

## Core Functionality

*   **NFT-Based Mining:** The central mechanic involves users staking NFT devices to mine and earn $HASH tokens. Different NFTs offer varying mining speeds.
*   **$HASH Tokenomics:** The project features a fixed supply $HASH token with a clear distribution model: 80% for mining rewards and 20% for ecosystem development.
*   **Web3 Wallet Integration:** Seamless connection to Web3 wallets (e.g., MetaMask) via Thirdweb for on-chain interactions.
*   **Name Service:** Users can register unique names within the ecosystem, potentially with discounts, by paying in $HASH tokens.
*   **Comprehensive Documentation:** Integrated White Paper and Roadmap views provide transparent details on the project's architecture, tokenomics, NFT mechanics, and future development plans.

## How It Works

1.  **Connect Wallet:** Users begin by connecting their Web3 wallet through the `Connect Wallet` button, enabling interaction with the blockchain.
2.  **Acquire & Stake NFTs:** Users can acquire NFT mining devices (likely through the `Shop` view). These NFTs are then staked within the DApp to start earning $HASH tokens.
3.  **Earn $HASH Tokens:** Staked NFTs generate $HASH tokens in real-time, contributing to the user's mining pool balance.
4.  **Interact with Contracts:** The application facilitates various on-chain interactions, such as approving token spending and registering names, all powered by Thirdweb.
5.  **Explore Project Details:** The `Paper` and `Road` sections offer in-depth information about the project's vision, technical specifications, and development milestones.

## Key Contracts

The project operates on the **Base network (Ethereum L2)** and interacts with several key smart contracts:

*   **Inventory Contract:** Manages the NFT devices used for mining.
*   **Rewards Contract (Coin Contract):** Handles the distribution of $HASH token rewards.
*   **Staking Contract:** Facilitates the staking of NFTs for mining.
*   **Name Contract:** Manages the registration and ownership of names within the ecosystem.
*   **Hashcoin Contract:** Represents the $HASH token itself, used for approvals and transfers.

*(Note: Specific contract addresses can be found within the application's White Paper section.)*

## Technologies Used

*   **Frontend:** React, TypeScript
*   **UI Library:** Mantine (with `@mantine/core`, `@mantine/charts`, `@mantine/hooks`)
*   **Web3:** Thirdweb Framework (`thirdweb/react`, `viem`)
*   **Routing:** React Router DOM
*   **State Management/Data Fetching:** `@tanstack/react-query`
*   **Build Tool:** Vite
*   **Charting:** Recharts
*   **Icons:** `@tabler/icons-react`

## Setup and Installation

To get this project up and running on your local machine, follow these steps:

### Prerequisites

*   Node.js (v18 or higher recommended)
*   Yarn or npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd hashcoin
    ```
2.  **Install dependencies:**
    ```bash
    yarn install
    # or
    npm install
    ```

### Running the Development Server

To start the development server:

```bash
yarn dev
# or
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Building for Production

To build the application for production:

```bash
yarn build
# or
npm run build
```

This will create a `dist` directory with the production-ready files.

### Linting

To run the linter:

```bash
yarn lint
# or
npm run lint
```

## Developer

This project was developed by LookHook.info.

## Feel Free to Use This App Anyway

We encourage you to use, modify, and distribute our project. Whether you're looking to integrate it into your own projects, learn from it, or just play around with it, we welcome you to do so. Please remember to credit the original project if you find it helpful.

## Technologies Used

*   **Frontend:** React, TypeScript
*   **UI Library:** Mantine (with `@mantine/core`, `@mantine/charts`, `@mantine/hooks`)
*   **Web3:** Thirdweb Framework (`thirdweb/react`, `viem`)
*   **Routing:** React Router DOM
*   **State Management/Data Fetching:** `@tanstack/react-query`
*   **Build Tool:** Vite
*   **Charting:** Recharts
*   **Icons:** `@tabler/icons-react`

## Setup and Installation

To get this project up and running on your local machine, follow these steps:

### Prerequisites

*   Node.js (v18 or higher recommended)
*   Yarn or npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd hashcoin
    ```
2.  **Install dependencies:**
    ```bash
    yarn install
    # or
    npm install
    ```

### Running the Development Server

To start the development server:

```bash
yarn dev
# or
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Building for Production

To build the application for production:

```bash
yarn build
# or
npm run build
```

This will create a `dist` directory with the production-ready files.

### Linting

To run the linter:

```bash
yarn lint
# or
npm run lint
```

## Developer

This project was developed by LookHook.info.

## Feel Free to Use This App Anyway

We encourage you to use, modify, and distribute our project. Whether you're looking to integrate it into your own projects, learn from it, or just play around with it, we welcome you to do so. Please remember to credit the original project if you find it helpful.