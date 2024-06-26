import { FARMER_ADDRESS, TOOLS_ADDRESS, STAKING_ADDRESS, REWARDS_ADDRESS } from '../libs/common'
import { useContract, useOwnedNFTs, ConnectWallet, useContractRead, MediaRenderer } from '@thirdweb-dev/react'
import ClaimFarmer from '../third/ClaimFarmer';
import Inventory  from '../third/Inventory';
import Equipped from '../third/Equipped';
import { LoadingBox } from '../components/Htm';
import { MiningCenter, Box } from '../components/Snippets';
import { formatUnits } from 'ethers/lib/utils';


export default function Game({ address }){
  const { contract: contractFarmer } = useContract(FARMER_ADDRESS);
  const { contract: contractTools } = useContract(TOOLS_ADDRESS);
  const { contract: contractStaking } = useContract(STAKING_ADDRESS);
  const { contract: contractRewards } = useContract(REWARDS_ADDRESS);

  const { data: dataFarmer, isLoading: isLoadingFarmer } = useOwnedNFTs(contractFarmer, address);
  const { data: dataTools, isLoading: isLoadingTools } = useOwnedNFTs(contractTools, address);

  const { data: dataStaking } = useContractRead(contractStaking, "getStakeInfo", [address])
  const { data: dataRewards } = useContractRead(contractRewards, "balanceOf", [address]);

  if (!address) return (<ConnectWallet />)
  if (isLoadingFarmer) return (<LoadingBox />)
  if (dataFarmer?.length == 0){
    return <ClaimFarmer contract={contractFarmer} />
  }

  


  return <div className='container mx-auto p-3' style={{ maxWidth: '1100px' }}>
      <div className='grid sm:grid-cols-2 gap-5'>
        <MiningCenter amount={rewardsAmount(dataRewards)}>
        {dataFarmer?.map((nft) => (
          <div key={nft.metadata.id}>
            <MediaRenderer src={nft.metadata.image} height="100%" width="100%" />
          </div>
        ))}
        </MiningCenter>
        <Inventory nft={dataTools} address={address}
          contractStaking={contractStaking} contractTools={contractTools} />
      </div>
      <div className='my-4'>
        { dataStaking?.length > 0 && <Box>
          <h3 className='font-bold'>Equipped:</h3>
          <div className='flex flex-wrap'>
          { dataStaking[0].map((nft) => (
            <Equipped key={nft.toNumber()} tokenId={nft.toNumber()} address={address}
              contractStaking={contractStaking} contractTools={contractTools} />
            ))}
          </div>
          </Box>
        }
      </div>
  </div>
}

function rewardsAmount(dataRewards){
  return (
    Math.round(parseFloat(formatUnits(dataRewards, 18)) * 100) / 100)
      .toLocaleString('en-US',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )
}
