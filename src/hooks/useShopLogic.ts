import { useAccount } from "@/hooks/useAccount";
import { useMemo } from "react";
import { useShopFeed, useShopPrices, type ToolPrice } from "./useCoreAggregator";
import { TOOL_METADATA } from "@/utils/constants";

export interface ShopToolEntry {
    id: bigint;
    metadata: {
        name?: string;
        description?: string;
        image?: string;
    };
    hashPower: number;
}

export interface ShopUserEntry {
    isApproved: boolean;
    usdcBalance: bigint;
    usdcAllowance: bigint;
}

export interface ShopState {
    [tokenIdStr: string]: { balance: bigint; staked: bigint; rewards: bigint };
}

export interface ShopPrices {
    [tokenIdStr: string]: ToolPrice;
}

export function useShopLogic() {
    const account = useAccount();
    const { data: feed, isLoading, refetch } = useShopFeed(account?.address);
    const { data: rawPrices } = useShopPrices();

    const tools = useMemo<ShopToolEntry[]>(
        () =>
            TOOL_METADATA.map((t) => ({
                id: BigInt(t.id),
                metadata: { name: t.name, description: t.description, image: t.image },
                hashPower: t.hashPower,
            })),
        []
    );

    const user = useMemo<ShopUserEntry>(
        () => ({
            isApproved: feed?.isApprovedForStaking ?? false,
            usdcBalance: feed?.usdcBalance ?? 0n,
            usdcAllowance: feed?.usdcAllowance ?? 0n,
        }),
        [feed]
    );

    const states = useMemo<ShopState>(() => {
        if (!feed) return {};
        const out: ShopState = {};
        feed.tools.forEach((t, i) => {
            out[String(i)] = { balance: t.balance, staked: t.staked, rewards: t.rewards };
        });
        return out;
    }, [feed]);

    const prices = useMemo<ShopPrices>(() => {
        if (!rawPrices) return {};
        const out: ShopPrices = {};
        rawPrices.forEach((p, i) => {
            out[String(i)] = p;
        });
        return out;
    }, [rawPrices]);

    return {
        tools,
        user,
        states,
        prices,
        isLoading,
        refresh: refetch,
        onBuyConfirmed: () => {
            refetch();
        },
        onEquipConfirmed: () => {
            refetch();
        },
        onUnequipConfirmed: () => {
            refetch();
        },
        onClaimRewardsConfirmed: () => {
            refetch();
        },
    };
}
