<template>
  <section class="canvas-board">
    <p v-if="statusKey" class="canvas-board__status">{{ t(statusKey) }}</p>

    <div
      ref="viewportElement"
      class="canvas-board__viewport"
      :class="{
        'canvas-board__viewport--ready': background,
        'canvas-board__viewport--empty': !background,
        'canvas-board__viewport--drag-active': dragActive
      }"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerdown="onViewportPointerDown"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div v-if="!background" class="canvas-board__empty">
        <p>{{ t(textKeys.canvasEmpty) }}</p>
        <span>{{ t(textKeys.canvasDropHint) }}</span>
      </div>
      <div v-else class="canvas-board__scene" :style="sceneStyle">
        <img
          class="canvas-board__bg"
          :src="backgroundUrl"
          :width="background.width"
          :height="background.height"
          alt=""
          draggable="false"
        />
        <img
          v-for="layer in layers"
          :key="layer.id"
          class="canvas-board__layer"
          :class="{ 'canvas-board__layer--selected': layer.id === selectedLayerId }"
          :src="layerUrls[layer.id]"
          :style="layerStyle(layer)"
          alt=""
          draggable="false"
          @pointerdown.stop="onLayerPointerDown($event, layer)"
        />
      </div>
      <button
        v-if="selectedLayer"
        type="button"
        class="canvas-board__scale-handle"
        :style="scaleHandleStyle(selectedLayer)"
        :aria-label="t(textKeys.canvasLayerScale)"
        @pointerdown.stop="onScaleHandlePointerDown($event, selectedLayer)"
      />
      <button
        v-if="selectedLayer"
        type="button"
        class="canvas-board__delete-handle"
        :style="deleteHandleStyle(selectedLayer)"
        :aria-label="t(textKeys.canvasLayerDelete)"
        :title="t(textKeys.canvasLayerDelete)"
        @pointerdown.stop
        @click.stop="removeLayer(selectedLayer.id)"
      >
        ×
      </button>
    </div>

    <p v-if="background && !layers.length" class="canvas-board__guide">
      {{ t(textKeys.canvasDropContentHint) }}
    </p>

    <ItemCardCanvasLayerMenu
      :open="layerMenuOpen"
      :display-layers="displayLayers"
      :selected-layer-id="selectedLayerId"
      :drag-source-id="layerListDragSourceId"
      :drag-target-id="layerListDragTargetId"
      @select="selectLayer"
      @remove="removeLayer"
      @scale-input="onLayerScaleInput"
      @scale-value-change="onLayerScaleValueChange"
      @coordinate-input="onLayerCoordinateInput"
      @list-drag-start="onLayerListDragStart"
      @list-drag-over="onLayerListDragOver"
      @list-drop="onLayerListDrop"
      @list-drag-end="clearLayerListDrag"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ItemCardCanvasLayerMenu from '@/pages/item-card/components/ItemCardCanvasLayerMenu.vue'
import { canvasToBlob, renderItemCardCanvas } from '@/pages/item-card/lib/cardRenderer'
import {
  fitViewport,
  getCanvasDisplaySize,
  imageToViewport,
  viewportToImage
} from '@/pages/item-card/lib/canvasComposer'
import type { ItemCardCanvasPoint } from '@/pages/item-card/lib/canvasComposer'
import type { ItemCardCanvasLayer } from '@/pages/item-card/lib/canvasTypes'
import { renderCustomTextCanvas } from '@/pages/item-card/lib/customTextRenderer'
import {
  ITEM_CARD_CANVAS_DRAG_MIME,
  decodeItemCardCanvasDragSource
} from '@/pages/item-card/lib/canvasDrag'
import {
  getCandidateName,
  getItemCardRowId,
  getSelectedCandidate
} from '@/pages/item-card/lib/equipment'
import type {
  GlamourDraft,
  GlamourEquipmentEntry,
  ItemCardCustomText,
  ItemCardLayout,
  ItemCardRenderSettings
} from '@/pages/item-card/lib/types'
import { useItemCardCanvas } from '@/pages/item-card/composables/useItemCardCanvas'
import { useItemCardCanvasPointer } from '@/pages/item-card/composables/useItemCardCanvasPointer'
import { useItemCardCustomText } from '@/pages/item-card/composables/useItemCardCustomText'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
const props = defineProps<{
  entries: GlamourEquipmentEntry[]
  draft: GlamourDraft
  settings: ItemCardRenderSettings
  layouts: Record<string, ItemCardLayout>
  apiBase: string
  layerMenuOpen: boolean
}>()
const {
  canvasDocument,
  backgroundUrl,
  layerUrls,
  orderedLayers,
  ensureRestored,
  addLayer,
  setBackgroundFromFile,
  updateLayer,
  updateLayerContent,
  setLayerScale,
  removeLayer,
  moveLayerToIndex,
  selectLayer,
  setViewport
} = useItemCardCanvas()
const { items: customTextItems } = useItemCardCustomText()

