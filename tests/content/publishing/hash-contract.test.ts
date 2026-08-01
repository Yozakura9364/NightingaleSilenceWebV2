// H3B-2 — generationHash contract parity test (T042/T038).
// Locks the browser-side canonical hash (src/lib/content/model/publicHash.ts)
// to the node-side generator/checker implementation
// (scripts/content/lib/canonical-hash.mjs): identical canonicalJson output and
// identical sha256 digest for the same entry object.
import { describe, it, expect } from 'vitest'
import { canonicalJson as nodeJson, sha256Hex as nodeSha, entryGenerationHash as nodeEntryHash } from '../../../scripts/content/lib/canonical-hash.mjs'
import {
  canonicalJson as browserJson,
  sha256Hex as browserSha,
  entryGenerationHash as browserEntryHash,
} from '@/lib/content/model/publicHash'

const SAMPLE = {
  schemaVersion: 'content.entry.v1',
  publicId: 42,
  title: '标题 mixed "quotes" & <angle>',
  summary: null,
  tags: ['a', '中文', 'z'],
  publishedAt: '2026-07-30T00:00:00+00:00',
  revision: 3,
  generationHash: 'x'.repeat(64),
  document: {
    schemaVersion: 'content.document.v1',
    doc: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '正文\n多行' }] },
        { type: 'image', attrs: { mediaId: '00000000-0000-4000-8000-000000000001', alt: '', align: 'center', displayWidth: 75 } },
        { type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableCell', attrs: { colspan: 2 }, content: [{ type: 'paragraph' }] }] }] },
      ],
    },
  },
  media: [{ mediaId: '00000000-0000-4000-8000-000000000001', mediaType: 'image/png', publicUrl: 'https://img.nightingalesilence.com/content/x.png' }],
}

describe('generationHash contract parity (browser vs node)', () => {
  it('canonicalJson output is byte-identical across implementations', () => {
    expect(browserJson(SAMPLE)).toBe(nodeJson(SAMPLE))
  })

  it('sha256 digest matches across implementations', async () => {
    const text = nodeJson(SAMPLE)
    expect(await browserSha(text)).toBe(nodeSha(text))
  })

  it('entryGenerationHash matches across implementations (entry minus generationHash)', async () => {
    expect(await browserEntryHash(SAMPLE)).toBe(nodeEntryHash(SAMPLE))
  })

  it('hash changes when any entry field changes (tamper detection)', async () => {
    const tampered = { ...SAMPLE, title: 'Tampered' }
    expect(await browserEntryHash(tampered)).not.toBe(await browserEntryHash(SAMPLE))
    const tamperedDoc = { ...SAMPLE, document: { ...SAMPLE.document, doc: { ...SAMPLE.document.doc, content: [] } } }
    expect(await browserEntryHash(tamperedDoc)).not.toBe(await browserEntryHash(SAMPLE))
  })
})
