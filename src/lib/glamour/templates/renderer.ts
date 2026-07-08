import type { GlamourTemplateLoadedAssetMap } from '@/lib/glamour/templates/assets'
import type { GlamourTemplateRenderData } from '@/lib/glamour/templates/renderData'
import type { GlamourTemplateRow } from '@/lib/glamour/templates/rows'
import {
  GLAMOUR_TEMPLATE_DEFAULT_IMAGE_SLOT_ID,
  GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID,
  GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID
} from '@/lib/glamour/templates/definitions'

export interface GlamourTemplateCanvasImage {
  image: HTMLImageElement
}

export type GlamourTemplateImageResolver = (slotId: string) => GlamourTemplateCanvasImage | null
export type GlamourTemplateIconResolver = (iconId: number | string | undefined) => GlamourTemplateCanvasImage | null

export interface GlamourTemplateCanvasRenderContext {
  renderData: GlamourTemplateRenderData
  resolveImage: GlamourTemplateImageResolver
  resolveIcon?: GlamourTemplateIconResolver
  assets?: GlamourTemplateLoadedAssetMap
}

const EC_TEMPLATE_SOURCE_SIZE = 3840
const EC_TEMPLATE_COLORS = {
  background: '#ffffff',
  accent: '#2f343b',
  text: '#2f343b',
  textDim: '#b8b1ac',
  line: '#303030',
  placeholder: '#ffffff',
  row: '#f0f1f3',
  rowDeep: '#dfe2e6'
}
const EC_ITEM_RARITY_COLORS: Record<number, string> = {
  1: '#e8e8e8',
  2: '#c4ffc8',
  3: '#5c93ff',
  4: '#b78aff',
  7: '#e08abd'
}
const EC_TEMPLATE_TITLE = { x: 1010, y: 298, width: 1830, height: 185, maxSize: 178, minSize: 86, tracking: -20 }
const EC_TEMPLATE_SUBTITLE = { x: 1413, y: 522, width: 1028, height: 77, maxSize: 66, minSize: 34 }
const EC_TEMPLATE_EQUIPMENT_HEADER = {
  label: { x: 2022, y: 696, width: 320, height: 50 },
  line: { x: 2264, y: 714, width: 1364, height: 9 },
  labelSize: 44,
  labelLineGap: 34
}
const EC_TEMPLATE_COPYRIGHT = {
  x: 1110,
  y: 3584,
  width: 1606,
  height: 93,
  titleSize: 40,
  textSize: 36,
  lineY: [23, 68]
}
const EC_TEMPLATE_CORNER_MARKS = [
  { x: 99, y: 45, size: 104 },
  { x: 3639, y: 3692, size: 104 }
]
const EORZEA_TEMPLATE = {
  sourceSize: 3840,
  maskFill: '#ffffff',
  textColor: '#252525',
  titleMask: { x: 3180, y: 838, width: 520, height: 145 },
  titleText: { right: 3690, baselineY: 908, width: 520, maxSize: 130, minSize: 72 },
  titleTracking: -177,
  itemNameTracking: -50,
  layouts: {
    roomy: {
      rowY: [1797, 2125, 2453, 2781, 3109],
      nameX: 2877,
      nameWidth: 810,
      nameSize: 74,
      lineHeight: 88,
      dyeX: [3009, 3359],
      dyeYOffset: 95,
      dyeWidth: 332,
      dyeHeight: 56,
      dyeRadius: 9,
      dyeTextWidth: 226,
      dyeTextXOffset: 69,
      dyeTextYOffset: 12,
      dyeFontSize: 32
    },
    sixRows: {
      rowY: [1706, 2008, 2310, 2613, 2915, 3217],
      nameX: 2877,
      nameWidth: 810,
      nameSize: 74,
      lineHeight: 88,
      dyeX: [3009, 3359],
      dyeYOffset: 95,
      dyeWidth: 332,
      dyeHeight: 56,
      dyeRadius: 9,
      dyeTextWidth: 226,
      dyeTextXOffset: 69,
      dyeTextYOffset: 12,
      dyeFontSize: 32
    },
    compact: {
      rowY: [1689, 1948, 2206, 2465, 2723, 2981, 3240],
      nameX: 2952,
      nameWidth: 731,
      nameSize: 67,
      lineHeight: 80,
      dyeX: [3071, 3387],
      dyeYOffset: 86,
      dyeWidth: 299,
      dyeHeight: 51,
      dyeRadius: 8,
      dyeTextWidth: 204,
      dyeTextXOffset: 63,
      dyeTextYOffset: 10,
      dyeFontSize: 32
    }
  }
}
const DOUBLE_PIC_TEMPLATE = {
  sourceWidth: 2968,
  sourceHeight: 3958,
  background: '#fefefe',
  frameBlack: '#000000',
  frameWhite: '#f8f8f8',
  fontWeight: 900,
  fontFamily: '"Source Han Serif CN", "Noto Serif CJK SC", "Microsoft YaHei", serif',
  equipment: {
    x: 1469,
    y: 3115,
    width: 1098,
    height: 676,
    maxFontSize: 62,
    lineHeightRatio: 1.54,
    underlineOffsetRatio: 1.13,
    underlineWidth: 4,
    outerGlowColor: '#000000',
    outerGlowOpacity: 0.62,
    outerGlowSpread: 0.19,
    outerGlowSize: 24
  },
  copyright: {
    text: '©SQUARE ENIX',
    rect: { x: 1090, y: 3868, width: 758, height: 72 },
    maxFontSize: 48,
    minFontSize: 36
  }
}
const EC_TEMPLATE_LAYOUTS = {
  normal: {
    maxRows: 6,
    rowY: [802, 1065, 1328, 1591, 1854, 2117],
    rowX: 2017,
    rowWidth: 1625,
    rowHeight: 246,
    rowRadius: 34,
    iconX: 2036,
    iconYOffset: 23,
    iconSize: 200,
    iconRadius: 16,
    nameX: 2288,
    nameWidth: 1320,
    nameHeight: 68,
    nameSize: 64,
    nameMinSize: 48,
    nameWeight: 700,
    dyeYOffset: 127,
    dyeHeight: 88,
    dyeRadius: 38,
    dyeFontSize: 41,
    dyeDotSize: 39,
    dyeDotXOffset: 36,
    dyeTextXOffset: 95,
    dyeTextYOffset: 21,
    dyeGap: 34,
    dyes: [
      { x: 2288, minWidth: 256 },
      { x: 2612, minWidth: 286 }
    ]
  },
  dense: {
    maxRows: 10,
    rowY: [780, 1016, 1252, 1488, 1724, 1960, 2196, 2432, 2668, 2904],
    rowX: 2017,
    rowWidth: 1625,
    rowHeight: 216,
    rowRadius: 30,
    iconX: 2034,
    iconYOffset: 20,
    iconSize: 176,
    iconRadius: 14,
    nameX: 2255,
    nameWidth: 1360,
    nameHeight: 60,
    nameSize: 56,
    nameMinSize: 42,
    nameWeight: 700,
    dyeYOffset: 112,
    dyeHeight: 77,
    dyeRadius: 33,
    dyeFontSize: 36,
    dyeDotSize: 34,
    dyeDotXOffset: 32,
    dyeTextXOffset: 84,
    dyeTextYOffset: 18,
    dyeGap: 34,
    dyes: [
      { x: 2255, minWidth: 256 },
      { x: 2612, minWidth: 286 }
    ]
  },
  compact: {
    maxRows: 14,
    rowY: [760, 948, 1136, 1324, 1512, 1700, 1888, 2076, 2264, 2452, 2640, 2828, 3016, 3204],
    rowX: 2017,
    rowWidth: 1625,
    rowHeight: 185,
    rowRadius: 26,
    iconX: 2032,
    iconYOffset: 18,
    iconSize: 150,
    iconRadius: 13,
    nameX: 2219,
    nameWidth: 1390,
    nameHeight: 56,
    nameSize: 49,
    nameMinSize: 36,
    nameWeight: 700,
    dyeYOffset: 96,
    dyeHeight: 67,
    dyeRadius: 29,
    dyeFontSize: 31,
    dyeDotSize: 30,
    dyeDotXOffset: 28,
    dyeTextXOffset: 72,
    dyeTextYOffset: 16,
    dyeGap: 34,
    dyes: [
      { x: 2219, minWidth: 256 },
      { x: 2612, minWidth: 286 }
    ]
  }
}
const RISINGSTONES_TEMPLATE = {
  sourceSize: 3840,
  background: '#ffffff',
  backgroundStrokeWidth: 5,
  borderColor: '#555555',
  imageRegion: { x: 148, y: 243, width: 1915, height: 3402 },
  imageRadius: 44,
  imagePlaceholder: '#a3a3a3',
  avatarRegion: { x: 3280, y: 323, width: 389, height: 390 },
  title: { x: 2129, y: 333, width: 1010, height: 144, maxSize: 150, minSize: 72 },
  author: { x: 2145, y: 552, width: 451, height: 61, maxSize: 60, minSize: 34 },
  source: { x: 2145, y: 641, width: 1060, height: 57, maxSize: 60, minSize: 32 },
  sourceText: '最终幻想14 - FINAL FANTASY XIV',
  equipment: {
    maxRows: 10,
    rowStartY: 831,
    rowStep: 297,
    rowBottom: 3535,
    rowX: 2113,
    rowWidth: 1568,
    rowHeight: 247,
    iconX: 2132,
    iconYOffset: 23,
    iconSize: 200,
    iconRadius: 14,
    nameX: 2379,
    nameWidth: 700,
    nameYOffset: 44,
    nameHeight: 75,
    nameSize: 72,
    nameMinSize: 40,
    dyeYOffset: 135,
    dyeHeight: 72,
    dyeFontSize: 52,
    dyeDotSize: 51,
    dyeDotRadius: 10,
    dyeDotStrokeWidth: 1,
    dyeDotXOffset: 12,
    dyeTextXOffset: 77,
    dyeTextYOffset: 145,
    dyeTextHeight: 52,
    dyeTextRightPadding: 12,
    dyeGap: 30,
    dyes: [
      { x: 2374, minWidth: 287 },
      { x: 2691, minWidth: 287 }
    ]
  },
  textColor: '#2d2d2d',
  accent: '#c3a769',
  dyeText: '#2d2d2d',
  copyright: {
    x: 2275,
    y: 3535,
    width: 1215,
    height: 110,
    lines: ['ff14risingstones - 石之家 X 光之收藏家']
  }
}
const SILENCE_FASHION_TEMPLATE = {
  sourceSize: 3000,
  textColor: '#161616',
  serifFamily: '"Source Han Serif CN", "Noto Serif CJK KR", "Noto Serif KR", Batang, "Malgun Gothic", "Songti SC", SimSun, serif',
  koSerifFamily: '"Source Han Serif KR Local", "Noto Serif CJK KR", "Noto Serif KR", Batang, AppleMyungjo, "Source Han Serif CN", "Malgun Gothic", serif',
  equipmentBottom: 2650,
  equipmentRight: 2760,
  imageRegion: { x: 171, y: 126, width: 1545, height: 2748 },
  avatarRegion: { x: 2434, y: 179, width: 318, height: 318 },
  character: { x: 1773, y: 209, width: 640, size: 48, minSize: 28, weight: 400 },
  title: { x: 1778, y: 288, width: 760, size: 58, minSize: 32, weight: 500 },
  zh: {
    maxRows: 99,
    itemX: 1788,
    dyeX: 1788,
    width: 620,
    y: 725,
    bottom: 2650,
    rowStep: 160,
    itemSize: 60,
    dyeSize: 48,
    itemLineHeight: 72,
    dyeLineHeight: 58,
    groupGap: 42,
    weight: 600,
    dyeYOffset: 50
  },
  enJa: {
    maxRows: 99,
    itemX: 1787,
    dyeX: 1785,
    width: 760,
    y: 726,
    bottom: 2650,
    rowStep: 245,
    jaSize: 45,
    enSize: 45,
    dyeSize: 36,
    jaLineHeight: 54,
    enLineHeight: 54,
    dyeLineHeight: 43,
    lineGap: 8,
    groupGap: 66,
    weight: 600
  }
}
const HORIZONTAL_TEMPLATE = {
  sourceWidth: 4846,
  sourceHeight: 3635,
  textColor: '#383838',
  lineColors: ['#d4d4d2', '#cdcdcd'],
  equipmentText: {
    x: 178,
    y: 1092,
    width: 1648,
    height: 2184,
    itemSize: 86,
    dyeSize: 56,
    itemLineHeight: 90,
    dyeLineHeight: 68,
    itemInkHeight: 70,
    dyeInkHeight: 44,
    topPadding: 22,
    groupGap: 80
  },
  title: {
    x: 163,
    y: 897,
    width: 311,
    height: 92,
    size: 100,
    clipBleedTop: 18,
    clipBleedBottom: 24
  },
  titleLine: {
    x: 162,
    y: 1040,
    width: 1629,
    height: 4
  },
  contentGroup: {
    top: 830,
    bottom: 3436,
    titleToLine: 1040 - 897,
    titleToEquipment: 1092 - 897
  }
}

