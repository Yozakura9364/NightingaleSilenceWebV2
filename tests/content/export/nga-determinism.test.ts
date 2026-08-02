// T049 — NGA BBCode determinism and safety tests.
// - byte-identical output for the same JSON (no object key order dependence)
// - loss ordering is deterministic
// - escaping is context-aware (text vs URL)
// - temporary/dangerous COS URLs are blocked
// - export never mutates the input document
import { describe, it, expect } from 'vitest'
import { serializeNgaBbcode } from '@/lib/content/export/nga/serializeNgaBbcode'
import { escapeNgaUrl } from '@/lib/content/export/nga/escaping'
import { isStableImageUrl } from '@/lib/content/export/nga/image'

const CDN = 'https://img.nightingalesilence.com/content/'

function makeDoc(content: unknown[]) {
  return {
    schemaVersion: 'content.document.v1',
    doc: { type: 'doc', content },
  }
}

describe('NGA determinism (T049)', () => {
  it('produces byte-identical output for equivalent documents (key order shuffled)', () => {
    const docA = makeDoc([
      {
        type: 'paragraph',
        content: [
          { text: 'hello', type: 'text', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' world' },
        ],
      },
      { type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'x' }] },
    ])
    const docB = makeDoc([
      {
        content: [{ marks: [{ type: 'bold' }], text: 'hello', type: 'text' }, { text: ' world', type: 'text' }],
        type: 'paragraph',
      },
      { content: [{ type: 'text', text: 'x' }], attrs: { language: 'ts' }, type: 'codeBlock' },
    ])
    const a = serializeNgaBbcode(docA)
    const b = serializeNgaBbcode(docB)
    expect(a.text).toBe(b.text)
    expect(a.losses).toEqual(b.losses)
  })

  it('repeated serialization is byte-identical', () => {
    const doc = makeDoc([
      { type: 'paragraph', content: [{ type: 'text', text: 'repeat me' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'H' }] },
    ])
    const first = serializeNgaBbcode(doc)
    const second = serializeNgaBbcode(doc)
    expect(second).toEqual(first)
    expect(second.text).toBe(first.text)
  })

  it('losses are sorted deterministically by nodePath then severity then code', () => {
    const doc = makeDoc([
      { type: 'image', attrs: { mediaId: '00000000-0000-4000-8000-000000000002', src: 'https://evil.example/x.png', alt: '', align: 'center', displayWidth: 75 } },
      { type: 'heading', attrs: { level: 2, textAlign: 'center' }, content: [{ type: 'text', text: 'H' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'p' }] },
    ])
    const r = serializeNgaBbcode(doc)
    const paths = r.losses.map((l) => l.nodePath.join('.'))
    const sorted = [...paths].sort()
    expect(paths).toEqual(sorted)
  })

  it('export never mutates the input document', () => {
    const doc = makeDoc([
      { type: 'paragraph', content: [{ type: 'text', text: 'x' }] },
      { type: 'image', attrs: { mediaId: '00000000-0000-4000-8000-000000000001', src: `${CDN}a.png`, alt: 'a', caption: 'cap', align: 'center', displayWidth: 75 } },
    ])
    const snapshot = JSON.stringify(doc)
    serializeNgaBbcode(doc)
    serializeNgaBbcode(doc)
    expect(JSON.stringify(doc)).toBe(snapshot)
  })

  it('escapeNgaUrl strips tag-breaking characters', () => {
    expect(escapeNgaUrl('https://x.com/a]b')).toBe('https://x.com/a%5Db')
    expect(escapeNgaUrl('https://x.com/a b')).toBe('https://x.com/a%20b')
  })

  it('isStableImageUrl rejects temporary/signed/foreign URLs', () => {
    expect(isStableImageUrl(`${CDN}ok.png`)).toBe(true)
    expect(isStableImageUrl(`${CDN}ok.png?X-Amz-Signature=abc`)).toBe(false)
    expect(isStableImageUrl('https://evil.example/x.png')).toBe(false)
    expect(isStableImageUrl('http://img.nightingalesilence.com/x.png')).toBe(false)
    expect(isStableImageUrl(null)).toBe(false)
    expect(isStableImageUrl(undefined)).toBe(false)
    expect(isStableImageUrl('data:image/png;base64,AAAA')).toBe(false)
  })

  it('temporary signed URL image yields BLOCKING loss and no [img]', () => {
    const doc = makeDoc([
      { type: 'image', attrs: { mediaId: '00000000-0000-4000-8000-000000000001', src: `${CDN}a.png?X-Amz-Signature=abc`, alt: '', align: 'center', displayWidth: 75 } },
    ])
    const r = serializeNgaBbcode(doc)
    expect(r.text).toBe('')
    expect(r.losses.some((l) => l.severity === 'BLOCKING' && l.code === 'unstable-image-url')).toBe(true)
  })

  it('mapping version is reported', () => {
    const r = serializeNgaBbcode(makeDoc([]))
    expect(r.mappingVersion).toBe('nga-v1')
  })
})
