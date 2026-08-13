import { describe, expect, it } from 'vitest'

import {
  ITEM_CARD_CANVAS_MAX_LAYER_SCALE,
  ITEM_CARD_CANVAS_MAX_ZOOM,
  ITEM_CARD_CANVAS_MIN_LAYER_SCALE,
  ITEM_CARD_CANVAS_MIN_ZOOM,
  canExportCanvasDocument,
  clampLayerScale,
  clampZoom,
  fitViewport,
  getCanvasDisplaySize,
  getCanvasExportSize,
  hitTestLayer,
  hitTestLayers,
  imageToViewport,
  moveLayerBy,
  moveLayerToOrder,
  moveLayerOrder,
  nextLayerZIndex,
  panViewport,
  resetViewport,
  replaceLayerContent,
  setLayerScaleClamped,
  sortedLayers,
  viewportToImage,
  zoomViewportAt
} from '@/pages/item-card/lib/canvasComposer'
import { resolveItemCardLayout } from '@/pages/item-card/lib/cardRenderer'
import type {
  ItemCardCanvasDocument,
  ItemCardCanvasLayer,
  ItemCardCanvasViewport
} from '@/pages/item-card/lib/canvasTypes'
import type { GlamourEquipmentEntry } from '@/pages/item-card/lib/types'
import {
  ITEM_CARD_CANVAS_DRAG_MIME,
  decodeItemCardCanvasDragSource,
  encodeItemCardCanvasDragSource
} from '@/pages/item-card/lib/canvasDrag'

function makeLayer(partial: Partial<ItemCardCanvasLayer> = {}): ItemCardCanvasLayer {
  return {
    id: partial.id || 'layer-1',
    name: partial.name || 'layer',
    type: partial.type || 'item',
    sourceId: partial.sourceId || 'source-1',
    blob: partial.blob || new Blob(),
    width: partial.width ?? 100,
    height: partial.height ?? 50,
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    scale: partial.scale ?? 1,
    zIndex: partial.zIndex ?? 1
  }
}

function makeDocument(partial: Partial<ItemCardCanvasDocument> = {}): ItemCardCanvasDocument {
  return {
    version: 1,
    layers: [],
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
    ...partial
  }
}

describe('item card list layout', () => {
  it('uses the same per-item layout as individual card previews', () => {
    const entry = {
      slot: 'Body',
      cardRowId: 'row-body-1'
    } as GlamourEquipmentEntry

    expect(resolveItemCardLayout(entry, { 'row-body-1': 'right' })).toBe('right')
    expect(resolveItemCardLayout(entry, { Body: 'right' })).toBe('right')
    expect(resolveItemCardLayout(entry, {})).toBe('left')
  })
})

describe('viewport coordinate conversion', () => {
  it('converts between image and viewport coordinates', () => {
    const viewport: ItemCardCanvasViewport = { zoom: 2, offsetX: 30, offsetY: -10 }
    expect(imageToViewport({ x: 10, y: 20 }, viewport)).toEqual({ x: 50, y: 30 })
    expect(viewportToImage({ x: 50, y: 30 }, viewport)).toEqual({ x: 10, y: 20 })
  })

  it('round-trips points through both conversions', () => {
    const viewport: ItemCardCanvasViewport = { zoom: 0.4, offsetX: -120, offsetY: 55 }
    const point = { x: 321.5, y: -87.25 }
    const roundTripped = viewportToImage(imageToViewport(point, viewport), viewport)
    expect(roundTripped.x).toBeCloseTo(point.x)
    expect(roundTripped.y).toBeCloseTo(point.y)
  })
})

