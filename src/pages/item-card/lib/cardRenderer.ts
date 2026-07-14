import {
  buildGlamourIconUrl,
  getCandidateDyeCount,
  getCandidateName,
  getDisplayDyeEntries,
  getDyeEntryName,
  getSelectedCandidate,
  isNoDyeEntry,
  resolveLocalized
} from '@/pages/item-card/lib/equipment'
import { getItemCardLocaleStyle } from '@/pages/item-card/lib/cardSettings'
import type {
  GlamourDraft,
  GlamourEquipmentEntry,
  GlamourLocale,
  ItemCardLayout,
  ItemCardLocaleStyle,
  ItemCardRenderSettings
} from '@/pages/item-card/lib/types'

export const ITEM_CARD_WIDTH = 560
export const ITEM_CARD_HEIGHT = 108
export const ITEM_CARD_SCALE = 2
export const ITEM_CARD_ICON_SIZE = 84
export const ITEM_CARD_COMPACT_HEIGHT = 72
export const ITEM_CARD_COMPACT_ICON_SIZE = 56
const ICON_RADIUS = 10
const LIST_ROW_GAP = 4
const COMPACT_LIST_ROW_GAP = 2
const MULTILINGUAL_FULL_CARD_PADDING = 32
const MULTILINGUAL_MIN_DYE_GAP = 8
const ITEM_CARD_RARITY_COLORS: Record<number, string> = {
  1: '#e8e8e8',
  2: '#c4ffc8',
  3: '#5c93ff',
  4: '#b78aff',
  7: '#e08abd'
}

interface ItemCardMetrics {
  height: number
  iconSize: number
  iconRadius: number
  listRowGap: number
}

interface ItemCardDyeRow {
  name: string
  color: string
  empty: boolean
}

export interface ItemCardRenderRequest {
  entry: GlamourEquipmentEntry
  draft: GlamourDraft
  settings: ItemCardRenderSettings
  layout: ItemCardLayout
  apiBase: string
}

export interface ItemCardListRenderRequest {
  entries: GlamourEquipmentEntry[]
  draft: GlamourDraft
  settings: ItemCardRenderSettings
  layout: ItemCardLayout
  apiBase: string
}

const imageCache = new Map<string, Promise<HTMLImageElement | null>>()
const UNDYEABLE: Record<string, string> = {
  zh: '不可染色',
  ja: '染色不可',
  en: 'Undyeable',
  ko: '염색 불가',
  tc: '不可染色',
  fr: 'Non teignable',
  de: 'Nicht färbbar'
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width * ITEM_CARD_SCALE
  canvas.height = height * ITEM_CARD_SCALE
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  return canvas
}

function fontStack(fontFamily: string): string {
  return `"${fontFamily}", "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif`
}

function titleFont(style: ItemCardLocaleStyle): string {
  return `${style.titleWeight} ${style.titleSize}px ${fontStack(style.fontFamily)}`
}

function dyeFont(style: ItemCardLocaleStyle): string {
  return `700 ${style.dyeSize}px ${fontStack(style.fontFamily)}`
}

function titleLineHeight(style: ItemCardLocaleStyle): number {
  return Math.max(10, Math.round(style.titleSize * 1.12))
}

function itemNameColor(request: ItemCardRenderRequest): string {
  if (!request.settings.rarityColorEnabled) {
    return request.settings.fontColor
  }
  const rarity = Number(getSelectedCandidate(request.entry)?.rarity || 1)
  return ITEM_CARD_RARITY_COLORS[rarity] || ITEM_CARD_RARITY_COLORS[1]
}

function dyeLineHeight(style: ItemCardLocaleStyle): number {
  return Math.max(14, Math.round(style.dyeSize * 1.55))
}

function multilingualDyeGap(settings: ItemCardRenderSettings, style: ItemCardLocaleStyle): number {
  return Math.max(
    MULTILINGUAL_MIN_DYE_GAP,
    settings.dyeOffsetY - settings.titleOffsetY - titleLineHeight(style)
  )
}

