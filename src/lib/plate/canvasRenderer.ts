import {
  NSPLATE_CANVAS_DIMENSIONS,
  getNameplateRenderSegments,
  getPlateLayerImageUrl,
  type NSPlateLayerPosition,
  type NSPlateNameplateRenderSegment,
  type NSPlateNameplateRenderPlan,
  type NSPlateRenderImageLayer
} from '@/lib/plate/render'
import {
  drawCustomPortraitFreeImage,
  getCustomPortraitSourceDrawRect,
  traceCustomPortraitInFrameClipPath,
  traceCustomPortraitPopoutClipPath
} from '@/lib/plate/customPortrait'
import { drawNSPlateInfoGraphicLayers } from '@/lib/plate/infoLayerImageRenderer'
import { drawNSPlateInfoTextLayers } from '@/lib/plate/infoLayerTextRenderer'
import type { NSPlateCustomPortraitImage } from '@/lib/plate/types'

export type NSPlateImageCache = Map<string, Promise<HTMLImageElement | null>>

export interface NSPlateCanvasRenderOptions {
  imageCache?: NSPlateImageCache
  isCurrent?: () => boolean
}

export async function renderNameplateToCanvas(
  canvas: HTMLCanvasElement,
  plan: NSPlateNameplateRenderPlan,
  options: NSPlateCanvasRenderOptions = {}
) {
  const context = prepareCanvas(canvas, plan.dimensions.width, plan.dimensions.height)

  if (!context) {
    return
  }

  await renderNameplatePlan(context, plan, options)
}

function isCurrentRender(options: NSPlateCanvasRenderOptions) {
  return options.isCurrent?.() ?? true
}

async function renderNameplatePlan(
  context: CanvasRenderingContext2D,
  plan: NSPlateNameplateRenderPlan,
  options: NSPlateCanvasRenderOptions
) {
  for (const segment of getNameplateRenderSegments(plan)) {
    await drawNameplateSegment(context, segment, options)

    if (!isCurrentRender(options)) {
      return
    }
  }
}

async function drawNameplateSegment(
  context: CanvasRenderingContext2D,
  segment: NSPlateNameplateRenderSegment,
  options: NSPlateCanvasRenderOptions
) {
  if (segment.type === 'systemLayers') {
    await drawLayers(context, segment.layers, options)
    return
  }

  if (segment.type === 'portraitBaseComposite') {
    await drawPortraitBaseComposite(context, segment, options)
    return
  }

  if (segment.type === 'portraitOverlayComposite') {
    await drawPortraitOverlayComposite(context, segment, options)
    return
  }

  if (segment.type === 'customPortraitPopout') {
    await drawCustomPortraitPopout(context, segment.customPortrait, segment.portraitEmbed, options)
    return
  }

  if (segment.type === 'infoLayers') {
    await drawNSPlateInfoGraphicLayers(context, segment.graphicLayers, {
      imageCache: options.imageCache,
      isCurrent: options.isCurrent
    })

    if (!isCurrentRender(options)) {
      return
    }

    await drawNSPlateInfoTextLayers(context, segment.textLayers)
    return
  }
}

async function drawPortraitBaseComposite(
  context: CanvasRenderingContext2D,
  segment: Extract<NSPlateNameplateRenderSegment, { type: 'portraitBaseComposite' }>,
  options: NSPlateCanvasRenderOptions
) {
  const portraitCanvas = document.createElement('canvas')
  const portraitContext = prepareCanvas(
    portraitCanvas,
    NSPLATE_CANVAS_DIMENSIONS.portrait.width,
    NSPLATE_CANVAS_DIMENSIONS.portrait.height
  )

  if (!portraitContext) {
    return
  }

  await drawLayers(portraitContext, segment.portraitBaseLayers, options)

  if (!isCurrentRender(options)) {
    return
  }

  await drawCustomPortraitInFrame(portraitContext, segment.customPortrait, options)

  if (!isCurrentRender(options)) {
    return
  }

  context.drawImage(portraitCanvas, segment.portraitEmbed.x, segment.portraitEmbed.y)
}

async function drawPortraitOverlayComposite(
  context: CanvasRenderingContext2D,
  segment: Extract<NSPlateNameplateRenderSegment, { type: 'portraitOverlayComposite' }>,
  options: NSPlateCanvasRenderOptions
) {
  const portraitCanvas = document.createElement('canvas')
  const portraitContext = prepareCanvas(
    portraitCanvas,
    NSPLATE_CANVAS_DIMENSIONS.portrait.width,
    NSPLATE_CANVAS_DIMENSIONS.portrait.height
  )

  if (!portraitContext) {
    return
  }

  await drawLayers(portraitContext, segment.portraitOverlayLayers, options)

  if (!isCurrentRender(options)) {
    return
  }

  context.drawImage(portraitCanvas, segment.portraitEmbed.x, segment.portraitEmbed.y)
}

