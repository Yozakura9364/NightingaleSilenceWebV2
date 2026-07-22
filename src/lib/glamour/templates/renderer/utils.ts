import type { GlamourTemplateLoadedAssetMap } from '@/lib/glamour/templates/assets'
import type { GlamourTemplateRenderData } from '@/lib/glamour/templates/renderData'
import {
  EC_TEMPLATE_SOURCE_SIZE,
  EC_TEMPLATE_COLORS,
  EC_TEMPLATE_LAYOUTS,
  HORIZONTAL_TEMPLATE,
  DOUBLE_PIC_TEMPLATE,
  CLEAR_DYE_ICON_ASSET,
  type EcTemplateLayout,
  type EcFittedItemNameLayout
} from './layouts'

// ---- Scaling helpers ----

export function templateUnit(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / EC_TEMPLATE_SOURCE_SIZE) * renderData.canvas.width
}

export function templateRect(renderData: GlamourTemplateRenderData, rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: templateUnit(renderData, rect.x),
    y: templateUnit(renderData, rect.y),
    width: templateUnit(renderData, rect.width),
    height: templateUnit(renderData, rect.height)
  }
}

export function horizontalUnit(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / HORIZONTAL_TEMPLATE.sourceWidth) * renderData.canvas.width
}

export function horizontalUnitY(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / HORIZONTAL_TEMPLATE.sourceHeight) * renderData.canvas.height
}

export function horizontalRect(renderData: GlamourTemplateRenderData, rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: horizontalUnit(renderData, rect.x),
    y: horizontalUnitY(renderData, rect.y),
    width: horizontalUnit(renderData, rect.width),
    height: horizontalUnitY(renderData, rect.height)
  }
}

export function doublePicUnit(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / DOUBLE_PIC_TEMPLATE.sourceWidth) * renderData.canvas.width
}

export function doublePicUnitY(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / DOUBLE_PIC_TEMPLATE.sourceHeight) * renderData.canvas.height
}

export function doublePicRect(renderData: GlamourTemplateRenderData, rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: doublePicUnit(renderData, rect.x),
    y: doublePicUnitY(renderData, rect.y),
    width: doublePicUnit(renderData, rect.width),
    height: doublePicUnitY(renderData, rect.height)
  }
}

// ---- Path / drawing helpers ----

export function makeRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function fillRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  makeRoundedRectPath(ctx, x, y, width, height, radius)
  ctx.fill()
}

// ---- Color helpers ----

