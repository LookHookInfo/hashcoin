import { useMemo, useState } from "react";
import { useGemFeed, useGemFeedByMarketCap, useGemFeedMigrated, useGemFeedByHolder, useGemFeedByMiner, type GemView } from "./useGemAggregator";

export interface GemMetaIndexEntry {
    name: string;
    symbol: string;
    logo: string;
    desc: string;
    links: { website: string; twitter: string; telegram: string; guild: string };
    stats: [string, string, string, string, string];
    creator: string;
}

export type GemFilter = "marketcap" | "hold" | "mining" | "migrated";

function toIndexEntry(t: GemView): GemMetaIndexEntry {
    let logo = t.logoHash;
    let desc = t.description ?? "";
    if (desc.includes("|")) {
        const idx = desc.indexOf("|");
        const head = desc.slice(0, idx);
        if (head.startsWith("ipfs://") || head.startsWith("Qm") || head.startsWith("ba") || head.length > 40) {
            logo = head;
            desc = desc.slice(idx + 1);
        }
    }
    return {
        name: t.name,
        symbol: t.symbol,
        logo,
        desc,
        links: { website: t.website, twitter: t.twitter, telegram: t.telegram, guild: t.guild },
        stats: [
            t.isMigrated ? "1" : "0",
            t.isCurveCompleted ? "1" : "0",
            t.sold.toString(),
            t.raised.toString(),
            t.miningReserve.toString(),
        ],
        creator: t.creator,
    };
}

export interface UseGemFunArgs {
    filter: GemFilter;
    limit: number;
    q?: string;
    userAddress?: string;
}

export function useGemFun({ filter, limit, q, userAddress }: UseGemFunArgs) {
    const [page, setPage] = useState(1);
    const offset = (page - 1) * limit;

    const isUserFilter = filter === "hold" || filter === "mining";

    const feedMarketCap = useGemFeedByMarketCap(offset, limit, filter === 'marketcap');
    const feedMigrated = useGemFeedMigrated(offset, limit, filter === 'migrated');
    const feedCreation = useGemFeed(offset, limit, 0, filter !== 'marketcap' && filter !== 'hold' && filter !== 'mining' && filter !== 'migrated');
    const feedHolder = useGemFeedByHolder(isUserFilter ? userAddress : undefined, offset, limit, filter === 'hold');
    const feedMiner = useGemFeedByMiner(isUserFilter ? userAddress : undefined, offset, limit, filter === 'mining');

    let data: { tokens: GemView[]; total: number } | null | undefined;
    let isLoading: boolean;

    switch (filter) {
        case "marketcap":
            data = feedMarketCap.data;
            isLoading = feedMarketCap.isLoading;
            break;
        case "migrated":
            data = feedMigrated.data;
            isLoading = feedMigrated.isLoading;
            break;
        case "hold":
            data = feedHolder.data;
            isLoading = feedHolder.isLoading;
            break;
        case "mining":
            data = feedMiner.data;
            isLoading = feedMiner.isLoading;
            break;
        default:
            data = feedCreation.data;
            isLoading = feedCreation.isLoading;
    }

    const tokens = useMemo(() => data?.tokens ?? [], [data]);
    const total = data?.total ?? 0;

    const filtered = useMemo(() => {
        if (!q?.trim()) return tokens;
        const query = q.toLowerCase();
        return tokens.filter(
            (t) =>
                t.name.toLowerCase().includes(query) ||
                t.symbol.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query)
        );
    }, [tokens, q]);

    const refresh = (() => {
        switch (filter) {
            case "marketcap": return feedMarketCap.refetch;
            case "migrated": return feedMigrated.refetch;
            case "hold": return feedHolder.refetch;
            case "mining": return feedMiner.refetch;
            default: return feedCreation.refetch;
        }
    })();

    return useMemo(() => {
        const tokenIndex: Record<string, GemMetaIndexEntry> = {};
        const addresses: string[] = [];
        for (const t of filtered) {
            const a = t.token.toLowerCase();
            if (tokenIndex[a]) continue;
            tokenIndex[a] = toIndexEntry(t);
            addresses.push(a);
        }
        return {
            tokenIndex,
            addresses,
            total,
            isLoading,
            hasMore: offset + limit < total,
            isLoadingMore: false,
            loadMore: () => setPage((p) => p + 1),
            refresh,
        };
    }, [filtered, total, isLoading, offset, limit, refresh]);
}
