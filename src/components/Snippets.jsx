import { AmountBadge } from "./Htm"

export function Box({ children }){
   return (<div className='flex flex-col bg-gray-50 p-6 mb-3 border
      border-gray-300 shadow-lg rounded-md'>
   { children }</div>)
}

export function MiningCenter({ amount, children }){
   return(<div className='flex flex-col bg-white p-6 mb-3 border
      border-gray-300 shadow-lg rounded-md'>
      <h3 className="mb-3 font-bold">Mining center:</h3>
      {children}
      <h4 className="mt-3 font-bold">$HASH Balance:</h4>
      <span>{amount}</span>
    </div>)
}


