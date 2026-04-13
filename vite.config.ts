import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    react(), 
    nodePolyfills({
      // Enable specific polyfills that are often needed by web3 libraries
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Exclude problematic modules from pre-bundling if they cause dynamic import errors
    include: ['thirdweb', 'viem'],
  },
  define: {
    // Some libraries still expect 'global' to be defined
    'global': 'globalThis',
  }
})