import { useActiveAccount } from "thirdweb/react";
import { GEMFUN_ADDRESS } from "@/utils/contracts";
import { useAlchemyReadContract } from "@/hooks/useAlchemyRead";
import gemfunAbi from "@/lib/abi/gemfun.json";
import type { Abi } from "viem";
import { CURVE_SUPPLY, MINING_RESERVE } from "@/utils/constants";
import { getContract } from "thirdweb";
import { client } from "@/lib/thirdweb/client";
import { chain } from "@/lib/thirdweb/chain";

export type TokenInfo = [boolean, boolean, bigint, bigint, bigint];
export type TokenMetadata = [string, string, string, string, string, string];

export const getIpfsUrl = (uri: string) => {
  if (!uri || uri === "0x0000000000000000000000000000000000000000000000000000000000000000") return "";
  if (uri.startsWith("Qm") || uri.startsWith("ba")) return `https://ipfs.io/ipfs/${uri}`;
  if (uri.startsWith("0x")) return `https://ipfs.io/ipfs/${uri}`; 
  if (uri.startsWith("ipfs://")) return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  return uri;
};

export const normalizeMetadata = (rawLogo: string, rawDesc: string, links?: any): TokenMetadata => {
    let logoUri = rawLogo || "";
    let cleanDesc = rawDesc || "";
    if (cleanDesc.includes("|")) {
        const parts = cleanDesc.split("|");
        if (parts[0].startsWith("ipfs://") || parts[0].startsWith("Qm") || parts[0].length > 40) {
            logoUri = parts[0];
            cleanDesc = parts.slice(1).join("|");
        }
    }
    return [
        logoUri, cleanDesc,
        links?.website || links?.[0] || "",
        links?.twitter || links?.[1] || "",
        links?.telegram || links?.[2] || "",
        links?.guild || links?.[3] || "",
    ];
};

export const formatAmount = (val: string | number | bigint) => {
  const num = typeof val === 'bigint' ? Number(val) : Number(val);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

export const calculateCurveProgress = (sold: bigint | string | undefined) => {
    if (!sold) return 0;
    const soldBig = typeof sold === 'bigint' ? sold : BigInt(sold);
    return Math.min(Number(soldBig * 10000n / CURVE_SUPPLY) / 100, 100);
};

export const calculateMiningProgress = (currentReserve: bigint | string | undefined) => {
    if (!currentReserve) return 0;
    const reserveBig = typeof currentReserve === 'bigint' ? currentReserve : BigInt(currentReserve);
    const mined = MINING_RESERVE > reserveBig ? MINING_RESERVE - reserveBig : 0n;
    return Math.min(Number(mined * 10000n / MINING_RESERVE) / 100, 100);
};

const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  }
] as const;

export function useTokenLogic(tokenAddress: string) {
  const account = useActiveAccount();
  const isAddressValid = !!tokenAddress && tokenAddress !== "0x0000000000000000000000000000000000000000";
  
  const { data: fullData, isLoading, refetch: refetchPending } = useAlchemyReadContract<any, any, any, any>({
    queryKey: ["gem-token-full", tokenAddress],
    address: GEMFUN_ADDRESS as `0x${string}`,
    abi: gemfunAbi as Abi,
    functionName: "getTokenFullData",
    args: [tokenAddress],
    enabled: isAddressValid,
  });

  const { data: accData } = useAlchemyReadContract<any, any, any, any>({
    queryKey: ["gem-token-acc", tokenAddress, account?.address],
    address: GEMFUN_ADDRESS as `0x${string}`,
    abi: gemfunAbi as Abi,
    functionName: "getAccountData",
    args: [tokenAddress, account?.address],
    enabled: isAddressValid && !!account?.address,
  });

  // Получаем баланс самого токена
  const { data: tokenBalance } = useAlchemyReadContract<any, any, any, any>({
    queryKey: ["token-balance", tokenAddress, account?.address],
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI as any,
    functionName: "balanceOf",
    args: [account?.address],
    enabled: isAddressValid && !!account?.address,
  });

  const core = fullData?.core || fullData?.[0];
  const meta = fullData?.meta || fullData?.[1];
  const stats = fullData?.stats || fullData?.[3];
  const tokenCreator = fullData?.creator || fullData?.[2];

  const info: TokenInfo | null = stats ? [
    stats[0] === true || stats[0] === 1n || stats[0] === "1",
    stats[1] === true || stats[1] === 1n || stats[1] === "1",
    BigInt(stats[2] || 0),
    BigInt(stats[3] || 0),
    BigInt(stats[4] || 0)
  ] : null;

  const metadata = normalizeMetadata(core?.logoHash || "", core?.description || "", meta);
  const pendingRewards = accData?.pendingRewards || accData?.[2] || 0n;

  return {
    account,
    name: core?.name || "Loading...",
    symbol: core?.symbol || "...",
    info, 
    metadata, 
    isLoading, 
    refetchPending,
    tokenCreator,
    pendingRewards,
    tokenBalance: tokenBalance || 0n,
    isCreator: !!account?.address && !!tokenCreator && account.address.toLowerCase() === tokenCreator.toLowerCase(),
    userStake: {
        walletBalance: accData?.walletBalance || accData?.[0] || 0n,
        totalHashrate: accData?.totalHashrate || accData?.[1] || 0n,
        pendingRewards: pendingRewards,
        amounts: accData?.stakedItems || accData?.[3] || [0n, 0n, 0n, 0n, 0n, 0n]
    }
  };
}
