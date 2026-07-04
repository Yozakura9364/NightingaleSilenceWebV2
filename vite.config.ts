import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

declare const process: {
  env: Record<string, string | undefined>
}

const srcPath = decodeURIComponent(new URL('./src', import.meta.url).pathname).replace(
  /^\/([A-Za-z]:)/,
  '$1'
)
const plateExportApiToken =
  process.env.ICON_COMPOSER_API_TOKEN ?? process.env.NSPLATE_EXPORT_API_TOKEN ?? ''

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
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const requestUrl = String(req.url ?? '')

            if (
              plateExportApiToken &&
              (/^\/api\/plate\/export-/.test(requestUrl) || /^\/api\/export-/.test(requestUrl))
            ) {
              proxyReq.setHeader('x-icon-composer-token', plateExportApiToken)
            }
          })
        },
        rewrite: (path) => path.replace(/^\/api\/plate(?=\/|$)/, '/api')
      },
      '/api/glamour': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/glamour(?=\/|$)/, '/api')
      },
      '/api/armoire': {
        target: 'http://127.0.0.1:8015',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/armoire(?=\/|$)/, '')
      },
      '/img': 'http://localhost:3456',
      '/img-preview': 'http://localhost:3456'
    }
  }
})
