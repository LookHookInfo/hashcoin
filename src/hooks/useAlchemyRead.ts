import { useQuery, type QueryKey } from "@tanstack/react-query";
import type { Abi, ContractFunctionArgs, ContractFunctionName, ReadContractReturnType } from "viem";
import { alchemyPublicClient, alchemyPublicClient2, alchemyPublicClient3 } from "@/lib/alchemy/client";
import { GEMFUN_ADDRESS, STAKING_ADDRESS, TOOLS_ADDRESS } from "@/utils/contracts";

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
  overrideClient?: any;
};

export function useAlchemyReadContract<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">,
  TArgs extends ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>,
  TData = ReadContractReturnType<TAbi, TFunctionName, TArgs>,
  TSelected = TData,
>({
  queryKey, address, abi, functionName, args, enabled = true, staleTime, refetchInterval, select, overrideClient,
}: UseAlchemyReadContractOptions<TAbi, TFunctionName, TArgs, TData, TSelected>) {
  
  // АВТО-МАРШРУТИЗАЦИЯ:
  const client = useMemo(() => {
    if (overrideClient) return overrideClient;
    const addr = address.toLowerCase();
    
    // Если это GemFun -> RPC 3
    if (addr === GEMFUN_ADDRESS.toLowerCase()) return alchemyPublicClient3;
    
    // Если это Стейкинг или Инструменты -> RPC 2
    if (addr === STAKING_ADDRESS.toLowerCase() || addr === TOOLS_ADDRESS.toLowerCase()) return alchemyPublicClient2;
    
    // Всё остальное -> RPC 1
    return alchemyPublicClient;
  }, [address, overrideClient]);

  return useQuery<TData, Error, TSelected>({
    queryKey,
    queryFn: () => client.readContract({ address, abi, functionName, ...(args ? { args } : {}) }) as Promise<TData>,
    enabled, staleTime, refetchInterval, select,
  });
}

import { useMemo } from "react";
