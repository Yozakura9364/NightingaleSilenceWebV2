export type ItemCardCanvasLayerType = 'item' | 'customText'

export interface ItemCardCanvasBackground {
  name: string
  blob: Blob
  width: number
  height: number
}

export interface ItemCardCanvasLayer {
  id: string
  name: string
  type: ItemCardCanvasLayerType
  sourceId: string
  blob: Blob
  width: number
  height: number
  x: number
  y: number
  scale: number
  zIndex: number
}

export interface ItemCardCanvasViewport {
  zoom: number
  offsetX: number
  offsetY: number
}

export interface ItemCardCanvasDocument {
  version: 1
  background?: ItemCardCanvasBackground
  layers: ItemCardCanvasLayer[]
  viewport: ItemCardCanvasViewport
  selectedLayerId?: string
}
