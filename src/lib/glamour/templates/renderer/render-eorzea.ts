import type { GlamourTemplateRenderData } from '@/lib/glamour/templates/renderData'
import type {
  GlamourTemplateCanvasRenderContext,
  GlamourTemplateImageResolver
} from './types'
import {
  EORZEA_TEMPLATE,
  type EorzeaTemplateLayout
} from './layouts'
import {
  templateUnit,
  drawTextWithTracking,
  fillRoundedRect,
  makeRoundedRectPath,
  normalizeHexColor,
  getReadableTextColor,
  drawClippedTextInBox
} from './utils'
import {
  drawGlamourTemplateImageCover
} from './canvas'

export function getEorzeaEquipmentLayout(rowCount: number): EorzeaTemplateLayout {
  if (rowCount >= 7) {
    return EORZEA_TEMPLATE.layouts.compact
  }

  if (rowCount === 6) {
    return EORZEA_TEMPLATE.layouts.sixRows
  }

  return EORZEA_TEMPLATE.layouts.roomy
}

export function eorzeaRect(renderData: GlamourTemplateRenderData, rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: templateUnit(renderData, rect.x),
    y: templateUnit(renderData, rect.y),
    width: templateUnit(renderData, rect.width),
    height: templateUnit(renderData, rect.height)
  }
}

export function drawEorzeaBackground(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, assets } = options

  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, renderData.canvas.width, renderData.canvas.height)

  const background = assets?.['figma-background']?.image

  if (background) {
    ctx.drawImage(background, 0, 0, renderData.canvas.width, renderData.canvas.height)
  }
}

export function drawEorzeaGuides(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
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

export function drawEorzeaTitle(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
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

export function normalizeEorzeaDyeLabel(name: string, isEmpty: boolean, locale: string): string {
  const text = String(name || '').trim()

  if (isEmpty) {
    return text
  }

  if (locale === 'en') {
    return text
  }

  const suffix = locale === 'tc' ? '染劑' : '染剂'
  return /染剂$/u.test(text) || /染劑$/u.test(text) ? text.replace(/染剂$/u, suffix) : `${text}${suffix}`
}

export function drawEorzeaDyeFrame(
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

export function drawEorzeaColorPill(
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

export function drawEorzeaDye(
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

export function drawEorzeaEquipment(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
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

export function drawEorzeaImageSlots(
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

export function renderEorzeaTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, resolveImage } = options
  ctx.clearRect(0, 0, renderData.canvas.width, renderData.canvas.height)
  drawEorzeaBackground(ctx, options)
  drawEorzeaGuides(ctx, renderData)
  drawEorzeaTitle(ctx, renderData)
  drawEorzeaEquipment(ctx, renderData)
  drawEorzeaImageSlots(ctx, renderData, resolveImage)
}
