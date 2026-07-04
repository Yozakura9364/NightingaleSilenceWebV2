<template>
  <section class="nsplate-workbench-actions" :aria-label="t(textKeys.nsplateWorkbenchActions)">
    <button
      class="nsplate-workbench-actions__trigger"
      type="button"
      :aria-label="t(textKeys.nsplateWorkbenchActions)"
      :title="t(textKeys.nsplateWorkbenchActions)"
      aria-haspopup="menu"
      aria-controls="nsplate-workbench-actions-menu"
      :aria-expanded="isMenuOpen"
      :data-open="isMenuOpen"
      @click="toggleMenu"
      @keydown.esc.stop.prevent="closeMenu"
    >
      <span class="nsplate-workbench-actions__icon" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M6 4H4v16h2zm10-2H6v2h10zm4 4h-2v14h2zm-2 14H6v2h12zM16 4h2v2h-2zm-4 0h2v6h-2z"
          />
          <path d="M12 8h6v2h-6z" />
        </svg>
      </span>
    </button>

    <div
      v-if="isMenuOpen"
      id="nsplate-workbench-actions-menu"
      class="nsplate-workbench-actions__menu"
      role="menu"
      @keydown.esc.stop.prevent="closeMenu"
    >
      <div class="nsplate-workbench-actions__group" role="group">
        <button
          class="nsplate-workbench-actions__button"
          type="button"
          role="menuitem"
          :disabled="!canImportConfig"
          @click="importConfig"
        >
          {{ t(textKeys.nsplateImportConfig) }}
        </button>
        <button
          class="nsplate-workbench-actions__button"
          type="button"
          role="menuitem"
          :disabled="!canImportConfig"
          @click="pasteConfig"
        >
          {{ t(textKeys.nsplatePasteConfig) }}
        </button>
        <button
          class="nsplate-workbench-actions__button"
          type="button"
          role="menuitem"
          :disabled="!canImportConfig"
          @click="copyConfig"
        >
          {{ t(textKeys.nsplateCopyConfig) }}
        </button>
        <button
          class="nsplate-workbench-actions__button"
          type="button"
          role="menuitem"
          :disabled="!canImportConfig"
          @click="exportConfig"
        >
          {{ t(textKeys.nsplateExportConfig) }}
        </button>
      </div>

      <div class="nsplate-workbench-actions__group" role="group">
        <label class="nsplate-workbench-actions__toggle">
          <input v-model="exportScale2x" type="checkbox" :disabled="!canExport" />
          <span>{{ t(textKeys.nsplateExportScale2x) }}</span>
        </label>
        <button
          class="nsplate-workbench-actions__button"
          type="button"
          role="menuitem"
          :disabled="!canExport"
          @click="exportImage('png')"
        >
          {{ t(textKeys.nsplateExportPng) }}
        </button>
        <button
          class="nsplate-workbench-actions__button"
          type="button"
          role="menuitem"
          :disabled="!canExport"
          @click="exportImage('jpg')"
        >
          {{ t(textKeys.nsplateExportJpg) }}
        </button>
        <button
          class="nsplate-workbench-actions__button"
          type="button"
          role="menuitem"
          :disabled="!canExport"
          @click="exportLayeredZip"
        >
          {{ t(textKeys.nsplateExportLayeredZip) }}
        </button>
      </div>
    </div>

    <AppStatus
      v-if="exportErrorText"
      class="nsplate-workbench-actions__status"
      compact
      tone="danger"
      :message="exportErrorText"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type { NSPlateCanvasExportFormat } from '@/lib/plate/exportCanvas'
import { useLocale } from '@/stores/locale'

defineProps<{
  canImportConfig: boolean
  canExport: boolean
  exportErrorText: string
}>()

const emit = defineEmits<{
  'import-config': []
  'paste-config': []
  'copy-config': []
  'export-config': []
  'export-image': [payload: { format: NSPlateCanvasExportFormat; scale: number }]
  'export-layered-zip': [payload: { scale: number }]
}>()

const { t } = useLocale()
const exportScale2x = ref(false)
const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function importConfig() {
  emit('import-config')
  closeMenu()
}

function pasteConfig() {
  emit('paste-config')
  closeMenu()
}

function copyConfig() {
  emit('copy-config')
  closeMenu()
}

function exportConfig() {
  emit('export-config')
  closeMenu()
}

function exportImage(format: NSPlateCanvasExportFormat) {
  emit('export-image', {
    format,
    scale: exportScale2x.value ? 2 : 1
  })
  closeMenu()
}

function exportLayeredZip() {
  emit('export-layered-zip', {
    scale: exportScale2x.value ? 2 : 1
  })
  closeMenu()
}
</script>

<style scoped>
.nsplate-workbench-actions {
  position: relative;
  display: grid;
  gap: 6px;
  justify-items: end;
}

.nsplate-workbench-actions__trigger {
  display: inline-grid;
  width: 36px;
  height: 34px;
  place-items: center;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-pixel-soft-shadow);
  cursor: pointer;
}

.nsplate-workbench-actions__trigger:hover,
.nsplate-workbench-actions__trigger[data-open='true'] {
  background: color-mix(in srgb, var(--ns-color-cyan-soft) 72%, var(--ns-color-surface-solid));
}

.nsplate-workbench-actions__icon {
  display: inline-grid;
  width: 18px;
  height: 18px;
  place-items: center;
  color: var(--ns-color-text);
  image-rendering: pixelated;
}

.nsplate-workbench-actions__icon svg {
  width: 18px;
  height: 18px;
}

.nsplate-workbench-actions__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 6;
  display: grid;
  width: min(304px, calc(100vw - 28px));
  gap: 8px;
  padding: 8px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsplate-workbench-actions__group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsplate-workbench-actions__button,
.nsplate-workbench-actions__toggle {
  min-width: 0;
  min-height: 32px;
  padding: 0 8px;
  border: 0;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 11px;
  font-weight: 950;
  text-align: center;
  white-space: nowrap;
}

.nsplate-workbench-actions__button {
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.nsplate-workbench-actions__button:nth-child(2n),
.nsplate-workbench-actions__toggle + .nsplate-workbench-actions__button,
.nsplate-workbench-actions__button + .nsplate-workbench-actions__toggle {
  border-left: 2px solid var(--ns-pixel-border);
}

.nsplate-workbench-actions__button:nth-child(n + 3),
.nsplate-workbench-actions__toggle:nth-child(n + 3) {
  border-top: 2px solid var(--ns-pixel-border);
}

.nsplate-workbench-actions__button:hover:not(:disabled) {
  color: var(--ns-color-danger);
}

.nsplate-workbench-actions__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.nsplate-workbench-actions__toggle input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--ns-color-accent);
}

.nsplate-workbench-actions__button:disabled,
.nsplate-workbench-actions__toggle:has(input:disabled) {
  opacity: 0.46;
  cursor: not-allowed;
}

.nsplate-workbench-actions__status {
  min-width: 0;
  justify-self: stretch;
}

@media (max-width: 420px) {
  .nsplate-workbench-actions__group {
    grid-template-columns: 1fr;
  }

  .nsplate-workbench-actions__button:nth-child(2n),
  .nsplate-workbench-actions__toggle + .nsplate-workbench-actions__button,
  .nsplate-workbench-actions__button + .nsplate-workbench-actions__toggle {
    border-left: 0;
  }

  .nsplate-workbench-actions__button + .nsplate-workbench-actions__button,
  .nsplate-workbench-actions__toggle + .nsplate-workbench-actions__button {
    border-top: 2px solid var(--ns-pixel-border);
  }
}
</style>
