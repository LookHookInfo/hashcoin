import { readContract } from "thirdweb";
import { contractGemFun } from "@/utils/contracts";

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
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ query }) 
        });
        if (!response.ok) throw new Error("HTTP error " + response.status);
        const json = await response.json();
        if (json.data && json.data.tokens && json.data.tokens.length > 0) {
            return json.data;
        }
        console.warn("Goldsky returned no tokens, checking RPC fallback...");
    } catch (err) {
        console.warn("Goldsky fetch failed, checking RPC fallback:", err);
    }

    // FALLBACK: Fetch tokens directly from contract via getTokensPage
    try {
        const addresses = await readContract({
            contract: contractGemFun,
            method: "function getTokensPage(uint256 offset, uint256 limit) view returns (address[])",
            params: [0n, 50n] // Fetch last 50 tokens
        }) as string[];

        if (!addresses || addresses.length === 0) return { tokens: [] };

        const tokens = await Promise.all(addresses.map(async (addr, i) => {
            try {
                const data = await readContract({
                    contract: contractGemFun,
                    method: "function getTokenFullData(address token) view returns ((string name, string symbol, bytes32 logoHash, string description) core, (string website, string twitter, string telegram, string guild) meta, address creator, uint256[5] stats)",
                    params: [addr]
                }) as any;
                
                return {
                    id: addr.toLowerCase(),
                    name: data[0].name,
                    symbol: data[0].symbol,
                    logoHash: data[0].logoHash,
                    description: data[0].description,
                    website: data[1].website,
                    twitter: data[1].twitter,
                    telegram: data[1].telegram,
                    guild: data[1].guild,
                    sold: data[3][2].toString(),
                    raised: data[3][3].toString(),
                    miningReserve: data[3][4].toString(),
                    isMigrated: data[3][0] === 1n || data[3][0] === true,
                    isCurveCompleted: data[3][1] === 1n || data[3][1] === true,
                    creator: data[2],
                    // Создаем стабильные метки времени на основе индекса, чтобы новые были "свежее"
                    createdAt: (1710000000 + i).toString(), 
                    updatedAt: data[3][3] > 0n ? (1720000000 + i).toString() : (1710000000 + i).toString()
                };
            } catch (e) {
                console.error(`Error fetching RPC data for token ${addr}:`, e);
                return null;
            }
        }));

        return { tokens: tokens.filter(t => t !== null) };
    } catch (fallbackErr) {
        console.error("Critical: Both Goldsky and RPC fallback failed", fallbackErr);
        return null;
    }
}

// SAFE SYNC: Пакетное получение балансов через стандартный RPC (поддержка Ankr/Alchemy/etc)
export async function batchFetchBalances(user: string, addresses: string[]) {
    try {
        console.log(`[BatchFetch] Syncing ${addresses.length} tokens via standard RPC (Safe Sync)`);
        const balances: Record<string, bigint> = {};
        
        // Разбиваем на пачки по 10 запросов, чтобы не "повесить" публичные RPC типа Ankr
        const BATCH_SIZE = 10;
        for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
            const batch = addresses.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (addr) => {
                try {
                    const data = await readContract({
                        contract: contractGemFun,
                        method: "function getAccountData(address tokenAddr, address user) view returns (uint256 walletBalance, uint256 totalHashrate, uint256 pendingRewards, uint256[6] stakedItems)",
                        params: [addr, user]
                    }) as any;
                    
                    const bal = data[0] || 0n;
                    if (bal > 0n) {
                        balances[addr.toLowerCase()] = bal;
                    }
                } catch { /* игнорируем ошибки отдельных токенов */ }
            }));
            
            // Микро-пауза между пачками для стабильности на Ankr
            if (i + BATCH_SIZE < addresses.length) {
                await new Promise(r => setTimeout(r, 100));
            }
        }
        
        console.log(`[BatchFetch] Found ${Object.keys(balances).length} tokens with balance`);
        return balances;
    } catch (err) { 
        console.error("[BatchFetch] Critical error:", err);
        return {}; 
    }
}

export async function batchFetchTokenMetadata(addresses: string[]) {
    try {
        const metadata: Record<string, CachedGemTokenMeta> = {};
        const BATCH_SIZE = 15;
        
        for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
            const batch = addresses.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (addr) => {
                try {
                    const data = await readContract({
                        contract: contractGemFun,
                        method: "function getTokenFullData(address token) view returns ((string name, string symbol, bytes32 logoHash, string description) core, (string website, string twitter, string telegram, string guild) meta, address creator, uint256[5] stats)",
                        params: [addr]
                    }) as any;

                    const addrL = addr.toLowerCase();
                    const isMig = data[3][0] === 1n || data[3][0] === true;
                    
                    metadata[addrL] = {
                        name: data[0].name,
                        symbol: data[0].symbol,
                        logo: data[0].logoHash,
                        desc: data[0].description,
                        links: {
                            website: data[1].website || "",
                            twitter: data[1].twitter || "",
                            telegram: data[1].telegram || "",
                            guild: data[1].guild || ""
                        },
                        stats: [
                            isMig ? "1" : "0",
                            (data[3][1] === 1n || data[3][1] === true) ? "1" : "0",
                            data[3][2].toString(),
                            data[3][3].toString(),
                            data[3][4].toString()
                        ],
                        creator: data[2],
                        fromGoldsky: false
                    };
                } catch (e) {
                    console.error(`[BatchMeta] Error for ${addr}:`, e);
                }
            }));
            if (i + BATCH_SIZE < addresses.length) await new Promise(r => setTimeout(r, 50));
        }
        return metadata;
    } catch (err) {
        console.error("[BatchMeta] Critical error:", err);
        return {};
    }
}

export async function syncTokenFullData(addr: string, user?: string) {
    const addrL = addr.toLowerCase();
    try {
        const data = await readContract({ contract: contractGemFun, method: "function getTokenFullData(address token) view returns ((string name, string symbol, bytes32 logoHash, string description) core, (string website, string twitter, string telegram, string guild) meta, address creator, uint256[5] stats)", params: [addr] }) as any;
        store.data[addrL] = { stats: data[3], meta: { core: data[0], meta: data[1] }, timestamp: Date.now() };
        if (user) {
            const acc = await readContract({ contract: contractGemFun, method: "function getAccountData(address tokenAddr, address user) view returns (uint256 walletBalance, uint256 totalHashrate, uint256 pendingRewards, uint256[6] stakedItems)", params: [addr, user] }) as any;
            store.data[addrL].user = { balance: acc[0], hashrate: acc[1] };
        }
        notify();
    } catch {}
}

export function getFilteredLists(user: string | undefined) {
    const lists = { hold: [] as string[], mining: [] as string[], migrated: [] as string[], active: [] as string[] };
    Object.keys(store.data).forEach(addr => {
        const item = store.data[addr];
        const isMigrated = item.stats[0] === 1n;
        if (isMigrated) lists.migrated.push(addr); else lists.active.push(addr);
        if (item.user) {
            if (item.user.balance > 0n) lists.hold.push(addr);
            if (item.user.hashrate > 0n) lists.mining.push(addr);
        }
    });
    return lists;
}