describe('viewport zoom and pan', () => {
  it('clamps zoom to the configured bounds', () => {
    expect(clampZoom(0.001)).toBe(ITEM_CARD_CANVAS_MIN_ZOOM)
    expect(clampZoom(1000)).toBe(ITEM_CARD_CANVAS_MAX_ZOOM)
    expect(clampZoom(1.5)).toBe(1.5)
  })

  it('pans the viewport by screen-space deltas', () => {
    const viewport: ItemCardCanvasViewport = { zoom: 2, offsetX: 10, offsetY: 20 }
    expect(panViewport(viewport, 5, -8)).toEqual({ zoom: 2, offsetX: 15, offsetY: 12 })
  })

  it('keeps the anchor image point fixed when zooming at a screen point', () => {
    const viewport: ItemCardCanvasViewport = { zoom: 1, offsetX: 40, offsetY: 60 }
    const anchor = { x: 100, y: 80 }
    const before = viewportToImage(anchor, viewport)
    const zoomed = zoomViewportAt(viewport, anchor, 2.5)
    const after = viewportToImage(anchor, zoomed)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
    expect(zoomed.zoom).toBe(2.5)
  })

  it('clamps the zoom applied at an anchor point', () => {
    const viewport: ItemCardCanvasViewport = { zoom: 1, offsetX: 0, offsetY: 0 }
    expect(zoomViewportAt(viewport, { x: 0, y: 0 }, 999).zoom).toBe(ITEM_CARD_CANVAS_MAX_ZOOM)
    expect(zoomViewportAt(viewport, { x: 0, y: 0 }, 0).zoom).toBe(ITEM_CARD_CANVAS_MIN_ZOOM)
  })

  it('resets the viewport to identity', () => {
    expect(resetViewport()).toEqual({ zoom: 1, offsetX: 0, offsetY: 0 })
  })

  it('fits the whole background inside the container', () => {
    const viewport = fitViewport({ width: 400, height: 300 }, { width: 1000, height: 500 }, 0)
    expect(viewport.zoom).toBeCloseTo(0.4)
    expect(viewport.offsetX).toBeCloseTo(0)
    expect(viewport.offsetY).toBeCloseTo(50)
  })

  it('clamps the fit zoom for tiny images', () => {
    const viewport = fitViewport({ width: 4000, height: 4000 }, { width: 10, height: 10 }, 0)
    expect(viewport.zoom).toBe(ITEM_CARD_CANVAS_MAX_ZOOM)
  })
})

describe('layer drag and scale', () => {
  it('moves a layer by image-space deltas', () => {
    const layer = makeLayer({ x: 10, y: 20 })
    expect(moveLayerBy(layer, 5, -7)).toMatchObject({ x: 15, y: 13 })
    expect(layer).toMatchObject({ x: 10, y: 20 })
  })

  it('clamps layer scale to the configured bounds', () => {
    expect(clampLayerScale(0)).toBe(ITEM_CARD_CANVAS_MIN_LAYER_SCALE)
    expect(clampLayerScale(100)).toBe(ITEM_CARD_CANVAS_MAX_LAYER_SCALE)
    expect(setLayerScaleClamped(makeLayer(), 2.5).scale).toBe(2.5)
    expect(setLayerScaleClamped(makeLayer(), 0.0001).scale).toBe(ITEM_CARD_CANVAS_MIN_LAYER_SCALE)
  })
})

describe('layer content refresh', () => {
  it('replaces rendered content without changing placement controls', () => {
    const layer = makeLayer({ x: 120, y: 84, scale: 1.5, zIndex: 7 })
    const blob = new Blob(['refreshed'])
    const refreshed = replaceLayerContent(layer, { blob, width: 240, height: 48 })

    expect(refreshed).toMatchObject({
      blob,
      width: 240,
      height: 48,
      x: 120,
      y: 84,
      scale: 1.5,
      zIndex: 7
    })
  })
})

describe('layer hit testing', () => {
  it('hits inside the scaled layer bounds', () => {
    const layer = makeLayer({ x: 100, y: 100, width: 200, height: 100, scale: 0.5 })
    expect(hitTestLayer(layer, { x: 150, y: 120 })).toBe(true)
    expect(hitTestLayer(layer, { x: 201, y: 120 })).toBe(false)
    expect(hitTestLayer(layer, { x: 150, y: 151 })).toBe(false)
  })

  it('returns the topmost layer at a point', () => {
    const bottom = makeLayer({ id: 'bottom', zIndex: 1 })
    const top = makeLayer({ id: 'top', zIndex: 5 })
    expect(hitTestLayers([bottom, top], { x: 10, y: 10 })?.id).toBe('top')
    expect(hitTestLayers([top, bottom], { x: 10, y: 10 })?.id).toBe('top')
  })

  it('returns undefined when no layer is hit', () => {
    expect(hitTestLayers([makeLayer()], { x: 500, y: 500 })).toBeUndefined()
  })
})

