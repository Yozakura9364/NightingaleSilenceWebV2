import { NSPLATE_CANVAS_DIMENSIONS, NSPLATE_PORTRAIT_EMBED } from '@/lib/plate/render'
import type {
  NSPlateCustomPortraitCropState,
  NSPlateCustomPortraitImage,
  NSPlateCustomPortraitMode,
  NSPlatePortraitSide
} from '@/lib/plate/types'
import { NSPLATE_CUSTOM_PORTRAIT_DEFAULT_POPOUT_LAYER_ANCHOR } from '@/lib/plate/types'

export interface NSPlateCustomPortraitDrawRect {
  x: number
  y: number
  width: number
  height: number
}

export interface NSPlateCustomPortraitSplitLine {
  leftY: number
  rightY: number
  centerY: number
  inFrameLeftY: number
  inFrameRightY: number
  popoutLeftY: number
  popoutRightY: number
}

type NSPlateCustomPortraitSplitSource = {
  splitY?: number
  splitLeftY?: number
  splitRightY?: number
}

const CUSTOM_PORTRAIT_MIN_ZOOM = 1
const CUSTOM_PORTRAIT_MAX_ZOOM = 3
const CUSTOM_PORTRAIT_FREE_MIN_SCALE = 0.05
const CUSTOM_PORTRAIT_FREE_MAX_SCALE = 3
const CUSTOM_PORTRAIT_POPOUT_SPLIT_GUARD_PX = 2

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

  const splitY = Math.round(height * 0.34)
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
    splitY,
    splitLeftY: splitY,
    splitRightY: splitY,
    freeX: NSPLATE_CANVAS_DIMENSIONS.nameplate.width / 2,
    freeY: NSPLATE_CANVAS_DIMENSIONS.nameplate.height / 2,
    freeScale: getDefaultFreeScale(sourceWidth, sourceHeight),
    freeRotation: 0
  } satisfies NSPlateCustomPortraitCropState

  clampCustomPortraitCropState(cropState)
  return cropState
}

export async function createCustomPortraitCropStateFromImage(
  customPortrait: NSPlateCustomPortraitImage
): Promise<NSPlateCustomPortraitCropState> {
  const sourceDataUrl =
    customPortrait.mode === 'popout' || customPortrait.mode === 'free'
      ? customPortrait.sourceDataUrl || customPortrait.dataUrl
      : customPortrait.dataUrl
  const image = await loadImage(sourceDataUrl)
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight

  if (!sourceWidth || !sourceHeight) {
    throw new Error('image-size')
  }

  const defaultSplitY = Math.round(NSPLATE_CANVAS_DIMENSIONS.portrait.height * 0.34)
  const splitLine = getCustomPortraitPopoutSplitLine({
    splitY: customPortrait.mode === 'popout' ? customPortrait.splitY : defaultSplitY,
    splitLeftY: customPortrait.mode === 'popout' ? customPortrait.splitLeftY : defaultSplitY,
    splitRightY: customPortrait.mode === 'popout' ? customPortrait.splitRightY : defaultSplitY
  })
  const cropState = {
    id: customPortrait.id,
    fileName: customPortrait.fileName,
    sourceDataUrl,
    image,
    sourceWidth,
    sourceHeight,
    baseScale: customPortrait.mode === 'popout' ? (customPortrait.baseScale ?? 1) : 1,
    mode: customPortrait.mode,
    popoutLayerAnchor: customPortrait.popoutLayerAnchor,
    scaleMultiplier:
      customPortrait.mode === 'popout' ? (customPortrait.scaleMultiplier ?? 1) : 1,
    offsetX: customPortrait.mode === 'popout' ? (customPortrait.offsetX ?? 0) : 0,
    offsetY: customPortrait.mode === 'popout' ? (customPortrait.offsetY ?? 0) : 0,
    splitY: splitLine.centerY,
    splitLeftY: splitLine.leftY,
    splitRightY: splitLine.rightY,
    freeLayerAnchor: customPortrait.freeLayerAnchor,
    freeX: customPortrait.freeX ?? NSPLATE_CANVAS_DIMENSIONS.nameplate.width / 2,
    freeY: customPortrait.freeY ?? NSPLATE_CANVAS_DIMENSIONS.nameplate.height / 2,
    freeScale:
      customPortrait.freeScale ?? getDefaultFreeScale(sourceWidth, sourceHeight),
    freeRotation: customPortrait.freeRotation ?? 0
  } satisfies NSPlateCustomPortraitCropState

  upgradeLegacyFreeScale(cropState)
  clampCustomPortraitCropState(cropState)
  return cropState
}

