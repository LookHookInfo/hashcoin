import { useContractRead } from "./useContractRead";
import { memeClient } from "./useAggregatorClient";
import { erc20Abi } from "viem";
import { CONTRACT_ADDRESSES } from "@/utils/constants";

export function useMemeAllowance(token?: string, user?: string) {
    return useContractRead<{ hashAllowance: bigint; memeAllowance: bigint }>({
        fetchFn: async () => {
            if (!token || !user) return { hashAllowance: 0n, memeAllowance: 0n };
            const results = await memeClient.multicall({
                contracts: [
                    {
                        address: CONTRACT_ADDRESSES.HASH_COIN as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "allowance",
                        args: [user as `0x${string}`, CONTRACT_ADDRESSES.GEM_FUN as `0x${string}`],
                    },
                    {
                        address: token as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "allowance",
                        args: [user as `0x${string}`, CONTRACT_ADDRESSES.GEM_FUN as `0x${string}`],
                    },
                    {
                        address: CONTRACT_ADDRESSES.HASH_COIN as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "balanceOf",
                        args: [user as `0x${string}`],
                    },
                    {
                        address: token as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "balanceOf",
                        args: [user as `0x${string}`],
                    },
                ],
            });
            return {
                hashAllowance: BigInt(results[0]?.result ?? 0),
                memeAllowance: BigInt(results[1]?.result ?? 0),
            };
        },
        deps: [token, user],
        enabled: !!token && !!user,
        intervalMs: 20_000,
    });
}
