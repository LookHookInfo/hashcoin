import useStore from "../../libs/store"
import { ChevronCircleLeft } from '../../components/Icons'
import { Button } from '../../components/Htm'

export default function Paper(){
   return(<div className="container mx-auto" style={{ maxWidth: '1000px' }}>
      <div className='flex flex-col'>
         <PageHeading />
         <GridLineOne />
         <GridLineTwo />
         <GridLineThree />
         <GridLineFour />
      </div>
   </div>)
}

function PageHeading(){
   const { setIdx } = useStore()
   return (<div className="flex items-center py-3 mx-auto">
      <div className="px-2 border-r border-gray-300">
         <span className="cursor-pointer" onClick={() => setIdx(0)}><ChevronCircleLeft /></span>
      </div>
     <div className="flex flex-col p-4">
        <h3 className="font-bold text-xl">Hash Coin Paper</h3>
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
   const { setIdx } = useStore()
   return(<div className='grid sm:grid-cols-2 gap-5 mb-8 mt-2'>
      <Div>
      <H3 title="Hash Coin Paper" />
      <p className="py-2 px-10 font-medium text-center">Welcome to the Hash Coin ecosystem, where innovation and community engagement are the driving forces behind our mission.</p>
      <p className="py-2">Our tokenomics and mechanics are designed to ensure stability, incentivize participation, and support the long-term growth of our project. This document outlines the core aspects of token distribution, NFT staking mechanics, and profit distribution.</p>
      <p className="py-2 pt-3 font-semibold">Contract Information</p>
      <p>Participants interact with the following contracts:</p>
         <ul className="list-disc px-8 py-4">
            <li className="py-2"><b>NFT Contract: </b><span className="break-all">0x3ACCCbCDfd1ed5C4fb926c9AFFD619E546f3a95D</span></li>
            <li className="py-2"><b>Inventory Contract: </b> <span className="break-all">0x13CE10a3e09FA8000BA8A13fCbe8813f476584e7</span></li>
            <li className="py-2"><b>Rewards Contract: </b><span className="break-all">0xA9B631ABcc4fd0bc766d7C0C8fCbf866e2bB0445</span></li>
            <li className="py-2"><b>Staking Contract: </b><span className="break-all">0xBBc4f75874930EB4d8075FCB3f48af2535A8E848</span></li>
         </ul>
      </Div>
      <Div>
      <H3 title="Token Distribution" />
      <p>Our token distribution strategy ensures a balanced and sustainable ecosystem:</p>
         <ul className="list-disc px-8 py-4">
         <li className="py-2"><b>80% for Mining:</b> The majority of our tokens are available for mining, allowing participants to actively engage with the ecosystem.</li>
         <li className="py-2"><b>20% for Project Development:</b> A portion of the tokens is allocated to support the current development and improvement of our project.</li>
         </ul>
      <Button onClick={() => setIdx(2)} title='Tokenomics' />
      </Div>
   </div>)
}

function GridLineTwo(){
   return(<div className='grid sm:grid-cols-2 gap-5 mb-8'>
      <Div>
      <H3 title="NFT Staking Mechanics" />
      <p>Participants can acquire and stake NFTs to receive rewards in HASH tokens. Mining speed depends on the type and quantity of NFTs. We offer various types of NFTs:</p>
      <ul className="list-disc px-8 py-4">
         <li className="py-2"><b>NFT GPU:</b> Cost: $1.99 / Mining Speed: 0.042 #hash per hour</li>
         <li className="py-2"><b>NFT Asic: Cost:</b> $9.50 / Mining Speed: 0.42 #hash per hour</li>
         <li className="py-2"><b>NFT Farm: Cost:</b> $29.20 / Mining Speed: 2.42 #hash per hour</li>
      </ul>
      <p className="py-2">In the future, additional inventory such as Rig, Rack, Container will be introduced.</p>
      </Div>
      <Div>
      <H3 title="Key Features" />
         <ul className="list-disc px-8 pb-4">
         <li className="py-2"><b>Universal Participation:</b> Anyone can participate in our ecosystem without regional restrictions.</li>
         <li className="py-2"><b>Initiation:</b> To start mining HASH tokens, a participant must create an NFT-space (registration). This minting process is free except for gas fees and is performed once per participant account. Afterward, participants can purchase NFT inventory for HASH token mining through staking.
         <br /><br />Participants have the right to exit staking and claim rewards at any time, considering the token balance in the pool. Rewards are distributed by the contract <span className="break-all">(0xBBc4f75874930EB4d8075FCB3f48af2535A8E848)</span> on a first-come, first-served basis.</li>
         <li className="py-2"><b>Flexibility of Staking:</b> Participants can withdraw NFTs from staking and list them for sale on the OTC NFT market if they decide to cease token mining.</li>
         </ul>
      </Div>
   </div>)
}

function GridLineThree(){
   const { setIdx } = useStore()
   return(<div className='grid sm:grid-cols-2 gap-5 mb-8'>
      <Div>
      <H3 title="Profit Distribution from NFT Sales" />
      <p>Profits from NFT sales are strategically allocated to ensure the stability and growth of the project:</p>
      <ul className="list-disc px-8 py-4">
         <li className="py-2"><b>50%</b> of the proceeds are directed to the HASH/stablecoin liquidity pool, ensuring stability and liquidity in trading pairs.</li>
         <li className="py-2"><b>35%</b> forms reserves in the Treasury Fund: For future investments and project development.</li>
         <li className="py-2"><b>15%</b> to the Team Fund: Provides funding for the team to continue product development and improvement.</li>
      </ul>
      </Div>
      <Div>
      <H3 title="Future Development" />
      <p>We strive for continuous improvement and innovation. Our future plans include:</p>
         <ul className="list-disc px-8 py-4">
         <li className="py-2"><b>Enhanced Analytics:</b> Adding analytical data for a deeper understanding of the HASH coin ecosystem and movement.</li>
         <li className="py-2"><b>Improved Interface:</b> Enhancing the user interface to improve the user experience.</li>
         <li className="py-2"><b>Community Engagement and Partner Acquisition.</b></li>

         </ul>
      <Button onClick={() => setIdx(3)} title='Road Map' />
      </Div>
   </div>)
}

function GridLineFour(){
   return(<div className='grid gap-5 mb-8'>
      <Div>
     <div>
      <H3 title="Conclusion" />
         <p className="text-center">Hash Coin aims to create a reliable and engaging ecosystem. Our tokenomics and NFT staking mechanics are designed to ensure stability, incentivize participation, and support the long-term growth of our project. Join us in building a thriving community and a sustainable future.
         Follow our social networks for additional information and updates.</p>
      </div>
      </Div>
   </div>)
}



