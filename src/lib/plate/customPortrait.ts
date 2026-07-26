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
    rotation: 0,
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
    customPortrait.mode === 'paired'
      ? customPortrait.dataUrl
      : customPortrait.sourceDataUrl || customPortrait.dataUrl
  const overlayDataUrl =
    customPortrait.mode === 'paired' ? customPortrait.overlayDataUrl : undefined
  const [image, overlayImage] = await Promise.all([
    loadImage(sourceDataUrl),
    overlayDataUrl ? loadImage(overlayDataUrl) : Promise.resolve(undefined)
  ])
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight

  if (!sourceWidth || !sourceHeight) {
    throw new Error('image-size')
  }

  if (
    customPortrait.mode === 'paired' &&
    (!overlayImage ||
      overlayImage.naturalWidth !== sourceWidth ||
      overlayImage.naturalHeight !== sourceHeight)
  ) {
    throw new Error('image-size-mismatch')
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
    overlayFileName: customPortrait.overlayFileName,
    overlayDataUrl,
    overlayImage,
    sourceWidth,
    sourceHeight,
    baseScale:
      customPortrait.baseScale ??
      Math.max(
        NSPLATE_CANVAS_DIMENSIONS.portrait.width / sourceWidth,
        NSPLATE_CANVAS_DIMENSIONS.portrait.height / sourceHeight
      ),
    mode: customPortrait.mode,
    popoutLayerAnchor: customPortrait.popoutLayerAnchor,
    pairedPopoutLayerAnchor: customPortrait.pairedPopoutLayerAnchor,
    scaleMultiplier:
      customPortrait.mode === 'standard' || customPortrait.mode === 'popout'
        ? (customPortrait.scaleMultiplier ?? 1)
        : 1,
    offsetX:
      customPortrait.mode === 'standard' || customPortrait.mode === 'popout'
        ? (customPortrait.offsetX ?? 0)
        : 0,
    offsetY:
      customPortrait.mode === 'standard' || customPortrait.mode === 'popout'
        ? (customPortrait.offsetY ?? 0)
        : 0,
    rotation:
      customPortrait.mode === 'standard' || customPortrait.mode === 'popout'
        ? (customPortrait.rotation ?? 0)
        : 0,
    splitY: splitLine.centerY,
    splitLeftY: splitLine.leftY,
    splitRightY: splitLine.rightY,
    freeLayerAnchor: customPortrait.freeLayerAnchor,
    freeX: customPortrait.freeX ?? NSPLATE_CANVAS_DIMENSIONS.nameplate.width / 2,
    freeY: customPortrait.freeY ?? NSPLATE_CANVAS_DIMENSIONS.nameplate.height / 2,
    freeScale: customPortrait.freeScale ?? getDefaultFreeScale(sourceWidth, sourceHeight),
    freeRotation: customPortrait.freeRotation ?? 0
  } satisfies NSPlateCustomPortraitCropState

  upgradeLegacyFreeScale(cropState)
  clampCustomPortraitCropState(cropState)
  return cropState
}

