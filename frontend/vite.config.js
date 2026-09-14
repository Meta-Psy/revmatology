import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import adminChunkGuard from './vite-plugins/adminChunkGuard.js'

export default defineConfig({
  // adminChunkGuard роняет сборку, если код админки попал во вход или вход вышел из бюджета gzip
  plugins: [react(), tailwindcss(), adminChunkGuard()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
