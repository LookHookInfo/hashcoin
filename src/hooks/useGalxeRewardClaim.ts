import { useState } from "react";
import { useAccount } from "@/hooks/useAccount";
import { contractGalxeNftFarm } from "@/utils/contracts";
import { useShopFeed } from "./useCoreAggregator";
import { writeAndWait } from "@/lib/wagmi/tx";

export const useGalxeRewardClaim = () => {
    const account = useAccount();
    const address = account?.address;

    const { data: feed, isLoading: isChecking, refetch } = useShopFeed(address);

    const canClaimGalxe = feed?.canClaimGalxe ?? false;
    const hasClaimed = feed?.galxeHasClaimed ?? false;
    const availableRewardTokens = feed?.galxeContractHash;
    const userRewardAmount = feed?.galxeRewardAmount;

    const [isClaiming, setIsClaiming] = useState(false);
    const canClaim = canClaimGalxe && !hasClaimed;

    const claimReward = async () => {
        if (!canClaim || !address || isClaiming) return;
        setIsClaiming(true);
        try {
            await writeAndWait({
                address: contractGalxeNftFarm.address,
                abi: contractGalxeNftFarm.abi,
                functionName: "claim",
                args: [],
            });
            await refetch();
        } catch (err) {
            console.error("[useGalxeRewardClaim] claim failed", err);
        } finally {
            setIsClaiming(false);
        }
    };

    return {
        canClaim,
        hasClaimed,
        isChecking,
        isClaiming,
        claimReward,
        availableRewardTokens,
        userRewardAmount,
    };
};