type EcTemplateLayout = typeof EC_TEMPLATE_LAYOUTS.normal
type EorzeaTemplateLayout = typeof EORZEA_TEMPLATE.layouts.roomy
type RisingstonesEquipmentLayout = typeof RISINGSTONES_TEMPLATE.equipment
type HorizontalEquipmentRow = {
  itemName: string
  hasDyeLine: boolean
  dyeText: string
}

const glamourTemplateLuminanceMaskCache = new Map<string, HTMLCanvasElement>()

function templateUnit(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / EC_TEMPLATE_SOURCE_SIZE) * renderData.canvas.width
}

function templateRect(renderData: GlamourTemplateRenderData, rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: templateUnit(renderData, rect.x),
    y: templateUnit(renderData, rect.y),
    width: templateUnit(renderData, rect.width),
    height: templateUnit(renderData, rect.height)
  }
}

function horizontalUnit(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / HORIZONTAL_TEMPLATE.sourceWidth) * renderData.canvas.width
}

function horizontalUnitY(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / HORIZONTAL_TEMPLATE.sourceHeight) * renderData.canvas.height
}

function horizontalRect(renderData: GlamourTemplateRenderData, rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: horizontalUnit(renderData, rect.x),
    y: horizontalUnitY(renderData, rect.y),
    width: horizontalUnit(renderData, rect.width),
    height: horizontalUnitY(renderData, rect.height)
  }
}

function doublePicUnit(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / DOUBLE_PIC_TEMPLATE.sourceWidth) * renderData.canvas.width
}

function doublePicUnitY(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / DOUBLE_PIC_TEMPLATE.sourceHeight) * renderData.canvas.height
}

function doublePicRect(renderData: GlamourTemplateRenderData, rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: doublePicUnit(renderData, rect.x),
    y: doublePicUnitY(renderData, rect.y),
    width: doublePicUnit(renderData, rect.width),
    height: doublePicUnitY(renderData, rect.height)
  }
}

function makeRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
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

function fillRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  makeRoundedRectPath(ctx, x, y, width, height, radius)
  ctx.fill()
}