export async function createCustomPortraitImageFromCropState(
  cropState: NSPlateCustomPortraitCropState
): Promise<NSPlateCustomPortraitImage> {
  const dataUrl =
    cropState.mode === 'free' ? cropState.sourceDataUrl : createPortraitDataUrl(cropState)
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const popoutSource = cropState.mode === 'popout' ? createPopoutSourceDataUrl(cropState) : null

  return {
    id: [
      cropState.id,
      cropState.mode,
      cropState.scaleMultiplier.toFixed(3),
      Math.round(cropState.offsetX),
      Math.round(cropState.offsetY),
      Math.round(cropState.splitLeftY),
      Math.round(cropState.splitRightY)
    ].join(':'),
    mode: cropState.mode,
    fileName: cropState.fileName,
    dataUrl,
    width,
    height,
    scale: 1,
    ...(cropState.mode === 'popout'
      ? {
          popoutLayerAnchor:
            cropState.popoutLayerAnchor ?? NSPLATE_CUSTOM_PORTRAIT_DEFAULT_POPOUT_LAYER_ANCHOR,
          sourceDataUrl: popoutSource?.dataUrl ?? cropState.sourceDataUrl,
          sourceWidth: popoutSource?.width ?? cropState.sourceWidth,
          sourceHeight: popoutSource?.height ?? cropState.sourceHeight,
          baseScale: popoutSource ? 1 : cropState.baseScale,
          scaleMultiplier: popoutSource ? 1 : cropState.scaleMultiplier,
          offsetX: popoutSource?.offsetX ?? cropState.offsetX,
          offsetY: popoutSource?.offsetY ?? cropState.offsetY,
          splitY: cropState.splitY,
          splitLeftY: cropState.splitLeftY,
          splitRightY: cropState.splitRightY
        }
      : cropState.mode === 'free'
        ? {
            freeLayerAnchor: cropState.freeLayerAnchor ?? 'portraitBase',
            sourceDataUrl: cropState.sourceDataUrl,
            sourceWidth: cropState.sourceWidth,
            sourceHeight: cropState.sourceHeight,
            freeX: cropState.freeX,
            freeY: cropState.freeY,
            freeScale: cropState.freeScale,
            freeRotation: cropState.freeRotation
          }
        : {})
  }
}

export function drawCustomPortraitCropPreview(
  canvas: HTMLCanvasElement,
  cropState: NSPlateCustomPortraitCropState,
  portraitSide: NSPlatePortraitSide = 'right'
) {
  if (cropState.mode === 'popout') {
    drawCustomPortraitPopoutCropPreview(canvas, cropState, portraitSide)
    return
  }

  if (cropState.mode === 'free') {
    drawCustomPortraitFreeCropPreview(canvas, cropState, portraitSide)
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
  return cropState.mode === 'popout' || cropState.mode === 'free'
    ? NSPLATE_CANVAS_DIMENSIONS.nameplate
    : NSPLATE_CANVAS_DIMENSIONS.portrait
}

export function clampCustomPortraitCropState(cropState: NSPlateCustomPortraitCropState) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  cropState.scaleMultiplier = Math.max(
    CUSTOM_PORTRAIT_MIN_ZOOM,
    Math.min(CUSTOM_PORTRAIT_MAX_ZOOM, cropState.scaleMultiplier)
  )
  const splitLine = getCustomPortraitPopoutSplitLine(cropState)
  cropState.splitLeftY = splitLine.leftY
  cropState.splitRightY = splitLine.rightY
  cropState.splitY = splitLine.centerY

  cropState.freeScale = Math.max(
    CUSTOM_PORTRAIT_FREE_MIN_SCALE,
    Math.min(CUSTOM_PORTRAIT_FREE_MAX_SCALE, cropState.freeScale)
  )
  cropState.freeRotation = normalizeFreeRotation(cropState.freeRotation)

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
    minFreeScale: CUSTOM_PORTRAIT_FREE_MIN_SCALE,
    maxFreeScale: CUSTOM_PORTRAIT_FREE_MAX_SCALE,
    minSplitY: 0,
    maxSplitY: NSPLATE_CANVAS_DIMENSIONS.portrait.height
  }
}

