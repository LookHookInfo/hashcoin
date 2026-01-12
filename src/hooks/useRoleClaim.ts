import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { contractFarmRole } from "@/utils/contracts";
import { prepareContractCall } from "thirdweb";
import { useQueryClient } from "@tanstack/react-query";

export const useRoleClaim = () => {
    const account = useActiveAccount();
    const address = account?.address;
    const queryClient = useQueryClient();

    const { data: canMint, isLoading: isLoadingCanMint } = useReadContract({
        contract: contractFarmRole,
        method: "function canMint(address user) view returns (bool)",
        params: address ? [address] : [],
        queryOptions: {
            enabled: !!address,
            queryKey: ["canMintRole", address],
        }
    });

    const { data: roleBalance, isLoading: isLoadingRoleBalance } = useReadContract({
        contract: contractFarmRole,
        method: "function balanceOf(address owner) view returns (uint256)",
        params: address ? [address] : [],
        queryOptions: {
            enabled: !!address,
            queryKey: ["roleBalance", address],
        }
    });

    const { mutate: sendTx, isPending: isMinting } = useSendTransaction();

    const hasMinted = roleBalance && roleBalance > 0n;

    const claimRole = () => {
        if (!canMint || !address || hasMinted) return;

        const transaction = prepareContractCall({
            contract: contractFarmRole,
            method: "function mint()",
            params: [],
        });

        sendTx(transaction, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["canMintRole", address] });
                queryClient.invalidateQueries({ queryKey: ["roleBalance", address] });
            }
        });
    };

    return {
        canMint: canMint ?? false,
        hasMinted,
        isChecking: isLoadingCanMint || isLoadingRoleBalance,
        isMinting,
        claimRole,
    };
};
