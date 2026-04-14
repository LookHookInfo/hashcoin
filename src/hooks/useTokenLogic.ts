import { useActiveAccount } from "thirdweb/react";
import { contractGemFun, hashcoinContract } from "@/utils/contracts";
import { getContract } from "thirdweb";
import { client } from "@/lib/thirdweb/client";
import { chain } from "@/lib/thirdweb/chain";
import { useMemo } from "react";
import { useAlchemyReadContract } from "@/hooks/useAlchemyRead";
import gemfunAbi from "@/lib/abi/gemfun.json";
import type { Abi } from "viem";

export const CURVE_SUPPLY = 300_000_000n * 10n ** 18n;
export const MINING_RESERVE = 400_000_000n * 10n ** 18n;
const DETAIL_REFRESH_INTERVAL_MS = 15_000;
const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const satisfies Abi;

export type TokenInfo = [boolean, boolean, bigint, bigint, bigint];
export type TokenMetadata = [string, string, string, string, string, string];
type StakeAmounts = [bigint, bigint, bigint, bigint, bigint, bigint];

interface TokenCore {
  name: string;
  symbol: string;
  logoHash: string;
  description: string;
}

interface TokenMetadataFields {
  website: string;
  twitter: string;
  telegram: string;
  guild: string;
}

type CachedMeta = {
  name: string;
  symbol: string;
  logo?: string;
  desc?: string;
  links?: {
    website: string;
    twitter: string;
    telegram: string;
    guild: string;
  };
  creator?: string;
  stats?: [string, string, string, string, string] | TokenInfo;
  fromGoldsky?: boolean;
};

type FullDataObject = {
  core: TokenCore;
  meta: TokenMetadataFields;
  creator: string;
  stats: TokenInfo;
};

type FullDataTuple = [
  TokenCore,
  TokenMetadataFields,
  string,
  TokenInfo,
];

type AccountDataObject = {
  walletBalance: bigint;
  totalHashrate: bigint;
  pendingRewards: bigint;
  stakedItems: StakeAmounts;
};

type AccountDataTuple = [bigint, bigint, bigint, StakeAmounts];

export type UserStake = {
  amounts: StakeAmounts;
  totalHashrate: bigint;
  pendingRewards: bigint;
  walletBalance: bigint;
};

const EMPTY_STAKE_AMOUNTS: StakeAmounts = [0n, 0n, 0n, 0n, 0n, 0n];

const getCachedMeta = (addr: string) => {
    if (!addr || addr === "0x0000000000000000000000000000000000000000") return null;
    const data = localStorage.getItem(`meta_${addr.toLowerCase()}`);
    return data ? (JSON.parse(data) as CachedMeta) : null;
};

/**
 * getIpfsUrl - Converts IPFS URI to HTTP Gateway URL
 * Supports: ipfs://, raw CIDs, and bytes32 hex hashes
 */
export const getIpfsUrl = (uri: string) => {
  if (!uri) return "";
  
  // Handle bytes32 hex strings (66 chars including 0x)
  if (uri.startsWith("0x") && uri.length === 66) {
    if (uri === "0x0000000000000000000000000000000000000000000000000000000000000000") return "";
    // If it doesn't look like a hex-encoded string (low entropy/no common chars), 
    // it might be a raw multihash. But most likely it's a CID.
    // For now, if it's hex, we treat it as a potential hash.
    return `https://ipfs.io/ipfs/${uri}`; 
  }

  if (uri.startsWith("ipfs://")) return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  if (uri.startsWith("Qm") || uri.startsWith("ba")) return `https://ipfs.io/ipfs/${uri}`;
  return uri;
};

/**
 * normalizeMetadata - Shared logic to parse logo and description
 */
export const normalizeMetadata = (rawLogo: string, rawDesc: string, links?: any): TokenMetadata => {
    let logoUri = rawLogo || "";
    let cleanDesc = rawDesc || "";

    // Specific logic: if description starts with ipfs:// and has a pipe, it's [logo]|[desc]
    if (cleanDesc.includes("|")) {
        const parts = cleanDesc.split("|");
        if (parts[0].startsWith("ipfs://") || parts[0].startsWith("Qm") || parts[0].startsWith("ba")) {
            logoUri = parts[0];
            cleanDesc = parts.slice(1).join("|");
        }
    }

    return [
        logoUri,
        cleanDesc,
        links?.website || links?.[0] || "",
        links?.twitter || links?.[1] || "",
        links?.telegram || links?.[2] || "",
        links?.guild || links?.[3] || "",
    ];
};

