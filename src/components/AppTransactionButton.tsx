import {
    TransactionButton as ThirdwebTransactionButton,
    type TransactionButtonProps,
  } from "thirdweb/react";
  import { useQueryClient } from "@tanstack/react-query";
  import type { TransactionReceipt } from "viem"; // Corrected import
  
  interface AppTransactionButtonProps extends TransactionButtonProps {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
  }
  
  export function AppTransactionButton({ size = "md", className, ...props }: AppTransactionButtonProps) {
    const queryClient = useQueryClient();
  
    const handleTransactionConfirmed = (receipt: TransactionReceipt) => {
      // Invalidate all thirdweb queries to refetch blockchain data
      queryClient.invalidateQueries({ queryKey: ["thirdweb"] });
  
      // Also invalidate any custom queries that might be affected.
      // These keys are used in ToolCard.tsx.
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["isApproved"] });

      // This key is used in Shop.tsx for the list of tools
      queryClient.invalidateQueries({ queryKey: ["allTools"] });

      // These keys are for the role button in Shop.tsx
      queryClient.invalidateQueries({ queryKey: ["canMintRole"] });
      queryClient.invalidateQueries({ queryKey: ["roleBalance"] });
  
      // If the original component had its own onTransactionConfirmed, call it too.
      if (props.onTransactionConfirmed) {
        props.onTransactionConfirmed(receipt);
      }
    };
  
    return (
      <ThirdwebTransactionButton
        size={size}
        className={className}
        {...props}
        onTransactionConfirmed={handleTransactionConfirmed}
      />
    );
  }
  