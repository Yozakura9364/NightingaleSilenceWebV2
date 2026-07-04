import { NSPLATE_CANVAS_DIMENSIONS, NSPLATE_PORTRAIT_EMBED } from '@/lib/plate/render'
import type {
  NSPlateCustomPortraitCropState,
  NSPlateCustomPortraitImage,
  NSPlateCustomPortraitMode
} from '@/lib/plate/types'

export interface NSPlateCustomPortraitDrawRect {
  x: number
  y: number
  width: number
  height: number
}

const CUSTOM_PORTRAIT_MIN_ZOOM = 1
const CUSTOM_PORTRAIT_MAX_ZOOM = 3

export async function createCustomPortraitImageFromFile(
  file: File
): Promise<NSPlateCustomPortraitImage> {
  const cropState = await createCustomPortraitCropStateFromFile(file)
  return createCustomPortraitImageFromCropState(cropState)
}

export async function createCustomPortraitCropStateFromFile(
  file: File
): Promise<NSPlateCustomPortraitCropState> {
  const sourceDataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(sourceDataUrl)
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight

  if (!sourceWidth || !sourceHeight) {
    throw new Error('image-size')
  }

  const cropState = {
    id: `${file.name}:${file.lastModified}:${file.size}`,
    fileName: file.name,
    sourceDataUrl,
    image,
    sourceWidth,
    sourceHeight,
    baseScale: Math.max(width / sourceWidth, height / sourceHeight),
    mode: 'standard',
    scaleMultiplier: 1,
    offsetX: 0,
    offsetY: 0,
    splitY: Math.round(height * 0.34)
  } satisfies NSPlateCustomPortraitCropState

  clampCustomPortraitCropState(cropState)
  return cropState
}

export async function createCustomPortraitImageFromCropState(
  cropState: NSPlateCustomPortraitCropState
): Promise<NSPlateCustomPortraitImage> {
  const dataUrl = createPortraitDataUrl(cropState)
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait

  return {
    id: [
      cropState.id,
      cropState.mode,
      cropState.scaleMultiplier.toFixed(3),
      Math.round(cropState.offsetX),
      Math.round(cropState.offsetY),
      Math.round(cropState.splitY)
    ].join(':'),
    mode: cropState.mode,
    fileName: cropState.fileName,
    dataUrl,
    width,
    height,
    scale: 1,
    ...(cropState.mode === 'popout'
      ? {
          sourceDataUrl: cropState.sourceDataUrl,
          sourceWidth: cropState.sourceWidth,
          sourceHeight: cropState.sourceHeight,
          baseScale: cropState.baseScale,
          scaleMultiplier: cropState.scaleMultiplier,
          offsetX: cropState.offsetX,
          offsetY: cropState.offsetY,
          splitY: cropState.splitY
        }
      : {})
  }
}

export function drawCustomPortraitCropPreview(
  canvas: HTMLCanvasElement,
  cropState: NSPlateCustomPortraitCropState
) {
  if (cropState.mode === 'popout') {
    drawCustomPortraitPopoutCropPreview(canvas, cropState)
    return
  }

  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  drawCustomPortraitCropToContext(context, cropState)
}

export function getCustomPortraitCropPreviewDimensions(cropState: NSPlateCustomPortraitCropState) {
  return cropState.mode === 'popout'
    ? NSPLATE_CANVAS_DIMENSIONS.nameplate
    : NSPLATE_CANVAS_DIMENSIONS.portrait
}

export function clampCustomPortraitCropState(cropState: NSPlateCustomPortraitCropState) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  cropState.scaleMultiplier = Math.max(
    CUSTOM_PORTRAIT_MIN_ZOOM,
    Math.min(CUSTOM_PORTRAIT_MAX_ZOOM, cropState.scaleMultiplier)
  )
  cropState.splitY = Math.max(0, Math.min(height, cropState.splitY))

  const rect = getCustomPortraitCropDrawRect(cropState)

  if (rect.width >= width) {
    const limit = (rect.width - width) / 2
    cropState.offsetX = Math.max(-limit, Math.min(limit, cropState.offsetX))
  } else {
    cropState.offsetX = 0
  }

  if (rect.height >= height) {
    const limit = (rect.height - height) / 2
    cropState.offsetY = Math.max(-limit, Math.min(limit, cropState.offsetY))
  } else {
    cropState.offsetY = 0
  }
}

export function getCustomPortraitCropLimits() {
  return {
    minZoom: CUSTOM_PORTRAIT_MIN_ZOOM,
    maxZoom: CUSTOM_PORTRAIT_MAX_ZOOM,
    minSplitY: 0,
    maxSplitY: NSPLATE_CANVAS_DIMENSIONS.portrait.height
  }
}