function getItemCardMetrics(settings: ItemCardRenderSettings): ItemCardMetrics {
  if (settings.mode !== 'compact') {
    const styles = settings.outputLocales.map((locale) => getItemCardLocaleStyle(settings, locale))
    const titleBlockHeight = styles.reduce((height, style) => height + titleLineHeight(style), 0)
    const dyeBlockHeight = styles.reduce((height, style) => height + dyeLineHeight(style), 0)
    const height =
      styles.length > 1
        ? Math.max(
            ITEM_CARD_HEIGHT,
            titleBlockHeight +
              dyeBlockHeight +
              multilingualDyeGap(settings, styles[0]) +
              MULTILINGUAL_FULL_CARD_PADDING
          )
        : ITEM_CARD_HEIGHT

    return {
      height,
      iconSize: ITEM_CARD_ICON_SIZE,
      iconRadius: ICON_RADIUS,
      listRowGap: LIST_ROW_GAP
    }
  }

  const contentHeight = settings.outputLocales.reduce((height, locale) => {
    const style = getItemCardLocaleStyle(settings, locale)
    return height + titleLineHeight(style)
  }, 0)

  return {
    height: Math.max(ITEM_CARD_COMPACT_HEIGHT, contentHeight + 12),
    iconSize: ITEM_CARD_COMPACT_ICON_SIZE,
    iconRadius: 7,
    listRowGap: COMPACT_LIST_ROW_GAP
  }
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
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

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text
  }
  let left = 0
  let right = text.length
  while (left < right) {
    const middle = Math.ceil((left + right) / 2)
    if (ctx.measureText(`${text.slice(0, middle)}...`).width <= maxWidth) {
      left = middle
    } else {
      right = middle - 1
    }
  }
  return `${text.slice(0, left)}...`
}

function applyStroke(
  ctx: CanvasRenderingContext2D,
  settings: ItemCardRenderSettings,
  fontSize: number
) {
  if (!settings.strokeEnabled) {
    ctx.lineWidth = 0
    return
  }
  ctx.strokeStyle = settings.strokeColor
  ctx.lineWidth = Math.max(0, fontSize * settings.strokeRatio)
  ctx.lineJoin = 'round'
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  align: CanvasTextAlign,
  settings: ItemCardRenderSettings
) {
  const fitted = fitText(ctx, text, maxWidth)
  ctx.textAlign = align
  if (settings.strokeEnabled && ctx.lineWidth > 0) {
    ctx.strokeText(fitted, x, y)
  }
  ctx.fillText(fitted, x, y)
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) {
    return null
  }
  if (!imageCache.has(url)) {
    imageCache.set(
      url,
      new Promise((resolve) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.referrerPolicy = 'no-referrer'
        image.onload = () => resolve(image)
        image.onerror = () => resolve(null)
        image.src = url
      })
    )
  }
  return imageCache.get(url) ?? null
}

async function ensureFonts(settings: ItemCardRenderSettings) {
  if (!document.fonts?.load) {
    return
  }
  try {
    await Promise.all(
      settings.outputLocales.flatMap((locale) => {
        const style = getItemCardLocaleStyle(settings, locale)
        return [document.fonts.load(titleFont(style)), document.fonts.load(dyeFont(style))]
      })
    )
  } catch {
    // A missing local font falls back to the browser font stack.
  }
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  size: number,
  radius: number,
  contain = false
) {
  roundedPath(ctx, x, y, size, size, radius)
  ctx.save()
  ctx.clip()
  if (image) {
    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    if (contain) {
      const scale = Math.min(size / width, size / height)
      const drawWidth = width * scale
      const drawHeight = height * scale
      ctx.drawImage(
        image,
        x + (size - drawWidth) / 2,
        y + (size - drawHeight) / 2,
        drawWidth,
        drawHeight
      )
    } else {
      const cropSize = Math.min(width, height)
      ctx.drawImage(
        image,
        (width - cropSize) / 2,
        (height - cropSize) / 2,
        cropSize,
        cropSize,
        x,
        y,
        size,
        size
      )
    }
  }
  ctx.restore()
}

function dyeRows(request: ItemCardRenderRequest, locale: GlamourLocale): ItemCardDyeRow[] {
  const candidate = getSelectedCandidate(request.entry)
  const count = getCandidateDyeCount(candidate, request.entry.slot)
  if (count <= 0) {
    const text =
      resolveLocalized(candidate?.dye_display_by_locale, locale) ||
      String(candidate?.dye_display || '') ||
      UNDYEABLE[locale] ||
      UNDYEABLE.zh
    return text ? [{ name: text, color: 'transparent', empty: true }] : []
  }
  return getDisplayDyeEntries(candidate, request.entry.slot, request.draft.noDyeLabels, locale).map(
    (entry) => ({
      name: getDyeEntryName(entry, request.draft.noDyeLabels, locale),
      color: String(entry.hex || 'transparent'),
      empty: isNoDyeEntry(entry)
    })
  )
}

