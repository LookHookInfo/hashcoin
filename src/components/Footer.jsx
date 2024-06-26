import logo from '../assets/logo.png'
import metamask from '../assets/MetaMask.svg'
import { BrandDiscord, BrandGithub, BrandFacebook, BrandInstagram, BrandTelegram, BrandTwitter } from '../components/Icons'
import useStore from '../libs/store'

export default function Footer(){
   return(<div className='flex flex-col bg-zinc-900'>
      <div className='p-10 container mx-auto'>
         <div className='grid md:grid-cols-3 lg:grid-cols-4 gap-5 text-gray-200'>
            <AboutApp />
            <QuickLinks />
            <MetaMask />
         </div>
      </div>
      <SocialLinks />
   </div>)
}

function MetaMask(){
   return (<div className='p-5'>
      <img src={metamask} className='-my-12' />
      <span className='block text-sm text-center my-3 lg:my-1'>
      <a className='text-blue-300 hover:text-blue-400'
      href='https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en'
      target='_blank'>MetaMask Chrome</a> extension is a critical tool for anyone looking to engage with the web 3.0.
      </span>
   </div>)
}


function AboutApp(){
   return (<div className='p-5'>
      <Logo />
      <span className='block text-sm text-center'>
      Hash is a unique project that combines the world of memes and crypto currencies.
      </span>
   </div>)
}

function SocialLinks(){
   return(<div className="flex justify-center border-t border-gray-700">
      <div className="p-3 text-center text-gray-300">
         <ul className='flex list ma0 pa0 mv2'>
            <li className='p-2'><a href="https://twitter.com/HashCoinFarm" target="_blank"><BrandTwitter /></a></li>
            <li className='p-2'><a href="https://discord.com/invite/D55sWhNgcb" target="_blank"><BrandDiscord /></a></li>
            <li className='p-2'><a href="https://t.me/ChainInside/524" target="_blank"><BrandTelegram /></a></li>
            <li className='p-2'><a href="https://github.com/LookHookInfo" target="_blank"><BrandGithub width={10} /></a></li>
         </ul>
         <span className='text-sm'>© 2024 All rights reserved.</span>
      </div>
   </div>)
}


function Logo(){
   return <div className='flex flex-col mx-auto content-center'>
       <img className='mx-auto border border-gray-600 rounded-full mb-1' src={logo} width='54px' />
       <div className='mb-4 text-center'>
          <span className='text-xs leading-none'>Maining</span><br />
          <span className='font-bold text-xl pt-0 mt-0 leading-none'>Hash</span>
       </div>
   </div>
}

function QuickLinks(){
   const { idx, setIdx } = useStore()
   return (   <div className='p-5 lg:col-span-2'>
      <h3 className='text-xl font-bold mt-0 mb-8'>Quick Links</h3>
      <div className='grid lg:grid-cols-3 gap-5'>
         <div>
         <ul className='block m-0 p-0'>
<li className='px-3 hover:text-blue-300'>
   <a href='https://lookhook.info' target='_blank'>Team</a></li>
<li className='px-3 hover:text-blue-300'>
   <a href='https://opensea.io/collection/farm-inventory'
   target='_blank'>OTC</a></li>
<li className='px-3 hover:text-blue-300'>
   <a href='/'>Invest</a></li>
</ul>
         </div>
         <div>
         <ul className='block m-0 p-0'>
<li className='px-3 hover:text-blue-300'>
   <span className='cursor-pointer' onClick={() => setIdx(2)}>Coin</span></li>
<li className='px-3 hover:text-blue-300'>
   <span className='cursor-pointer' onClick={() => setIdx(3)}>Road</span></li>
<li className='px-3 hover:text-blue-300'>
   <span className='cursor-pointer' onClick={() => setIdx(4)}>Paper</span></li>
</ul>
         </div>
         <div>
         <ul className='block m-0 p-0'>
<li className='px-3 hover:text-blue-300'>
   <span className='cursor-pointer' onClick={() => setIdx(5)}>Promo</span></li>
<li className='px-3 hover:text-blue-300'>
   <span className='cursor-pointer' onClick={() => setIdx(6)}>Eco</span></li>
<li className='px-3 hover:text-blue-300'>
   <a href='/'>Tag</a></li>
</ul>
         </div>
      </div>
   </div>)
}

