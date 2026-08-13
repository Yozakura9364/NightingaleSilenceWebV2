<template>
  <section class="card-preview">
    <header class="card-preview__toolbar ns-panel">
      <div class="card-preview__view-tabs">
        <AppTabs
          :model-value="activeView"
          :items="previewViews"
          stretch
          density="compact"
          :aria-label="t(textKeys.previewTitle)"
          @update:model-value="updatePreviewView"
        />
      </div>
      <div class="card-preview__floating-actions">
        <div v-if="activeView === 'canvas'" class="card-preview__canvas-menu">
          <button
            type="button"
            class="card-preview__action"
            :aria-expanded="canvasLayerMenuOpen"
            aria-controls="item-card-canvas-layer-menu"
            @pointerdown.stop
            @click.stop="canvasLayerMenuOpen = !canvasLayerMenuOpen"
          >
            {{ t(textKeys.canvasLayers) }}
          </button>
          <div
            id="item-card-canvas-layer-menu-host"
            ref="canvasLayerMenuHost"
            class="card-preview__canvas-menu-host"
          />
        </div>
        <button
          v-if="activeView === 'cards'"
          type="button"
          class="card-preview__action"
          :disabled="!entries.length || exporting"
          @click="downloadZip"
        >
          {{ t(textKeys.downloadZip) }}
        </button>
      </div>
    </header>

    <ItemCardCanvasBoard
      v-if="activeView === 'canvas'"
      :entries="entries"
      :draft="draft"
      :settings="settings"
      :layouts="layouts"
      :api-base="apiBase"
      :layer-menu-open="canvasLayerMenuOpen"
    />

    <template v-else>
      <section v-if="entries.length" class="card-preview__list">
        <header class="card-preview__list-header">
          <h3>{{ t(textKeys.listPreview) }}</h3>
          <div class="card-preview__list-actions">
            <button
              type="button"
              class="card-preview__action"
              :disabled="exporting"
              @click="downloadList"
            >
              {{ t(textKeys.downloadPng) }}
            </button>
          </div>
        </header>
        <div
          class="card-preview__list-canvas ns-transparency-grid ns-scroll-area ns-scroll-area--compact"
        >
          <canvas ref="listCanvasElement" />
        </div>
      </section>

      <section v-if="entries.length" class="card-preview__singles">
        <h3>{{ t(textKeys.singlePreviews) }}</h3>
        <ItemCardCanvas
          v-for="(entry, index) in entries"
          :key="getItemCardRowId(entry)"
          :entry="entry"
          :draft="draft"
          :settings="settings"
          :layout="layoutFor(entry)"
          :api-base="apiBase"
          :index="index"
        />
      </section>

      <section v-if="customTextItems.length" class="card-preview__custom-text">
        <h3>{{ t(textKeys.customTextPanel) }}</h3>
        <ItemCardCustomTextCanvas
          v-for="(item, index) in customTextItems"
          :key="item.id"
          :item="item"
          :settings="settings"
          :index="index"
        />
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppTabs from '@/components/AppTabs.vue'
import ItemCardCanvasBoard from '@/pages/item-card/components/ItemCardCanvasBoard.vue'
import ItemCardCanvas from '@/pages/item-card/components/ItemCardCanvas.vue'
import ItemCardCustomTextCanvas from '@/pages/item-card/components/ItemCardCustomTextCanvas.vue'
import { useItemCardCustomText } from '@/pages/item-card/composables/useItemCardCustomText'
import {
  canvasToBlob,
  downloadBlob,
  makeItemCardFileName,
  renderItemCardCanvas,
  renderItemListCanvas,
  resolveItemCardLayout
} from '@/pages/item-card/lib/cardRenderer'
import { createZip } from '@/pages/item-card/lib/zip'
import { getItemCardRowId } from '@/pages/item-card/lib/equipment'
import type {
  GlamourDraft,
  GlamourEquipmentEntry,
  ItemCardLayout,
  ItemCardRenderSettings
} from '@/pages/item-card/lib/types'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

type ItemCardPreviewView = 'cards' | 'canvas'

const props = defineProps<{
  activeView: ItemCardPreviewView
  entries: GlamourEquipmentEntry[]
  draft: GlamourDraft
  settings: ItemCardRenderSettings
  layouts: Record<string, ItemCardLayout>
  apiBase: string
}>()

const emit = defineEmits<{
  'update-view': [view: ItemCardPreviewView]
}>()