export async function createCustomPortraitImageFromCropState(
  cropState: NSPlateCustomPortraitCropState
): Promise<NSPlateCustomPortraitImage> {
  if (cropState.mode === 'paired' && !cropState.overlayDataUrl) {
    throw new Error('paired-overlay-required')
  }

  const dataUrl =
    cropState.mode === 'free' || cropState.mode === 'paired'
      ? cropState.sourceDataUrl
      : createPortraitDataUrl(cropState)
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const popoutSource = cropState.mode === 'popout' ? createPopoutSourceDataUrl(cropState) : null

  return {
    id: [
      cropState.id,
      cropState.mode,
      cropState.scaleMultiplier.toFixed(3),
      Math.round(cropState.offsetX),
      Math.round(cropState.offsetY),
      cropState.rotation.toFixed(1),
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
          sourceDataUrl: cropState.sourceDataUrl,
          sourceWidth: cropState.sourceWidth,
          sourceHeight: cropState.sourceHeight,
          baseScale: cropState.baseScale,
          scaleMultiplier: cropState.scaleMultiplier,
          offsetX: cropState.offsetX,
          offsetY: cropState.offsetY,
          rotation: cropState.rotation,
          ...(popoutSource
            ? {
                renderDataUrl: popoutSource.dataUrl,
                renderWidth: popoutSource.width,
                renderHeight: popoutSource.height,
                renderOffsetX: popoutSource.offsetX,
                renderOffsetY: popoutSource.offsetY
              }
            : {}),
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
        : cropState.mode === 'paired'
          ? {
              pairedPopoutLayerAnchor:
                cropState.pairedPopoutLayerAnchor ??
                NSPLATE_CUSTOM_PORTRAIT_DEFAULT_POPOUT_LAYER_ANCHOR,
              overlayFileName: cropState.overlayFileName,
              overlayDataUrl: cropState.overlayDataUrl,
              overlayWidth: cropState.sourceWidth,
              overlayHeight: cropState.sourceHeight,
              sourceWidth: cropState.sourceWidth,
              sourceHeight: cropState.sourceHeight,
              freeX: cropState.freeX,
              freeY: cropState.freeY,
              freeScale: cropState.freeScale,
              freeRotation: cropState.freeRotation
            }
          : cropState.mode === 'standard'
            ? {
                sourceDataUrl: cropState.sourceDataUrl,
                sourceWidth: cropState.sourceWidth,
                sourceHeight: cropState.sourceHeight,
                baseScale: cropState.baseScale,
                scaleMultiplier: cropState.scaleMultiplier,
                offsetX: cropState.offsetX,
                offsetY: cropState.offsetY,
                rotation: cropState.rotation
              }
            : {})
  }
}

export async function setCustomPortraitPairedOverlayFromFile(
  cropState: NSPlateCustomPortraitCropState,
  file: File
) {
  const overlayDataUrl = await readFileAsDataUrl(file)
  const overlayImage = await loadImage(overlayDataUrl)

  if (!overlayImage.naturalWidth || !overlayImage.naturalHeight) {
    throw new Error('image-size')
  }

  if (
    overlayImage.naturalWidth !== cropState.sourceWidth ||
    overlayImage.naturalHeight !== cropState.sourceHeight
  ) {
    throw new Error('image-size-mismatch')
  }

  cropState.overlayFileName = file.name
  cropState.overlayDataUrl = overlayDataUrl
  cropState.overlayImage = overlayImage
  cropState.mode = 'paired'
  clampCustomPortraitCropState(cropState)
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

  if (cropState.mode === 'paired') {
    drawCustomPortraitPairedCropPreview(canvas, cropState, portraitSide)
    return
  }

  drawCustomPortraitStandardCropPreview(canvas, cropState, portraitSide)
}

export function getCustomPortraitCropPreviewDimensions() {
  return NSPLATE_CANVAS_DIMENSIONS.nameplate
}

function drawCustomPortraitStandardCropPreview(
  canvas: HTMLCanvasElement,
  cropState: NSPlateCustomPortraitCropState,
  portraitSide: NSPlatePortraitSide
) {
  const dimensions = NSPLATE_CANVAS_DIMENSIONS.nameplate
  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const portraitOrigin = NSPLATE_PORTRAIT_EMBED[portraitSide]
  canvas.width = dimensions.width
  canvas.height = dimensions.height

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  context.clearRect(0, 0, dimensions.width, dimensions.height)
  context.save()
  context.translate(portraitOrigin.x, portraitOrigin.y)
  drawCustomPortraitCropToContext(context, cropState)
  context.restore()

  context.save()
  context.lineWidth = 8
  context.strokeStyle = 'rgba(69, 56, 83, 0.96)'
  context.strokeRect(portraitOrigin.x, portraitOrigin.y, portrait.width, portrait.height)
  context.restore()
}

