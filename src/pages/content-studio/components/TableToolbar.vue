<template>
  <div v-if="editor?.isActive('table')" class="table-toolbar">
    <button
      @click="editor.chain().focus().addColumnBefore().run()"
      :aria-label="t(keys.addColumnBefore)"
      :title="t(keys.addColumnBefore)"
      class="t-symbol"
    >
      ◀│
    </button>
    <button
      @click="editor.chain().focus().addColumnAfter().run()"
      :aria-label="t(keys.addColumnAfter)"
      :title="t(keys.addColumnAfter)"
      class="t-symbol"
    >
      │▶
    </button>
    <button
      @click="editor.chain().focus().deleteColumn().run()"
      :aria-label="t(keys.deleteColumn)"
      :title="t(keys.deleteColumn)"
      class="t-symbol t-delete"
    >
      ⊟
    </button>
    <span class="sep" />
    <button
      @click="editor.chain().focus().addRowBefore().run()"
      :aria-label="t(keys.addRowBefore)"
      :title="t(keys.addRowBefore)"
      class="t-symbol"
    >
      ▲
    </button>
    <button
      @click="editor.chain().focus().addRowAfter().run()"
      :aria-label="t(keys.addRowAfter)"
      :title="t(keys.addRowAfter)"
      class="t-symbol"
    >
      ▼
    </button>
    <button
      @click="editor.chain().focus().deleteRow().run()"
      :aria-label="t(keys.deleteRow)"
      :title="t(keys.deleteRow)"
      class="t-symbol t-delete"
    >
      ⊟
    </button>
    <span class="sep" />
    <button
      @click="editor.chain().focus().toggleHeaderColumn().run()"
      :class="{ active: editor.isActive('tableHeader') }"
      :aria-label="t(keys.headerColumn)"
      :title="t(keys.headerColumn)"
      class="t-symbol"
    >
      ⊞
    </button>
    <button
      @click="editor.chain().focus().toggleHeaderRow().run()"
      :aria-label="t(keys.headerRow)"
      :title="t(keys.headerRow)"
      class="t-symbol"
    >
      ⊟
    </button>
    <span class="sep" />
    <button
      @click="editor.chain().focus().mergeCells().run()"
      :disabled="!editor.can().mergeCells()"
      :aria-label="t(keys.mergeCells)"
      :title="t(keys.mergeCells)"
      class="t-symbol"
    >
      ⊞
    </button>
    <button
      @click="editor.chain().focus().splitCell().run()"
      :disabled="!editor.can().splitCell()"
      :aria-label="t(keys.splitCell)"
      :title="t(keys.splitCell)"
      class="t-symbol"
    >
      ⊟
    </button>
    <span class="sep" />
    <button
      @click="editor.chain().focus().fixTables().run()"
      :aria-label="t(keys.fixTable)"
      :title="t(keys.fixTable)"
      class="t-symbol"
    >
      ⟲
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
.table-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 10px;
  background: var(--ns-color-surface-solid);
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  box-shadow: var(--ns-shadow-panel);
}
.table-toolbar button {
  padding: 2px 6px;
  border: var(--ns-line-width) solid transparent;
  border-radius: var(--ns-radius-sm);
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--ns-color-text);
  transition: background var(--ns-transition-fast);
}
.table-toolbar button:hover {
  background: var(--ns-color-surface-tint);
}
.table-toolbar button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.table-toolbar button.active {
  background: var(--ns-color-accent-soft);
}
.t-symbol {
  font-family: var(--ns-font-ui);
  min-width: 22px;
  text-align: center;
}
.t-delete {
  color: var(--ns-color-danger);
}
.sep {
  width: 1px;
  background: var(--ns-color-border);
  margin: 0 3px;
}
</style>
