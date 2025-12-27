import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Конфигурация для Tauri ветки (без PWA и GitHub Pages настроек)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      '/img-proxy': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/img-proxy/, ''),
      }
    }
  }
})
