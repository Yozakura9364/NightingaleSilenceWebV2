<template>
  <footer class="nsplate-canvas-footer">
    <div class="nsplate-canvas-status" role="toolbar" :aria-label="toolbarLabel">
      <button
        class="nsplate-canvas-status__button nsplate-canvas-status__button--icon"
        type="button"
        :disabled="!canZoomOut"
        :aria-label="t(textKeys.nsplateCanvasZoomOut)"
        :title="t(textKeys.nsplateCanvasZoomOut)"
        @click="emit('zoom-out')"
      >
        -
      </button>
      <output class="nsplate-canvas-status__zoom" :aria-label="t(textKeys.nsplateCanvasZoomLabel)">
        {{ zoomLabel }}
      </output>
      <button
        class="nsplate-canvas-status__button nsplate-canvas-status__button--icon"
        type="button"
        :disabled="!canZoomIn"
        :aria-label="t(textKeys.nsplateCanvasZoomIn)"
        :title="t(textKeys.nsplateCanvasZoomIn)"
        @click="emit('zoom-in')"
      >
        +
      </button>
      <button
        class="nsplate-canvas-status__button nsplate-canvas-status__button--fit"
        type="button"
        :aria-label="t(textKeys.nsplateCanvasResetView)"
        :title="t(textKeys.nsplateCanvasResetView)"
        @click="emit('reset-view')"
      >
        {{ t(textKeys.nsplateCanvasResetView) }}
      </button>
      <button
        class="nsplate-canvas-status__button nsplate-canvas-status__button--clear"
        type="button"
        :disabled="!canClearMaterials"
        @click="clearMaterials"
      >
        {{ t(textKeys.nsplateClearAllSelections) }}
      </button>
      <button
        class="nsplate-canvas-status__button nsplate-canvas-status__button--clear"
        type="button"
        :disabled="!canClearCustomPortrait"
        @click="clearCustomPortrait"
      >
        {{ t(textKeys.nsplateCustomPortraitClear) }}
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { plateTextKeys as textKeys } from '@/locales/keys/plate'
import { useLocale } from '@/stores/locale'
import { useDialog } from '@/composables/useDialog'
import { computed } from 'vue'

const props = defineProps<{
  canZoomIn: boolean
  canZoomOut: boolean
  zoomLabel: string
  canClearCustomPortrait: boolean
  canClearMaterials: boolean
}>()

const emit = defineEmits<{
  'zoom-in': []
  'zoom-out': []
  'reset-view': []
  'clear-custom-portrait': []
  'clear-materials': []
}>()

const { t } = useLocale()
const dialog = useDialog()
const toolbarLabel = computed(
  () => `${t(textKeys.nsplateCanvasViewportToolbar)} / ${t(textKeys.nsplateCanvasClearToolbar)}`
)

async function clearCustomPortrait() {
  if (!props.canClearCustomPortrait) {
    return
  }

  const confirmed = await dialog.confirm(t(textKeys.nsplateCustomPortraitClearConfirm))
  if (!confirmed) {
    return
  }

  emit('clear-custom-portrait')
}

async function clearMaterials() {
  if (!props.canClearMaterials) {
    return
  }

  const confirmed = await dialog.confirm(t(textKeys.nsplateClearAllSelectionsConfirm))
  if (!confirmed) {
    return
  }

  emit('clear-materials')
}
</script>

<style scoped>
.nsplate-canvas-footer {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: center;
  justify-items: center;
  padding-top: 10px;
}

.nsplate-canvas-status {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 0;
  max-width: 100%;
  margin: 0;
  padding: 0;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsplate-canvas-status__button {
  min-width: 0;
  min-height: 28px;
  padding: 0 9px;
  overflow: hidden;
  border: 0;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 11px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.nsplate-canvas-status__button--icon {
  width: 28px;
  padding: 0;
  font-size: 14px;
  line-height: 1;
}

.nsplate-canvas-status__button--fit {
  padding: 0 9px;
}

.nsplate-canvas-status__button--clear {
  padding: 0 10px;
}

.nsplate-canvas-status__zoom {
  display: inline-grid;
  min-width: 50px;
  min-height: 28px;
  place-items: center;
  border-left: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 11px;
  font-weight: 950;
  white-space: nowrap;
}

.nsplate-canvas-status__button + .nsplate-canvas-status__button,
.nsplate-canvas-status__zoom + .nsplate-canvas-status__button {
  border-left: 2px solid var(--ns-pixel-border);
}

.nsplate-canvas-status__button:hover:not(:disabled) {
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-danger);
}

.nsplate-canvas-status__button:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}

@media (max-width: 560px) {
  .nsplate-canvas-status {
    max-width: calc(100% - 16px);
  }

  .nsplate-canvas-status__button {
    min-height: 26px;
    padding: 0 7px;
    font-size: 10px;
  }

  .nsplate-canvas-status__button--icon {
    width: 26px;
    padding: 0;
  }

  .nsplate-canvas-status__zoom {
    min-width: 46px;
    min-height: 26px;
    font-size: 10px;
  }
}
</style>
