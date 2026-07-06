import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const cleanUrl = (url?: string) => {
    if (!url) return undefined;
    const match = url.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : undefined;
};

const rpc1 = cleanUrl(import.meta.env.VITE_ALCHEMY_BASE_RPC_URL);
const rpc2 = cleanUrl(import.meta.env.VITE_ALCHEMY2_BASE_RPC_URL);
const rpc3 = cleanUrl(import.meta.env.VITE_ALCHEMY3_BASE_RPC_URL);

function makeClient(url?: string) {
    return createPublicClient({
        chain: base,
        transport: url ? http(url) : http("https://mainnet.base.org"),
    });
}

export const coreClient = makeClient(rpc1);
export const gemClient = makeClient(rpc2);
export const memeClient = makeClient(rpc3);
