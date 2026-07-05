import {
  getCustomPortraitPopoutSplitBounds,
  getCustomPortraitSourceDrawRect
} from '@/lib/plate/customPortrait'
import { getNSPlateInfoBar48Bounds } from '@/lib/plate/infoLayerRenderDefinitions'
import {
  NSPLATE_INFO_ACTIVITY_ICON_GAP_PX,
  NSPLATE_INFO_BAR48_COUNT,
  NSPLATE_INFO_ACTIVITY_ICON_SIZE_PX,
  type NSPlateInfoBar48RenderLayer,
  type NSPlateInfoGraphicRenderLayer,
  type NSPlateInfoIconRenderLayer,
  type NSPlateInfoSpecialRenderLayer
} from '@/lib/plate/infoLayerRenderTypes'
import {
  clampInfoLayerAlpha,
  isDefaultInfoBar48SpritePair,
  resolveInfoIconDrawSize,
  resolveInfoSpecialDrawSize,
  setInfoCanvasImageSmoothing,
  shouldSmoothWhenScaledDown,
  tintInfoSpecialMaskImage
} from '@/lib/plate/infoLayerImageUtils'
import { renderNSPlateInfoTextLayersToLayerCanvases } from '@/lib/plate/infoLayerTextRenderer'
import {
  NSPLATE_CANVAS_DIMENSIONS,
  getNameplateRenderSegments,
  getPlateLayerImageUrl,
  type NSPlateLayerPosition,
  type NSPlateNameplateRenderSegment,
  type NSPlateNameplateRenderPlan,
  type NSPlateRenderImageLayer
} from '@/lib/plate/render'
import type {
  NSPlateCustomPortraitImage,
  NSPlateLayeredExportLayer,
  NSPlateLayeredExportOptions,
  NSPlateLayeredExportPayload
} from '@/lib/plate/types'
import { createStoredZipBlob, type StoredZipFileEntry } from '@/lib/plate/zipArchive'

const CUSTOM_PORTRAIT_LAYER_NAME = '自定义图片'
const CUSTOM_PORTRAIT_POPOUT_LAYER_NAME = '自定义图片（出框）'
const LAYERED_ZIP_TEXT_ENCODER = new TextEncoder()

export async function createNameplateLayeredExportPayload(
  plan: NSPlateNameplateRenderPlan,
  options: NSPlateLayeredExportOptions
): Promise<NSPlateLayeredExportPayload> {
  const scale = normalizeExportScale(options.scale)
  const layers: NSPlateLayeredExportLayer[] = []

  for (const segment of getNameplateRenderSegments(plan)) {
    await pushSegmentLayers(layers, segment, scale)
  }

  return {
    layers,
    canvasWidth: Math.round(plan.dimensions.width * scale),
    canvasHeight: Math.round(plan.dimensions.height * scale)
  }
}

async function pushSegmentLayers(
  output: NSPlateLayeredExportLayer[],
  segment: NSPlateNameplateRenderSegment,
  scale: number
) {
  if (segment.type === 'systemLayers') {
    await pushSystemLayers(output, segment.layers, scale)
    return
  }

  if (segment.type === 'portraitComposite') {
    await pushPortraitSystemLayers(output, segment.portraitBaseLayers, segment.portraitEmbed, scale)

    const customInFrameLayer = await createCustomPortraitInFrameLayer(
      segment.customPortrait,
      segment.portraitEmbed,
      scale
    )

    if (customInFrameLayer) {
      output.push(customInFrameLayer)
    }

    await pushPortraitSystemLayers(
      output,
      segment.portraitOverlayLayers,
      segment.portraitEmbed,
      scale
    )
    return
  }

  if (segment.type === 'infoTextLayers') {
    await pushInfoTextLayer(output, segment.layers, scale)
    return
  }

  if (segment.type === 'infoGraphicLayers') {
    await pushInfoGraphicLayers(output, segment.layers, scale)
    return
  }

  const customPopoutLayer = await createCustomPortraitPopoutLayer(
    segment.customPortrait,
    segment.portraitEmbed,
    segment.dimensions,
    scale
  )

  if (customPopoutLayer) {
    output.push(customPopoutLayer)
  }
}

