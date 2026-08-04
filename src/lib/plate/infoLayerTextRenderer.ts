import type {
  NSPlateInfoTextAlign,
  NSPlateInfoTextRenderLayer
} from '@/lib/plate/infoLayerRenderTypes'
import { normalizeNSPlateResourcePath, resolveNSPlateImageUrl } from '@/lib/plate/assetUrls'
import { createLruCache } from '@/lib/utils/lruCache'

interface NSPlateInfoTextGlyphRun {
  text: string
  scale: number
}

interface NSPlateInfoTextLayoutRow {
  text: string
  left: number
  textLeft: number
  top: number
  width: number
  textWidth: number
  runs?: NSPlateInfoTextGlyphRun[]
  iconPath?: string
  iconWidthPx?: number
  iconHeightPx?: number
  iconGapPx?: number
  iconWorldTransrate?: boolean
  iconFixedBottomY?: number
}

interface NSPlateInfoTextLayout {
  rows: NSPlateInfoTextLayoutRow[]
  fontSpec: string
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number
  }
}

interface CanvasTextFeatureContext {
  fontKerning?: string
  fontVariantLigatures?: string
  fontFeatureSettings?: string
  letterSpacing?: string
  textRendering?: string
  lang?: string
}

interface NSPlateInfoTextRenderCanvasDimensions {
  width: number
  height: number
}

export interface NSPlateInfoTextLayerCanvas {
  layer: NSPlateInfoTextRenderLayer
  canvas: HTMLCanvasElement
  x: number
  y: number
  width: number
  height: number
}

const INFO_TEXT_AUTO_WRAP_MAX_WIDTH = 810
const INFO_TEXT_FONT_LOAD_TIMEOUT_MS = 30_000
const INFO_TEXT_WORLD_TRANSRATE_INLINE_BOTTOM_Y = 351
const TEXT_RENDER_EFFECT_SHADOW_GRAY = 'shadowGray'
const TEXT_RENDER_EFFECT_EMBOSS_SOFT = 'embossSoft'
// 与 NSPortable SMALL_CAPS_GLYPH_SCALE 一致：小写字母转大写后按 0.82 缩小
const SMALL_CAPS_GLYPH_SCALE = 0.82

function isLowercaseLetterForSmallCaps(char: string) {
  return char.toLowerCase() !== char.toUpperCase() && char === char.toLowerCase()
}

function buildSmallCapsRuns(text: string): NSPlateInfoTextGlyphRun[] {
  const runs: NSPlateInfoTextGlyphRun[] = []
  let currentScale: number | null = null
  let currentText = ''

  for (const char of text) {
    const lowerLike = isLowercaseLetterForSmallCaps(char)
    const scale = lowerLike ? SMALL_CAPS_GLYPH_SCALE : 1
    const nextChar = lowerLike ? char.toUpperCase() : char

    if (currentScale === null || currentScale !== scale) {
      if (currentText && currentScale !== null) {
        runs.push({ text: currentText, scale: currentScale })
      }
      currentScale = scale
      currentText = nextChar
      continue
    }
    currentText += nextChar
  }

  if (currentText && currentScale !== null) {
    runs.push({ text: currentText, scale: currentScale })
  }

  return runs
}

const infoTextImageCache = createLruCache<string, Promise<HTMLImageElement | null>>(50)
const infoTextFontLoadCache = new Map<string, Promise<void>>()

export async function drawNSPlateInfoTextLayers(
  context: CanvasRenderingContext2D,
  layers: NSPlateInfoTextRenderLayer[]
) {
  await ensureInfoTextLayersFontsReady(layers)

  const resolvedLayouts = new Map<string, NSPlateInfoTextLayout>()
  const resolvedLayers = new Map<string, NSPlateInfoTextRenderLayer>()

  for (const layer of layers) {
    const targetLayer = resolveFollowLayerPosition(layer, resolvedLayouts, resolvedLayers, context)

    await ensureInfoTextLayerFontReady(targetLayer)
    const layout = computeInfoTextLayerLayout(context, targetLayer)
    await drawInfoTextLayer(context, targetLayer, layout)

    resolvedLayers.set(targetLayer.slotId, targetLayer)
    resolvedLayouts.set(targetLayer.slotId, layout)
  }
}

