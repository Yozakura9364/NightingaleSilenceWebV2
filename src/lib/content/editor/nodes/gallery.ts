// Gallery node — T021 [US1]
// Multi-image layout: two-column, three-column, grid.
import { Node, mergeAttributes } from '@tiptap/core'

export const Gallery = Node.create({
  name: 'gallery',
  group: 'block',
  content: 'image{2,20}',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      layout: {
        default: 'two-column',
        parseHTML: (el) => el.getAttribute('data-layout') || 'two-column',
        renderHTML: (attrs) => ({ 'data-layout': attrs.layout })
      },
      gid: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-gid'),
        renderHTML: (attrs) => ({ 'data-gid': attrs.gid })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'gallery' }), 0]
  }
})
