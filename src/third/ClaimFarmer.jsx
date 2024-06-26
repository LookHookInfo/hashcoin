import { useContractMetadata, MediaRenderer, Web3Button } from '@thirdweb-dev/react'
import { FARMER_ADDRESS } from '../libs/common'
import { LoadingBox } from '../components/Htm'

export default function ClaimFarmer({ contract }){
   const { data: metadata, isLoading, error } = useContractMetadata(contract)
   if(isLoading) return (<LoadingBox />)
   if(error) return (<span className='red'>Error occurred while processing your request!</span>)
   if(metadata?.length === 0){
      return <></>
   }else{
      return (<div className='flex flex-col mx-auto justify-center
      bg-white pb-4 px-4 border border-gray-300 rounded-lg mb-3' style={{ maxWidth: '280px'}}>
      {metadata?.image && (
         <MediaRenderer src={metadata.image} height="280px" width="280px" />
      )}
      <Web3Button
         contractAddress={FARMER_ADDRESS}
         action={(contract) => contract.erc1155.claim(0, 1)}>Claim</Web3Button>
      </div>)
   }
}