function colorWithAlpha(color: string, alpha: number): string {
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

function normalizeHexColor(value: unknown, fallback: string): string {
  const text = String(value || '').trim()
  return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback
}

function normalizeDyeLabel(value: string): string {
  return String(value || '').replace(/染剂$/u, '').replace(/染劑$/u, '')
}

function getReadableTextColor(hexColor: string): string {
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

function measureTextWithTracking(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  const chars = Array.from(text)

  if (!chars.length) {
    return 0
  }

  return chars.reduce((width, char, index) => {
    return width + ctx.measureText(char).width + (index === chars.length - 1 ? 0 : tracking)
  }, 0)
}

function drawTextWithTracking(
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

function getEcEquipmentLayout(rowCount: number): EcTemplateLayout {
  if (rowCount > EC_TEMPLATE_LAYOUTS.dense.maxRows) {
    return EC_TEMPLATE_LAYOUTS.compact
  }

  if (rowCount > EC_TEMPLATE_LAYOUTS.normal.maxRows) {
    return EC_TEMPLATE_LAYOUTS.dense
  }

  return EC_TEMPLATE_LAYOUTS.normal
}

function fitCanvasFont(
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

function drawEcCenteredFittedText(
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

function drawEcCornerMark(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  mark: { x: number; y: number; size: number },
  rotate = false
) {
  const box = templateRect(renderData, { x: mark.x, y: mark.y, width: mark.size, height: mark.size })
  const radius = templateUnit(renderData, 17)
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2

  ctx.save()
  ctx.translate(centerX, centerY)

  if (rotate) {
    ctx.rotate(Math.PI)
  }

  ctx.translate(-centerX, -centerY)
  ctx.fillStyle = EC_TEMPLATE_COLORS.accent
  fillRoundedRect(ctx, box.x, box.y, box.width, box.height, radius)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(centerX, box.y + templateUnit(renderData, 18))
  ctx.lineTo(box.x + box.width - templateUnit(renderData, 18), centerY)
  ctx.lineTo(centerX, box.y + box.height - templateUnit(renderData, 18))
  ctx.lineTo(box.x + templateUnit(renderData, 18), centerY)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = EC_TEMPLATE_COLORS.accent
  ctx.beginPath()
  ctx.moveTo(centerX, box.y + templateUnit(renderData, 30))
  ctx.lineTo(centerX + templateUnit(renderData, 24), centerY)
  ctx.lineTo(centerX, box.y + box.height - templateUnit(renderData, 30))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawEcFrame(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  const lineHeight = Math.max(1, templateUnit(renderData, 8))
  const bottomMark = EC_TEMPLATE_CORNER_MARKS[1]
  const bottomLineY = templateUnit(renderData, bottomMark.y + bottomMark.size / 2) - lineHeight / 2

  ctx.fillStyle = EC_TEMPLATE_COLORS.background
  ctx.fillRect(0, 0, renderData.canvas.width, renderData.canvas.height)
  ctx.fillStyle = EC_TEMPLATE_COLORS.accent
  ctx.fillRect(0, templateUnit(renderData, 91), renderData.canvas.width, lineHeight)
  ctx.fillRect(0, bottomLineY, renderData.canvas.width, lineHeight)
  drawEcCornerMark(ctx, renderData, EC_TEMPLATE_CORNER_MARKS[0], false)
  drawEcCornerMark(ctx, renderData, EC_TEMPLATE_CORNER_MARKS[1], true)
}

function drawEcMainImage(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  resolveImage: GlamourTemplateImageResolver
) {
  const slot = renderData.canvas.imageSlots[0]
  const image = slot ? resolveImage(slot.id) : null

  if (!slot) {
    return
  }

  ctx.fillStyle = EC_TEMPLATE_COLORS.placeholder
  ctx.fillRect(slot.region.x, slot.region.y, slot.region.width, slot.region.height)

  if (image) {
    drawGlamourTemplateImageCover(ctx, image.image, slot.region.x, slot.region.y, slot.region.width, slot.region.height)
  }
}

function drawEcHeader(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  drawEcCenteredFittedText(ctx, renderData, renderData.text.title || renderData.profile.defaultTopText, EC_TEMPLATE_TITLE, {
    color: EC_TEMPLATE_COLORS.accent,
    weight: 400,
    family: '"Josefin Sans", "Microsoft YaHei", sans-serif'
  })
  drawEcCenteredFittedText(ctx, renderData, renderData.text.subtitle, EC_TEMPLATE_SUBTITLE, {
    color: EC_TEMPLATE_COLORS.text,
    weight: 400,
    family: '"Source Sans 3", "Microsoft YaHei", sans-serif'
  })

  const labelBox = templateRect(renderData, EC_TEMPLATE_EQUIPMENT_HEADER.label)
  ctx.fillStyle = EC_TEMPLATE_COLORS.accent
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = `700 ${templateUnit(renderData, EC_TEMPLATE_EQUIPMENT_HEADER.labelSize)}px "Source Sans 3", sans-serif`
  ctx.fillText('EQUIPMENT', labelBox.x, labelBox.y, labelBox.width)

  const lineBox = templateRect(renderData, EC_TEMPLATE_EQUIPMENT_HEADER.line)
  const lineGap = templateUnit(renderData, EC_TEMPLATE_EQUIPMENT_HEADER.labelLineGap)
  const dynamicLineX = Math.max(lineBox.x, labelBox.x + ctx.measureText('EQUIPMENT').width + lineGap)
  const dynamicLineWidth = Math.max(0, lineBox.x + lineBox.width - dynamicLineX)
  ctx.fillStyle = EC_TEMPLATE_COLORS.line
  fillRoundedRect(ctx, dynamicLineX, lineBox.y, dynamicLineWidth, Math.max(1, lineBox.height), lineBox.height / 2)
}

function drawEcIcon(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  layout: EcTemplateLayout,
  rowY: number,
  image: HTMLImageElement | null
) {
  const iconX = templateUnit(renderData, layout.iconX)
  const iconY = templateUnit(renderData, rowY + layout.iconYOffset)
  const iconSize = templateUnit(renderData, layout.iconSize)
  const iconRadius = templateUnit(renderData, layout.iconRadius)

  ctx.save()
  makeRoundedRectPath(ctx, iconX, iconY, iconSize, iconSize, iconRadius)
  ctx.clip()
  ctx.fillStyle = '#1f1f1f'
  ctx.fillRect(iconX, iconY, iconSize, iconSize)

  if (image) {
    drawGlamourTemplateImageCover(ctx, image, iconX, iconY, iconSize, iconSize)
  } else {
    ctx.fillStyle = '#343434'
    ctx.fillRect(iconX, iconY, iconSize, iconSize)
  }

  ctx.restore()
}

function getEcItemNameColor(row: GlamourTemplateRow): string {
  const rarity = Number(row.item.rarity || 1)
  return EC_ITEM_RARITY_COLORS[rarity] || EC_ITEM_RARITY_COLORS[1]
}

function drawEcFittedItemName(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  text: string,
  x: number,
  centerY: number,
  maxWidth: number,
  layout: EcTemplateLayout
) {
  fitCanvasFont(ctx, text, {
    maxWidth,
    maxSize: templateUnit(renderData, layout.nameSize),
    minSize: templateUnit(renderData, layout.nameMinSize),
    weight: layout.nameWeight,
    family: '"Source Sans 3", "Microsoft YaHei", sans-serif'
  })
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, centerY, maxWidth)
}

function drawEcDyeChip(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  rowY: number,
  dye: { name: string; hex?: string; isEmpty: boolean },
  dyeIndex: number,
  layout: EcTemplateLayout,
  previousRight = 0
) {
  const spec = layout.dyes[dyeIndex]

  if (!spec) {
    return previousRight
  }

  const label = normalizeDyeLabel(dye.name)
  const y = templateUnit(renderData, rowY + layout.dyeYOffset)
  const height = templateUnit(renderData, layout.dyeHeight)
  const dotSize = templateUnit(renderData, layout.dyeDotSize)
  const fontSize = templateUnit(renderData, layout.dyeFontSize)
  const leftPadding = templateUnit(renderData, layout.dyeTextXOffset)
  const rightPadding = templateUnit(renderData, 34)
  const gap = templateUnit(renderData, layout.dyeGap)
  const baseX = templateUnit(renderData, spec.x)
  const x = previousRight ? previousRight + gap : baseX
  const dotX = x + templateUnit(renderData, layout.dyeDotXOffset)
  const dotY = y + (height - dotSize) / 2
  const textX = x + leftPadding
  const minWidth = Math.max(templateUnit(renderData, spec.minWidth), leftPadding + rightPadding)

  ctx.font = `400 ${fontSize}px "Source Sans 3", "Microsoft YaHei", sans-serif`
  const width = Math.max(minWidth, ctx.measureText(label).width + leftPadding + rightPadding)
  ctx.fillStyle = EC_TEMPLATE_COLORS.rowDeep
  fillRoundedRect(ctx, x, y, width, height, templateUnit(renderData, layout.dyeRadius))
  ctx.fillStyle = dye.isEmpty ? '#596069' : normalizeHexColor(dye.hex, '#89b8dc')
  ctx.beginPath()
  ctx.arc(dotX + dotSize / 2, dotY + dotSize / 2, dotSize / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = EC_TEMPLATE_COLORS.textDim
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, textX, y + height / 2)
  return x + width
}

function drawEcEquipment(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, resolveIcon } = options
  const filledRows = renderData.rows.filter((row) => row.itemName)
  const layout = getEcEquipmentLayout(filledRows.length)
  const rows = filledRows.slice(0, layout.maxRows)

  rows.forEach((row, index) => {
    const rowY = layout.rowY[index]
    const rowBox = templateRect(renderData, {
      x: layout.rowX,
      y: rowY,
      width: layout.rowWidth,
      height: layout.rowHeight
    })
    ctx.fillStyle = EC_TEMPLATE_COLORS.row
    fillRoundedRect(ctx, rowBox.x, rowBox.y, rowBox.width, rowBox.height, templateUnit(renderData, layout.rowRadius))
    drawEcIcon(ctx, renderData, layout, rowY, resolveIcon?.(row.item.icon)?.image || null)

    const dyes = row.dyes || []
    const nameX = templateUnit(renderData, layout.nameX)
    const nameWidth = templateUnit(renderData, layout.nameWidth)
    const rowCenterY = rowY + layout.rowHeight / 2
    const dyeCenterY = rowY + layout.dyeYOffset + layout.dyeHeight / 2
    const nameCenterY = templateUnit(renderData, dyes.length ? rowCenterY * 2 - dyeCenterY : rowCenterY)
    ctx.fillStyle = getEcItemNameColor(row)
    drawEcFittedItemName(ctx, renderData, row.itemName, nameX, nameCenterY, nameWidth, layout)

    let dyeRight = 0
    dyes.slice(0, 2).forEach((dye, dyeIndex) => {
      dyeRight = drawEcDyeChip(ctx, renderData, rowY, dye, dyeIndex, layout, dyeRight)
    })
  })
}

function drawEcCopyright(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  const box = templateRect(renderData, EC_TEMPLATE_COPYRIGHT)
  const currentYear = new Date().getFullYear()
  const lines = [
    `Eorzea Collection © 2016-${currentYear}.`,
    `FINAL FANTASY XIV © 2010-${currentYear} SQUARE ENIX CO., LTD. All Rights Reserved.`
  ]

  ctx.fillStyle = EC_TEMPLATE_COLORS.accent
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `400 ${templateUnit(renderData, EC_TEMPLATE_COPYRIGHT.titleSize)}px "Source Sans 3", "Microsoft YaHei", sans-serif`
  ctx.fillText(lines[0], box.x + box.width / 2, box.y + templateUnit(renderData, EC_TEMPLATE_COPYRIGHT.lineY[0]), box.width)
  ctx.font = `400 ${templateUnit(renderData, EC_TEMPLATE_COPYRIGHT.textSize)}px "Source Sans 3", "Microsoft YaHei", sans-serif`
  ctx.fillText(lines[1], box.x + box.width / 2, box.y + templateUnit(renderData, EC_TEMPLATE_COPYRIGHT.lineY[1]), box.width)
}

function getEorzeaEquipmentLayout(rowCount: number): EorzeaTemplateLayout {
  if (rowCount >= 7) {
    return EORZEA_TEMPLATE.layouts.compact
  }

  if (rowCount === 6) {
    return EORZEA_TEMPLATE.layouts.sixRows
  }

  return EORZEA_TEMPLATE.layouts.roomy
}

function eorzeaRect(renderData: GlamourTemplateRenderData, rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: templateUnit(renderData, rect.x),
    y: templateUnit(renderData, rect.y),
    width: templateUnit(renderData, rect.width),
    height: templateUnit(renderData, rect.height)
  }
}

function drawEorzeaBackground(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, assets } = options

  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, renderData.canvas.width, renderData.canvas.height)

  const background = assets?.['figma-background']?.image

  if (background) {
    ctx.drawImage(background, 0, 0, renderData.canvas.width, renderData.canvas.height)
  }
}

function drawEorzeaGuides(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  ctx.fillStyle = EORZEA_TEMPLATE.textColor
  ctx.fillRect(templateUnit(renderData, 2148), 0, templateUnit(renderData, 1538), templateUnit(renderData, 16))

  ctx.strokeStyle = EORZEA_TEMPLATE.textColor
  ctx.lineWidth = Math.max(1, templateUnit(renderData, 2))
  ctx.beginPath()
  ctx.moveTo(templateUnit(renderData, 2149), templateUnit(renderData, 1058))
  ctx.lineTo(templateUnit(renderData, 3685), templateUnit(renderData, 1058))
  ctx.moveTo(templateUnit(renderData, 2149), templateUnit(renderData, 1571))
  ctx.lineTo(templateUnit(renderData, 3685), templateUnit(renderData, 1571))
  ctx.stroke()

  ctx.strokeStyle = '#c7c6c5'
  ctx.lineWidth = Math.max(1, templateUnit(renderData, 3))
  ctx.beginPath()
  ctx.moveTo(templateUnit(renderData, 2635.59), templateUnit(renderData, 1791.57))
  ctx.lineTo(templateUnit(renderData, 2149.41), templateUnit(renderData, 3259.42))
  ctx.stroke()
}

function drawEorzeaTitle(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  const title = String(renderData.text.title || '').trim() || renderData.profile.defaultTopText
  const maskBox = eorzeaRect(renderData, EORZEA_TEMPLATE.titleMask)
  const titleSize = templateUnit(renderData, EORZEA_TEMPLATE.titleText.maxSize)
  const titleTracking = titleSize * (EORZEA_TEMPLATE.titleTracking / 1000)

  ctx.fillStyle = EORZEA_TEMPLATE.maskFill
  ctx.fillRect(maskBox.x, maskBox.y, maskBox.width, maskBox.height)
  ctx.fillStyle = EORZEA_TEMPLATE.textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `500 ${titleSize}px "Source Han Serif CN", "Noto Serif SC", "Microsoft YaHei", serif`
  drawTextWithTracking(
    ctx,
    title,
    templateUnit(renderData, EORZEA_TEMPLATE.titleText.right),
    templateUnit(renderData, EORZEA_TEMPLATE.titleText.baselineY),
    titleTracking,
    { align: 'right' }
  )
}

function normalizeEorzeaDyeLabel(name: string, isEmpty: boolean, locale: string): string {
  const text = String(name || '').trim()

  if (isEmpty) {
    return text
  }

  if (locale === 'en') {
    return text
  }

  if (/染剂$/u.test(text) || /染劑$/u.test(text)) {
    return text
  }

  return locale === 'tc' ? `${text}染劑` : `${text}染剂`
}

function drawEorzeaDyeFrame(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  x: number,
  y: number,
  dye: { name: string; hex?: string; isEmpty: boolean },
  index: number,
  layout: EorzeaTemplateLayout
) {
  const width = templateUnit(renderData, layout.dyeWidth)
  const height = templateUnit(renderData, layout.dyeHeight)
  const radius = templateUnit(renderData, layout.dyeRadius)
  const textX = x + templateUnit(renderData, layout.dyeTextXOffset)
  const textY = y + templateUnit(renderData, layout.dyeTextYOffset)
  const textWidth = templateUnit(renderData, layout.dyeTextWidth)
  const textCenterX = textX + textWidth / 2
  const numberCenterX = x + templateUnit(renderData, layout.dyeTextXOffset - 42)
  const numberCenterY = y + height / 2
  const numberRadius = templateUnit(renderData, 13.5)
  const borderWidth = Math.max(1, templateUnit(renderData, 2))

  ctx.fillStyle = EORZEA_TEMPLATE.maskFill
  fillRoundedRect(ctx, x, y, width, height, radius)
  ctx.strokeStyle = '#d2d1cf'
  ctx.lineWidth = borderWidth
  makeRoundedRectPath(ctx, x, y, width, height, radius)
  ctx.stroke()

  ctx.strokeStyle = '#d2d1cf'
  ctx.lineWidth = Math.max(1, templateUnit(renderData, 1.5))
  ctx.beginPath()
  ctx.arc(numberCenterX, numberCenterY, numberRadius, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = '#c7c6c5'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `400 ${templateUnit(renderData, 24)}px "Source Han Sans CN", "Microsoft YaHei", sans-serif`
  ctx.fillText(String(index + 1), numberCenterX, numberCenterY + templateUnit(renderData, 1))

  ctx.fillStyle = EORZEA_TEMPLATE.textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = `500 ${templateUnit(renderData, layout.dyeFontSize)}px "Source Han Sans CN", "Microsoft YaHei", sans-serif`
  drawClippedTextInBox(
    ctx,
    normalizeEorzeaDyeLabel(dye.name, dye.isEmpty, renderData.locale),
    { x: textX, y: textY, width: textWidth, height: height - templateUnit(renderData, layout.dyeTextYOffset) },
    textCenterX,
    textY
  )
}

function drawEorzeaColorPill(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  x: number,
  y: number,
  dye: { name: string; hex?: string; isEmpty: boolean },
  layout: EorzeaTemplateLayout
) {
  const width = templateUnit(renderData, layout.dyeWidth)
  const height = templateUnit(renderData, layout.dyeHeight)
  const radius = templateUnit(renderData, layout.dyeRadius)
  const dyeColor = dye.isEmpty ? EORZEA_TEMPLATE.maskFill : normalizeHexColor(dye.hex, EORZEA_TEMPLATE.textColor)
  const textWidth = templateUnit(renderData, layout.dyeTextWidth)

  ctx.fillStyle = dyeColor
  fillRoundedRect(ctx, x, y, width, height, radius)
  ctx.strokeStyle = dye.isEmpty ? 'rgba(37, 37, 37, 0.58)' : 'rgba(37, 37, 37, 0.22)'
  ctx.lineWidth = Math.max(1, templateUnit(renderData, 2))
  makeRoundedRectPath(ctx, x, y, width, height, radius)
  ctx.stroke()

  ctx.fillStyle = dye.isEmpty ? EORZEA_TEMPLATE.textColor : getReadableTextColor(dyeColor)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `500 ${templateUnit(renderData, layout.dyeFontSize)}px "Source Han Sans CN", "Microsoft YaHei", sans-serif`
  drawClippedTextInBox(
    ctx,
    normalizeEorzeaDyeLabel(dye.name, dye.isEmpty, renderData.locale),
    { x: x + (width - textWidth) / 2, y, width: textWidth, height },
    x + width / 2,
    y + height / 2
  )
}

function drawEorzeaDye(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  x: number,
  y: number,
  dye: { name: string; hex?: string; isEmpty: boolean },
  index: number,
  layout: EorzeaTemplateLayout
) {
  if (renderData.style.dyeFrameMode === 'color') {
    drawEorzeaColorPill(ctx, renderData, x, y, dye, layout)
    return
  }

  drawEorzeaDyeFrame(ctx, renderData, x, y, dye, index, layout)
}

function drawEorzeaEquipment(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  const rows = renderData.rows.filter((row) => row.itemName)

  if (!rows.length) {
    return
  }

  const layout = getEorzeaEquipmentLayout(rows.length)
  const nameSize = templateUnit(renderData, layout.nameSize)
  const lineHeight = templateUnit(renderData, layout.lineHeight)
  const nameRight = templateUnit(renderData, layout.nameX + layout.nameWidth)
  const nameWidth = templateUnit(renderData, layout.nameWidth)
  const nameTracking = ((layout.nameSize * renderData.canvas.width) / EORZEA_TEMPLATE.sourceSize) *
    (EORZEA_TEMPLATE.itemNameTracking / 1000)

  rows.slice(0, layout.rowY.length).forEach((row, index) => {
    const y = templateUnit(renderData, layout.rowY[index])

    ctx.fillStyle = EORZEA_TEMPLATE.maskFill
    ctx.fillRect(templateUnit(renderData, layout.nameX), y, nameWidth, lineHeight)
    ctx.fillStyle = EORZEA_TEMPLATE.textColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.font = `500 ${nameSize}px "Source Han Serif CN", "Noto Serif SC", "Microsoft YaHei", serif`
    drawTextWithTracking(ctx, row.itemName, nameRight, y, nameTracking, { align: 'right' })

    const dyeY = y + templateUnit(renderData, layout.dyeYOffset)
    row.dyes.slice(0, 2).forEach((dye, dyeIndex) => {
      const dyeX = templateUnit(renderData, layout.dyeX[dyeIndex])
      ctx.fillStyle = EORZEA_TEMPLATE.maskFill
      ctx.fillRect(dyeX, dyeY, templateUnit(renderData, layout.dyeWidth), templateUnit(renderData, layout.dyeHeight))
      drawEorzeaDye(ctx, renderData, dyeX, dyeY, dye, dyeIndex, layout)
    })
  })
}

function drawEorzeaImageSlots(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  resolveImage: GlamourTemplateImageResolver
) {
  for (const slot of renderData.canvas.imageSlots) {
    const image = resolveImage(slot.id)

    ctx.fillStyle = EORZEA_TEMPLATE.maskFill
    ctx.fillRect(slot.region.x, slot.region.y, slot.region.width, slot.region.height)

    if (image) {
      drawGlamourTemplateImageCover(ctx, image.image, slot.region.x, slot.region.y, slot.region.width, slot.region.height)
    }
  }
}

function drawClippedTextInBox(
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

function getTextInkCenterBaseline(ctx: CanvasRenderingContext2D, text: string, centerY: number): number {
  const metrics = ctx.measureText(text || 'Ag')
  const ascent = Number(metrics.actualBoundingBoxAscent || 0)
  const descent = Number(metrics.actualBoundingBoxDescent || 0)
  return ascent || descent ? centerY + (ascent - descent) / 2 : centerY
}

function getRisingstonesScale(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / RISINGSTONES_TEMPLATE.sourceSize) * renderData.canvas.width
}

function getRisingstonesRect(renderData: GlamourTemplateRenderData, rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: getRisingstonesScale(renderData, rect.x),
    y: getRisingstonesScale(renderData, rect.y),
    width: getRisingstonesScale(renderData, rect.width),
    height: getRisingstonesScale(renderData, rect.height)
  }
}

function getRisingstonesEquipmentScale(rowCount: number, layout: RisingstonesEquipmentLayout): number {
  if (rowCount <= 0) {
    return 1
  }

  const naturalBottom = layout.rowStartY + (rowCount - 1) * layout.rowStep + layout.rowHeight

  if (naturalBottom <= layout.rowBottom) {
    return 1
  }

  const availableHeight = Math.max(1, layout.rowBottom - layout.rowStartY)
  const naturalHeight = (rowCount - 1) * layout.rowStep + layout.rowHeight
  return Math.max(0.42, Math.min(1, availableHeight / naturalHeight))
}

function getRisingstonesNameWidth(renderData: GlamourTemplateRenderData, layout: RisingstonesEquipmentLayout): number {
  const avatarRight = RISINGSTONES_TEMPLATE.avatarRegion.x + RISINGSTONES_TEMPLATE.avatarRegion.width
  const defaultRight = layout.nameX + layout.nameWidth
  const nameRight = Math.max(defaultRight, avatarRight)
  return getRisingstonesScale(renderData, Math.max(0, nameRight - layout.nameX))
}

function drawRisingstonesImage(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  resolveImage: GlamourTemplateImageResolver
) {
  const slot = renderData.canvas.imageSlots[0]
  const image = slot ? resolveImage(slot.id) : null
  const box = getRisingstonesRect(renderData, RISINGSTONES_TEMPLATE.imageRegion)
  const radius = getRisingstonesScale(renderData, RISINGSTONES_TEMPLATE.imageRadius)

  ctx.save()
  makeRoundedRectPath(ctx, box.x, box.y, box.width, box.height, radius)
  ctx.clip()
  ctx.fillStyle = RISINGSTONES_TEMPLATE.imagePlaceholder
  ctx.fillRect(box.x, box.y, box.width, box.height)

  if (image) {
    drawGlamourTemplateImageCover(ctx, image.image, box.x, box.y, box.width, box.height)
  }

  ctx.restore()
}

function drawRisingstonesAvatar(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  resolveImage: GlamourTemplateImageResolver
) {
  const box = getRisingstonesRect(renderData, RISINGSTONES_TEMPLATE.avatarRegion)
  const image = resolveImage(GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID)

  ctx.save()
  makeRoundedRectPath(ctx, box.x, box.y, box.width, box.height, 0)
  ctx.clip()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(box.x, box.y, box.width, box.height)

  if (image) {
    drawGlamourTemplateImageCover(ctx, image.image, box.x, box.y, box.width, box.height)
  }

  ctx.restore()
}

function drawRisingstonesFittedText(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  text: string,
  area: { x: number; y: number; width: number; height: number; maxSize: number; minSize: number },
  options: {
    color?: string
    weight?: number
    align?: CanvasTextAlign
    baseline?: CanvasTextBaseline
    clipBleedX?: number
    clipBleedLeftX?: number
    clipBleedRightX?: number
    clipBleedY?: number
  } = {}
) {
  const value = String(text || '').trim()

  if (!value) {
    return
  }

  const box = getRisingstonesRect(renderData, area)
  const defaultBleedX = options.clipBleedX || 0
  const bleedLeft = getRisingstonesScale(renderData, options.clipBleedLeftX ?? defaultBleedX)
  const bleedRight = getRisingstonesScale(renderData, options.clipBleedRightX ?? defaultBleedX)
  const bleedY = getRisingstonesScale(renderData, options.clipBleedY || 0)
  const align = options.align || 'left'
  const baseline = options.baseline || 'middle'
  const weight = options.weight || 700
  const family = '"Noto Sans SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif'

  fitCanvasFont(ctx, value, {
    maxWidth: box.width + bleedLeft + bleedRight,
    maxSize: getRisingstonesScale(renderData, area.maxSize),
    minSize: getRisingstonesScale(renderData, area.minSize),
    weight,
    family
  })
  ctx.fillStyle = options.color || RISINGSTONES_TEMPLATE.textColor
  ctx.textAlign = align
  ctx.textBaseline = baseline
  const drawX = align === 'center' ? box.x + box.width / 2 : box.x
  const drawY = baseline === 'top' ? box.y : box.y + box.height / 2
  drawClippedTextInBox(
    ctx,
    value,
    {
      x: box.x - bleedLeft,
      y: box.y - bleedY,
      width: box.width + bleedLeft + bleedRight,
      height: box.height + bleedY * 2
    },
    drawX,
    drawY,
    box.width + bleedLeft + bleedRight
  )
}

function drawRisingstonesHeader(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  resolveImage: GlamourTemplateImageResolver
) {
  const authorRightBleed = Math.max(
    0,
    RISINGSTONES_TEMPLATE.source.x +
      RISINGSTONES_TEMPLATE.source.width -
      (RISINGSTONES_TEMPLATE.author.x + RISINGSTONES_TEMPLATE.author.width)
  )

  drawRisingstonesAvatar(ctx, renderData, resolveImage)
  drawRisingstonesFittedText(
    ctx,
    renderData,
    renderData.text.title || renderData.profile.defaultTopText,
    RISINGSTONES_TEMPLATE.title,
    { clipBleedX: 120, clipBleedY: 42 }
  )
  drawRisingstonesFittedText(ctx, renderData, renderData.text.subtitle, RISINGSTONES_TEMPLATE.author, {
    clipBleedLeftX: 0,
    clipBleedRightX: authorRightBleed,
    clipBleedY: 28
  })
  drawRisingstonesFittedText(ctx, renderData, RISINGSTONES_TEMPLATE.sourceText, RISINGSTONES_TEMPLATE.source, {
    clipBleedX: 48,
    clipBleedY: 28
  })
}

function drawRisingstonesIcon(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  rowY: number,
  layout: RisingstonesEquipmentLayout,
  scale: number,
  image: HTMLImageElement | null
) {
  const iconX = getRisingstonesScale(renderData, layout.iconX)
  const iconY = getRisingstonesScale(renderData, rowY + layout.iconYOffset * scale)
  const iconSize = getRisingstonesScale(renderData, layout.iconSize * scale)
  const iconRadius = getRisingstonesScale(renderData, layout.iconRadius * scale)

  ctx.save()
  makeRoundedRectPath(ctx, iconX, iconY, iconSize, iconSize, iconRadius)
  ctx.clip()
  ctx.fillStyle = '#eeeeee'
  ctx.fillRect(iconX, iconY, iconSize, iconSize)

  if (image) {
    drawGlamourTemplateImageCover(ctx, image, iconX, iconY, iconSize, iconSize)
  }

  ctx.restore()
}

function measureRisingstonesDyeChip(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  label: string,
  scale: number
) {
  const layout = RISINGSTONES_TEMPLATE.equipment
  const fontSize = getRisingstonesScale(renderData, layout.dyeFontSize * scale)
  const font = `400 ${fontSize}px "Noto Sans SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif`
  ctx.save()
  ctx.font = font
  const labelWidth = ctx.measureText(label).width
  ctx.restore()
  return {
    font,
    width:
      getRisingstonesScale(renderData, layout.dyeTextXOffset * scale) +
      labelWidth +
      getRisingstonesScale(renderData, layout.dyeTextRightPadding * scale)
  }
}

function drawRisingstonesDyeChip(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  rowY: number,
  dye: { name: string; hex?: string; isEmpty: boolean },
  x: number,
  maxWidth: number,
  scale: number
) {
  const layout = RISINGSTONES_TEMPLATE.equipment
  const label = normalizeDyeLabel(dye.name)
  const measured = measureRisingstonesDyeChip(ctx, renderData, label, scale)
  const y = getRisingstonesScale(renderData, rowY + layout.dyeYOffset * scale)
  const height = getRisingstonesScale(renderData, layout.dyeHeight * scale)
  const dotSize = getRisingstonesScale(renderData, layout.dyeDotSize * scale)
  const dotX = x + getRisingstonesScale(renderData, layout.dyeDotXOffset * scale)
  const dotY = y + (height - dotSize) / 2
  const textX = x + getRisingstonesScale(renderData, layout.dyeTextXOffset * scale)
  const textY = getRisingstonesScale(renderData, rowY + layout.dyeTextYOffset * scale)
  const textHeight = getRisingstonesScale(renderData, layout.dyeTextHeight * scale)
  const radius = getRisingstonesScale(renderData, layout.dyeDotRadius * scale)

  ctx.fillStyle = dye.isEmpty ? '#d4d4d4' : normalizeHexColor(dye.hex, '#98cce0')
  fillRoundedRect(ctx, dotX, dotY, dotSize, dotSize, radius)
  ctx.strokeStyle = RISINGSTONES_TEMPLATE.borderColor
  ctx.lineWidth = Math.max(1, getRisingstonesScale(renderData, layout.dyeDotStrokeWidth * scale))
  makeRoundedRectPath(ctx, dotX, dotY, dotSize, dotSize, radius)
  ctx.stroke()

  ctx.fillStyle = RISINGSTONES_TEMPLATE.dyeText
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = measured.font
  drawClippedTextInBox(
    ctx,
    label,
    { x: textX, y: textY, width: Math.max(0, maxWidth - getRisingstonesScale(renderData, layout.dyeTextXOffset * scale)), height: textHeight },
    textX,
    getTextInkCenterBaseline(ctx, label, textY + textHeight / 2)
  )
  return measured.width
}

function drawRisingstonesEquipment(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, resolveIcon } = options
  const layout = RISINGSTONES_TEMPLATE.equipment
  const rows = renderData.rows.filter((row) => row.itemName).slice(0, layout.maxRows)
  const scale = getRisingstonesEquipmentScale(rows.length, layout)

  rows.forEach((row, index) => {
    const rowY = layout.rowStartY + index * layout.rowStep * scale
    const iconCenterY = rowY + layout.iconYOffset * scale + (layout.iconSize * scale) / 2
    const dyes = row.dyes || []
    const nameCenterY = dyes.length
      ? rowY + layout.nameYOffset * scale + (layout.nameHeight * scale) / 2
      : iconCenterY
    const nameX = getRisingstonesScale(renderData, layout.nameX)
    const nameWidth = getRisingstonesNameWidth(renderData, layout)

    drawRisingstonesIcon(ctx, renderData, rowY, layout, scale, resolveIcon?.(row.item.icon)?.image || null)
    ctx.fillStyle = RISINGSTONES_TEMPLATE.textColor
    drawEcFittedItemName(
      ctx,
      renderData,
      row.itemName,
      nameX,
      getRisingstonesScale(renderData, nameCenterY),
      nameWidth,
      {
        ...EC_TEMPLATE_LAYOUTS.normal,
        nameSize: layout.nameSize * scale,
        nameMinSize: layout.nameMinSize * scale
      }
    )

    let dyeX = getRisingstonesScale(renderData, layout.dyes[0]?.x || layout.nameX)
    const rowRight = getRisingstonesScale(renderData, layout.rowX + layout.rowWidth)
    const dyeGap = getRisingstonesScale(renderData, layout.dyeGap * scale)

    dyes.slice(0, 2).forEach((dye) => {
      const maxWidth = Math.max(0, rowRight - dyeX)

      if (maxWidth <= 0) {
        return
      }

      dyeX += drawRisingstonesDyeChip(ctx, renderData, rowY, dye, dyeX, maxWidth, scale) + dyeGap
    })
  })
}