describe('layer ordering', () => {
  it('sorts layers by zIndex ascending for composition', () => {
    const layers = [
      makeLayer({ id: 'c', zIndex: 3 }),
      makeLayer({ id: 'a', zIndex: 1 }),
      makeLayer({ id: 'b', zIndex: 2 })
    ]
    expect(sortedLayers(layers).map((layer) => layer.id)).toEqual(['a', 'b', 'c'])
  })

  it('computes the next zIndex above all existing layers', () => {
    expect(nextLayerZIndex([])).toBe(1)
    expect(nextLayerZIndex([makeLayer({ zIndex: 4 }), makeLayer({ zIndex: 9 })])).toBe(10)
  })

  it('swaps zIndex when moving a layer up or down', () => {
    const layers = [
      makeLayer({ id: 'a', zIndex: 1 }),
      makeLayer({ id: 'b', zIndex: 2 }),
      makeLayer({ id: 'c', zIndex: 3 })
    ]
    const movedUp = moveLayerOrder(layers, 'a', 1)
    expect(movedUp.find((layer) => layer.id === 'a')?.zIndex).toBe(2)
    expect(movedUp.find((layer) => layer.id === 'b')?.zIndex).toBe(1)
    const movedDown = moveLayerOrder(layers, 'c', -1)
    expect(movedDown.find((layer) => layer.id === 'c')?.zIndex).toBe(2)
    expect(movedDown.find((layer) => layer.id === 'b')?.zIndex).toBe(3)
  })

  it('moves a layer to an arbitrary composition position without disturbing the other layers', () => {
    const layers = [
      makeLayer({ id: 'a', zIndex: 1 }),
      makeLayer({ id: 'b', zIndex: 2 }),
      makeLayer({ id: 'c', zIndex: 3 })
    ]

    const moved = moveLayerToOrder(layers, 'a', 2)

    expect(sortedLayers(moved).map((layer) => layer.id)).toEqual(['b', 'c', 'a'])
  })

  it('moves a top layer down while keeping the intervening layers ordered', () => {
    const layers = [
      makeLayer({ id: 'a', zIndex: 1 }),
      makeLayer({ id: 'b', zIndex: 2 }),
      makeLayer({ id: 'c', zIndex: 3 })
    ]

    const moved = moveLayerToOrder(layers, 'c', 0)

    expect(sortedLayers(moved).map((layer) => layer.id)).toEqual(['c', 'a', 'b'])
  })

  it('keeps the order unchanged at the edges or for unknown layers', () => {
    const layers = [makeLayer({ id: 'a', zIndex: 1 }), makeLayer({ id: 'b', zIndex: 2 })]
    expect(moveLayerOrder(layers, 'b', 1)).toEqual(layers)
    expect(moveLayerOrder(layers, 'a', -1)).toEqual(layers)
    expect(moveLayerOrder(layers, 'missing', 1)).toEqual(layers)
  })
})

describe('export size and empty canvas state', () => {
  it('reports an empty canvas as not exportable with no export size', () => {
    const document = makeDocument()
    expect(canExportCanvasDocument(document)).toBe(false)
    expect(getCanvasExportSize(document)).toBeNull()
  })

  it('uses the background original size for export regardless of viewport zoom', () => {
    const document = makeDocument({
      background: { name: 'bg.png', blob: new Blob(), width: 1920, height: 1080 },
      viewport: { zoom: 0.25, offsetX: 300, offsetY: -50 }
    })
    expect(canExportCanvasDocument(document)).toBe(true)
    expect(getCanvasExportSize(document)).toEqual({ width: 1920, height: 1080 })
  })
})

describe('layer source display size', () => {
  it('uses logical canvas dimensions instead of a high-resolution backing store', () => {
    const canvas = {
      width: 1120,
      height: 216,
      style: { width: '560px', height: '108px' }
    } as unknown as HTMLCanvasElement

    expect(getCanvasDisplaySize(canvas)).toEqual({ width: 560, height: 108 })
  })

  it('falls back to backing-store dimensions when no display size is set', () => {
    const canvas = {
      width: 320,
      height: 180,
      style: { width: '', height: '' }
    } as unknown as HTMLCanvasElement

    expect(getCanvasDisplaySize(canvas)).toEqual({ width: 320, height: 180 })
  })
})

describe('canvas drag sources', () => {
  it('round-trips an equipment drag source through dataTransfer text', () => {
    const source = { kind: 'item' as const, sourceId: 'body:123' }
    const encoded = encodeItemCardCanvasDragSource(source)

    expect(ITEM_CARD_CANVAS_DRAG_MIME).toBe('application/x-item-card-source')
    expect(decodeItemCardCanvasDragSource(encoded)).toEqual(source)
  })

  it('round-trips a custom text drag source through dataTransfer text', () => {
    const source = { kind: 'customText' as const, sourceId: 'custom-text-1' }
    expect(decodeItemCardCanvasDragSource(encodeItemCardCanvasDragSource(source))).toEqual(source)
  })

  it('rejects malformed or unsupported drag source payloads', () => {
    expect(decodeItemCardCanvasDragSource('')).toBeUndefined()
    expect(decodeItemCardCanvasDragSource('{"kind":"unknown","sourceId":"x"}')).toBeUndefined()
    expect(decodeItemCardCanvasDragSource('{"kind":"item"}')).toBeUndefined()
    expect(decodeItemCardCanvasDragSource('not-json')).toBeUndefined()
  })
})