export async function renderNSPlateInfoTextLayersToCanvas(
  layers: NSPlateInfoTextRenderLayer[],
  dimensions: NSPlateInfoTextRenderCanvasDimensions,
  scale: number
) {
  if (!layers.length) {
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(dimensions.width * scale))
  canvas.height = Math.max(1, Math.round(dimensions.height * scale))

  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = false
  context.save()
  context.scale(scale, scale)
  await drawNSPlateInfoTextLayers(context, layers)
  context.restore()

  return canvas
}

export async function renderNSPlateInfoTextLayersToLayerCanvases(
  layers: NSPlateInfoTextRenderLayer[],
  scale: number
): Promise<NSPlateInfoTextLayerCanvas[]> {
  if (!layers.length) {
    return []
  }

  const measurementCanvas = document.createElement('canvas')
  measurementCanvas.width = 1
  measurementCanvas.height = 1
  const measurementContext = measurementCanvas.getContext('2d')

  if (!measurementContext) {
    return []
  }

  const output: NSPlateInfoTextLayerCanvas[] = []
  const resolvedLayouts = new Map<string, NSPlateInfoTextLayout>()
  const resolvedLayers = new Map<string, NSPlateInfoTextRenderLayer>()
  const exportScale = normalizeLayerExportScale(scale)

  await ensureInfoTextLayersFontsReady(layers)

  for (const layer of layers) {
    const targetLayer = resolveFollowLayerPosition(
      layer,
      resolvedLayouts,
      resolvedLayers,
      measurementContext
    )

    await ensureInfoTextLayerFontReady(targetLayer)
    const layout = computeInfoTextLayerLayout(measurementContext, targetLayer)

    resolvedLayers.set(targetLayer.slotId, targetLayer)
    resolvedLayouts.set(targetLayer.slotId, layout)

    if (!layout.rows.some((row) => row.text.length > 0)) {
      continue
    }

    const padding = resolveInfoTextLayerExportPadding(targetLayer)
    const width = Math.max(1, Math.ceil((layout.bounds.width + padding * 2) * exportScale))
    const height = Math.max(1, Math.ceil((layout.bounds.height + padding * 2) * exportScale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')

    if (!context) {
      continue
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.imageSmoothingEnabled = false
    context.save()
    context.scale(exportScale, exportScale)
    context.translate(-layout.bounds.minX + padding, -layout.bounds.minY + padding)
    await drawInfoTextLayer(context, targetLayer, layout)
    context.restore()

    output.push({
      layer: targetLayer,
      canvas,
      x: Math.floor((layout.bounds.minX - padding) * exportScale),
      y: Math.floor((layout.bounds.minY - padding) * exportScale),
      width: canvas.width,
      height: canvas.height
    })
  }

  return output
}

function resolveFollowLayerPosition(
  layer: NSPlateInfoTextRenderLayer,
  resolvedLayouts: Map<string, NSPlateInfoTextLayout>,
  resolvedLayers: Map<string, NSPlateInfoTextRenderLayer>,
  context: CanvasRenderingContext2D
) {
  if (!layer.followLayerId) {
    return layer
  }

  const sourceLayer = resolvedLayers.get(layer.followLayerId)
  const sourceLayout =
    resolvedLayouts.get(layer.followLayerId) ??
    (sourceLayer ? computeInfoTextLayerLayout(context, sourceLayer) : null)

  if (!sourceLayout) {
    return layer
  }

  const minOffset = resolveInfoTextLayerMinXOffsetFromAnchor(context, layer)
  const followXGap = Number.isFinite(layer.followXGap) ? Number(layer.followXGap) : 0
  const nextX = Math.round(sourceLayout.bounds.maxX + followXGap - minOffset)

  return {
    ...layer,
    x: nextX
  } satisfies NSPlateInfoTextRenderLayer
}

function resolveInfoTextLayerMinXOffsetFromAnchor(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoTextRenderLayer
) {
  const layout = computeInfoTextLayerLayout(context, layer)
  return layout.bounds.minX - Math.round(layer.x)
}

async function ensureInfoTextLayerFontReady(layer: NSPlateInfoTextRenderLayer) {
  if (!document.fonts || typeof document.fonts.load !== 'function') {
    return
  }

  const fontSpec = buildInfoTextLayerFontSpec(layer)
  const sample = layer.text || layer.defaultText || 'Aa'
  let loadPromise = infoTextFontLoadCache.get(fontSpec)

  if (!loadPromise) {
    loadPromise = document.fonts.load(fontSpec, sample).then(() => undefined)
    infoTextFontLoadCache.set(fontSpec, loadPromise)
    void loadPromise.catch(() => infoTextFontLoadCache.delete(fontSpec))
  }

  try {
    await waitForInfoTextFont(loadPromise)
  } catch {
    // Keep the editor usable when a font asset is unavailable or the request fails.
  }
}

async function ensureInfoTextLayersFontsReady(layers: NSPlateInfoTextRenderLayer[]) {
  await Promise.all(layers.map((layer) => ensureInfoTextLayerFontReady(layer)))
}

async function waitForInfoTextFont(loadPromise: Promise<void>) {
  let timeoutId: number | undefined

  try {
    await Promise.race([
      loadPromise,
      new Promise<void>((resolve) => {
        timeoutId = window.setTimeout(resolve, INFO_TEXT_FONT_LOAD_TIMEOUT_MS)
      })
    ])
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
    }
  }
}

async function drawInfoTextLayer(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoTextRenderLayer,
  layout: NSPlateInfoTextLayout
) {
  if (!layout.rows.some((row) => row.text.length > 0)) {
    return
  }

  const anchorX = Math.round(layer.x)
  const anchorY = Math.round(layer.y)
  const scaleX = normalizeScalePercent(layer.scaleXPercent)
  const scaleY = normalizeScalePercent(layer.scaleYPercent)
  const hasStroke = layer.strokeEnabled === true && normalizePositiveNumber(layer.strokeWidth) > 0
  const strokeWidth = normalizePositiveNumber(layer.strokeWidth)
  const effect = normalizeRenderEffect(layer.renderEffect)
  const inlineIconImage = await loadInfoTextInlineIconImage(layout)

  context.save()

  if (Math.abs(scaleX - 1) > 1e-6 || Math.abs(scaleY - 1) > 1e-6) {
    context.translate(anchorX, anchorY)
    context.scale(scaleX, scaleY)
    context.translate(-anchorX, -anchorY)
  }

  context.globalAlpha = clamp(layer.opacity, 0, 1)
  context.fillStyle = normalizeColor(layer.color, '#ffffff')
  context.textBaseline = 'top'
  context.textAlign = 'left'
  context.font = layout.fontSpec
  applyInfoTextCanvasFeatures(context, layer)

  if (hasStroke) {
    context.strokeStyle = normalizeColor(layer.strokeColor, '#000000')
    context.lineWidth = Math.max(0.01, strokeWidth * 2)
    context.lineJoin = 'round'
    context.miterLimit = 2
  }

  for (const row of layout.rows) {
    if (!row.text) {
      continue
    }

    drawInfoTextInlineIcon(context, layer, row, inlineIconImage)

    if (effect) {
      drawInfoTextShadow(context, layer, row, layout.fontSpec)
    }

    if (hasStroke) {
      drawInfoTextRowGlyphs(context, layer, row, layout.fontSpec, row.textLeft, row.top, true, false)
    }

    drawInfoTextRowGlyphs(context, layer, row, layout.fontSpec, row.textLeft, row.top, false, true)
  }

  context.restore()
}

function drawInfoTextInlineIcon(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoTextRenderLayer,
  row: NSPlateInfoTextLayoutRow,
  image: HTMLImageElement | null
) {
  const iconWidthPx = Math.max(0, Number(row.iconWidthPx) || 0)
  const iconHeightPx = Math.max(0, Number(row.iconHeightPx) || 0)

  if (!image || iconWidthPx <= 0 || iconHeightPx <= 0) {
    return
  }

  const iconGapPx = Math.max(0, Number(row.iconGapPx) || 0)
  const iconX = row.iconWorldTransrate ? row.textLeft - iconGapPx - iconWidthPx : row.left
  const iconY = row.iconWorldTransrate
    ? (Number.isFinite(Number(row.iconFixedBottomY))
        ? Number(row.iconFixedBottomY)
        : INFO_TEXT_WORLD_TRANSRATE_INLINE_BOTTOM_Y) - iconHeightPx
    : row.top + Math.max(1, Number(layer.fontSize) || 1) - iconHeightPx

  context.drawImage(image, iconX, iconY, iconWidthPx, iconHeightPx)
}

function drawInfoTextRowGlyphs(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoTextRenderLayer,
  row: NSPlateInfoTextLayoutRow,
  fontSpec: string,
  textLeft: number,
  textTop: number,
  drawStroke: boolean,
  drawFill: boolean
) {
  if (!row.text) {
    return
  }

  // smallCaps：逐 run 绘制，小写 run 缩小字号并底对齐（NSPortable 行为）
  if (layer.smallCaps && row.runs?.length) {
    let runLeft = textLeft
    for (const run of row.runs) {
      const runFontSize = Math.max(1, layer.fontSize * run.scale)
      const runTop = textTop + (layer.fontSize - runFontSize)
      context.font = buildInfoTextLayerFontSpecWithSize(layer, runFontSize)
      if (drawStroke) {
        context.strokeText(run.text, runLeft, runTop)
      }
      if (drawFill) {
        context.fillText(run.text, runLeft, runTop)
      }
      runLeft += context.measureText(run.text).width
    }
    context.font = fontSpec
    return
  }

  if (drawStroke) {
    context.strokeText(row.text, textLeft, textTop)
  }
  if (drawFill) {
    context.fillText(row.text, textLeft, textTop)
  }
}

function drawInfoTextShadow(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoTextRenderLayer,
  row: NSPlateInfoTextLayoutRow,
  fontSpec: string
) {
  const previousFillStyle = context.fillStyle
  const previousStrokeStyle = context.strokeStyle
  const previousLineWidth = context.lineWidth
  const previousLineJoin = context.lineJoin
  const previousMiterLimit = context.miterLimit

  context.fillStyle = 'rgba(64,64,64,0.72)'
  context.strokeStyle = 'rgba(64,64,64,0.72)'
  context.lineWidth = 0.7
  context.lineJoin = 'miter'
  context.miterLimit = 4

  const x = Math.round(row.textLeft)
  const y = Math.round(row.top + 1)
  drawInfoTextRowGlyphs(context, layer, row, fontSpec, x, y, true, true)

  context.fillStyle = previousFillStyle
  context.strokeStyle = previousStrokeStyle
  context.lineWidth = previousLineWidth
  context.lineJoin = previousLineJoin
  context.miterLimit = previousMiterLimit
}

function computeInfoTextLayerLayout(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoTextRenderLayer
): NSPlateInfoTextLayout {
  const fontSpec = buildInfoTextLayerFontSpec(layer)
  const lineHeightPx = Math.max(1, Math.round(layer.fontSize * normalizeLineHeight(layer)))
  const xAnchor = Math.round(layer.x)
  const yAnchor = Math.round(layer.y)
  const scaleX = normalizeScalePercent(layer.scaleXPercent)
  const scaleY = normalizeScalePercent(layer.scaleYPercent)
  const inlineIcon = resolveInfoTextInlineIcon(layer)
  const iconExtraWidthPx = inlineIcon ? inlineIcon.width + inlineIcon.gap : 0
  const wrapWidthPx = Math.max(1, INFO_TEXT_AUTO_WRAP_MAX_WIDTH / scaleX - iconExtraWidthPx)

  context.save()
  context.font = fontSpec
  applyInfoTextCanvasFeatures(context, layer)

  // smallCaps 时逐 run 测量（小写 run 用缩小字号），与 NSPortable 一致
  const measureRowWidth = (text: string): number => {
    if (!text) {
      return 0
    }
    if (!layer.smallCaps) {
      return context.measureText(text).width
    }
    let width = 0
    for (const run of buildSmallCapsRuns(text)) {
      context.font = buildInfoTextLayerFontSpecWithSize(layer, layer.fontSize * run.scale)
      width += context.measureText(run.text).width
    }
    context.font = fontSpec
    return width
  }

  const centerReferenceWidth = resolveInfoTextCenterReferenceWidth(
    measureRowWidth,
    layer,
    wrapWidthPx
  )
  const rows: NSPlateInfoTextLayoutRow[] = wrapInfoTextLines(
    layer.text,
    measureRowWidth,
    wrapWidthPx
  ).map((text, index) => {
      const textWidth = measureRowWidth(text)
      const runs = layer.smallCaps && text ? buildSmallCapsRuns(text) : undefined
      const hasInlineIconOnRow = index === 0 && inlineIcon !== null
      const isWorldTransrateInlineIcon =
        hasInlineIconOnRow && isWorldTransrateInlineIconPath(inlineIcon.path)

      if (inlineIcon && isWorldTransrateInlineIcon) {
        const textLeft = resolveAlignedTextLeft(
          xAnchor,
          textWidth,
          layer.align,
          centerReferenceWidth
        )

        return {
          text,
          width: textWidth,
          textWidth,
          runs,
          left: textLeft,
          textLeft,
          top: yAnchor + index * lineHeightPx,
          iconPath: inlineIcon.path,
          iconWidthPx: inlineIcon.width,
          iconHeightPx: inlineIcon.height,
          iconGapPx: inlineIcon.gap,
          iconWorldTransrate: true,
          iconFixedBottomY: INFO_TEXT_WORLD_TRANSRATE_INLINE_BOTTOM_Y
        } satisfies NSPlateInfoTextLayoutRow
      }

      const iconWidth = inlineIcon && hasInlineIconOnRow ? inlineIcon.width + inlineIcon.gap : 0
      const width = textWidth + iconWidth
      const left = resolveAlignedTextLeft(xAnchor, width, layer.align, centerReferenceWidth)

      return {
        text,
        width,
        textWidth,
        runs,
        left,
        textLeft: left + iconWidth,
        top: yAnchor + index * lineHeightPx,
        iconPath: inlineIcon && hasInlineIconOnRow ? inlineIcon.path : '',
        iconWidthPx: inlineIcon && hasInlineIconOnRow ? inlineIcon.width : 0,
        iconHeightPx: inlineIcon && hasInlineIconOnRow ? inlineIcon.height : 0,
        iconGapPx: inlineIcon && hasInlineIconOnRow ? inlineIcon.gap : 0
      } satisfies NSPlateInfoTextLayoutRow
    }
  )

  if (!rows.length) {
    rows.push({
      text: '',
      width: 0,
      textWidth: 0,
      left: xAnchor,
      textLeft: xAnchor,
      top: yAnchor
    })
  }

  context.restore()

  const minX = Math.min(...rows.map((row) => row.left))
  const maxX = Math.max(...rows.map((row) => row.left + row.width))
  let minY = yAnchor
  let maxY = yAnchor + rows.length * lineHeightPx
  let minXWithIcon = minX
  let maxXWithIcon = maxX

  for (const row of rows) {
    const iconWidthPx = Math.max(0, Number(row.iconWidthPx) || 0)
    const iconHeightPx = Math.max(0, Number(row.iconHeightPx) || 0)

    if (iconWidthPx <= 0 || iconHeightPx <= 0) {
      continue
    }

    const iconGapPx = Math.max(0, Number(row.iconGapPx) || 0)
    const iconLeft = row.iconWorldTransrate ? row.textLeft - iconGapPx - iconWidthPx : row.left
    const iconTop = row.iconWorldTransrate
      ? (Number.isFinite(Number(row.iconFixedBottomY))
          ? Number(row.iconFixedBottomY)
          : INFO_TEXT_WORLD_TRANSRATE_INLINE_BOTTOM_Y) - iconHeightPx
      : row.top + layer.fontSize - iconHeightPx
    const iconRight = iconLeft + iconWidthPx
    const iconBottom = iconTop + iconHeightPx

    minXWithIcon = Math.min(minXWithIcon, iconLeft)
    maxXWithIcon = Math.max(maxXWithIcon, iconRight)
    minY = Math.min(minY, iconTop)
    maxY = Math.max(maxY, iconBottom)
  }

  const scaledMinXRaw = xAnchor + (minXWithIcon - xAnchor) * scaleX
  const scaledMaxXRaw = xAnchor + (maxXWithIcon - xAnchor) * scaleX
  const scaledMinYRaw = yAnchor + (minY - yAnchor) * scaleY
  const scaledMaxYRaw = yAnchor + (maxY - yAnchor) * scaleY
  const scaledMinX = Math.min(scaledMinXRaw, scaledMaxXRaw)
  const scaledMaxX = Math.max(scaledMinXRaw, scaledMaxXRaw)
  const scaledMinY = Math.min(scaledMinYRaw, scaledMaxYRaw)
  const scaledMaxY = Math.max(scaledMinYRaw, scaledMaxYRaw)

  return {
    rows,
    fontSpec,
    bounds: {
      minX: scaledMinX,
      minY: scaledMinY,
      maxX: scaledMaxX,
      maxY: scaledMaxY,
      width: Math.max(1, Math.ceil(scaledMaxX - scaledMinX)),
      height: Math.max(1, Math.ceil(scaledMaxY - scaledMinY))
    }
  }
}

function resolveInfoTextInlineIcon(layer: NSPlateInfoTextRenderLayer) {
  const path = normalizeInfoTextInlineIconPath(layer.inlineIconPath)
  const width = path ? normalizePositiveNumber(layer.inlineIconWidth) : 0
  const height = path ? normalizePositiveNumber(layer.inlineIconHeight) : 0
  const gap = width > 0 && height > 0 ? Math.max(0, normalizeNumber(layer.inlineIconGap, 0)) : 0

  return path && width > 0 && height > 0
    ? {
        path,
        width,
        height,
        gap
      }
    : null
}

function normalizeInfoTextInlineIconPath(value: unknown) {
  return normalizeNSPlateResourcePath(value)
}

function resolveInfoTextInlineIconUrl(path: string) {
  return resolveNSPlateImageUrl(path)
}

function isWorldTransrateInlineIconPath(value: string) {
  const normalized = value.replace(/\\/g, '/').toLowerCase()

  return (
    normalized === 'ui/sprites/worldtransrate_4.png' || normalized.endsWith('/worldtransrate_4.png')
  )
}

function loadInfoTextInlineIconImage(layout: NSPlateInfoTextLayout) {
  const path = layout.rows.find((row) => row.iconPath)?.iconPath ?? ''

  if (!path) {
    return Promise.resolve(null)
  }

  return loadInfoTextImage(resolveInfoTextInlineIconUrl(path))
}

function loadInfoTextImage(source: string) {
  if (!source) {
    return Promise.resolve(null)
  }

  const cached = infoTextImageCache.get(source)

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
      infoTextImageCache.delete(source)
      resolve(null)
    }
    image.src = source
  })

  infoTextImageCache.set(source, promise)
  return promise
}

