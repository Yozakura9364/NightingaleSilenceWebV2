// bubbleMenuModel.ts — P1: bubble menu model as pure editor-state functions.
// The Vue component is a thin renderer on top; focus handling lives in the
// plugin shouldShow + component refocus, NOT here (headless tests have no DOM
// focus and chain().focus() would truncate command chains).
import type { Editor } from '@tiptap/core'

export interface BubbleMenuItem {
  id: string
  kind: 'toggle' | 'input' | 'picker'
  visible: boolean
  active: boolean
  options?: (string | number)[]
  run: (value?: string | number) => void
}

export const COLOR_PRESETS = ['#2a2138', '#c0392b', '#1e6fd9', '#0f8a5f', '#b8860b', '#7a4fbf', 'default']
export const SIZE_PRESETS = [75, 100, 125, 150, 200] // 与 document-validator SIZE_PERCENTS 对齐

/** Pure eligibility (state-only, headless-testable). The plugin's shouldShow
 *  additionally requires editor.isFocused. */
export function isBubbleEligible(editor: Editor): boolean {
  return !editor.state.selection.empty && editor.isEditable && !editor.isActive('codeBlock')
}

export function computeBubbleMenuItems(editor: Editor): BubbleMenuItem[] {
  const show = isBubbleEligible(editor)
  // no .focus() here — the owning component refocuses after invoking run()
  const chain = () => editor.chain()
  const mark = (id: string, run: () => void): BubbleMenuItem => ({
    id, kind: 'toggle', visible: show, active: editor.isActive(id), run,
  })
  const textStyle = editor.getAttributes('textStyle')
  return [
    mark('bold', () => chain().toggleBold().run()),
    mark('italic', () => chain().toggleItalic().run()),
    mark('underline', () => chain().toggleUnderline().run()),
    mark('strike', () => chain().toggleStrike().run()),
    mark('code', () => chain().toggleCode().run()),
    {
      // 小输入条：Enter 确认 / Esc 取消 / 留空清除；预填当前 href（组件负责）
      id: 'link', kind: 'input', visible: show, active: editor.isActive('link'),
      run: (href) => {
        if (typeof href === 'string' && href.trim()) {
          chain().extendMarkRange('link').setLink({ href: href.trim() }).run()
        } else {
          chain().unsetLink().run()
        }
      },
    },
    {
      id: 'color', kind: 'picker', visible: show,
      active: !!textStyle.color, options: COLOR_PRESETS,
      run: (v) => { v === 'default' ? chain().unsetColor().run() : chain().setColor(String(v)).run() },
    },
    {
      id: 'size', kind: 'picker', visible: show,
      active: textStyle.sizePercent != null,
      options: SIZE_PRESETS,
      run: (v) => {
        if (typeof v === 'number') {
          chain().setMark('textStyle', { sizePercent: v }).run()
        } else {
          chain().setMark('textStyle', { sizePercent: null }).run()
        }
      },
    },
    {
      // 单按钮循环：left(默认) → center → right → 清除回默认
      id: 'align', kind: 'toggle', visible: show,
      active: !editor.isActive({ textAlign: 'left' }),
      run: () => {
        if (editor.isActive({ textAlign: 'center' })) {
          chain().setTextAlign('right').run()
        } else if (editor.isActive({ textAlign: 'right' })) {
          chain().unsetTextAlign().run()
        } else {
          chain().setTextAlign('center').run()
        }
      },
    },
  ]
}
