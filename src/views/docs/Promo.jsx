import useStore from "../../libs/store"
import { ChevronCircleLeft } from '../../components/Icons'
import { Button } from '../../components/Htm'
import ImgPublic from '../../assets/news.jpg'
import ImgProfile from '../../assets/profile.png'
import logo1 from '../../assets/logo1.png'
import logo2 from '../../assets/logo2.jpg'
import logo3 from '../../assets/logo3.jpg'

export default function Promo(){
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
        <h3 className="font-bold text-xl">Promo # Hash</h3>
        <span className="text-gray-500">Essential information for integration</span>
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
      <H3 title="Promo # Hash" />
         <p className="py-2 px-5 font-medium text-center">Essential information for integration, partner profile completion, listing, and other marketing activities.</p>
         <p className="py-2">Anyone can integrate Hash into platforms like NFT markets or crypto aggregators, create a review, and receive rewards from the Mining Hash team for themselves or their community.</p>
      </Div>
      <Div>
      <H3 title="Hash Coin Mining" />
      <p className="font-bold">Project description:</p>
      <p className="py-2">Hash is a unique project that combines the world of memes and cryptocurrencies.
         Users can acquire various types of NFTs and stake them to earn Hash tokens as rewards.
         <br /><br />NFT staking opens up new opportunities for increasing productivity, efficiency, and profitability in the mining world.</p>
      <br />
      <p className="font-bold py2">Links:</p>
      <ul className="list-disc px-8 pt-2">
         <li className="py-1">
            <a className="text-blue-400 hover:text-blue-500"
            href="https://twitter.com/HashCoinFarm" target="_blank">
            Twitter</a></li>
         <li className="py-1">
            <a className="text-blue-400 hover:text-blue-500"
            href="https://t.me/ChainInside/524" target="_blank">
            Telegram</a></li>
         <li className="py-1">
            <a className="text-blue-400 hover:text-blue-500"
            href="https://guild.xyz/hashcoin" target="_blank">
            Guild</a></li>
      </ul>
      </Div>
   </div>)
}

function GridLineTwo(){
   return(<div className='grid sm:grid-cols-2 gap-5 mb-8'>
      <Div>
      <H3 title="Public Banner (800x600)" />
      <img className="w-full" src={ImgPublic} alt="Public" />
      </Div>
      <Div>
      <H3 title="Profile Banner (1500x500)" />
      <img className="w-full mb-10" src={ImgProfile} alt="Profile" />
      <p className="py-5 text-center">Some project related images and logos. <br />Click on image and press "Save to"</p>
      </Div>
   </div>)
}

function GridLineThree(){
   const { setIdx } = useStore()
   return(<div className='grid sm:grid-cols-3 gap-5 mb-8'>
      <Div><img className="w-full" src={logo1} alt="Logo1" /></Div>
      <Div><img className="w-full" src={logo2} alt="Logo2" /></Div>
      <Div><img className="w-full" src={logo3} alt="Logo3" /></Div>
   </div>)
}

function GridLineFour(){
   return(<div className='grid gap-5 mb-8'>
      <Div>
      <H3 title="Google Disk" />
      <a className="text-blue-400 hover:text-blue-500 block text-center"
      href="https://drive.google.com/drive/folders/1uStwAUZ2e179CQf9ZPTbVvdDW9DbxjuF?usp=sharing">
      Goodle Drive (more promo for downloading)
      </a>
      </Div>
   </div>)
}



