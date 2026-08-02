// textstyle-size.test.ts — sizePercent attribute carrier on TextStyle (P1-2, plan 附注④).
// The canonical model allows sizePercent 75|100|125|150|200 on textStyle marks,
// but the editor had no attribute carrier for it until the extension in
// src/lib/content/editor/extensions.ts.
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import { getContentExtensions } from '@/lib/content/editor/extensions'

function makeEditor() {
  return new Editor({
    extensions: getContentExtensions(),
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'size me' }] }] },
  })
}

function textStyleMark(editor: Editor) {
  const json = editor.getJSON()
  const marks = (json.content?.[0]?.content?.[0] as { marks?: { type: string; attrs?: Record<string, unknown> }[] })?.marks ?? []
  return marks.find((m) => m.type === 'textStyle')
}

describe('textStyle sizePercent extension (P1-2)', () => {
  it('setMark writes sizePercent into JSON; clearing resets to null', () => {
    const editor = makeEditor()
    editor.commands.setTextSelection({ from: 1, to: 8 })
    editor.chain().setMark('textStyle', { sizePercent: 150 }).run()
    expect(textStyleMark(editor)?.attrs?.sizePercent).toBe(150)
    editor.chain().setMark('textStyle', { sizePercent: null }).run()
    expect(textStyleMark(editor)?.attrs?.sizePercent ?? null).toBeNull()
    editor.destroy()
  })

  it('color and sizePercent coexist on the same mark', () => {
    const editor = makeEditor()
    editor.commands.setTextSelection({ from: 1, to: 8 })
    editor.chain().setColor('#c0392b').setMark('textStyle', { sizePercent: 125 }).run()
    const mark = textStyleMark(editor)
    expect(mark?.attrs?.color).toBe('#c0392b')
    expect(mark?.attrs?.sizePercent).toBe(125)
    editor.destroy()
  })
})
