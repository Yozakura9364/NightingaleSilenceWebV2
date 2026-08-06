import { describe, expect, it } from 'vitest'

import { getFfxivItemIconUrl } from '@/lib/ffxiv/itemIcon'
import { buildGlamourIconUrl } from '@/pages/item-card/lib/equipment'

describe('getFfxivItemIconUrl', () => {
  it('builds the high-resolution CDN path from an icon id', () => {
    expect(getFfxivItemIconUrl(65025)).toBe(
      'https://img.nightingalesilence.com/ui/icon/065000/065025_hr1.png'
    )
  })

  it('returns an empty URL for missing or invalid ids', () => {
    expect(getFfxivItemIconUrl(undefined)).toBe('')
    expect(getFfxivItemIconUrl(0)).toBe('')
  })

  it('uses the public CDN for item-card icon requests', () => {
    expect(buildGlamourIconUrl('/api/glamour', 246201)).toBe(
      'https://img.nightingalesilence.com/ui/icon/246000/246201_hr1.png'
    )
  })
})
