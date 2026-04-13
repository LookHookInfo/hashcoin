import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { contractFarmRole } from "@/utils/contracts";
import { prepareContractCall } from "thirdweb";
import { parseAbi } from "viem";
import { useAlchemyReadContract } from "@/hooks/useAlchemyRead";

const farmRoleAbi = parseAbi([
    "function canMint(address user) view returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
]);

export const useRoleClaim = () => {
    const account = useActiveAccount();
    const address = account?.address;

    const { data: canMint, isLoading: isLoadingCanMint, refetch: refetchCanMint } = useAlchemyReadContract<typeof farmRoleAbi, "canMint", [`0x${string}`], boolean>({
        queryKey: ["farm-role", "can-mint", address],
        address: contractFarmRole.address as `0x${string}`,
        abi: farmRoleAbi,
        functionName: "canMint",
        args: address ? [address as `0x${string}`] : undefined,
        enabled: !!address,
        staleTime: 15_000,
    });

    const { data: roleBalance, isLoading: isLoadingRoleBalance, refetch: refetchRoleBalance } = useAlchemyReadContract<typeof farmRoleAbi, "balanceOf", [`0x${string}`], bigint>({
        queryKey: ["farm-role", "balance", address],
        address: contractFarmRole.address as `0x${string}`,
        abi: farmRoleAbi,
        functionName: "balanceOf",
        args: address ? [address as `0x${string}`] : undefined,
        enabled: !!address,
        staleTime: 15_000,
    });

    const { mutate: sendTx, isPending: isMinting } = useSendTransaction();

    const hasMinted = (roleBalance ?? 0n) > 0n;

    const claimRole = () => {
        if (!canMint || !address || hasMinted) return;

        const transaction = prepareContractCall({
            contract: contractFarmRole,
            method: "function mint()",
            params: [],
        });

        sendTx(transaction, {
            onSuccess: () => {
                refetchCanMint();
                refetchRoleBalance();
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
