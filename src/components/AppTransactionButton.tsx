import {
    TransactionButton as ThirdwebTransactionButton,
    type TransactionButtonProps,
  } from "thirdweb/react";
  import { useQueryClient } from "@tanstack/react-query";
  import type { TransactionReceipt } from "viem"; // Corrected import
  
  export function AppTransactionButton(props: TransactionButtonProps) {
    const queryClient = useQueryClient();
  
    const handleTransactionConfirmed = (receipt: TransactionReceipt) => {
      // Invalidate all thirdweb queries to refetch blockchain data
      queryClient.invalidateQueries({ queryKey: ["thirdweb"] });
  
      // Also invalidate any custom queries that might be affected.
      // These keys are used in ToolCard.tsx.
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["isApproved"] });

      // This key is used in Shop.tsx
      queryClient.invalidateQueries({ queryKey: ["allTools"] });
  
      // If the original component had its own onTransactionConfirmed, call it too.
      if (props.onTransactionConfirmed) {
        props.onTransactionConfirmed(receipt);
      }
    };
  
    return (
      <ThirdwebTransactionButton
        {...props}
        onTransactionConfirmed={handleTransactionConfirmed}
      />
    );
  }
  