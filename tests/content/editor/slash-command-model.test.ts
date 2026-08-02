// slash-command-model.test.ts — P2-1 slash command model (pure, headless).
// Custom nodes (collapse/gallery) get explicit JSON-structure assertions.
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { getContentExtensions } from '@/lib/content/editor/extensions'
import { filterSlashItems } from '@/pages/content-studio/editor/slashCommandModel'

function makeStudioEditor(content?: object) {
  return new Editor({
    extensions: getContentExtensions(),
    content: content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
  })
}
const RANGE = { from: 1, to: 2 } // 覆盖 "/"

describe('slash command model (P2-1)', () => {
  it('空 query 返回全部 12 项', () => {
    expect(filterSlashItems('')).toHaveLength(12)
  })

  it('按 id/关键词过滤：tab 与 表 都命中 table', () => {
    expect(filterSlashItems('tab').map((i) => i.id)).toContain('table')
    expect(filterSlashItems('表').map((i) => i.id)).toContain('table')
    expect(filterSlashItems('折叠').map((i) => i.id)).toContain('collapse')
    expect(filterSlashItems('xyz-不可能命中')).toHaveLength(0)
  })

  it('slash 插入 heading2 产出合法结构', () => {
    const editor = makeStudioEditor()
    filterSlashItems('').find((i) => i.id === 'heading2')!.run(editor, RANGE)
    const doc = editor.getJSON()
    expect(doc.content?.[0]?.type).toBe('heading')
    expect(doc.content?.[0]?.attrs?.level).toBe(2)
    editor.destroy()
  })

  it('slash 插入 table 产出合法结构（3 列带表头）', () => {
    const editor = makeStudioEditor()
    filterSlashItems('').find((i) => i.id === 'table')!.run(editor, RANGE)
    const doc = editor.getJSON()
    expect(doc.content?.[0]?.type).toBe('table')
    expect(doc.content?.[0]?.content?.[0]?.content).toHaveLength(3)
    expect(doc.content?.[0]?.content?.[0]?.content?.[0]?.type).toBe('tableHeader')
    editor.destroy()
  })

  it('slash 插入 collapse 产出合法结构', () => {
    const editor = makeStudioEditor()
    filterSlashItems('').find((i) => i.id === 'collapse')!.run(editor, RANGE)
    const doc = editor.getJSON()
    expect(doc.content?.[0]?.type).toBe('collapse')
    expect(typeof doc.content?.[0]?.attrs?.title).toBe('string')
    expect(doc.content?.[0]?.content?.[0]?.type).toBe('paragraph')
    editor.destroy()
  })

  it('slash 插入 gallery 产出合法结构（schema 要求 2-20 图）', () => {
    const editor = makeStudioEditor()
    filterSlashItems('').find((i) => i.id === 'gallery')!.run(editor, RANGE)
    const doc = editor.getJSON()
    expect(doc.content?.[0]?.type).toBe('gallery')
    expect(typeof doc.content?.[0]?.attrs?.layout).toBe('string')
    expect(doc.content?.[0]?.content).toHaveLength(2)
    editor.destroy()
  })

  it('image/gallery 项标注 opensDialog（视图层拦截打开媒体对话框）', () => {
    const items = filterSlashItems('')
    expect(items.find((i) => i.id === 'image')?.opensDialog).toBe(true)
    expect(items.find((i) => i.id === 'gallery')?.opensDialog).toBe(true)
    expect(items.find((i) => i.id === 'paragraph')?.opensDialog ?? false).toBe(false)
  })
})
