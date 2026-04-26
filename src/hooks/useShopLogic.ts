import { useActiveAccount } from "thirdweb/react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { store, subscribe, batchSyncShop } from "@/services/tokenService";
import { getNFTs } from "thirdweb/extensions/erc1155";
import { contractTools } from "@/utils/contracts";
import { useQuery } from "@tanstack/react-query";

export function useShopLogic() {
    const account = useActiveAccount();
    const [syncKey, setSyncKey] = useState(0);

    // Подписка на изменения в глобальном store.shop
    useEffect(() => subscribe(() => setSyncKey(k => k + 1)), []);

    const { data: allTools, isLoading: isLoadingNFTs } = useQuery({
        queryKey: ["allTools"],
        queryFn: () => getNFTs({ contract: contractTools }),
    });

    const refreshShop = useCallback(async () => {
        if (!allTools || allTools.length === 0) return;
        
        const ids = allTools.map(t => t.id);
        await batchSyncShop(ids, account?.address);
    }, [allTools, account?.address]);

    useEffect(() => {
        refreshShop();
        const interval = setInterval(refreshShop, 60000);
        return () => clearInterval(interval);
    }, [refreshShop]);

    const shopData = useMemo(() => {
        return {
            tools: allTools || [],
            user: store.shop.user || { isApproved: false, usdcBalance: 0n, usdcAllowance: 0n },
            states: store.shop,
            isLoading: isLoadingNFTs
        };
    }, [allTools, isLoadingNFTs, syncKey]);

    return { ...shopData, refresh: refreshShop };
}
