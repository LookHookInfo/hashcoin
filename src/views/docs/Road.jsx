import useStore from "../../libs/store"
import ImgBase from '../../assets/base.jpeg'
import { ChevronCircleLeft, CircleCheckFilled } from '../../components/Icons'


export default function Road(){
   return(<div className="container mx-auto" style={{ maxWidth: '1000px' }}>
      <div className='flex flex-col'>
         <PageHeading />
         <GridLineOne />
         <GridLineTwo />
         <GridLineThree />
      </div>
   </div>)
}

function Div({ children }){
   return(<div className="px-6 py-8 bg-white border border-gray-300 rounded-lg">{children}</div>)
}
function H3({ title }){
   return <h3 className="text-center font-bold mb-3 text-lg">{title}</h3>
}

function GridLineOne(){
   return(<div className='grid sm:grid-cols-2 gap-5 mb-8 mt-2'>
      <Div>
     <div>
      <H3 title="Phase 1" />
      <H3 title="Conceptualization and Foundation" />
         <ul className="list-disc px-8 py-4">
            <li className="py-2"><b>Concept Development:</b> Defining the core idea and vision of MemeHash.</li>
            <li className="py-2"><b>Token Issuance (<a className="text-blue-400 hover:text-blue-500" target="_blank" href="https://basescan.org/address/0xa9b631abcc4fd0bc766d7c0c8fcbf866e2bb0445">Contract</a>):</b> Launching the HASH token with limited supply.</li>
            <li className="py-2"><b>Founder's Comment: (<a target="_blank" className="text-blue-400 hover:text-blue-500"
            href="https://x.com/PrimeBlocks/status/1790817564932677791">Link</a>)</b></li>
            <li className="py-2"><b>DApp Integration into EVM:</b> Implementing the decentralized application into Ethereum Virtual Machine.</li>
            <li className="py-2"><b>Formation of the HASH Ecosystem:</b> Creating and developing the ecosystem around the product.</li>
         </ul>
      </div>
      </Div>
      <Div>
      <div>
      <H3 title="Phase 2" />
      <H3 title="Community Building and Early Engagement" />
         <ul className="list-disc px-8 py-4">
         <li className="py-2"><b>Discord Roles:</b> Defining and assigning roles within the Discord community.</li>
         <li className="py-2"><b>Inventory Drop for the Community:</b> Distributing NFT GPUs among the initial project participants (100 units).</li>
         <li className="py-2"><b>Integration with Aggregators:</b> Listing MemeHash on CoinMarketCap (CMC), CoinGecko (CG), and other aggregators.</li>
         <li className="py-2">More useful information in the product interface.</li>
         </ul>
      </div>
      </Div>
   </div>)
}

function GridLineTwo(){
   return(<div className='grid sm:grid-cols-2 gap-5 mb-8'>
      <Div>
     <div>
      <H3 title="Phase 3" />
      <H3 title="Expansion and Broader Integration" />
         <ul className="list-disc px-8 py-4">
         <li className="py-2"><b>CEX Listing:</b> Listing the HASH token on centralized exchanges for seamless asset trading.</li>
         <li className="py-2"><b>Launch of Quests and Tasks:</b> Introducing interactive quests and tasks on platforms like Guild, Galxe, and Zealy.</li>
         <li className="py-2"><b>OTC Inventory Market:</b> Creating an over-the-counter market for trading inventory.</li>
         <li className="py-2"><b>NFT Collection of our #Tag:</b> Launching a unique NFT collection.</li>
         <li className="py-2"><b>Implementation of Mining in Other Networks:</b> To expand capabilities and interact with communities across different networks, the team has allocated 4b HASH tokens for mining implementation in another network.</li>
         <li className="py-2"><b>Airdrop for the Community:</b> Conducting an airdrop to reward active community members, liquidity providers, inventory holders, and whitelist participants.</li>
         <li className="py-2"><b>Expanded Integration:</b> Expanding the range of integrations to increase visibility.</li>
         </ul>
      </div>
      </Div>
      <Div>
      <div>
      <H3 title="Phase 4" />
      <h3 className="text-center font-bold mb-3 text-lg">Future Developments and Innovations <br />(Under Discussion)</h3>
         <ul className="list-disc px-8 py-4">
         <li className="py-2"><b>New Inventory for HASH Mining:</b></li>
         <ul className="list-disc pl-3">
            <li className="py-2"><b>GPU Rig:</b> Introducing a new inventory item for token mining.</li>
            <li className="py-2"><b>Asic Miner Rack:</b> Adding advanced Asic miners for enhanced mining capabilities.</li>
            <li className="py-2"><b>Mining Container:</b> Developing a mining container for large-scale operations.</li>
         </ul>
         <li className="py-2"><b>Development of a Telegram Bot:</b> Creating a Telegram bot for simplified access and interaction with the application.</li>
         </ul>
      </div>
      </Div>
   </div>)
}

function GridLineThree(){
   return(<div className='grid gap-5 mb-8'>
      <Div>
     <div>
      <H3 title="Conclusion" />
         <p className="text-center">Our roadmap clearly and structurally outlines the path of MemeHash's development and growth. We strive to achieve each goal and continuously innovate to bring value to our community. Stay tuned for updates and join us on this journey!</p>
      </div>
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
        <h3 className="font-bold text-xl">MemeHash Roadmap</h3>
     </div>
 </div>)
}
