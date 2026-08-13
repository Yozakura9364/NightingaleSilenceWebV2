import { describe, expect, it } from 'vitest'

import { getFfxivItemIconHr1Url, getFfxivItemIconUrl } from '@/lib/ffxiv/itemIcon'
import { buildGlamourIconUrl as buildWorkspaceGlamourIconUrl } from '@/lib/glamour/equipment'
import { buildGlamourIconUrl } from '@/pages/item-card/lib/equipment'

describe('getFfxivItemIconUrl', () => {
  it('uses HD files for item icon segments that provide them', () => {
    expect(getFfxivItemIconUrl(41261)).toBe(
      'https://img.nightingalesilence.com/ui/icon/041000/041261_hd.png'
    )
  })

  it('keeps HR1 files for icon segments without HD coverage', () => {
    expect(getFfxivItemIconUrl(65025)).toBe(
      'https://img.nightingalesilence.com/ui/icon/065000/065025_hr1.png'
    )
  })

  it('builds an explicit HR1 fallback for HD item icons', () => {
    expect(getFfxivItemIconHr1Url(41261)).toBe(
      'https://img.nightingalesilence.com/ui/icon/041000/041261_hr1.png'
    )
  })

  it('returns an empty URL for missing or invalid ids', () => {
    expect(getFfxivItemIconUrl(undefined)).toBe('')
    expect(getFfxivItemIconUrl(0)).toBe('')
    expect(getFfxivItemIconUrl(Number.NaN)).toBe('')
    expect(getFfxivItemIconHr1Url(Number.POSITIVE_INFINITY)).toBe('')
  })

  it('uses the public CDN for item-card icon requests', () => {
    expect(buildGlamourIconUrl('/api/glamour', 41261)).toBe(
      'https://img.nightingalesilence.com/ui/icon/041000/041261_hd.png'
    )
    expect(buildGlamourIconUrl('/api/glamour', 246201)).toBe(
      'https://img.nightingalesilence.com/ui/icon/246000/246201_hr1.png'
    )
  })

  it('normalizes legacy CDN and API proxy URLs through both glamour entry points', () => {
    const expected = 'https://img.nightingalesilence.com/ui/icon/042000/042585_hd.png'
    const legacyUrls = [
      'https://img.nightingalesilence.com/ui/icon/042000/042585_hr1.png',
      'https://www.nightingalesilence.com/api/glamour/icon/42585'
    ]

    for (const icon of legacyUrls) {
      expect(buildGlamourIconUrl('/api/glamour', icon)).toBe(expected)
      expect(buildWorkspaceGlamourIconUrl('/api/glamour', icon)).toBe(expected)
    }
  })
})
