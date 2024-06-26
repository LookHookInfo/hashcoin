import { AlertHexagon, CircleLetterR, IconLoader } from '../components/Icons'
export function LoadingBox(){
   return <div className='flex justify-center items-center'>
      <span className='p-2'><IconLoader /></span>
      <span className='p-2 text-bold text-gray-600'>Loading...</span>
   </div>
}

export function ErrorBox(){
   return(<div className='flex flex-col'>
      <div className='flex justify-center items-center'>
         <span className='p-2'><AlertHexagon /></span>
         <div className='flex flex-col justify-center'>
         <span className='p-2 text-bold text-red-600 tc'>
            Failed. Please reload page.</span>
         </div>
      </div>
   </div>)
}

export function Button({ title, onClick}){
   return (<span className="mt-10 block w-full rounded-md bg-zinc-700
      px-3 py-2 text-center text-sm font-semibold text-white shadow-sm
       hover:bg-zinc-600 cursor-pointer" onClick={onClick}>
      {title}</span>
   )
}

export function AmountBadge({ children }){
   return (<span class="relative z-10 border
      border-yellow-400
      rounded-full px-3 py-1.5
      font-medium bg-yellow-50">
         {children}</span>
   )
}
