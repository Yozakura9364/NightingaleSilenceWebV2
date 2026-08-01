import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    include: ['tests/content/**/*.test.ts', 'tests/content/**/*.spec.mjs'],
    environment: 'node',
    setupFiles: ['tests/content/setup.ts'],
    env: {
      // Strip Hermes-gateway-injected venv paths so child `python` (3.8) imports its own site-packages
      PYTHONPATH: ''
    }
  }
})
