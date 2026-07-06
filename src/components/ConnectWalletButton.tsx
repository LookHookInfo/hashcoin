import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FC } from "react";
import { Box } from "@mantine/core";

export const ConnectWalletButton: FC = () => {
  return (
    <Box>
      <ConnectButton
        chainStatus="none"
        showBalance={false}
        accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
      />
    </Box>
  );
};
