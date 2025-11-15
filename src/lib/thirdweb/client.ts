import { createThirdwebClient } from "thirdweb";

const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID as string;

export const client = createThirdwebClient({
  clientId: clientId,
});