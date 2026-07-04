import {
  NSPLATE_INFO_BAR48_COUNT,
  NSPLATE_INFO_ACTIVITY_ICON_GAP_PX,
  NSPLATE_INFO_ACTIVITY_ICON_SIZE_PX,
  getNSPlateInfoBar48Bounds,
  type NSPlateInfoBar48RenderLayer,
  type NSPlateInfoFixedRenderLayer,
  type NSPlateInfoGraphicRenderLayer,
  type NSPlateInfoIconRenderLayer,
  type NSPlateInfoSpecialRenderLayer
} from '@/lib/plate/infoLayerRenderDefinitions'

type NSPlateInfoImageCache = Map<string, Promise<HTMLImageElement | null>>

export interface NSPlateInfoGraphicRenderOptions {
  imageCache?: NSPlateInfoImageCache
  isCurrent?: () => boolean
}

export async function drawNSPlateInfoGraphicLayers(
  context: CanvasRenderingContext2D,
  layers: NSPlateInfoGraphicRenderLayer[],
  options: NSPlateInfoGraphicRenderOptions = {}
) {
  for (const layer of layers) {
    if (layer.type === 'fixed') {
      await drawInfoFixedLayer(context, layer, options)
    } else if (layer.type === 'icon') {
      await drawInfoIconLayer(context, layer, options)
    } else if (layer.type === 'bar48') {
      await drawInfoBar48Layer(context, layer, options)
    } else {
      await drawInfoSpecialLayer(context, layer, options)
    }

    if (!isCurrentRender(options)) {
      return
    }
  }
}

async function drawInfoFixedLayer(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoFixedRenderLayer,
  options: NSPlateInfoGraphicRenderOptions
) {
  const image = await loadInfoImage(layer.source.url, options.imageCache)

  if (!image || !isCurrentRender(options)) {
    return
  }

  drawInfoImage(context, image, layer.x, layer.y, layer.width, layer.height, layer.opacity)
}

async function drawInfoSpecialLayer(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoSpecialRenderLayer,
  options: NSPlateInfoGraphicRenderOptions
) {
  const symbolImage = await loadInfoImage(layer.symbol.url, options.imageCache)
  const backgroundImage = layer.background
    ? await loadInfoImage(layer.background.url, options.imageCache)
    : null
  const maskImage = layer.mask ? await loadInfoImage(layer.mask.url, options.imageCache) : null

  if (!symbolImage || !isCurrentRender(options)) {
    return
  }

  const { width, height } = resolveInfoSpecialDrawSize(symbolImage, layer)

  context.save()
  context.globalAlpha = clampAlpha(layer.opacity)

  if (backgroundImage) {
    setCanvasImageSmoothing(context, shouldSmoothWhenScaledDown(backgroundImage, width, height))
    context.drawImage(backgroundImage, layer.x, layer.y, width, height)
  }

  if (backgroundImage && maskImage) {
    const tintedMask = tintInfoSpecialMaskImage(
      maskImage,
      backgroundImage,
      width,
      height,
      layer.maskDarkColor,
      layer.maskLightColor
    )

    if (tintedMask) {
      setCanvasImageSmoothing(context, false)
      context.drawImage(tintedMask, layer.x, layer.y)
    }
  }

  setCanvasImageSmoothing(context, shouldSmoothWhenScaledDown(symbolImage, width, height))
  context.drawImage(symbolImage, layer.x, layer.y, width, height)
  context.restore()
}

