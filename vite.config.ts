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
    include: ['viem', 'wagmi', '@rainbow-me/rainbowkit'],
  },
  define: {
    // Some libraries still expect 'global' to be defined
    'global': 'globalThis',
  },
  build: {
    // Wallet stack (wagmi/viem/rainbowkit/metamask-sdk) legitimately ships
    // ~500KB chunks. Bumping the warning threshold so Vercel's build log
    // stops crying on every deploy for chunks we genuinely cannot shrink
    // without an architectural rewrite. Anything > 700KB is still flagged.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Stable vendor chunks for libraries that every initial page load
        // touches (react+router run on every route, mantine UI primitives
        // are used everywhere). Pinning these into their own files means a
        // code-only deploy doesn't bust their HTTP cache for returning
        // visitors. We deliberately do NOT manualChunks charts/recharts
        // (Coin-only — let auto-chunking bundle them with Coin's lazy
        // chunk so the module isn't pre-loaded on `/`) or wagmi/viem/
        // rainbowkit (deep interlinked exports — Rollup's auto-chunker
        // already produces good splits, manual splitting is risky).
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mantine': ['@mantine/core', '@mantine/hooks'],
        },
      },
    },
  },
})
