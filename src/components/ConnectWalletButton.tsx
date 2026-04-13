import { ConnectButton } from "thirdweb/react";
import { FC } from "react";
import { Box } from "@mantine/core";
import { client } from "@/lib/thirdweb/client";
import { chain } from "@/lib/thirdweb/chain";

export const ConnectWalletButton: FC = () => {
  return (
    <Box>
      <ConnectButton
        client={client}
        chain={chain}
        theme="dark"
        appMetadata={{
          name: "Mining Hash",
          url: "https://hashcoin.farm",
        }}
      />
    </Box>
  );
};