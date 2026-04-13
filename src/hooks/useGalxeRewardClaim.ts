import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { contractGalxeNftFarm } from "@/utils/contracts";
import { prepareContractCall } from "thirdweb";
import { parseAbi } from "viem";
import { useAlchemyReadContract } from "@/hooks/useAlchemyRead";

const galxeNftFarmAbi = parseAbi([
    "function getUserBalances(address user) view returns (uint256 nftBalance, uint256 badgeBalance, uint256 hashBalance, bool hasClaimed)",
    "function contractHashBalance() view returns (uint256)",
    "function REWARD_AMOUNT() view returns (uint256)",
]);

export const useGalxeRewardClaim = () => {
    const account = useActiveAccount();
    const address = account?.address;

    const { data: userBalances, isLoading: isLoadingUserBalances, refetch: refetchUserBalances } = useAlchemyReadContract<typeof galxeNftFarmAbi, "getUserBalances", [`0x${string}`], [bigint, bigint, bigint, boolean]>({
        queryKey: ["galxe-reward", "user-balances", address],
        address: contractGalxeNftFarm.address as `0x${string}`,
        abi: galxeNftFarmAbi,
        functionName: "getUserBalances",
        args: address ? [address as `0x${string}`] : undefined,
        enabled: !!address,
        staleTime: 15_000,
    });

    const { data: availableRewardTokens, isLoading: isLoadingAvailableTokens, refetch: refetchAvailableRewardTokens } = useAlchemyReadContract<typeof galxeNftFarmAbi, "contractHashBalance", [], bigint>({
        queryKey: ["galxe-reward", "contract-hash-balance"],
        address: contractGalxeNftFarm.address as `0x${string}`,
        abi: galxeNftFarmAbi,
        functionName: "contractHashBalance",
        staleTime: 15_000,
    });

    const { data: userRewardAmount, isLoading: isLoadingUserRewardAmount } = useAlchemyReadContract<typeof galxeNftFarmAbi, "REWARD_AMOUNT", [], bigint>({
        queryKey: ["galxe-reward", "reward-amount"],
        address: contractGalxeNftFarm.address as `0x${string}`,
        abi: galxeNftFarmAbi,
        functionName: "REWARD_AMOUNT",
        staleTime: Infinity,
    });

    const { mutate: sendTx, isPending: isClaiming } = useSendTransaction();

    const canClaim = !!userBalances && userBalances[0] > 0n && userBalances[1] > 0n && !userBalances[3];
    const hasClaimed = !!userBalances && userBalances[3];

    const claimReward = () => {
        if (!canClaim || !address) return;

        const transaction = prepareContractCall({
            contract: contractGalxeNftFarm,
            method: "function claim()",
            params: [],
        });

        sendTx(transaction, {
            onSuccess: () => {
                refetchUserBalances();
                refetchAvailableRewardTokens();
            }
        });
    };

    return {
        canClaim,
        hasClaimed,
        isChecking: isLoadingUserBalances || isLoadingAvailableTokens || isLoadingUserRewardAmount,
        isClaiming,
        claimReward,
        availableRewardTokens,
        userRewardAmount,
    };
};
