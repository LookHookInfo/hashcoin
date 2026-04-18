import { useActiveAccount } from "thirdweb/react";
import { contractGemFun } from "@/utils/contracts";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { fetchFromGoldsky, batchFetchBalances, type CachedGemTokenMeta } from "@/services/tokenService";
import { useTokenLogic, normalizeMetadata, calculateCurveProgress } from "@/hooks/useTokenLogic";
import { watchContractEvents, prepareEvent } from "thirdweb";

export type { CachedGemTokenMeta } from "@/services/tokenService";

const GOLDSKY_REFRESH_INTERVAL = 30_000; 

const tradeEvent = prepareEvent({
  signature: "event Trade(address indexed token, address indexed user, bool isBuy, uint256 hashAmt, uint256 memeAmt)"
});

export function useGemFun() {
  const account = useActiveAccount();
  
  const [rawTokens, setRawTokens] = useState<any[]>([]);
  const [lastTrades, setLastTrades] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, bigint>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Живая активность из RPC (самый высокий приоритет для мгновенной реакции)
  const [liveActivity, setLiveActivity] = useState<Record<string, number>>({});

  // Слушаем блокчейн для мгновенной реакции
  useEffect(() => {
      console.log("[LiveFeed] Monitoring RPC for Trade events...");
      const unwatch = watchContractEvents({
          contract: contractGemFun,
          events: [tradeEvent],
          onEvents: (events) => {
              events.forEach(event => {
                  const addr = (event.args.token as string).toLowerCase();
                  const now = Date.now();
                  console.log(`[LiveFeed] 🔥 RPC TRADE DETECTED! Token ${addr} jumping to top!`);
                  setLiveActivity(prev => ({ ...prev, [addr]: now }));
              });
          }
      });
      return () => unwatch();
  }, []);

  const fetchTokens = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
        console.log("[LiveFeed] Requesting Goldsky...");
        const query = `{
          tokens(first: 1000, orderBy: updatedAt, orderDirection: desc) {
            id, name, symbol, logoHash, description, website, twitter, telegram, guild,
            sold, raised, miningReserve, isMigrated, isCurveCompleted, creator, createdAt, updatedAt, lastTradeAt
          }
          trades(first: 50, orderBy: timestamp, orderDirection: desc) {
            token { id }
            timestamp
          }
        }`;
        
        const data = await fetchFromGoldsky(query);
        if (data) {
          console.log(`[LiveFeed] Received ${data.tokens?.length || 0} tokens and ${data.trades?.length || 0} trades`);
          setRawTokens(data.tokens || []);
          setLastTrades(data.trades || []);
          
          if (account?.address && data.tokens) {
              const addrs = data.tokens.map((t: any) => t.id.toLowerCase());
              const bals = await batchFetchBalances(account.address, addrs);
              setBalances(bals);
          }
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
      
      // 1. Индексация и подготовка данных
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

      // 2. ГЛОБАЛЬНАЯ СОРТИРОВКА (Pump Fun Style: Action over Existence)
      const getActiveScore = (t: any) => {
          const addr = t.id.toLowerCase();
          const raised = BigInt(t.raised || 0);
          const live = BigInt(liveActivity[addr] || 0);
          const updatedAt = BigInt(t.updatedAt || 0) * 1000n;
          const createdAt = BigInt(t.createdAt || 0) * 1000n;

          // ОПРЕДЕЛЯЕМ ЛИГУ
          // Лига 2: Живой трейд прямо сейчас (Highest)
          if (live > 0n) return 200_000_000_000_000_000n + live;

          // Лига 1: Есть объем или активность в базе (Traded)
          // Мы считаем активным, если raised > 0 ИЛИ updatedAt заметно больше createdAt
          if (raised > 0n || (updatedAt > createdAt + 1000n)) {
              return 100_000_000_000_000_000n + updatedAt;
          }

          // Лига 0: Просто созданный токен без торгов
          return createdAt;
      };

      const sortedActive = [...rawTokens]
          .filter(t => !t.isMigrated)
          .sort((a, b) => {
              const scoreA = getActiveScore(a);
              const scoreB = getActiveScore(b);
              if (scoreB > scoreA) return 1;
              if (scoreB < scoreA) return -1;
              return 0;
          })
          .map(t => t.id.toLowerCase());

      const sortedMigrated = [...rawTokens]
          .filter(t => t.isMigrated)
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
          .map(t => t.id.toLowerCase());

      // ТОП по капе (Market Cap)
      const topMcapTokens = [...rawTokens]
        .filter(t => !t.isMigrated)
        .sort((a, b) => Number(BigInt(b.raised || 0) - BigInt(a.raised || 0)))
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
        console.log(`[LiveFeed] 🚀 MANUAL BUMP for ${addrL}`);
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
