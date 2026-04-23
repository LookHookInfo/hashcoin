import { alchemyPublicClient3 } from "@/lib/alchemy/client";
import { contractGemFun } from "@/utils/contracts";
import gemfunAbi from "@/lib/abi/gemfun.json";
import { Abi } from "viem";

const GOLDSKY_ENDPOINT = "https://api.goldsky.com/api/public/project_cmmp3iit7vqsd01wr182p5fzi/subgraphs/MiningHash/1.0.0/gn";

export interface CachedGemTokenMeta {
    name: string; symbol: string; logo: string; desc: string;
    links: { website: string; twitter: string; telegram: string; guild: string; };
    stats: [string, string, string, string, string];
    creator: string; fromGoldsky: boolean;
}

export const store = {
    data: {} as Record<string, any>,
    meta: {} as Record<string, CachedGemTokenMeta>,
    listeners: new Set<() => void>(),
};

export const subscribe = (l: () => void) => { store.listeners.add(l); return () => store.listeners.delete(l); };
const notify = () => store.listeners.forEach(l => l());

export async function fetchFromGoldsky(query: string) {
    try {
        const response = await fetch(GOLDSKY_ENDPOINT, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) 
        });
        const json = await response.json();
        if (json.data?.tokens?.length > 0) return json.data;
    } catch (e) {
        console.warn("[TokenService] Goldsky failed, using RPC 3...");
    }

    try {
        const addresses = await alchemyPublicClient3.readContract({
            address: contractGemFun.address as `0x${string}`,
            abi: gemfunAbi as Abi,
            functionName: "getTokensPage",
            args: [0n, 50n]
        }) as string[];

        if (!addresses) return { tokens: [] };

        const tokens = await Promise.all(addresses.map(async (addr, i) => {
            try {
                const data = await alchemyPublicClient3.readContract({
                    address: contractGemFun.address as `0x${string}`,
                    abi: gemfunAbi as Abi,
                    functionName: "getTokenFullData",
                    args: [addr as `0x${string}`]
                }) as any;
                const core = data.core || data[0];
                const meta = data.meta || data[1];
                const creator = data.creator || data[2];
                const stats = data.stats || data[3];
                return {
                    id: addr.toLowerCase(), name: core.name, symbol: core.symbol, logoHash: core.logoHash, description: core.description,
                    website: meta.website, twitter: meta.twitter, telegram: meta.telegram, guild: meta.guild,
                    sold: stats[2].toString(), raised: stats[3].toString(), miningReserve: stats[4].toString(),
                    isMigrated: stats[0] === 1n || stats[0] === true, isCurveCompleted: stats[1] === 1n || stats[1] === true,
                    creator: creator, createdAt: (Date.now() / 1000 - i).toString(), updatedAt: (Date.now() / 1000).toString()
                };
            } catch (e) { return null; }
        }));
        return { tokens: tokens.filter(t => t !== null) };
    } catch (fallbackErr) {
        return { tokens: [] };
    }
}

export async function batchFetchBalances(user: string, addresses: string[]) {
    try {
        const balances: Record<string, bigint> = {};
        for (let i = 0; i < addresses.length; i += 10) {
            const batch = addresses.slice(i, i + 10);
            await Promise.all(batch.map(async (addr) => {
                try {
                    const data = await alchemyPublicClient3.readContract({
                        address: contractGemFun.address as `0x${string}`,
                        abi: gemfunAbi as Abi,
                        functionName: "getAccountData",
                        args: [addr as `0x${string}`, user as `0x${string}`]
                    }) as any;
                    const bal = data.walletBalance || data[0] || 0n;
                    if (bal > 0n) balances[addr.toLowerCase()] = bal;
                } catch { }
            }));
            await new Promise(r => setTimeout(r, 50));
        }
        return balances;
    } catch (err) { return {}; }
}

export async function batchFetchTokenMetadata(addresses: string[]) {
    try {
        const metadata: Record<string, CachedGemTokenMeta> = {};
        for (let i = 0; i < addresses.length; i += 10) {
            const batch = addresses.slice(i, i + 10);
            await Promise.all(batch.map(async (addr) => {
                try {
                    const data = await alchemyPublicClient3.readContract({
                        address: contractGemFun.address as `0x${string}`,
                        abi: gemfunAbi as Abi,
                        functionName: "getTokenFullData",
                        args: [addr as `0x${string}`]
                    }) as any;
                    const core = data.core || data[0];
                    const meta = data.meta || data[1];
                    const stats = data.stats || data[3];
                    const creator = data.creator || data[2];
                    const addrL = addr.toLowerCase();
                    metadata[addrL] = {
                        name: core.name, symbol: core.symbol, logo: core.logoHash, desc: core.description,
                        links: { website: meta.website || "", twitter: meta.twitter || "", telegram: meta.telegram || "", guild: meta.guild || "" },
                        stats: [ (stats[0] === 1n ? "1" : "0"), (stats[1] === 1n ? "1" : "0"), stats[2].toString(), stats[3].toString(), stats[4].toString() ],
                        creator, fromGoldsky: false
                    };
                    store.data[addrL] = { stats: stats, meta: { core, meta }, timestamp: Date.now() };
                } catch (e) { }
            }));
            await new Promise(r => setTimeout(r, 50));
        }
        return metadata;
    } catch (err) { return {}; }
}

export async function syncTokenFullData(addr: string, user?: string) {
    const addrL = addr.toLowerCase();
    try {
        const data = await alchemyPublicClient3.readContract({
            address: contractGemFun.address as `0x${string}`,
            abi: gemfunAbi as Abi,
            functionName: "getTokenFullData",
            args: [addr as `0x${string}`]
        }) as any;
        const stats = data.stats || data[3];
        const core = data.core || data[0];
        const meta = data.meta || data[1];
        store.data[addrL] = { stats, meta: { core, meta }, timestamp: Date.now() };
        if (user) {
            const acc = await alchemyPublicClient3.readContract({
                address: contractGemFun.address as `0x${string}`,
                abi: gemfunAbi as Abi,
                functionName: "getAccountData",
                args: [addr as `0x${string}`, user as `0x${string}`]
            }) as any;
            store.data[addrL].user = { balance: acc.walletBalance || acc[0], hashrate: acc.totalHashrate || acc[1] };
        }
        notify();
    } catch {}
}

export function getFilteredLists(user: string | undefined) {
    const lists = { hold: [] as string[], mining: [] as string[], migrated: [] as string[], active: [] as string[] };
    Object.keys(store.data).forEach(addr => {
        const item = store.data[addr];
        const stats = item.stats || [0n, 0n, 0n, 0n, 0n];
        const isMigrated = stats[0] === 1n || stats[0] === true;
        if (isMigrated) lists.migrated.push(addr); else lists.active.push(addr);
        if (item.user) {
            if (item.user.balance > 0n) lists.hold.push(addr);
            if (item.user.hashrate > 0n) lists.mining.push(addr);
        }
    });
    return lists;
}