export function clampCustomPortraitCropState(cropState: NSPlateCustomPortraitCropState) {
  cropState.rotation = normalizeRotation(cropState.rotation)
  const minZoom = getCustomPortraitCropMinZoom(cropState)
  cropState.scaleMultiplier = Math.max(
    minZoom,
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
  cropState.freeRotation = normalizeRotation(cropState.freeRotation)
  clampCustomPortraitCropCenter(cropState)
}

export function getCustomPortraitCropMinZoom(cropState: NSPlateCustomPortraitCropState) {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const radians = (normalizeRotation(cropState.rotation) * Math.PI) / 180
  const cosine = Math.abs(Math.cos(radians))
  const sine = Math.abs(Math.sin(radians))
  const requiredScale = Math.max(
    (width * cosine + height * sine) / Math.max(1, cropState.sourceWidth),
    (width * sine + height * cosine) / Math.max(1, cropState.sourceHeight)
  )

  return Math.max(
    CUSTOM_PORTRAIT_MIN_ZOOM,
    Math.min(CUSTOM_PORTRAIT_MAX_ZOOM, requiredScale / Math.max(0.0001, cropState.baseScale))
  )
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
  mode: NSPlateCustomPortraitMode,
  portraitSide?: NSPlatePortraitSide
) {
  const shouldCenterPaired =
    mode === 'paired' && cropState.mode !== 'paired' && !cropState.overlayImage
  cropState.mode = mode
  upgradeLegacyFreeScale(cropState)

  if (shouldCenterPaired && portraitSide) {
    centerCustomPortraitPairedTransform(cropState, portraitSide)
  }

  clampCustomPortraitCropState(cropState)
}

export function centerCustomPortraitPairedTransform(
  cropState: NSPlateCustomPortraitCropState,
  portraitSide: NSPlatePortraitSide
) {
  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const origin = NSPLATE_PORTRAIT_EMBED[portraitSide]
  cropState.freeX = origin.x + portrait.width / 2
  cropState.freeY = origin.y + portrait.height / 2
  cropState.freeScale = Math.max(
    portrait.width / cropState.sourceWidth,
    portrait.height / cropState.sourceHeight
  )
}

export function getCustomPortraitSourceDrawRect(
  customPortrait: NSPlateCustomPortraitImage
): NSPlateCustomPortraitDrawRect {
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const usesRenderSource = customPortrait.mode === 'popout' && Boolean(customPortrait.renderDataUrl)
  const sourceWidth = usesRenderSource
    ? (customPortrait.renderWidth ?? customPortrait.width)
    : (customPortrait.sourceWidth ?? customPortrait.width)
  const sourceHeight = usesRenderSource
    ? (customPortrait.renderHeight ?? customPortrait.height)
    : (customPortrait.sourceHeight ?? customPortrait.height)
  const baseScale = usesRenderSource
    ? 1
    : (customPortrait.baseScale ??
      Math.max(width / Math.max(1, sourceWidth), height / Math.max(1, sourceHeight)))
  const scale = baseScale * (usesRenderSource ? 1 : (customPortrait.scaleMultiplier ?? 1))
  const drawWidth = Math.round(sourceWidth * scale)
  const drawHeight = Math.round(sourceHeight * scale)
  const offsetX = usesRenderSource
    ? (customPortrait.renderOffsetX ?? 0)
    : (customPortrait.offsetX ?? 0)
  const offsetY = usesRenderSource
    ? (customPortrait.renderOffsetY ?? 0)
    : (customPortrait.offsetY ?? 0)

  return {
    x: Math.round((width - drawWidth) / 2 + offsetX),
    y: Math.round((height - drawHeight) / 2 + offsetY),
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
  const visibleRect = getVisiblePopoutSourceRect(
    getRotatedCustomPortraitDrawBounds(sourceRect, cropState.rotation)
  )
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, visibleRect.width)
  canvas.height = Math.max(1, visibleRect.height)

  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  drawCustomPortraitCropImage(
    context,
    cropState.image,
    sourceRect,
    cropState.rotation,
    -visibleRect.x,
    -visibleRect.y
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
  drawCustomPortraitCropImage(context, cropState.image, rect, cropState.rotation)
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

function drawCustomPortraitPairedCropPreview(
  canvas: HTMLCanvasElement,
  cropState: NSPlateCustomPortraitCropState,
  portraitSide: NSPlatePortraitSide
) {
  const dimensions = NSPLATE_CANVAS_DIMENSIONS.nameplate
  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const portraitOrigin = NSPLATE_PORTRAIT_EMBED[portraitSide]
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  context.clearRect(0, 0, dimensions.width, dimensions.height)
  context.save()
  context.beginPath()
  context.rect(portraitOrigin.x, portraitOrigin.y, portrait.width, portrait.height)
  context.clip()
  drawCustomPortraitFreeImage(
    context,
    cropState.image,
    cropState.sourceWidth,
    cropState.sourceHeight,
    cropState
  )
  context.restore()

  context.save()
  context.lineWidth = 8
  context.strokeStyle = 'rgba(69, 56, 83, 0.96)'
  context.strokeRect(portraitOrigin.x, portraitOrigin.y, portrait.width, portrait.height)
  context.restore()

  if (cropState.overlayImage) {
    drawCustomPortraitFreeImage(
      context,
      cropState.overlayImage,
      cropState.sourceWidth,
      cropState.sourceHeight,
      cropState
    )
  }

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
  drawCustomPortraitCropImage(
    context,
    cropState.image,
    rect,
    cropState.rotation,
    portraitOrigin.x,
    portraitOrigin.y
  )
  context.restore()

  context.save()
  context.beginPath()
  traceCustomPortraitPopoutClipPath(context, cropState, width, portraitOrigin.x, portraitOrigin.y)
  context.clip()
  drawCustomPortraitCropImage(
    context,
    cropState.image,
    rect,
    cropState.rotation,
    portraitOrigin.x,
    portraitOrigin.y
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

function setHighQualityImageSmoothing(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
) {
  context.imageSmoothingEnabled = true

  if ('imageSmoothingQuality' in context) {
    context.imageSmoothingQuality = 'high'
  }
}

function drawCustomPortraitCropImage(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  image: CanvasImageSource,
  rect: NSPlateCustomPortraitDrawRect,
  rotation: number,
  originX = 0,
  originY = 0
) {
  context.save()
  setHighQualityImageSmoothing(context)
  context.translate(originX + rect.x + rect.width / 2, originY + rect.y + rect.height / 2)
  context.rotate((rotation * Math.PI) / 180)
  context.drawImage(image, -rect.width / 2, -rect.height / 2, rect.width, rect.height)
  context.restore()
}

function getRotatedCustomPortraitDrawBounds(rect: NSPlateCustomPortraitDrawRect, rotation: number) {
  const radians = (rotation * Math.PI) / 180
  const cosine = Math.abs(Math.cos(radians))
  const sine = Math.abs(Math.sin(radians))
  const width = rect.width * cosine + rect.height * sine
  const height = rect.width * sine + rect.height * cosine
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height
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

function clampCustomPortraitCropCenter(cropState: NSPlateCustomPortraitCropState) {
  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const rect = getCustomPortraitCropDrawRect(cropState)
  const radians = (cropState.rotation * Math.PI) / 180
  const cosine = Math.cos(radians)
  const sine = Math.sin(radians)
  const axisX = { x: cosine, y: sine }
  const axisY = { x: -sine, y: cosine }
  const corners = [
    { x: 0, y: 0 },
    { x: portrait.width, y: 0 },
    { x: portrait.width, y: portrait.height },
    { x: 0, y: portrait.height }
  ]
  const center = {
    x: portrait.width / 2 + cropState.offsetX,
    y: portrait.height / 2 + cropState.offsetY
  }
  const centerOnX = dotPoint(center, axisX)
  const centerOnY = dotPoint(center, axisY)
  const cornerX = corners.map((corner) => dotPoint(corner, axisX))
  const cornerY = corners.map((corner) => dotPoint(corner, axisY))
  const halfWidth = rect.width / 2
  const halfHeight = rect.height / 2
  const clampedX = clampNumber(
    centerOnX,
    Math.max(...cornerX) - halfWidth,
    Math.min(...cornerX) + halfWidth
  )
  const clampedY = clampNumber(
    centerOnY,
    Math.max(...cornerY) - halfHeight,
    Math.min(...cornerY) + halfHeight
  )
  const nextCenter = {
    x: clampedX * axisX.x + clampedY * axisY.x,
    y: clampedX * axisX.y + clampedY * axisY.y
  }
  cropState.offsetX = nextCenter.x - portrait.width / 2
  cropState.offsetY = nextCenter.y - portrait.height / 2
}

function dotPoint(left: { x: number; y: number }, right: { x: number; y: number }) {
  return left.x * right.x + left.y * right.y
}

function clampNumber(value: number, minimum: number, maximum: number) {
  if (minimum > maximum) {
    return (minimum + maximum) / 2
  }
  return Math.max(minimum, Math.min(maximum, value))
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

function normalizeRotation(value: number) {
  const normalized = Number.isFinite(value) ? Number(value) : 0
  return ((((normalized + 180) % 360) + 360) % 360) - 180
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