async function pushInfoGraphicLayers(
  output: NSPlateLayeredExportLayer[],
  layers: NSPlateInfoGraphicRenderLayer[],
  scale: number
) {
  for (const layer of layers) {
    const exportLayer = await createInfoGraphicLayerData(layer, scale)

    if (exportLayer) {
      output.push(exportLayer)
    }
  }
}

async function createInfoGraphicLayerData(layer: NSPlateInfoGraphicRenderLayer, scale: number) {
  if (layer.type === 'fixed') {
    return createInfoFixedLayerData(layer, scale)
  }

  if (layer.type === 'icon') {
    return createInfoIconLayerData(layer, scale)
  }

  if (layer.type === 'bar48') {
    return createInfoBar48LayerData(layer, scale)
  }

  return createInfoSpecialLayerData(layer, scale)
}

async function createInfoFixedLayerData(
  layer: Extract<NSPlateInfoGraphicRenderLayer, { type: 'fixed' }>,
  exportScale: number
) {
  const image = await loadLayerImage(layer.source.url)

  if (!image) {
    return null
  }

  const width = Math.max(1, Math.round(layer.width * exportScale))
  const height = Math.max(1, Math.round(layer.height * exportScale))
  const canvas = createLayerCanvas(width, height)
  const context = getLayerContext(canvas, shouldSmoothWhenScaledDown(image, width, height))

  context.globalAlpha = clampInfoLayerAlpha(layer.opacity)
  context.drawImage(image, 0, 0, width, height)

  return {
    name: layer.legacyName,
    x: Math.round(layer.x * exportScale),
    y: Math.round(layer.y * exportScale),
    width,
    height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'info'
  } satisfies NSPlateLayeredExportLayer
}

async function createInfoBar48LayerData(layer: NSPlateInfoBar48RenderLayer, exportScale: number) {
  const emptyImage = await loadLayerImage(layer.emptySource.url)
  const fillImage = layer.fillSource ? await loadLayerImage(layer.fillSource.url) : null

  if (!emptyImage) {
    return null
  }

  const bounds = getNSPlateInfoBar48Bounds(layer)
  const width = Math.max(1, Math.round(bounds.width * exportScale))
  const height = Math.max(1, Math.round(bounds.height * exportScale))
  const canvas = createLayerCanvas(width, height)
  const context = getLayerContext(canvas, false)
  const cellWidth = Math.max(1, (Number(layer.cellWidth) || 1) * exportScale)
  const cellHeight = Math.max(1, (Number(layer.cellHeight) || 1) * exportScale)
  const gapX = Math.max(0, (Number(layer.gapX) || 0) * exportScale)
  const gapY = Math.max(0, (Number(layer.gapY) || 0) * exportScale)
  const centerGapPx = Math.max(0, bounds.centerGapPx * exportScale)
  const emptyNaturalWidth = Math.max(
    1,
    Number(emptyImage.naturalWidth) || Number(layer.cellWidth) || 1
  )
  const emptyNaturalHeight = Math.max(
    1,
    Number(emptyImage.naturalHeight) || Number(layer.cellHeight) || 1
  )
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
  const fillOffsetX = isDefaultInfoBar48SpritePair(layer) ? -1 * exportScale : 0
  const smoothEmpty = shouldSmoothWhenScaledDown(emptyImage, cellWidth, cellHeight)
  const smoothFill = fillImage
    ? shouldSmoothWhenScaledDown(fillImage, fillDrawWidth, fillDrawHeight)
    : false

  context.globalAlpha = clampInfoLayerAlpha(layer.opacity)
  setInfoCanvasImageSmoothing(context, smoothEmpty)

  for (let index = 0; index < NSPLATE_INFO_BAR48_COUNT; index += 1) {
    const col = index % bounds.columns
    const row = Math.floor(index / bounds.columns)
    const centerOffset = col >= bounds.splitCol ? centerGapPx : 0
    const x = col * (cellWidth + gapX) + centerOffset
    const y = row * (cellHeight + gapY)

    context.drawImage(emptyImage, x, y, cellWidth, cellHeight)

    if (layer.states[index] === 1 && fillImage) {
      const fillX = x + Math.round((cellWidth - fillDrawWidth) / 2) + fillOffsetX
      const fillY = y + Math.round((cellHeight - fillDrawHeight) / 2)

      setInfoCanvasImageSmoothing(context, smoothFill)
      context.drawImage(fillImage, fillX, fillY, fillDrawWidth, fillDrawHeight)
      setInfoCanvasImageSmoothing(context, smoothEmpty)
    }
  }

  return {
    name: layer.legacyName,
    x: Math.round(layer.x * exportScale),
    y: Math.round(layer.y * exportScale),
    width,
    height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'info'
  } satisfies NSPlateLayeredExportLayer
}

