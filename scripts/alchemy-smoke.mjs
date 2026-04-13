import { createPublicClient, http, parseAbi, formatEther, formatUnits } from "viem";

const DEFAULT_RPC_URL =
  process.env.ALCHEMY_BASE_RPC_URL || process.env.VITE_ALCHEMY_BASE_RPC_URL;

if (!DEFAULT_RPC_URL) {
  console.error(
    "Set ALCHEMY_BASE_RPC_URL or VITE_ALCHEMY_BASE_RPC_URL before running this script.",
  );
  process.exit(1);
}

const ADDRESSES = {
  gemfun: "0x9A961648729eBCC2aa5388f6ddf391Fc64FDb542",
  tools: "0x13CE10a3e09FA8000BA8A13fCbe8813f476584e7",
  staking: "0xBBc4f75874930EB4d8075FCB3f48af2535A8E848",
  hash: "0x81814Cd2EC975eAc745578066963DE4f8A7De293",
  usdc: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  nameRegistry: "0xA8e00E2ca8b183Edb7EbB6bD7EeBB90047416F95",
  farmRole: "0xFB284cA86D797DA6f9176E51cb7836C2794111e5",
  galxeNftFarm: "0x5Ce07C4b826094F932940571512664EED26412f7",
  testHashFaucet: "0x071bfB5a1e56215Ba23Dcf23955f89065436a7D4",
};

const client = createPublicClient({
  transport: http(DEFAULT_RPC_URL),
});

const gemfunAbi = parseAbi([
  "function getTokensPage(uint256 offset, uint256 limit) view returns (address[])",
  "function getTokenFullData(address token) view returns ((string name, string symbol, bytes32 logoHash, string description) core, (string website, string twitter, string telegram, string guild) meta, address creator, uint256[5] stats)",
  "function getAccountData(address tokenAddr, address user) view returns (uint256 walletBalance, uint256 totalHashrate, uint256 pendingRewards, uint256[6] stakedItems)",
  "function rates(uint256) view returns (uint256)",
  "event Trade(address indexed token, address indexed user, bool isBuy, uint256 hashAmt, uint256 memeAmt)",
]);

const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

const toolsAbi = parseAbi([
  "function nextTokenIdToMint() view returns (uint256)",
  "function uri(uint256 tokenId) view returns (string)",
  "function claimCondition(uint256 tokenId) view returns (uint256 startId, uint256 count)",
  "function getClaimConditionById(uint256 tokenId, uint256 conditionId) view returns ((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata) condition)",
  "function balanceOf(address owner, uint256 id) view returns (uint256)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
]);

const nameAbi = parseAbi([
  "function getPrimaryName(address user) view returns (string)",
]);

const roleAbi = parseAbi([
  "function canMint(address user) view returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
]);

const galxeAbi = parseAbi([
  "function getUserBalances(address user) view returns (uint256 nftBalance, uint256 badgeBalance, uint256 hashBalance, bool hasClaimed)",
  "function contractHashBalance() view returns (uint256)",
  "function REWARD_AMOUNT() view returns (uint256)",
]);

const faucetAbi = parseAbi([
  "function hasClaimed(address user) view returns (bool)",
  "function getContractBalance() view returns (uint256)",
  "function CLAIM_AMOUNT() view returns (uint256)",
]);

function parseAlchemyRestBase(rpcUrl) {
  const url = new URL(rpcUrl);
  const key = url.pathname.split("/").filter(Boolean).at(-1);
  if (!key) {
    throw new Error(`Could not derive API key from ${rpcUrl}`);
  }
  return `${url.protocol}//${url.host}/nft/v3/${key}`;
}

async function callAlchemyRpc(method, params) {
  const response = await fetch(DEFAULT_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  const json = await response.json();
  if (json.error) {
    throw new Error(`${method} failed: ${json.error.message}`);
  }
  return json.result;
}

async function callAlchemyNftApi(path, query) {
  const url = new URL(`${parseAlchemyRestBase(DEFAULT_RPC_URL)}/${path}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status}`);
  }
  return response.json();
}

