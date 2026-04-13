import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

export const alchemyBaseRpcUrl = import.meta.env.VITE_ALCHEMY_BASE_RPC_URL as
  | string
  | undefined;

if (!alchemyBaseRpcUrl) {
  throw new Error("Missing VITE_ALCHEMY_BASE_RPC_URL");
}

export const alchemyPublicClient = createPublicClient({
  chain: base,
  transport: http(alchemyBaseRpcUrl),
});

export async function alchemyRpcRequest<T>(
  method: string,
  params: unknown[] = [],
): Promise<T> {
  if (!alchemyBaseRpcUrl) {
    throw new Error("ALCHEMY_RPC_URL is not defined");
  }
  const response = await fetch(alchemyBaseRpcUrl, {
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
