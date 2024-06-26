import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThirdwebProvider } from '@thirdweb-dev/react'
import { walletConnect, createWallet } from "thirdweb/wallets";
import { clienId } from './libs/common.js'
import { Base } from '@thirdweb-dev/chains'
import App from './App.jsx'
import './input.css'

const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  walletConnect()
]

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThirdwebProvider clientId={clienId}
    activeChain={Base} wallets={wallets}>
    <App /></ThirdwebProvider>
  </React.StrictMode>,
)
