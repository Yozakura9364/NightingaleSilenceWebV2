// Tiptap editor extensions — T020 [US1]
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { Image as TiptapImage } from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'

import { Gallery } from './nodes/gallery'
import { Collapse } from './nodes/collapse'
import { getPreviewUrl, subscribePreviews } from './imagePreviewCache'

// TextStyle carrying the canonical sizePercent attribute (75|100|125|150|200,
// validated by document-validator). Without this the editor had no way to
// represent font size even though the model/renderer/NGA export know it.
const TextStyleWithSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      sizePercent: {
        default: null,
        parseHTML: (el) => {
          const m = /font-size:\s*(\d+)%/.exec(el.getAttribute('style') ?? '')
          return m ? Number(m[1]) : null
        },
        renderHTML: (attrs) => (attrs.sizePercent ? { style: `font-size: ${attrs.sizePercent}%` } : {}),
      },
    }
  },
})

const ContentImage = TiptapImage.extend({
  addAttributes() {
    return {
      mediaId: { default: null },
      alt: { default: '' },
      align: { default: 'center' },
      displayWidth: { default: 75 },
      caption: { default: null },
      // gid: editor-runtime only; stripped at the canonical save boundary
      gid: { default: null },
    }
  },
  addNodeView() {
    return ({ node: initialNode }) => {
      let currentNode: any = initialNode
      const dom = document.createElement('img')
      dom.className = 'content-image'
      const render = () => {
        dom.setAttribute('data-media-id', currentNode.attrs.mediaId || '')
        const url = getPreviewUrl(currentNode.attrs.mediaId) || ''
        if (url) dom.src = url
      }
      render()
      const unsubscribe = subscribePreviews((mediaId) => {
        if (mediaId === currentNode.attrs.mediaId) render()
      })
      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== currentNode.type.name) return false
          currentNode = updatedNode
          render()
          return true
        },
        destroy: unsubscribe,
      }
    }
  },
})

export function getContentExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      codeBlock: { HTMLAttributes: { class: 'content-code-block' } },
      blockquote: { HTMLAttributes: { class: 'content-blockquote' } },
      bulletList: { HTMLAttributes: { class: 'content-bullet-list' } },
      orderedList: { HTMLAttributes: { class: 'content-ordered-list' } },
      horizontalRule: { HTMLAttributes: { class: 'content-horizontal-rule' } }
    }),
    Table.configure({ resizable: true, allowTableNodeSelection: true, HTMLAttributes: { class: 'content-table' } }),
    TableRow, TableHeader, TableCell,
    ContentImage.configure({ allowBase64: false, inline: false }),
    TextStyleWithSize, Color, Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'], defaultAlignment: 'left' }),
    Gallery, Collapse
  ]
}