export const formatAmount = (val: string | number | bigint) => {
  const num = typeof val === 'bigint' ? Number(val) : Number(val);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Shared logic to calculate Bonding Curve Progress percentage
 */
export const calculateCurveProgress = (sold: bigint | string | undefined) => {
    if (!sold) return 0;
    try {
        const soldBig = typeof sold === 'bigint' ? sold : BigInt(sold);
        const progress = Number(soldBig * 10000n / CURVE_SUPPLY) / 100;
        return Math.min(progress, 100);
    } catch {
        return 0;
    }
};

/**
 * Shared logic to calculate Mining Progress percentage (how much is mined from reserve)
 */
export const calculateMiningProgress = (currentReserve: bigint | string | undefined) => {
    if (!currentReserve) return 0;
    try {
        const reserveBig = typeof currentReserve === 'bigint' ? currentReserve : BigInt(currentReserve);
        const mined = MINING_RESERVE > reserveBig ? MINING_RESERVE - reserveBig : 0n;
        const progress = Number(mined * 10000n / MINING_RESERVE) / 100;
        return Math.min(progress, 100);
    } catch {
        return 0;
    }
};

const normalizeFullData = (fullData: FullDataObject | FullDataTuple | undefined): FullDataObject | null => {
  if (!fullData) return null;
  if (Array.isArray(fullData)) {
    const [core, meta, creator, stats] = fullData;
    return { core, meta, creator, stats };
  }
  return fullData;
};

const normalizeAccountData = (accountData: AccountDataObject | AccountDataTuple | undefined): AccountDataObject | null => {
  if (!accountData) return null;
  if (Array.isArray(accountData)) {
    const [walletBalance, totalHashrate, pendingRewards, stakedItems] = accountData;
    return { walletBalance, totalHashrate, pendingRewards, stakedItems };
  }
  return accountData;
};

export function useTokenLogic(tokenAddress: string) {
  const account = useActiveAccount();
  const isAddressValid = !!tokenAddress && 
                         tokenAddress !== "0x0000000000000000000000000000000000000000" && 
                         tokenAddress !== "";
  
  const tokenContract = useMemo(() => getContract({ 
    client, 
    chain, 
    address: isAddressValid ? tokenAddress : "0x0000000000000000000000000000000000000000" 
  }), [tokenAddress, isAddressValid]);

  const cached = useMemo(() => isAddressValid ? getCachedMeta(tokenAddress) : null, [tokenAddress, isAddressValid]);

  const { data: fullData, isLoading: isLoadingFull, refetch: refetchFull } = useAlchemyReadContract<Abi, "getTokenFullData", readonly [`0x${string}`], FullDataObject | FullDataTuple>({
    queryKey: ["gem-token", "full-data", tokenAddress],
    address: contractGemFun.address as `0x${string}`,
    abi: gemfunAbi as Abi,
    functionName: "getTokenFullData",
    args: isAddressValid ? [tokenAddress as `0x${string}`] : undefined,
    enabled: isAddressValid,
    staleTime: 10_000,
  });

  const { data: hashBalance, refetch: refetchHash } = useAlchemyReadContract<Abi, "balanceOf", readonly [`0x${string}`], bigint>({
    queryKey: ["gem-token", "hash-balance", account?.address],
    address: hashcoinContract.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account?.address ? [account.address as `0x${string}`] : undefined,
    enabled: !!account?.address && isAddressValid,
    staleTime: 10_000,
  });

  const { data: tokenBalance, refetch: refetchTokenBalance } = useAlchemyReadContract<Abi, "balanceOf", readonly [`0x${string}`], bigint>({
    queryKey: ["gem-token", "token-balance", tokenAddress, account?.address],
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account?.address ? [account.address as `0x${string}`] : undefined,
    enabled: !!account?.address && isAddressValid,
    staleTime: 10_000,
  });

  const { data: accountData, refetch: refetchAccount } = useAlchemyReadContract<Abi, "getAccountData", readonly [`0x${string}`, `0x${string}`], AccountDataObject | AccountDataTuple>({
    queryKey: ["gem-token", "account-data", tokenAddress, account?.address],
    address: contractGemFun.address as `0x${string}`,
    abi: gemfunAbi as Abi,
    functionName: "getAccountData",
    args:
      isAddressValid && account?.address
        ? [tokenAddress as `0x${string}`, account.address as `0x${string}`]
        : undefined,
    enabled: isAddressValid && !!account?.address,
    staleTime: 10_000,
  });

  const normalizedFullData = useMemo(() => normalizeFullData(fullData), [fullData]);
  const normalizedAccountData = useMemo(() => normalizeAccountData(accountData), [accountData]);

  const userStake: UserStake = {
    amounts: normalizedAccountData?.stakedItems ?? EMPTY_STAKE_AMOUNTS,
    totalHashrate: normalizedAccountData?.totalHashrate ?? 0n,
    pendingRewards: normalizedAccountData?.pendingRewards ?? 0n,
    walletBalance: normalizedAccountData?.walletBalance ?? 0n,
  };

  const core = normalizedFullData?.core;
  const meta = normalizedFullData?.meta || cached?.links;
  const stats = normalizedFullData?.stats || cached?.stats;
  const tokenCreator = normalizedFullData?.creator || cached?.creator;

  const info: TokenInfo | null = stats
    ? [
        stats[0].toString() === "1" || stats[0] === true,
        stats[1].toString() === "1" || stats[1] === true,
        BigInt(stats[2] as any),
        BigInt(stats[3] as any),
        BigInt(stats[4] as any),
      ]
    : null;

  const metadata = normalizeMetadata(
      core?.logoHash || cached?.logo || "",
      core?.description || cached?.desc || "",
      meta
  );

  return {
    account,
    tokenContract,
    hashBalance,
    tokenBalance,
    name: core?.name || cached?.name || "Loading...",
    symbol: core?.symbol || cached?.symbol || "MEME",
    info,
    metadata,
    pendingRewards: userStake.pendingRewards,
    userStake,
    tokenCreator,
    isCreator: !!account?.address && !!tokenCreator && account.address.toLowerCase() === (tokenCreator as string).toLowerCase(),
    isLoading: isAddressValid ? (!core && !cached && isLoadingFull) : false,
    refetchPending: () => { if (isAddressValid) { refetchFull(); refetchHash(); refetchTokenBalance(); refetchAccount(); } }
  };
}
