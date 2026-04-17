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
            sold, raised, miningReserve, isMigrated, isCurveCompleted, creator, createdAt, updatedAt
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
      
      // 1. Карта глобальной активности из Goldsky Trades
      const globalTradeMap: Record<string, number> = {};
      lastTrades.forEach(tr => {
          const addr = tr.token.id.toLowerCase();
          const ts = Number(tr.timestamp) * 1000;
          if (!globalTradeMap[addr] || ts > globalTradeMap[addr]) {
              globalTradeMap[addr] = ts;
          }
      });

      // 2. СОРТИРОВКА: Ищем максимальную метку времени из всех источников
      // Источники: RPC (liveActivity), Goldsky Trades, Goldsky updatedAt
      const sortedActive = [...rawTokens]
          .filter(t => !t.isMigrated)
          .sort((a, b) => {
              const idA = a.id.toLowerCase();
              const idB = b.id.toLowerCase();
              
              const liveA = liveActivity[idA] || 0;
              const tradeA = globalTradeMap[idA] || 0;
              const updateA = Number(a.updatedAt || 0) * 1000;
              const finalA = Math.max(liveA, tradeA, updateA);

              const liveB = liveActivity[idB] || 0;
              const tradeB = globalTradeMap[idB] || 0;
              const updateB = Number(b.updatedAt || 0) * 1000;
              const finalB = Math.max(liveB, tradeB, updateB);

              if (finalA !== finalB) return finalB - finalA;

              const createA = Number(a.createdAt || 0) * 1000;
              const createB = Number(b.createdAt || 0) * 1000;
              return createB - createA;
          })
          .map(t => t.id.toLowerCase());

      const sortedMigrated = [...rawTokens]
          .filter(t => t.isMigrated)
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
          .map(t => t.id.toLowerCase());

      // 3. Индекс
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

      const hold = Object.keys(balances).filter(addr => balances[addr] > 0n);
      const mining = hold.filter(addr => index[addr]?.stats[0] === "1");

      const topMcap = [...rawTokens]
        .filter(t => !t.isMigrated)
        .sort((a, b) => Number(BigInt(b.raised || 0) - BigInt(a.raised || 0)))
        .slice(0, 3)
        .map(t => t.id.toLowerCase());

      return { 
          tokenIndex: index, 
          lists: { active: sortedActive, migrated: sortedMigrated, hold, mining },
          topMcapTokens: topMcap,
          liveActivity // Прокидываем время последней активности для анимаций
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
