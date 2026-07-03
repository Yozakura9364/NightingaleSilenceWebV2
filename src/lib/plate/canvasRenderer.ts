import {
  NSPLATE_CANVAS_DIMENSIONS,
  getPlateLayerImageUrl,
  type NSPlateNameplateRenderPlan,
  type NSPlateRenderImageLayer
} from '@/lib/plate/render'
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
  await drawLayers(context, plan.baseLayers, options)

  if (!isCurrentRender(options)) {
    return
  }

  const portraitCanvas = document.createElement('canvas')
  const portraitContext = prepareCanvas(
    portraitCanvas,
    NSPLATE_CANVAS_DIMENSIONS.portrait.width,
    NSPLATE_CANVAS_DIMENSIONS.portrait.height
  )

  if (portraitContext) {
    await drawLayers(portraitContext, plan.portraitBaseLayers, options)

    if (!isCurrentRender(options)) {
      return
    }

    await drawCustomPortrait(portraitContext, plan.customPortrait, options)

    if (!isCurrentRender(options)) {
      return
    }

    await drawLayers(portraitContext, plan.portraitOverlayLayers, options)

    if (!isCurrentRender(options)) {
      return
    }

    context.drawImage(portraitCanvas, plan.portraitEmbed.x, plan.portraitEmbed.y)
  }

  await drawLayers(context, plan.overlayLayers.slice(0, 1), options)

  if (plan.portraitFrameLayer) {
    await drawLayer(context, plan.portraitFrameLayer, options)
  }

  await drawLayers(context, plan.overlayLayers.slice(1), options)
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

async function drawCustomPortrait(
  context: CanvasRenderingContext2D,
  customPortrait: NSPlateCustomPortraitImage | null,
  options: NSPlateCanvasRenderOptions
) {
  if (!customPortrait) {
    return
  }

  const image = await loadImage(customPortrait.dataUrl, options.imageCache)

  if (!image || !isCurrentRender(options)) {
    return
  }

  context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height)
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
