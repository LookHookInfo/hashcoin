import { defineChain } from "thirdweb/chains";

const rpcUrl = import.meta.env.VITE_ALCHEMY_BASE_RPC_URL as string;

export const chain = defineChain({
    id: 8453,
    rpc: rpcUrl || "https://mainnet.base.org"
});
