<template>
  <Teleport to="body">
    <div v-if="visible" class="export-dialog-overlay" role="dialog" aria-modal="true" :aria-label="t(dialogKeys.title)" @click.self="close">
      <section class="export-dialog-window">
        <header class="export-dialog-window__bar">
          <span class="export-dialog-window__title">{{ t(dialogKeys.title) }}</span>
          <button class="export-dialog-window__close" type="button" :aria-label="t(dialogKeys.close)" @click="close">×</button>
        </header>

        <div class="export-dialog-window__body">
          <textarea
            ref="textAreaRef"
            class="export-dialog-window__preview"
            :value="result.text"
            readonly
            :aria-label="t(dialogKeys.previewAria)"
          ></textarea>

          <div class="export-dialog-window__actions">
            <button class="export-dialog-window__btn" type="button" @click="copy">
              {{ t(copyDone ? dialogKeys.copied : dialogKeys.copy) }}
            </button>
            <button class="export-dialog-window__btn" type="button" @click="download">
              {{ t(dialogKeys.download) }}
            </button>
            <button class="export-dialog-window__btn export-dialog-window__btn--primary" type="button" @click="close">
              {{ t(dialogKeys.close) }}
            </button>
          </div>

          <p v-if="hasBlocking" class="export-dialog-window__blocking">
            {{ t(dialogKeys.blockingNotice) }}
          </p>

          <ExportLossList :losses="result.losses" />
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'
import ExportLossList from './ExportLossList.vue'
import { serializeNgaBbcode } from '@/lib/content/export/nga/serializeNgaBbcode'
import type { ContentDocument } from '@/lib/content/model/types'

const props = defineProps<{
  document: ContentDocument | null
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useLocale()
const visible = ref(true)
const textAreaRef = ref<HTMLTextAreaElement | null>(null)
const copyDone = ref(false)
const dialogKeys = {
  title: contentStudioKeys.exportTitle,
  close: contentStudioKeys.cancel,
  copy: contentStudioKeys.exportCopy,
  copied: contentStudioKeys.exportCopied,
  download: contentStudioKeys.exportDownload,
  previewAria: contentStudioKeys.exportPreviewAria,
  blockingNotice: contentStudioKeys.exportBlockingNotice,
}

const result = computed(() => serializeNgaBbcode(props.document ?? { schemaVersion: 'content.document.v1', doc: { type: 'doc', content: [] } }))
const hasBlocking = computed(() => result.value.losses.some((l) => l.severity === 'BLOCKING'))

function close() {
  visible.value = false
  emit('close')
}

async function copy() {
  try {
    await navigator.clipboard.writeText(result.value.text)
    copyDone.value = true
    setTimeout(() => { copyDone.value = false }, 2000)
  } catch {
    // clipboard unavailable (non-secure context) — fall back to select+copy
    textAreaRef.value?.select()
    document.execCommand('copy')
    copyDone.value = true
    setTimeout(() => { copyDone.value = false }, 2000)
  }
}

function download() {
  const blob = new Blob([result.value.text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nga-export.txt'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
</script>

<style>
.export-dialog-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.export-dialog-window {
  width: min(720px, 92vw); max-height: 85vh; display: flex; flex-direction: column;
  background: var(--surface, #fff); border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.export-dialog-window__bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; border-bottom: 1px solid var(--border-color, #ddd);
}
.export-dialog-window__title { font-weight: 600; }
.export-dialog-window__close {
  border: none; background: none; font-size: 20px; cursor: pointer; line-height: 1;
}
.export-dialog-window__body { padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
.export-dialog-window__preview {
  width: 100%; min-height: 220px; resize: vertical;
  font-family: ui-monospace, Consolas, monospace; font-size: 13px;
  border: 1px solid var(--border-color, #ccc); border-radius: 4px; padding: 8px;
  background: var(--code-bg, #f6f6f6); color: inherit;
}
.export-dialog-window__actions { display: flex; gap: 8px; flex-wrap: wrap; }
.export-dialog-window__btn {
  padding: 6px 14px; border: 1px solid #bbb; border-radius: 4px; background: #fff; cursor: pointer;
}
.export-dialog-window__btn--primary { border-color: #4a7; background: #e8f5e9; }
.export-dialog-window__blocking {
  color: #c0392b; font-size: 13px; border: 1px solid #f5c6c6; background: #fdf0f0; padding: 8px; border-radius: 4px;
}
.export-loss-list__title { font-size: 14px; margin: 8px 0 4px; }
.export-loss-list__none { color: #2e7d32; font-size: 13px; }
.export-loss-list__item { font-size: 13px; padding: 4px 8px; border-radius: 4px; margin: 2px 0; display: flex; gap: 8px; }
.export-loss-list__item--blocking { background: #fdf0f0; color: #c0392b; }
.export-loss-list__item--warning { background: #fff8e1; color: #8d6e00; }
.export-loss-list__item--info { background: #f3f7fd; color: #555; }
.export-loss-list__severity { font-weight: 700; width: 14px; }
.export-loss-list__path { opacity: 0.6; font-family: ui-monospace, monospace; }
</style>