async function main() {
  const [chainId, blockNumber, tokenAddresses] = await Promise.all([
    client.getChainId(),
    client.getBlockNumber(),
    client.readContract({
      address: ADDRESSES.gemfun,
      abi: gemfunAbi,
      functionName: "getTokensPage",
      args: [0n, 5n],
    }),
  ]);

  const sampleToken = tokenAddresses[0];
  const fullData = await client.readContract({
    address: ADDRESSES.gemfun,
    abi: gemfunAbi,
    functionName: "getTokenFullData",
    args: [sampleToken],
  });
  const sampleWallet = fullData[2];

  const [
    accountData,
    rates,
    hashInfo,
    usdcInfo,
    hashBalance,
    hashAllowance,
    primaryName,
    nextTokenIdToMint,
    uri0,
    claimConditionRange,
    toolBalance0,
    approvedForStaking,
    approvedForGemfun,
    roleCanMint,
    roleBalance,
    galxeUserBalances,
    galxeContractHashBalance,
    galxeRewardAmount,
    faucetHasClaimed,
    faucetContractBalance,
    faucetClaimAmount,
    recentTradeLogs,
    alchemyTokenBalances,
    alchemyHashMetadata,
    alchemyHashAllowance,
    alchemyTransfersIn,
    nftCollectionSample,
    nftOwnersSample,
  ] = await Promise.all([
    client.readContract({
      address: ADDRESSES.gemfun,
      abi: gemfunAbi,
      functionName: "getAccountData",
      args: [sampleToken, sampleWallet],
    }),
    Promise.all(
      [0n, 1n, 2n, 3n, 4n, 5n].map((tokenId) =>
        client.readContract({
          address: ADDRESSES.gemfun,
          abi: gemfunAbi,
          functionName: "rates",
          args: [tokenId],
        }),
      ),
    ),
    Promise.all([
      client.readContract({
        address: ADDRESSES.hash,
        abi: erc20Abi,
        functionName: "name",
      }),
      client.readContract({
        address: ADDRESSES.hash,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      client.readContract({
        address: ADDRESSES.hash,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      client.readContract({
        address: ADDRESSES.hash,
        abi: erc20Abi,
        functionName: "totalSupply",
      }),
    ]),
    Promise.all([
      client.readContract({
        address: ADDRESSES.usdc,
        abi: erc20Abi,
        functionName: "name",
      }),
      client.readContract({
        address: ADDRESSES.usdc,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      client.readContract({
        address: ADDRESSES.usdc,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      client.readContract({
        address: ADDRESSES.usdc,
        abi: erc20Abi,
        functionName: "totalSupply",
      }),
    ]),
    client.readContract({
      address: ADDRESSES.hash,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [sampleWallet],
    }),
    client.readContract({
      address: ADDRESSES.hash,
      abi: erc20Abi,
      functionName: "allowance",
      args: [sampleWallet, ADDRESSES.gemfun],
    }),
    client.readContract({
      address: ADDRESSES.nameRegistry,
      abi: nameAbi,
      functionName: "getPrimaryName",
      args: [sampleWallet],
    }),
    client.readContract({
      address: ADDRESSES.tools,
      abi: toolsAbi,
      functionName: "nextTokenIdToMint",
    }),
    client.readContract({
      address: ADDRESSES.tools,
      abi: toolsAbi,
      functionName: "uri",
      args: [0n],
    }),
    client.readContract({
      address: ADDRESSES.tools,
      abi: toolsAbi,
      functionName: "claimCondition",
      args: [0n],
    }),
    client.readContract({
      address: ADDRESSES.tools,
      abi: toolsAbi,
      functionName: "balanceOf",
      args: [sampleWallet, 0n],
    }),
    client.readContract({
      address: ADDRESSES.tools,
      abi: toolsAbi,
      functionName: "isApprovedForAll",
      args: [sampleWallet, ADDRESSES.staking],
    }),
    client.readContract({
      address: ADDRESSES.tools,
      abi: toolsAbi,
      functionName: "isApprovedForAll",
      args: [sampleWallet, ADDRESSES.gemfun],
    }),
    client.readContract({
      address: ADDRESSES.farmRole,
      abi: roleAbi,
      functionName: "canMint",
      args: [sampleWallet],
    }),
    client.readContract({
      address: ADDRESSES.farmRole,
      abi: roleAbi,
      functionName: "balanceOf",
      args: [sampleWallet],
    }),
    client.readContract({
      address: ADDRESSES.galxeNftFarm,
      abi: galxeAbi,
      functionName: "getUserBalances",
      args: [sampleWallet],
    }),
    client.readContract({
      address: ADDRESSES.galxeNftFarm,
      abi: galxeAbi,
      functionName: "contractHashBalance",
    }),
    client.readContract({
      address: ADDRESSES.galxeNftFarm,
      abi: galxeAbi,
      functionName: "REWARD_AMOUNT",
    }),
    client.readContract({
      address: ADDRESSES.testHashFaucet,
      abi: faucetAbi,
      functionName: "hasClaimed",
      args: [sampleWallet],
    }),
    client.readContract({
      address: ADDRESSES.testHashFaucet,
      abi: faucetAbi,
      functionName: "getContractBalance",
    }),
    client.readContract({
      address: ADDRESSES.testHashFaucet,
      abi: faucetAbi,
      functionName: "CLAIM_AMOUNT",
    }),
    client.getLogs({
      address: ADDRESSES.gemfun,
      event: gemfunAbi[4],
      fromBlock: blockNumber >= 9n ? blockNumber - 9n : 0n,
      toBlock: blockNumber,
    }),
    callAlchemyRpc("alchemy_getTokenBalances", [
      sampleWallet,
      [ADDRESSES.hash, ADDRESSES.usdc],
    ]),
    callAlchemyRpc("alchemy_getTokenMetadata", [ADDRESSES.hash]),
    callAlchemyRpc("alchemy_getTokenAllowance", [
      {
        contract: ADDRESSES.hash,
        owner: sampleWallet,
        spender: ADDRESSES.gemfun,
      },
    ]),
    callAlchemyRpc("alchemy_getAssetTransfers", [
      {
        fromBlock: "0x0",
        toBlock: "latest",
        toAddress: sampleWallet,
        category: ["erc20", "erc721", "erc1155", "external"],
        withMetadata: true,
        maxCount: "0x5",
        excludeZeroValue: false,
      },
    ]),
    callAlchemyNftApi("getNFTsForContract", {
      contractAddress: ADDRESSES.tools,
      withMetadata: true,
      limit: 3,
    }),
    callAlchemyNftApi("getOwnersForContract", {
      contractAddress: ADDRESSES.tools,
      withTokenBalances: true,
    }),
  ]);

  const [claimStartId, claimCount] = claimConditionRange;
  const firstClaimCondition =
    claimCount > 0n
      ? await client.readContract({
          address: ADDRESSES.tools,
          abi: toolsAbi,
          functionName: "getClaimConditionById",
          args: [0n, claimStartId],
        })
      : null;

  const report = {
    rpc: {
      chainId,
      blockNumber: blockNumber.toString(),
    },
    sampleGemToken: {
      address: sampleToken,
      creator: sampleWallet,
      creatorPrimaryName: primaryName,
      core: fullData[0],
      meta: fullData[1],
      stats: {
        migrated: fullData[3][0].toString(),
        curveCompleted: fullData[3][1].toString(),
        sold: formatEther(fullData[3][2]),
        raised: formatEther(fullData[3][3]),
        miningReserve: formatEther(fullData[3][4]),
      },
      accountDataForCreator: {
        walletBalance: formatEther(accountData[0]),
        totalHashratePerMinute: formatEther(accountData[1]),
        pendingRewards: formatEther(accountData[2]),
        stakedItems: accountData[3].map(String),
      },
      recentTradeLogsWindow: {
        fromBlock: blockNumber >= 9n ? (blockNumber - 9n).toString() : "0",
        toBlock: blockNumber.toString(),
        count: recentTradeLogs.length,
      },
    },
    erc20: {
      hash: {
        name: hashInfo[0],
        symbol: hashInfo[1],
        decimals: hashInfo[2],
        totalSupply: formatEther(hashInfo[3]),
      },
      usdc: {
        name: usdcInfo[0],
        symbol: usdcInfo[1],
        decimals: usdcInfo[2],
        totalSupply: formatUnits(usdcInfo[3], Number(usdcInfo[2])),
      },
      creatorHashBalance: formatEther(hashBalance),
      creatorHashAllowanceForGemfun: formatEther(hashAllowance),
      alchemyTokenBalances,
      alchemyHashMetadata,
      alchemyHashAllowance,
    },
    erc1155Tools: {
      nextTokenIdToMint: nextTokenIdToMint.toString(),
      token0Uri: uri0,
      token0ClaimConditionRange: {
        startId: claimStartId.toString(),
        count: claimCount.toString(),
      },
      token0ClaimCondition: firstClaimCondition,
      creatorToken0Balance: toolBalance0.toString(),
      creatorApprovedForStaking: approvedForStaking,
      creatorApprovedForGemfun: approvedForGemfun,
      nftCollectionSample: nftCollectionSample.nfts?.map((nft) => ({
        tokenId: nft.tokenId,
        name: nft.name,
        tokenType: nft.tokenType,
        image: nft.image?.originalUrl ?? nft.raw?.metadata?.image ?? null,
      })),
      nftOwnersSample: nftOwnersSample.owners?.slice(0, 5),
    },
    auxiliaryContracts: {
      role: {
        canMint: roleCanMint,
        balance: roleBalance.toString(),
      },
      galxe: {
        userBalances: {
          nftBalance: galxeUserBalances[0].toString(),
          badgeBalance: galxeUserBalances[1].toString(),
          hashBalance: formatEther(galxeUserBalances[2]),
          hasClaimed: galxeUserBalances[3],
        },
        contractHashBalance: formatEther(galxeContractHashBalance),
        rewardAmount: formatEther(galxeRewardAmount),
      },
      faucet: {
        hasClaimed: faucetHasClaimed,
        contractBalance: formatEther(faucetContractBalance),
        claimAmount: formatEther(faucetClaimAmount),
      },
      transfersIntoCreator: alchemyTransfersIn.transfers?.slice(0, 5),
    },
  };

  console.log(JSON.stringify(report, (_, value) => (typeof value === "bigint" ? value.toString() : value), 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
