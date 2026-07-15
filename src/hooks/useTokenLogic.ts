import { useAccount } from "@/hooks/useAccount";
import { useMemo } from "react";
import { CURVE_SUPPLY, MINING_RESERVE } from "@/utils/constants";
import { useGemCardFeed } from "./useGemAggregator";

export type TokenInfo = [boolean, boolean, bigint, bigint, bigint];
export type TokenMetadata = [string, string, string, string, string, string];
export interface UserStake {
    walletBalance: bigint;
    totalHashrate: bigint;
    pendingRewards: bigint;
    amounts: bigint[];
}

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export const getIpfsUrl = (uri: string) => {
    if (!uri) return "";
    if (uri.startsWith("0x")) return "";
    if (uri.startsWith("ipfs://")) return uri.replace("ipfs://", IPFS_GATEWAY);
    if (uri.startsWith("Qm") || uri.startsWith("ba")) return `${IPFS_GATEWAY}${uri}`;
    return uri;
};

export const normalizeMetadata = (
    rawLogo: string,
    rawDesc: string,
    links?: { website?: string; twitter?: string; telegram?: string; guild?: string } | string[]
): TokenMetadata => {
    let logoUri = rawLogo || "";
    let cleanDesc = rawDesc || "";
    if (cleanDesc.includes("|")) {
        const parts = cleanDesc.split("|");
        if (parts[0].startsWith("ipfs://") || parts[0].startsWith("Qm") || parts[0].length > 40) {
            logoUri = parts[0];
            cleanDesc = parts.slice(1).join("|");
        }
    }
    const arr = Array.isArray(links) ? links : undefined;
    const obj = !Array.isArray(links) ? links ?? {} : {};
    return [
        logoUri,
        cleanDesc,
        obj.website ?? arr?.[0] ?? "",
        obj.twitter ?? arr?.[1] ?? "",
        obj.telegram ?? arr?.[2] ?? "",
        obj.guild ?? arr?.[3] ?? "",
    ];
};

export const formatAmount = (val: string | number | bigint) => {
    const num = typeof val === "bigint" ? Number(val) : Number(val);
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

export const calculateCurveProgress = (sold: bigint | string | undefined) => {
    if (!sold) return 0;
    const soldBig = typeof sold === "bigint" ? sold : BigInt(sold);
    return Math.min(Number((soldBig * 10000n) / CURVE_SUPPLY) / 100, 100);
};

export const calculateMiningProgress = (currentReserve: bigint | string | undefined) => {
    if (!currentReserve) return 0;
    const reserveBig = typeof currentReserve === "bigint" ? currentReserve : BigInt(currentReserve);
    const mined = MINING_RESERVE > reserveBig ? MINING_RESERVE - reserveBig : 0n;
    return Math.min(Number((mined * 10000n) / MINING_RESERVE) / 100, 100);
};

export function useTokenLogic(tokenAddress: string) {
    const account = useAccount();
    const isAddressValid = !!tokenAddress && tokenAddress !== "0x0000000000000000000000000000000000000000";

    const { data: detail, isLoading, refetch } = useGemCardFeed(
        isAddressValid ? tokenAddress : undefined,
        account?.address
    );
    const hashBalance = detail?.hashBalance ?? 0n;
    const hashAllowance = detail?.hashAllowance ?? 0n;
    const memeAllowance = detail?.memeAllowance ?? 0n;
    const toolBalances = detail?.toolBalances ?? [0n, 0n, 0n, 0n, 0n, 0n];

    const gv = detail?.gv;
    const ud = detail?.ud;

    const info = useMemo<TokenInfo | null>(() => {
        if (!gv) return null;
        return [
            gv.isMigrated,
            gv.isCurveCompleted,
            gv.sold,
            gv.raised,
            gv.miningReserve,
        ];
    }, [gv]);

    const metadata = useMemo<TokenMetadata>(
        () =>
            normalizeMetadata(gv?.logoHash ?? "", gv?.description ?? "", {
                website: gv?.website,
                twitter: gv?.twitter,
                telegram: gv?.telegram,
                guild: gv?.guild,
            }),
        [gv]
    );

    const pendingRewards = ud?.pendingRewards ?? 0n;
    const walletBalance = ud?.walletBalance ?? 0n;
    const totalHashrate = ud?.totalHashrate ?? 0n;
    const stakedItems = useMemo(() => (ud?.stakedItems ?? [0n, 0n, 0n, 0n, 0n, 0n]), [ud]);
    const tokenCreator = gv?.creator ?? "";

    return {
        account,
        name: gv?.name ?? "",
        symbol: gv?.symbol || "...",
        info,
        metadata,
        isLoading,
        refetchPending: refetch,
        onTradeConfirmed: (_mode: "buy" | "sell", _amount: bigint, _hashCost: bigint) => {
            refetch();
        },
        onMetadataConfirmed: (_links: any) => {
            refetch();
        },
        onStakeConfirmed: (_toolId: string, _qty: bigint) => {
            refetch();
        },
        onWithdrawConfirmed: (_toolId: string, _qty: bigint) => {
            refetch();
        },
        onClaimMiningConfirmed: () => {
            refetch();
        },
        tokenCreator,
        pendingRewards,
        hashBalance,
        hashAllowance,
        memeAllowance,
        tokenBalance: walletBalance,
        toolBalances,
        isCreator:
            !!account?.address &&
            !!tokenCreator &&
            account.address.toLowerCase() === tokenCreator.toLowerCase(),
        userStake: {
            walletBalance,
            totalHashrate,
            pendingRewards,
            amounts: stakedItems.length === 6 ? stakedItems : [0n, 0n, 0n, 0n, 0n, 0n],
        },
    };
}
