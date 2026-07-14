<template>
  <section class="card-preview">
    <header class="card-preview__toolbar">
      <div class="card-preview__actions">
        <button type="button" @click="emit('open-import')">
          {{ t(textKeys.importAction) }}
        </button>
        <button type="button" :disabled="!entries.length" @click="emit('clear-draft')">
          {{ t(textKeys.nsglamourClearDraft) }}
        </button>
        <div class="card-preview__mode card-preview__segment" :aria-label="t(textKeys.modeLabel)">
          <button
            type="button"
            :class="{ active: settings.mode === 'compact' }"
            @click="emit('set-mode', 'compact')"
          >
            {{ t(textKeys.modeCompact) }}
          </button>
          <button
            type="button"
            :class="{ active: settings.mode === 'full' }"
            @click="emit('set-mode', 'full')"
          >
            {{ t(textKeys.modeFull) }}
          </button>
        </div>
        <div class="card-preview__segment">
          <button type="button" @click="emit('set-all-layouts', 'left')">
            {{ t(textKeys.allLeft) }}
          </button>
          <button type="button" @click="emit('set-all-layouts', 'right')">
            {{ t(textKeys.allRight) }}
          </button>
        </div>
        <button type="button" :disabled="!entries.length || exporting" @click="downloadZip">
          {{ t(textKeys.downloadZip) }}
        </button>
      </div>
    </header>

    <template v-if="entries.length">
      <section class="card-preview__list">
        <header class="card-preview__list-header">
          <h3>{{ t(textKeys.listPreview) }}</h3>
          <div class="card-preview__list-actions card-preview__segment">
            <button
              type="button"
              :class="{ active: listLayout === 'left' }"
              @click="emit('set-list-layout', 'left')"
            >
              {{ t(textKeys.layoutLeft) }}
            </button>
            <button
              type="button"
              :class="{ active: listLayout === 'right' }"
              @click="emit('set-list-layout', 'right')"
            >
              {{ t(textKeys.layoutRight) }}
            </button>
            <button type="button" :disabled="exporting" @click="downloadList">
              {{ t(textKeys.downloadPng) }}
            </button>
          </div>
        </header>
        <div class="card-preview__list-canvas">
          <canvas ref="listCanvasElement" />
        </div>
      </section>

      <section class="card-preview__singles">
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
          @set-layout="emit('set-layout', getItemCardRowId(entry), $event)"
        />
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import ItemCardCanvas from '@/pages/item-card/components/ItemCardCanvas.vue'
import {
  canvasToBlob,
  downloadBlob,
  makeItemCardFileName,
  renderItemCardCanvas,
  renderItemListCanvas
} from '@/pages/item-card/lib/cardRenderer'
import { createZip } from '@/pages/item-card/lib/zip'
import { getItemCardRowId } from '@/pages/item-card/lib/equipment'
import type {
  GlamourDraft,
  GlamourEquipmentEntry,
  ItemCardLayout,
  ItemCardMode,
  ItemCardRenderSettings
} from '@/pages/item-card/lib/types'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  entries: GlamourEquipmentEntry[]
  draft: GlamourDraft
  settings: ItemCardRenderSettings
  layouts: Record<string, ItemCardLayout>
  listLayout: ItemCardLayout
  apiBase: string
}>()

const emit = defineEmits<{
  'set-layout': [rowId: string, layout: ItemCardLayout]
  'set-all-layouts': [layout: ItemCardLayout]
  'set-list-layout': [layout: ItemCardLayout]
  'set-mode': [mode: ItemCardMode]
  'open-import': []
  'clear-draft': []
}>()

const { t } = useLocale()
const listCanvasElement = ref<HTMLCanvasElement | null>(null)
const exporting = ref(false)
let renderId = 0

watch(
  () => [props.entries, props.draft.locale, props.settings, props.listLayout],
  () => void renderList(),
  { deep: true }
)
onMounted(() => void renderList())

function layoutFor(entry: GlamourEquipmentEntry): ItemCardLayout {
  const layout = props.layouts[getItemCardRowId(entry)] ?? props.layouts[entry.slot]
  return layout === 'right' ? 'right' : 'left'
}

async function makeListCanvas() {
  return renderItemListCanvas({
    entries: props.entries,
    draft: props.draft,
    settings: props.settings,
    layout: props.listLayout,
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

.card-preview__toolbar,
.card-preview__actions,
.card-preview__segment {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.card-preview__toolbar {
  position: sticky;
  z-index: 10;
  top: 0;
  justify-content: flex-end;
  padding: 10px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bg);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.card-preview h3 {
  margin: 0;
  font-family: var(--ns-font-decorative);
}

.card-preview h3 {
  font-size: 13px;
}

.card-preview__actions {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.card-preview__list-actions button,
.card-preview__actions button {
  min-height: 28px;
  padding: 4px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 800 11px var(--ns-font-sans);
  cursor: pointer;
}

.card-preview__segment {
  gap: 0;
}

.card-preview__segment button {
  border-radius: 0;
}

.card-preview__segment button + button {
  border-left: 0;
}

.card-preview__mode button.active,
.card-preview__list-actions button.active {
  border-color: var(--ns-color-accent);
  background: var(--ns-color-accent);
  color: var(--ns-color-on-accent);
}

.card-preview__list-actions button:disabled,
.card-preview__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.card-preview__list,
.card-preview__singles {
  display: grid;
  gap: 10px;
}

.card-preview__list {
  padding: 12px;
  border: 1px solid var(--ns-color-border);
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
  overflow: auto;
  background-color: #ffffff;
  background-image: conic-gradient(#e8ebef 25%, #ffffff 0 50%, #e8ebef 0 75%, #ffffff 0);
  background-size: 16px 16px;
}

:global(:root[data-theme='night'] .card-preview__list-canvas) {
  background: #252a32;
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

  .card-preview__actions {
    justify-content: flex-start;
  }
}
</style>