async function createInfoSpecialLayerData(
  layer: NSPlateInfoSpecialRenderLayer,
  exportScale: number
) {
  const symbolImage = await loadLayerImage(layer.symbol.url)
  const backgroundImage = layer.background ? await loadLayerImage(layer.background.url) : null
  const maskImage = layer.mask ? await loadLayerImage(layer.mask.url) : null

  if (!symbolImage) {
    return null
  }

  const baseSize = resolveInfoSpecialDrawSize(symbolImage, layer)
  const width = Math.max(1, Math.round(baseSize.width * exportScale))
  const height = Math.max(1, Math.round(baseSize.height * exportScale))
  const canvas = createLayerCanvas(width, height)
  const context = getLayerContext(canvas, false)

  context.globalAlpha = clampInfoLayerAlpha(layer.opacity)

  if (backgroundImage) {
    setInfoCanvasImageSmoothing(
      context,
      shouldSmoothWhenScaledDown(backgroundImage, width, height)
    )
    context.drawImage(backgroundImage, 0, 0, width, height)
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
      setInfoCanvasImageSmoothing(context, false)
      context.drawImage(tintedMask, 0, 0)
    }
  }

  setInfoCanvasImageSmoothing(context, shouldSmoothWhenScaledDown(symbolImage, width, height))
  context.drawImage(symbolImage, 0, 0, width, height)

  return {
    name: layer.legacyName,
    x: Math.round(layer.x * exportScale),
    y: Math.round(layer.y * exportScale),
    width,
    height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'info'
  } satisfies NSPlateLayeredExportLayer
}

async function createInfoIconLayerData(layer: NSPlateInfoIconRenderLayer, exportScale: number) {
  if (layer.isActivity) {
    return createInfoActivityIconLayerData(layer, exportScale)
  }

  const source = layer.items[0]
  const image = source ? await loadLayerImage(source.url) : null

  if (!image) {
    return null
  }

  const baseSize = resolveInfoIconDrawSize(image, layer)
  const width = Math.max(1, Math.round(baseSize.width * exportScale))
  const height = Math.max(1, Math.round(baseSize.height * exportScale))
  const canvas = createLayerCanvas(width, height)
  const context = getLayerContext(canvas, shouldSmoothWhenScaledDown(image, width, height))

  context.globalAlpha = clampInfoLayerAlpha(layer.opacity)
  context.drawImage(image, 0, 0, width, height)

  return {
    name: layer.legacyName,
    x: Math.round(layer.x * exportScale),
    y: Math.round(layer.y * exportScale),
    width,
    height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'info'
  } satisfies NSPlateLayeredExportLayer
}

