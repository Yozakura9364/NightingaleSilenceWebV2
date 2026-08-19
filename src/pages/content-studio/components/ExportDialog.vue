<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="export-dialog-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="t(dialogKeys.title)"
      @click.self="close"
    >
      <section class="export-dialog-window">
        <header class="export-dialog-window__bar">
          <span class="export-dialog-window__title">{{ t(dialogKeys.title) }}</span>
          <button
            class="export-dialog-window__close"
            type="button"
            :aria-label="t(dialogKeys.close)"
            @click="close"
          >
            ×
          </button>
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
            <AppButton size="compact" @click="copy">
              {{ t(copyDone ? dialogKeys.copied : dialogKeys.copy) }}
            </AppButton>
            <AppButton size="compact" @click="download">
              {{ t(dialogKeys.download) }}
            </AppButton>
            <AppButton variant="primary" size="compact" @click="close">
              {{ t(dialogKeys.close) }}
            </AppButton>
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
import AppButton from '@/components/AppButton.vue'
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
  blockingNotice: contentStudioKeys.exportBlockingNotice
}

const result = computed(() =>
  serializeNgaBbcode(
    props.document ?? { schemaVersion: 'content.document.v1', doc: { type: 'doc', content: [] } }
  )
)
const hasBlocking = computed(() => result.value.losses.some((l) => l.severity === 'BLOCKING'))

function close() {
  visible.value = false
  emit('close')
}

async function copy() {
  try {
    await navigator.clipboard.writeText(result.value.text)
    copyDone.value = true
    setTimeout(() => {
      copyDone.value = false
    }, 2000)
  } catch {
    // clipboard unavailable (non-secure context) — fall back to select+copy
    textAreaRef.value?.select()
    document.execCommand('copy')
    copyDone.value = true
    setTimeout(() => {
      copyDone.value = false
    }, 2000)
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
/* 非 scoped：Teleport 挂 body。配色全部走 --ns-* 设计令牌。 */
.export-dialog-overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--ns-color-bg) 62%, transparent);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.export-dialog-window {
  width: min(720px, 92vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-shadow-panel);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
}
.export-dialog-window__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: var(--ns-line-width) solid var(--ns-color-border);
  background: var(--ns-color-surface);
}
.export-dialog-window__title {
  font-size: 13px;
  font-weight: 950;
}
.export-dialog-window__close {
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  color: var(--ns-color-text-muted);
}
.export-dialog-window__close:hover {
  color: var(--ns-color-text);
}
.export-dialog-window__body {
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.export-dialog-window__preview {
  width: 100%;
  min-height: 220px;
  resize: vertical;
  box-sizing: border-box;
  font-family: var(--ns-font-mono);
  font-size: 13px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  padding: 8px 10px;
  background: var(--ns-color-surface-tint);
  color: var(--ns-color-text);
}
.export-dialog-window__preview:focus {
  outline: none;
  border-color: var(--ns-color-accent);
}
.export-dialog-window__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.export-dialog-window__blocking {
  margin: 0;
  color: var(--ns-status-danger-text);
  font-size: 13px;
  border: var(--ns-line-width) solid var(--ns-status-danger-border);
  background: var(--ns-status-danger-bg);
  padding: 8px 10px;
  border-radius: var(--ns-radius-sm);
}
.export-loss-list__title {
  font-size: 14px;
  margin: 8px 0 4px;
}
.export-loss-list__none {
  color: var(--ns-color-success);
  font-size: 13px;
}
.export-loss-list__item {
  font-size: 13px;
  padding: 4px 8px;
  border-radius: var(--ns-radius-sm);
  margin: 2px 0;
  display: flex;
  gap: 8px;
}
.export-loss-list__item--blocking {
  background: var(--ns-status-danger-bg);
  color: var(--ns-status-danger-text);
}
.export-loss-list__item--warning {
  background: var(--ns-status-warning-bg);
  color: var(--ns-status-warning-text);
}
.export-loss-list__item--info {
  background: var(--ns-status-info-bg);
  color: var(--ns-status-info-text);
}
.export-loss-list__severity {
  font-weight: 700;
  width: 14px;
}
.export-loss-list__path {
  opacity: 0.6;
  font-family: var(--ns-font-mono);
}
</style>