const viewportElement = ref<HTMLElement | null>(null)
const statusKey = ref('')
const dragActive = ref(false)
const layerListDragSourceId = ref('')
const layerListDragTargetId = ref('')
let dragDepth = 0
let resizeObserver: ResizeObserver | null = null
let layerRenderId = 0

const background = computed(() => canvasDocument.value.background || null)
const layers = computed(() => canvasDocument.value.layers)
const selectedLayerId = computed(() => canvasDocument.value.selectedLayerId || '')
const selectedLayer = computed(
  () => layers.value.find((layer) => layer.id === selectedLayerId.value) || null
)
const viewport = computed(() => canvasDocument.value.viewport)
// 列表从上到下按“最上层优先”展示，与画布中的遮挡关系一致。
const displayLayers = computed(() => [...orderedLayers.value].reverse())

const {
  viewportPoint,
  onLayerPointerDown,
  onScaleHandlePointerDown,
  onPointerMove,
  onPointerUp
} = useItemCardCanvasPointer({
  viewportElement,
  viewport,
  selectLayer,
  updateLayer,
  setLayerScale
})

const sceneStyle = computed(() => ({
  width: `${background.value?.width || 0}px`,
  height: `${background.value?.height || 0}px`,
  transform: `translate(${viewport.value.offsetX}px, ${viewport.value.offsetY}px) scale(${viewport.value.zoom})`
}))

onMounted(async () => {
  await ensureRestored()
  await refreshLayerContents()
  await nextTick()
  if (background.value) {
    fitToView()
  }
  if (viewportElement.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (background.value) {
        fitToView()
      }
    })
    resizeObserver.observe(viewportElement.value)
  }
})

