import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchItemCardEmotes } from '@/pages/item-card/lib/emotes'

describe('item card emote localization', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the requested locale as the candidate default name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          items: [
            {
              id: '313',
              name: '模特步',
              names: { zh: '模特步', en: 'Runway Walk' },
              icon: 246459
            }
          ]
        })
      }))
    )

    const [candidate] = await searchItemCardEmotes('模特步', 'en', 1)

    expect(candidate?.name).toBe('Runway Walk')
    expect(candidate?.names).toEqual({ zh: '模特步', en: 'Runway Walk' })
  })
})