function drawRisingstonesCopyright(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  const box = getRisingstonesRect(renderData, RISINGSTONES_TEMPLATE.copyright)
  const lines = RISINGSTONES_TEMPLATE.copyright.lines

  ctx.fillStyle = '#000000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${getRisingstonesScale(renderData, 34)}px "Noto Sans SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif`
  ctx.fillText(lines[0] || '', box.x + box.width / 2, box.y + getRisingstonesScale(renderData, 30), box.width)

  if (lines[1]) {
    ctx.font = `700 ${getRisingstonesScale(renderData, 32)}px "Noto Sans SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif`
    ctx.fillText(lines[1], box.x + box.width / 2, box.y + getRisingstonesScale(renderData, 76), box.width)
  }
}

function getSilenceFashionScale(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / SILENCE_FASHION_TEMPLATE.sourceSize) * renderData.canvas.width
}

function getSilenceFashionScaleY(renderData: GlamourTemplateRenderData, value: number): number {
  return (value / SILENCE_FASHION_TEMPLATE.sourceSize) * renderData.canvas.height
}

function getSilenceFashionRect(
  renderData: GlamourTemplateRenderData,
  rect: { x: number; y: number; width: number; height: number }
) {
  return {
    x: getSilenceFashionScale(renderData, rect.x),
    y: getSilenceFashionScaleY(renderData, rect.y),
    width: getSilenceFashionScale(renderData, rect.width),
    height: getSilenceFashionScaleY(renderData, rect.height)
  }
}

