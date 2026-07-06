import { useContractRead } from "./useContractRead";
import { gemClient } from "./useAggregatorClient";
import { CONTRACT_ADDRESSES } from "@/utils/constants";

const FACTORY = CONTRACT_ADDRESSES.GEM_FUN.toLowerCase();

const tradeEventAbi = {
    type: "event",
    name: "Trade",
    inputs: [
        { type: "address", name: "token", indexed: true },
        { type: "address", name: "user", indexed: true },
        { type: "bool", name: "isBuy" },
        { type: "uint256", name: "hashAmt" },
        { type: "uint256", name: "memeAmt" },
    ],
} as const;

export interface TradeEvent {
    token: string;
    blockNumber: number;
}

export function useGemRecentTrades(blocksBack = 200) {
    return useContractRead<TradeEvent[]>({
        fetchFn: async () => {
            const currentBlock = await gemClient.getBlockNumber();
            const fromBlock = currentBlock - BigInt(blocksBack);

            const logs = await gemClient.getLogs({
                address: FACTORY as `0x${string}`,
                event: tradeEventAbi as any,
                fromBlock,
                toBlock: "latest",
            });

            const seen = new Set<string>();
            const events: TradeEvent[] = [];
            for (let i = logs.length; i > 0; i--) {
                const raw = (logs as any[])[i - 1];
                const addr = (raw.args?.token ?? "").toLowerCase();
                if (!addr || seen.has(addr)) continue;
                seen.add(addr);
                events.push({
                    token: addr,
                    blockNumber: Number(raw.blockNumber ?? 0),
                });
            }
            return events;
        },
        deps: [blocksBack],
        intervalMs: 20000,
    });
}
