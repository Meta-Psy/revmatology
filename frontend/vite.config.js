import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import adminChunkGuard from './vite-plugins/adminChunkGuard.js'

export default defineConfig({
  // adminChunkGuard роняет сборку, если во вход попал код админки, публичная страница
  // кроме главной или просмотр PDF, либо вход вышел из бюджета gzip
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
