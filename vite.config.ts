import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // Dev-прокси для обхода CORS при обращении к API ТрансКонтейнера.
      // Запросы вида /trcont-api/... уходят на https://isales.trcont.com/api/...
      '/trcont-api': {
        target: 'https://isales.trcont.com',
        changeOrigin: true,
        // У сервера неполная цепочка TLS-сертификатов — отключаем проверку для dev-прокси.
        secure: false,
        rewrite: (path) => path.replace(/^\/trcont-api/, '/api'),
      },
    },
  },
})
