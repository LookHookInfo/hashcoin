import { ChevronCircleLeft } from '../components/Icons'
import useStore from '../libs/store'
import { TOOLS_ADDRESS } from '../libs/common'
import { useContract, useNFTs } from "@thirdweb-dev/react";
import { ErrorBox, LoadingBox } from '../components/Htm';
import NFT from '../third/NFT';

export default function Shop(){
   const { contract } = useContract(TOOLS_ADDRESS);
   const { data: nfts, isLoading, error } = useNFTs(contract);

   if(isLoading){ return <LoadingBox /> }
   if(error){ return <ErrorBox /> }

   if(nfts?.length === 0){
      return <></>
   }else{
      return(<div className="container mx-auto" style={{ maxWidth: '1000px' }}>
         <div className='flex flex-col'>
            <ShopHeading />
            <div className='grid sm:grid-cols-3 gap-5 pb-10'>
               <ItemsNFT nfts={nfts} contract={contract} />
            </div>
         </div>
      </div>)
   }
}

function ItemsNFT({ nfts, contract }){
   return nfts?.map((nftItem, index) => (
      <div className="fl w-100 w-third-ns pa2" key={index}>
         <div className="ba b--moon-gray pt2 ph3 ph4-ns tc bg-white pb5">
         <NFT contract={contract}
            key={nftItem.metadata.id}
            nft={nftItem} />
         </div>
      </div>
   ))
}

function ShopHeading(){
   const { setIdx } = useStore()
   return (<div className="flex items-center py-3 mx-auto">
      <div className="px-2 border-r border-gray-300">
         <span className="cursor-pointer" onClick={() => setIdx(0)}><ChevronCircleLeft /></span>
      </div>
     <div className="flex flex-col p-4">
        <h3 className="font-bold text-lg">Shop</h3>
        <span className="text-gray-500">Purchase tools for Stablecoin to increase your earnings.</span>
     </div>
 </div>)
}
