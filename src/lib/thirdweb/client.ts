import { createThirdwebClient } from "thirdweb";

const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

if (!clientId) {
  console.warn("VITE_THIRDWEB_CLIENT_ID is not defined in .env file. IPFS uploads and other thirdweb services may fail.");
}

export const client = createThirdwebClient({
  clientId: clientId || "",
});