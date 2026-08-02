// slashCommandModel.ts — P2: slash command items as pure editor-state functions.
// image/gallery carry opensDialog: the view intercepts them to open the media
// dialog (meaningful insertion needs real mediaIds); their run() still performs
// a schema-valid fallback so the pure path stays testable.
import type { Editor, Range } from '@tiptap/core'

export interface SlashItem {
  id: string
  labelKey: string // contentStudio.editor.slash.<id>（视图层 t(labelKey)）
  keywords: string[]
  opensDialog?: boolean
  run: (editor: Editor, range: Range) => void
}

const key = (id: string) => `contentStudio.editor.slash.${id}`

export const SLASH_ITEMS: SlashItem[] = [
  {
    id: 'paragraph', labelKey: key('paragraph'),
    keywords: ['paragraph', 'text', '正文', '段落', 'zw'],
    run: (editor, range) => { editor.chain().deleteRange(range).setParagraph().run() },
  },
  {
    id: 'heading2', labelKey: key('heading2'),
    keywords: ['heading', 'h2', '标题', '二级'],
    run: (editor, range) => { editor.chain().deleteRange(range).setNode('heading', { level: 2 }).run() },
  },
  {
    id: 'heading3', labelKey: key('heading3'),
    keywords: ['heading', 'h3', '标题', '三级'],
    run: (editor, range) => { editor.chain().deleteRange(range).setNode('heading', { level: 3 }).run() },
  },
  {
    id: 'bulletList', labelKey: key('bulletList'),
    keywords: ['bullet', 'list', 'ul', '列表', '无序'],
    run: (editor, range) => { editor.chain().deleteRange(range).toggleBulletList().run() },
  },
  {
    id: 'orderedList', labelKey: key('orderedList'),
    keywords: ['ordered', 'list', 'ol', 'number', '列表', '有序', '编号'],
    run: (editor, range) => { editor.chain().deleteRange(range).toggleOrderedList().run() },
  },
  {
    id: 'blockquote', labelKey: key('blockquote'),
    keywords: ['quote', 'blockquote', '引用', 'yy'],
    run: (editor, range) => { editor.chain().deleteRange(range).toggleBlockquote().run() },
  },
  {
    id: 'codeBlock', labelKey: key('codeBlock'),
    keywords: ['code', 'codeblock', '代码', '代码块', 'dm'],
    run: (editor, range) => { editor.chain().deleteRange(range).toggleCodeBlock().run() },
  },
  {
    id: 'horizontalRule', labelKey: key('horizontalRule'),
    keywords: ['hr', 'rule', 'divider', '分割', '分隔', '分割线', 'fgx'],
    run: (editor, range) => { editor.chain().deleteRange(range).setHorizontalRule().run() },
  },
  {
    id: 'table', labelKey: key('table'),
    keywords: ['table', 'grid', '表格', '表', 'bg'],
    run: (editor, range) => { editor.chain().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  },
  {
    id: 'image', labelKey: key('image'),
    keywords: ['image', 'img', 'picture', '图片', '图', 'tp'],
    opensDialog: true,
    run: (editor, range) => { editor.chain().deleteRange(range).insertContent({ type: 'image', attrs: {} }).run() },
  },
  {
    id: 'gallery', labelKey: key('gallery'),
    keywords: ['gallery', 'album', '画廊', '相册', 'hl', 'xc'],
    opensDialog: true,
    // schema 要求 image{2,20}：回退路径插入两个空 image 占位
    run: (editor, range) => {
      editor.chain().deleteRange(range).insertContent({
        type: 'gallery',
        attrs: { layout: 'two-column' },
        content: [{ type: 'image', attrs: {} }, { type: 'image', attrs: {} }],
      }).run()
    },
  },
  {
    id: 'collapse', labelKey: key('collapse'),
    keywords: ['collapse', 'spoiler', 'fold', '折叠', '折叠块', 'zd'],
    // insertContent 而非 setNode：collapse 要求 block+ 内容，空段落 setNode 会被拒绝
    run: (editor, range) => {
      editor.chain().deleteRange(range).insertContent({
        type: 'collapse',
        attrs: { title: '' },
        content: [{ type: 'paragraph' }],
      }).run()
    },
  },
]

export function filterSlashItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return SLASH_ITEMS
  return SLASH_ITEMS.filter((i) => i.id.toLowerCase().includes(q) || i.keywords.some((k) => k.toLowerCase().includes(q)))
}
