import { ConnectWallet, useAddress } from '@thirdweb-dev/react'
import imgAsic from '../assets/asic.png'
import logo from '../assets/logo.png'
import Game from './Game'

export default function Home(){
   const address = useAddress()
   return ( address ? <Game address={address} /> : <Intro /> )
}

function Intro(){
   return <div className='flex flex-col mx-auto items-center
      border border-blue-50 shadow-lg
    rounded-xl p-3 bg-white' style={{ maxWidth: '240px' }}>
       <img className='border border-black rounded-full mb-1 mt-4' src={logo} width='54px' />
       <div className='db text-center'>
          <span className='text-xs leading-none'>Maining</span><br />
          <span className='font-bold text-xl pt-0 mt-0 leading-none'>Hash</span>
       </div>
       <div className='py-2'>
          <img src={imgAsic} width='170px' />
       </div>
       <h5 className='m-0 mb-2 font-bold'>TO PLAY</h5>
       <div className='border-t p-3'>
       <ConnectWallet />
       </div>
   </div>
 }
