// 画布图层/缩放手柄的指针拖拽状态机。
// 只依赖注入的视口/图层读写，不触碰 DOM 之外的状态。

import { viewportToImage } from '@/pages/item-card/lib/canvasComposer'
import type { ItemCardCanvasPoint } from '@/pages/item-card/lib/canvasComposer'
import type { ItemCardCanvasLayer, ItemCardCanvasViewport } from '@/pages/item-card/lib/canvasTypes'
import type { ComputedRef, Ref } from 'vue'

interface CanvasDragState {
  pointerId: number
  layerId: string
  mode: 'move' | 'scale'
  layerStartX: number
  layerStartY: number
  startImageX: number
  startImageY: number
  startScale: number
  startDistance: number
}

export interface ItemCardCanvasPointerOptions {
  viewportElement: Ref<HTMLElement | null>
  viewport: ComputedRef<ItemCardCanvasViewport>
  selectLayer: (layerId: string | undefined) => void
  updateLayer: (layerId: string, patch: Partial<ItemCardCanvasLayer>) => void
  setLayerScale: (layerId: string, scale: number) => void
}

export function useItemCardCanvasPointer(options: ItemCardCanvasPointerOptions) {
  let dragState: CanvasDragState | null = null

  function viewportPoint(event: { clientX: number; clientY: number }): ItemCardCanvasPoint {
    const rect = options.viewportElement.value?.getBoundingClientRect()
    return {
      x: event.clientX - (rect?.left || 0),
      y: event.clientY - (rect?.top || 0)
    }
  }

  function onLayerPointerDown(event: PointerEvent, layer: ItemCardCanvasLayer) {
    if (event.button !== 0) {
      return
    }
    options.selectLayer(layer.id)
    const imagePoint = viewportToImage(viewportPoint(event), options.viewport.value)
    dragState = {
      pointerId: event.pointerId,
      layerId: layer.id,
      mode: 'move',
      layerStartX: layer.x,
      layerStartY: layer.y,
      startImageX: imagePoint.x,
      startImageY: imagePoint.y,
      startScale: layer.scale,
      startDistance: 0
    }
    options.viewportElement.value?.setPointerCapture(event.pointerId)
  }

  function onScaleHandlePointerDown(event: PointerEvent, layer: ItemCardCanvasLayer) {
    if (event.button !== 0) {
      return
    }
    options.selectLayer(layer.id)
    const imagePoint = viewportToImage(viewportPoint(event), options.viewport.value)
    const distance = Math.hypot(imagePoint.x - layer.x, imagePoint.y - layer.y)
    if (!distance) {
      return
    }
    dragState = {
      pointerId: event.pointerId,
      layerId: layer.id,
      mode: 'scale',
      layerStartX: layer.x,
      layerStartY: layer.y,
      startImageX: imagePoint.x,
      startImageY: imagePoint.y,
      startScale: layer.scale,
      startDistance: distance
    }
    options.viewportElement.value?.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }
    const imagePoint = viewportToImage(viewportPoint(event), options.viewport.value)
    if (dragState.mode === 'scale') {
      const distance = Math.hypot(
        imagePoint.x - dragState.layerStartX,
        imagePoint.y - dragState.layerStartY
      )
      const nextScale = dragState.startScale * (distance / dragState.startDistance)
      options.setLayerScale(dragState.layerId, Math.round(nextScale * 1000) / 1000)
      return
    }
    options.updateLayer(dragState.layerId, {
      x: Math.round(dragState.layerStartX + imagePoint.x - dragState.startImageX),
      y: Math.round(dragState.layerStartY + imagePoint.y - dragState.startImageY)
    })
  }

  function onPointerUp(event: PointerEvent) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }
    dragState = null
  }

  return {
    viewportPoint,
    onLayerPointerDown,
    onScaleHandlePointerDown,
    onPointerMove,
    onPointerUp
  }
}
