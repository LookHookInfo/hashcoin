import { MediaRenderer, Web3Button, useContractRead, useNFT } from "@thirdweb-dev/react";
import { STAKING_ADDRESS } from "../libs/common";
import { formatUnits } from "ethers/lib/utils";
import { AmountBadge } from "../components/Htm";

export default function Equipped({ address, tokenId, contractStaking, contractTools }){

   const { data: nft } = useNFT(contractTools, tokenId);
   const { data: claimableRewards } = useContractRead(contractStaking,
   "getStakeInfoForToken", [tokenId, address])

   return (
      <div className="flex flex-row">
         {nft && (
            <div className="flex flex-col my-3 mr-5 max-w-80
               border rounded-lg p-4 border-gray-300 bg-white">
               <MediaRenderer src={nft.metadata.image} />
               <h4 className="my-2 font-bold text-xl text-center">{nft.metadata.name}</h4>
               <span className="my-2 font-semibold">Equipped: { formatUnits(claimableRewards[0], 0)}</span>
               <Web3Button
                  contractAddress={STAKING_ADDRESS}
                  action={(contract) => contract.call("withdraw", [tokenId, 1])}>
               Unequip</Web3Button>
               <br />
               <h4 className="mb-3 font-semibold">Claimable $HASH:</h4>
               <AmountBadge>{formatUnits(claimableRewards[1], 18)}</AmountBadge>
               <br />
               <Web3Button
                  contractAddress={STAKING_ADDRESS}
                  action={(contract) => contract.call("claimRewards", [tokenId])}>
                  Claim $HASH</Web3Button>

            </div>
         )}
      </div>
   )
}
