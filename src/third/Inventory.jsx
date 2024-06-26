import React from 'react';
import { MediaRenderer, Web3Button } from '@thirdweb-dev/react';
import { STAKING_ADDRESS } from '../libs/common';
import { Box } from '../components/Snippets';
import useStore from '../libs/store'
import { Button } from '../components/Htm';


export default function Inventory({ nft, address, contractTools, contractStaking }) {

   async function stakeNFT(id){
      const isApproved = await contractTools?.erc1155.isApproved(
         address, STAKING_ADDRESS)
      if (!isApproved) {
         await contractTools?.erc1155.setApprovalForAll(STAKING_ADDRESS, true)
      }
      await contractStaking?.call("stake", [id, 1]);
   }

   if(nft?.length === 0){
      const { setIdx } = useStore()
      return (
         <Box>
            <span className='font-bold'>No device:</span>
            <Button title='Shop device' onClick={() => setIdx(1)} />
         </Box>
      )
   }

   return (
      <Box>
         <h3 className='mb-3 font-bold'>Inventory:</h3>
         <div className='flex flex-wrap'>
            {nft?.map((nft) => (
               <div className='mr-3 mb-3' key={nft.metadata.id} p={5}>
                  <div className='flex flex-col items-center
                  border border-gray-300 my-2 p-3 rounded-md bg-white'>
                  <MediaRenderer
                     src={nft.metadata.image}
                     height="100px" width="100px" />
                  <p className='font-bold my-2'>{nft.metadata.name}</p>
                  <Web3Button
                     contractAddress={STAKING_ADDRESS}
                     action={() => stakeNFT(nft.metadata.id)}>
                     Equip</Web3Button>
                  </div>
               </div>
            ))}
         </div>
      </Box>
   )
}
