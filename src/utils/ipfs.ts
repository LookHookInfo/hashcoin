import { keccak256, stringToBytes } from "viem";

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";
const MAX_DIM = 512;
const JPEG_Q = 0.8;

export function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_Q
      );
    };
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = url;
  });
}

export const upload = async (file: File) => {
  if (!file) throw new Error("No file provided for upload");

  const compressed = file.type.startsWith("image/") ? await compressImage(file) : file;

  const form = new FormData();
  form.append("file", compressed, compressed.name);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: form,
  });

  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).error ?? ""; } catch { /* noop */ }
    throw new Error(`IPFS upload failed: ${res.status}${detail ? ` — ${detail}` : ""}`);
  }

  const data = (await res.json()) as { IpfsHash: string; PinSize: number; Timestamp: string };
  if (!data.IpfsHash) throw new Error("IPFS upload: malformed Pinata response");

  const cid = data.IpfsHash;
  const uri = `ipfs://${cid}`;
  const bytes32 = keccak256(stringToBytes(uri));
  return { uri, cid, bytes32 };
};