export function setCustomPortraitCropMode(
  cropState: NSPlateCustomPortraitCropState,
  mode: NSPlateCustomPortraitMode
) {
  cropState.mode = mode
  upgradeLegacyFreeScale(cropState)
  clampCustomPortraitCropState(cropState)
}

export function getCustomPortraitSourceDrawRect(
  customPortrait: NSPlateCustomPortraitImage
): NSPlateCustomPortraitDrawRect {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const sourceWidth = customPortrait.sourceWidth ?? customPortrait.width
  const sourceHeight = customPortrait.sourceHeight ?? customPortrait.height
  const baseScale =
    customPortrait.baseScale ??
    Math.max(width / Math.max(1, sourceWidth), height / Math.max(1, sourceHeight))
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

export function drawCustomPortraitFreeImage(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  source: Pick<NSPlateCustomPortraitImage, 'freeX' | 'freeY' | 'freeScale' | 'freeRotation'>
) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.nameplate
  const scale = Math.max(CUSTOM_PORTRAIT_FREE_MIN_SCALE, source.freeScale ?? 1)
  const x = source.freeX ?? width / 2
  const y = source.freeY ?? height / 2
  const rotation = ((source.freeRotation ?? 0) * Math.PI) / 180
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale

  context.save()
  setHighQualityImageSmoothing(context)
  context.translate(x, y)
  context.rotate(rotation)
  context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
  context.restore()
}

export function getCustomPortraitPopoutSplitLine(
  source: NSPlateCustomPortraitSplitSource
): NSPlateCustomPortraitSplitLine {
  const { height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const fallbackY = clampSplitY(source.splitY, height)
  const leftY = clampSplitY(source.splitLeftY ?? fallbackY, height)
  const rightY = clampSplitY(source.splitRightY ?? fallbackY, height)

  return {
    leftY,
    rightY,
    centerY: (leftY + rightY) / 2,
    inFrameLeftY: leftY - CUSTOM_PORTRAIT_POPOUT_SPLIT_GUARD_PX,
    inFrameRightY: rightY - CUSTOM_PORTRAIT_POPOUT_SPLIT_GUARD_PX,
    popoutLeftY: leftY + CUSTOM_PORTRAIT_POPOUT_SPLIT_GUARD_PX,
    popoutRightY: rightY + CUSTOM_PORTRAIT_POPOUT_SPLIT_GUARD_PX
  }
}

export function moveCustomPortraitPopoutSplitLine(
  cropState: NSPlateCustomPortraitCropState,
  nextCenterY: number
) {
  const { height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const splitLine = getCustomPortraitPopoutSplitLine(cropState)
  const requestedDelta = nextCenterY - splitLine.centerY
  const minDelta = -Math.min(splitLine.leftY, splitLine.rightY)
  const maxDelta = height - Math.max(splitLine.leftY, splitLine.rightY)
  const delta = Math.max(minDelta, Math.min(maxDelta, requestedDelta))
  cropState.splitLeftY = splitLine.leftY + delta
  cropState.splitRightY = splitLine.rightY + delta
  cropState.splitY = (cropState.splitLeftY + cropState.splitRightY) / 2
}

export function getCustomPortraitPopoutSplitAngle(source: NSPlateCustomPortraitSplitSource) {
  const { width } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const splitLine = getCustomPortraitPopoutSplitLine(source)
  return (Math.atan2(splitLine.rightY - splitLine.leftY, width) * 180) / Math.PI
}

export function setCustomPortraitPopoutSplitAngle(
  cropState: NSPlateCustomPortraitCropState,
  angleDegrees: number
) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const splitLine = getCustomPortraitPopoutSplitLine(cropState)
  const requestedDelta = Math.tan((angleDegrees * Math.PI) / 180) * width
  const maxDelta = 2 * Math.min(splitLine.centerY, height - splitLine.centerY)
  const delta = Math.max(-maxDelta, Math.min(maxDelta, requestedDelta))
  cropState.splitLeftY = splitLine.centerY - delta / 2
  cropState.splitRightY = splitLine.centerY + delta / 2
  clampCustomPortraitCropState(cropState)
}

export function traceCustomPortraitInFrameClipPath(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  source: NSPlateCustomPortraitSplitSource,
  originX = 0,
  originY = 0
) {
  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const splitLine = getCustomPortraitPopoutSplitLine(source)
  context.moveTo(originX, originY + splitLine.inFrameLeftY)
  context.lineTo(originX + portrait.width, originY + splitLine.inFrameRightY)
  context.lineTo(originX + portrait.width, originY + portrait.height)
  context.lineTo(originX, originY + portrait.height)
  context.closePath()
}

export function traceCustomPortraitPopoutClipPath(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  source: NSPlateCustomPortraitSplitSource,
  canvasWidth: number,
  portraitOriginX = 0,
  portraitOriginY = 0
) {
  const portraitWidth = NSPLATE_CANVAS_DIMENSIONS.portrait.width
  const splitLine = getCustomPortraitPopoutSplitLine(source)
  const slope = (splitLine.popoutRightY - splitLine.popoutLeftY) / portraitWidth
  const leftCanvasY = portraitOriginY + splitLine.popoutLeftY - portraitOriginX * slope
  const rightCanvasY = leftCanvasY + canvasWidth * slope
  context.moveTo(0, 0)
  context.lineTo(canvasWidth, 0)
  context.lineTo(canvasWidth, rightCanvasY)
  context.lineTo(0, leftCanvasY)
  context.closePath()
}

function clampSplitY(value: number | undefined, height: number) {
  const normalized = Number.isFinite(value) ? Number(value) : 0
  return Math.max(0, Math.min(height, normalized))
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

function createPopoutSourceDataUrl(cropState: NSPlateCustomPortraitCropState) {
  const sourceRect = getCustomPortraitCropDrawRect(cropState)
  const visibleRect = getVisiblePopoutSourceRect(sourceRect)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, visibleRect.width)
  canvas.height = Math.max(1, visibleRect.height)

  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  setHighQualityImageSmoothing(context)
  context.drawImage(
    cropState.image,
    sourceRect.x - visibleRect.x,
    sourceRect.y - visibleRect.y,
    sourceRect.width,
    sourceRect.height
  )

  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
    offsetX: visibleRect.x - Math.round((width - canvas.width) / 2),
    offsetY: visibleRect.y - Math.round((height - canvas.height) / 2)
  }
}

