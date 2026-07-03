import { NSPLATE_CANVAS_DIMENSIONS } from '@/lib/plate/render'
import type { NSPlateCustomPortraitImage } from '@/lib/plate/types'

export async function createCustomPortraitImageFromFile(
  file: File
): Promise<NSPlateCustomPortraitImage> {
  const dataUrl = await createPortraitDataUrl(file)

  return {
    id: `${file.name}:${file.lastModified}:${file.size}`,
    fileName: file.name,
    dataUrl,
    width: NSPLATE_CANVAS_DIMENSIONS.portrait.width,
    height: NSPLATE_CANVAS_DIMENSIONS.portrait.height
  }
}

async function createPortraitDataUrl(file: File) {
  const source = await readFileAsDataUrl(file)
  const image = await loadImage(source)
  const canvas = document.createElement('canvas')
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('canvas')
  }

  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = Math.round(image.naturalWidth * scale)
  const drawHeight = Math.round(image.naturalHeight * scale)
  const x = Math.round((width - drawWidth) / 2)
  const y = Math.round((height - drawHeight) / 2)

  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.drawImage(image, x, y, drawWidth, drawHeight)

  return canvas.toDataURL('image/png')
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = source
  })
}