function drawDyes(
  ctx: CanvasRenderingContext2D,
  request: ItemCardRenderRequest,
  locale: GlamourLocale,
  style: ItemCardLocaleStyle,
  left: number,
  right: number,
  y: number,
  align: CanvasTextAlign
) {
  const dyes = dyeRows(request, locale)
  if (!dyes.length) {
    return
  }
  ctx.font = dyeFont(style)
  ctx.textBaseline = 'middle'
  const radius = Math.max(4, Math.round(style.dyeSize * 0.42))
  const gap = Math.max(6, Math.round(style.dyeSize * 0.5))
  const available = Math.max(1, right - left)
  const widths = dyes.map((dye) => radius * 2 + 8 + ctx.measureText(dye.name).width)
  const rawWidth = widths.reduce((sum, width) => sum + width, 0) + gap * (dyes.length - 1)
  const scale = rawWidth > available ? available / rawWidth : 1
  let x = align === 'right' ? right - rawWidth * scale : left
  const centerY = y + dyeLineHeight(style) / 2

  dyes.forEach((dye, index) => {
    const width = widths[index] * scale
    const circleX = align === 'right' ? x + width - radius : x + radius
    ctx.beginPath()
    ctx.arc(circleX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = dye.empty ? 'rgba(255,255,255,0.14)' : dye.color
    ctx.fill()
    ctx.strokeStyle = 'rgba(15,23,42,0.32)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = request.settings.fontColor
    applyStroke(ctx, request.settings, style.dyeSize)
    const textX = align === 'right' ? circleX - radius - 8 : circleX + radius + 8
    drawText(
      ctx,
      dye.name,
      textX,
      centerY,
      Math.max(1, width - radius * 2 - 8),
      align,
      request.settings
    )
    x += width + gap * scale
  })
}

function drawMultilingualDyes(
  ctx: CanvasRenderingContext2D,
  request: ItemCardRenderRequest,
  localeStyles: Array<{ locale: GlamourLocale; style: ItemCardLocaleStyle }>,
  left: number,
  right: number,
  y: number,
  align: CanvasTextAlign
) {
  const dyesByLocale = localeStyles.map(({ locale }) => dyeRows(request, locale))
  const sharedDyes = dyesByLocale[0] || []
  if (!sharedDyes.length) {
    return
  }

  const totalHeight = localeStyles.reduce((height, item) => height + dyeLineHeight(item.style), 0)
  const radius = Math.max(4, ...localeStyles.map((item) => Math.round(item.style.dyeSize * 0.42)))
  const columnGap = Math.max(12, radius * 2)
  const available = Math.max(1, right - left)
  const columnWidth = Math.max(
    1,
    (available - columnGap * (sharedDyes.length - 1)) / sharedDyes.length
  )
  const circleY = y + totalHeight / 2

  sharedDyes.forEach((sharedDye, dyeIndex) => {
    const columnLeft = left + dyeIndex * (columnWidth + columnGap)
    const columnRight = columnLeft + columnWidth
    const circleX = align === 'right' ? columnRight - radius : columnLeft + radius

    ctx.beginPath()
    ctx.arc(circleX, circleY, radius, 0, Math.PI * 2)
    ctx.fillStyle = sharedDye.empty ? 'rgba(255,255,255,0.14)' : sharedDye.color
    ctx.fill()
    ctx.strokeStyle = 'rgba(15,23,42,0.32)'
    ctx.lineWidth = 1
    ctx.stroke()

    let rowY = y
    localeStyles.forEach(({ style }, localeIndex) => {
      const dye = dyesByLocale[localeIndex]?.[dyeIndex] || sharedDye
      ctx.font = dyeFont(style)
      ctx.textBaseline = 'middle'
      ctx.fillStyle = request.settings.fontColor
      applyStroke(ctx, request.settings, style.dyeSize)
      const textX = align === 'right' ? circleX - radius - 8 : circleX + radius + 8
      drawText(
        ctx,
        dye.name,
        textX,
        rowY + dyeLineHeight(style) / 2,
        Math.max(1, columnWidth - radius * 2 - 8),
        align,
        request.settings
      )
      rowY += dyeLineHeight(style)
    })
  })
}

export async function renderItemCardCanvas(
  request: ItemCardRenderRequest
): Promise<HTMLCanvasElement> {
  await ensureFonts(request.settings)
  const metrics = getItemCardMetrics(request.settings)
  const canvas = createCanvas(ITEM_CARD_WIDTH, metrics.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return canvas
  }
  ctx.scale(ITEM_CARD_SCALE, ITEM_CARD_SCALE)
  const iconY = Math.round((metrics.height - metrics.iconSize) / 2)
  const iconX = request.layout === 'right' ? ITEM_CARD_WIDTH - metrics.iconSize : 0
  const anchor = request.layout === 'right' ? iconX : iconX + metrics.iconSize
  const direction = request.layout === 'right' ? -1 : 1
  const align: CanvasTextAlign = request.layout === 'right' ? 'right' : 'left'
  const offsetScale = request.settings.mode === 'compact' ? 2 / 3 : 1
  const titleX = anchor + direction * Math.round(request.settings.titleOffsetX * offsetScale)
  const dyeX = anchor + direction * Math.round(request.settings.dyeOffsetX * offsetScale)
  const titleLeft = request.layout === 'right' ? 0 : titleX
  const titleRight = request.layout === 'right' ? titleX : ITEM_CARD_WIDTH
  const dyeLeft = request.layout === 'right' ? 0 : dyeX
  const dyeRight = request.layout === 'right' ? dyeX : ITEM_CARD_WIDTH
  const candidate = getSelectedCandidate(request.entry)
  const image = await loadImage(buildGlamourIconUrl(request.apiBase, candidate?.icon))
  const localeStyles = request.settings.outputLocales.map((locale) => ({
    locale,
    style: getItemCardLocaleStyle(request.settings, locale)
  }))

  drawIcon(
    ctx,
    image,
    iconX,
    iconY,
    metrics.iconSize,
    metrics.iconRadius,
    request.settings.mode === 'compact'
  )
  const titleBlockHeight = localeStyles.reduce(
    (height, item) => height + titleLineHeight(item.style),
    0
  )
  const compact = request.settings.mode === 'compact'
  const multilingualFull = !compact && localeStyles.length > 1
  const dyeBlockHeight = multilingualFull
    ? localeStyles.reduce((height, item) => height + dyeLineHeight(item.style), 0)
    : 0
  const dyeGap = multilingualFull ? multilingualDyeGap(request.settings, localeStyles[0].style) : 0
  const multilingualContentHeight = titleBlockHeight + dyeBlockHeight + dyeGap
  let titleY = compact
    ? Math.round((metrics.height - titleBlockHeight) / 2)
    : multilingualFull
      ? Math.round((metrics.height - multilingualContentHeight) / 2) + request.settings.titleOffsetY
      : iconY + request.settings.titleOffsetY
  let dyeY = multilingualFull
    ? titleY + titleBlockHeight + dyeGap
    : iconY + request.settings.dyeOffsetY
  for (const { locale, style } of localeStyles) {
    ctx.font = titleFont(style)
    ctx.textBaseline = 'top'
    ctx.fillStyle = itemNameColor(request)
    applyStroke(ctx, request.settings, style.titleSize)
    drawText(
      ctx,
      getCandidateName(candidate, locale, request.draft.source.locale),
      titleX,
      titleY,
      Math.max(1, titleRight - titleLeft),
      align,
      request.settings
    )
    if (!compact && !multilingualFull) {
      drawDyes(ctx, request, locale, style, dyeLeft, dyeRight, dyeY, align)
    }
    titleY += titleLineHeight(style)
    if (!compact && !multilingualFull) {
      dyeY += dyeLineHeight(style)
    }
  }
  if (multilingualFull) {
    drawMultilingualDyes(ctx, request, localeStyles, dyeLeft, dyeRight, dyeY, align)
  }
  return canvas
}

export async function renderItemListCanvas(
  request: ItemCardListRenderRequest
): Promise<HTMLCanvasElement> {
  const metrics = getItemCardMetrics(request.settings)
  const height =
    request.entries.length * metrics.height +
    Math.max(0, request.entries.length - 1) * metrics.listRowGap
  const canvas = createCanvas(ITEM_CARD_WIDTH, Math.max(1, height))
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return canvas
  }

  let y = 0
  for (const entry of request.entries) {
    const row = await renderItemCardCanvas({
      entry,
      draft: request.draft,
      settings: request.settings,
      layout: request.layout,
      apiBase: request.apiBase
    })
    ctx.drawImage(row, 0, y)
    y += (metrics.height + metrics.listRowGap) * ITEM_CARD_SCALE
  }
  return canvas
}

export function makeItemCardFileName(
  entry: GlamourEquipmentEntry,
  draft: GlamourDraft,
  index = 0
): string {
  const name = getCandidateName(getSelectedCandidate(entry), draft.locale, draft.source.locale)
  const safe = name.replace(/[\\/:*?"<>|]+/g, '_').trim() || `item-${index + 1}`
  return `${String(index + 1).padStart(2, '0')}-${safe}.png`
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))),
      'image/png'
    )
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
