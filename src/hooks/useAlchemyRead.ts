import { useQuery, type QueryKey } from "@tanstack/react-query";
import type {
  Abi,
  ContractFunctionArgs,
  ContractFunctionName,
  ReadContractReturnType,
} from "viem";
import { alchemyPublicClient } from "@/lib/alchemy/client";

type UseAlchemyReadContractOptions<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">,
  TArgs extends ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>,
  TData,
  TSelected = TData,
> = {
  queryKey: QueryKey;
  address: `0x${string}`;
  abi: TAbi;
  functionName: TFunctionName;
  args?: TArgs;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
  select?: (data: TData) => TSelected;
};

export function useAlchemyReadContract<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">,
  TArgs extends ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>,
  TData = ReadContractReturnType<TAbi, TFunctionName, TArgs>,
  TSelected = TData,
>({
  queryKey,
  address,
  abi,
  functionName,
  args,
  enabled = true,
  staleTime,
  refetchInterval,
  select,
}: UseAlchemyReadContractOptions<TAbi, TFunctionName, TArgs, TData, TSelected>) {
  return useQuery<TData, Error, TSelected>({
    queryKey,
    queryFn: () =>
      alchemyPublicClient.readContract({
        address,
        abi,
        functionName,
        ...(args ? { args } : {}),
      }) as Promise<TData>,
    enabled,
    staleTime,
    refetchInterval,
    select,
  });
}