export function setCustomPortraitCropMode(
  cropState: NSPlateCustomPortraitCropState,
  mode: NSPlateCustomPortraitMode
) {
  cropState.mode = mode
  clampCustomPortraitCropState(cropState)
}

export function getCustomPortraitSourceDrawRect(
  customPortrait: NSPlateCustomPortraitImage
): NSPlateCustomPortraitDrawRect {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const sourceWidth = customPortrait.sourceWidth ?? customPortrait.width
  const sourceHeight = customPortrait.sourceHeight ?? customPortrait.height
  const baseScale =
    customPortrait.baseScale ?? Math.max(width / Math.max(1, sourceWidth), height / Math.max(1, sourceHeight))
  const scale = baseScale * (customPortrait.scaleMultiplier ?? 1)
  const drawWidth = Math.round(sourceWidth * scale)
  const drawHeight = Math.round(sourceHeight * scale)

  return {
    x: Math.round((width - drawWidth) / 2 + (customPortrait.offsetX ?? 0)),
    y: Math.round((height - drawHeight) / 2 + (customPortrait.offsetY ?? 0)),
    width: drawWidth,
    height: drawHeight
  }
}

function createPortraitDataUrl(cropState: NSPlateCustomPortraitCropState) {
  const canvas = document.createElement('canvas')
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('canvas')
  }

  drawCustomPortraitCropToContext(context, cropState)
  return canvas.toDataURL('image/png')
}

function drawCustomPortraitCropToContext(
  context: CanvasRenderingContext2D,
  cropState: NSPlateCustomPortraitCropState
) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const rect = getCustomPortraitCropDrawRect(cropState)

  context.clearRect(0, 0, width, height)
  context.save()
  context.beginPath()
  context.rect(0, 0, width, height)
  context.clip()
  context.imageSmoothingEnabled = true
  context.drawImage(cropState.image, rect.x, rect.y, rect.width, rect.height)
  context.restore()
}

function drawCustomPortraitPopoutCropPreview(
  canvas: HTMLCanvasElement,
  cropState: NSPlateCustomPortraitCropState
) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.nameplate
  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const portraitOrigin = NSPLATE_PORTRAIT_EMBED.right
  const rect = getCustomPortraitCropDrawRect(cropState)
  const splitY = Math.round(cropState.splitY)
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = true

  context.save()
  context.beginPath()
  context.rect(
    portraitOrigin.x,
    portraitOrigin.y + splitY,
    portrait.width,
    portrait.height - splitY
  )
  context.clip()
  context.drawImage(
    cropState.image,
    portraitOrigin.x + rect.x,
    portraitOrigin.y + rect.y,
    rect.width,
    rect.height
  )
  context.restore()

  context.save()
  context.beginPath()
  context.rect(0, 0, width, portraitOrigin.y + splitY)
  context.clip()
  context.drawImage(
    cropState.image,
    portraitOrigin.x + rect.x,
    portraitOrigin.y + rect.y,
    rect.width,
    rect.height
  )
  context.restore()

  context.save()
  context.lineWidth = 8
  context.strokeStyle = 'rgba(69, 56, 83, 0.96)'
  context.strokeRect(portraitOrigin.x, portraitOrigin.y, portrait.width, portrait.height)

  context.lineWidth = 5
  context.strokeStyle = 'rgba(214, 79, 114, 0.9)'
  context.beginPath()
  context.moveTo(0, portraitOrigin.y + splitY)
  context.lineTo(width, portraitOrigin.y + splitY)
  context.stroke()

  context.lineWidth = 2
  context.strokeStyle = 'rgba(255, 255, 255, 0.82)'
  context.beginPath()
  context.moveTo(0, portraitOrigin.y + splitY - 7)
  context.lineTo(width, portraitOrigin.y + splitY - 7)
  context.moveTo(0, portraitOrigin.y + splitY + 7)
  context.lineTo(width, portraitOrigin.y + splitY + 7)
  context.stroke()
  context.restore()
}

function getCustomPortraitCropDrawRect(cropState: NSPlateCustomPortraitCropState) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const scale = cropState.baseScale * cropState.scaleMultiplier
  const drawWidth = Math.round(cropState.sourceWidth * scale)
  const drawHeight = Math.round(cropState.sourceHeight * scale)

  return {
    x: Math.round((width - drawWidth) / 2 + cropState.offsetX),
    y: Math.round((height - drawHeight) / 2 + cropState.offsetY),
    width: drawWidth,
    height: drawHeight
  }
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