function isSilenceFashionEnJaMode(renderData: GlamourTemplateRenderData): boolean {
  return renderData.locales.includes('ja') && renderData.locales.includes('en')
}

function getSilenceFashionSerifFamily(renderData: GlamourTemplateRenderData): string {
  if (!isSilenceFashionEnJaMode(renderData) && renderData.locale === 'ko') {
    return SILENCE_FASHION_TEMPLATE.koSerifFamily
  }

  return SILENCE_FASHION_TEMPLATE.serifFamily
}

function getSilenceFashionRows(renderData: GlamourTemplateRenderData, locale: string): GlamourTemplateRow[] {
  return renderData.localizedRows.find((entry) => entry.locale === locale)?.rows || []
}

function getSilenceFashionTextWidth(renderData: GlamourTemplateRenderData, x: number, fallbackWidth: number): number {
  return SILENCE_FASHION_TEMPLATE.equipmentRight > 0
    ? Math.max(1, getSilenceFashionScale(renderData, SILENCE_FASHION_TEMPLATE.equipmentRight) - x)
    : fallbackWidth
}

function getSilenceFashionEquipmentBottomY(
  renderData: GlamourTemplateRenderData,
  layout: { bottom?: number }
): number {
  const layoutBottom = Number(layout.bottom || SILENCE_FASHION_TEMPLATE.equipmentBottom)
  return getSilenceFashionScaleY(renderData, Math.min(SILENCE_FASHION_TEMPLATE.equipmentBottom, layoutBottom))
}

function splitSilenceFashionTokenByWidth(ctx: CanvasRenderingContext2D, token: string, width: number): string[] {
  const lines: string[] = []
  let line = ''

  for (const char of Array.from(String(token || ''))) {
    const next = `${line}${char}`

    if (line && ctx.measureText(next).width > width) {
      lines.push(line)
      line = char
    } else {
      line = next
    }
  }

  if (line) {
    lines.push(line)
  }

  return lines
}

function wrapSilenceFashionText(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const tokens = String(text || '').trim().match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*\s*|[^\s]+\s*|\s+/gu) || []
  const lines: string[] = []
  let line = ''

  for (const token of tokens) {
    const next = `${line}${token}`

    if (line && ctx.measureText(next).width > width) {
      lines.push(line)
      line = token

      if (ctx.measureText(line).width > width) {
        lines.push(...splitSilenceFashionTokenByWidth(ctx, line, width))
        line = ''
      }
    } else {
      line = next
    }
  }

  if (line) {
    lines.push(line)
  }

  return lines
}

function drawSilenceFashionTextFit(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  text: string,
  x: number,
  y: number,
  width: number,
  options: {
    size: number
    minSize: number
    weight: number
    family: string
  }
) {
  const value = String(text || '').trim()

  if (!value) {
    return
  }

  const maxSize = getSilenceFashionScale(renderData, options.size)
  const minSize = getSilenceFashionScale(renderData, options.minSize)
  let size = maxSize

  while (size > minSize) {
    ctx.font = `${options.weight} ${size}px ${options.family}`

    if (ctx.measureText(value).width <= width) {
      break
    }

    size -= 1
  }

  ctx.font = `${options.weight} ${size}px ${options.family}`
  ctx.fillText(value, x, y)
}

function drawSilenceFashionWrappedText(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  text: string,
  x: number,
  y: number,
  width: number,
  options: {
    size: number
    lineHeight: number
    weight: number
    family: string
    bottomY: number
  }
) {
  const value = String(text || '').trim()

  if (!value) {
    return { nextY: y, clipped: false }
  }

  const size = getSilenceFashionScale(renderData, options.size)
  const lineHeight = getSilenceFashionScaleY(renderData, options.lineHeight)
  let cursorY = y

  ctx.font = `${options.weight} ${size}px ${options.family}`

  for (const line of wrapSilenceFashionText(ctx, value, width)) {
    if (cursorY + lineHeight > options.bottomY) {
      return { nextY: cursorY, clipped: true }
    }

    ctx.fillText(line, x, cursorY)
    cursorY += lineHeight
  }

  return { nextY: cursorY, clipped: false }
}

function drawSilenceFashionBackground(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, assets } = options
  const background = assets?.['silence-fashion-background']?.image

  if (background) {
    ctx.drawImage(background, 0, 0, renderData.canvas.width, renderData.canvas.height)
    return
  }

  ctx.fillStyle = '#f8f8f6'
  ctx.fillRect(0, 0, renderData.canvas.width, renderData.canvas.height)
}

function drawSilenceFashionImages(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  resolveImage: GlamourTemplateImageResolver
) {
  const mainBox = getSilenceFashionRect(renderData, SILENCE_FASHION_TEMPLATE.imageRegion)
  const mainImage = resolveImage(GLAMOUR_TEMPLATE_DEFAULT_IMAGE_SLOT_ID)

  ctx.fillStyle = '#f3f3f3'
  ctx.fillRect(mainBox.x, mainBox.y, mainBox.width, mainBox.height)

  if (mainImage) {
    drawGlamourTemplateImageCover(ctx, mainImage.image, mainBox.x, mainBox.y, mainBox.width, mainBox.height)
  }

  const avatar = resolveImage(GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID)

  if (avatar) {
    const avatarBox = getSilenceFashionRect(renderData, SILENCE_FASHION_TEMPLATE.avatarRegion)
    drawGlamourTemplateImageCover(ctx, avatar.image, avatarBox.x, avatarBox.y, avatarBox.width, avatarBox.height)
  }
}

