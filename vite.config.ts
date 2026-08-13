// @ts-expect-error The Vite config runs in Node; this project intentionally omits @types/node.
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

declare const process: {
  env: Record<string, string | undefined>
  cwd(): string
}

const srcPath = decodeURIComponent(new URL('./src', import.meta.url).pathname).replace(
  /^\/([A-Za-z]:)/,
  '$1'
)
const plateExportApiToken =
  process.env.ICON_COMPOSER_API_TOKEN ?? process.env.NSPLATE_EXPORT_API_TOKEN ?? ''

function readBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') {
    return fallback
  }

  return value === 'true'
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const enableDevelopmentRoutesByDefault = command === 'serve'
  const enableSilence = readBooleanEnv(env.VITE_ENABLE_SILENCE, false)
  const enableInternalRoutes = readBooleanEnv(
    env.VITE_ENABLE_INTERNAL_ROUTES,
    enableDevelopmentRoutesByDefault
  )

  return {
    define: {
      'import.meta.env.VITE_ENABLE_SILENCE': JSON.stringify(String(enableSilence)),
      'import.meta.env.VITE_ENABLE_INTERNAL_ROUTES': JSON.stringify(String(enableInternalRoutes)),
      'import.meta.env.VITE_LOCAL_ASSET_BASE': JSON.stringify(
        command === 'serve' ? '/local-assets' : ''
      )
    },
    plugins: [vue()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router'],
            'vendor-pinia': ['pinia']
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': srcPath
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5175,
      strictPort: true,
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
          target: `http://localhost:${process.env.NSGLAMOUR_PROXY_PORT || '8766'}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/glamour(?=\/|$)/, '/api')
        },
        '/glamour/api': {
          target: process.env.NSGLAMOUR_SNAPSHOT_PROXY_TARGET || 'https://nsffxiv.com',
          changeOrigin: true
        },
        '/api/content-studio': {
          target: `http://127.0.0.1:${process.env.CONTENT_STUDIO_PORT || '8770'}`,
          changeOrigin: true
        },
        '/img': 'http://localhost:3456',
        '/img-preview': 'http://localhost:3456'
      }
    }
  }
})
