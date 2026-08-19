<template>
  <div class="content-editor">
    <ContentToolbar :editor="editor ?? null" />
    <EditorBubbleMenu :editor="editor ?? null" />
    <EditorSlashMenu @request-media-insert="emit('request-media-insert')" />
    <div v-if="editor" class="editor-viewport">
      <editor-content :editor="editor" />
    </div>
    <p v-else class="editor-loading">{{ t(keys.editorLoading) }}</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { getContentExtensions } from '@/lib/content/editor/extensions'
import { createSlashCommandExtension } from '@/lib/content/editor/slashCommandExtension'
import { filterSlashItems } from '../editor/slashCommandModel'
import { toCanonicalDocument } from '@/lib/content/editor/toCanonicalDocument'
import ContentToolbar from './ContentToolbar.vue'
import EditorBubbleMenu from './EditorBubbleMenu.vue'
import EditorSlashMenu from './EditorSlashMenu.vue'

const slashCommand = createSlashCommandExtension({ items: filterSlashItems })

const { t } = useLocale()
const keys = { editorLoading: contentStudioKeys.editorLoading }

const props = defineProps<{
  modelValue?: unknown // bare ProseMirror doc {type:"doc",content:[...]}
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
  (e: 'change'): void
  (e: 'request-media-insert'): void
}>()

let suppressEmit = false

const editor = useEditor({
  extensions: [...getContentExtensions(), slashCommand],
  onUpdate: ({ editor }) => {
    if (suppressEmit) return
    // Emit RUNTIME JSON (gid preserved); canonicalization happens at save boundary
    emit('update:modelValue', editor.getJSON())
    emit('change')
  }
})

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && val) {
      // Compare canonical forms so runtime-only attrs (gid) don't trigger setContent loops
      const currentCanonical = toCanonicalDocument(editor.value.getJSON())
      const incomingCanonical = toCanonicalDocument(val as any)
      if (JSON.stringify(currentCanonical) !== JSON.stringify(incomingCanonical)) {
        suppressEmit = true
        try {
          editor.value.commands.setContent(val)
        } finally {
          suppressEmit = false
        }
      }
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({ editor })
</script>

<style scoped>
.content-editor {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-shadow-panel);
}
.editor-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  max-width: 820px;
  margin: 0 auto;
  width: 100%;
}
.editor-loading {
  padding: 48px;
  text-align: center;
  color: var(--ns-color-text-muted);
}

/* Editor content typography — mirrors the public reader look via design tokens */
.editor-viewport :deep(.ProseMirror) {
  min-height: 320px;
  outline: none;
  color: var(--ns-color-text);
  font-size: 15px;
  line-height: 1.75;
}
.editor-viewport :deep(.ProseMirror > * + *) {
  margin-top: 0.8em;
}
.editor-viewport :deep(.ProseMirror h2),
.editor-viewport :deep(.ProseMirror h3),
.editor-viewport :deep(.ProseMirror h4) {
  margin: 1.3em 0 0.5em;
  color: var(--ns-heading-bloom-color);
  line-height: 1.4;
}
.editor-viewport :deep(.ProseMirror h2) {
  font-size: 22px;
}
.editor-viewport :deep(.ProseMirror h3) {
  font-size: 19px;
}
.editor-viewport :deep(.ProseMirror h4) {
  font-size: 16px;
}
.editor-viewport :deep(.ProseMirror blockquote) {
  margin: 1em 0;
  padding: 8px 16px;
  border-left: 3px solid var(--ns-color-accent);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-accent-soft);
}
.editor-viewport :deep(.ProseMirror ul),
.editor-viewport :deep(.ProseMirror ol) {
  margin: 0.5em 0;
  padding-left: 1.6em;
}
.editor-viewport :deep(.ProseMirror li) {
  margin: 0.3em 0;
}
.editor-viewport :deep(.ProseMirror pre) {
  padding: 12px 14px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface-tint);
  font-family: var(--ns-font-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}
.editor-viewport :deep(.ProseMirror code) {
  padding: 0.1em 0.35em;
  border-radius: var(--ns-radius-xs);
  background: var(--ns-color-surface-tint);
  font-family: var(--ns-font-mono);
  font-size: 0.9em;
}
.editor-viewport :deep(.ProseMirror a) {
  color: var(--ns-color-accent-strong);
  text-decoration: underline;
}
.editor-viewport :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--ns-radius-sm);
}
.editor-viewport :deep(.ProseMirror hr) {
  border: none;
  border-top: var(--ns-line-width) solid var(--ns-color-border);
  margin: 1.6em 0;
}
.editor-viewport :deep(.ProseMirror table) {
  border-collapse: collapse;
  overflow: hidden;
  table-layout: fixed;
  width: 100%;
  margin: 1em 0;
}
.editor-viewport :deep(.ProseMirror th),
.editor-viewport :deep(.ProseMirror td) {
  border: var(--ns-line-width) solid var(--ns-color-border);
  padding: 6px 10px;
  vertical-align: top;
}
.editor-viewport :deep(.ProseMirror th) {
  background: var(--ns-color-surface-tint);
  font-weight: 600;
}
.editor-viewport :deep(.ProseMirror .selectedCell::after) {
  background: var(--ns-color-accent-soft);
  opacity: 0.6;
}
</style>