function drawSilenceFashionHeader(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  const family = getSilenceFashionSerifFamily(renderData)
  const character = String(renderData.text.subtitle || renderData.text.characterName || '').trim()
  const title = String(renderData.text.title || '').trim() || renderData.profile.defaultTopText

  ctx.fillStyle = SILENCE_FASHION_TEMPLATE.textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  if (character) {
    const spec = SILENCE_FASHION_TEMPLATE.character
    drawSilenceFashionTextFit(
      ctx,
      renderData,
      character,
      getSilenceFashionScale(renderData, spec.x),
      getSilenceFashionScaleY(renderData, spec.y),
      getSilenceFashionScale(renderData, spec.width),
      { size: spec.size, minSize: spec.minSize, weight: spec.weight, family }
    )
  }

  drawSilenceFashionTextFit(
    ctx,
    renderData,
    title,
    getSilenceFashionScale(renderData, SILENCE_FASHION_TEMPLATE.title.x),
    getSilenceFashionScaleY(renderData, SILENCE_FASHION_TEMPLATE.title.y),
    getSilenceFashionScale(renderData, SILENCE_FASHION_TEMPLATE.title.width),
    {
      size: SILENCE_FASHION_TEMPLATE.title.size,
      minSize: SILENCE_FASHION_TEMPLATE.title.minSize,
      weight: SILENCE_FASHION_TEMPLATE.title.weight,
      family
    }
  )
}

function drawSilenceFashionZhEquipment(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  rows: GlamourTemplateRow[]
) {
  const layout = SILENCE_FASHION_TEMPLATE.zh
  const family = getSilenceFashionSerifFamily(renderData)
  const itemX = getSilenceFashionScale(renderData, layout.itemX)
  const dyeX = getSilenceFashionScale(renderData, layout.dyeX)
  const itemWidth = getSilenceFashionTextWidth(renderData, itemX, getSilenceFashionScale(renderData, layout.width))
  const dyeWidth = getSilenceFashionTextWidth(renderData, dyeX, getSilenceFashionScale(renderData, layout.width))
  const bottomY = getSilenceFashionEquipmentBottomY(renderData, layout)
  let y = getSilenceFashionScaleY(renderData, layout.y)

  ctx.fillStyle = SILENCE_FASHION_TEMPLATE.textColor
  ctx.textBaseline = 'top'

  for (const row of rows.slice(0, layout.maxRows)) {
    if (y >= bottomY) {
      break
    }

    const itemResult = drawSilenceFashionWrappedText(ctx, renderData, row.itemName, itemX, y, itemWidth, {
      size: layout.itemSize,
      lineHeight: layout.itemLineHeight,
      weight: layout.weight,
      family,
      bottomY
    })

    if (itemResult.clipped) {
      break
    }

    let contentBottom = itemResult.nextY

    if (row.dyeText) {
      const dyeResult = drawSilenceFashionWrappedText(
        ctx,
        renderData,
        row.dyeText,
        dyeX,
        Math.max(itemResult.nextY, y + getSilenceFashionScaleY(renderData, layout.dyeYOffset)),
        dyeWidth,
        {
          size: layout.dyeSize,
          lineHeight: layout.dyeLineHeight,
          weight: layout.weight,
          family,
          bottomY
        }
      )

      if (dyeResult.clipped) {
        break
      }

      contentBottom = dyeResult.nextY
    }

    y = Math.max(
      y + getSilenceFashionScaleY(renderData, layout.rowStep),
      contentBottom + getSilenceFashionScaleY(renderData, layout.groupGap)
    )
  }
}

function drawSilenceFashionEnJaEquipment(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  const layout = SILENCE_FASHION_TEMPLATE.enJa
  const jaRows = getSilenceFashionRows(renderData, 'ja')
  const enRowsBySlot = new Map(getSilenceFashionRows(renderData, 'en').map((row) => [row.slot, row]))
  const family = SILENCE_FASHION_TEMPLATE.serifFamily
  const itemX = getSilenceFashionScale(renderData, layout.itemX)
  const dyeX = getSilenceFashionScale(renderData, layout.dyeX)
  const itemWidth = getSilenceFashionTextWidth(renderData, itemX, getSilenceFashionScale(renderData, layout.width))
  const dyeWidth = getSilenceFashionTextWidth(renderData, dyeX, getSilenceFashionScale(renderData, layout.width))
  const bottomY = getSilenceFashionEquipmentBottomY(renderData, layout)
  const lineGap = getSilenceFashionScaleY(renderData, layout.lineGap)
  let y = getSilenceFashionScaleY(renderData, layout.y)

  ctx.fillStyle = SILENCE_FASHION_TEMPLATE.textColor
  ctx.textBaseline = 'top'

  for (const jaRow of jaRows.slice(0, layout.maxRows)) {
    if (y >= bottomY) {
      break
    }

    const enRow = enRowsBySlot.get(jaRow.slot)
    const jaResult = drawSilenceFashionWrappedText(ctx, renderData, jaRow.itemName, itemX, y, itemWidth, {
      size: layout.jaSize,
      lineHeight: layout.jaLineHeight,
      weight: layout.weight,
      family,
      bottomY
    })

    if (jaResult.clipped) {
      break
    }

    const enResult = drawSilenceFashionWrappedText(
      ctx,
      renderData,
      enRow?.itemName || '',
      itemX,
      jaResult.nextY + lineGap,
      itemWidth,
      {
        size: layout.enSize,
        lineHeight: layout.enLineHeight,
        weight: layout.weight,
        family,
        bottomY
      }
    )

    if (enResult.clipped) {
      break
    }

    let contentBottom = enResult.nextY

    if (enRow?.dyeText) {
      const dyeResult = drawSilenceFashionWrappedText(
        ctx,
        renderData,
        enRow.dyeText,
        dyeX,
        enResult.nextY + lineGap,
        dyeWidth,
        {
          size: layout.dyeSize,
          lineHeight: layout.dyeLineHeight,
          weight: layout.weight,
          family,
          bottomY
        }
      )

      if (dyeResult.clipped) {
        break
      }

      contentBottom = dyeResult.nextY
    }

    y = Math.max(
      y + getSilenceFashionScaleY(renderData, layout.rowStep),
      contentBottom + getSilenceFashionScaleY(renderData, layout.groupGap)
    )
  }
}

function getHorizontalRowAdvance(row: HorizontalEquipmentRow) {
  const area = HORIZONTAL_TEMPLATE.equipmentText
  return area.itemLineHeight + (row.hasDyeLine ? area.dyeLineHeight : 0) + area.groupGap
}

function getHorizontalRowInkHeight(row: HorizontalEquipmentRow) {
  const area = HORIZONTAL_TEMPLATE.equipmentText
  return row.hasDyeLine ? area.itemLineHeight + area.dyeInkHeight : area.itemInkHeight
}

function getHorizontalEquipmentHeight(rows: HorizontalEquipmentRow[]) {
  const area = HORIZONTAL_TEMPLATE.equipmentText

  if (!rows.length) {
    return area.topPadding + area.itemLineHeight
  }

  return rows.reduce((height, row, index) => {
    if (index === rows.length - 1) {
      return height + getHorizontalRowInkHeight(row)
    }

    return height + getHorizontalRowAdvance(row)
  }, area.topPadding)
}

function getHorizontalVisibleRows(rows: HorizontalEquipmentRow[]) {
  const area = HORIZONTAL_TEMPLATE.equipmentText
  const visibleRows: HorizontalEquipmentRow[] = []
  let cursorY = area.topPadding

  for (const row of rows) {
    if (cursorY + getHorizontalRowInkHeight(row) > area.height) {
      break
    }

    visibleRows.push(row)
    cursorY += getHorizontalRowAdvance(row)
  }

  return visibleRows
}

function getHorizontalContentLayout(rows: HorizontalEquipmentRow[]) {
  const group = HORIZONTAL_TEMPLATE.contentGroup
  const visibleRows = getHorizontalVisibleRows(rows)
  const equipmentHeight = getHorizontalEquipmentHeight(visibleRows)
  const groupHeight = group.titleToEquipment + equipmentHeight
  const groupBoundsHeight = group.bottom - group.top
  const groupTop = group.top + Math.max(0, (groupBoundsHeight - groupHeight) / 2)

  return {
    groupTop,
    visibleRows,
    titleY: groupTop,
    lineY: groupTop + group.titleToLine,
    equipmentY: groupTop + group.titleToEquipment
  }
}

function makeHorizontalEquipmentFont(size: number) {
  return `300 ${size}px "Source Sans 3", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif`
}

function getHorizontalFittedFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  baseSize: number,
  maxWidth: number,
  minScale = 0.72
) {
  ctx.font = makeHorizontalEquipmentFont(baseSize)

  if (ctx.measureText(text).width <= maxWidth) {
    return baseSize
  }

  const minSize = Math.max(1, baseSize * Math.max(0.4, Math.min(minScale, 1)))
  let size = baseSize - 1

  while (size > minSize) {
    ctx.font = makeHorizontalEquipmentFont(size)

    if (ctx.measureText(text).width <= maxWidth) {
      return size
    }

    size -= 1
  }

  return minSize
}

function drawHorizontalBackground(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, assets } = options
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, renderData.canvas.width, renderData.canvas.height)

  const background = assets?.['horizontal-background']?.image

  if (background) {
    ctx.drawImage(background, 0, 0, renderData.canvas.width, renderData.canvas.height)
  }
}

function drawHorizontalImageSlots(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, resolveImage } = options

  for (const slot of renderData.canvas.imageSlots) {
    const image = resolveImage(slot.id)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(slot.region.x, slot.region.y, slot.region.width, slot.region.height)

    if (image) {
      drawGlamourTemplateImageCover(ctx, image.image, slot.region.x, slot.region.y, slot.region.width, slot.region.height)
    }
  }
}

function getDoublePicFont(size: number): string {
  return `${DOUBLE_PIC_TEMPLATE.fontWeight} ${size}px ${DOUBLE_PIC_TEMPLATE.fontFamily}`
}

function getDoublePicEquipmentLines(renderData: GlamourTemplateRenderData): string[] {
  return renderData.rows
    .map((row) => {
      const itemName = String(row.itemName || '').trim()

      if (!itemName) {
        return ''
      }

      const dyeText = String(row.dyeText || '').trim()
      return dyeText ? `${itemName} ${dyeText}` : itemName
    })
    .filter(Boolean)
}

function drawDoublePicEquipmentTextShape(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  layout: {
    font: string
    centerX: number
    startY: number
    lineHeight: number
    underlineOffset: number
    underlineWidth: number
  },
  color: string
) {
  ctx.save()
  ctx.font = layout.font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.lineCap = 'round'
  ctx.lineWidth = layout.underlineWidth
  ctx.fillStyle = color
  ctx.strokeStyle = color

  lines.forEach((line, index) => {
    const text = String(line || '')
    const lineY = layout.startY + index * layout.lineHeight
    const measuredWidth = ctx.measureText(text).width
    const underlineY = lineY + layout.underlineOffset

    ctx.fillText(text, layout.centerX, lineY)
    ctx.beginPath()
    ctx.moveTo(layout.centerX - measuredWidth / 2, underlineY)
    ctx.lineTo(layout.centerX + measuredWidth / 2, underlineY)
    ctx.stroke()
  })

  ctx.restore()
}

