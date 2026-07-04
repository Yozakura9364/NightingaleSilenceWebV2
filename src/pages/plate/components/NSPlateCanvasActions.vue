<template>
  <footer class="nsplate-canvas-footer">
    <div class="nsplate-canvas-status" role="toolbar" :aria-label="t(textKeys.nsplateCanvasAria)">
      <button
        class="nsplate-canvas-status__button"
        type="button"
        :disabled="!canClearCustomPortrait"
        @click="emit('clear-custom-portrait')"
      >
        {{ t(textKeys.nsplateCustomPortraitClear) }}
      </button>
      <button
        class="nsplate-canvas-status__button"
        type="button"
        :disabled="!canClearAll"
        @click="emit('clear-all')"
      >
        {{ t(textKeys.nsplateClearAllSelections) }}
      </button>
      <button
        class="nsplate-canvas-status__button"
        type="button"
        :disabled="!canImportConfig"
        @click="emit('import-config')"
      >
        {{ t(textKeys.nsplateImportConfig) }}
      </button>
      <label class="nsplate-canvas-status__toggle">
        <input v-model="exportScale2x" type="checkbox" :disabled="!canExport" />
        <span>{{ t(textKeys.nsplateExportScale2x) }}</span>
      </label>
      <button
        class="nsplate-canvas-status__button"
        type="button"
        :disabled="!canExport"
        @click="emitExport('png')"
      >
        {{ t(textKeys.nsplateExportPng) }}
      </button>
      <button
        class="nsplate-canvas-status__button"
        type="button"
        :disabled="!canExport"
        @click="emitExport('jpg')"
      >
        {{ t(textKeys.nsplateExportJpg) }}
      </button>
      <button
        class="nsplate-canvas-status__button"
        type="button"
        :disabled="!canExport"
        @click="emitLayeredZipExport"
      >
        {{ t(textKeys.nsplateExportLayeredZip) }}
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { textKeys } from '@/config/site'
import type { NSPlateCanvasExportFormat } from '@/lib/plate/exportCanvas'
import { useLocale } from '@/stores/locale'

defineProps<{
  canClearCustomPortrait: boolean
  canClearAll: boolean
  canImportConfig: boolean
  canExport: boolean
}>()

const emit = defineEmits<{
  'clear-custom-portrait': []
  'clear-all': []
  'import-config': []
  'export-image': [payload: { format: NSPlateCanvasExportFormat; scale: number }]
  'export-layered-zip': [payload: { scale: number }]
}>()

const { t } = useLocale()
const exportScale2x = ref(false)

function emitExport(format: NSPlateCanvasExportFormat) {
  emit('export-image', {
    format,
    scale: exportScale2x.value ? 2 : 1
  })
}

function emitLayeredZipExport() {
  emit('export-layered-zip', {
    scale: exportScale2x.value ? 2 : 1
  })
}
</script>

<style scoped>
.nsplate-canvas-footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  padding-top: 10px;
}

.nsplate-canvas-status {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 0;
  max-width: min(760px, calc(100% - 32px));
  margin: 0;
  padding: 0;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsplate-canvas-status__button {
  min-width: 0;
  min-height: 36px;
  padding: 0 18px;
  overflow: hidden;
  border: 0;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.nsplate-canvas-status__toggle,
.nsplate-canvas-status__button + .nsplate-canvas-status__button,
.nsplate-canvas-status__button + .nsplate-canvas-status__toggle,
.nsplate-canvas-status__toggle + .nsplate-canvas-status__button {
  border-left: 2px solid var(--ns-pixel-border);
}

.nsplate-canvas-status__button:hover:not(:disabled) {
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-danger);
}

.nsplate-canvas-status__toggle {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  gap: 8px;
  padding: 0 14px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  white-space: nowrap;
  cursor: pointer;
}

.nsplate-canvas-status__toggle input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--ns-color-accent);
}

.nsplate-canvas-status__button:disabled,
.nsplate-canvas-status__toggle:has(input:disabled) {
  opacity: 0.46;
  cursor: not-allowed;
}

@media (max-width: 560px) {
  .nsplate-canvas-status {
    display: grid;
    grid-template-columns: 1fr;
    width: min(260px, calc(100% - 24px));
    max-width: none;
  }

  .nsplate-canvas-status__button + .nsplate-canvas-status__button {
    border-top: 2px solid var(--ns-pixel-border);
    border-left: 0;
  }

  .nsplate-canvas-status__toggle,
  .nsplate-canvas-status__button + .nsplate-canvas-status__toggle,
  .nsplate-canvas-status__toggle + .nsplate-canvas-status__button {
    border-top: 2px solid var(--ns-pixel-border);
    border-left: 0;
  }
}
</style>
