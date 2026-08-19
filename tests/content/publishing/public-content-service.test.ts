// H3B-2 — publicContent.ts fail-closed validation tests (T042).
// Directly exercises validateIndex/validateEntry through createPublicContentClient
// with a stubbed fetch, covering: extra fields, type boundaries, media rules,
// generationHash tampering, index/entry consistency.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { entryGenerationHash } from '../../../scripts/content/lib/canonical-hash.mjs'

// Import AFTER mocking fetch so useFetch() reads the stub.
function loadClient() {
  return import('@/services/content/publicContent')
}

const CDN = 'https://img.nightingalesilence.com/content/'
const UUID = '00000000-0000-4000-8000-000000000001'

function makeEntry(overrides = {}) {
  const entry = {
    schemaVersion: 'content.entry.v1',
    publicId: 1,
    title: 'Title',
    summary: null,
    tags: ['t1'],
    publishedAt: '2026-07-30T00:00:00+00:00',
    revision: 3,
    generationHash: '',
    document: {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body' }] }] },
    },
    media: [],
  }
  const merged = { ...entry, ...overrides }
  // re-hash only when the caller did NOT provide a generationHash override
  if (merged.generationHash === '') merged.generationHash = entryGenerationHash(merged)
  return merged
}

function makeIndex(overrides = {}) {
  const index = {
    schemaVersion: 'content.index.v1',
    entries: [
      {
        publicId: 1,
        title: 'Title',
        summary: null,
        tags: ['t1'],
        publishedAt: '2026-07-30T00:00:00+00:00',
        revision: 3,
      },
    ],
  }
  return { ...index, ...overrides }
}

function stubFetch(route: (url: string) => { status: number; body: unknown }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const r = route(url)
      return {
        ok: r.status >= 200 && r.status < 300,
        status: r.status,
        json: async () => r.body,
        text: async () => JSON.stringify(r.body),
      } as Response
    })
  )
}

