import { computed, ref, shallowRef, watch } from 'vue'
import {
  clampLayerScale,
  loadImageFromBlob,
  moveLayerToOrder,
  nextLayerZIndex,
  replaceLayerContent,
  sortedLayers
} from '@/pages/item-card/lib/canvasComposer'
import {
  clearItemCardCanvasDocument,
  createEmptyDocument,
  readItemCardCanvasDocument,
  writeItemCardCanvasDocument
} from '@/pages/item-card/lib/canvasStorage'
import type {
  ItemCardCanvasBackground,
  ItemCardCanvasDocument,
  ItemCardCanvasLayer,
  ItemCardCanvasLayerType,
  ItemCardCanvasViewport
} from '@/pages/item-card/lib/canvasTypes'

// 只接受浏览器能直接解码的常见位图格式。
const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
// 常见壁纸/截图约 2-8MB；超过 12MB 的图在解码和合成时会占用大量内存。
export const ITEM_CARD_CANVAS_MAX_FILE_BYTES = 12 * 1024 * 1024
// 单边 6000px 已覆盖常规背景；更大的图解码后位图可能占数百 MB 内存。
export const ITEM_CARD_CANVAS_MAX_IMAGE_SIDE = 6000

export type ItemCardCanvasBackgroundResult = 'ok' | 'format' | 'tooLarge' | 'readError'

export interface ItemCardCanvasLayerInput {
  name: string
  type: ItemCardCanvasLayerType
  sourceId: string
  blob: Blob
  width: number
  height: number
  x?: number
  y?: number
}

// 画布文档是模块级共享状态：左侧拖拽生成和画布页签操作的是同一份数据。
const canvasDocument = shallowRef<ItemCardCanvasDocument>(createEmptyDocument())
const storageAvailable = ref(true)
const restored = ref(false)
const backgroundUrl = ref('')
const layerUrls = shallowRef<Record<string, string>>({})

let restorePromise: Promise<void> | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

watch(canvasDocument, () => {
  schedulePersist()
})

function schedulePersist() {
  if (!restored.value) {
    return
  }
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  saveTimer = setTimeout(() => {
    saveTimer = null
    void persist()
  }, 400)
}

async function persist() {
  const saved = await writeItemCardCanvasDocument(canvasDocument.value)
  if (!saved) {
    // IndexedDB 不可用时降级为当前页面的内存状态。
    storageAvailable.value = false
  }
}

function revokeAllObjectUrls() {
  if (backgroundUrl.value) {
    URL.revokeObjectURL(backgroundUrl.value)
    backgroundUrl.value = ''
  }
  for (const url of Object.values(layerUrls.value)) {
    URL.revokeObjectURL(url)
  }
  layerUrls.value = {}
}

function rebuildObjectUrls(document: ItemCardCanvasDocument) {
  revokeAllObjectUrls()
  if (document.background) {
    backgroundUrl.value = URL.createObjectURL(document.background.blob)
  }
  layerUrls.value = Object.fromEntries(
    document.layers.map((layer) => [layer.id, URL.createObjectURL(layer.blob)])
  )
}

function setDocument(next: ItemCardCanvasDocument) {
  canvasDocument.value = next
}

async function ensureRestored() {
  restorePromise ||= (async () => {
    const stored = await readItemCardCanvasDocument()
    if (stored) {
      setDocument(stored)
    } else if (typeof window !== 'undefined' && !window.indexedDB) {
      storageAvailable.value = false
    }
    rebuildObjectUrls(canvasDocument.value)
    restored.value = true
  })()
  return restorePromise
}

async function setBackgroundFromFile(file: File): Promise<ItemCardCanvasBackgroundResult> {
  await ensureRestored()
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return 'format'
  }
  if (file.size > ITEM_CARD_CANVAS_MAX_FILE_BYTES) {
    return 'tooLarge'
  }
  let image: HTMLImageElement
  try {
    image = await loadImageFromBlob(file)
  } catch {
    return 'readError'
  }
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  if (
    !width ||
    !height ||
    width > ITEM_CARD_CANVAS_MAX_IMAGE_SIDE ||
    height > ITEM_CARD_CANVAS_MAX_IMAGE_SIDE
  ) {
    return 'tooLarge'
  }
  const background: ItemCardCanvasBackground = { name: file.name, blob: file, width, height }
  setDocument({ ...canvasDocument.value, background })
  rebuildObjectUrls(canvasDocument.value)
  return 'ok'
}

