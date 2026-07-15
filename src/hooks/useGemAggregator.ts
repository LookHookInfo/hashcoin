import { useContractRead } from "./useContractRead";
import { gemClient } from "./useAggregatorClient";
import { AGGREGATOR_ADDRESSES, REFRESH_INTERVALS } from "@/utils/constants";
import gemAggregatorAbi from "@/lib/abi/gem-aggregator.json";

export interface GemView {
    token: string;
    name: string;
    symbol: string;
    logoHash: string;
    description: string;
    website: string;
    twitter: string;
    telegram: string;
    guild: string;
    creator: string;
    sold: bigint;
    raised: bigint;
    miningReserve: bigint;
    isMigrated: boolean;
    isCurveCompleted: boolean;
}

export interface UserData {
    walletBalance: bigint;
    totalHashrate: bigint;
    pendingRewards: bigint;
    stakedItems: bigint[];
}

export function parseGemView(raw: any): GemView {
    return {
        token: raw.token ?? "",
        name: raw.name ?? "",
        symbol: raw.symbol ?? "",
        logoHash: raw.logoHash ?? "",
        description: raw.description ?? "",
        website: raw.website ?? "",
        twitter: raw.twitter ?? "",
        telegram: raw.telegram ?? "",
        guild: raw.guild ?? "",
        creator: raw.creator ?? "",
        sold: BigInt(raw.sold ?? 0),
        raised: BigInt(raw.raised ?? 0),
        miningReserve: BigInt(raw.miningReserve ?? 0),
        isMigrated: raw.isMigrated ?? false,
        isCurveCompleted: raw.isCurveCompleted ?? false,
    };
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export function isValidGemView(t: GemView): boolean {
    if (!t.token || t.token.toLowerCase() === ZERO_ADDR) return false;
    if (!t.name || !t.name.trim()) return false;
    return true;
}

export function filterValidTokens(tokens: GemView[]): GemView[] {
    return tokens.filter(isValidGemView);
}

function parseUserData(raw: any): UserData {
    return {
        walletBalance: BigInt(raw.walletBalance ?? 0),
        totalHashrate: BigInt(raw.totalHashrate ?? 0),
        pendingRewards: BigInt(raw.pendingRewards ?? 0),
        stakedItems: (raw.stakedItems ?? []).map((s: any) => BigInt(s ?? 0)),
    };
}

export interface GemFeedResponse {
    tokens: GemView[];
    total: number;
}

// sort: 0=creation, 1=marketcap, 2=recent, 3=migrated
export function useGemFeed(offset: number, limit: number, sort: number, enabled = true) {
    return useContractRead<GemFeedResponse>({
        fetchFn: async () => {
            const raw: any = await gemClient.readContract({
                address: AGGREGATOR_ADDRESSES.GEM as `0x${string}`,
                abi: gemAggregatorAbi,
                functionName: "getFeed",
                args: [BigInt(offset), BigInt(limit), sort],
            });
            const tokens = filterValidTokens((raw[0] ?? []).map(parseGemView));
            const total = Number(raw[1] ?? 0);
            return { tokens, total };
        },
        deps: [offset, limit, sort],
        enabled,
        intervalMs: REFRESH_INTERVALS.GEM_LIST,
    });
}

export function useGemFeedByMarketCap(offset: number, limit: number, enabled = true) {
    return useContractRead<GemFeedResponse>({
        fetchFn: async () => {
            const raw: any = await gemClient.readContract({
                address: AGGREGATOR_ADDRESSES.GEM as `0x${string}`,
                abi: gemAggregatorAbi,
                functionName: "getFeedByMarketCap",
                args: [BigInt(offset), BigInt(limit)],
            });
            const tokens = filterValidTokens((raw[0] ?? []).map(parseGemView));
            const total = Number(raw[1] ?? 0);
            return { tokens, total };
        },
        deps: [offset, limit],
        enabled,
        intervalMs: REFRESH_INTERVALS.GEM_LIST,
    });
}

export function useGemFeedMigrated(offset: number, limit: number, enabled = true) {
    return useContractRead<GemFeedResponse>({
        fetchFn: async () => {
            const raw: any = await gemClient.readContract({
                address: AGGREGATOR_ADDRESSES.GEM as `0x${string}`,
                abi: gemAggregatorAbi,
                functionName: "getFeedMigrated",
                args: [BigInt(offset), BigInt(limit)],
            });
            const tokens = filterValidTokens((raw[0] ?? []).map(parseGemView));
            const total = Number(raw[1] ?? 0);
            return { tokens, total };
        },
        deps: [offset, limit],
        enabled,
        intervalMs: REFRESH_INTERVALS.GEM_LIST,
    });
}

export function useGemFeedByHolder(user: string | undefined, offset: number, limit: number, enabled = true) {
    return useContractRead<GemFeedResponse | null>({
        fetchFn: async () => {
            if (!user) return null;
            const raw: any = await gemClient.readContract({
                address: AGGREGATOR_ADDRESSES.GEM as `0x${string}`,
                abi: gemAggregatorAbi,
                functionName: "getFeedByHolder",
                args: [user as `0x${string}`, BigInt(offset), BigInt(limit)],
            });
            const tokens = filterValidTokens((raw[0] ?? []).map(parseGemView));
            const total = Number(raw[1] ?? 0);
            return { tokens, total };
        },
        deps: [user, offset, limit],
        enabled: !!user && enabled,
    });
}

export function useGemFeedByMiner(user: string | undefined, offset: number, limit: number, enabled = true) {
    return useContractRead<GemFeedResponse | null>({
        fetchFn: async () => {
            if (!user) return null;
            const raw: any = await gemClient.readContract({
                address: AGGREGATOR_ADDRESSES.GEM as `0x${string}`,
                abi: gemAggregatorAbi,
                functionName: "getFeedByMiner",
                args: [user as `0x${string}`, BigInt(offset), BigInt(limit)],
            });
            const tokens = filterValidTokens((raw[0] ?? []).map(parseGemView));
            const total = Number(raw[1] ?? 0);
            return { tokens, total };
        },
        deps: [user, offset, limit],
        enabled: !!user && enabled,
    });
}

export function useGemDetail(token?: string, user?: string) {
    return useContractRead<{ gv: GemView; ud: UserData } | null>({
        fetchFn: async () => {
            if (!token) return null;
            const raw: any = await gemClient.readContract({
                address: AGGREGATOR_ADDRESSES.GEM as `0x${string}`,
                abi: gemAggregatorAbi,
                functionName: "getDetail",
                args: [token as `0x${string}`, (user ?? "0x0000000000000000000000000000000000000000") as `0x${string}`],
            });
            return {
                gv: parseGemView(raw[0]),
                ud: parseUserData(raw[1]),
            };
        },
        deps: [token, user],
        enabled: !!token,
        intervalMs: REFRESH_INTERVALS.GEM_DETAIL,
    });
}

export interface CardFeed {
    gv: GemView;
    ud: UserData;
    hashAllowance: bigint;
    memeAllowance: bigint;
    hashBalance: bigint;
    tokenBalance: bigint;
    toolBalances: bigint[];
}

export function useGemCardFeed(token?: string, user?: string) {
    return useContractRead<CardFeed | null>({
        fetchFn: async () => {
            if (!token) return null;
            const raw: any = await gemClient.readContract({
                address: AGGREGATOR_ADDRESSES.GEM as `0x${string}`,
                abi: gemAggregatorAbi,
                functionName: "getCardFeed",
                args: [token as `0x${string}`, (user ?? "0x0000000000000000000000000000000000000000") as `0x${string}`],
            });
            return {
                gv: parseGemView(raw.gv ?? raw[0]),
                ud: parseUserData(raw.ud ?? raw[1]),
                hashAllowance: BigInt(raw.hashAllowance ?? raw[2] ?? 0),
                memeAllowance: BigInt(raw.memeAllowance ?? raw[3] ?? 0),
                hashBalance: BigInt(raw.hashBalance ?? raw[4] ?? 0),
                tokenBalance: BigInt(raw.tokenBalance ?? raw[5] ?? 0),
                toolBalances: ((raw.toolBalances ?? raw[6]) ?? []).map((s: any) => BigInt(s ?? 0)),
            };
        },
        deps: [token, user],
        enabled: !!token,
        intervalMs: REFRESH_INTERVALS.GEM_DETAIL,
    });
}
