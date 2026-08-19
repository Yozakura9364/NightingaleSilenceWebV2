// 分层导出的低层 Canvas/图片工具：无业务依赖，供 layeredZip 与 layeredExport 共用。

import type { NSPlateLayeredExportLayer } from '@/lib/plate/types'

export function createLayerCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(Math.max(1, width), Math.max(1, height))
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  return canvas
}

export function getLayerContext(canvas: HTMLCanvasElement | OffscreenCanvas, smoothing: boolean) {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('canvas-context')
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = smoothing

  if (smoothing && 'imageSmoothingQuality' in context) {
    context.imageSmoothingQuality = 'high'
  }

  return context
}

export function normalizeExportScale(scale: number) {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('invalid-scale')
  }

  return scale
}

/** Create a Blob URL from a canvas, avoiding base64 data URL overhead. Free with revokeCanvasBlobUrl(). */
export function canvasToBlobUrl(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<string> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/png' }).then((blob) => URL.createObjectURL(blob))
  }
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        // Fallback to data URL if toBlob fails
        resolve(canvas.toDataURL('image/png'))
        return
      }
      resolve(URL.createObjectURL(blob))
    }, 'image/png')
  })
}

export function revokeCanvasBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export function loadLayerImage(source: string) {
  if (!source) {
    return Promise.resolve(null)
  }

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()

    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const finish = () => resolve(image)

      if (typeof image.decode === 'function') {
        void image.decode().then(finish).catch(finish)
      } else {
        finish()
      }
    }
    image.onerror = () => resolve(null)
    image.src = source
  })
}

export async function loadLayerImageWithFallback(sources: string[]) {
  for (const source of sources) {
    const image = await loadLayerImage(source)

    if (image) {
      return image
    }
  }

  return null
}

export async function placeLayerOnFullCanvas(
  layer: NSPlateLayeredExportLayer,
  canvasWidth: number,
  canvasHeight: number
) {
  const image = await loadLayerImage(layer.rgbaData)

  if (!image) {
    throw new Error('layer-image-decode')
  }

  const canvas = createLayerCanvas(canvasWidth, canvasHeight)
  const context = getLayerContext(canvas, false)

  context.drawImage(image, Math.round(layer.x), Math.round(layer.y))
  return canvasToPngBlob(canvas)
}

export function canvasToPngBlob(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/png' })
  }
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      // Fallback: generate blob from data URL
      const dataUrl = canvas.toDataURL('image/png')
      const binary = atob(dataUrl.split(',')[1])
      const array = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i)
      }
      resolve(new Blob([array], { type: 'image/png' }))
    }, 'image/png')
  })
}

export function normalizeCanvasSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('invalid-canvas-size')
  }

  return Math.max(1, Math.round(value))
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