describe('publicContent service validation (T042)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  async function fetchEntry(body: unknown) {
    stubFetch(() => ({ status: 200, body }))
    const mod = await loadClient()
    return mod.createPublicContentClient().fetchPublicEntry(1)
  }

  async function fetchIndex(body: unknown) {
    stubFetch(() => ({ status: 200, body }))
    const mod = await loadClient()
    return mod.createPublicContentClient().fetchPublicIndex()
  }

  it('accepts a valid index', async () => {
    const index = await fetchIndex(makeIndex())
    expect(index.entries).toHaveLength(1)
    expect(index.entries[0].publicId).toBe(1)
  })

  it('rejects index with extra fields', async () => {
    await expect(fetchIndex(makeIndex({ extra: 1 }))).rejects.toThrow(/unknown field/)
  })

  it('rejects index entry with extra fields', async () => {
    const index = makeIndex()
    index.entries[0].entryId = 'leak'
    await expect(fetchIndex(index)).rejects.toThrow(/unknown field/)
  })

  it('rejects index entry with wrong types (title, summary, tags, revision, publishedAt)', async () => {
    const cases = [
      { patch: (e: any) => { e.title = '' } },
      { patch: (e: any) => { e.title = 5 } },
      { patch: (e: any) => { e.summary = 5 } },
      { patch: (e: any) => { e.tags = 'not-array' } },
      { patch: (e: any) => { e.tags = [1, 2] } },
      { patch: (e: any) => { e.revision = 0 } },
      { patch: (e: any) => { e.revision = 1.5 } },
      { patch: (e: any) => { e.publishedAt = 'not-a-date' } },
      { patch: (e: any) => { e.publicId = -1 } },
    ]
    for (const { patch } of cases) {
      const index = makeIndex()
      patch(index.entries[0])
      await expect(fetchIndex(index), JSON.stringify(index.entries[0])).rejects.toThrow()
    }
  })

  it('rejects index entry with missing summary field', async () => {
    const index = makeIndex()
    delete index.entries[0].summary
    await expect(fetchIndex(index)).rejects.toThrow(/summary is required/)
  })

  it('rejects index entry with title over 120 chars', async () => {
    const index = makeIndex()
    index.entries[0].title = 'x'.repeat(121)
    await expect(fetchIndex(index)).rejects.toThrow(/120/)
  })

  it('accepts index entry with title exactly 120 chars', async () => {
    const index = makeIndex()
    index.entries[0].title = 'x'.repeat(120)
    await expect(fetchIndex(index)).resolves.toBeTruthy()
  })

  it('rejects index entry with summary over 300 chars', async () => {
    const index = makeIndex()
    index.entries[0].summary = 'x'.repeat(301)
    await expect(fetchIndex(index)).rejects.toThrow(/300/)
  })

  it('rejects index entry with more than 10 tags', async () => {
    const index = makeIndex()
    index.entries[0].tags = Array.from({ length: 11 }, (_, i) => `tag${i}`)
    await expect(fetchIndex(index)).rejects.toThrow(/10/)
  })

  it('rejects index entry with empty or over-long tag items', async () => {
    for (const tag of ['', 'x'.repeat(31)]) {
      const index = makeIndex()
      index.entries[0].tags = [tag]
      await expect(fetchIndex(index), JSON.stringify(tag)).rejects.toThrow(/1-30/)
    }
  })

  it('rejects index entry with loose or invalid date-time formats', async () => {
    const badDates = [
      '2026-07-30',            // date only
      '2026-07-30 00:00:00',   // space separator
      '2026-13-45T99:99:99Z',  // out of range
      '07/30/2026',            // US format
      '2026-07-30T00:00:00',   // missing timezone
      '',                      // empty
    ]
    for (const d of badDates) {
      const index = makeIndex()
      index.entries[0].publishedAt = d
      await expect(fetchIndex(index), JSON.stringify(d)).rejects.toThrow(/date-time/)
    }
  })

  it('accepts valid date-time with fraction and timezone offsets', async () => {
    for (const d of ['2026-07-30T00:00:00+00:00', '2026-07-30T08:30:00.123Z', '2026-07-30T08:30:00+08:00']) {
      const index = makeIndex()
      index.entries[0].publishedAt = d
      await expect(fetchIndex(index), JSON.stringify(d)).resolves.toBeTruthy()
    }
  })

  it('rejects duplicate publicId in index', async () => {
    const index = makeIndex()
    index.entries.push({ ...index.entries[0] })
    await expect(fetchIndex(index)).rejects.toThrow(/duplicate/)
  })

  it('accepts a valid entry with media', async () => {
    const entry = makeEntry({
      media: [{ mediaId: UUID, mediaType: 'image/png', publicUrl: `${CDN}${UUID}.png` }],
      document: {
        schemaVersion: 'content.document.v1',
        doc: {
          type: 'doc',
          content: [
            { type: 'image', attrs: { mediaId: UUID, src: `${CDN}${UUID}.png`, alt: '', align: 'center', displayWidth: 75 } },
          ],
        },
      },
    })
    const e = await fetchEntry(entry)
    expect(e.media[0].mediaId).toBe(UUID)
  })

  it('rejects entry with extra fields', async () => {
    await expect(fetchEntry(makeEntry({ entryId: 'leak' }))).rejects.toThrow(/unknown field/)
  })

  it('rejects entry with invalid generationHash format', async () => {
    await expect(fetchEntry(makeEntry({ generationHash: 'not-a-sha256' }))).rejects.toThrow(/generationHash/)
  })

  it('rejects entry whose generationHash does not match content (tampered title)', async () => {
    const entry = makeEntry()
    entry.title = 'Tampered' // hash now stale
    await expect(fetchEntry(entry)).rejects.toThrow(/tampered|does not match/)
  })

  it('rejects entry with tampered document but kept hash', async () => {
    const entry = makeEntry()
    entry.document.doc.content[0].content[0].text = 'Injected body'
    await expect(fetchEntry(entry)).rejects.toThrow(/tampered|does not match/)
  })

  it('rejects entry with tampered media but kept hash', async () => {
    const entry = makeEntry({ media: [{ mediaId: UUID, mediaType: 'image/png', publicUrl: `${CDN}x.png` }] })
    // fix hash, then tamper the URL AFTER hashing
    entry.generationHash = entryGenerationHash(entry)
    entry.media[0].publicUrl = 'http://evil.example/x.png'
    await expect(fetchEntry(entry)).rejects.toThrow(/tampered|does not match|stable|CDN/)
  })

  it('rejects entry media with invalid mediaId / mediaType / unstable URL', async () => {
    const cases = [
      { mediaId: 'not-a-uuid', mediaType: 'image/png', publicUrl: `${CDN}x.png` },
      { mediaId: UUID, mediaType: 42, publicUrl: `${CDN}x.png` },
      { mediaId: UUID, mediaType: 'image/png', publicUrl: 'http://insecure.example/x.png' },
      { mediaId: UUID, mediaType: 'image/png', publicUrl: `${CDN}x.png?X-Amz-Signature=abc` },
      { mediaId: UUID, mediaType: 'image/png', publicUrl: 'file:///etc/passwd' },
      { mediaId: UUID, mediaType: 'image/png', publicUrl: 'https://evil.example/x.png' },
    ]
    for (const media of cases) {
      const entry = makeEntry({ media: [media] })
      await expect(fetchEntry(entry), JSON.stringify(media)).rejects.toThrow(/mediaId|mediaType|stable|CDN/)
    }
  })

  it('rejects entry media with extra fields', async () => {
    const entry = makeEntry({
      media: [{ mediaId: UUID, mediaType: 'image/png', publicUrl: `${CDN}x.png`, byteSize: 999 }],
    })
    await expect(fetchEntry(entry)).rejects.toThrow(/unknown field/)
  })

  it('rejects entry document referencing an unknown mediaId', async () => {
    const entry = makeEntry({
      document: {
        schemaVersion: 'content.document.v1',
        doc: {
          type: 'doc',
          content: [
            { type: 'image', attrs: { mediaId: UUID, src: `${CDN}x.png`, alt: '', align: 'center', displayWidth: 75 } },
          ],
        },
      },
      // media array empty -> reference unresolved
    })
    await expect(fetchEntry(entry)).rejects.toThrow(/unknown mediaId/)
  })

  it('rejects entry publicId mismatch with requested id', async () => {
    await expect(fetchEntry(makeEntry({ publicId: 2 }))).rejects.toThrow(/does not match/)
  })

  it('classifies 404 as not-found and 500 as network', async () => {
    const mod = await loadClient()
    const { ApiError } = await import('@/composables/useFetch')
    const fakeResp = { status: 404, url: '/x', statusText: 'Not Found' } as Response
    const e404 = mod.describePublicContentError(new ApiError(fakeResp, 'nope'))
    expect(e404.kind).toBe('not-found')
    const fake500 = { status: 500, url: '/x', statusText: 'Error' } as Response
    const e500 = mod.describePublicContentError(new ApiError(fake500, 'boom'))
    expect(e500.kind).toBe('network')
  })
})
