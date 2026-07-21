import type { GlamourTemplateRenderData } from '@/lib/glamour/templates/renderData'
import type {
  GlamourTemplateCanvasRenderContext,
  GlamourTemplateImageResolver
} from './types'
import {
  RISINGSTONES_TEMPLATE,
  EC_TEMPLATE_LAYOUTS,
  type RisingstonesEquipmentLayout
} from './layouts'
import {
  normalizeDyeLabel,
  normalizeHexColor,
  getRisingstonesScale,
  drawClippedTextInBox,
  getTextInkCenterBaseline,
  drawEcFittedItemName,
  drawClearDyeIcon,
  makeRoundedRectPath,
  fillRoundedRect,
  fitCanvasFont
} from './utils'
import {
  drawGlamourTemplateImageCover
} from './canvas'
import {
  GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID
} from '@/lib/glamour/templates/definitions'

export function getRisingstonesRect(renderData: GlamourTemplateRenderData, rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: getRisingstonesScale(renderData, rect.x),
    y: getRisingstonesScale(renderData, rect.y),
    width: getRisingstonesScale(renderData, rect.width),
    height: getRisingstonesScale(renderData, rect.height)
  }
}

export function getRisingstonesEquipmentScale(rowCount: number, layout: RisingstonesEquipmentLayout): number {
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

export function getRisingstonesNameWidth(renderData: GlamourTemplateRenderData, layout: RisingstonesEquipmentLayout): number {
  const avatarRight = RISINGSTONES_TEMPLATE.avatarRegion.x + RISINGSTONES_TEMPLATE.avatarRegion.width
  const defaultRight = layout.nameX + layout.nameWidth
  const nameRight = Math.max(defaultRight, avatarRight)
  return getRisingstonesScale(renderData, Math.max(0, nameRight - layout.nameX))
}

export function drawRisingstonesImage(
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

export function drawRisingstonesAvatar(
  ctx: CanvasRenderingContext2D,
  options: GlamourTemplateCanvasRenderContext,
  resolveImage: GlamourTemplateImageResolver
) {
  const { renderData } = options
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

export function drawRisingstonesFittedText(
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

export function drawRisingstonesHeader(
  ctx: CanvasRenderingContext2D,
  options: GlamourTemplateCanvasRenderContext
) {
  const { renderData } = options
  const authorRightBleed = Math.max(
    0,
    RISINGSTONES_TEMPLATE.source.x +
      RISINGSTONES_TEMPLATE.source.width -
      (RISINGSTONES_TEMPLATE.author.x + RISINGSTONES_TEMPLATE.author.width)
  )

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

export function drawRisingstonesIcon(
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

export function measureRisingstonesDyeChip(
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

export function drawRisingstonesDyeChip(
  ctx: CanvasRenderingContext2D,
  options: GlamourTemplateCanvasRenderContext,
  rowY: number,
  dye: { name: string; hex?: string; isEmpty: boolean },
  x: number,
  maxWidth: number,
  scale: number
) {
  const { renderData, assets } = options
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

  if (dye.isEmpty && drawClearDyeIcon(ctx, assets, dotX, dotY, dotSize, dotSize)) {
    // The clear icon occupies the same box as the color swatch.
  } else {
    ctx.fillStyle = dye.isEmpty ? '#d4d4d4' : normalizeHexColor(dye.hex, '#98cce0')
    fillRoundedRect(ctx, dotX, dotY, dotSize, dotSize, radius)
    ctx.strokeStyle = RISINGSTONES_TEMPLATE.borderColor
    ctx.lineWidth = Math.max(1, getRisingstonesScale(renderData, layout.dyeDotStrokeWidth * scale))
    makeRoundedRectPath(ctx, dotX, dotY, dotSize, dotSize, radius)
    ctx.stroke()
  }

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

export function drawRisingstonesEquipment(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
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
        nameMinSize: layout.nameMinSize * scale,
        nameWeight: layout.nameWeight,
        fontFamily: layout.fontFamily,
        inkCenter: true
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

      dyeX += drawRisingstonesDyeChip(ctx, options, rowY, dye, dyeX, maxWidth, scale) + dyeGap
    })
  })
}

export function drawRisingstonesCopyright(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
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

export function renderRisingstonesTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
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
  drawRisingstonesAvatar(ctx, options, resolveImage)
  drawRisingstonesHeader(ctx, options)
  drawRisingstonesEquipment(ctx, options)
  drawRisingstonesCopyright(ctx, renderData)
}
