import { create } from 'zustand'

const useStore = create((set, get) => ({
   idx: 0,
   setIdx: (v) => set(() => ({ idx: v }))

}))

export default useStore