function getVisiblePopoutSourceRect(sourceRect: NSPlateCustomPortraitDrawRect) {
  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const nameplate = NSPLATE_CANVAS_DIMENSIONS.nameplate
  const portraitOrigins = Object.values(NSPLATE_PORTRAIT_EMBED)
  const visibleBounds = {
    x: Math.min(0, ...portraitOrigins.map((origin) => -origin.x)),
    y: Math.min(0, ...portraitOrigins.map((origin) => -origin.y)),
    right: Math.max(portrait.width, ...portraitOrigins.map((origin) => nameplate.width - origin.x)),
    bottom: portrait.height
  }
  const x = Math.max(sourceRect.x, visibleBounds.x)
  const y = Math.max(sourceRect.y, visibleBounds.y)
  const right = Math.min(sourceRect.x + sourceRect.width, visibleBounds.right)
  const bottom = Math.min(sourceRect.y + sourceRect.height, visibleBounds.bottom)

  if (right <= x || bottom <= y) {
    return { x: 0, y: 0, width: portrait.width, height: portrait.height }
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(1, Math.round(right - x)),
    height: Math.max(1, Math.round(bottom - y))
  }
}

function drawCustomPortraitCropToContext(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  cropState: NSPlateCustomPortraitCropState
) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const rect = getCustomPortraitCropDrawRect(cropState)

  context.clearRect(0, 0, width, height)
  context.save()
  context.beginPath()
  context.rect(0, 0, width, height)
  context.clip()
  setHighQualityImageSmoothing(context)
  context.drawImage(cropState.image, rect.x, rect.y, rect.width, rect.height)
  context.restore()
}