async function createInfoActivityIconLayerData(
  layer: NSPlateInfoIconRenderLayer,
  exportScale: number
) {
  const loaded = await Promise.all(
    layer.items.map(async (item) => {
      const image = await loadLayerImage(item.url)
      return image
    })
  )
  const images = loaded.filter((image): image is HTMLImageElement => image !== null)

  if (!images.length) {
    return null
  }

  const drawSize = Math.max(1, Math.round(NSPLATE_INFO_ACTIVITY_ICON_SIZE_PX * exportScale))
  const gap = Math.max(0, Math.round(NSPLATE_INFO_ACTIVITY_ICON_GAP_PX * exportScale))
  const width = drawSize * images.length + gap * Math.max(0, images.length - 1)
  const height = drawSize
  const canvas = createLayerCanvas(width, height)
  const context = getLayerContext(canvas, false)

  context.globalAlpha = clampInfoLayerAlpha(layer.opacity)

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index]
    setInfoCanvasImageSmoothing(context, shouldSmoothWhenScaledDown(image, drawSize, drawSize))
    context.drawImage(image, index * (drawSize + gap), 0, drawSize, drawSize)
  }

  return {
    name: layer.legacyName,
    x: Math.round(layer.x * exportScale),
    y: Math.round(layer.y * exportScale),
    width,
    height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'info'
  } satisfies NSPlateLayeredExportLayer
}

async function pushInfoTextLayer(
  output: NSPlateLayeredExportLayer[],
  layers: Extract<NSPlateNameplateRenderSegment, { type: 'infoTextLayers' }>['layers'],
  scale: number
) {
  const layerCanvases = await renderNSPlateInfoTextLayersToLayerCanvases(layers, scale)

  for (const item of layerCanvases) {
    output.push({
      name: item.layer.legacyName,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      rgbaData: item.canvas.toDataURL('image/png'),
      sourceType: 'info'
    })
  }
}

export function downloadPlateLayeredZip(blob: Blob, scale: number) {
  const scaleSuffix = scale > 1 ? `_${Math.round(scale)}x` : ''
  const filename = `layered_export_${Date.now()}${scaleSuffix}.zip`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.download = filename
  link.href = url
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  return filename
}

export async function createLayeredZipBlobOnClient(
  payload: NSPlateLayeredExportPayload
): Promise<Blob> {
  const canvasWidth = normalizeCanvasSize(payload.canvasWidth)
  const canvasHeight = normalizeCanvasSize(payload.canvasHeight)
  const files: StoredZipFileEntry[] = []
  const composerConfig = normalizeComposerConfig(payload.composerConfigFull)

  if (composerConfig) {
    files.push({
      name: 'composer-config.json',
      bytes: encodeJsonFile(composerConfig)
    })
  }

  const layerManifest = createLayeredZipManifest(payload.layers, canvasWidth, canvasHeight)
  const layerManifestBytes = encodeJsonFile(layerManifest)

  files.push(
    {
      name: 'layers.json',
      bytes: layerManifestBytes
    },
    {
      name: 'manifest.json',
      bytes: layerManifestBytes
    }
  )

  for (let index = 0; index < payload.layers.length; index += 1) {
    const layer = payload.layers[index]
    const fullCanvasBlob = await placeLayerOnFullCanvas(layer, canvasWidth, canvasHeight)
    const bytes = new Uint8Array(await fullCanvasBlob.arrayBuffer())

    files.push({
      name: createLayeredZipLayerEntryName(index),
      bytes
    })
  }

  return createStoredZipBlob(files)
}

function createLayeredZipManifest(
  layers: NSPlateLayeredExportLayer[],
  canvasWidth: number,
  canvasHeight: number
) {
  return {
    app: 'NSPlate',
    format: 'nsplate-layered-zip-manifest',
    version: 2,
    coordinateSpace: 'fullCanvasTopLeft',
    canvasWidth,
    canvasHeight,
    generatedAt: new Date().toISOString(),
    layers: layers.map((layer, index) => ({
      index,
      file: createLayeredZipLayerEntryName(index),
      name: layer.name,
      x: Math.round(layer.x),
      y: Math.round(layer.y),
      width: Math.round(layer.width),
      height: Math.round(layer.height),
      sourceType: layer.sourceType ?? 'unknown'
    }))
  }
}

