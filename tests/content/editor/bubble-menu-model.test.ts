// bubble-menu-model.test.ts — P1-2 bubble menu model (pure state, headless).
// Construction tiers (Codex review): bare StarterKit only for plain mark
// toggles; color/size/link cases MUST use the real studio assembly
// (getContentExtensions, incl. the sizePercent extension) — bare StarterKit
// has no TextStyle so textStyle assertions would be vacuous.
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { getContentExtensions } from '@/lib/content/editor/extensions'
import { computeBubbleMenuItems, isBubbleEligible, SIZE_PRESETS } from '@/pages/content-studio/editor/bubbleMenuModel'

function makeMarkEditor(content: object) {
  return new Editor({ extensions: [StarterKit], content: { type: 'doc', content: [content] } })
}
function makeStudioEditor(content: object) {
  return new Editor({ extensions: getContentExtensions(), content: { type: 'doc', content: [content] } })
}
function paragraph(text: string) {
  return { type: 'paragraph', content: [{ type: 'text', text }] }
}

describe('bubble menu model (P1-2)', () => {
  it('paragraph 选区提供行内样式项且 bold 可切换（裸 StarterKit 档）', () => {
    const editor = makeMarkEditor(paragraph('hello world'))
    editor.commands.setTextSelection({ from: 1, to: 6 })
    const items = computeBubbleMenuItems(editor)
    const bold = items.find((i) => i.id === 'bold')
    expect(bold?.visible).toBe(true)
    expect(bold?.active).toBe(false)
    bold?.run()
    expect(editor.isActive('bold')).toBe(true)
    editor.destroy()
  })

  it('空选区（光标）不显示菜单', () => {
    const editor = makeMarkEditor(paragraph('hi'))
    editor.commands.setTextSelection(1)
    expect(isBubbleEligible(editor)).toBe(false)
    expect(computeBubbleMenuItems(editor).every((i) => !i.visible)).toBe(true)
    editor.destroy()
  })

  it('codeBlock 内选区不显示菜单', () => {
    const editor = makeMarkEditor({ type: 'codeBlock', content: [{ type: 'text', text: 'const x = 1' }] })
    editor.commands.setTextSelection({ from: 1, to: 5 })
    expect(isBubbleEligible(editor)).toBe(false)
    editor.destroy()
  })

  it('link 项标注为 input 形态，color/size 项为 picker 且带预设 options（真实装配档）', () => {
    const editor = makeStudioEditor(paragraph('hello'))
    editor.commands.setTextSelection({ from: 1, to: 6 })
    const items = computeBubbleMenuItems(editor)
    expect(items.find((i) => i.id === 'link')?.kind).toBe('input')
    const color = items.find((i) => i.id === 'color')
    expect(color?.kind).toBe('picker')
    expect(color?.options?.length).toBeGreaterThanOrEqual(6)
    const size = items.find((i) => i.id === 'size')
    expect(size?.kind).toBe('picker')
    expect(size?.options).toEqual(SIZE_PRESETS)
    expect(size?.options).toContain(100)
    editor.destroy()
  })

  it('link run：写入 href 后可读回，留空清除（真实装配档）', () => {
    const editor = makeStudioEditor(paragraph('click me'))
    editor.commands.setTextSelection({ from: 1, to: 9 })
    const link = computeBubbleMenuItems(editor).find((i) => i.id === 'link')!
    link.run('https://example.com/page')
    expect(editor.isActive('link')).toBe(true)
    expect(editor.getAttributes('link').href).toBe('https://example.com/page')
    link.run('')
    expect(editor.isActive('link')).toBe(false)
    editor.destroy()
  })

  it('color run：预设色写入 textStyle，default 清除（真实装配档）', () => {
    const editor = makeStudioEditor(paragraph('paint me'))
    editor.commands.setTextSelection({ from: 1, to: 9 })
    const color = computeBubbleMenuItems(editor).find((i) => i.id === 'color')!
    color.run('#c0392b')
    expect(editor.getAttributes('textStyle').color).toBe('#c0392b')
    expect(computeBubbleMenuItems(editor).find((i) => i.id === 'color')?.active).toBe(true)
    color.run('default')
    expect(editor.getAttributes('textStyle').color ?? null).toBeNull()
    editor.destroy()
  })

  it('size run：档位写入 sizePercent，default 清除（真实装配档）', () => {
    const editor = makeStudioEditor(paragraph('resize me'))
    editor.commands.setTextSelection({ from: 1, to: 10 })
    const size = computeBubbleMenuItems(editor).find((i) => i.id === 'size')!
    size.run(150)
    expect(editor.getAttributes('textStyle').sizePercent).toBe(150)
    size.run('default')
    expect(editor.getAttributes('textStyle').sizePercent ?? null).toBeNull()
    editor.destroy()
  })

  it('align run：left→center→right→清除 循环（真实装配档，TextAlign 在装配内）', () => {
    const editor = makeStudioEditor(paragraph('align me'))
    editor.commands.setTextSelection({ from: 1, to: 9 })
    const align = () => computeBubbleMenuItems(editor).find((i) => i.id === 'align')!
    expect(align().kind).toBe('toggle')
    expect(align().active).toBe(false)
    align().run()
    expect(editor.isActive({ textAlign: 'center' })).toBe(true)
    expect(align().active).toBe(true)
    align().run()
    expect(editor.isActive({ textAlign: 'right' })).toBe(true)
    align().run()
    expect(editor.isActive({ textAlign: 'center' })).toBe(false)
    expect(editor.isActive({ textAlign: 'right' })).toBe(false)
    editor.destroy()
  })
})
