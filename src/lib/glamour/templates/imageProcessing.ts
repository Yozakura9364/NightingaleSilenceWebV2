import { drawGlamourTemplateImageCover } from '@/lib/glamour/templates/renderer'

export function readGlamourImageFileAsDataUrl(file: File): Promise<string> {
  return readGlamourImageBlobAsDataUrl(file)
}

export function readGlamourImageBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    })
    reader.addEventListener('error', () => resolve(''))
    reader.readAsDataURL(blob)
  })
}

export function loadGlamourTemplateImage(imageUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    if (/^https?:\/\//i.test(imageUrl)) {
      image.crossOrigin = 'anonymous'
    }
    image.decoding = 'async'
    image.addEventListener('load', () => resolve(image), { once: true })
    image.addEventListener('error', () => resolve(null), { once: true })
    image.src = imageUrl
  })
}

export function normalizeGlamourDraggedImageUrl(value = ''): string {
  const firstLine = String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#'))

  if (!firstLine) {
    return ''
  }

  if (
    /^data:image\//i.test(firstLine) ||
    /^https?:\/\//i.test(firstLine) ||
    /^blob:/i.test(firstLine)
  ) {
    return firstLine
  }

  return ''
}

export function getGlamourDraggedData(dataTransfer: DataTransfer | null, type: string): string {
  if (!dataTransfer || typeof dataTransfer.getData !== 'function') {
    return ''
  }

  try {
    return dataTransfer.getData(type)
  } catch {
    return ''
  }
}

export function getGlamourDroppedImageUrl(event: DragEvent): string {
  const dataTransfer = event.dataTransfer
  const uriList = normalizeGlamourDraggedImageUrl(
    getGlamourDraggedData(dataTransfer, 'text/uri-list')
  )

  if (uriList) {
    return uriList
  }

  return normalizeGlamourDraggedImageUrl(getGlamourDraggedData(dataTransfer, 'text/plain'))
}

export function createGlamourTemplateImageCoverDataUrl(
  image: HTMLImageElement,
  width: number,
  height: number
): string {
  try {
    const output = document.createElement('canvas')
    output.width = Math.max(1, Math.round(width))
    output.height = Math.max(1, Math.round(height))
    const ctx = output.getContext('2d')

    if (!ctx) {
      return ''
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    drawGlamourTemplateImageCover(ctx, image, 0, 0, output.width, output.height)
    return output.toDataURL('image/png')
  } catch {
    return ''
  }
}
