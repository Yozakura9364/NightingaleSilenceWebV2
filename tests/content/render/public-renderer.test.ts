// T034 — public renderer tests: node/mark allowlist, dangerous links,
// unknown nodes, extra attributes, unresolved media and long text fail-closed.
// The render core is pure functions (node environment); Vue components are
// asserted at source level (no v-html / no arbitrary HTML / no Tiptap).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateLink } from '@/lib/content/render/linkPolicy'
import { buildContentViewModel, RenderValidationError } from '@/lib/content/render/contentViewModel'
import { renderMark } from '@/lib/content/render/markRenderer'

const UUID1 = '00000000-0000-4000-8000-000000000001'
const UUID2 = '00000000-0000-4000-8000-000000000002'
const CDN = 'https://img.nightingalesilence.com/content/'

function text(text: string, marks: unknown[] = []) {
  return { type: 'text', text, ...(marks.length ? { marks } : {}) }
}
function para(children: unknown[] = [text('p')]) {
  return { type: 'paragraph', content: children }
}
function img(mediaId = UUID1, src = `${CDN}${mediaId}.png`) {
  return { type: 'image', attrs: { mediaId, src, alt: 'alt', align: 'center', displayWidth: 75 } }
}
function makeDoc(content: unknown[]): any {
  return { schemaVersion: 'content.document.v1', doc: { type: 'doc', content } }
}
function resolveMedia(mediaId: string): string | null {
  return `${CDN}${mediaId}.png`
}

describe('linkPolicy (T040)', () => {
  it('accepts https, mailto, relative and anchor hrefs', () => {
    for (const href of ['https://example.com/a', 'mailto:a@b.com', '/relative/path', '#anchor']) {
      expect(evaluateLink(href, {}).ok, href).toBe(true)
    }
  })

  it('rejects dangerous protocols fail-closed', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,<script>x</script>', 'vbscript:msgbox(1)']) {
      const r = evaluateLink(href, {})
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.reason).toMatch(/dangerous|unsafe/i)
    }
  })

  it('rejects unsafe prefixes, long hrefs and invalid target/rel', () => {
    expect(evaluateLink('file:///etc/passwd', {}).ok).toBe(false)
    expect(evaluateLink(`https://x.com/${'a'.repeat(2100)}`, {}).ok).toBe(false)
    expect(evaluateLink('https://x.com', { target: '_self' }).ok).toBe(false)
    expect(evaluateLink('https://x.com', { rel: 'nofollow' }).ok).toBe(false)
  })

  it('allows null target/rel and normalizes output', () => {
    const r = evaluateLink('https://x.com/a', { target: null, rel: null })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.href).toBe('https://x.com/a')
      expect(r.target).toBeNull()
      expect(r.rel).toBeNull()
    }
  })
})

