import farmRoleAbi from "@/lib/abi/farmrole.json";
import galxeNftFarmAbi from "@/lib/abi/galxe-nft-farm.json";
import gemfunAbi from "@/lib/abi/gemfun.json";
import { erc20Abi } from "viem";
import type { Abi } from "viem";

export const ERC1155_ABI = [
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const satisfies Abi;

// DropERC1155 (thirdweb-style) `claim` selector — used by the Shop ToolCard.
export const DROP_ERC1155_CLAIM_ABI = [
  {
    type: "function",
    name: "claim",
    stateMutability: "payable",
    inputs: [
      { name: "_receiver", type: "address" },
      { name: "_tokenId", type: "uint256" },
      { name: "_quantity", type: "uint256" },
      { name: "_currency", type: "address" },
      { name: "_pricePerToken", type: "uint256" },
      {
        name: "_allowlistProof",
        type: "tuple",
        components: [
          { name: "proof", type: "bytes32[]" },
          { name: "quantityLimitPerWallet", type: "uint256" },
          { name: "pricePerToken", type: "uint256" },
          { name: "currency", type: "address" },
        ],
      },
      { name: "_data", type: "bytes" },
    ],
    outputs: [],
  },
] as const satisfies Abi;

export const STAKING_ABI = [
  {
    type: "function",
    name: "stake",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_tokenId", type: "uint256" },
      { name: "_amount", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_tokenId", type: "uint256" },
      { name: "_amount", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimRewards",
    stateMutability: "nonpayable",
    inputs: [{ name: "_tokenId", type: "uint256" }],
    outputs: [],
  },
] as const satisfies Abi;

export const TOOLS_ADDRESS = "0x13CE10a3e09FA8000BA8A13fCbe8813f476584e7" as const;
export const STAKING_ADDRESS = "0xBBc4f75874930EB4d8075FCB3f48af2535A8E848" as const;
export const HASHCOIN_ADDRESS = "0xA9B631ABcc4fd0bc766d7C0C8fCbf866e2bB0445" as const;
export const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as const;
export const FARMROLE_ADDRESS = "0xFB284cA86D797DA6f9176E51cb7836C2794111e5" as const;
export const GALXENFTFARM_ADDRESS = "0x5Ce07C4b826094F932940571512664EED26412f7" as const;
export const GEMFUN_ADDRESS = "0xea4831Df95738d6Ef0f2b47e5345fa75A2E59e86" as const;
export const NAME_ADDRESS = "0xA8e00E2ca8b183Edb7EbB6bD7EeBB90047416F95" as const;

export type ContractRef = { readonly address: `0x${string}`; readonly abi: Abi };

export const contractTools: ContractRef = { address: TOOLS_ADDRESS, abi: DROP_ERC1155_CLAIM_ABI as unknown as Abi };
export const contractStaking: ContractRef = { address: STAKING_ADDRESS, abi: STAKING_ABI as unknown as Abi };
export const contractGemFun: ContractRef = { address: GEMFUN_ADDRESS, abi: gemfunAbi as unknown as Abi };
export const hashcoinContract: ContractRef = { address: HASHCOIN_ADDRESS, abi: erc20Abi as unknown as Abi };
export const usdcContract: ContractRef = { address: USDC_ADDRESS, abi: erc20Abi as unknown as Abi };
export const nameContract: ContractRef = { address: NAME_ADDRESS, abi: [] as unknown as Abi };
export const contractFarmRole: ContractRef = { address: FARMROLE_ADDRESS, abi: farmRoleAbi as unknown as Abi };
export const contractGalxeNftFarm: ContractRef = { address: GALXENFTFARM_ADDRESS, abi: galxeNftFarmAbi as unknown as Abi };
