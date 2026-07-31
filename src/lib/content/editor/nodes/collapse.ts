// Collapse node — T021 [US1]
// Foldable content block. Title stored in attrs, single content hole for body.
import { Node, mergeAttributes } from '@tiptap/core'

export const Collapse = Node.create({
  name: 'collapse',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      title: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-title') || '',
        renderHTML: (attrs) => ({ 'data-title': attrs.title })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'details[data-type="collapse"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes, { 'data-type': 'collapse' }), 0]
  }
})
