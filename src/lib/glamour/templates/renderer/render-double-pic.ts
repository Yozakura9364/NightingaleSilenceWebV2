import type { GlamourTemplateRenderData } from '@/lib/glamour/templates/renderData'
import type {
  GlamourTemplateCanvasRenderContext
} from './types'
import {
  DOUBLE_PIC_TEMPLATE
} from './layouts'
import {
  doublePicUnit,
  doublePicUnitY,
  doublePicRect,
  colorWithAlpha
} from './utils'
import {
  drawGlamourTemplateImageCover,
  drawGlamourTemplateMaskedImageCover
} from './canvas'

export function getDoublePicFont(size: number): string {
  return `${DOUBLE_PIC_TEMPLATE.fontWeight} ${size}px ${DOUBLE_PIC_TEMPLATE.fontFamily}`
}

export function getDoublePicEquipmentLines(renderData: GlamourTemplateRenderData): string[] {
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

export function drawDoublePicEquipmentTextShape(
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

export function createDoublePicSpreadMaskCanvas(maskCanvas: HTMLCanvasElement, spreadRadius: number): HTMLCanvasElement {
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

export function drawDoublePicMaskOuterGlow(
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

export function drawDoublePicEquipmentText(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
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

export function drawDoublePicCenteredTextShape(
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

export function drawDoublePicCopyright(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
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

export function renderDoublePicTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
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
