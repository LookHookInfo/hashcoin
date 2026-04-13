import { upload as thirdwebUpload } from "thirdweb/storage";
import { client } from "@/lib/thirdweb/client";
import { keccak256, stringToBytes } from "viem";

/**
 * Uploads a file to IPFS using thirdweb storage
 * Returns the full URI, the CID, and a bytes32 keccak256 hash of the URI
 */
export const upload = async (file: File) => {
  if (!file) throw new Error("No file provided for upload");

  try {
    // 1. Upload using thirdweb (handles multi-part, retries, etc.)
    // In thirdweb v5, upload returns a string (the directory URI)
    const uri = await thirdwebUpload({
      client,
      files: [file],
    });
    
    if (!uri) throw new Error("Upload failed: No URI returned from thirdweb");

    // Ensure we have a string (it should be, but just in case)
    const finalUri = Array.isArray(uri) ? uri[0] : uri;

    // 2. Extract CID (handling different possible URI formats)
    // ipfs://Qm... or ipfs://CID/filename.ext
    const cid = finalUri.replace("ipfs://", "").split("/")[0];
    
    // 3. Generate a stable bytes32 hash of the URI for the contract's logoHash field
    // Since CID v0 is 46 chars and CID v1 is even longer, they don't fit in bytes32 as strings.
    // We use keccak256(uri) as a unique identifier.
    const bytes32 = keccak256(stringToBytes(finalUri));
    
    return {
        uri: finalUri,
        cid,
        bytes32
    };
  } catch (err: any) {
    console.error("Detailed IPFS Upload error:", err);
    throw new Error(`IPFS Upload failed: ${err.message || 'Unknown error'}`);
  }
};
