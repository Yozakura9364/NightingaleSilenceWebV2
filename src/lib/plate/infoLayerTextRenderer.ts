import type {
  NSPlateInfoTextAlign,
  NSPlateInfoTextRenderLayer
} from '@/lib/plate/infoLayerRenderDefinitions'

interface NSPlateInfoTextLayoutRow {
  text: string
  left: number
  textLeft: number
  top: number
  width: number
  textWidth: number
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
  fontVariantCaps?: string
  letterSpacing?: string
}

interface NSPlateInfoTextRenderCanvasDimensions {
  width: number
  height: number
}

const INFO_TEXT_AUTO_WRAP_MAX_WIDTH = 810
const INFO_TEXT_FONT_LOAD_TIMEOUT_MS = 160
const TEXT_RENDER_EFFECT_SHADOW_GRAY = 'shadowGray'
const TEXT_RENDER_EFFECT_EMBOSS_SOFT = 'embossSoft'

export async function drawNSPlateInfoTextLayers(
  context: CanvasRenderingContext2D,
  layers: NSPlateInfoTextRenderLayer[]
) {
  const resolvedLayouts = new Map<string, NSPlateInfoTextLayout>()
  const resolvedLayers = new Map<string, NSPlateInfoTextRenderLayer>()

  for (const layer of layers) {
    const targetLayer = resolveFollowLayerPosition(layer, resolvedLayouts, resolvedLayers, context)

    await ensureInfoTextLayerFontReady(targetLayer)
    const layout = computeInfoTextLayerLayout(context, targetLayer)
    drawInfoTextLayer(context, targetLayer, layout)

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

  const sample = layer.text || layer.defaultText || 'Aa'

  try {
    await Promise.race([
      document.fonts.load(buildInfoTextLayerFontSpec(layer), sample),
      new Promise((resolve) => window.setTimeout(resolve, INFO_TEXT_FONT_LOAD_TIMEOUT_MS))
    ])
  } catch {
    // Canvas fallback font is acceptable until old NSPortable font assets are migrated.
  }
}

function drawInfoTextLayer(
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

    if (effect) {
      drawInfoTextShadow(context, row)
    }

    if (hasStroke) {
      context.strokeText(row.text, row.textLeft, row.top)
    }

    context.fillText(row.text, row.textLeft, row.top)
  }

  context.restore()
}

function drawInfoTextShadow(context: CanvasRenderingContext2D, row: NSPlateInfoTextLayoutRow) {
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
  context.strokeText(row.text, x, y)
  context.fillText(row.text, x, y)

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
  const wrapWidthPx = Math.max(1, INFO_TEXT_AUTO_WRAP_MAX_WIDTH / scaleX)

  context.save()
  context.font = fontSpec
  applyInfoTextCanvasFeatures(context, layer)

  const rows = wrapInfoTextLines(layer.text, context, wrapWidthPx).map((text, index) => {
    const textWidth = measureInfoText(context, text)
    const left = resolveAlignedTextLeft(xAnchor, textWidth, layer.align)

    return {
      text,
      width: textWidth,
      textWidth,
      left,
      textLeft: left,
      top: yAnchor + index * lineHeightPx
    } satisfies NSPlateInfoTextLayoutRow
  })

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
  const minY = yAnchor
  const maxY = yAnchor + rows.length * lineHeightPx
  const scaledMinXRaw = xAnchor + (minX - xAnchor) * scaleX
  const scaledMaxXRaw = xAnchor + (maxX - xAnchor) * scaleX
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

function wrapInfoTextLines(text: string, context: CanvasRenderingContext2D, maxWidth: number) {
  const lines: string[] = []

  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine || measureInfoText(context, rawLine) <= maxWidth) {
      lines.push(rawLine)
      continue
    }

    let current = ''

    for (const char of Array.from(rawLine)) {
      const next = `${current}${char}`

      if (current && measureInfoText(context, next) > maxWidth) {
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

function measureInfoText(context: CanvasRenderingContext2D, text: string) {
  return text ? context.measureText(text).width : 0
}

function buildInfoTextLayerFontSpec(layer: NSPlateInfoTextRenderLayer) {
  const style = layer.italic ? 'italic' : 'normal'
  const weight = layer.bold ? 700 : resolveFontVariantWeight(layer.fontVariant)

  return `${style} ${weight} ${Math.max(1, layer.fontSize)}px ${quoteFontFamily(
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

function resolveFontVariantWeight(fontVariant: string | undefined) {
  const key = fontVariant?.toLowerCase() ?? ''

  if (key.includes('ultra') || key.includes('thin')) {
    return 200
  }

  if (key.includes('extra') || key.includes('light')) {
    return 300
  }

  if (key.includes('medium')) {
    return 500
  }

  if (key.includes('bold') || key.includes('heavy') || key.includes('black')) {
    return 700
  }

  return 400
}

function applyInfoTextCanvasFeatures(
  context: CanvasRenderingContext2D,
  layer: NSPlateInfoTextRenderLayer
) {
  const featureContext = context as unknown as CanvasTextFeatureContext
  const trackingPx = (normalizeNumber(layer.tracking, 0) / 1000) * layer.fontSize

  if ('fontKerning' in featureContext) {
    featureContext.fontKerning = 'normal'
  }

  if ('fontVariantCaps' in featureContext) {
    featureContext.fontVariantCaps = layer.smallCaps ? 'small-caps' : 'normal'
  }

  if ('letterSpacing' in featureContext) {
    featureContext.letterSpacing = `${trackingPx}px`
  }
}

function resolveAlignedTextLeft(anchorX: number, width: number, align: NSPlateInfoTextAlign) {
  if (align === 'center') {
    return anchorX - width / 2
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
