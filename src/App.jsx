import useStore from "./libs/store"
import A from "./components/A"
import Home from "./views/Home"
import Shop from "./views/Shop"
import Coin from "./views/docs/Coin"
import Road from "./views/docs/Road"
import Paper from "./views/docs/Paper"
import Promo from "./views/docs/Promo"
import Eco from "./views/docs/Eco"


function App() {
  const { idx, setIdx } = useStore()
  return <A>
    { idx === 0 ? <Home /> :
      idx === 1 ? <Shop /> :
      idx === 2 ? <Coin /> :
      idx === 3 ? <Road /> :
      idx === 4 ? <Paper /> :
      idx === 5 ? <Promo /> :
      idx === 6 ? <Eco /> :
    <Home /> }</A>
}

export default App
