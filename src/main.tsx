import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import './global.css';
import App from './App.tsx';
import { MantineProvider, createTheme } from '@mantine/core';
import { theme } from './libs/theme.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThirdwebProvider } from 'thirdweb/react';

import { HelmetProvider } from 'react-helmet-async';

const AppTheme = createTheme(theme);
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThirdwebProvider>
      <MantineProvider theme={AppTheme} defaultColorScheme="dark">
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </QueryClientProvider>
      </MantineProvider>
    </ThirdwebProvider>
  </React.StrictMode>
);