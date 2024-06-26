import { MediaRenderer, Web3Button, useActiveClaimCondition } from "@thirdweb-dev/react";
import { TOOLS_ADDRESS } from "../libs/common";
import { formatUnits } from 'ethers/lib/utils';
import { AmountBadge, ErrorBox } from '../components/Htm';

export default function NFT({ nft, contract }) {
    const { data, isLoading, error } = useActiveClaimCondition(
        contract, nft.metadata.id )
    if (error) { return <ErrorBox /> }

    const formatUSDCPrice = (price) => {
        return formatUnits(price, 6);
    }

    if(nft?.metadata){
        return (
            <div className="flex flex-col justify-center items-center p-10"
            key={nft.metadata.id}>
                <MediaRenderer src={nft.metadata.image}
                height="100%" width="100%" />
                <p className="font-bold mb-3">{nft.metadata.name}</p>
                {!isLoading && data ? (
                    <AmountBadge>
                        <span className="text-xs">
                            Cost: {formatUSDCPrice(data?.price)}{" " + data?.currencyMetadata.symbol}
                        </span>
                    </AmountBadge>
                ) : (
                    <p>Loading...</p>
                )}
                <br />
                <Web3Button contractAddress={TOOLS_ADDRESS}
                action={(contract) => contract.erc1155.claim(nft.metadata.id, 1)}>
                    Buy</Web3Button>
            </div>
        )
    }else{
        return <></>
    }
}
