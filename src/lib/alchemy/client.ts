import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// Функция очистки URL от любого мусора (пробелы, табы, лишние слова)
const cleanUrl = (url?: string) => {
    if (!url) return undefined;
    const match = url.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : undefined;
};

export const alchemyBaseRpcUrl = cleanUrl(import.meta.env.VITE_ALCHEMY_BASE_RPC_URL);
export const alchemyBaseRpcUrl2 = cleanUrl(import.meta.env.VITE_ALCHEMY2_BASE_RPC_URL);
export const alchemyBaseRpcUrl3 = cleanUrl(import.meta.env.VITE_ALCHEMY3_BASE_RPC_URL);

if (!alchemyBaseRpcUrl) {
  throw new Error("Missing VITE_ALCHEMY_BASE_RPC_URL");
}

export const alchemyPublicClient = createPublicClient({
  chain: base,
  transport: http(alchemyBaseRpcUrl),
});

export const alchemyPublicClient2 = createPublicClient({
  chain: base,
  transport: http(alchemyBaseRpcUrl2 || alchemyBaseRpcUrl),
});

export const alchemyPublicClient3 = createPublicClient({
  chain: base,
  transport: http(alchemyBaseRpcUrl3 || alchemyBaseRpcUrl),
});

// Возвращаем отсутствующую функцию alchemyRpcRequest
export async function alchemyRpcRequest<T>(
  method: string,
  params: unknown[] = [],
  rpcUrl?: string
): Promise<T> {
  const targetUrl = rpcUrl || alchemyBaseRpcUrl;
  if (!targetUrl) throw new Error("No RPC URL provided");

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Alchemy RPC request failed with status ${response.status}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(json.error.message || `Alchemy RPC method ${method} failed`);
  }

  return json.result as T;
}
