// Vitest setup for content tests: provide the minimal browser globals that
// src/stores/locale.ts and src/composables/useFetch.ts touch in a node env.
import { vi } from 'vitest'

const store = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => { store.clear() },
  },
  configurable: true,
})

// minimal window/document not needed by these tests, but guard fetch-based ones
if (!('window' in globalThis)) {
  ;(globalThis as any).window = globalThis
}

// Web Crypto for src/lib/content/model/publicHash.ts (node 24 has crypto.subtle globally)
import { webcrypto } from 'node:crypto'
if (!('crypto' in globalThis)) {
  ;(globalThis as any).crypto = webcrypto
}

vi.mock('@/composables/useFetch', async () => {
  const actual = await vi.importActual<typeof import('@/composables/useFetch')>('@/composables/useFetch')
  return actual
})
