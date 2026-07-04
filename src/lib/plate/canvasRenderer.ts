import {
  NSPLATE_CANVAS_DIMENSIONS,
  getNameplateRenderSegments,
  getPlateLayerImageUrl,
  type NSPlateLayerPosition,
  type NSPlateNameplateRenderSegment,
  type NSPlateNameplateRenderPlan,
  type NSPlateRenderImageLayer
} from '@/lib/plate/render'
import { getCustomPortraitSourceDrawRect } from '@/lib/plate/customPortrait'
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

  if (segment.type === 'portraitComposite') {
    await drawPortraitComposite(context, segment, options)
    return
  }

  if (segment.type === 'customPortraitPopout') {
    await drawCustomPortraitPopout(context, segment.customPortrait, segment.portraitEmbed, options)
    return
  }

  if (segment.type === 'infoGraphicLayers') {
    await drawNSPlateInfoGraphicLayers(context, segment.layers, {
      imageCache: options.imageCache,
      isCurrent: options.isCurrent
    })
    return
  }

  await drawNSPlateInfoTextLayers(context, segment.layers)
}

async function drawPortraitComposite(
  context: CanvasRenderingContext2D,
  segment: Extract<NSPlateNameplateRenderSegment, { type: 'portraitComposite' }>,
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
  for (const layer of layers) {
    await drawLayer(context, layer, options)

    if (!isCurrentRender(options)) {
      return
    }
  }
}

async function drawLayer(
  context: CanvasRenderingContext2D,
  layer: NSPlateRenderImageLayer,
  options: NSPlateCanvasRenderOptions
) {
  const source = getPlateLayerImageUrl(layer)

  if (!source) {
    return
  }

  const image = await loadImage(source, options.imageCache)

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

async function drawCustomPortraitInFrame(
  context: CanvasRenderingContext2D,
  customPortrait: NSPlateCustomPortraitImage | null,
  options: NSPlateCanvasRenderOptions
) {
  if (!customPortrait) {
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
    const splitY = customPortrait.splitY ?? 0
    const rect = getCustomPortraitSourceDrawRect(customPortrait)

    context.save()
    context.beginPath()
    context.rect(0, splitY, context.canvas.width, context.canvas.height - splitY)
    context.clip()
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height)
    context.restore()
    return
  }

  context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height)
}

async function drawCustomPortraitPopout(
  context: CanvasRenderingContext2D,
  customPortrait: NSPlateCustomPortraitImage | null,
  portraitEmbed: NSPlateLayerPosition,
  options: NSPlateCanvasRenderOptions
) {
  if (!customPortrait || customPortrait.mode !== 'popout') {
    return
  }

  const source = customPortrait.sourceDataUrl ?? customPortrait.dataUrl
  const image = await loadImage(source, options.imageCache)

  if (!image || !isCurrentRender(options)) {
    return
  }

  const splitY = customPortrait.splitY ?? 0
  const rect = getCustomPortraitSourceDrawRect(customPortrait)

  context.save()
  context.beginPath()
  context.rect(0, 0, context.canvas.width, portraitEmbed.y + splitY)
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
