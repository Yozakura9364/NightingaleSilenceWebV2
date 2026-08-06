import { canvasToBlob } from '@/pages/item-card/lib/cardRenderer'
import type {
  ItemCardCanvasDocument,
  ItemCardCanvasLayer,
  ItemCardCanvasViewport
} from '@/pages/item-card/lib/canvasTypes'

// 视口缩放限制：过小会看不清合成内容，过大会把像素放大到无法操作。
export const ITEM_CARD_CANVAS_MIN_ZOOM = 0.05
export const ITEM_CARD_CANVAS_MAX_ZOOM = 8
// 图层等比缩放限制：避免缩放到不可见尺寸或撑爆背景内存中的坐标范围。
export const ITEM_CARD_CANVAS_MIN_LAYER_SCALE = 0.05
export const ITEM_CARD_CANVAS_MAX_LAYER_SCALE = 20

export interface ItemCardCanvasPoint {
  x: number
  y: number
}

export interface ItemCardCanvasSize {
  width: number
  height: number
}

// Canvas 内部可能使用高清倍率绘制，但贴入画布时应沿用预览中的逻辑尺寸。
export function getCanvasDisplaySize(canvas: HTMLCanvasElement): ItemCardCanvasSize {
  const width = Number.parseFloat(canvas.style.width)
  const height = Number.parseFloat(canvas.style.height)
  return {
    width: Number.isFinite(width) && width > 0 ? width : canvas.width,
    height: Number.isFinite(height) && height > 0 ? height : canvas.height
  }
}

export function clampZoom(zoom: number): number {
  return Math.min(ITEM_CARD_CANVAS_MAX_ZOOM, Math.max(ITEM_CARD_CANVAS_MIN_ZOOM, zoom))
}

export function clampLayerScale(scale: number): number {
  return Math.min(
    ITEM_CARD_CANVAS_MAX_LAYER_SCALE,
    Math.max(ITEM_CARD_CANVAS_MIN_LAYER_SCALE, scale)
  )
}

// 视口变换：screen = image * zoom + offset。
export function imageToViewport(
  point: ItemCardCanvasPoint,
  viewport: ItemCardCanvasViewport
): ItemCardCanvasPoint {
  return {
    x: point.x * viewport.zoom + viewport.offsetX,
    y: point.y * viewport.zoom + viewport.offsetY
  }
}

export function viewportToImage(
  point: ItemCardCanvasPoint,
  viewport: ItemCardCanvasViewport
): ItemCardCanvasPoint {
  return {
    x: (point.x - viewport.offsetX) / viewport.zoom,
    y: (point.y - viewport.offsetY) / viewport.zoom
  }
}

export function panViewport(
  viewport: ItemCardCanvasViewport,
  deltaX: number,
  deltaY: number
): ItemCardCanvasViewport {
  return {
    ...viewport,
    offsetX: viewport.offsetX + deltaX,
    offsetY: viewport.offsetY + deltaY
  }
}

// 以某个屏幕点为锚缩放视口，保持锚点下的图像内容不动。
export function zoomViewportAt(
  viewport: ItemCardCanvasViewport,
  screenPoint: ItemCardCanvasPoint,
  nextZoom: number
): ItemCardCanvasViewport {
  const zoom = clampZoom(nextZoom)
  const anchor = viewportToImage(screenPoint, viewport)
  return {
    zoom,
    offsetX: screenPoint.x - anchor.x * zoom,
    offsetY: screenPoint.y - anchor.y * zoom
  }
}

export function resetViewport(): ItemCardCanvasViewport {
  return { zoom: 1, offsetX: 0, offsetY: 0 }
}

// 让整张背景图适应容器并居中。
export function fitViewport(
  container: ItemCardCanvasSize,
  image: ItemCardCanvasSize,
  padding = 24
): ItemCardCanvasViewport {
  const availableWidth = Math.max(1, container.width - padding * 2)
  const availableHeight = Math.max(1, container.height - padding * 2)
  const zoom = clampZoom(Math.min(availableWidth / image.width, availableHeight / image.height))
  return {
    zoom,
    offsetX: (container.width - image.width * zoom) / 2,
    offsetY: (container.height - image.height * zoom) / 2
  }
}

