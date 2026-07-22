// @ts-expect-error The Vite config runs in Node; this project intentionally omits @types/node.
import { existsSync, readdirSync, rmSync } from 'node:fs'
// @ts-expect-error The Vite config runs in Node; this project intentionally omits @types/node.
import { join, resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin, type ResolvedConfig } from 'vite'
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

function excludePublicArmoireDataPlugin(enabled: boolean): Plugin {
  let resolvedConfig: ResolvedConfig

  return {
    name: 'exclude-public-armoire-data',
    apply: 'build',
    configResolved(config) {
      resolvedConfig = config
    },
    closeBundle() {
      if (!enabled) {
        return
      }

      const dataDir = join(resolve(resolvedConfig.root, resolvedConfig.build.outDir), 'data')
      if (!existsSync(dataDir)) {
        return
      }

      for (const entry of readdirSync(dataDir)) {
        if (entry.startsWith('armoire-')) {
          rmSync(join(dataDir, entry), { recursive: true, force: true })
        }
      }
    }
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const isArmoireLocalBuild = mode === 'armoire-local'
  const enableDevelopmentRoutesByDefault = command === 'serve'
  const enableSilence = readBooleanEnv(env.VITE_ENABLE_SILENCE, enableDevelopmentRoutesByDefault)
  const enableInternalRoutes = readBooleanEnv(
    env.VITE_ENABLE_INTERNAL_ROUTES,
    enableDevelopmentRoutesByDefault
  )

  return {
    define: {
      'import.meta.env.VITE_NSARMOIRE_LOCAL_APP': JSON.stringify(String(isArmoireLocalBuild)),
      'import.meta.env.VITE_ENABLE_SILENCE': JSON.stringify(String(enableSilence)),
      'import.meta.env.VITE_ENABLE_INTERNAL_ROUTES': JSON.stringify(String(enableInternalRoutes)),
      'import.meta.env.VITE_LOCAL_ASSET_BASE': JSON.stringify(
        command === 'serve' ? '/local-assets' : ''
      )
    },
    plugins: [vue(), excludePublicArmoireDataPlugin(!isArmoireLocalBuild)],
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
  }
})
