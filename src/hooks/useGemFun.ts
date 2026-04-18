import { useActiveAccount } from "thirdweb/react";
import { contractGemFun } from "@/utils/contracts";
import { useCallback, useEffect, useState, useMemo } from "react";
import { fetchFromGoldsky, batchFetchBalances, type CachedGemTokenMeta } from "@/services/tokenService";
import { useTokenLogic, normalizeMetadata, calculateCurveProgress } from "@/hooks/useTokenLogic";
import { watchContractEvents, prepareEvent, getContractEvents } from "thirdweb";

export type { CachedGemTokenMeta } from "@/services/tokenService";

const GOLDSKY_REFRESH_INTERVAL = 30_000; 

const tradeEvent = prepareEvent({
  signature: "event Trade(address indexed token, address indexed user, bool isBuy, uint256 hashAmt, uint256 memeAmt)"
});

const tokenCreatedEvent = prepareEvent({
    signature: "event TokenCreated(address indexed token, address indexed creator)"
});

export function useGemFun() {
  const account = useActiveAccount();
  
  const [rawTokens, setRawTokens] = useState<any[]>([]);
  const [lastTrades, setLastTrades] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, bigint>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Живая активность
  const [liveActivity, setLiveActivity] = useState<Record<string, number>>({});
  // Новые токены, пойманные "на лету" до индексации
  const [injectedTokens, setInjectedTokens] = useState<Set<string>>(new Set());
  // История активности напрямую из блокчейна (для глобальной синхронизации)
  const [blockchainHistory, setBlockchainHistory] = useState<string[]>([]);

  // 1. Слушаем живые события (Trade + TokenCreated)
  useEffect(() => {
      const unwatch = watchContractEvents({
          contract: contractGemFun,
          events: [tradeEvent, tokenCreatedEvent],
          onEvents: (events) => {
              events.forEach(event => {
                  const addr = (event.args.token as string).toLowerCase();
                  const now = Date.now();
                  
                  setLiveActivity(prev => ({ ...prev, [addr]: now }));
                  
                  // Если это создание токена, помечаем его для инъекции в список
                  if (event.eventName === "TokenCreated") {
                      setInjectedTokens(prev => new Set(prev).add(addr));
                  }
              });
          }
      });
      return () => unwatch();
  }, []);

  const fetchTokens = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
        const query = `{
          tokens(first: 1000, orderBy: updatedAt, orderDirection: desc) {
            id, name, symbol, logoHash, description, website, twitter, telegram, guild,
            sold, raised, miningReserve, isMigrated, isCurveCompleted, creator, createdAt, updatedAt
          }
          trades(first: 50, orderBy: timestamp, orderDirection: desc) {
            token { id }
            timestamp
          }
        }`;
        
        // Запускаем Goldsky и прямые запросы к блокчейну параллельно
        const [data, events] = await Promise.all([
            fetchFromGoldsky(query),
            getContractEvents({
                contract: contractGemFun,
                events: [tradeEvent, tokenCreatedEvent]
            }).catch(err => {
                console.error("[LiveFeed] Blockchain events fetch error:", err);
                return [];
            })
        ]);

        const tokensFromData = data?.tokens || [];
        
        // 1. Обработка Goldsky
        if (tokensFromData.length > 0) {
            const goldskyIds = new Set(tokensFromData.map((t: any) => t.id.toLowerCase()));
            setInjectedTokens(prev => {
                const next = new Set(prev);
                goldskyIds.forEach(id => next.delete(id as string));
                return next;
            });
        }
        setRawTokens(tokensFromData);
        if (data?.trades) setLastTrades(data.trades);

        // 2. Обработка прямых логов блокчейна (ВСЕГДА ПРИОРИТЕТ)
        if (events && events.length > 0) {
            const uniqueAddrs: string[] = [];
            const seen = new Set<string>();
            
            // Реверсируем, чтобы самые новые события были первыми
            const latestEvents = [...events].reverse();
            
            latestEvents.forEach(ev => {
                const addr = (ev.args.token as string).toLowerCase();
                if (!seen.has(addr)) {
                    seen.add(addr);
                    uniqueAddrs.push(addr);
                }
            });
            
            console.log(`[LiveFeed] Synced ${uniqueAddrs.length} recent tokens from blockchain logs`);
            setBlockchainHistory(uniqueAddrs);
        }

        // Синхронизация балансов
        if (account?.address && tokensFromData.length > 0) {
            const addrs = tokensFromData.map((t: any) => t.id.toLowerCase());
            const bals = await batchFetchBalances(account.address, addrs);
            setBalances(bals);
        }
    } catch (err) {
        console.error("[LiveFeed] Fetch error:", err);
    } finally {
        setIsLoading(false);
    }
  }, [account?.address]);

  useEffect(() => {
    fetchTokens();
    const timer = setInterval(() => fetchTokens(true), GOLDSKY_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchTokens]);

  const processedData = useMemo(() => {
      const index: Record<string, CachedGemTokenMeta> = {};
      
      // 1. Индексация
      rawTokens.forEach(t => {
          const addr = t.id.toLowerCase();
          const isMig = t.isMigrated === true || t.isMigrated === "true";
          index[addr] = {
              name: t.name, symbol: t.symbol, logo: t.logoHash, desc: t.description,
              links: { website: t.website || "", twitter: t.twitter || "", telegram: t.telegram || "", guild: t.guild || "" },
              stats: [isMig ? "1" : "0", (t.isCurveCompleted || isMig) ? "1" : "0", t.sold, t.raised, t.miningReserve],
              creator: t.creator, fromGoldsky: true
          };
      });

      // 2. ГЛОБАЛЬНЫЙ ПОРЯДОК (Blockchain Driven)
      const activeIds = new Set<string>();
      const globalOrder: string[] = [];

      // Шаг 1: Живая активность (сессионная) - САМЫЙ ВЫСОКИЙ ПРИОРИТЕТ
      const liveAddrs = Object.keys(liveActivity).sort((a, b) => liveActivity[b] - liveActivity[a]);
      liveAddrs.forEach(addr => {
          if (!activeIds.has(addr)) {
              activeIds.add(addr);
              globalOrder.push(addr);
          }
      });

      // Шаг 2: Инжектированные токены (новые, еще не в сабграфе)
      injectedTokens.forEach(addr => {
          if (!activeIds.has(addr)) {
              activeIds.add(addr);
              globalOrder.push(addr);
          }
      });

      // Шаг 3: История торгов из блокчейна (наш радикальный фундамент)
      blockchainHistory.forEach(addr => {
          if (!activeIds.has(addr) && (index[addr] || injectedTokens.has(addr))) {
              activeIds.add(addr);
              globalOrder.push(addr);
          }
      });

      // Шаг 4: История из Goldsky Trades (если они есть)
      lastTrades.forEach(tr => {
          const addr = tr.token.id.toLowerCase();
          if (!activeIds.has(addr) && index[addr]) {
              activeIds.add(addr);
              globalOrder.push(addr);
          }
      });

      // Шаг 5: Все остальные токены (по объему Mcap для солидности)
      const remaining = [...rawTokens]
          .filter(t => !t.isMigrated)
          .sort((a, b) => {
              // Сортировка: Сначала новые по createdAt, потом по raised
              const timeA = Number(a.createdAt || 0);
              const timeB = Number(b.createdAt || 0);
              if (timeB !== timeA) return timeB - timeA;

              const rA = BigInt(a.raised || 0);
              const rB = BigInt(b.raised || 0);
              if (rB > rA) return 1;
              if (rA > rB) return -1;
              return 0;
          });

      remaining.forEach(t => {
          const addr = t.id.toLowerCase();
          if (!activeIds.has(addr)) {
              activeIds.add(addr);
              globalOrder.push(addr);
          }
      });

      const sortedActive = globalOrder;

      const sortedMigrated = [...rawTokens]
          .filter(t => t.isMigrated)
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
          .map(t => t.id.toLowerCase());

      // ТОП по капе (Market Cap) - только для виджета "Топ 3"
      const topMcapTokens = [...rawTokens]
        .filter(t => !t.isMigrated)
        .sort((a, b) => {
            const rA = BigInt(a.raised || 0);
            const rB = BigInt(b.raised || 0);
            if (rB > rA) return 1;
            if (rA > rB) return -1;
            return 0;
        })
        .slice(0, 3)
        .map(t => t.id.toLowerCase());

      const hold = Object.keys(balances).filter(addr => balances[addr] > 0n);
      const mining = hold.filter(addr => index[addr]?.stats[0] === "1");

      return { 
          tokenIndex: index, 
          lists: { active: sortedActive, migrated: sortedMigrated, hold, mining },
          topMcapTokens,
          liveActivity 
      };
  }, [rawTokens, lastTrades, liveActivity, balances]);

  return {
    isLoading,
    ...processedData,
    bumpTokenActivity: (addr: string) => {
        const addrL = addr.toLowerCase();
        const now = Date.now();
        setLiveActivity(prev => ({ ...prev, [addrL]: now }));
    },
    refreshAll: () => fetchTokens(false)
  };
}

