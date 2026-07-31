// Roundtrip tests with canonical schema validation — T016 [US1]
import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { Editor } from '@tiptap/core'
import { getContentExtensions } from '@/lib/content/editor/extensions'
import { toCanonicalDocument } from '@/lib/content/editor/toCanonicalDocument'
import { resolve } from 'path'

const REPO_ROOT = resolve(__dirname, '../../..').replace(/\\/g, '/')

function findNodesByType(doc: any, nodeType: string): any[] {
  const results: any[] = []
  function walk(node: any) { if (node.type === nodeType) results.push(node); if (node.content) node.content.forEach(walk) }
  walk(doc); return results
}

function createEditor(docContent?: unknown) {
  return new Editor({ extensions: getContentExtensions(), content: docContent || undefined })
}

// toCanonicalDocument imported from shared production module
// function removed — use toCanonicalDocument directly
function _dummy() { return null }

function validatePython(doc: any, timeout = 5000) {
  const body = JSON.stringify({ schemaVersion: 'content.document.v1', doc })
  execSync(
    `python -c "import sys,json; sys.path.insert(0,'${REPO_ROOT}'); from server.content.schema import validate_document_body; d=json.loads(sys.stdin.read()); validate_document_body(d); print('OK')"`,
    { input: body, timeout, encoding: 'utf-8' }
  )
}

const SAMPLE_DOC = {
  type: 'doc', content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'test' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
    { type: 'paragraph', content: [
      { type: 'text', text: 'bold ', marks: [{ type: 'bold' }] },
      { type: 'text', text: 'italic', marks: [{ type: 'italic' }] }
    ]}
  ]
}

describe('Editor Roundtrip (T016)', () => {
  it('basic roundtrip passes canonical validator', () => {
    const editor = createEditor(SAMPLE_DOC)
    const canonical = toCanonicalDocument(editor.getJSON())
    validatePython(canonical)
    const editor2 = createEditor(canonical)
    expect(toCanonicalDocument(editor2.getJSON())).toEqual(canonical)
    editor.destroy(); editor2.destroy()
  })

  it('table with colspan preserves colspan after canonical', () => {
    const doc = {
      type: 'doc', content: [{ type: 'table', content: [
        { type: 'tableRow', content: [
          { type: 'tableHeader', attrs: { colspan: 2 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A+B' }] }] }
        ]},
        { type: 'tableRow', content: [
          { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '1' }] }] },
          { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '2' }] }] }
        ]}
      ]}]
    }
    const editor = createEditor(doc)
    const canonical = toCanonicalDocument(editor.getJSON())
    validatePython(canonical)
    const header = canonical.content[0].content[0].content[0]
    expect(header.attrs.colspan).toBe(2)
    editor.destroy()
  })

  it('image with align preserved (not mapped to textAlign)', () => {
    const uuid = 'a1b2c3d4-e5f6-4789-ab12-cd3456789012'
    const doc = { type: 'doc', content: [
      { type: 'image', attrs: { mediaId: uuid, alt: 'test', align: 'center', displayWidth: 75 } }
    ] }
    const editor = createEditor(doc)
    const canonical = toCanonicalDocument(editor.getJSON())
    const img = findNodesByType(canonical, 'image')
    expect(img.length).toBe(1)
    expect(img[0].attrs.mediaId).toBe(uuid)
    expect(img[0].attrs.align).toBe('center')
    validatePython(canonical)
    editor.destroy()
  })

  it('gallery with images passes validator', () => {
    const doc = { type: 'doc', content: [{ type: 'gallery', attrs: { layout: 'two-column' }, content: [
      { type: 'image', attrs: { mediaId: 'a1b2c3d4-e5f6-4789-ab12-cd3456789012', alt: 'img1', align: 'center', displayWidth: 50 } },
      { type: 'image', attrs: { mediaId: 'b2c3d4e5-f6a7-4890-bc23-de4567890123', alt: 'img2', align: 'center', displayWidth: 50 } }
    ]}] }
    const editor = createEditor(doc)
    validatePython(toCanonicalDocument(editor.getJSON()))
    editor.destroy()
  })

  it('collapse node passes validator', () => {
    const doc = { type: 'doc', content: [{ type: 'collapse', attrs: { title: 'test' }, content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'body' }] }
    ]}] }
    const editor = createEditor(doc)
    validatePython(toCanonicalDocument(editor.getJSON()))
    editor.destroy()
  })

  it('20x20 table with colwidth preserved', () => {
    const mk = (h: boolean) => (i: number) => ({
      type: h ? 'tableHeader' : 'tableCell',
      attrs: { colwidth: [50] },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: `${i+1}` }] }]
    })
    const rows = [Array.from({length:20}, mk(true)), ...Array.from({length:19}, () => Array.from({length:20}, mk(false)))]
    const doc = { type: 'doc', content: [{ type: 'table', content: rows.map(r => ({ type: 'tableRow', content: r })) }] }
    const editor = createEditor(doc)
    const canonical = toCanonicalDocument(editor.getJSON())
    validatePython(canonical, 15000)
    expect(canonical.content[0].content[0].content[0].attrs.colwidth).toBeDefined()
    editor.destroy()
  })

  it('50000 char passes validator', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A'.repeat(50000) }] }] }
    const editor = createEditor(doc)
    validatePython(toCanonicalDocument(editor.getJSON()))
    editor.destroy()
  })

  it('figure not registered', () => {
    const editor = createEditor({ type: 'doc', content: [] })
    expect(editor.schema.nodes['figure']).toBeUndefined()
    editor.destroy()
  })

  it('table cell align maps to textAlign', () => {
    const doc = {
      type: 'doc', content: [{ type: 'table', content: [
        { type: 'tableRow', content: [
          { type: 'tableHeader', attrs: { align: 'center' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'X' }] }] }
        ]}
      ]}]
    }
    const editor = createEditor(doc)
    const canonical = toCanonicalDocument(editor.getJSON())
    const cell = canonical.content[0].content[0].content[0]
    expect(cell.attrs.align).toBeUndefined()
    expect(cell.attrs.textAlign).toBe('center')
    editor.destroy()
  })
})
