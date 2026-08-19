<template>
  <div v-if="editor" class="content-toolbar">
    <button
      @click="editor.chain().focus().undo().run()"
      :disabled="!editor.can().undo()"
      :aria-label="t(keys.undo)"
      :title="t(keys.undo)"
      class="t-symbol"
    >
      ↩
    </button>
    <button
      @click="editor.chain().focus().redo().run()"
      :disabled="!editor.can().redo()"
      :aria-label="t(keys.redo)"
      :title="t(keys.redo)"
      class="t-symbol"
    >
      ↪
    </button>
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
.content-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 12px;
  background: var(--ns-color-surface);
  border-bottom: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md) var(--ns-radius-md) 0 0;
  position: sticky;
  top: 0;
  z-index: 10;
}
.content-toolbar button {
  padding: 4px 8px;
  border: var(--ns-line-width) solid transparent;
  border-radius: var(--ns-radius-sm);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--ns-color-text);
  min-width: 28px;
  text-align: center;
  transition: background var(--ns-transition-fast);
}
.content-toolbar button:hover {
  background: var(--ns-color-surface-tint);
}
.content-toolbar button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.t-symbol {
  font-family: var(--ns-font-ui);
}
</style>
