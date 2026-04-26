import { alchemyPublicClient3 } from "@/lib/alchemy/client";
import { contractGemFun, contractTools, contractStaking, USDC_ADDRESS } from "@/utils/contracts";
import gemfunAbi from "@/lib/abi/gemfun.json";
import { Abi, parseAbi } from "viem";
import { normalizeMetadata } from "@/hooks/useTokenLogic";

const GOLDSKY_ENDPOINT = "https://api.goldsky.com/api/public/project_cmmp3iit7vqsd01wr182p5fzi/subgraphs/MiningHash/1.0.0/gn";

const SHOP_ABI = parseAbi([
    "function getStakeInfoForToken(uint256 _tokenId, address _staker) view returns (uint256, uint256)",
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function isApprovedForAll(address account, address operator) view returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
]);

export interface CachedGemTokenMeta {
    name: string; symbol: string; logo: string; desc: string;
    links: { website: string; twitter: string; telegram: string; guild: string; };
    stats: [string, string, string, string, string];
    creator: string;
    lastActivity: number;
}

export const store = {
    data: {} as Record<string, any>,
    meta: {} as Record<string, CachedGemTokenMeta>,
    shop: {} as Record<string, any>, 
    removed: new Set<string>(),
    listeners: new Set<() => void>(),
};

export const subscribe = (l: () => void) => { store.listeners.add(l); return () => { store.listeners.delete(l); }; };
export const notify = () => store.listeners.forEach(l => l());

export async function fetchFromGoldsky(query: string) {
    try {
        const response = await fetch(GOLDSKY_ENDPOINT, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) 
        });
        const json = await response.json();
        return json.data || null;
    } catch (e) { return null; }
}

/**
 * СИНХРОНИЗАЦИЯ МАГАЗИНА: Балансы и стейкинг через Multicall
 */
export async function batchSyncShop(tokenIds: bigint[], user?: string) {
    if (!tokenIds.length) return;
    
    try {
        const contracts: any[] = [];
        tokenIds.forEach(id => {
            if (user) {
                contracts.push({ address: contractTools.address, abi: SHOP_ABI, functionName: "balanceOf", args: [user, id] });
                contracts.push({ address: contractStaking.address, abi: SHOP_ABI, functionName: "getStakeInfoForToken", args: [id, user] });
            }
        });
        
        if (user) {
            contracts.push({ address: contractTools.address, abi: SHOP_ABI, functionName: "isApprovedForAll", args: [user, contractStaking.address] });
            contracts.push({ address: USDC_ADDRESS, abi: SHOP_ABI, functionName: "balanceOf", args: [user] });
            contracts.push({ address: USDC_ADDRESS, abi: SHOP_ABI, functionName: "allowance", args: [user, contractTools.address] });
        }

        const results = await alchemyPublicClient3.multicall({ contracts, allowFailure: true });
        let resIdx = 0;

        tokenIds.forEach(id => {
            const idStr = id.toString();
            if (!store.shop[idStr]) store.shop[idStr] = {};
            if (user) {
                const balRes = results[resIdx++];
                const stakeRes = results[resIdx++];
                if (balRes.status === "success") store.shop[idStr].balance = balRes.result;
                if (stakeRes.status === "success") {
                    const [staked, rewards] = stakeRes.result as [bigint, bigint];
                    store.shop[idStr].staked = staked;
                    store.shop[idStr].rewards = rewards;
                }
            }
        });

        if (user) {
            const appRes = results[resIdx++];
            const usdcBalRes = results[resIdx++];
            const usdcAllowRes = results[resIdx++];
            store.shop.user = {
                isApproved: appRes.status === "success" ? appRes.result : false,
                usdcBalance: usdcBalRes.status === "success" ? usdcBalRes.result : 0n,
                usdcAllowance: usdcAllowRes.status === "success" ? usdcAllowRes.result : 0n
            };
        }
        notify();
    } catch (e) { console.error("[TokenService] Shop Sync failed", e); }
}

export async function batchSyncTokens(addresses: string[], user?: string) {
    if (!addresses.length) return;
    const cleanAddrs = addresses.filter(a => !store.removed.has(a.toLowerCase()));
    try {
        const contracts: any[] = [];
        cleanAddrs.forEach(addr => {
            contracts.push({ address: contractGemFun.address as `0x${string}`, abi: gemfunAbi as Abi, functionName: "getTokenFullData", args: [addr] });
            if (user) {
                contracts.push({ address: contractGemFun.address as `0x${string}`, abi: gemfunAbi as Abi, functionName: "getAccountData", args: [addr, user] });
            }
        });
        const results = await alchemyPublicClient3.multicall({ contracts, allowFailure: true });
        let resIdx = 0;
        cleanAddrs.forEach(addr => {
            const addrL = addr.toLowerCase();
            const metaRes = results[resIdx++];
            if (metaRes.status === "success" && metaRes.result) {
                const d = metaRes.result as any;
                const core = d.core || d[0];
                const linksRaw = d.meta || d[1];
                const creator = d.creator || d[2];
                const stats = d.stats || d[3];
                const [logo, desc, web, tw, tg, guild] = normalizeMetadata(core.logoHash, core.description, linksRaw);
                store.meta[addrL] = {
                    name: core.name, symbol: core.symbol, logo, desc,
                    links: { website: web, twitter: tw, telegram: tg, guild: guild },
                    stats: [ (stats[0] ? "1" : "0"), (stats[1] ? "1" : "0"), stats[2].toString(), stats[3].toString(), stats[4].toString() ],
                    creator, lastActivity: store.meta[addrL]?.lastActivity || 0
                };
                store.data[addrL] = { stats, meta: { core, meta: linksRaw } };
            }
            if (user) {
                const accRes = results[resIdx++];
                if (accRes && accRes.status === "success" && accRes.result) {
                    const acc = accRes.result as any;
                    if (!store.data[addrL]) store.data[addrL] = {};
                    store.data[addrL].user = { balance: acc.walletBalance || acc[0], hashrate: acc.totalHashrate || acc[1] };
                }
            }
        });
        notify();
    } catch (e) { console.error("[TokenService] Multicall failed", e); }
}

export function updateTokenActivity(addr: string, timestamp: number) {
    const addrL = addr.toLowerCase();
    if (store.meta[addrL]) { store.meta[addrL].lastActivity = timestamp; notify(); }
}
