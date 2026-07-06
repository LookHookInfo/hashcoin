import { useMemo } from "react";
import { useAccount as useWagmiAccount } from "wagmi";

/**
 * Lightweight adapter around wagmi's `useAccount` that returns the same
 * `{ address }` shape the codebase uses (formerly thirdweb's `useActiveAccount`).
 *
 * Memoized so the returned object identity is stable across renders for the
 * same address — important because this object is used as a hook dependency
 * and prop in several places (TradePanel, MiningPanel, useTokenLogic).
 */
export function useAccount(): { address: `0x${string}` } | undefined {
  const { address } = useWagmiAccount();
  return useMemo(() => (address ? { address } : undefined), [address]);
}
