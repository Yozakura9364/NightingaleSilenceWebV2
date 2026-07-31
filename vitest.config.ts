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
    environment: 'node'
  }
})
