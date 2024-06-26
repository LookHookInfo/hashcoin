import useStore from "../../libs/store"
import { ChevronCircleLeft } from '../../components/Icons'


export default function Eco(){
   return(<div className="container mx-auto" style={{ maxWidth: '1000px' }}>
      <div className='flex flex-col'>
         <PageHeading />
         <GridLineOne />
         <GridLineTwo />
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
        <h3 className="font-bold text-xl">Ecosystem</h3>
        <span className="text-gray-500">Partners and usefull links </span>
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
         <H3 title="Partners # Hash" />
         <p className="py-2">Ecosystem partners</p>
      </Div>
      <Div>
         <H3 title="Aggregators" />
         <ul className="list-disc px-8 py-4">
            <li className="py-2"><b>GeckoTerminal (<a className="text-blue-400 hover:text-blue-500" target="_blank"
            href="https://www.geckoterminal.com">Hash/DAI</a>)</b></li>
            <li className="py-2"><b>DexTools (<a target="_blank" className="text-blue-400 hover:text-blue-500"
            href="https://www.geckoterminal.com">Hash/DAI</a>)</b></li>
         </ul>
      </Div>
   </div>)
}

function GridLineTwo(){
   return(<div className='grid sm:grid-cols-2 gap-5 mb-8 mt-2'>
      <Div>
         <H3 title="Media" />
         <p className="py-2">Media</p>
      </Div>
      <Div>
      <H3 title="DEX #hash" />
         <p className="py-2">DEX</p>
      </Div>
   </div>)
}






