import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import '@rainbow-me/rainbowkit/styles.css';
import './global.css';
import App from './App.tsx';
import { MantineProvider, createTheme } from '@mantine/core';
import { theme } from './libs/theme.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from './lib/wagmi/config';

import { HelmetProvider } from 'react-helmet-async';

const AppTheme = createTheme(theme);
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          <MantineProvider theme={AppTheme} defaultColorScheme="dark">
            <HelmetProvider>
              <App />
            </HelmetProvider>
          </MantineProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