async function drawLayers(
  context: CanvasRenderingContext2D,
  layers: NSPlateRenderImageLayer[],
  options: NSPlateCanvasRenderOptions
) {
  // Load all images in parallel for better performance
  const entries = await Promise.all(
    layers.map(async (layer) => {
      const source = getPlateLayerImageUrl(layer)
      if (!source) return { layer, image: null }

      const image = await loadImage(source, options.imageCache)
      return { layer, image }
    })
  )

  for (const entry of entries) {
    const { layer, image } = entry

    if (!image || !isCurrentRender(options)) {
      return
    }

    const width = Math.round(image.naturalWidth * (layer.position.scale ?? 1))
    const height = Math.round(image.naturalHeight * (layer.position.scale ?? 1))
    const x =
      layer.placement === 'center' && width <= context.canvas.width
        ? (context.canvas.width - width) / 2
        : layer.position.x
    const y =
      layer.placement === 'center' && height <= context.canvas.height
        ? (context.canvas.height - height) / 2
        : layer.position.y

    context.drawImage(image, x, y, width, height)
  }
}

async function drawCustomPortraitInFrame(
  context: CanvasRenderingContext2D,
  customPortrait: NSPlateCustomPortraitImage | null,
  options: NSPlateCanvasRenderOptions
) {
  if (!customPortrait) {
    return
  }

  if (customPortrait.mode === 'free') {
    return
  }

  const source =
    customPortrait.mode === 'popout'
      ? (customPortrait.sourceDataUrl ?? customPortrait.dataUrl)
      : customPortrait.dataUrl
  const image = await loadImage(source, options.imageCache)

  if (!image || !isCurrentRender(options)) {
    return
  }

  if (customPortrait.mode === 'popout') {
    const rect = getCustomPortraitSourceDrawRect(customPortrait)

    context.save()
    setHighQualityImageSmoothing(context)
    context.beginPath()
    traceCustomPortraitInFrameClipPath(context, customPortrait)
    context.clip()
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height)
    context.restore()
    return
  }

  context.save()
  setHighQualityImageSmoothing(context)
  context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height)
  context.restore()
}

async function drawCustomPortraitPopout(
  context: CanvasRenderingContext2D,
  customPortrait: NSPlateCustomPortraitImage | null,
  portraitEmbed: NSPlateLayerPosition,
  options: NSPlateCanvasRenderOptions
) {
  if (!customPortrait || (customPortrait.mode !== 'popout' && customPortrait.mode !== 'free')) {
    return
  }

  const source = customPortrait.sourceDataUrl ?? customPortrait.dataUrl
  const image = await loadImage(source, options.imageCache)

  if (!image || !isCurrentRender(options)) {
    return
  }

  if (customPortrait.mode === 'free') {
    drawCustomPortraitFreeImage(
      context,
      image,
      customPortrait.sourceWidth ?? image.naturalWidth,
      customPortrait.sourceHeight ?? image.naturalHeight,
      customPortrait
    )
    return
  }

  const rect = getCustomPortraitSourceDrawRect(customPortrait)

  context.save()
  setHighQualityImageSmoothing(context)
  context.beginPath()
  traceCustomPortraitPopoutClipPath(
    context,
    customPortrait,
    context.canvas.width,
    portraitEmbed.x,
    portraitEmbed.y
  )
  context.clip()
  context.drawImage(
    image,
    portraitEmbed.x + rect.x,
    portraitEmbed.y + rect.y,
    rect.width,
    rect.height
  )
  context.restore()
}

function setHighQualityImageSmoothing(context: CanvasRenderingContext2D) {
  context.imageSmoothingEnabled = true

  if ('imageSmoothingQuality' in context) {
    context.imageSmoothingQuality = 'high'
  }
}

function prepareCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = false

  return context
}

function loadImage(source: string, imageCache: NSPlateImageCache = new Map()) {
  const cached = imageCache.get(source)

  if (cached) {
    return cached
  }

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
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
    image.onerror = () => {
      imageCache.delete(source)
      resolve(null)
    }
    image.src = source
  })

  imageCache.set(source, promise)
  return promise
}
