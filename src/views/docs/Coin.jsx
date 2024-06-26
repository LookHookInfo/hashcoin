import useStore from "../../libs/store"
import ImgBase from '../../assets/base.jpeg'
import { ChevronCircleLeft } from '../../components/Icons'

export default function Coin(){
   return(<div className="container mx-auto" style={{ maxWidth: '1000px' }}>
      <div className='flex flex-col'>
         <PageHeading />
         <GridLineOne />
         <GridLineTwo />
      </div>
   </div>)
}

function Div({ children }){
   return(<div className="px-6 py-8 bg-white border border-gray-300 rounded-lg">{children}</div>)
}
function H3({ title }){
   return <h3 className="font-bold mb-3 text-lg">{title}</h3>
}

function GridLineOne(){
   return(<div className='grid sm:grid-cols-3 gap-5 mb-8'>
      <Div>
      <div>
         <img className="w-full mb-10 rounded-md" src={ImgBase} alt="Base" />
         <H3 title='General Information' />
         <p>
         <b>Token Name: </b> Hash Coin<br />
         <b>Token Symbol: </b> HASH <br />
         <b>Network: </b> Base<br />
         <b>Total Supply: </b>10 billion HASH
         <br /><br />
         <b>Contract: </b>
         <span className="text-wrap break-all">0xA9B631ABcc4fd0bc766d7C0C8fCbf866e2bB0445</span>
         </p></div>
      </Div>
      <Div>
      <div><H3 title="Mining Allocation" />
      <p>
         <b>1. Mining - 80% (8 billion tokens)</b><br />
         These tokens are designated for mining through the staking of NFT inventory.</p>
         <p className="py-4">
            • <b>Mining on EVM Networks - 40% (4 billion tokens)</b><br /><br />
            These tokens are in the mining pool on the Base network and are available for mining now.
            <br /><br /><b>Staking Contract:</b><span className=" break-all">
               0xBBc4f75874930EB4d8075FCB3f48af2535A8E848</span></p>
            <p className="py-4">
               • <b>Mining on Other Networks - 40% (4 billion tokens)</b><br /><br />
               These tokens are held in a team reserve address and are intended for topping up the Staking Contract on the Base network or for creating a similar contract on other networks as decided by the project team.
      </p></div>
      </Div>
      <Div>
      <div>
         <H3 title='Partnerships and Listing' />
         <p>
            <b>2. Partnerships and Listing - 10% (1 billion tokens)</b><br /><br />
            These tokens are intended for integration programs, partner community incentives, and providing liquidity on staking platforms.
            <br /><br />
            Currently held in the team reserve address. Unused tokens may be sent to the Staking Contract.
         </p>
      </div>
      </Div>
   </div>)
}

function GridLineTwo(){
   return(<div className='grid sm:grid-cols-3 gap-5 mb-8'>
      <Div>
      <div><H3 title='Community Development (Rewards)' />
         <p><b>3. Community Development (Rewards) - 5% (500 million tokens)</b>
         <br /><br />These tokens are intended for community development and incentives. Interaction with influencers, bloggers, and rewarding project ambassadors.
         Rewards for participating in various quests and completing valuable tasks.
         <br /><br />Currently held in the team reserve address. Unused tokens may be sent to the Staking Contract.
      </p></div>
      </Div>
      <Div>
      <div><H3 title='Ecosystem Formation (Team)' />
         <p>
            <b>4. Ecosystem Formation (Team) - 5% (500 million tokens)</b>
            <br /><br />These tokens are intended for initial ecosystem formation,
            liquidity pool funding, and developer incentives.
            <br /><br />Currently held in the team reserve address.
            Unused tokens may be sent to the Staking Contract.
         </p></div>
      </Div>
      <Div>
      <h3 className="font-bold mb-3">Special Features</h3>
      <p className="mb-3">We focus on token mining through the staking of NFT inventory. However, to enhance incentives and opportunities, we use 20% of the tokens for marketing and project development in the early stages.</p>
      <p>This strategy allows us to rapidly expand the ecosystem, integrate partner communities, and ensure liquidity across various platforms, ultimately contributing to the growth and success of the project.</p>
      </Div>
   </div>)
}

function PageHeading(){
   const { setIdx } = useStore()
   return (<div className="flex items-center py-3 mx-auto">
      <div className="px-2 border-r border-gray-300">
         <span className="cursor-pointer" onClick={() => setIdx(0)}><ChevronCircleLeft /></span>
      </div>
     <div className="flex flex-col p-4">
        <h3 className="font-bold text-lg">Hash Coin Tokenomics</h3>
        <span className="text-gray-500">A breakdown of the tokenomics of the Hash Coin project.</span>
     </div>
 </div>)
}
