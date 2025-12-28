import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Конфигурация для Tauri ветки
// Используем IP адрес локальной сети для возможности подключения из Tauri
export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.1.12', // Слушаем на IP локальной сети для Tauri
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://192.168.1.12:8082',
        changeOrigin: true,
        secure: false,
      },
      '/img-proxy': {
        target: 'http://192.168.1.12:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/img-proxy/, ''),
      }
    }
  }
})
