import inject from '@rollup/plugin-inject'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), {...inject({Buffer: ['buffer/', 'Buffer']}), enforce: 'post'}],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})