function createDoublePicSpreadMaskCanvas(maskCanvas: HTMLCanvasElement, spreadRadius: number): HTMLCanvasElement {
  if (spreadRadius <= 0) {
    return maskCanvas
  }

  const spreadCanvas = document.createElement('canvas')
  spreadCanvas.width = maskCanvas.width
  spreadCanvas.height = maskCanvas.height
  const spreadCtx = spreadCanvas.getContext('2d')

  if (!spreadCtx) {
    return maskCanvas
  }

  const radius = Math.ceil(spreadRadius)
  const radiusSquared = spreadRadius * spreadRadius

  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      if (offsetX * offsetX + offsetY * offsetY <= radiusSquared) {
        spreadCtx.drawImage(maskCanvas, offsetX, offsetY)
      }
    }
  }

  return spreadCanvas
}

function drawDoublePicMaskOuterGlow(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  maskCanvas: HTMLCanvasElement,
  x: number,
  y: number
) {
  const area = DOUBLE_PIC_TEMPLATE.equipment
  const glowSize = doublePicUnit(renderData, area.outerGlowSize)
  const opacity = Number(area.outerGlowOpacity)

  if (opacity <= 0 || glowSize <= 0) {
    return
  }

  const spreadRadius = Math.max(0, glowSize * Number(area.outerGlowSpread || 0))
  const spreadCanvas = createDoublePicSpreadMaskCanvas(maskCanvas, spreadRadius)
  const shadowOffset = Math.ceil(renderData.canvas.width + spreadCanvas.width + glowSize * 4 + 16)

  ctx.save()
  ctx.shadowColor = colorWithAlpha(area.outerGlowColor, opacity)
  ctx.shadowBlur = glowSize
  ctx.shadowOffsetX = shadowOffset
  ctx.shadowOffsetY = 0
  ctx.drawImage(spreadCanvas, x - shadowOffset, y)
  ctx.restore()
}

function drawDoublePicEquipmentText(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  const lines = getDoublePicEquipmentLines(renderData)

  if (!lines.length) {
    return
  }

  const area = DOUBLE_PIC_TEMPLATE.equipment
  const centerX = doublePicUnit(renderData, area.x)
  const bottomY = doublePicUnitY(renderData, area.y + area.height)
  const maxSize = doublePicUnit(renderData, area.maxFontSize)
  const lineHeight = Math.round(maxSize * area.lineHeightRatio)
  const underlineWidth = Math.max(1, doublePicUnit(renderData, area.underlineWidth))
  const underlineOffset = Math.round(maxSize * area.underlineOffsetRatio)
  const maxHeight = doublePicUnitY(renderData, area.height)
  const maxLines = Math.max(1, Math.floor((maxHeight - underlineOffset - underlineWidth) / lineHeight) + 1)
  const visibleLines = lines.slice(0, maxLines)
  const textBlockHeight = lineHeight * Math.max(0, visibleLines.length - 1) + underlineOffset + underlineWidth
  const layout = {
    font: getDoublePicFont(maxSize),
    centerX,
    startY: bottomY - textBlockHeight,
    lineHeight,
    underlineOffset,
    underlineWidth
  }

  ctx.save()
  ctx.font = layout.font
  const maxTextWidth = visibleLines.reduce((maxWidth, line) => Math.max(maxWidth, ctx.measureText(line).width), 1)
  const glowSize = doublePicUnit(renderData, area.outerGlowSize)
  const spreadRadius = Math.max(0, glowSize * Number(area.outerGlowSpread || 0))
  const padding = Math.ceil(glowSize * 2.5 + spreadRadius * 3 + underlineWidth * 2)
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = Math.max(1, Math.ceil(maxTextWidth + padding * 2))
  maskCanvas.height = Math.max(1, Math.ceil(textBlockHeight + padding * 2))
  const maskCtx = maskCanvas.getContext('2d')

  if (maskCtx) {
    drawDoublePicEquipmentTextShape(
      maskCtx,
      visibleLines,
      {
        ...layout,
        centerX: maskCanvas.width / 2,
        startY: padding
      },
      '#000000'
    )
    drawDoublePicMaskOuterGlow(ctx, renderData, maskCanvas, centerX - maskCanvas.width / 2, layout.startY - padding)
  }

  drawDoublePicEquipmentTextShape(ctx, visibleLines, layout, '#ffffff')
  ctx.restore()
}

function drawDoublePicCenteredTextShape(
  ctx: CanvasRenderingContext2D,
  text: string,
  box: { x: number; y: number; width: number; height: number },
  font: string,
  color: string
) {
  ctx.save()
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(text, box.x + box.width / 2, box.y + box.height / 2, box.width)
  ctx.restore()
}

function drawDoublePicCopyright(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  if (!getDoublePicEquipmentLines(renderData).length) {
    return
  }

  const box = doublePicRect(renderData, DOUBLE_PIC_TEMPLATE.copyright.rect)
  const maxSize = doublePicUnit(renderData, DOUBLE_PIC_TEMPLATE.copyright.maxFontSize)
  const minSize = doublePicUnit(renderData, DOUBLE_PIC_TEMPLATE.copyright.minFontSize)
  const text = DOUBLE_PIC_TEMPLATE.copyright.text
  let fontSize = maxSize

  while (fontSize > minSize) {
    ctx.font = getDoublePicFont(fontSize)

    if (ctx.measureText(text).width <= box.width) {
      break
    }

    fontSize -= 1
  }

  const font = getDoublePicFont(Math.max(fontSize, minSize))
  const area = DOUBLE_PIC_TEMPLATE.equipment
  const glowSize = doublePicUnit(renderData, area.outerGlowSize)
  const spreadRadius = Math.max(0, glowSize * Number(area.outerGlowSpread || 0))
  const padding = Math.ceil(glowSize * 2.5 + spreadRadius * 3)
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = Math.max(1, Math.ceil(box.width + padding * 2))
  maskCanvas.height = Math.max(1, Math.ceil(box.height + padding * 2))
  const maskCtx = maskCanvas.getContext('2d')

  if (maskCtx) {
    drawDoublePicCenteredTextShape(
      maskCtx,
      text,
      { x: padding, y: padding, width: box.width, height: box.height },
      font,
      '#000000'
    )
    drawDoublePicMaskOuterGlow(ctx, renderData, maskCanvas, box.x - padding, box.y - padding)
  }

  ctx.save()
  drawDoublePicCenteredTextShape(ctx, text, box, font, '#ffffff')
  ctx.restore()
}

function renderDoublePicTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, resolveImage, assets } = options
  const leftSlot = renderData.canvas.imageSlots.find((slot) => slot.id === 'story-left')
  const rightSlot = renderData.canvas.imageSlots.find((slot) => slot.id === 'story-right')
  const leftMask = assets?.['double-pic-left-mask']?.image

  ctx.clearRect(0, 0, renderData.canvas.width, renderData.canvas.height)
  ctx.fillStyle = DOUBLE_PIC_TEMPLATE.background
  ctx.fillRect(0, 0, renderData.canvas.width, renderData.canvas.height)

  for (const slot of [rightSlot, leftSlot]) {
    if (!slot) {
      continue
    }

    const image = resolveImage(slot.id)

    if (image) {
      if (slot.id === 'story-left' && leftMask) {
        drawGlamourTemplateMaskedImageCover(
          ctx,
          image.image,
          leftMask,
          slot.region.x,
          slot.region.y,
          slot.region.width,
          slot.region.height
        )
      } else {
        drawGlamourTemplateImageCover(ctx, image.image, slot.region.x, slot.region.y, slot.region.width, slot.region.height)
      }
    }
  }

  drawDoublePicEquipmentText(ctx, renderData)
  drawDoublePicCopyright(ctx, renderData)
}

function drawHorizontalTitle(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData, titleY: number) {
  const titleBox = horizontalRect(renderData, {
    ...HORIZONTAL_TEMPLATE.title,
    y: titleY
  })
  const lineWidth = horizontalUnit(renderData, HORIZONTAL_TEMPLATE.titleLine.width)
  const clipBleedTop = horizontalUnitY(renderData, HORIZONTAL_TEMPLATE.title.clipBleedTop)
  const clipBleedBottom = horizontalUnitY(renderData, HORIZONTAL_TEMPLATE.title.clipBleedBottom)
  const title = String(renderData.text.title || '').trim() || renderData.profile.defaultTopText

  ctx.save()
  ctx.beginPath()
  ctx.rect(titleBox.x, titleBox.y - clipBleedTop, lineWidth, titleBox.height + clipBleedTop + clipBleedBottom)
  ctx.clip()
  ctx.fillStyle = HORIZONTAL_TEMPLATE.textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = `900 ${horizontalUnit(renderData, HORIZONTAL_TEMPLATE.title.size)}px "HarmonyOS Sans SC", "Source Sans 3", "Microsoft YaHei", sans-serif`
  ctx.fillText(title, titleBox.x, titleBox.y)
  ctx.restore()
}

function drawHorizontalTitleLine(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData, lineY: number) {
  const lineBox = horizontalRect(renderData, {
    ...HORIZONTAL_TEMPLATE.titleLine,
    y: lineY
  })
  const lineHeight = Math.max(1, Math.floor(lineBox.height / HORIZONTAL_TEMPLATE.lineColors.length))

  HORIZONTAL_TEMPLATE.lineColors.forEach((color, index) => {
    ctx.fillStyle = color
    const y = lineBox.y + index * lineHeight
    const height = index === HORIZONTAL_TEMPLATE.lineColors.length - 1
      ? Math.max(1, lineBox.y + lineBox.height - y)
      : lineHeight
    ctx.fillRect(lineBox.x, y, lineBox.width, height)
  })
}

function drawHorizontalEquipmentText(
  ctx: CanvasRenderingContext2D,
  renderData: GlamourTemplateRenderData,
  equipmentY: number,
  rows: HorizontalEquipmentRow[]
) {
  const area = HORIZONTAL_TEMPLATE.equipmentText
  const box = horizontalRect(renderData, {
    ...area,
    y: equipmentY
  })

  if (!rows.length) {
    return
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.width, box.height)
  ctx.clip()
  ctx.fillStyle = HORIZONTAL_TEMPLATE.textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  const itemSize = horizontalUnit(renderData, area.itemSize)
  const dyeSize = horizontalUnit(renderData, area.dyeSize)
  const itemLineHeight = horizontalUnitY(renderData, area.itemLineHeight)
  const dyeLineHeight = horizontalUnitY(renderData, area.dyeLineHeight)
  const groupGap = horizontalUnitY(renderData, area.groupGap)
  let cursorY = box.y + horizontalUnitY(renderData, area.topPadding)

  for (const row of rows) {
    const rowInkHeight = row.hasDyeLine
      ? itemLineHeight + horizontalUnitY(renderData, area.dyeInkHeight)
      : horizontalUnitY(renderData, area.itemInkHeight)

    if (cursorY + rowInkHeight > box.y + box.height) {
      break
    }

    const fittedItemSize = getHorizontalFittedFontSize(ctx, row.itemName, itemSize, box.width)
    ctx.font = makeHorizontalEquipmentFont(fittedItemSize)
    ctx.fillText(row.itemName, box.x, cursorY)

    if (row.hasDyeLine) {
      cursorY += itemLineHeight
      ctx.font = makeHorizontalEquipmentFont(dyeSize)

      if (row.dyeText) {
        ctx.fillText(row.dyeText, box.x, cursorY)
      }

      cursorY += dyeLineHeight + groupGap
    } else {
      cursorY += itemLineHeight + groupGap
    }
  }

  ctx.restore()
}

function renderHorizontalTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData } = options
  const rows = renderData.rows
    .filter((row) => row.itemName)
    .map((row) => ({
      itemName: row.itemName,
      hasDyeLine: row.hasDyeLine,
      dyeText: row.dyeText
    }))
  const layout = getHorizontalContentLayout(rows)

  ctx.clearRect(0, 0, renderData.canvas.width, renderData.canvas.height)
  drawHorizontalBackground(ctx, options)
  drawHorizontalImageSlots(ctx, options)
  drawHorizontalTitleLine(ctx, renderData, layout.lineY)
  drawHorizontalTitle(ctx, renderData, layout.titleY)
  drawHorizontalEquipmentText(ctx, renderData, layout.equipmentY, layout.visibleRows)
}

function renderEcTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, resolveImage } = options
  ctx.clearRect(0, 0, renderData.canvas.width, renderData.canvas.height)
  drawEcFrame(ctx, renderData)
  drawEcMainImage(ctx, renderData, resolveImage)
  drawEcHeader(ctx, renderData)
  drawEcEquipment(ctx, options)
  drawEcCopyright(ctx, renderData)
}

function renderEorzeaTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, resolveImage } = options
  ctx.clearRect(0, 0, renderData.canvas.width, renderData.canvas.height)
  drawEorzeaBackground(ctx, options)
  drawEorzeaGuides(ctx, renderData)
  drawEorzeaTitle(ctx, renderData)
  drawEorzeaEquipment(ctx, renderData)
  drawEorzeaImageSlots(ctx, renderData, resolveImage)
}

function renderRisingstonesTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, resolveImage } = options
  const strokeWidth = getRisingstonesScale(renderData, RISINGSTONES_TEMPLATE.backgroundStrokeWidth)
  ctx.clearRect(0, 0, renderData.canvas.width, renderData.canvas.height)
  ctx.fillStyle = RISINGSTONES_TEMPLATE.background
  ctx.fillRect(0, 0, renderData.canvas.width, renderData.canvas.height)

  if (strokeWidth > 0) {
    ctx.strokeStyle = RISINGSTONES_TEMPLATE.borderColor
    ctx.lineWidth = strokeWidth
    ctx.strokeRect(strokeWidth / 2, strokeWidth / 2, renderData.canvas.width - strokeWidth, renderData.canvas.height - strokeWidth)
  }

  drawRisingstonesImage(ctx, renderData, resolveImage)
  drawRisingstonesHeader(ctx, renderData, resolveImage)
  drawRisingstonesEquipment(ctx, options)
  drawRisingstonesCopyright(ctx, renderData)
}

function renderSilenceFashionTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, resolveImage } = options
  ctx.clearRect(0, 0, renderData.canvas.width, renderData.canvas.height)
  drawSilenceFashionBackground(ctx, options)
  drawSilenceFashionImages(ctx, renderData, resolveImage)
  drawSilenceFashionHeader(ctx, renderData)

  if (isSilenceFashionEnJaMode(renderData)) {
    drawSilenceFashionEnJaEquipment(ctx, renderData)
  } else {
    drawSilenceFashionZhEquipment(ctx, renderData, renderData.rows.filter((row) => row.itemName))
  }
}

export function drawGlamourTemplateImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imageWidth = image.naturalWidth || image.width
  const imageHeight = image.naturalHeight || image.height

  if (imageWidth <= 0 || imageHeight <= 0 || width <= 0 || height <= 0) {
    return
  }

  const scale = Math.max(width / imageWidth, height / imageHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = Math.max(0, (imageWidth - sourceWidth) / 2)
  const sourceY = Math.max(0, (imageHeight - sourceHeight) / 2)

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  drawGlamourTemplateImageResampled(ctx, image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
  ctx.restore()
}

function drawGlamourTemplateImageResampled(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) {
    return
  }

  let source: CanvasImageSource = image
  let sourceWidth = sw
  let sourceHeight = sh
  let sourceX = sx
  let sourceY = sy

  while (sourceWidth / dw > 2 || sourceHeight / dh > 2) {
    const nextWidth = Math.max(dw, Math.round(sourceWidth / 2))
    const nextHeight = Math.max(dh, Math.round(sourceHeight / 2))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(nextWidth))
    canvas.height = Math.max(1, Math.round(nextHeight))
    const nextCtx = canvas.getContext('2d')

    if (!nextCtx) {
      break
    }

    nextCtx.imageSmoothingEnabled = true
    nextCtx.imageSmoothingQuality = 'high'
    nextCtx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)
    source = canvas
    sourceWidth = canvas.width
    sourceHeight = canvas.height
    sourceX = 0
    sourceY = 0
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, dx, dy, dw, dh)
}

function createGlamourTemplateLuminanceMaskCanvas(
  maskImage: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement | null {
  const outputWidth = Math.max(1, Math.ceil(width))
  const outputHeight = Math.max(1, Math.ceil(height))
  const cacheKey = [maskImage.currentSrc || maskImage.src || '', outputWidth, outputHeight].join('|')
  const cached = glamourTemplateLuminanceMaskCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const output = document.createElement('canvas')
  output.width = outputWidth
  output.height = outputHeight
  const outputCtx = output.getContext('2d', { willReadFrequently: true })

  if (!outputCtx) {
    return null
  }

  try {
    outputCtx.drawImage(maskImage, 0, 0, outputWidth, outputHeight)
    const imageData = outputCtx.getImageData(0, 0, outputWidth, outputHeight)
    const pixels = imageData.data

    for (let index = 0; index < pixels.length; index += 4) {
      const alphaFromLightness = Math.round((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3)
      pixels[index] = 255
      pixels[index + 1] = 255
      pixels[index + 2] = 255
      pixels[index + 3] = Math.round((pixels[index + 3] * alphaFromLightness) / 255)
    }

    outputCtx.putImageData(imageData, 0, 0)
  } catch {
    return null
  }

  glamourTemplateLuminanceMaskCache.set(cacheKey, output)
  return output
}

export function drawGlamourTemplateMaskedImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  maskImage: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const offscreen = document.createElement('canvas')
  offscreen.width = Math.max(1, Math.round(width))
  offscreen.height = Math.max(1, Math.round(height))
  const offscreenCtx = offscreen.getContext('2d')

  if (!offscreenCtx) {
    drawGlamourTemplateImageCover(ctx, image, x, y, width, height)
    return
  }

  drawGlamourTemplateImageCover(offscreenCtx, image, 0, 0, offscreen.width, offscreen.height)
  const luminanceMask = createGlamourTemplateLuminanceMaskCanvas(maskImage, offscreen.width, offscreen.height)

  if (!luminanceMask) {
    ctx.drawImage(offscreen, x, y, width, height)
    return
  }

  offscreenCtx.globalCompositeOperation = 'destination-in'
  offscreenCtx.drawImage(luminanceMask, 0, 0)
  offscreenCtx.globalCompositeOperation = 'source-over'
  ctx.drawImage(offscreen, x, y, width, height)
}

export function renderGlamourTemplateCanvas(
  ctx: CanvasRenderingContext2D,
  options: GlamourTemplateCanvasRenderContext
) {
  if (options.renderData.template.renderMode === 'eorzea') {
    renderEorzeaTemplateCanvas(ctx, options)
    return
  }

  if (options.renderData.template.renderMode === 'horizontal') {
    renderHorizontalTemplateCanvas(ctx, options)
    return
  }

  if (options.renderData.template.renderMode === 'double-pic') {
    renderDoublePicTemplateCanvas(ctx, options)
    return
  }

  if (options.renderData.template.renderMode === 'risingstones') {
    renderRisingstonesTemplateCanvas(ctx, options)
    return
  }

  if (options.renderData.template.renderMode === 'ec') {
    renderEcTemplateCanvas(ctx, options)
    return
  }

  if (options.renderData.template.renderMode === 'silence-fashion') {
    renderSilenceFashionTemplateCanvas(ctx, options)
    return
  }

  renderGlamourTemplateCanvasFallback(ctx, options)
}

export function renderGlamourTemplateCanvasFallback(
  ctx: CanvasRenderingContext2D,
  options: GlamourTemplateCanvasRenderContext
) {
  const { renderData, resolveImage } = options
  const { width, height } = renderData.canvas
  const scale = Math.max(0.65, Math.min(width, height) / 3840)
  const contentPadding = Math.round(Math.min(width, height) * 0.055)
  const panelWidth = Math.round(width * 0.38)
  const panelX = width - panelWidth - contentPadding
  const panelY = contentPadding
  const panelHeight = height - contentPadding * 2

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  for (const slot of renderData.canvas.imageSlots) {
    const image = resolveImage(slot.id)
    ctx.fillStyle = '#d8d8d8'
    ctx.fillRect(slot.region.x, slot.region.y, slot.region.width, slot.region.height)

    if (image) {
      drawGlamourTemplateImageCover(
        ctx,
        image.image,
        slot.region.x,
        slot.region.y,
        slot.region.width,
        slot.region.height
      )
    }
  }

  ctx.fillStyle = renderData.style.panelColor || '#fffaf2'
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight)
  ctx.strokeStyle = 'rgba(20, 28, 45, 0.18)'
  ctx.lineWidth = Math.max(2, Math.round(2 * scale))
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight)

  ctx.fillStyle = renderData.style.textColor || '#2d2d2d'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.font = `700 ${Math.round(46 * scale)}px "Noto Sans SC", "Microsoft YaHei", sans-serif`
  ctx.fillText(renderData.text.title || renderData.template.name, panelX + contentPadding, panelY + contentPadding)

  let cursorY = panelY + contentPadding + Math.round(82 * scale)
  ctx.font = `600 ${Math.round(28 * scale)}px "Noto Sans SC", "Microsoft YaHei", sans-serif`

  for (const row of renderData.rows.filter((item) => item.itemName).slice(0, 14)) {
    const slotNameWidth = Math.round(138 * scale)
    ctx.fillStyle = 'rgba(20, 28, 45, 0.55)'
    ctx.fillText(row.slotName, panelX + contentPadding, cursorY)
    ctx.fillStyle = renderData.style.textColor || '#2d2d2d'
    ctx.fillText(row.itemName, panelX + contentPadding + slotNameWidth, cursorY)
    cursorY += Math.round(row.hasDyeLine ? 58 * scale : 42 * scale)

    if (row.hasDyeLine && row.dyeText) {
      ctx.fillStyle = 'rgba(20, 28, 45, 0.58)'
      ctx.font = `500 ${Math.round(23 * scale)}px "Noto Sans SC", "Microsoft YaHei", sans-serif`
      ctx.fillText(row.dyeText, panelX + contentPadding + slotNameWidth, cursorY)
      ctx.font = `600 ${Math.round(28 * scale)}px "Noto Sans SC", "Microsoft YaHei", sans-serif`
      cursorY += Math.round(40 * scale)
    }
  }
}
