import { useState } from "react";
import { useAccount } from "@/hooks/useAccount";
import { contractFarmRole } from "@/utils/contracts";
import { useShopFeed } from "./useCoreAggregator";
import { writeAndWait } from "@/lib/wagmi/tx";

export const useRoleClaim = () => {
    const account = useAccount();
    const address = account?.address;

    const { data: feed, isLoading: isChecking, refetch } = useShopFeed(address);
    const canMint = feed?.canMintFarmRole ?? false;
    const hasMinted = feed?.hasFarmRole ?? false;

    const [isMinting, setIsMinting] = useState(false);

    const claimRole = async () => {
        if (!canMint || !address || hasMinted || isMinting) return;
        setIsMinting(true);
        try {
            await writeAndWait({
                address: contractFarmRole.address,
                abi: contractFarmRole.abi,
                functionName: "mint",
                args: [],
            });
            await refetch();
        } catch (err) {
            console.error("[useRoleClaim] mint failed", err);
        } finally {
            setIsMinting(false);
        }
    };

    return {
        canMint,
        hasMinted,
        isChecking,
        isMinting,
        claimRole,
    };
};