const { t } = useLocale()
const { items: customTextItems } = useItemCardCustomText()
const previewViews = computed(() => [
  { value: 'cards', label: t(textKeys.previewCards) },
  { value: 'canvas', label: t(textKeys.canvasPanel) }
])
const listCanvasElement = ref<HTMLCanvasElement | null>(null)
const exporting = ref(false)
const canvasLayerMenuOpen = ref(false)
const canvasLayerMenuHost = ref<HTMLElement | null>(null)
let renderId = 0

function updatePreviewView(value: string) {
  if (value === 'cards' || value === 'canvas') {
    if (value !== 'canvas') {
      canvasLayerMenuOpen.value = false
    }
    emit('update-view', value)
  }
}

watch(
  () => [props.entries, props.draft.locale, props.settings, props.layouts],
  () => void renderList(),
  { deep: true }
)
onMounted(() => void renderList())
onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})

function onDocumentPointerDown(event: PointerEvent) {
  if (!canvasLayerMenuOpen.value || canvasLayerMenuHost.value?.contains(event.target as Node)) {
    return
  }
  canvasLayerMenuOpen.value = false
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    canvasLayerMenuOpen.value = false
  }
}

function layoutFor(entry: GlamourEquipmentEntry): ItemCardLayout {
  return resolveItemCardLayout(entry, props.layouts)
}

async function makeListCanvas() {
  return renderItemListCanvas({
    entries: props.entries,
    draft: props.draft,
    settings: props.settings,
    layouts: props.layouts,
    apiBase: props.apiBase
  })
}

async function renderList() {
  if (!props.entries.length) {
    return
  }
  const taskId = ++renderId
  const rendered = await makeListCanvas()
  if (taskId !== renderId || !listCanvasElement.value) {
    return
  }
  const canvas = listCanvasElement.value
  canvas.width = rendered.width
  canvas.height = rendered.height
  canvas.style.width = rendered.style.width
  canvas.style.height = rendered.style.height
  canvas.getContext('2d')?.drawImage(rendered, 0, 0)
}

async function downloadList() {
  exporting.value = true
  try {
    downloadBlob(await canvasToBlob(await makeListCanvas()), 'item-card-list.png')
  } finally {
    exporting.value = false
  }
}

async function downloadZip() {
  exporting.value = true
  try {
    const files = []
    for (const [index, entry] of props.entries.entries()) {
      const canvas = await renderItemCardCanvas({
        entry,
        draft: props.draft,
        settings: props.settings,
        layout: layoutFor(entry),
        apiBase: props.apiBase
      })
      files.push({
        name: makeItemCardFileName(entry, props.draft, index),
        data: new Uint8Array(await (await canvasToBlob(canvas)).arrayBuffer())
      })
    }
    downloadBlob(createZip(files), 'item-cards.zip')
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.card-preview {
  display: grid;
  align-content: start;
  gap: 16px;
  min-width: 0;
  padding: 14px;
}

.card-preview__toolbar {
  position: sticky;
  z-index: 10;
  top: 0;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 10px;
  box-shadow: none;
}

.card-preview__view-tabs {
  display: grid;
  flex: 1 1 auto;
  gap: 4px;
  min-width: 0;
}

.card-preview__floating-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.card-preview__canvas-menu {
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.card-preview__canvas-menu-host {
  position: static;
}

.card-preview h3 {
  margin: 0;
  font-family: var(--ns-font-ui);
}

.card-preview h3 {
  font-size: 13px;
}

.card-preview__action {
  min-height: 34px;
  padding: 4px 12px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-shadow-soft);
  color: var(--ns-color-text);
  font: 700 11px/1.15 var(--ns-font-ui);
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color var(--ns-transition-fast),
    background var(--ns-transition-fast),
    color var(--ns-transition-fast);
}

.card-preview__action:hover:not(:disabled),
.card-preview__action:focus-visible {
  border-color: var(--ns-color-accent);
  background: var(--ns-color-surface-tint);
  color: var(--ns-color-text);
  outline: 0;
}

.card-preview__action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.card-preview__list,
.card-preview__singles,
.card-preview__custom-text {
  display: grid;
  gap: 10px;
}

.card-preview__list {
  padding: 12px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface);
}

.card-preview__list-header {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-preview__list-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
}

.card-preview__list-canvas {
  min-width: 0;
  padding: 14px;
}

.card-preview__list-canvas canvas {
  display: block;
  max-width: 100%;
  height: auto !important;
}

@media (max-width: 720px) {
  .card-preview__toolbar {
    position: static;
    align-items: stretch;
    flex-direction: column;
  }

  .card-preview__floating-actions {
    justify-content: flex-end;
  }
}
</style>
