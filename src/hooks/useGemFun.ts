import { useActiveAccount } from "thirdweb/react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { fetchFromGoldsky, batchFetchBalances, batchFetchTokenMetadata, store, subscribe, type CachedGemTokenMeta } from "@/services/tokenService";
import { watchContractEvents, prepareEvent, getContractEvents } from "thirdweb";
import { contractGemFun } from "@/utils/contracts";
import { normalizeMetadata } from "@/hooks/useTokenLogic";

const tradeEvent = prepareEvent({
  signature: "event Trade(address indexed token, address indexed user, bool isBuy, uint256 hashAmt, uint256 memeAmt)"
});

const tokenCreatedEvent = prepareEvent({
    signature: "event TokenCreated(address indexed token, address indexed creator)"
});

export function useGemFun() {
    const account = useActiveAccount();
    const [tokens, setTokens] = useState<any[]>([]);
    const [lastTrades, setLastTrades] = useState<any[]>([]);
    const [rpcLoading, setRpcLoading] = useState(false);
    const [userBalances, setUserBalances] = useState<Record<string, bigint>>({});
    const [userHashrates, setUserHashrates] = useState<Record<string, bigint>>({});
    const [liveActivity, setLiveActivity] = useState<Record<string, number>>({});
    const [blockchainHistory, setBlockchainHistory] = useState<string[]>([]);
    const [rpcMetadataIndex, setRpcMetadataIndex] = useState<Record<string, CachedGemTokenMeta>>({});
    
    // 1. Слушаем живые события
    useEffect(() => {
        const unwatch = watchContractEvents({
            contract: contractGemFun,
            events: [tradeEvent, tokenCreatedEvent],
            onEvents: (events) => {
                events.forEach(event => {
                    const addr = (event.args.token as string).toLowerCase();
                    const now = Date.now();
                    setLiveActivity(prev => ({ ...prev, [addr]: now }));
                });
            }
        });
        return () => unwatch();
    }, []);

    // Синхронизация с глобальным хранилищем сервиса
    useEffect(() => {
        const updateFromStore = () => {
            const balances: Record<string, bigint> = {};
            const hashrates: Record<string, bigint> = {};
            Object.keys(store.data).forEach(addr => {
                const u = store.data[addr].user;
                if (u) {
                    if (u.balance) balances[addr] = u.balance;
                    if (u.hashrate) hashrates[addr] = u.hashrate;
                }
            });
            setUserBalances(prev => ({ ...prev, ...balances }));
            setUserHashrates(prev => ({ ...prev, ...hashrates }));
        };
        
        const unsubscribe = subscribe(updateFromStore);
        return () => { unsubscribe(); };
    }, []);

    const fetchTokens = useCallback(async () => {
        setRpcLoading(true);
        try {
            const query = `{ 
                tokens(orderBy: createdAt, orderDirection: desc, first: 100) { 
                    id name symbol logoHash description website twitter telegram guild sold raised miningReserve isMigrated isCurveCompleted creator createdAt updatedAt 
                } 
                trades(first: 50, orderBy: timestamp, orderDirection: desc) {
                    token { id }
                    timestamp
                }
            }`;
            
            const [data, events] = await Promise.all([
                fetchFromGoldsky(query),
                getContractEvents({
                    contract: contractGemFun,
                    events: [tradeEvent, tokenCreatedEvent]
                }).catch(() => [])
            ]);
            
            if (data?.tokens) {
                setTokens(data.tokens);
                if (data.trades) setLastTrades(data.trades);

                // Обработка прямых логов блокчейна
                const uniqueBlockchainAddrs: string[] = [];
                if (events && events.length > 0) {
                    const seen = new Set<string>();
                    const latestEvents = [...events].reverse();
                    latestEvents.forEach(ev => {
                        const addr = (ev.args.token as string).toLowerCase();
                        if (!seen.has(addr)) {
                            seen.add(addr);
                            uniqueBlockchainAddrs.push(addr);
                        }
                    });
                    setBlockchainHistory(uniqueBlockchainAddrs);
                }

                const addresses = data.tokens.map((t: any) => t.id);
                // Добавляем адреса из блокчейна, которых нет в сабграфе
                const goldskyIds = new Set(addresses.map((id: string) => id.toLowerCase()));
                const missingAddrs = uniqueBlockchainAddrs.filter(addr => !goldskyIds.has(addr));

                const allAddrsForMeta = [...new Set([...addresses, ...uniqueBlockchainAddrs])];

                if (account?.address) {
                    const balances = await batchFetchBalances(account.address, allAddrsForMeta);
                    setUserBalances(prev => ({ ...prev, ...balances }));
                }

                if (missingAddrs.length > 0) {
                    const missingMetas = await batchFetchTokenMetadata(missingAddrs);
                    setRpcMetadataIndex(prev => ({ ...prev, ...missingMetas }));
                }

                await batchFetchTokenMetadata(addresses); // Это обновит глобальный store
            }
        } finally {
            setRpcLoading(false);
        }
    }, [account?.address]);

    useEffect(() => { fetchTokens(); }, [fetchTokens]);

    const bumpTokenActivity = (addr: string) => {
        setLiveActivity(prev => ({ ...prev, [addr.toLowerCase()]: Date.now() }));
    };

    const processedData = useMemo(() => {
        const index: Record<string, CachedGemTokenMeta> = {};
        
        // Наполняем индекс из Goldsky данных
        tokens.forEach(t => {
            const addr = t.id.toLowerCase();
            const [logo, desc, web, tw, tg, guild] = normalizeMetadata(
                t.logoHash || "", 
                t.description || "", 
                { website: t.website, twitter: t.twitter, telegram: t.telegram, guild: t.guild }
            );
            index[addr] = {
                name: t.name,
                symbol: t.symbol,
                logo,
                desc,
                links: { website: web, twitter: tw, telegram: tg, guild: guild },
                stats: [t.isMigrated ? "1" : "0", (t.isCurveCompleted || t.isMigrated) ? "1" : "0", t.sold, t.raised, t.miningReserve],
                creator: t.creator,
                fromGoldsky: true
            };
        });

        // Добавляем отсутствующие метаданные из RPC (или перезаписываем из store)
        Object.assign(index, rpcMetadataIndex);
        
        // Синхронизируем индекс с глобальным стором (там самые свежие данные)
        Object.keys(store.meta).forEach(addr => {
            index[addr.toLowerCase()] = store.meta[addr];
        });

        const activeIds = new Set<string>();
        const globalOrder: string[] = [];

        // 1. Живая активность
        const liveAddrs = Object.keys(liveActivity).sort((a, b) => liveActivity[b] - liveActivity[a]);
        liveAddrs.forEach(addr => {
            if (!activeIds.has(addr) && index[addr]) {
                activeIds.add(addr);
                globalOrder.push(addr);
            }
        });

        // 2. История блокчейна
        blockchainHistory.forEach(addr => {
            if (!activeIds.has(addr) && index[addr]) {
                activeIds.add(addr);
                globalOrder.push(addr);
            }
        });

        // 3. Goldsky Trades
        lastTrades.forEach(tr => {
            const addr = tr.token.id.toLowerCase();
            if (!activeIds.has(addr) && index[addr]) {
                activeIds.add(addr);
                globalOrder.push(addr);
            }
        });

        // 4. Остальные (сортировка по Mcap + Создание)
        const remaining = tokens
            .filter(t => !t.isMigrated)
            .sort((a, b) => {
                const rA = BigInt(a.raised || 0);
                const rB = BigInt(b.raised || 0);
                if (rB !== rA) return rB > rA ? 1 : -1;
                return Number(b.createdAt || 0) - Number(a.createdAt || 0);
            });

        remaining.forEach(t => {
            const addr = t.id.toLowerCase();
            if (!activeIds.has(addr)) {
                activeIds.add(addr);
                globalOrder.push(addr);
            }
        });

        const sortedActive = globalOrder;
        const sortedMigrated = tokens.filter(t => t.isMigrated).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).map(t => t.id.toLowerCase());
        const topMcapTokens = tokens.filter(t => !t.isMigrated).sort((a, b) => {
            const rA = BigInt(a.raised || 0);
            const rB = BigInt(b.raised || 0);
            return rB > rA ? 1 : -1;
        }).slice(0, 3).map(t => t.id.toLowerCase());

        const hold = Object.keys(userBalances).filter(addr => userBalances[addr] > 0n);
        const mining = Object.keys(userHashrates).filter(addr => userHashrates[addr] > 0n);

        return { 
            tokenIndex: index, 
            lists: { active: sortedActive, migrated: sortedMigrated, hold, mining },
            topMcapTokens 
        };
    }, [tokens, lastTrades, liveActivity, userBalances, userHashrates, rpcMetadataIndex, blockchainHistory]);

    return {
        ...processedData,
        tokens,
        userBalances,
        userHashrates,
        liveActivity,
        bumpTokenActivity,
        isLoading: rpcLoading,
        refresh: fetchTokens,
        refreshAll: fetchTokens
    };
}
