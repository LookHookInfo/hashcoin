import { defineChain } from "thirdweb/chains";

// Мощная очистка URL от любого мусора
const cleanUrl = (url?: string) => {
    if (!url) return undefined;
    const match = url.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : undefined;
};

const rpcUrl = cleanUrl(import.meta.env.VITE_ALCHEMY_BASE_RPC_URL) as string;
const rpcUrl2 = cleanUrl(import.meta.env.VITE_ALCHEMY2_BASE_RPC_URL) as string;
const rpcUrl3 = cleanUrl(import.meta.env.VITE_ALCHEMY3_BASE_RPC_URL) as string;

export const chain = defineChain({
    id: 8453,
    rpc: rpcUrl || "https://mainnet.base.org"
});

export const chainAlchemy2 = defineChain({
    id: 8453,
    rpc: rpcUrl2 || rpcUrl || "https://mainnet.base.org"
});

export const chainAlchemy3 = defineChain({
    id: 8453,
    rpc: rpcUrl3 || rpcUrl || "https://mainnet.base.org"
});
