<template>
  <div v-if="editor" class="content-toolbar">
    <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" :aria-label="t(keys.undo)" :title="t(keys.undo)" class="t-symbol">↩</button>
    <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" :aria-label="t(keys.redo)" :title="t(keys.redo)" class="t-symbol">↪</button>
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
/* A 方案去重后仅保留 undo/redo 最小条：行内样式归气泡菜单，块插入归斜杠菜单 */
.content-toolbar { display: flex; flex-wrap: wrap; gap: 2px; padding: 4px 12px; background: var(--bg-secondary,#f5f5f5); border-bottom: 1px solid var(--border-color,#e0e0e0); position: sticky; top: 0; z-index: 10; }
.content-toolbar button { padding: 4px 8px; border: 1px solid transparent; border-radius: 4px; background: transparent; cursor: pointer; font-size: 13px; color: var(--text-primary,#333); min-width: 28px; text-align: center; }
.content-toolbar button:hover { background: var(--bg-hover,#e8e8e8); }
.content-toolbar button:disabled { opacity: 0.3; cursor: not-allowed; }
.t-symbol { font-family: system-ui, sans-serif; }
</style>