async function drawInfoBar48Layer(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoBar48RenderLayer,
  options: NSPlateInfoGraphicRenderOptions
) {
  const emptyImage = await loadInfoImage(layer.emptySource.url, options.imageCache)
  const fillImage = layer.fillSource
    ? await loadInfoImage(layer.fillSource.url, options.imageCache)
    : null

  if (!emptyImage || !isCurrentRender(options)) {
    return
  }

  const bounds = getNSPlateInfoBar48Bounds(layer)
  const cellWidth = Math.max(1, Number(layer.cellWidth) || 1)
  const cellHeight = Math.max(1, Number(layer.cellHeight) || 1)
  const gapX = Math.max(0, Number(layer.gapX) || 0)
  const gapY = Math.max(0, Number(layer.gapY) || 0)
  const emptyNaturalWidth = Math.max(1, Number(emptyImage.naturalWidth) || cellWidth)
  const emptyNaturalHeight = Math.max(1, Number(emptyImage.naturalHeight) || cellHeight)
  const fillDrawWidth = fillImage
    ? Math.max(
        1,
        Math.round(cellWidth * ((Number(fillImage.naturalWidth) || 0) / emptyNaturalWidth))
      )
    : 0
  const fillDrawHeight = fillImage
    ? Math.max(
        1,
        Math.round(cellHeight * ((Number(fillImage.naturalHeight) || 0) / emptyNaturalHeight))
      )
    : 0
  const fillOffsetX = isDefaultBar48SpritePair(layer) ? -1 : 0
  const smoothEmpty = shouldSmoothWhenScaledDown(emptyImage, cellWidth, cellHeight)
  const smoothFill = fillImage
    ? shouldSmoothWhenScaledDown(fillImage, fillDrawWidth, fillDrawHeight)
    : false

  context.save()
  context.globalAlpha = clampAlpha(layer.opacity)
  setCanvasImageSmoothing(context, smoothEmpty)

  for (let index = 0; index < NSPLATE_INFO_BAR48_COUNT; index += 1) {
    const col = index % bounds.columns
    const row = Math.floor(index / bounds.columns)
    const centerOffset = col >= bounds.splitCol ? bounds.centerGapPx : 0
    const x = layer.x + col * (cellWidth + gapX) + centerOffset
    const y = layer.y + row * (cellHeight + gapY)

    context.drawImage(emptyImage, x, y, cellWidth, cellHeight)

    if (layer.states[index] === 1 && fillImage) {
      const fillX = x + Math.round((cellWidth - fillDrawWidth) / 2) + fillOffsetX
      const fillY = y + Math.round((cellHeight - fillDrawHeight) / 2)

      setCanvasImageSmoothing(context, smoothFill)
      context.drawImage(fillImage, fillX, fillY, fillDrawWidth, fillDrawHeight)
      setCanvasImageSmoothing(context, smoothEmpty)
    }
  }

  context.restore()
}

async function drawInfoIconLayer(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoIconRenderLayer,
  options: NSPlateInfoGraphicRenderOptions
) {
  if (layer.isActivity) {
    await drawInfoActivityIconLayer(context, layer, options)
    return
  }

  const source = layer.items[0]
  const image = source ? await loadInfoImage(source.url, options.imageCache) : null

  if (!image || !isCurrentRender(options)) {
    return
  }

  const { width, height } = resolveInfoIconDrawSize(image, layer)
  drawInfoImage(context, image, layer.x, layer.y, width, height, layer.opacity)
}

async function drawInfoActivityIconLayer(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoIconRenderLayer,
  options: NSPlateInfoGraphicRenderOptions
) {
  const loaded = await Promise.all(
    layer.items.map(async (item) => {
      const image = await loadInfoImage(item.url, options.imageCache)
      return image ? { item, image } : null
    })
  )
  const drawables = loaded.filter(
    (item): item is { item: (typeof layer.items)[number]; image: HTMLImageElement } => item !== null
  )

  if (!drawables.length || !isCurrentRender(options)) {
    return
  }

  context.save()
  context.globalAlpha = clampAlpha(layer.opacity)

  for (let index = 0; index < drawables.length; index += 1) {
    const { image } = drawables[index]
    const x =
      layer.x + index * (NSPLATE_INFO_ACTIVITY_ICON_SIZE_PX + NSPLATE_INFO_ACTIVITY_ICON_GAP_PX)

    setCanvasImageSmoothing(
      context,
      shouldSmoothWhenScaledDown(
        image,
        NSPLATE_INFO_ACTIVITY_ICON_SIZE_PX,
        NSPLATE_INFO_ACTIVITY_ICON_SIZE_PX
      )
    )
    context.drawImage(
      image,
      x,
      layer.y,
      NSPLATE_INFO_ACTIVITY_ICON_SIZE_PX,
      NSPLATE_INFO_ACTIVITY_ICON_SIZE_PX
    )
  }

  context.restore()
}

function drawInfoImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  opacity: number
) {
  context.save()
  context.globalAlpha = clampAlpha(opacity)
  setCanvasImageSmoothing(context, shouldSmoothWhenScaledDown(image, width, height))
  context.drawImage(image, x, y, width, height)
  context.restore()
}

function resolveInfoIconDrawSize(image: HTMLImageElement, layer: NSPlateInfoIconRenderLayer) {
  if (
    layer.sizeMode === 'fixed' &&
    Number.isFinite(layer.targetSize) &&
    Number(layer.targetSize) > 0
  ) {
    const size = Math.max(1, Math.round(Number(layer.targetSize)))
    return { width: size, height: size }
  }

  const scale = Number.isFinite(layer.scale) && layer.scale > 0 ? layer.scale : 1
  return {
    width: Math.max(1, Math.round(image.naturalWidth * scale)),
    height: Math.max(1, Math.round(image.naturalHeight * scale))
  }
}