function wrapInfoTextLines(text: string, measure: (value: string) => number, maxWidth: number) {
  const lines: string[] = []

  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine || measure(rawLine) <= maxWidth) {
      lines.push(rawLine)
      continue
    }

    let current = ''

    for (const char of Array.from(rawLine)) {
      const next = `${current}${char}`

      if (current && measure(next) > maxWidth) {
        lines.push(current)
        current = char
      } else {
        current = next
      }
    }

    lines.push(current)
  }

  return lines
}

function resolveInfoTextCenterReferenceWidth(
  measure: (text: string) => number,
  layer: NSPlateInfoTextRenderLayer,
  wrapWidthPx: number
) {
  if (layer.align !== 'center' || layer.centerOnDefaultText !== true) {
    return 0
  }

  const referenceRows = wrapInfoTextLines(layer.defaultText, measure, wrapWidthPx)
  return Math.max(0, ...referenceRows.map((row) => measure(row)))
}

function buildInfoTextLayerFontSpec(layer: NSPlateInfoTextRenderLayer) {
  return buildInfoTextLayerFontSpecWithSize(layer, layer.fontSize)
}

function buildInfoTextLayerFontSpecWithSize(layer: NSPlateInfoTextRenderLayer, fontSizePx: number) {
  const style = layer.italic ? 'italic' : 'normal'
  const weight = resolveFontVariantWeight(layer.fontFamily, layer.fontVariant, layer.bold)

  return `${style} ${weight} ${Math.max(1, fontSizePx)}px ${quoteFontFamily(
    layer.fontFamily
  )}, sans-serif`
}