export function moveLayerBy(
  layer: ItemCardCanvasLayer,
  deltaX: number,
  deltaY: number
): ItemCardCanvasLayer {
  return { ...layer, x: layer.x + deltaX, y: layer.y + deltaY }
}

export function setLayerScaleClamped(
  layer: ItemCardCanvasLayer,
  scale: number
): ItemCardCanvasLayer {
  return { ...layer, scale: clampLayerScale(scale) }
}

export function replaceLayerContent(
  layer: ItemCardCanvasLayer,
  content: Pick<ItemCardCanvasLayer, 'blob' | 'width' | 'height'>
): ItemCardCanvasLayer {
  return { ...layer, ...content }
}

export function getLayerBounds(layer: ItemCardCanvasLayer) {
  return {
    left: layer.x,
    top: layer.y,
    right: layer.x + layer.width * layer.scale,
    bottom: layer.y + layer.height * layer.scale
  }
}

export function hitTestLayer(layer: ItemCardCanvasLayer, imagePoint: ItemCardCanvasPoint): boolean {
  const bounds = getLayerBounds(layer)
  return (
    imagePoint.x >= bounds.left &&
    imagePoint.x <= bounds.right &&
    imagePoint.y >= bounds.top &&
    imagePoint.y <= bounds.bottom
  )
}

// 返回命中的最上层图层（zIndex 最大）。
export function hitTestLayers(
  layers: ItemCardCanvasLayer[],
  imagePoint: ItemCardCanvasPoint
): ItemCardCanvasLayer | undefined {
  return [...layers]
    .sort((a, b) => b.zIndex - a.zIndex)
    .find((layer) => hitTestLayer(layer, imagePoint))
}

export function sortedLayers(layers: ItemCardCanvasLayer[]): ItemCardCanvasLayer[] {
  return [...layers].sort((a, b) => a.zIndex - b.zIndex)
}

export function nextLayerZIndex(layers: ItemCardCanvasLayer[]): number {
  return layers.reduce((max, layer) => Math.max(max, layer.zIndex), 0) + 1
}

// 调整图层顺序：offset 为 +1 表示上移一层（更靠近顶部），-1 表示下移一层。
export function moveLayerOrder(
  layers: ItemCardCanvasLayer[],
  layerId: string,
  offset: number
): ItemCardCanvasLayer[] {
  const ordered = sortedLayers(layers)
  const index = ordered.findIndex((layer) => layer.id === layerId)
  const target = index + offset
  if (index < 0 || target < 0 || target >= ordered.length) {
    return layers
  }
  const current = ordered[index]
  const other = ordered[target]
  return layers.map((layer) => {
    if (layer.id === current.id) {
      return { ...layer, zIndex: other.zIndex }
    }
    if (layer.id === other.id) {
      return { ...layer, zIndex: current.zIndex }
    }
    return layer
  })
}

export function canExportCanvasDocument(document: ItemCardCanvasDocument): boolean {
  return Boolean(document.background)
}

// 导出始终使用背景图片原始尺寸，与浏览器预览的视口缩放无关。
export function getCanvasExportSize(document: ItemCardCanvasDocument): ItemCardCanvasSize | null {
  if (!document.background) {
    return null
  }
  return { width: document.background.width, height: document.background.height }
}

export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image decode failed'))
    }
    image.src = url
  })
}

// 在背景原始尺寸上重新合成：背景 → 按 zIndex 升序绘制图层。棋盘格只属于页面预览，不参与导出。
export async function composeItemCardCanvas(
  document: ItemCardCanvasDocument
): Promise<HTMLCanvasElement | null> {
  const size = getCanvasExportSize(document)
  if (!size || !document.background) {
    return null
  }
  const canvas = window.document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }
  const backgroundImage = await loadImageFromBlob(document.background.blob)
  ctx.drawImage(backgroundImage, 0, 0, size.width, size.height)
  for (const layer of sortedLayers(document.layers)) {
    const image = await loadImageFromBlob(layer.blob)
    ctx.drawImage(image, layer.x, layer.y, layer.width * layer.scale, layer.height * layer.scale)
  }
  return canvas
}

export async function renderItemCardCanvasBlob(
  document: ItemCardCanvasDocument
): Promise<Blob | null> {
  const canvas = await composeItemCardCanvas(document)
  return canvas ? canvasToBlob(canvas) : null
}
