import { useContractRead } from "./useContractRead";
import { gemClient } from "./useAggregatorClient";
import { CONTRACT_ADDRESSES } from "@/utils/constants";

const GEM_FUN = CONTRACT_ADDRESSES.GEM_FUN.toLowerCase();
const STORAGE_KEY = "minig_hash_removed_tokens";
const BLOCK_KEY = "minig_hash_removed_last_block";
const MAX_RANGE = 500n;

const tokenRemovedEventAbi = {
    type: "event",
    name: "TokenRemoved",
    inputs: [
        { type: "address", name: "token", indexed: true },
    ],
} as const;

function loadCache(): { addresses: string[]; lastBlock: number } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const blockRaw = localStorage.getItem(BLOCK_KEY);
        if (!raw || !blockRaw) return { addresses: [], lastBlock: 0 };
        return { addresses: JSON.parse(raw), lastBlock: Number(blockRaw) };
    } catch {
        return { addresses: [], lastBlock: 0 };
    }
}

function saveCache(addresses: string[], lastBlock: number) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
        localStorage.setItem(BLOCK_KEY, String(lastBlock));
    } catch { /* quota exceeded — ignore */ }
}

export function useRemovedTokens() {
    return useContractRead<Set<string>>({
        fetchFn: async () => {
            const cache = loadCache();
            const currentBlock = await gemClient.getBlockNumber();
            const cachedBlock = BigInt(cache.lastBlock);

            if (cachedBlock === 0n) {
                const fromBlock = currentBlock > MAX_RANGE ? currentBlock - MAX_RANGE : 0n;
                const logs = await gemClient.getLogs({
                    address: GEM_FUN as `0x${string}`,
                    event: tokenRemovedEventAbi as any,
                    fromBlock,
                    toBlock: "latest",
                });

                const removed: string[] = [];
                for (const raw of logs as any[]) {
                    const addr = (raw.args?.token ?? "").toLowerCase();
                    if (addr) removed.push(addr);
                }
                saveCache(removed, Number(currentBlock));
                return new Set(removed);
            }

            if (currentBlock <= cachedBlock) {
                return new Set(cache.addresses);
            }

            const range = currentBlock - cachedBlock;
            if (range > MAX_RANGE) {
                const fromBlock = currentBlock - MAX_RANGE;
                const logs = await gemClient.getLogs({
                    address: GEM_FUN as `0x${string}`,
                    event: tokenRemovedEventAbi as any,
                    fromBlock,
                    toBlock: "latest",
                });
                const merged = new Set(cache.addresses);
                for (const raw of logs as any[]) {
                    const addr = (raw.args?.token ?? "").toLowerCase();
                    if (addr) merged.add(addr);
                }
                const all = [...merged];
                saveCache(all, Number(currentBlock));
                return new Set(all);
            }

            const logs = await gemClient.getLogs({
                address: GEM_FUN as `0x${string}`,
                event: tokenRemovedEventAbi as any,
                fromBlock: cachedBlock + 1n,
                toBlock: "latest",
            });

            const merged = new Set(cache.addresses);
            for (const raw of logs as any[]) {
                const addr = (raw.args?.token ?? "").toLowerCase();
                if (addr) merged.add(addr);
            }
            const all = [...merged];
            saveCache(all, Number(currentBlock));
            return new Set(all);
        },
        deps: [],
        intervalMs: 120_000,
    });
}
