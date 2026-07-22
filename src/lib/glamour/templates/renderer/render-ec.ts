import type { GlamourTemplateRenderData } from '@/lib/glamour/templates/renderData'
import type { GlamourTemplateRow } from '@/lib/glamour/templates/rows'
import type {
  GlamourTemplateCanvasRenderContext,
  GlamourTemplateImageResolver
} from './types'
import {
  EC_TEMPLATE_COLORS,
  EC_TEMPLATE_TITLE,
  EC_TEMPLATE_SUBTITLE,
  EC_TEMPLATE_EQUIPMENT_HEADER,
  EC_TEMPLATE_COPYRIGHT,
  EC_TEMPLATE_CORNER_MARKS,
  EC_ITEM_RARITY_COLORS,
  type EcTemplateLayout
} from './layouts'
import {
  templateUnit,
  templateRect,
  fillRoundedRect,
  makeRoundedRectPath,
  normalizeHexColor,
  normalizeDyeLabel,
  getEcEquipmentLayout,
  drawEcCenteredFittedText,
  drawEcFittedItemName,
  drawClearDyeIcon
} from './utils'
import {
  drawGlamourTemplateImageCover
} from './canvas'

export function drawEcCornerMark(
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

export function drawEcFrame(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
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

export function normalizeEcSubtitlePart(value: unknown): string {
  return String(value || '').trim().replace(/\s+/gu, ' ').slice(0, 80)
}

export function normalizeEcSubtitleSymbol(value: unknown): string {
  return String(value || '♦').trim().slice(0, 4) || '♦'
}

export function drawEcMainImage(
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

export function drawEcHeader(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  drawEcCenteredFittedText(ctx, renderData, renderData.text.title || renderData.profile.defaultTopText, EC_TEMPLATE_TITLE, {
    color: EC_TEMPLATE_COLORS.accent,
    weight: 400,
    family: '"Josefin Sans", "Microsoft YaHei", sans-serif'
  })
  drawEcSubtitle(ctx, renderData)

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

export function drawEcSubtitle(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
  const parts = renderData.text.subtitleParts
  const left = normalizeEcSubtitlePart(parts?.left)
  const symbol = normalizeEcSubtitleSymbol(parts?.symbol)
  const right = normalizeEcSubtitlePart(parts?.right)
  const shouldDrawSplit = Boolean(left && symbol && right && !parts?.full)

  if (!shouldDrawSplit) {
    drawEcCenteredFittedText(ctx, renderData, renderData.text.subtitle, EC_TEMPLATE_SUBTITLE, {
      color: EC_TEMPLATE_COLORS.text,
      weight: 400,
      family: '"Source Sans 3", "Microsoft YaHei", sans-serif'
    })
    return
  }

  const box = templateRect(renderData, EC_TEMPLATE_SUBTITLE)
  const maxSize = templateUnit(renderData, EC_TEMPLATE_SUBTITLE.maxSize)
  const minSize = templateUnit(renderData, EC_TEMPLATE_SUBTITLE.minSize)
  let size = maxSize
  let measuredLeft = 0
  let measuredSymbol = 0
  let measuredRight = 0
  let gap = 0
  let totalWidth = 0

  do {
    ctx.font = `400 ${size}px "Source Sans 3", "Microsoft YaHei", sans-serif`
    measuredLeft = ctx.measureText(left).width
    measuredRight = ctx.measureText(right).width
    ctx.font = `400 ${size}px "NS Cambria", Cambria, serif`
    measuredSymbol = ctx.measureText(symbol).width
    gap = Math.round(size * 0.32)
    totalWidth = measuredLeft + measuredSymbol + measuredRight + gap * 2
    size -= 1
  } while (size >= minSize && totalWidth > box.width)

  const drawSize = size + 1
  const centerY = box.y + box.height / 2
  let cursorX = box.x + Math.max(0, (box.width - totalWidth) / 2)

  ctx.fillStyle = EC_TEMPLATE_COLORS.text
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `400 ${drawSize}px "Source Sans 3", "Microsoft YaHei", sans-serif`
  ctx.fillText(left, cursorX, centerY)
  cursorX += measuredLeft + gap

  ctx.font = `400 ${drawSize}px "NS Cambria", Cambria, serif`
  ctx.fillText(symbol, cursorX, centerY)
  cursorX += measuredSymbol + gap

  ctx.font = `400 ${drawSize}px "Source Sans 3", "Microsoft YaHei", sans-serif`
  ctx.fillText(right, cursorX, centerY)
}

export function drawEcIcon(
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

export function getEcItemNameColor(row: GlamourTemplateRow): string {
  const rarity = Number(row.item.rarity || 1)
  return EC_ITEM_RARITY_COLORS[rarity] || EC_ITEM_RARITY_COLORS[1]
}

export function getEcVariantLabel(row: GlamourTemplateRow): string {
  return String(row.item.ecVariantLabel || '').trim()
}

export function makeEcVariantDye(row: GlamourTemplateRow) {
  const label = getEcVariantLabel(row)
  return label ? { name: label, hex: '#a6adb4', isEmpty: false } : null
}

export function drawEcDyeChip(
  ctx: CanvasRenderingContext2D,
  options: GlamourTemplateCanvasRenderContext,
  rowY: number,
  dye: { name: string; hex?: string; isEmpty: boolean },
  dyeIndex: number,
  layout: EcTemplateLayout,
  previousRight = 0
) {
  const { renderData, assets } = options
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
  if (dye.isEmpty && drawClearDyeIcon(ctx, assets, dotX, dotY, dotSize, dotSize)) {
    // The clear icon occupies the same box as the color dot.
  } else {
    ctx.fillStyle = dye.isEmpty ? '#596069' : normalizeHexColor(dye.hex, '#89b8dc')
    ctx.beginPath()
    ctx.arc(dotX + dotSize / 2, dotY + dotSize / 2, dotSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = EC_TEMPLATE_COLORS.textDim
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, textX, y + height / 2)
  return x + width
}

export function drawEcEquipment(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
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

    const ecVariant = row.slot === 'Glasses' ? makeEcVariantDye(row) : null
    const dyes = ecVariant ? [ecVariant] : row.dyes || []
    const nameX = templateUnit(renderData, layout.nameX)
    const nameWidth = templateUnit(renderData, layout.nameWidth)
    const rowCenterY = rowY + layout.rowHeight / 2
    const dyeCenterY = rowY + layout.dyeYOffset + layout.dyeHeight / 2
    const nameCenterY = templateUnit(renderData, dyes.length ? rowCenterY * 2 - dyeCenterY : rowCenterY)
    ctx.fillStyle = getEcItemNameColor(row)
    drawEcFittedItemName(ctx, renderData, row.itemName, nameX, nameCenterY, nameWidth, layout)

    let dyeRight = 0
    dyes.slice(0, 2).forEach((dye, dyeIndex) => {
      dyeRight = drawEcDyeChip(ctx, options, rowY, dye, dyeIndex, layout, dyeRight)
    })
  })
}

export function drawEcCopyright(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
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

export function renderEcTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, resolveImage } = options
  ctx.clearRect(0, 0, renderData.canvas.width, renderData.canvas.height)
  drawEcFrame(ctx, renderData)
  drawEcMainImage(ctx, renderData, resolveImage)
  drawEcHeader(ctx, renderData)
  drawEcEquipment(ctx, options)
  drawEcCopyright(ctx, renderData)
}
