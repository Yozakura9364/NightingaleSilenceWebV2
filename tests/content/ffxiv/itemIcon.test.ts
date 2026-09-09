import { describe, expect, it } from 'vitest'

import { getFfxivItemIconHr1Url, getFfxivItemIconUrl } from '@/lib/ffxiv/itemIcon'
import { buildGlamourIconUrl } from '@/lib/glamour/equipment'

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

  it('uses the glamour API proxy for glamour and item-card icon requests', () => {
    expect(buildGlamourIconUrl('/api/glamour', 41261)).toBe(
      '/api/glamour/icon/41261'
    )
    expect(buildGlamourIconUrl('/api/glamour', 246201)).toBe(
      '/api/glamour/icon/246201'
    )
    expect(buildGlamourIconUrl('/api/glamour', 57393)).toBe('/api/glamour/icon/57393')
  })

  it('canonicalizes known CDN and legacy proxy URLs to the API proxy', () => {
    const externalCdnUrl = 'https://img.nightingalesilence.com/ui/icon/042000/042585_hr1.png'
    expect(buildGlamourIconUrl('/api/glamour', externalCdnUrl)).toBe(
      '/api/glamour/icon/042585'
    )

    expect(buildGlamourIconUrl('https://www.nightingalesilence.com/api/glamour',
      'https://www.nightingalesilence.com/api/glamour/icon/42585')).toBe(
      'https://www.nightingalesilence.com/api/glamour/icon/42585'
    )
  })
})