watch(
  [
    () => props.settings,
    () => props.layouts,
    () => props.entries,
    () => props.draft,
    customTextItems
  ],
  () => {
    void refreshLayerContents()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

watch(background, async (current) => {
  if (!current) {
    return
  }
  await nextTick()
  fitToView()
})

function layerStyle(layer: ItemCardCanvasLayer) {
  return {
    left: `${layer.x}px`,
    top: `${layer.y}px`,
    width: `${layer.width * layer.scale}px`,
    height: `${layer.height * layer.scale}px`
  }
}

function scaleHandleStyle(layer: ItemCardCanvasLayer) {
  const corner = imageToViewport(
    {
      x: layer.x + layer.width * layer.scale,
      y: layer.y + layer.height * layer.scale
    },
    viewport.value
  )
  return {
    left: `${corner.x}px`,
    top: `${corner.y}px`
  }
}

function deleteHandleStyle(layer: ItemCardCanvasLayer) {
  const corner = imageToViewport(
    {
      x: layer.x + layer.width * layer.scale,
      y: layer.y
    },
    viewport.value
  )
  return {
    left: `${corner.x}px`,
    top: `${corner.y}px`
  }
}

function layoutFor(entry: GlamourEquipmentEntry): ItemCardLayout {
  const layout = props.layouts[getItemCardRowId(entry)] ?? props.layouts[entry.slot]
  return layout === 'right' ? 'right' : 'left'
}

function entryTitle(entry: GlamourEquipmentEntry): string {
  return getCandidateName(
    getSelectedCandidate(entry),
    props.draft.locale,
    props.draft.source.locale
  )
}

async function refreshLayerContents() {
  await ensureRestored()
  const taskId = ++layerRenderId
  const currentLayers = [...canvasDocument.value.layers]
  if (!currentLayers.length) {
    return
  }

  let failed = false
  await Promise.all(
    currentLayers.map(async (layer) => {
      try {
        let canvas: HTMLCanvasElement | undefined
        if (layer.type === 'item') {
          const entry = props.entries.find(
            (candidate) => getItemCardRowId(candidate) === layer.sourceId
          )
          if (!entry) {
            return
          }
          canvas = await renderItemCardCanvas({
            entry,
            draft: props.draft,
            settings: props.settings,
            layout: layoutFor(entry),
            apiBase: props.apiBase
          })
        } else {
          const item = customTextItems.value.find((candidate) => candidate.id === layer.sourceId)
          if (!item) {
            return
          }
          canvas = await renderCustomTextCanvas(item.text, props.settings)
        }

        if (taskId !== layerRenderId) {
          return
        }
        const displaySize = getCanvasDisplaySize(canvas)
        updateLayerContent(layer.id, {
          blob: await canvasToBlob(canvas),
          width: displaySize.width,
          height: displaySize.height
        })
      } catch {
        failed = true
      }
    })
  )

  if (taskId === layerRenderId) {
    statusKey.value = failed ? textKeys.canvasErrorRead : ''
  }
}

function layerPositionAtDrop(
  displaySize: { width: number; height: number },
  dropPoint?: ItemCardCanvasPoint
): { x?: number; y?: number } {
  if (!dropPoint) {
    return {}
  }
  return {
    x: dropPoint.x - displaySize.width / 2,
    y: dropPoint.y - displaySize.height / 2
  }
}async function addEntryToCanvas(entry: GlamourEquipmentEntry, dropPoint?: ItemCardCanvasPoint) {
  if (!background.value) {
    return
  }
  try {
    const canvas = await renderItemCardCanvas({
      entry,
      draft: props.draft,
      settings: props.settings,
      layout: layoutFor(entry),
      apiBase: props.apiBase
    })
    const displaySize = getCanvasDisplaySize(canvas)
    await addLayer({
      name: entryTitle(entry),
      type: 'item',
      sourceId: getItemCardRowId(entry),
      blob: await canvasToBlob(canvas),
      width: displaySize.width,
      height: displaySize.height,
      ...layerPositionAtDrop(displaySize, dropPoint)
    })
    statusKey.value = ''
  } catch {
    statusKey.value = textKeys.canvasErrorRead
  }
}

async function addCustomTextToCanvas(item: ItemCardCustomText, dropPoint?: ItemCardCanvasPoint) {
  if (!background.value) {
    return
  }
  try {
    const canvas = await renderCustomTextCanvas(item.text, props.settings)
    const displaySize = getCanvasDisplaySize(canvas)
    await addLayer({
      name: item.text.split(/\r?\n/, 1)[0] || item.text,
      type: 'customText',
      sourceId: item.id,
      blob: await canvasToBlob(canvas),
      width: displaySize.width,
      height: displaySize.height,
      ...layerPositionAtDrop(displaySize, dropPoint)
    })
    statusKey.value = ''
  } catch {
    statusKey.value = textKeys.canvasErrorRead
  }
}

function onDrop(event: DragEvent) {
  clearDragActive()
  const source = decodeItemCardCanvasDragSource(
    event.dataTransfer?.getData(ITEM_CARD_CANVAS_DRAG_MIME)
  )
  if (source) {
    if (!background.value) {
      statusKey.value = textKeys.canvasEmpty
      return
    }
    const dropPoint = viewportToImage(viewportPoint(event), viewport.value)
    void addDraggedSource(source, dropPoint)
    return
  }
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    void handleFile(file)
  }
}

async function addDraggedSource(
  source: NonNullable<ReturnType<typeof decodeItemCardCanvasDragSource>>,
  dropPoint: ItemCardCanvasPoint
) {
  if (source.kind === 'item') {
    const entry = props.entries.find((candidate) => getItemCardRowId(candidate) === source.sourceId)
    if (entry) {
      await addEntryToCanvas(entry, dropPoint)
    }
    return
  }
  const item = customTextItems.value.find((candidate) => candidate.id === source.sourceId)
  if (item) {
    await addCustomTextToCanvas(item, dropPoint)
  }
}

function hasCanvasSource(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types.includes(ITEM_CARD_CANVAS_DRAG_MIME))
}

function onDragEnter(event: DragEvent) {
  if (!hasCanvasSource(event)) {
    return
  }
  dragDepth += 1
  dragActive.value = true
}

function onDragOver(event: DragEvent) {
  if (hasCanvasSource(event) && event.dataTransfer) {
    event.dataTransfer.dropEffect = background.value ? 'copy' : 'none'
  }
}

function onDragLeave(event: DragEvent) {
  if (!hasCanvasSource(event)) {
    return
  }
  dragDepth = Math.max(0, dragDepth - 1)
  if (!dragDepth) {
    dragActive.value = false
  }
}

function clearDragActive() {
  dragDepth = 0
  dragActive.value = false
}

async function handleFile(file: File) {
  const result = await setBackgroundFromFile(file)
  if (result === 'ok') {
    statusKey.value = ''
    await nextTick()
    fitToView()
    return
  }
  statusKey.value =
    result === 'format'
      ? textKeys.canvasErrorFormat
      : result === 'tooLarge'
        ? textKeys.canvasErrorTooLarge
        : textKeys.canvasErrorRead
}

function fitToView() {
  if (!background.value || !viewportElement.value) {
    return
  }
  setViewport(
    fitViewport(
      {
        width: viewportElement.value.clientWidth,
        height: viewportElement.value.clientHeight
      },
      { width: background.value.width, height: background.value.height },
      0
    )
  )
}

