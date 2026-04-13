import {
    TransactionButton as ThirdwebTransactionButton,
    type TransactionButtonProps,
  } from "thirdweb/react";
  import type { TransactionReceipt } from "viem";
  import { ReactNode } from "react";
  import { Group } from "@mantine/core";
  
  interface AppTransactionButtonProps extends TransactionButtonProps {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
    leftSection?: ReactNode;
    rightSection?: ReactNode;
  }
  
  export function AppTransactionButton({ size = "md", className, leftSection, rightSection, children, ...props }: AppTransactionButtonProps) {
    const ThirdwebTransactionButtonAny = ThirdwebTransactionButton as any;
  
    const handleTransactionConfirmed = (receipt: TransactionReceipt) => {
      if (props.onTransactionConfirmed) {
        props.onTransactionConfirmed(receipt);
      }
    };
  
    return (
      <ThirdwebTransactionButtonAny
        size={size}
        className={className}
        {...props}
        onTransactionConfirmed={handleTransactionConfirmed}
      >
        <Group gap={8} wrap="nowrap" justify="center" style={{ pointerEvents: 'none' }}>
            {leftSection}
            {children}
            {rightSection}
        </Group>
      </ThirdwebTransactionButtonAny>
    );
  }
  