function createLayeredZipLayerEntryName(index: number) {
  return `L${String(index).padStart(3, '0')}.png`
}

function normalizeComposerConfig(value: unknown): Record<string, unknown> | null {
  return isRecord(value) && Number(value.version) === 1 ? value : null
}

function encodeJsonFile(value: unknown) {
  return LAYERED_ZIP_TEXT_ENCODER.encode(`${JSON.stringify(value, null, 2)}\n`)
}

async function pushSystemLayers(
  output: NSPlateLayeredExportLayer[],
  layers: NSPlateRenderImageLayer[],
  scale: number
) {
  for (const layer of layers) {
    const exportLayer = await createSystemLayerData(layer, layer.position, scale)

    if (exportLayer) {
      output.push(exportLayer)
    }
  }
}

async function pushPortraitSystemLayers(
  output: NSPlateLayeredExportLayer[],
  layers: NSPlateRenderImageLayer[],
  portraitEmbed: NSPlateLayerPosition,
  scale: number
) {
  for (const layer of layers) {
    const exportLayer = await createPortraitSystemLayerData(layer, portraitEmbed, scale)

    if (exportLayer) {
      output.push(exportLayer)
    }
  }
}

async function createSystemLayerData(
  layer: NSPlateRenderImageLayer,
  position: NSPlateLayerPosition,
  exportScale: number
) {
  const image = await loadLayerImage(getPlateLayerImageUrl(layer))

  if (!image) {
    return null
  }

  const layerScale = position.scale ?? 1
  const width = Math.max(1, Math.round(image.naturalWidth * layerScale * exportScale))
  const height = Math.max(1, Math.round(image.naturalHeight * layerScale * exportScale))
  const canvas = createLayerCanvas(width, height)
  const context = getLayerContext(canvas, false)

  context.drawImage(image, 0, 0, width, height)

  return {
    name: layer.category,
    x: Math.round(position.x * exportScale),
    y: Math.round(position.y * exportScale),
    width,
    height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'system'
  } satisfies NSPlateLayeredExportLayer
}

async function createPortraitSystemLayerData(
  layer: NSPlateRenderImageLayer,
  portraitEmbed: NSPlateLayerPosition,
  exportScale: number
) {
  const image = await loadLayerImage(getPlateLayerImageUrl(layer))

  if (!image) {
    return null
  }

  const layerScale = layer.position.scale ?? 1
  const width = Math.max(1, Math.round(image.naturalWidth * layerScale))
  const height = Math.max(1, Math.round(image.naturalHeight * layerScale))
  const offsetX =
    layer.placement === 'center' && width <= NSPLATE_CANVAS_DIMENSIONS.portrait.width
      ? (NSPLATE_CANVAS_DIMENSIONS.portrait.width - width) / 2
      : layer.position.x
  const offsetY =
    layer.placement === 'center' && height <= NSPLATE_CANVAS_DIMENSIONS.portrait.height
      ? (NSPLATE_CANVAS_DIMENSIONS.portrait.height - height) / 2
      : layer.position.y
  const canvas = createLayerCanvas(
    Math.max(1, Math.round(width * exportScale)),
    Math.max(1, Math.round(height * exportScale))
  )
  const context = getLayerContext(canvas, false)

  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return {
    name: layer.category,
    x: Math.round((portraitEmbed.x + offsetX) * exportScale),
    y: Math.round((portraitEmbed.y + offsetY) * exportScale),
    width: canvas.width,
    height: canvas.height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'system'
  } satisfies NSPlateLayeredExportLayer
}