describe('contentViewModel (T040)', () => {
  it('builds a safe view model for every known node type', () => {
    const doc = makeDoc([
      { type: 'heading', attrs: { level: 2, textAlign: 'center' }, content: [text('H', [{ type: 'bold' }])] },
      para([text('link ', []), text('L', [{ type: 'link', attrs: { href: 'https://x.com', target: '_blank', rel: 'noopener noreferrer nofollow' } }])]),
      { type: 'blockquote', content: [para()] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [para()] }] },
      { type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [para()] }] },
      { type: 'codeBlock', attrs: { language: 'ts' }, content: [text('const x = 1')] },
      { type: 'horizontalRule' },
      {
        type: 'table',
        content: [
          { type: 'tableRow', content: [{ type: 'tableHeader', attrs: { colspan: 2 }, content: [para([text('H')])] }] },
          { type: 'tableRow', content: [{ type: 'tableCell', attrs: { colwidth: [100] }, content: [para([text('A')])] }] },
        ],
      },
      img(),
      { type: 'gallery', attrs: { layout: 'grid' }, content: [img(UUID1), img(UUID2)] },
      { type: 'collapse', attrs: { title: 'More' }, content: [para([text('hidden')])] },
      para([text('a'), { type: 'hardBreak' }, text('b')]),
    ])
    const vm = buildContentViewModel(doc, { mediaResolver: resolveMedia })
    expect(vm.blocks).toHaveLength(12)
    const table = vm.blocks[7]
    expect(table.kind).toBe('table')
    if (table.kind === 'table') {
      expect(table.rows).toHaveLength(2)
      expect(table.rows[0].cells[0].kind).toBe('header')
      expect(table.rows[0].cells[0].colspan).toBe(2)
    }
    const gallery = vm.blocks[9]
    expect(gallery.kind).toBe('gallery')
    if (gallery.kind === 'gallery') {
      expect(gallery.layout).toBe('grid')
      expect(gallery.images).toHaveLength(2)
    }
    const collapse = vm.blocks[10]
    expect(collapse.kind).toBe('collapse')
    if (collapse.kind === 'collapse') expect(collapse.title).toBe('More')
  })

  it('rejects unknown nodes fail-closed', () => {
    const doc = makeDoc([{ type: 'mysteryNode', content: [] }])
    expect(() => buildContentViewModel(doc, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('rejects unknown marks fail-closed', () => {
    const doc = makeDoc([para([text('x', [{ type: 'glow' }])])])
    expect(() => buildContentViewModel(doc, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('rejects extra node attributes fail-closed', () => {
    const doc = makeDoc([{ type: 'paragraph', bogus: true, content: [] }])
    expect(() => buildContentViewModel(doc, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('rejects unknown attrs on known nodes fail-closed', () => {
    const doc = makeDoc([img(UUID1, `${CDN}x.png`)])
    doc.doc.content[0].attrs.unknown = 1
    expect(() => buildContentViewModel(doc, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('rejects unresolved media fail-closed (resolver miss and media:// src)', () => {
    const docA = makeDoc([img('missing-id')])
    expect(() => buildContentViewModel(docA, { mediaResolver: () => null })).toThrow(RenderValidationError)
    const docB = makeDoc([{ ...img(UUID1, 'media://m1'), attrs: { ...img(UUID1, 'media://m1').attrs } }])
    expect(() => buildContentViewModel(docB, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('rejects dangerous links inside documents fail-closed', () => {
    const doc = makeDoc([para([text('x', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }])])])
    expect(() => buildContentViewModel(doc, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('rejects over-long text fail-closed', () => {
    const doc = makeDoc([para([text('x'.repeat(500001))])])
    expect(() => buildContentViewModel(doc, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('rejects documents exceeding max depth', () => {
    let inner: any = para()
    for (let i = 0; i < 55; i++) inner = { type: 'blockquote', content: [inner] }
    const doc = makeDoc([inner])
    expect(() => buildContentViewModel(doc, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('enforces content array bounds (minItems/maxItems)', () => {
    const cases: Array<{ name: string; content: any[] }> = [
      { name: 'empty gallery', content: [{ type: 'gallery', attrs: { layout: 'grid' }, content: [] }] },
      { name: 'single-image gallery', content: [{ type: 'gallery', attrs: { layout: 'grid' }, content: [img()] }] },
      { name: 'empty bulletList', content: [{ type: 'bulletList', content: [] }] },
      { name: 'empty table', content: [{ type: 'table', content: [] }] },
      { name: 'empty blockquote', content: [{ type: 'blockquote', content: [] }] },
      { name: 'paragraph over 2000 inlines', content: [{ type: 'paragraph', content: Array.from({ length: 2001 }, () => text('x')) }] },
      { name: 'heading empty content', content: [{ type: 'heading', attrs: { level: 2 }, content: [] }] },
    ]
    for (const c of cases) {
      const doc = makeDoc(c.content)
      expect(() => buildContentViewModel(doc, { mediaResolver: resolveMedia }), c.name).toThrow(RenderValidationError)
    }
    // legal boundary: gallery with exactly 2 images passes
    const ok = makeDoc([{ type: 'gallery', attrs: { layout: 'grid' }, content: [img(UUID1), img(UUID2)] }])
    expect(() => buildContentViewModel(ok, { mediaResolver: resolveMedia })).not.toThrow()
  })

  it('rejects marks on codeBlock text and marks: null on text nodes', () => {
    const docA = makeDoc([{ type: 'codeBlock', content: [{ type: 'text', text: 'x', marks: [{ type: 'bold' }] }] }])
    expect(() => buildContentViewModel(docA, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
    const docB = makeDoc([para([text('x')])])
    ;(docB.doc.content[0].content[0] as any).marks = null
    expect(() => buildContentViewModel(docB, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('rejects media URLs with any query parameter (stable URL contract)', () => {
    const docA = makeDoc([img(UUID1, `${CDN}${UUID1}.png?foo=bar`)])
    expect(() => buildContentViewModel(docA, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
    const docB = makeDoc([{ type: 'gallery', attrs: { layout: 'grid' }, content: [img(UUID1, `${CDN}${UUID1}.png?v=2`), img(UUID2)] }])
    expect(() => buildContentViewModel(docB, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('rejects mediaId/src mismatch (standalone and gallery)', () => {
    const docA = makeDoc([img(UUID1, `${CDN}${UUID2}.png`)])
    expect(() => buildContentViewModel(docA, { mediaResolver: resolveMedia })).toThrow(/MEDIA_MISMATCH|RenderValidationError/)
    const docB = makeDoc([{ type: 'gallery', attrs: { layout: 'grid' }, content: [img(UUID1, `${CDN}${UUID2}.png`), img(UUID2)] }])
    expect(() => buildContentViewModel(docB, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('preserves gallery image display attrs (caption/align/displayWidth)', () => {
    const g1 = img(UUID1)
    g1.attrs.caption = 'First'
    g1.attrs.align = 'left'
    g1.attrs.displayWidth = 50
    const doc = makeDoc([{ type: 'gallery', attrs: { layout: 'two-column' }, content: [g1, img(UUID2)] }])
    const vm = buildContentViewModel(doc, { mediaResolver: resolveMedia })
    const gallery = vm.blocks[0]
    expect(gallery.kind).toBe('gallery')
    if (gallery.kind === 'gallery') {
      expect(gallery.layout).toBe('two-column')
      expect(gallery.images[0]).toMatchObject({ mediaId: UUID1, caption: 'First', align: 'left', displayWidth: 50 })
      expect(gallery.images[1]).toMatchObject({ mediaId: UUID2, caption: null, align: 'center', displayWidth: 75 })
    }
  })

  it('rejects empty query-string media URLs (stable URL contract parity with generator)', () => {
    const doc = makeDoc([img(UUID1, `${CDN}${UUID1}.png?`)])
    expect(() => buildContentViewModel(doc, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
  })

  it('enforces an independent total node count cap', () => {
    // 5000 paragraphs each with 1 text = 1 (doc) + 5000*2 = 10001 nodes > MAX_NODES
    const content: any[] = []
    for (let i = 0; i < 5000; i++) content.push(para([text('x')]))
    const doc = makeDoc(content)
    expect(() => buildContentViewModel(doc, { mediaResolver: resolveMedia })).toThrow(RenderValidationError)
    // 4999 paragraphs -> 1 + 4999*2 = 9999 nodes passes
    const okContent: any[] = []
    for (let i = 0; i < 4999; i++) okContent.push(para([text('x')]))
    expect(() => buildContentViewModel(makeDoc(okContent), { mediaResolver: resolveMedia })).not.toThrow()
  })

  it('resolves image src through the resolver and normalizes URLs', () => {
    const doc = makeDoc([img(UUID1)])
    const vm = buildContentViewModel(doc, { mediaResolver: resolveMedia })
    const image = vm.blocks[0]
    expect(image.kind).toBe('image')
    if (image.kind === 'image') {
      expect(image.src).toBe(`${CDN}${UUID1}.png`)
      expect(image.alt).toBe('alt')
      expect(image.displayWidth).toBe(75)
    }
  })
})

describe('markRenderer (T040)', () => {
  it('maps simple marks to tags', () => {
    expect(renderMark({ kind: 'bold' })).toMatchObject({ tag: 'strong' })
    expect(renderMark({ kind: 'italic' })).toMatchObject({ tag: 'em' })
    expect(renderMark({ kind: 'underline' })).toMatchObject({ tag: 'u' })
    expect(renderMark({ kind: 'strike' })).toMatchObject({ tag: 's' })
    expect(renderMark({ kind: 'code' })).toMatchObject({ tag: 'code' })
  })

  it('maps textStyle color/sizePercent to inline style', () => {
    const r = renderMark({ kind: 'textStyle', color: '#ff0000', sizePercent: 125 })
    expect(r.tag).toBe('span')
    expect(r.style).toMatchObject({ color: '#ff0000', fontSize: '125%' })
  })

  it('maps link mark to anchor with sanitized attrs', () => {
    const r = renderMark({ kind: 'link', href: 'https://x.com/a', target: '_blank', rel: 'noopener noreferrer nofollow' })
    expect(r.tag).toBe('a')
    expect(r.attrs).toMatchObject({ href: 'https://x.com/a', target: '_blank', rel: 'noopener noreferrer nofollow' })
  })

  it('throws on unknown mark kind', () => {
    expect(() => renderMark({ kind: 'glow' } as any)).toThrow()
  })
})

describe('public renderer components (T041) — no v-html / no Tiptap', () => {
  const components = [
    'src/pages/content/components/ContentRichText.vue',
    'src/pages/content/components/ContentTable.vue',
    'src/pages/content/components/ContentGallery.vue',
    'src/pages/content/components/ContentFigure.vue',
    'src/pages/content/components/ContentCollapse.vue',
  ]
  const here = dirname(fileURLToPath(import.meta.url))
  const root = resolve(here, '../../..')

  for (const rel of components) {
    it(`${rel} contains no v-html / innerHTML / Tiptap import`, () => {
      const src = readFileSync(resolve(root, rel), 'utf8')
      expect(src).not.toMatch(/v-html\s*=/)
      expect(src).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML/i)
      expect(src).not.toMatch(/dangerouslySetInnerHTML/i)
      expect(src).not.toMatch(/@tiptap|prosemirror/i)
    })
  }
})
