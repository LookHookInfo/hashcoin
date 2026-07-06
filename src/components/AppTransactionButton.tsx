import { useState, type ReactNode, type CSSProperties } from "react";
import { Button, Group } from "@mantine/core";
import type { TransactionReceipt } from "viem";
import { writeAndWait, type WriteCall } from "@/lib/wagmi/tx";

/**
 * Drop-in replacement for thirdweb's <TransactionButton>.
 *
 * `transaction`:
 *   - Returning a `WriteCall` -> button submits it and waits for the receipt.
 *   - Returning `null`/`undefined` -> caller already handled the entire flow
 *     (e.g. multi-step approve+write). `onTransactionConfirmed` still fires.
 *   - Returning a `TransactionReceipt` -> treated as already-confirmed.
 */
export type AppTxResult = WriteCall | TransactionReceipt | null | undefined | void;

export interface AppTransactionButtonProps {
  transaction: () => Promise<AppTxResult> | AppTxResult;
  onTransactionConfirmed?: (receipt?: TransactionReceipt) => void;
  onError?: (err: unknown) => void;
  children?: ReactNode;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

function isWriteCall(v: unknown): v is WriteCall {
  return !!v && typeof v === "object" && "address" in v && "abi" in v && "functionName" in v;
}

function isReceipt(v: unknown): v is TransactionReceipt {
  return !!v && typeof v === "object" && "transactionHash" in v && "status" in v;
}

export function AppTransactionButton({
  transaction,
  onTransactionConfirmed,
  onError,
  children,
  leftSection,
  rightSection,
  size = "md",
  disabled,
  className,
  style,
}: AppTransactionButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const result = await transaction();
      if (isWriteCall(result)) {
        const receipt = await writeAndWait(result);
        onTransactionConfirmed?.(receipt);
      } else if (isReceipt(result)) {
        onTransactionConfirmed?.(result);
      } else {
        onTransactionConfirmed?.();
      }
    } catch (err) {
      console.error("[AppTransactionButton]", err);
      onError?.(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      className={className}
      style={style}
      disabled={disabled || busy}
      loading={busy}
      onClick={handleClick}
    >
      <Group gap={8} wrap="nowrap" justify="center" style={{ pointerEvents: "none" }}>
        {leftSection}
        {children}
        {rightSection}
      </Group>
    </Button>
  );
}
