import { alchemyRpcRequest } from "@/lib/alchemy/client";
import { getContract, readContract } from "thirdweb";
import { contractGemFun } from "@/utils/contracts";
import { client } from "@/lib/thirdweb/client";
import { chain } from "@/lib/thirdweb/chain";

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
        const response = await fetch(GOLDSKY_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
        const json = await response.json();
        return json.data;
    } catch { return null; }
}

export async function batchFetchBalances(user: string, addresses: string[]) {
    try {
        const res = await alchemyRpcRequest<any>('alchemy_getTokenBalances', [user, addresses]);
        const balances: Record<string, bigint> = {};
        res?.tokenBalances?.forEach((i: any) => balances[i.contractAddress.toLowerCase()] = BigInt(i.tokenBalance || '0'));
        return balances;
    } catch { return {}; }
}

export async function syncTokenFullData(addr: string, user?: string) {
    const addrL = addr.toLowerCase();
    try {
        const data = await readContract({ contract: contractGemFun, method: "function getTokenFullData(address token) view returns ((string name, string symbol, bytes32 logoHash, string description) core, (string website, string twitter, string telegram, string guild) meta, address creator, uint256[5] stats)", params: [addr] }) as any;
        store.data[addrL] = { stats: data[3], meta: { core: data[0], meta: data[1] }, timestamp: Date.now() };
        if (user) {
            const [bal, acc] = await Promise.all([
                readContract({ contract: getContract({ client, chain, address: addr }), method: "function balanceOf(address) view returns (uint256)", params: [user] }),
                readContract({ contract: contractGemFun, method: "function getAccountData(address tokenAddr, address user) view returns (uint256 walletBalance, uint256 totalHashrate, uint256 pendingRewards, uint256[6] stakedItems)", params: [addr, user] })
            ]);
            store.data[addrL].user = { balance: bal, hashrate: acc[1] };
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
