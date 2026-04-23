import { getContract } from "thirdweb";
import { client } from "@/lib/thirdweb/client";
import { chain, chainAlchemy2, chainAlchemy3 } from "@/lib/thirdweb/chain";
import farmRoleAbi from "@/lib/abi/farmrole.json";
import galxeNftFarmAbi from "@/lib/abi/galxe-nft-farm.json";
import gemfunAbi from "@/lib/abi/gemfun.json";
import type { Abi } from "viem";

export const TOOLS_ADDRESS = "0x13CE10a3e09FA8000BA8A13fCbe8813f476584e7";
export const STAKING_ADDRESS = "0xBBc4f75874930EB4d8075FCB3f48af2535A8E848";
export const HASHCOIN_ADDRESS = "0xA9B631ABcc4fd0bc766d7C0C8fCbf866e2bB0445";
export const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
export const FARMROLE_ADDRESS = "0xFB284cA86D797DA6f9176E51cb7836C2794111e5";
export const GALXENFTFARM_ADDRESS = "0x5Ce07C4b826094F932940571512664EED26412f7";
export const GEMFUN_ADDRESS = "0x25064346f8E910Ea710d93e15a0E24d0233e60F2";

export const contractTools = getContract({ client, chain: chainAlchemy2, address: TOOLS_ADDRESS });
export const contractStaking = getContract({ client, chain: chainAlchemy2, address: STAKING_ADDRESS });
export const contractGemFun = getContract({ client, chain: chainAlchemy3, address: GEMFUN_ADDRESS, abi: gemfunAbi as any as Abi });
export const hashcoinContract = getContract({ client, chain, address: HASHCOIN_ADDRESS });
export const usdcContract = getContract({ client, chain, address: USDC_ADDRESS });
export const nameContract = getContract({ client, chain, address: "0xA8e00E2ca8b183Edb7EbB6bD7EeBB90047416F95" });
export const contractFarmRole = getContract({ client, chain, address: FARMROLE_ADDRESS, abi: farmRoleAbi as Abi });
export const contractGalxeNftFarm = getContract({ client, chain, address: GALXENFTFARM_ADDRESS, abi: galxeNftFarmAbi as Abi });
