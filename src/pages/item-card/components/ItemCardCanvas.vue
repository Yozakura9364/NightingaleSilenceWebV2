<template>
  <article class="card-preview-row">
    <header>
      <strong>{{ title }}</strong>
      <div class="card-preview-row__actions">
        <div class="card-preview-row__segment">
          <button
            type="button"
            :class="{ active: layout === 'left' }"
            @click="emit('set-layout', 'left')"
          >
            {{ t(textKeys.layoutLeft) }}
          </button>
          <button
            type="button"
            :class="{ active: layout === 'right' }"
            @click="emit('set-layout', 'right')"
          >
            {{ t(textKeys.layoutRight) }}
          </button>
        </div>
        <button type="button" class="card-preview-row__download" @click="download">
          {{ t(textKeys.downloadPng) }}
        </button>
      </div>
    </header>
    <div class="card-preview-row__canvas">
      <canvas ref="canvasElement" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  canvasToBlob,
  downloadBlob,
  makeItemCardFileName,
  renderItemCardCanvas
} from '@/pages/item-card/lib/cardRenderer'
import { getCandidateName, getSelectedCandidate } from '@/pages/item-card/lib/equipment'
import type {
  GlamourDraft,
  GlamourEquipmentEntry,
  ItemCardLayout,
  ItemCardRenderSettings
} from '@/pages/item-card/lib/types'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  entry: GlamourEquipmentEntry
  draft: GlamourDraft
  settings: ItemCardRenderSettings
  layout: ItemCardLayout
  apiBase: string
  index: number
}>()

const emit = defineEmits<{
  'set-layout': [layout: ItemCardLayout]
}>()

const { t } = useLocale()
const canvasElement = ref<HTMLCanvasElement | null>(null)
let renderId = 0
const title = computed(() =>
  getCandidateName(
    getSelectedCandidate(props.entry),
    props.draft.locale,
    props.draft.source.locale
  )
)

watch(
  () => [props.entry, props.draft.locale, props.settings, props.layout],
  () => void render(),
  { deep: true }
)
onMounted(() => void render())

async function makeCanvas() {
  return renderItemCardCanvas({
    entry: props.entry,
    draft: props.draft,
    settings: props.settings,
    layout: props.layout,
    apiBase: props.apiBase
  })
}

async function render() {
  const taskId = ++renderId
  const rendered = await makeCanvas()
  if (taskId !== renderId || !canvasElement.value) {
    return
  }
  const canvas = canvasElement.value
  canvas.width = rendered.width
  canvas.height = rendered.height
  canvas.style.width = rendered.style.width
  canvas.style.height = rendered.style.height
  canvas.getContext('2d')?.drawImage(rendered, 0, 0)
}

async function download() {
  const canvas = await makeCanvas()
  downloadBlob(
    await canvasToBlob(canvas),
    makeItemCardFileName(props.entry, props.draft, props.index)
  )
}
</script>

<style scoped>
.card-preview-row {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: 5px;
  background: var(--ns-color-surface);
}

.card-preview-row header,
.card-preview-row__actions,
.card-preview-row__segment {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.card-preview-row header {
  justify-content: space-between;
}

.card-preview-row header strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-preview-row__actions {
  flex: 0 0 auto;
}

.card-preview-row button {
  min-height: 25px;
  padding: 3px 7px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 700 10px var(--ns-font-sans);
  cursor: pointer;
}

.card-preview-row__segment {
  gap: 0;
}

.card-preview-row__segment button {
  border-radius: 0;
}

.card-preview-row__segment button + button {
  border-left: 0;
}

.card-preview-row__segment button.active {
  background: var(--ns-color-accent);
  color: var(--ns-color-on-accent);
}

.card-preview-row__canvas {
  min-width: 0;
  padding: 8px;
  overflow-x: auto;
  background-color: #ffffff;
  background-image: conic-gradient(#e8ebef 25%, #ffffff 0 50%, #e8ebef 0 75%, #ffffff 0);
  background-size: 16px 16px;
}

:global(:root[data-theme='night'] .card-preview-row__canvas) {
  background:
    linear-gradient(45deg, rgba(255, 255, 255, 0.04) 25%, transparent 25%) 0 0 / 14px 14px,
    linear-gradient(-45deg, rgba(255, 255, 255, 0.04) 25%, transparent 25%) 0 7px / 14px 14px,
    #252a32;
}

.card-preview-row canvas {
  display: block;
  max-width: none;
}

@media (max-width: 640px) {
  .card-preview-row header {
    align-items: stretch;
    flex-direction: column;
  }

  .card-preview-row__actions {
    justify-content: space-between;
  }
}
</style>
