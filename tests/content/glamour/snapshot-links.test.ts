import { describe, expect, it } from 'vitest'
import {
  GLAMOUR_SNAPSHOT_API_BASE,
  createGlamourSnapshotUrl
} from '@/lib/glamour/snapshotLinks'

describe('NSGlamour snapshot links', () => {
  it('uses the canonical short domain and selected language', () => {
    expect(createGlamourSnapshotUrl('cH5JUKPBrrpiNSqRde8_-6To', 'en')).toBe(
      'https://nsffxiv.com/g/cH5JUKPBrrpiNSqRde8_-6To?lang=en'
    )
    expect(createGlamourSnapshotUrl('snapshot-id', 'zh')).toBe(
      'https://nsffxiv.com/g/snapshot-id?lang=zh-CN'
    )
    expect(createGlamourSnapshotUrl('snapshot-id', 'tc')).toBe(
      'https://nsffxiv.com/g/snapshot-id?lang=zh-TW'
    )
  })

  it('shares the persistent legacy snapshot API', () => {
    expect(GLAMOUR_SNAPSHOT_API_BASE).toBe('/glamour/api')
  })
})
