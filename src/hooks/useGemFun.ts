import { useActiveAccount } from "thirdweb/react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { fetchFromGoldsky, batchSyncTokens, store, subscribe, updateTokenActivity, notify } from "@/services/tokenService";
import { watchContractEvents, prepareEvent } from "thirdweb";
import { contractGemFun } from "@/utils/contracts";

const tradeEvent = prepareEvent({ signature: "event Trade(address indexed token, address indexed user, bool isBuy, uint256 hashAmt, uint256 memeAmt)" });

export function useGemFun() {
    const account = useActiveAccount();
    const [isLoading, setIsLoading] = useState(true);
    const [syncKey, setSyncKey] = useState(0);

    useEffect(() => subscribe(() => setSyncKey(k => k + 1)), []);

    const fetchAllData = useCallback(async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        
        try {
            const query = `{ 
                tokenCreateds(first: 200) { token }
                tokenRemoveds(first: 100) { token }
                trades(first: 100) { token }
            }`;
            
            const data = await fetchFromGoldsky(query);
            if (!data) return;

            // Обновляем базу удаленных
            store.removed = new Set((data.tokenRemoveds || []).map((t: any) => t.token.toLowerCase()));

            const allAddrs = new Set<string>();
            (data.tokenCreateds || []).forEach((t: any) => { if (t.token) allAddrs.add(t.token.toLowerCase()); });
            (data.trades || []).forEach((t: any) => { if (t.token) allAddrs.add(t.token.toLowerCase()); });

            const addrList = Array.from(allAddrs);
            if (addrList.length > 0) {
                // Синхронизируем статы через Multicall (Market Cap и прочее)
                await batchSyncTokens(addrList, account?.address);
                
                // Инициализируем активность из истории
                if (data.trades) {
                    data.trades.forEach((tr: any, idx: number) => {
                        updateTokenActivity(tr.token, idx + 1);
                    });
                }
            }
        } catch (err) {
            console.error("[useGemFun] Goldsky fetch error:", err);
        } finally {
            if (isInitial) setIsLoading(false);
            notify();
        }
    }, [account?.address]);

    useEffect(() => {
        fetchAllData(true);
        const interval = setInterval(() => fetchAllData(false), 60000);
        
        const unwatch = watchContractEvents({
            contract: contractGemFun,
            events: [tradeEvent],
            onEvents: (events) => {
                const now = Date.now() * 1000;
                events.forEach(ev => updateTokenActivity(ev.args.token as string, now));
                fetchAllData(false);
            }
        });
        return () => { clearInterval(interval); unwatch(); };
    }, [fetchAllData]);

    const lists = useMemo(() => {
        const index = store.meta;
        const allKeys = Object.keys(index).filter(addr => !store.removed.has(addr));

        // ЕДИНАЯ ЛОГИКА СОРТИРОВКИ (Recently Active + Market Cap)
        const active = allKeys
            .filter(addr => index[addr]?.stats?.[0] === "0")
            .sort((a, b) => {
                const metaA = index[a];
                const metaB = index[b];

                // Считаем "горячий вес"
                // 1. Время последней активности (самый важный фактор)
                const activityA = metaA.lastActivity || 0;
                const activityB = metaB.lastActivity || 0;

                // 2. Market Cap как дополнительный фактор закрепления
                const mcapA = Number(BigInt(metaA.stats[3] || 0) / 1000000000000000n);
                const mcapB = Number(BigInt(metaB.stats[3] || 0) / 1000000000000000n);

                const scoreA = activityA + (mcapA / 1000); // Mcap дает небольшой бонус
                const scoreB = activityB + (mcapB / 1000);

                return scoreB - scoreA;
            });

        const migrated = allKeys.filter(addr => index[addr]?.stats?.[0] === "1");
        const hold = allKeys.filter(addr => (store.data[addr]?.user?.balance || 0n) > 0n);
        const mining = allKeys.filter(addr => (store.data[addr]?.user?.hashrate || 0n) > 0n);

        return { active, migrated, hold, mining, index };
    }, [syncKey]);

    return { 
        tokenIndex: lists.index, 
        lists: { active: lists.active, migrated: lists.migrated, hold: lists.hold, mining: lists.mining },
        isLoading, 
        refresh: () => fetchAllData(true) 
    };
}