function drawCustomPortraitFreeCropPreview(
  canvas: HTMLCanvasElement,
  cropState: NSPlateCustomPortraitCropState,
  portraitSide: NSPlatePortraitSide = 'right'
) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.nameplate
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  context.clearRect(0, 0, width, height)
  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const portraitOrigin = NSPLATE_PORTRAIT_EMBED[portraitSide]
  context.save()
  context.lineWidth = 8
  context.strokeStyle = 'rgba(69, 56, 83, 0.96)'
  context.strokeRect(portraitOrigin.x, portraitOrigin.y, portrait.width, portrait.height)
  context.restore()
  drawCustomPortraitFreeImage(
    context,
    cropState.image,
    cropState.sourceWidth,
    cropState.sourceHeight,
    cropState
  )

  const drawWidth = cropState.sourceWidth * cropState.freeScale
  const drawHeight = cropState.sourceHeight * cropState.freeScale
  context.save()
  context.translate(cropState.freeX, cropState.freeY)
  context.rotate((cropState.freeRotation * Math.PI) / 180)
  context.setLineDash([18, 12])
  context.lineWidth = 4
  context.strokeStyle = 'rgba(214, 79, 114, 0.96)'
  context.strokeRect(-drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
  context.restore()
}

function drawCustomPortraitPopoutCropPreview(
  canvas: HTMLCanvasElement,
  cropState: NSPlateCustomPortraitCropState,
  portraitSide: NSPlatePortraitSide
) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.nameplate
  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const portraitOrigin = NSPLATE_PORTRAIT_EMBED[portraitSide]
  const rect = getCustomPortraitCropDrawRect(cropState)
  const splitLine = getCustomPortraitPopoutSplitLine(cropState)
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  context.clearRect(0, 0, width, height)
  setHighQualityImageSmoothing(context)

  context.save()
  context.beginPath()
  traceCustomPortraitInFrameClipPath(context, cropState, portraitOrigin.x, portraitOrigin.y)
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
  traceCustomPortraitPopoutClipPath(
    context,
    cropState,
    width,
    portraitOrigin.x,
    portraitOrigin.y
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
  context.lineWidth = 8
  context.strokeStyle = 'rgba(69, 56, 83, 0.96)'
  context.strokeRect(portraitOrigin.x, portraitOrigin.y, portrait.width, portrait.height)

  context.lineWidth = 5
  context.strokeStyle = 'rgba(214, 79, 114, 0.9)'
  context.beginPath()
  const slope = (splitLine.rightY - splitLine.leftY) / portrait.width
  const previewLeftY = portraitOrigin.y + splitLine.leftY - portraitOrigin.x * slope
  const previewRightY = previewLeftY + width * slope
  context.moveTo(0, previewLeftY)
  context.lineTo(width, previewRightY)
  context.stroke()

  context.lineWidth = 2
  context.strokeStyle = 'rgba(255, 255, 255, 0.82)'
  context.beginPath()
  context.moveTo(0, previewLeftY - 7)
  context.lineTo(width, previewRightY - 7)
  context.moveTo(0, previewLeftY + 7)
  context.lineTo(width, previewRightY + 7)
  context.stroke()

  context.fillStyle = 'rgba(255, 255, 255, 0.96)'
  context.strokeStyle = 'rgba(214, 79, 114, 0.96)'
  context.lineWidth = 4
  for (const [x, y] of [
    [portraitOrigin.x, portraitOrigin.y + splitLine.leftY],
    [portraitOrigin.x + portrait.width, portraitOrigin.y + splitLine.rightY]
  ]) {
    context.beginPath()
    context.arc(x, y, 14, 0, Math.PI * 2)
    context.fill()
    context.stroke()
  }
  context.restore()
}

function setHighQualityImageSmoothing(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
  context.imageSmoothingEnabled = true

  if ('imageSmoothingQuality' in context) {
    context.imageSmoothingQuality = 'high'
  }
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

function getDefaultFreeScale(sourceWidth: number, sourceHeight: number) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  return Math.min(
    CUSTOM_PORTRAIT_FREE_MAX_SCALE,
    Math.max(width / sourceWidth, height / sourceHeight)
  )
}

function getLegacyFreeScale(sourceWidth: number, sourceHeight: number) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.nameplate
  return Math.min(1, Math.min(width / sourceWidth, height / sourceHeight))
}

function upgradeLegacyFreeScale(cropState: NSPlateCustomPortraitCropState) {
  if (cropState.mode !== 'free') {
    return
  }

  const legacyScale = getLegacyFreeScale(cropState.sourceWidth, cropState.sourceHeight)
  if (Math.abs(cropState.freeScale - legacyScale) < 0.001) {
    cropState.freeScale = getDefaultFreeScale(cropState.sourceWidth, cropState.sourceHeight)
  }
}

function normalizeFreeRotation(value: number) {
  const normalized = Number.isFinite(value) ? Number(value) : 0
  return ((normalized + 180) % 360 + 360) % 360 - 180
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