async function createCustomPortraitInFrameLayer(
  customPortrait: NSPlateCustomPortraitImage | null,
  portraitEmbed: NSPlateLayerPosition,
  exportScale: number
) {
  if (!customPortrait) {
    return null
  }

  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const canvas = createLayerCanvas(
    Math.round(portrait.width * exportScale),
    Math.round(portrait.height * exportScale)
  )
  const context = getLayerContext(canvas, true)

  if (customPortrait.mode === 'popout') {
    const image = await loadLayerImage(customPortrait.sourceDataUrl ?? customPortrait.dataUrl)

    if (!image) {
      return null
    }

    const rect = getCustomPortraitSourceDrawRect(customPortrait)
    const splitBounds = getCustomPortraitPopoutSplitBounds(customPortrait.splitY ?? 0)

    context.save()
    context.beginPath()
    context.rect(
      0,
      splitBounds.inFrameY * exportScale,
      canvas.width,
      Math.max(0, (portrait.height - splitBounds.inFrameY) * exportScale)
    )
    context.clip()
    context.drawImage(
      image,
      rect.x * exportScale,
      rect.y * exportScale,
      rect.width * exportScale,
      rect.height * exportScale
    )
    context.restore()
  } else {
    const image = await loadLayerImage(customPortrait.dataUrl)

    if (!image) {
      return null
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  }

  return {
    name: CUSTOM_PORTRAIT_LAYER_NAME,
    x: Math.round(portraitEmbed.x * exportScale),
    y: Math.round(portraitEmbed.y * exportScale),
    width: canvas.width,
    height: canvas.height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'custom'
  } satisfies NSPlateLayeredExportLayer
}

async function createCustomPortraitPopoutLayer(
  customPortrait: NSPlateCustomPortraitImage | null,
  portraitEmbed: NSPlateLayerPosition,
  dimensions: { width: number; height: number },
  exportScale: number
) {
  if (!customPortrait || customPortrait.mode !== 'popout') {
    return null
  }

  const image = await loadLayerImage(customPortrait.sourceDataUrl ?? customPortrait.dataUrl)

  if (!image) {
    return null
  }

  const rect = getCustomPortraitSourceDrawRect(customPortrait)
  const splitBounds = getCustomPortraitPopoutSplitBounds(customPortrait.splitY ?? 0)
  const canvas = createLayerCanvas(
    Math.round(dimensions.width * exportScale),
    Math.round(dimensions.height * exportScale)
  )
  const context = getLayerContext(canvas, true)

  context.save()
  context.beginPath()
  context.rect(0, 0, canvas.width, (portraitEmbed.y + splitBounds.popoutY) * exportScale)
  context.clip()
  context.drawImage(
    image,
    (portraitEmbed.x + rect.x) * exportScale,
    (portraitEmbed.y + rect.y) * exportScale,
    rect.width * exportScale,
    rect.height * exportScale
  )
  context.restore()

  return {
    name: CUSTOM_PORTRAIT_POPOUT_LAYER_NAME,
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'custom'
  } satisfies NSPlateLayeredExportLayer
}

function createLayerCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  return canvas
}

function getLayerContext(canvas: HTMLCanvasElement, smoothing: boolean) {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('canvas-context')
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = smoothing

  if (smoothing && 'imageSmoothingQuality' in context) {
    context.imageSmoothingQuality = 'high'
  }

  return context
}

function normalizeExportScale(scale: number) {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('invalid-scale')
  }

  return scale
}

function loadLayerImage(source: string) {
  if (!source) {
    return Promise.resolve(null)
  }

  return new Promise<HTMLImageElement | null>((resolve) => {
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
    image.onerror = () => resolve(null)
    image.src = source
  })
}

async function placeLayerOnFullCanvas(
  layer: NSPlateLayeredExportLayer,
  canvasWidth: number,
  canvasHeight: number
) {
  const image = await loadLayerImage(layer.rgbaData)

  if (!image) {
    throw new Error('layer-image-decode')
  }

  const canvas = createLayerCanvas(canvasWidth, canvasHeight)
  const context = getLayerContext(canvas, false)

  context.drawImage(image, Math.round(layer.x), Math.round(layer.y))
  return canvasToPngBlob(canvas)
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('canvas-blob'))
    }, 'image/png')
  })
}

function normalizeCanvasSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('invalid-canvas-size')
  }

  return Math.max(1, Math.round(value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
