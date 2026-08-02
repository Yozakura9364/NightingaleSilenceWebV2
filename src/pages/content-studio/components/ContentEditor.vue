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
  modelValue?: unknown  // bare ProseMirror doc {type:"doc",content:[...]}
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

watch(() => props.modelValue, (val) => {
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
}, { immediate: true })

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({ editor })
</script>

<style scoped>
.content-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #fff);
}
.editor-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}
.editor-loading {
  padding: 48px;
  text-align: center;
  color: var(--text-secondary, #999);
}
</style>
