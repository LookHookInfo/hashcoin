import { useActiveAccount, useReadContract } from "thirdweb/react";
import { contractGemFun } from "@/utils/contracts";
import { useCallback, useEffect, useState, useRef } from "react";
import { fetchFromGoldsky, batchFetchBalances, type CachedGemTokenMeta } from "@/services/tokenService";
import { useTokenLogic, normalizeMetadata, calculateCurveProgress } from "@/hooks/useTokenLogic";
import { readContract } from "thirdweb";

export type { CachedGemTokenMeta } from "@/services/tokenService";

const GOLDSKY_REFRESH_INTERVAL = 30_000; 

export function useGemFun() {
  const account = useActiveAccount();
  const [tokenActivity, setTokenActivity] = useState<Record<string, number>>({});
  const [tokenAddresses, setTokenAddresses] = useState<string[]>([]);
  const [tokenIndex, setTokenIndex] = useState<Record<string, CachedGemTokenMeta>>({});
  const [topMcapTokens, setTopMcapTokens] = useState<string[]>([]);
  const [lists, setLists] = useState<{ hold: string[], mining: string[], migrated: string[], active: string[] }>({
    hold: [], mining: [], migrated: [], active: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const isFirstLoad = useRef(true);

  const { data: tokensCount } = useReadContract({ 
    contract: contractGemFun, 
    method: "function userTokensCount(address) view returns (uint256)", 
    params: [account?.address || "0x0000000000000000000000000000000000000000"], 
    queryOptions: { enabled: !!account?.address } 
  });
  const { data: migratedCount } = useReadContract({ 
    contract: contractGemFun, 
    method: "function userMigratedCount(address) view returns (uint256)", 
    params: [account?.address || "0x0000000000000000000000000000000000000000"], 
    queryOptions: { enabled: !!account?.address } 
  });

  const fetchTokens = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
        const query = `{
          tokens(orderBy: updatedAt, orderDirection: desc, first: 1000) {
            id
            name
            symbol
            logoHash
            description
            website
            twitter
            telegram
            guild
            sold
            raised
            miningReserve
            isMigrated
            isCurveCompleted
            creator
            updatedAt
          }
        }`;
        const data = await fetchFromGoldsky(query);
        if (data && data.tokens && Array.isArray(data.tokens)) {
          const addresses = data.tokens.map((t: any) => t.id.toLowerCase());
          
          const index: Record<string, CachedGemTokenMeta> = {};
          const active: string[] = [];
          const migrated: string[] = [];
          
          data.tokens.forEach((t: any) => {
            if (!t || !t.id) return;
            const addr = t.id.toLowerCase();
            const isMigrated = t.isMigrated === true || t.isMigrated === "true";
            
            index[addr] = {
              name: t.name || "Unknown",
              symbol: t.symbol || "GEM",
              logo: t.logoHash || "",
              desc: t.description || "",
              links: { website: t.website || "", twitter: t.twitter || "", telegram: t.telegram || "", guild: t.guild || "" },
              stats: [isMigrated ? "1" : "0", (t.isCurveCompleted || isMigrated) ? "1" : "0", t.sold || "0", t.raised || "0", t.miningReserve || "0"],
              creator: t.creator || "0x0000000000000000000000000000000000000000",
              fromGoldsky: true,
            };
            
            if (isMigrated) migrated.push(addr); else active.push(addr);
          });
          
          setTokenIndex(index);
          setTokenAddresses(addresses);
          
          // ЗАПОЛНЯЕМ СПИСКИ ПОЛЬЗОВАТЕЛЯ (SAFE SYNC)
          let holdList: string[] = [];
          let miningList: string[] = [];

          if (account?.address) {
              // 1. Пакетно получаем балансы всех токенов за 1 RPC запрос
              const balances = await batchFetchBalances(account.address, addresses);
              holdList = addresses.filter((addr: string) => (balances[addr] || 0n) > 0n);

              // 2. Для майнинга проверяем только мигрировавшие токены (их обычно мало)
              // Используем последовательный опрос с паузой, если их много, или просто Promise.all если мало
              if (migrated.length > 0) {
                  const miningChecks = await Promise.all(migrated.map(async (addr: string) => {
                      try {
                          const accData = await readContract({
                              contract: contractGemFun,
                              method: "function getAccountData(address tokenAddr, address user) view returns (uint256 walletBalance, uint256 totalHashrate, uint256 pendingRewards, uint256[6] stakedItems)",
                              params: [addr, account.address]
                          }) as any;
                          return { addr, hashrate: accData[1] || 0n };
                      } catch { return { addr, hashrate: 0n }; }
                  }));
                  miningList = miningChecks.filter(c => c.hashrate > 0n).map(c => c.addr);
              }
          }

          setLists({ 
              hold: holdList, 
              mining: miningList, 
              migrated, 
              active 
          });
          
          const leaders = [...data.tokens]
            .filter((t: any) => !t.isMigrated)
            .sort((a: any, b: any) => {
                const valA = BigInt(a.raised || 0);
                const valB = BigInt(b.raised || 0);
                return valB > valA ? 1 : valB < valA ? -1 : 0;
            })
            .slice(0, 3)
            .map((t: any) => t.id.toLowerCase());
            
          setTopMcapTokens(leaders);
        }
    } catch (err) {
        console.error("Goldsky fetch error:", err);
    } finally {
        setIsLoading(false);
    }
  }, [account?.address]);

  useEffect(() => {
    fetchTokens();
    const timer = setInterval(() => fetchTokens(true), GOLDSKY_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchTokens]);

  return {
    isLoading,
    tokenAddresses,
    tokenIndex,
    topMcapTokens,
    lists,
    tokenActivity,
    bumpTokenActivity: (addr: string) => fetchTokens(true),
    userStats: { tokensCount: tokensCount || 0n, migratedCount: migratedCount || 0n },
    refreshAll: () => fetchTokens(false)
  };
}

export function useTokenData(address: string, options?: { includeUserStats?: boolean, initialMeta?: CachedGemTokenMeta | null }) {
    // Включаем RPC только если адрес валидный И мы не получили статы из общего списка
    const shouldFetchRPC = !!options?.includeUserStats && !!address;
    const { userStake, info: rpcInfo, name: rpcName, metadata: rpcMetadata, isLoading: rpcLoading, refetchPending } = useTokenLogic(shouldFetchRPC ? address : "");

    const meta = options?.initialMeta;
    const name = rpcName !== "Loading..." ? rpcName : (meta?.name || "Loading...");
    
    const info = rpcInfo || (meta?.stats ? [
        meta.stats[0] === "1", 
        meta.stats[1] === "1", 
        BigInt(meta.stats[2]), 
        BigInt(meta.stats[3]), 
        BigInt(meta.stats[4])
    ] : null);

    const curveProgress = info ? calculateCurveProgress(info[2]) : 0;

    const metadata = (rpcMetadata[0] !== "" || rpcMetadata[1] !== "") ? rpcMetadata : normalizeMetadata(
        meta?.logo || "",
        meta?.desc || "",
        meta?.links
    );

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
