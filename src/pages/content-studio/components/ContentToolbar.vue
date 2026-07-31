<template>
  <div v-if="editor" class="content-toolbar">
    <button @click="editor.chain().focus().toggleBold().run()" :class="{ active: editor.isActive('bold') }" :aria-label="t(keys.bold)" :title="t(keys.bold)"><b>{{ t(keys.boldIcon) }}</b></button>
    <button @click="editor.chain().focus().toggleItalic().run()" :class="{ active: editor.isActive('italic') }" :aria-label="t(keys.italic)" :title="t(keys.italic)"><i>{{ t(keys.italicIcon) }}</i></button>
    <button @click="editor.chain().focus().toggleUnderline().run()" :class="{ active: editor.isActive('underline') }" :aria-label="t(keys.underline)" :title="t(keys.underline)"><u>{{ t(keys.underlineIcon) }}</u></button>
    <button @click="editor.chain().focus().toggleStrike().run()" :class="{ active: editor.isActive('strike') }" :aria-label="t(keys.strike)" :title="t(keys.strike)"><s>{{ t(keys.strikeIcon) }}</s></button>
    <span class="sep" />
    <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ active: editor.isActive('heading', { level: 2 }) }" :aria-label="t(keys.heading2)" :title="t(keys.heading2)" class="t-text">{{ t(keys.heading2Icon) }}</button>
    <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ active: editor.isActive('heading', { level: 3 }) }" :aria-label="t(keys.heading3)" :title="t(keys.heading3)" class="t-text">{{ t(keys.heading3Icon) }}</button>
    <button @click="editor.chain().focus().toggleHeading({ level: 4 }).run()" :class="{ active: editor.isActive('heading', { level: 4 }) }" :aria-label="t(keys.heading4)" :title="t(keys.heading4)" class="t-text">{{ t(keys.heading4Icon) }}</button>
    <span class="sep" />
    <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ active: editor.isActive('bulletList') }" :aria-label="t(keys.bulletList)" :title="t(keys.bulletList)" class="t-symbol">•</button>
    <button @click="editor.chain().focus().toggleOrderedList().run()" :class="{ active: editor.isActive('orderedList') }" :aria-label="t(keys.orderedList)" :title="t(keys.orderedList)" class="t-symbol">1.</button>
    <button @click="editor.chain().focus().toggleBlockquote().run()" :class="{ active: editor.isActive('blockquote') }" :aria-label="t(keys.blockquote)" :title="t(keys.blockquote)" class="t-symbol">"</button>
    <button @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ active: editor.isActive('codeBlock') }" :aria-label="t(keys.codeBlock)" :title="t(keys.codeBlock)" class="t-symbol">{{ t(keys.codeBlockIcon) }}</button>
    <span class="sep" />
    <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" :aria-label="t(keys.undo)" :title="t(keys.undo)" class="t-symbol">↩</button>
    <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" :aria-label="t(keys.redo)" :title="t(keys.redo)" class="t-symbol">↪</button>
    <span class="sep" />
    <button @click="editor.chain().focus().setTextAlign('left').run()" :class="{ active: editor.isActive({ textAlign: 'left' }) }" :aria-label="t(keys.alignLeft)" :title="t(keys.alignLeft)" class="t-symbol">≡</button>
    <button @click="editor.chain().focus().setTextAlign('center').run()" :class="{ active: editor.isActive({ textAlign: 'center' }) }" :aria-label="t(keys.alignCenter)" :title="t(keys.alignCenter)" class="t-symbol">≡</button>
    <button @click="editor.chain().focus().setTextAlign('right').run()" :class="{ active: editor.isActive({ textAlign: 'right' }) }" :aria-label="t(keys.alignRight)" :title="t(keys.alignRight)" class="t-symbol t-align-right">≡</button>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'

const { t } = useLocale()
const keys = contentStudioKeys

defineProps<{ editor: Editor | null }>()
</script>

<style scoped>
.content-toolbar { display: flex; flex-wrap: wrap; gap: 2px; padding: 8px 12px; background: var(--bg-secondary,#f5f5f5); border-bottom: 1px solid var(--border-color,#e0e0e0); position: sticky; top: 0; z-index: 10; }
.content-toolbar button { padding: 4px 8px; border: 1px solid transparent; border-radius: 4px; background: transparent; cursor: pointer; font-size: 13px; color: var(--text-primary,#333); min-width: 28px; text-align: center; }
.content-toolbar button:hover { background: var(--bg-hover,#e8e8e8); }
.content-toolbar button.active { background: var(--bg-active,#d0d0d0); border-color: var(--border-color,#ccc); }
.content-toolbar button:disabled { opacity: 0.3; cursor: not-allowed; }
.t-text { font-weight: 500; }
.t-symbol { font-family: system-ui, sans-serif; }
.t-align-right { transform: scaleX(-1); }
.sep { width: 1px; background: #ccc; margin: 0 4px; }
</style>
