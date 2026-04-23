import { useActiveAccount } from "thirdweb/react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { fetchFromGoldsky, batchFetchBalances, batchFetchTokenMetadata, store, subscribe } from "@/services/tokenService";
import { watchContractEvents, prepareEvent } from "thirdweb";
import { contractGemFun } from "@/utils/contracts";
import { normalizeMetadata } from "@/hooks/useTokenLogic";

const tradeEvent = prepareEvent({ signature: "event Trade(address indexed token, address indexed user, bool isBuy, uint256 hashAmt, uint256 memeAmt)" });

export function useGemFun() {
    const account = useActiveAccount();
    const [tokens, setTokens] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [globalTradeAddrs, setGlobalTradeAddrs] = useState<string[]>([]);
    const [sessionTrades, setSessionTrades] = useState<Record<string, number>>({});
    const [syncKey, setSyncKey] = useState(0);

    useEffect(() => subscribe(() => setSyncKey(k => k + 1)), []);

    const fetchTokens = useCallback(async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        try {
            const userFilter = account?.address ? `, userTrades: trades(where: { user: "${account.address.toLowerCase()}" }, first: 100) { token { id } }` : "";
            const query = `{ 
                tokens(orderBy: createdAt, orderDirection: desc, first: 100) { 
                    id name symbol logoHash description website twitter telegram guild sold raised miningReserve isMigrated isCurveCompleted creator createdAt updatedAt 
                }
                globalTrades: trades(first: 50, orderBy: timestamp, orderDirection: desc) {
                    token { id }
                }
                ${userFilter}
            }`;
            
            const data = await fetchFromGoldsky(query);
            
            if (data) {
                if (data.tokens) setTokens(data.tokens);
                
                if (data.globalTrades) {
                    const unique = new Set<string>();
                    const addrs: string[] = [];
                    data.globalTrades.forEach((tr: any) => {
                        const a = tr.token.id.toLowerCase();
                        if (!unique.has(a)) { unique.add(a); addrs.push(a); }
                    });
                    setGlobalTradeAddrs(addrs);
                }

                const userAddrs: string[] = [];
                if (data.userTrades) {
                    data.userTrades.forEach((tr: any) => {
                        const a = tr.token.id.toLowerCase();
                        if (!userAddrs.includes(a)) userAddrs.push(a);
                    });
                }

                const allRelevant = [...new Set([...(data.tokens?.map((t:any)=>t.id.toLowerCase()) || []), ...userAddrs])];
                if (account?.address) await batchFetchBalances(account.address, allRelevant);
                await batchFetchTokenMetadata(allRelevant); 
            }
        } finally {
            if (isInitial) setIsLoading(false);
        }
    }, [account?.address]);

    useEffect(() => {
        fetchTokens(true);
        const interval = setInterval(() => fetchTokens(false), 45000);
        const unwatch = watchContractEvents({
            contract: contractGemFun,
            events: [tradeEvent],
            onEvents: (events) => {
                const now = Date.now();
                setSessionTrades(prev => {
                    const next = { ...prev };
                    events.forEach(ev => { next[(ev.args.token as string).toLowerCase()] = now; });
                    return next;
                });
                fetchTokens(false);
            }
        });
        return () => { clearInterval(interval); unwatch(); };
    }, [fetchTokens]);

    const processedData = useMemo(() => {
        const index: Record<string, any> = {};
        const allMetadataKeys = new Set([...tokens.map(t => t.id.toLowerCase()), ...Object.keys(store.meta)]);
        
        allMetadataKeys.forEach(addr => {
            const t = tokens.find(tk => tk.id.toLowerCase() === addr);
            const m = store.meta[addr];
            if (t) {
                const [logo, desc, web, tw, tg, guild] = normalizeMetadata(t.logoHash || "", t.description || "", { website: t.website, twitter: t.twitter, telegram: t.telegram, guild: t.guild });
                index[addr] = { ...t, logo, desc, links: { website: web, twitter: tw, telegram: tg, guild: guild }, stats: [t.isMigrated ? "1" : "0", (t.isCurveCompleted || t.isMigrated) ? "1" : "0", t.sold, t.raised, t.miningReserve] };
            } else if (m) {
                index[addr] = { id: addr, name: m.name, symbol: m.symbol, logo: m.logo, desc: m.desc, links: m.links, stats: m.stats, isMigrated: m.stats[0] === "1" };
            }
        });

        const activeIds = new Set<string>();
        const activeList: string[] = [];

        Object.keys(sessionTrades).sort((a, b) => sessionTrades[b] - sessionTrades[a]).forEach(addr => {
            if (!activeIds.has(addr) && index[addr] && !index[addr].isMigrated) {
                activeIds.add(addr); activeList.push(addr);
            }
        });

        globalTradeAddrs.forEach(addr => {
            if (!activeIds.has(addr) && index[addr] && !index[addr].isMigrated) {
                activeIds.add(addr); activeList.push(addr);
            }
        });

        tokens.forEach(t => {
            const addr = t.id.toLowerCase();
            if (!activeIds.has(addr) && !t.isMigrated) {
                activeIds.add(addr); activeList.push(addr);
            }
        });

        const hold = Object.keys(index).filter(addr => (store.data[addr]?.user?.balance || 0n) > 0n);
        const mining = Object.keys(index).filter(addr => (store.data[addr]?.user?.hashrate || 0n) > 0n);
        const migrated = tokens.filter(t => t.isMigrated).map(t => t.id.toLowerCase());
        const topMcap = [...tokens].filter(t => !t.isMigrated).sort((a,b) => BigInt(b.raised || 0) > BigInt(a.raised || 0) ? 1 : -1).slice(0, 3).map(t => t.id.toLowerCase());

        return { 
            tokenIndex: index, 
            lists: { active: activeList, migrated, hold, mining },
            topMcapTokens: topMcap,
            tradeActivity: sessionTrades
        };
    }, [tokens, globalTradeAddrs, sessionTrades, syncKey]);

    return { ...processedData, isLoading, refresh: () => fetchTokens(true), bumpTokenActivity: () => {} };
}
