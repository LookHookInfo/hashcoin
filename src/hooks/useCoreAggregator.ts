import { useContractRead } from "./useContractRead";
import { coreClient } from "./useAggregatorClient";
import { AGGREGATOR_ADDRESSES, REFRESH_INTERVALS } from "@/utils/constants";
import coreAggregatorAbi from "@/lib/abi/core-aggregator.json";

export interface ToolState {
    balance: bigint;
    staked: bigint;
    rewards: bigint;
}

export interface ShopFeed {
    tools: ToolState[];
    isApprovedForStaking: boolean;
    usdcBalance: bigint;
    usdcAllowance: bigint;
    hashBalance: bigint;
    canMintFarmRole: boolean;
    hasFarmRole: boolean;
    galxeNftBalance: bigint;
    galxeBadgeBalance: bigint;
    galxeHasClaimed: boolean;
    galxeRewardAmount: bigint;
    primaryName: string;
    canClaimGalxe: boolean;
    galxeContractHash: bigint;
}

function parseShopFeed(raw: any): ShopFeed {
    const toolsArr = raw.tools ?? [];
    return {
        tools: toolsArr.map((t: any) => ({
            balance: BigInt(t.balance ?? 0),
            staked: BigInt(t.staked ?? 0),
            rewards: BigInt(t.rewards ?? 0),
        })),
        isApprovedForStaking: raw.isApprovedForStaking ?? false,
        usdcBalance: BigInt(raw.usdcBalance ?? 0),
        usdcAllowance: BigInt(raw.usdcAllowance ?? 0),
        hashBalance: BigInt(raw.hashBalance ?? 0),
        canMintFarmRole: raw.canMintFarmRole ?? false,
        hasFarmRole: raw.hasFarmRole ?? false,
        galxeNftBalance: BigInt(raw.galxeNftBalance ?? 0),
        galxeBadgeBalance: BigInt(raw.galxeBadgeBalance ?? 0),
        galxeHasClaimed: raw.galxeHasClaimed ?? false,
        galxeRewardAmount: BigInt(raw.galxeRewardAmount ?? 0),
        primaryName: raw.primaryName ?? "",
        canClaimGalxe: raw.canClaimGalxe ?? false,
        galxeContractHash: BigInt(raw.galxeContractHash ?? 0),
    };
}

export function useShopFeed(user?: string) {
    return useContractRead<ShopFeed>({
        fetchFn: async () => {
            const raw = await coreClient.readContract({
                address: AGGREGATOR_ADDRESSES.CORE as `0x${string}`,
                abi: coreAggregatorAbi,
                functionName: "getShopFeed",
                args: [user!],
            });
            return parseShopFeed(raw);
        },
        deps: [user],
        enabled: !!user,
        intervalMs: REFRESH_INTERVALS.SHOP,
    });
}

export interface ToolPrice {
    pricePerToken: bigint;
    currency: `0x${string}`;
    supplyClaimed: bigint;
    maxClaimableSupply: bigint;
}

export function useShopPrices() {
    return useContractRead<ToolPrice[]>({
        fetchFn: async () => {
            const raw: any = await coreClient.readContract({
                address: AGGREGATOR_ADDRESSES.CORE as `0x${string}`,
                abi: coreAggregatorAbi,
                functionName: "getShopPrices",
                args: [],
            });
            const prices = (raw ?? []) as any[];
            return prices.map((p: any) => ({
                pricePerToken: BigInt(p.pricePerToken ?? 0),
                currency: (p.currency ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
                supplyClaimed: BigInt(p.supplyClaimed ?? 0),
                maxClaimableSupply: BigInt(p.maxClaimableSupply ?? 0),
            }));
        },
        deps: [],
        intervalMs: REFRESH_INTERVALS.SHOP,
    });
}

export function useCoinFeed() {
    return useContractRead<{ totalSupply: bigint }>({
        fetchFn: async () => {
            const raw: any = await coreClient.readContract({
                address: AGGREGATOR_ADDRESSES.CORE as `0x${string}`,
                abi: coreAggregatorAbi,
                functionName: "getCoinFeed",
                args: [],
            });
            return { totalSupply: BigInt(raw ?? 0) };
        },
        deps: [],
        intervalMs: REFRESH_INTERVALS.COIN,
    });
}
