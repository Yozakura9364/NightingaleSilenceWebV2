import { describe, expect, it } from 'vitest'
import {
  GLAMOUR_SNAPSHOT_API_BASE,
  createGlamourSnapshotUrl
} from '@/lib/glamour/snapshotLinks'
import { createV2SnapshotHashRoute } from '@/router/legacySnapshotRoute'

describe('NSGlamour snapshot links', () => {
  it('uses the canonical short domain and selected language', () => {
    expect(createGlamourSnapshotUrl('aB3dE5fG7h', 'en')).toBe(
      'https://nsffxiv.com/g/aB3dE5fG7h?lang=en'
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

  it('adapts the public entry to the V2 hash snapshot route', () => {
    expect(
      createV2SnapshotHashRoute({ pathname: '/g/aB3dE5fG7h', search: '?lang=zh-CN', hash: '' })
    ).toBe('#/ffxiv/glamour/equipinfo/aB3dE5fG7h?lang=zh-CN')
    expect(
      createV2SnapshotHashRoute({ pathname: '/g/aB3dE5fG7h/', search: '', hash: '' })
    ).toBe('#/ffxiv/glamour/equipinfo/aB3dE5fG7h')
    expect(
      createV2SnapshotHashRoute({ pathname: '/g/legacy-long-id', search: '', hash: '' })
    ).toBe('')
    expect(
      createV2SnapshotHashRoute({ pathname: '/g/aB3dE5fG_', search: '', hash: '' })
    ).toBe('')
    expect(
      createV2SnapshotHashRoute({
        pathname: '/g/aB3dE5fG7h',
        search: '?lang=en',
        hash: '#/ffxiv/glamour/equipinfo/aB3dE5fG7h'
      })
    ).toBe('')
  })
})