export function useTokenData(address: string, options?: { includeUserStats?: boolean, initialMeta?: CachedGemTokenMeta | null }) {
    const shouldFetchRPC = !!options?.includeUserStats && !!address;
    const { userStake, info: rpcInfo, name: rpcName, metadata: rpcMetadata, isLoading: rpcLoading, refetchPending } = useTokenLogic(shouldFetchRPC ? address : "");
    const meta = options?.initialMeta;
    const name = rpcName !== "Loading..." ? rpcName : (meta?.name || "Loading...");
    const info = rpcInfo || (meta?.stats ? [meta.stats[0] === "1", meta.stats[1] === "1", BigInt(meta.stats[2]), BigInt(meta.stats[3]), BigInt(meta.stats[4])] : null);
    const curveProgress = info ? calculateCurveProgress(info[2]) : 0;
    const metadata = (rpcMetadata[0] !== "" || rpcMetadata[1] !== "") ? rpcMetadata : normalizeMetadata(meta?.logo || "", meta?.desc || "", meta?.links);

    return {
        userStats: {
            hasBalance: (userStake?.walletBalance || 0n) > 0n,
            hasMining: (userStake?.totalHashrate || 0n) > 0n,
        },
        info: info as [boolean, boolean, bigint, bigint, bigint] | null,
        curveProgress,
        name,
        metadata,
        isLoading: shouldFetchRPC ? rpcLoading : false,
        triggerRefresh: refetchPending,
        lastSynced: Date.now(),
    };
}
