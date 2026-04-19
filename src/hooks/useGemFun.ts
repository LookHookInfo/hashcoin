import { useActiveAccount } from "thirdweb/react";
import { contractGemFun } from "@/utils/contracts";
import { useCallback, useEffect, useState, useMemo } from "react";
import { fetchFromGoldsky, batchFetchBalances, batchFetchTokenMetadata, type CachedGemTokenMeta } from "@/services/tokenService";
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
  // Дополнительные метаданные из RPC (для тех, кого нет в сабграфе)
  const [rpcMetadataIndex, setRpcMetadataIndex] = useState<Record<string, CachedGemTokenMeta>>({});
  // История активности напрямую из блокчейна
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
        
        const [data, events] = await Promise.all([
            fetchFromGoldsky(query),
            getContractEvents({
                contract: contractGemFun,
                events: [tradeEvent, tokenCreatedEvent]
            }).catch(() => [])
        ]);

        const tokensFromData = data?.tokens || [];
        setRawTokens(tokensFromData);
        if (data?.trades) setLastTrades(data.trades);

        // 2. Обработка прямых логов блокчейна
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

        // 3. ДООБОГАЩЕНИЕ (Backfill): Если токен есть в логах, но нет в Goldsky — тянем RPC
        const goldskyIds = new Set(tokensFromData.map((t: any) => t.id.toLowerCase()));
        const missingAddrs = uniqueBlockchainAddrs.filter(addr => !goldskyIds.has(addr));
        
        if (missingAddrs.length > 0) {
            console.log(`[LiveFeed] Backfilling ${missingAddrs.length} tokens via RPC...`);
            const meta = await batchFetchTokenMetadata(missingAddrs);
            setRpcMetadataIndex(prev => ({ ...prev, ...meta }));
        }

        // Синхронизация балансов
        if (account?.address && (tokensFromData.length > 0 || uniqueBlockchainAddrs.length > 0)) {
            const allAddrs = Array.from(new Set([...tokensFromData.map((t: any) => t.id.toLowerCase()), ...uniqueBlockchainAddrs]));
            const bals = await batchFetchBalances(account.address, allAddrs);
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
      
      // Сначала наполняем из RPC (они могут быть свежее)
      Object.assign(index, rpcMetadataIndex);

      // Потом из Goldsky (основной массив)
      rawTokens.forEach(t => {
          const addr = t.id.toLowerCase();
          const isMig = t.isMigrated === true || t.isMigrated === "true";
          
          // Нормализуем метаданные (логотип может быть спрятан в описании)
          const [logo, desc, web, tw, tg, guild] = normalizeMetadata(
              t.logoHash || "", 
              t.description || "", 
              { website: t.website, twitter: t.twitter, telegram: t.telegram, guild: t.guild }
          );

          index[addr] = {
              name: t.name, 
              symbol: t.symbol, 
              logo: logo, 
              desc: desc,
              links: { website: web, twitter: tw, telegram: tg, guild: guild },
              stats: [isMig ? "1" : "0", (t.isCurveCompleted || isMig) ? "1" : "0", t.sold, t.raised, t.miningReserve],
              creator: t.creator, fromGoldsky: true
          };
      });

      const activeIds = new Set<string>();
      const globalOrder: string[] = [];

      // Приоритет 1: Живая активность (сессия)
      const liveAddrs = Object.keys(liveActivity).sort((a, b) => liveActivity[b] - liveActivity[a]);
      liveAddrs.forEach(addr => {
          if (!activeIds.has(addr) && index[addr]) {
              activeIds.add(addr);
              globalOrder.push(addr);
          }
      });

      // Приоритет 2: История блокчейна
      blockchainHistory.forEach(addr => {
          if (!activeIds.has(addr) && index[addr]) {
              activeIds.add(addr);
              globalOrder.push(addr);
          }
      });

      // Приоритет 3: Goldsky Trades
      lastTrades.forEach(tr => {
          const addr = tr.token.id.toLowerCase();
          if (!activeIds.has(addr) && index[addr]) {
              activeIds.add(addr);
              globalOrder.push(addr);
          }
      });

      // Приоритет 4: Все остальные (Mcap + Creation)
      const remaining = [...rawTokens]
          .filter(t => !t.isMigrated)
          .sort((a, b) => {
              const timeA = Number(a.createdAt || 0);
              const timeB = Number(b.createdAt || 0);
              if (Math.abs(timeB - timeA) > 60) return timeB - timeA;
              const rA = BigInt(a.raised || 0);
              const rB = BigInt(b.raised || 0);
              return rB > rA ? 1 : -1;
          });

      remaining.forEach(t => {
          const addr = t.id.toLowerCase();
          if (!activeIds.has(addr)) {
              activeIds.add(addr);
              globalOrder.push(addr);
          }
      });

      const sortedActive = globalOrder;
      const sortedMigrated = [...rawTokens].filter(t => t.isMigrated).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).map(t => t.id.toLowerCase());
      const topMcapTokens = [...rawTokens].filter(t => !t.isMigrated).sort((a, b) => {
            const rA = BigInt(a.raised || 0);
            const rB = BigInt(b.raised || 0);
            return rB > rA ? 1 : -1;
      }).slice(0, 3).map(t => t.id.toLowerCase());

      const hold = Object.keys(balances).filter(addr => balances[addr] > 0n);
      const mining = hold.filter(addr => index[addr]?.stats[0] === "1");

      return { 
          tokenIndex: index, 
          lists: { active: sortedActive, migrated: sortedMigrated, hold, mining },
          topMcapTokens,
          liveActivity 
      };
  }, [rawTokens, lastTrades, liveActivity, balances, rpcMetadataIndex, blockchainHistory]);

  return {
    isLoading,
    ...processedData,
    bumpTokenActivity: (addr: string) => {
        const addrL = addr.toLowerCase();
        setLiveActivity(prev => ({ ...prev, [addrL]: Date.now() }));
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
