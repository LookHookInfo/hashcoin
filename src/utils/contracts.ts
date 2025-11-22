import { getContract } from "thirdweb";
import { client } from "@/lib/thirdweb/client";
import { chain } from "@/lib/thirdweb/chain";
import farmRoleAbi from "@/lib/abi/farmrole.json";
import type { Abi } from "viem";

const TOOLS_ADDRESS = "0x13CE10a3e09FA8000BA8A13fCbe8813f476584e7";
const STAKING_ADDRESS = "0xBBc4f75874930EB4d8075FCB3f48af2535A8E848";
const HASHCOIN_ADDRESS = "0xA9B631ABcc4fd0bc766d7C0C8fCbf866e2bB0445";
const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const FARMROLE_ADDRESS = "0xFB284cA86D797DA6f9176E51cb7836C2794111e5";

export const contractTools = getContract({
  client,
  chain,
  address: TOOLS_ADDRESS,
});

export const contractStaking = getContract({
  client,
  chain,
  address: STAKING_ADDRESS,
});

export const hashcoinContract = getContract({
  client,
  chain,
  address: HASHCOIN_ADDRESS,
});

export const usdcContract = getContract({
  client,
  chain,
  address: USDC_ADDRESS,
});

export const nameContract = getContract({
  client,
  chain,
  address: "0xA8e00E2ca8b183Edb7EbB6bD7EeBB90047416F95",
});

export const contractFarmRole = getContract({
  client,
  chain,
  address: FARMROLE_ADDRESS,
  abi: farmRoleAbi as Abi,
});