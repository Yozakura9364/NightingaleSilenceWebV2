import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const srcPath = decodeURIComponent(new URL('./src', import.meta.url).pathname)
  .replace(/^\/([A-Za-z]:)/, '$1')

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': srcPath
    }
  },
  server: {
    proxy: {
      '/api/plate': {
        target: 'http://localhost:3456',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/plate(?=\/|$)/, '/api')
      },
      '/api/glamour': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/glamour(?=\/|$)/, '/api')
      },
      '/img':         'http://localhost:3456',
      '/img-preview': 'http://localhost:3456',
    }
  }
})
