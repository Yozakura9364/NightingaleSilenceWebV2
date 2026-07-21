import type { GlamourTemplateRenderData } from '@/lib/glamour/templates/renderData'
import type {
  GlamourTemplateCanvasRenderContext
} from './types'
import {
  HORIZONTAL_TEMPLATE,
  type HorizontalEquipmentRow
} from './layouts'
import {
  horizontalUnit,
  horizontalUnitY,
  horizontalRect
} from './utils'
import {
  drawGlamourTemplateImageCover
} from './canvas'

export function getHorizontalRowAdvance(row: HorizontalEquipmentRow) {
  const area = HORIZONTAL_TEMPLATE.equipmentText
  return area.itemLineHeight + (row.hasDyeLine ? area.dyeLineHeight : 0) + area.groupGap
}

export function getHorizontalRowInkHeight(row: HorizontalEquipmentRow) {
  const area = HORIZONTAL_TEMPLATE.equipmentText
  return row.hasDyeLine ? area.itemLineHeight + area.dyeInkHeight : area.itemInkHeight
}

export function getHorizontalEquipmentHeight(rows: HorizontalEquipmentRow[]) {
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

export function getHorizontalVisibleRows(rows: HorizontalEquipmentRow[]) {
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

export function getHorizontalContentLayout(rows: HorizontalEquipmentRow[]) {
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

export function makeHorizontalEquipmentFont(size: number) {
  return `300 ${size}px "Source Sans 3", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif`
}

export function getHorizontalFittedFontSize(
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

export function drawHorizontalBackground(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, assets } = options
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, renderData.canvas.width, renderData.canvas.height)

  const background = assets?.['horizontal-background']?.image

  if (background) {
    ctx.drawImage(background, 0, 0, renderData.canvas.width, renderData.canvas.height)
  }
}

export function drawHorizontalImageSlots(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
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

export function drawHorizontalTitle(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData, titleY: number) {
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

export function drawHorizontalTitleLine(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData, lineY: number) {
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

export function drawHorizontalEquipmentText(
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

export function renderHorizontalTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
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