// 图层与缩放手柄的 pointerdown 都已 stop 冒泡，能走到这里的就是空白区域点击。
function onViewportPointerDown() {
  selectLayer(undefined)
}

function onLayerScaleInput(layer: ItemCardCanvasLayer, event: Event) {
  setLayerScale(layer.id, Number((event.currentTarget as HTMLInputElement).value))
}

function onLayerScaleValueChange(layer: ItemCardCanvasLayer, event: Event) {
  const value = Number((event.currentTarget as HTMLInputElement).value)
  if (!Number.isFinite(value)) {
    return
  }
  setLayerScale(layer.id, value / 100)
}

function onLayerCoordinateInput(layer: ItemCardCanvasLayer, axis: 'x' | 'y', event: Event) {
  const value = Number((event.currentTarget as HTMLInputElement).value)
  if (!Number.isFinite(value)) {
    return
  }
  updateLayer(layer.id, axis === 'x' ? { x: Math.round(value) } : { y: Math.round(value) })
}

function onLayerListDragStart(event: DragEvent, layer: ItemCardCanvasLayer) {
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLButtonElement
  ) {
    event.preventDefault()
    return
  }
  layerListDragSourceId.value = layer.id
  event.dataTransfer?.setData('text/plain', layer.id)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onLayerListDragOver(event: DragEvent, layer: ItemCardCanvasLayer) {
  if (!layerListDragSourceId.value || layerListDragSourceId.value === layer.id) {
    return
  }
  layerListDragTargetId.value = layer.id
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onLayerListDrop(targetLayer: ItemCardCanvasLayer) {
  const sourceLayerId = layerListDragSourceId.value
  const sourceIndex = displayLayers.value.findIndex((layer) => layer.id === sourceLayerId)
  const targetIndex = displayLayers.value.findIndex((layer) => layer.id === targetLayer.id)
  clearLayerListDrag()
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return
  }
  moveLayerToIndex(sourceLayerId, displayLayers.value.length - targetIndex - 1)
}

function clearLayerListDrag() {
  layerListDragSourceId.value = ''
  layerListDragTargetId.value = ''
}
</script>

<style scoped>
.canvas-board {
  position: relative;
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 0 14px 14px;
}

.canvas-board__status {
  margin: 0;
  color: var(--ns-color-danger, #b4453c);
  font-size: 12px;
}

.canvas-board__guide {
  margin: -2px 0 0;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  line-height: 1.5;
}

.canvas-board__viewport {
  position: relative;
  min-width: 0;
  width: 100%;
  height: clamp(360px, calc(100vh - 170px), 1000px);
  overflow: hidden;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
  touch-action: none;
  user-select: none;
}

.canvas-board__viewport--ready {
  width: 100%;
}

.canvas-board__viewport--empty {
  background: var(--ns-color-surface);
}

.canvas-board__viewport--drag-active {
  border-color: var(--ns-color-accent);
  box-shadow: inset 0 0 0 2px var(--ns-color-accent-soft);
}

.canvas-board__empty {
  display: grid;
  gap: 10px;
  margin: 0;
  height: 100%;
  place-content: center;
  justify-items: center;
  padding: 24px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  line-height: 1.8;
  text-align: center;
  pointer-events: none;
}

.canvas-board__empty p,
.canvas-board__empty span {
  margin: 0;
}

.canvas-board__scene {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}

.canvas-board__bg {
  display: block;
}

.canvas-board__layer {
  position: absolute;
  cursor: grab;
}

.canvas-board__layer--selected {
  outline: 2px solid var(--ns-color-accent);
  outline-offset: 1px;
}

.canvas-board__scale-handle {
  position: absolute;
  z-index: 6;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 2px solid var(--ns-color-accent);
  border-radius: 0;
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-pixel-soft-shadow);
  cursor: nwse-resize;
  touch-action: none;
  transform: translate(-50%, -50%);
}

.canvas-board__scale-handle:hover,
.canvas-board__scale-handle:focus-visible {
  background: var(--ns-color-accent);
  outline: 0;
}

.canvas-board__delete-handle {
  position: absolute;
  z-index: 6;
  display: grid;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 2px solid var(--ns-color-danger, #b4453c);
  border-radius: 0;
  place-items: center;
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-pixel-soft-shadow);
  color: var(--ns-color-danger, #b4453c);
  font: 700 14px/1 var(--ns-font-ui);
  cursor: pointer;
  touch-action: none;
  transform: translate(-50%, -50%);
}

.canvas-board__delete-handle:hover,
.canvas-board__delete-handle:focus-visible {
  background: var(--ns-color-danger, #b4453c);
  color: var(--ns-color-surface-solid);
  outline: 0;
}
</style>