export function colorWithAlpha(color: string, alpha: number): string {
  const normalizedAlpha = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1))
  const hex = String(color || '').trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)

  if (!hex) {
    return color || `rgba(0, 0, 0, ${normalizedAlpha})`
  }

  const value = hex[1].length === 3
    ? hex[1].split('').map((char) => `${char}${char}`).join('')
    : hex[1]
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${normalizedAlpha})`
}

export function normalizeHexColor(value: unknown, fallback: string): string {
  const text = String(value || '').trim()
  return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback
}

export function normalizeDyeLabel(value: string): string {
  return String(value || '').replace(/染剂$/u, '').replace(/染劑$/u, '')
}

export function getReadableTextColor(hexColor: string): string {
  const raw = String(hexColor || '').trim().replace(/^#/u, '')
  const expanded = raw.length === 3
    ? raw.split('').map((char) => `${char}${char}`).join('')
    : raw

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    return '#ffffff'
  }

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000
  return luminance > 148 ? '#111111' : '#ffffff'
}

// ---- Text helpers ----

export function measureTextWithTracking(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  const chars = Array.from(text)

  if (!chars.length) {
    return 0
  }

  return chars.reduce((width, char, index) => {
    return width + ctx.measureText(char).width + (index === chars.length - 1 ? 0 : tracking)
  }, 0)
}

export function drawTextWithTracking(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  options: {
    align?: 'left' | 'right'
    maxWidth?: number
  } = {}
) {
  const value = String(text || '')
  const chars = Array.from(value)
  let cursorX = options.align === 'right'
    ? x - measureTextWithTracking(ctx, value, tracking)
    : x

  for (const char of chars) {
    const charWidth = ctx.measureText(char).width

    if (options.maxWidth !== undefined && cursorX + charWidth > x + options.maxWidth) {
      break
    }

    ctx.fillText(char, cursorX, y)
    cursorX += charWidth + tracking
  }
}

// ---- EC helpers ----

export function getEcEquipmentLayout(rowCount: number): EcTemplateLayout {
  if (rowCount > EC_TEMPLATE_LAYOUTS.dense.maxRows) {
    return EC_TEMPLATE_LAYOUTS.compact
  }

  if (rowCount > EC_TEMPLATE_LAYOUTS.normal.maxRows) {
    return EC_TEMPLATE_LAYOUTS.dense
  }

  return EC_TEMPLATE_LAYOUTS.normal
}

export function fitCanvasFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: {
    maxWidth: number
    maxSize: number
    minSize: number
    weight?: number
    family?: string
  }
): number {
  const weight = options.weight || 400
  const family = options.family || '"Source Sans 3", "Microsoft YaHei", sans-serif'
  let size = options.maxSize

  while (size > options.minSize) {
    ctx.font = `${weight} ${size}px ${family}`

    if (ctx.measureText(text).width <= options.maxWidth) {
      break
    }

    size -= 1
  }

  ctx.font = `${weight} ${size}px ${family}`
  return size
}

export function drawEcCenteredFittedText(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  text: string,
  area: { x: number; y: number; width: number; height: number; maxSize: number; minSize: number; tracking?: number },
  options: { color: string; weight?: number; family?: string } = { color: EC_TEMPLATE_COLORS.text }
) {
  const box = templateRect(renderData, area)
  const value = String(text || '').trim()

  if (!value) {
    return
  }

  const maxSize = templateUnit(renderData, area.maxSize)
  const minSize = templateUnit(renderData, area.minSize)
  const tracking = Number(area.tracking || 0)
  const weight = options.weight || 400
  const family = options.family || '"Source Sans 3", "Microsoft YaHei", sans-serif'
  let size = maxSize
  let trackingSize = 0

  while (size >= minSize) {
    ctx.font = `${weight} ${size}px ${family}`
    trackingSize = size * (tracking / 1000)

    if (measureTextWithTracking(ctx, value, trackingSize) <= box.width) {
      break
    }

    size -= 1
  }

  const measuredWidth = measureTextWithTracking(ctx, value, trackingSize)
  ctx.fillStyle = options.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  drawTextWithTracking(
    ctx,
    value,
    box.x + Math.max(0, (box.width - measuredWidth) / 2),
    box.y + box.height / 2,
    trackingSize,
    { maxWidth: box.width }
  )
}

export function drawClippedTextInBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  clipBox: { x: number; y: number; width: number; height: number },
  x: number,
  y: number,
  maxWidth?: number
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(clipBox.x, clipBox.y, clipBox.width, clipBox.height)
  ctx.clip()
  ctx.fillText(text, x, y, maxWidth)
  ctx.restore()
}

export function getTextInkCenterBaseline(ctx: CanvasRenderingContext2D, text: string, centerY: number): number {
  const metrics = ctx.measureText(text || 'Ag')
  const ascent = Number(metrics.actualBoundingBoxAscent || 0)
  const descent = Number(metrics.actualBoundingBoxDescent || 0)
  return ascent || descent ? centerY + (ascent - descent) / 2 : centerY
}

// ---- Risingstones scaling ----

export function getRisingstonesScale(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / 3840) * renderData.canvas.width
}

// ---- Silence Fashion scaling ----

export function getSilenceFashionScale(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / 3000) * renderData.canvas.width
}

export function getSilenceFashionScaleY(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / 3000) * renderData.canvas.height
}

// ---- Shared item name drawing (used by EC and Risingstones) ----

export function drawEcFittedItemName(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  text: string,
  x: number,
  centerY: number,
  maxWidth: number,
  layout: EcFittedItemNameLayout
) {
  fitCanvasFont(ctx, text, {
    maxWidth,
    maxSize: templateUnit(renderData, layout.nameSize),
    minSize: templateUnit(renderData, layout.nameMinSize),
    weight: layout.nameWeight || 700,
    family: layout.fontFamily || '"Source Sans 3", "Microsoft YaHei", sans-serif'
  })
  ctx.textAlign = 'left'
  if (layout.inkCenter) {
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(text, x, getTextInkCenterBaseline(ctx, text, centerY), maxWidth)
    return
  }

  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, centerY, maxWidth)
}

// ---- Shared clear-dye icon (used by EC and Risingstones) ----

export function drawClearDyeIcon(
  ctx: CanvasRenderingContext2D,
  assets: GlamourTemplateLoadedAssetMap | undefined,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  const image = assets?.[CLEAR_DYE_ICON_ASSET]?.image

  if (!image || width <= 0 || height <= 0) {
    return false
  }

  ctx.drawImage(image, x, y, width, height)
  return true
}
