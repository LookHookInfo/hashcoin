import { parseAbi } from "viem";
import { useAlchemyReadContract } from "@/hooks/useAlchemyRead";
import { nameContract } from "../utils/contracts";

const nameAbi = parseAbi([
  "function getPrimaryName(address user) view returns (string)",
]);

export function useDisplayName(address: string | undefined) {
  const fallbackDisplayName = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const { data: primaryName, isLoading } = useAlchemyReadContract<typeof nameAbi, "getPrimaryName", [`0x${string}`], string>({
    queryKey: ["primary-name", address],
    address: nameContract.address as `0x${string}`,
    abi: nameAbi,
    functionName: "getPrimaryName",
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!address,
    staleTime: 60_000,
  });

  return {
    displayName: primaryName ? `${primaryName}.hash` : fallbackDisplayName,
    isLoading: !!address && isLoading,
  };
}
