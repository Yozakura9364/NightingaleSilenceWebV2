import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FIXTURES = resolve(__dirname, '..', '..', 'fixtures', 'content', 'documents')

function loadFixture(name: string) {
  return JSON.parse(readFileSync(resolve(FIXTURES, name), 'utf-8'))
}

describe('Document Schema Validation', () => {
  let validateContentDocument: (input: unknown) => { valid: boolean; errors?: { path: string; message: string; code: string }[] }

  beforeAll(async () => {
    const mod = await import('@/lib/content/model/document-validator')
    validateContentDocument = mod.validateContentDocument
  })

  // Valid documents
  it('accepts a minimal valid document', () => {
    const doc = loadFixture('valid-minimal.json')
    const result = validateContentDocument(doc)
    expect(result.valid).toBe(true)
  })

  it('accepts a full valid document with all node types', () => {
    const doc = loadFixture('valid-full.json')
    const result = validateContentDocument(doc)
    expect(result.valid).toBe(true)
  })

  // Invalid: structural
  it('rejects a document missing schemaVersion', () => {
    const doc = loadFixture('invalid-missing-schema-version.json')
    const result = validateContentDocument(doc)
    expect(result.valid).toBe(false)
    expect(result.errors?.some(e => e.code === 'MISSING_SCHEMA_VERSION')).toBe(true)
  })

  it('rejects an unknown schema version', () => {
    const doc = loadFixture('invalid-unknown-version.json')
    const result = validateContentDocument(doc)
    expect(result.valid).toBe(false)
    expect(result.errors?.some(e => e.code === 'UNKNOWN_VERSION')).toBe(true)
  })

  it('rejects a document with an unknown node type', () => {
    const doc = loadFixture('invalid-unknown-node.json')
    const result = validateContentDocument(doc)
    expect(result.valid).toBe(false)
    expect(result.errors?.some(e => e.code === 'UNKNOWN_NODE')).toBe(true)
  })

  it('rejects a document with a dangerous javascript: link', () => {
    const doc = loadFixture('invalid-dangerous-link.json')
    const result = validateContentDocument(doc)
    expect(result.valid).toBe(false)
  })

  it('rejects non-object input', () => {
    expect(validateContentDocument(null as any).valid).toBe(false)
    expect(validateContentDocument('string' as any).valid).toBe(false)
    expect(validateContentDocument([] as any).valid).toBe(false)
  })

  // Additional schema validation: rejected cases
  it('rejects heading level 1', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Bad' }] }
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects image without mediaId', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'image', attrs: { alt: 'x', align: 'center', displayWidth: 100 } }
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects document with extra top-level field', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [{ type: 'paragraph' }] },
      extraField: 'no'
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects gallery with only one image', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'gallery', attrs: { layout: 'two-column' }, content: [
          { type: 'image', attrs: { mediaId: 'a1b2c3d4-e5f6-4789-ab01-cdef01234567', alt: 'x', align: 'left', displayWidth: 50 } }
        ]}
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })
  it('rejects listItem at document root', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'listItem', content: [{ type: 'paragraph' }] }
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects paragraph inside gallery', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'gallery', attrs: { layout: 'two-column' }, content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'nope' }] }
        ]}
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects paragraph inside table', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'table', content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'nope' }] }
        ]}
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects image without alt', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'image', attrs: { mediaId: 'a1b2c3d4-e5f6-4789-ab01-cdef01234567', align: 'center', displayWidth: 100 } }
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects image with null attrs', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [{ type: 'image', attrs: null }] }
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects image width that is not an integer', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'image', attrs: { mediaId: 'a1b2c3d4-e5f6-4789-ab01-cdef01234567', alt: 'x', align: 'center', displayWidth: 100, width: 1.5 } }
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects mark with extra properties', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'paragraph', content: [
          { type: 'text', text: 'x', marks: [{ type: 'bold', extra: true }] }
        ]}
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })
  it('accepts orderedList with start', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'orderedList', attrs: { start: 3 }, content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }] }
        ]}
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(true)
  })

  it('rejects blockquote containing listItem directly', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'blockquote', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }] }
        ]}
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects paragraph with attrs as array', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'paragraph', attrs: [] }
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects text with marks=null', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'paragraph', content: [
          { type: 'text', text: 'x', marks: null }
        ]}
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })

  it('rejects textStyle with attrs as array', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'paragraph', content: [
          { type: 'text', text: 'x', marks: [{ type: 'textStyle', attrs: [] }] }
        ]}
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })
  it('rejects codeBlock with marks on text', () => {
    const doc = {
      schemaVersion: 'content.document.v1',
      doc: { type: 'doc', content: [
        { type: 'codeBlock', content: [{ type: 'text', text: 'x', marks: [] }] }
      ]}
    }
    expect(validateContentDocument(doc).valid).toBe(false)
  })
})

describe('Canonical JSON', () => {
  it('produces stable output regardless of key order', async () => {
    const { toCanonicalJson } = await import('@/lib/content/model/canonical-json')
    const a = { schemaVersion: 'content.document.v1', doc: { type: 'doc', content: [{ type: 'paragraph' }] } } as any
    const b = { doc: { content: [{ type: 'paragraph' }], type: 'doc' }, schemaVersion: 'content.document.v1' } as any
    expect(toCanonicalJson(a)).toBe(toCanonicalJson(b))
  })

  it('produces identical hashes for equivalent documents', async () => {
    const { hashDocument } = await import('@/lib/content/model/canonical-json')
    const a = { schemaVersion: 'content.document.v1', doc: { type: 'doc', content: [] } } as any
    const b = { doc: { content: [], type: 'doc' }, schemaVersion: 'content.document.v1' } as any
    expect(await hashDocument(a)).toBe(await hashDocument(b))
  })
})

