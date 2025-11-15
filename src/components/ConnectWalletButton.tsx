import { ConnectButton } from "thirdweb/react";
import { FC } from "react";
import { Box } from "@mantine/core";
import { client } from "@/lib/thirdweb/client";

export const ConnectWalletButton: FC = () => {
  return (
    <Box>
      <ConnectButton
        client={client}
        theme="dark"
        appMetadata={{
          name: "Mining Hash",
          url: "https://mininghash.com",
        }}
      />
    </Box>
  );
};