import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { contractGalxeNftFarm } from "@/utils/contracts";
import { prepareContractCall } from "thirdweb";
import { useQueryClient } from "@tanstack/react-query";

export const useGalxeRewardClaim = () => {
    const account = useActiveAccount();
    const address = account?.address;
    const queryClient = useQueryClient();

    const { data: userBalances, isLoading: isLoadingUserBalances, refetch } = useReadContract({
        contract: contractGalxeNftFarm,
        method: "function getUserBalances(address user) view returns (uint256 nftBalance, uint256 badgeBalance, uint256 hashBalance, bool hasClaimed)",
        params: address ? [address] : [],
        queryOptions: {
            enabled: !!address,
            queryKey: ["userBalances", address],
        }
    });

    const { data: availableRewardTokens, isLoading: isLoadingAvailableTokens } = useReadContract({
        contract: contractGalxeNftFarm,
        method: "function contractHashBalance() view returns (uint256)",
        params: [],
        queryOptions: {
            queryKey: ["availableRewardTokens"],
        }
    });

    const { data: userRewardAmount, isLoading: isLoadingUserRewardAmount } = useReadContract({
        contract: contractGalxeNftFarm,
        method: "function REWARD_AMOUNT() view returns (uint256)",
        params: [],
        queryOptions: {
            queryKey: ["galxeUserRewardAmount"],
        }
    });

    const { mutate: sendTx, isPending: isClaiming } = useSendTransaction();

    const canClaim = userBalances && userBalances[0] > 0n && userBalances[1] > 0n && !userBalances[3];
    const hasClaimed = userBalances ? userBalances[3] : false;

    const claimReward = () => {
        if (!canClaim || !address) return;

        const transaction = prepareContractCall({
            contract: contractGalxeNftFarm,
            method: "function claim()",
            params: [],
        });

        sendTx(transaction, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["userBalances", address] });
                queryClient.invalidateQueries({ queryKey: ["availableRewardTokens"] });
                // No need to invalidate userRewardAmount as it's a constant
            }
        });
    };

    return {
        canClaim,
        hasClaimed,
        isChecking: isLoadingUserBalances || isLoadingAvailableTokens || isLoadingUserRewardAmount,
        isClaiming,
        claimReward,
        refetch,
        availableRewardTokens,
        userRewardAmount,
    };
};
