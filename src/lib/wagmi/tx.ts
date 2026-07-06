import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import type { Abi, TransactionReceipt } from "viem";
import { wagmiConfig } from "./config";

export type WriteCall = {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
};

export async function writeAndWait(call: WriteCall): Promise<TransactionReceipt> {
  const hash = await writeContract(wagmiConfig, call as any);
  return await waitForTransactionReceipt(wagmiConfig, { hash });
}