function quoteFontFamily(fontFamily: string) {
  const value = fontFamily.trim() || 'sans-serif'

  if (/^[a-zA-Z0-9_-]+$/.test(value)) {
    return value
  }

  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

// 与 NSPortable TEXT_FONT_VARIANT_BY_FAMILY 一致：字重档位按字体族解析，
// 未识别档位回退 regular；legacy bold=true 且无有效档位时回退 bold
const TEXT_FONT_VARIANT_DEFAULT = [
  { key: 'regular', weight: 400 },
  { key: 'medium', weight: 500 },
  { key: 'bold', weight: 700 }
] as const

const TEXT_FONT_VARIANT_BY_FAMILY: Record<string, readonly { key: string; weight: number }[]> = {
  'adobe heiti std': [{ key: 'regular', weight: 400 }],
  'harmonyos sans sc': [
    { key: 'thin', weight: 100 },
    { key: 'light', weight: 300 },
    { key: 'regular', weight: 400 },
    { key: 'medium', weight: 500 },
    { key: 'bold', weight: 700 },
    { key: 'black', weight: 900 }
  ],
  axis: [
    { key: 'ultralight', weight: 100 },
    { key: 'extralight', weight: 200 },
    { key: 'light', weight: 300 },
    { key: 'regular', weight: 400 },
    { key: 'medium', weight: 500 },
    { key: 'bold', weight: 700 },
    { key: 'heavy', weight: 800 }
  ],
  miedinger: [{ key: 'regular', weight: 400 }],
  'eofont sp': [{ key: 'regular', weight: 400 }],
  'jupiter pro': [{ key: 'regular', weight: 400 }],
  'augmented neo-eorzean': [{ key: 'regular', weight: 400 }],
  'augmented far eastern script': [{ key: 'regular', weight: 400 }],
  'augmented norvrandt': [{ key: 'regular', weight: 400 }],
  'augmented postulated proto-alphabet': [{ key: 'regular', weight: 400 }]
}

function isJupiterProFontFamily(fontFamily: string) {
  return fontFamily.trim().toLowerCase() === 'jupiter pro'
}

function resolveFontVariantWeight(
  fontFamily: string,
  fontVariant: string | undefined,
  bold: boolean | undefined
) {
  const options =
    TEXT_FONT_VARIANT_BY_FAMILY[fontFamily.trim().toLowerCase()] ?? TEXT_FONT_VARIANT_DEFAULT
  const raw = (fontVariant ?? '').trim().toLowerCase()
  const matched = options.find((item) => item.key === raw)

  if (matched) {
    return matched.weight
  }

  const fallbackKey = bold ? 'bold' : 'regular'
  const fallback = options.find((item) => item.key === fallbackKey) ?? options[0]
  return fallback?.weight ?? 400
}

function applyInfoTextCanvasFeatures(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoTextRenderLayer
) {
  // 与 NSPortable applyCanvasTextFeatureHints 对齐：默认关闭连字/上下文替代；
  // Jupiter Pro 额外锁死全部 OpenType 特性并使用英文语言标记
  const featureContext = context as unknown as CanvasTextFeatureContext
  const trackingPx = (normalizeNumber(layer.tracking, 0) / 1000) * layer.fontSize
  const jupiterPro = isJupiterProFontFamily(layer.fontFamily)

  if ('fontKerning' in featureContext) {
    featureContext.fontKerning = 'normal'
  }

  if ('fontVariantLigatures' in featureContext) {
    featureContext.fontVariantLigatures = 'none'
  }

  if ('fontFeatureSettings' in featureContext) {
    featureContext.fontFeatureSettings = jupiterPro
      ? '"liga" 0, "clig" 0, "dlig" 0, "hlig" 0, "calt" 0, "salt" 0, "aalt" 0, ' +
        '"smcp" 0, "c2sc" 0, "pcap" 0, "onum" 0, "lnum" 0, "tnum" 0, "pnum" 0, ' +
        '"ss01" 0, "ss02" 0, "ss03" 0, "ss04" 0, "ss05" 0, "titl" 0, "swsh" 0'
      : '"liga" 0, "clig" 0, "calt" 0'
  }

  if ('letterSpacing' in featureContext) {
    featureContext.letterSpacing = `${trackingPx}px`
  }

  if ('textRendering' in featureContext) {
    featureContext.textRendering = 'auto'
  }

  if ('lang' in featureContext) {
    featureContext.lang = jupiterPro ? 'en' : 'zh-CN'
  }
}

function resolveAlignedTextLeft(
  anchorX: number,
  width: number,
  align: NSPlateInfoTextAlign,
  centerReferenceWidth = 0
) {
  if (align === 'center') {
    return anchorX + centerReferenceWidth / 2 - width / 2
  }

  if (align === 'right') {
    return anchorX - width
  }

  return anchorX
}

function normalizeRenderEffect(value: string | undefined) {
  return value === TEXT_RENDER_EFFECT_SHADOW_GRAY || value === TEXT_RENDER_EFFECT_EMBOSS_SOFT
}

function normalizeLineHeight(layer: NSPlateInfoTextRenderLayer) {
  const value = normalizePositiveNumber(layer.lineHeight)
  return value > 0 ? value : 1.2
}

function normalizeScalePercent(value: number) {
  const numberValue = normalizeNumber(value, 100)
  return Math.max(0.01, numberValue / 100)
}

function normalizeLayerExportScale(value: number) {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 1
}

function resolveInfoTextLayerExportPadding(layer: NSPlateInfoTextRenderLayer) {
  const strokePadding =
    layer.strokeEnabled === true ? Math.ceil(normalizePositiveNumber(layer.strokeWidth) * 2) : 0
  const effectPadding = normalizeRenderEffect(layer.renderEffect) ? 4 : 0

  return Math.max(2, strokePadding, effectPadding)
}

function normalizePositiveNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0
}

function normalizeNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function normalizeColor(value: string | undefined, fallback: string) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return max
  }

  return Math.min(max, Math.max(min, value))
}
