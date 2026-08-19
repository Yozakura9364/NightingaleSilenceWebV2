// 自定义肖像 crop state 的创建、归一化与模式切换。
// 依赖 customPortraitDraw 的低层绘制原语，不反向依赖。

import { NSPLATE_CANVAS_DIMENSIONS, NSPLATE_PORTRAIT_EMBED } from '@/lib/plate/render'
import type {
  NSPlateCustomPortraitCropState,
  NSPlateCustomPortraitImage,
  NSPlateCustomPortraitMode,
  NSPlatePortraitSide
} from '@/lib/plate/types'
import { NSPLATE_CUSTOM_PORTRAIT_DEFAULT_POPOUT_LAYER_ANCHOR } from '@/lib/plate/types'
import {
  clampCustomPortraitCropCenter,
  drawCustomPortraitCropImage,
  drawCustomPortraitCropToContext,
  getCustomPortraitCropDrawRect,
  getCustomPortraitPopoutSplitLine,
  getRotatedCustomPortraitDrawBounds,
  type NSPlateCustomPortraitDrawRect
} from '@/lib/plate/customPortraitDraw'

const CUSTOM_PORTRAIT_MIN_ZOOM = 1
const CUSTOM_PORTRAIT_MAX_ZOOM = 3
const CUSTOM_PORTRAIT_FREE_MIN_SCALE = 0.05
const CUSTOM_PORTRAIT_FREE_MAX_SCALE = 3

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
