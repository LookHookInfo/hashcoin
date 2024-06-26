import { ConnectWallet } from '@thirdweb-dev/react'
import ImgLogo from '../assets/logo.png'
import Footer from './Footer'
import useStore from '../libs/store'

export default function A({ children }){
   return(<div className="flex flex-col min-h-full">
      <Nav />
      <div className="px-6 sm:p-12 flex-auto bg-gray-200 content-center">{children}</div>
      <Footer />
   </div>)
}

function AppLogo(){
   const { setIdx } = useStore()
   return (<div className='hidden sm:flex p-3'>
      <div className='flex items-center cursor-pointer' onClick={() => setIdx(0)}>
         <img className='border rounded-full mr-2 border-gray-600'
         src={ImgLogo} alt='Logo' width='48px' />
         <span className='text-white pt-1'>
            <span className='block text-xs leading-none'>Maining</span>
            <span className='block font-bold text-xl'>Hash</span>
         </span>
      </div>
   </div>)
}

function NavMenu(){
   const { idx , setIdx } = useStore()
   return(<div className="p-3 flex flex-auto sm:justify-center">
      <ul className='flex m-0 p-0 text-white'>
         <li className='px-3 hover:text-blue-300'>
            <span className='cursor-pointer' onClick={() => setIdx(0)}>Play</span></li>
         <li className='px-3 hover:text-blue-300'>
            <span className='cursor-pointer' onClick={() => setIdx(1)}>Shop</span></li>
         <li className='px-3 hover:text-blue-300'>
            <a href='https://guild.xyz/hashcoin'
            target='_blank'>Guild</a></li>
      </ul>
   </div>)
}

function Nav(){
   return(<div className="flex justify-between items-center bg-zinc-900">
      <AppLogo />
      <NavMenu />
      <div className="p-3"><ConnectWallet /></div>
   </div>)
}
