import { http, fallback } from "viem";
import { base } from "viem/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const cleanUrl = (url?: string) => {
  if (!url) return undefined;
  const match = url.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : undefined;
};

const rpc1 = cleanUrl(import.meta.env.VITE_ALCHEMY_BASE_RPC_URL);
const rpc2 = cleanUrl(import.meta.env.VITE_ALCHEMY2_BASE_RPC_URL);
const rpc3 = cleanUrl(import.meta.env.VITE_ALCHEMY3_BASE_RPC_URL);

const rpcs = [rpc1, rpc2, rpc3].filter(Boolean) as string[];
const transports = rpcs.length > 0
  ? rpcs.map((u) => http(u))
  : [http("https://mainnet.base.org")];

// WalletConnect Cloud project id — required by RainbowKit's WalletConnect connector.
// Place your own id into VITE_WALLETCONNECT_PROJECT_ID. The fallback below is a
// RainbowKit demo id and works in development but will be rate-limited in production.
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "21fef48091f12692cad574a6f7753643";

export const wagmiConfig = getDefaultConfig({
  appName: "Mining Hash",
  projectId,
  chains: [base],
  transports: {
    [base.id]: fallback(transports),
  },
  ssr: false,
});
