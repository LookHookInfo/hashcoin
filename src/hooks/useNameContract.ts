import { useShopFeed } from "./useCoreAggregator";

export function useDisplayName(address: string | undefined) {
    const fallbackDisplayName = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "";

    const { data: feed, isLoading } = useShopFeed(address);
    const primaryName = feed?.primaryName;

    return {
        displayName: primaryName ? `${primaryName}.hash` : fallbackDisplayName,
        isLoading: !!address && isLoading,
    };
}
