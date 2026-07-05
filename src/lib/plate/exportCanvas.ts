import { createNSPlateCanvasImageFilename } from '@/lib/plate/downloadFilenames'

export type NSPlateCanvasExportFormat = 'png' | 'jpg'

export interface NSPlateCanvasExportOptions {
  format: NSPlateCanvasExportFormat
  scale: number
}

const JPG_BACKGROUND = '#ffffff'
const JPG_QUALITY = 0.92

export async function exportPlateCanvasImage(
  sourceCanvas: HTMLCanvasElement,
  options: NSPlateCanvasExportOptions
) {
  const scale = normalizeExportScale(options.scale)
  const scaledCanvas = createScaledCanvas(sourceCanvas, scale)
  const exportCanvas =
    options.format === 'jpg' ? createCanvasWithBackground(scaledCanvas, JPG_BACKGROUND) : scaledCanvas
  const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png'
  const blob = await canvasToBlob(
    exportCanvas,
    mimeType,
    options.format === 'jpg' ? JPG_QUALITY : undefined
  )
  const filename = createNSPlateCanvasImageFilename(options.format, scale)

  downloadBlob(blob, filename)
  return filename
}

function normalizeExportScale(scale: number) {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('invalid-scale')
  }

  return scale
}

function createScaledCanvas(sourceCanvas: HTMLCanvasElement, scale: number) {
  const width = Math.max(1, Math.round(sourceCanvas.width * scale))
  const height = Math.max(1, Math.round(sourceCanvas.height * scale))

  if (width === sourceCanvas.width && height === sourceCanvas.height) {
    return sourceCanvas
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('canvas-context')
  }

  context.imageSmoothingEnabled = true

  if ('imageSmoothingQuality' in context) {
    context.imageSmoothingQuality = 'high'
  }

  context.drawImage(sourceCanvas, 0, 0, width, height)
  return canvas
}

function createCanvasWithBackground(sourceCanvas: HTMLCanvasElement, background: string) {
  const canvas = document.createElement('canvas')
  canvas.width = sourceCanvas.width
  canvas.height = sourceCanvas.height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('canvas-context')
  }

  context.fillStyle = background
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(sourceCanvas, 0, 0)
  return canvas
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('canvas-blob'))
        }
      },
      mimeType,
      quality
    )
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.download = filename
  link.href = url
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