function resolveInfoSpecialDrawSize(image: HTMLImageElement, layer: NSPlateInfoSpecialRenderLayer) {
  if (
    layer.sizeMode === 'fixed' &&
    Number.isFinite(layer.targetSize) &&
    Number(layer.targetSize) > 0
  ) {
    const size = Math.max(1, Math.round(Number(layer.targetSize)))
    return { width: size, height: size }
  }

  const scale = Number.isFinite(layer.scale) && layer.scale > 0 ? layer.scale : 1
  return {
    width: Math.max(1, Math.round(image.naturalWidth * scale)),
    height: Math.max(1, Math.round(image.naturalHeight * scale))
  }
}

function isCurrentRender(options: NSPlateInfoGraphicRenderOptions) {
  return options.isCurrent?.() ?? true
}

function loadInfoImage(source: string, imageCache: NSPlateInfoImageCache = new Map()) {
  if (!source) {
    return Promise.resolve(null)
  }

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

function shouldSmoothWhenScaledDown(
  image: HTMLImageElement,
  drawWidth: number,
  drawHeight: number
) {
  const sourceWidth = Math.max(1, Number(image.naturalWidth) || Number(image.width) || 1)
  const sourceHeight = Math.max(1, Number(image.naturalHeight) || Number(image.height) || 1)
  const targetWidth = Math.max(1, Number(drawWidth) || 1)
  const targetHeight = Math.max(1, Number(drawHeight) || 1)

  return targetWidth < sourceWidth || targetHeight < sourceHeight
}

function setCanvasImageSmoothing(context: CanvasRenderingContext2D, enabled: boolean) {
  context.imageSmoothingEnabled = enabled

  if ('imageSmoothingQuality' in context) {
    context.imageSmoothingQuality = enabled ? 'high' : 'low'
  }
}

function clampAlpha(value: number) {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(1, Math.max(0, value))
}

function tintInfoSpecialMaskImage(
  maskImage: HTMLImageElement,
  backgroundImage: HTMLImageElement,
  width: number,
  height: number,
  darkHex: string,
  lightHex: string
) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return null
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  setCanvasImageSmoothing(
    context,
    shouldSmoothWhenScaledDown(maskImage, canvas.width, canvas.height)
  )
  context.drawImage(maskImage, 0, 0, canvas.width, canvas.height)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const backgroundData = getInfoSpecialBackgroundPixelData(
    backgroundImage,
    canvas.width,
    canvas.height
  )
  const dark = parseInfoSpecialHexColor(darkHex, '#5f3c22')
  const light = parseInfoSpecialHexColor(lightHex, '#f6d9a7')

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3]

    if (alpha === 0) {
      continue
    }

    if (backgroundData) {
      const backgroundAlpha = backgroundData[index + 3]

      if (backgroundAlpha === 0 || !isInfoSpecialBackgroundWhite(backgroundData, index)) {
        data[index + 3] = 0
        continue
      }
    }

    const t = (data[index] + data[index + 1] + data[index + 2]) / 765
    data[index] = Math.round(dark.r + (light.r - dark.r) * t)
    data[index + 1] = Math.round(dark.g + (light.g - dark.g) * t)
    data[index + 2] = Math.round(dark.b + (light.b - dark.b) * t)
  }

  context.putImageData(imageData, 0, 0)
  return canvas
}

function getInfoSpecialBackgroundPixelData(
  backgroundImage: HTMLImageElement,
  width: number,
  height: number
) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return null
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  setCanvasImageSmoothing(context, false)
  context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
  return context.getImageData(0, 0, canvas.width, canvas.height).data
}

function isInfoSpecialBackgroundWhite(data: Uint8ClampedArray, index: number) {
  return data[index] === 255 && data[index + 1] === 255 && data[index + 2] === 255
}

function parseInfoSpecialHexColor(value: string, fallback: string) {
  const source = /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback
  const raw = source.slice(1)

  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16)
  }
}

function isDefaultBar48SpritePair(layer: NSPlateInfoBar48RenderLayer) {
  const emptyPath = normalizeBar48PathForCompare(layer.emptySource.url)
  const fillPath = normalizeBar48PathForCompare(layer.fillSource?.url ?? '')

  return (
    emptyPath.endsWith('ui/sprites/charactercard_3.png') &&
    fillPath.endsWith('ui/sprites/charactercard_4.png')
  )
}

function normalizeBar48PathForCompare(value: string) {
  return value.replace(/\\/g, '/').toLowerCase()
}