describe('Media URL', () => {
  it('rejects HTTP URLs', async () => {
    const { isAllowedImageHost } = await import('@/lib/content/model/media-url')
    expect(isAllowedImageHost('http://img.nightingalesilence.com/a.png')).toBe(false)
  })

  it('accepts HTTPS URLs on allowed host', async () => {
    const { isAllowedImageHost } = await import('@/lib/content/model/media-url')
    expect(isAllowedImageHost('https://img.nightingalesilence.com/a.png')).toBe(true)
  })

  it('rejects foreign hosts', async () => {
    const { isAllowedImageHost } = await import('@/lib/content/model/media-url')
    expect(isAllowedImageHost('https://evil.com/a.png')).toBe(false)
  })

  it('rejects COS signed URLs as non-permanent', async () => {
    const { isPermanentContentUrl } = await import('@/lib/content/model/media-url')
    expect(isPermanentContentUrl('https://img.nightingalesilence.com/a.png?X-Amz-Signature=abc')).toBe(false)
    expect(isPermanentContentUrl('https://img.nightingalesilence.com/a.png?token=abc')).toBe(false)
    expect(isPermanentContentUrl('https://img.nightingalesilence.com/a.png?sig=abc')).toBe(false)
    expect(isPermanentContentUrl('https://img.nightingalesilence.com/a.png?sign=abc')).toBe(false)
  })

  it('accepts clean permanent URLs', async () => {
    const { isPermanentContentUrl } = await import('@/lib/content/model/media-url')
    expect(isPermanentContentUrl('https://img.nightingalesilence.com/content/2026/abc.webp')).toBe(true)
  })

  it('rejects X-Amz-Security-Token', async () => {
    const { isPermanentContentUrl } = await import('@/lib/content/model/media-url')
    expect(isPermanentContentUrl('https://img.nightingalesilence.com/a.png?X-Amz-Security-Token=abc')).toBe(false)
  })

  it('rejects AWSAccessKeyId', async () => {
    const { isPermanentContentUrl } = await import('@/lib/content/model/media-url')
    expect(isPermanentContentUrl('https://img.nightingalesilence.com/a.png?AWSAccessKeyId=abc')).toBe(false)
  })

  it('normalizeContentUrl rejects signed URLs', async () => {
    const { normalizeContentUrl } = await import('@/lib/content/model/media-url')
    expect(normalizeContentUrl('https://img.nightingalesilence.com/a.png?X-Amz-Signature=abc')).toBeNull()
  })

  it('normalizeContentUrl strips query from clean URLs', async () => {
    const { normalizeContentUrl } = await import('@/lib/content/model/media-url')
    expect(normalizeContentUrl('https://img.nightingalesilence.com/a.png?v=2')).toBe('https://img.nightingalesilence.com/a.png')
  })

  it('rejects X-AMZ-SIGNATURE (uppercase)', async () => {
    const { isPermanentContentUrl } = await import('@/lib/content/model/media-url')
    expect(isPermanentContentUrl('https://img.nightingalesilence.com/a.png?X-AMZ-SIGNATURE=abc')).toBe(false)
  })

  it('rejects x-amz-content-sha256', async () => {
    const { isPermanentContentUrl } = await import('@/lib/content/model/media-url')
    expect(isPermanentContentUrl('https://img.nightingalesilence.com/a.png?x-amz-content-sha256=abc')).toBe(false)
  })

  it('rejects dangerous protocols', async () => {
    const { isDangerousProtocol } = await import('@/lib/content/model/media-url')
    expect(isDangerousProtocol('javascript:alert(1)')).toBe(true)
    expect(isDangerousProtocol('data:text/html,<script>')).toBe(true)
    expect(isDangerousProtocol('https://safe.com')).toBe(false)
  })
})

describe('Migration', () => {
  it('validates document when version matches', async () => {
    const { migrateDocument } = await import('@/lib/content/model/document-validator')
    const bad = { schemaVersion: 'content.document.v1', doc: { type: 'doc', content: [{ type: 'script' }] }, extra: true }
    expect(() => migrateDocument(bad, 'content.document.v1')).toThrow()
  })

  it('rejects unknown target versions', async () => {
    const { migrateDocument } = await import('@/lib/content/model/document-validator')
    expect(() => migrateDocument({ schemaVersion: 'content.document.v1' }, 'content.document.v99')).toThrow('No migration path')
  })
})

describe('Tree Walker', () => {
  it('collects all mediaIds from a document', async () => {
    const { collectMediaIds } = await import('@/lib/content/export/tree-walker')
    const doc = loadFixture('valid-full.json')
    const ids = collectMediaIds(doc.doc)
    expect(ids.length).toBe(3)
    expect(ids).toContain('a1b2c3d4-e5f6-4789-ab01-cdef01234567')
  })

  it('collects plain text from a document', async () => {
    const { collectPlainText } = await import('@/lib/content/export/tree-walker')
    const doc = loadFixture('valid-minimal.json')
    expect(collectPlainText(doc.doc)).toBe('Hello world')
  })
})