async function addLayer(input: ItemCardCanvasLayerInput): Promise<ItemCardCanvasLayer> {
  await ensureRestored()
  const document = canvasDocument.value
  const background = document.background
  const defaultX = background ? (background.width - input.width) / 2 : 0
  const defaultY = background ? (background.height - input.height) / 2 : 0
  const layer: ItemCardCanvasLayer = {
    id: `layer:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    type: input.type,
    sourceId: input.sourceId,
    blob: input.blob,
    width: input.width,
    height: input.height,
    // 默认放在画布中央；拖拽来源会传入落点位置。
    x: Math.round(Number.isFinite(input.x) ? input.x! : defaultX),
    y: Math.round(Number.isFinite(input.y) ? input.y! : defaultY),
    scale: 1,
    zIndex: nextLayerZIndex(document.layers)
  }
  setDocument({
    ...document,
    layers: [...document.layers, layer],
    selectedLayerId: layer.id
  })
  layerUrls.value = { ...layerUrls.value, [layer.id]: URL.createObjectURL(layer.blob) }
  return layer
}

function updateLayer(layerId: string, patch: Partial<Pick<ItemCardCanvasLayer, 'x' | 'y'>>) {
  setDocument({
    ...canvasDocument.value,
    layers: canvasDocument.value.layers.map((layer) =>
      layer.id === layerId ? { ...layer, ...patch } : layer
    )
  })
}

function updateLayerContent(
  layerId: string,
  content: Pick<ItemCardCanvasLayer, 'blob' | 'width' | 'height'>
) {
  const layer = canvasDocument.value.layers.find((item) => item.id === layerId)
  if (!layer) {
    return
  }
  const previousUrl = layerUrls.value[layerId]
  if (previousUrl) {
    URL.revokeObjectURL(previousUrl)
  }
  layerUrls.value = {
    ...layerUrls.value,
    [layerId]: URL.createObjectURL(content.blob)
  }
  setDocument({
    ...canvasDocument.value,
    layers: canvasDocument.value.layers.map((item) =>
      item.id === layerId ? replaceLayerContent(item, content) : item
    )
  })
}

function setLayerScale(layerId: string, scale: number) {
  if (!Number.isFinite(scale)) {
    return
  }
  setDocument({
    ...canvasDocument.value,
    layers: canvasDocument.value.layers.map((layer) =>
      layer.id === layerId ? { ...layer, scale: clampLayerScale(scale) } : layer
    )
  })
}

function removeLayer(layerId: string) {
  const url = layerUrls.value[layerId]
  if (url) {
    URL.revokeObjectURL(url)
  }
  const nextUrls = { ...layerUrls.value }
  delete nextUrls[layerId]
  layerUrls.value = nextUrls
  const layers = canvasDocument.value.layers.filter((layer) => layer.id !== layerId)
  setDocument({
    ...canvasDocument.value,
    layers,
    selectedLayerId:
      canvasDocument.value.selectedLayerId === layerId
        ? undefined
        : canvasDocument.value.selectedLayerId
  })
}

function moveLayerToIndex(layerId: string, targetIndex: number) {
  setDocument({
    ...canvasDocument.value,
    layers: moveLayerToOrder(canvasDocument.value.layers, layerId, targetIndex)
  })
}

function selectLayer(layerId: string | undefined) {
  setDocument({ ...canvasDocument.value, selectedLayerId: layerId })
}

function setViewport(viewport: ItemCardCanvasViewport) {
  setDocument({ ...canvasDocument.value, viewport })
}

async function clearCanvas() {
  await ensureRestored()
  revokeAllObjectUrls()
  setDocument(createEmptyDocument())
  await clearItemCardCanvasDocument()
}

// 仅供测试或页面完全卸载时调用：释放全部 object URL。
function disposeItemCardCanvas() {
  revokeAllObjectUrls()
}

export function useItemCardCanvas() {
  const selectedLayer = computed(
    () =>
      canvasDocument.value.layers.find(
        (layer) => layer.id === canvasDocument.value.selectedLayerId
      ) || null
  )
  const orderedLayers = computed(() => sortedLayers(canvasDocument.value.layers))

  return {
    canvasDocument,
    storageAvailable,
    restored,
    backgroundUrl,
    layerUrls,
    selectedLayer,
    orderedLayers,
    ensureRestored,
    setBackgroundFromFile,
    addLayer,
    updateLayer,
    updateLayerContent,
    setLayerScale,
    removeLayer,
    moveLayerToIndex,
    selectLayer,
    setViewport,
    clearCanvas,
    disposeItemCardCanvas
  }
}
