import type { GlamourTemplateRenderData } from '@/lib/glamour/templates/renderData'
import type { GlamourTemplateRow } from '@/lib/glamour/templates/rows'
import type {
  GlamourTemplateCanvasRenderContext,
  GlamourTemplateImageResolver
} from './types'
import {
  SILENCE_FASHION_TEMPLATE
} from './layouts'
import {
  getSilenceFashionScale,
  getSilenceFashionScaleY
} from './utils'
import {
  drawGlamourTemplateImageCover
} from './canvas'
import {
  GLAMOUR_TEMPLATE_DEFAULT_IMAGE_SLOT_ID,
  GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID
} from '@/lib/glamour/templates/definitions'

export function getSilenceFashionRect(
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

export function isSilenceFashionEnJaMode(renderData: GlamourTemplateRenderData): boolean {
  return renderData.locales.includes('ja') && renderData.locales.includes('en')
}

export function getSilenceFashionSerifFamily(renderData: GlamourTemplateRenderData): string {
  if (!isSilenceFashionEnJaMode(renderData) && renderData.locale === 'ko') {
    return SILENCE_FASHION_TEMPLATE.koSerifFamily
  }

  return SILENCE_FASHION_TEMPLATE.serifFamily
}

export function getSilenceFashionRows(renderData: GlamourTemplateRenderData, locale: string): GlamourTemplateRow[] {
  return renderData.localizedRows.find((entry) => entry.locale === locale)?.rows || []
}

export function getSilenceFashionTextWidth(renderData: GlamourTemplateRenderData, x: number, fallbackWidth: number): number {
  return SILENCE_FASHION_TEMPLATE.equipmentRight > 0
    ? Math.max(1, getSilenceFashionScale(renderData, SILENCE_FASHION_TEMPLATE.equipmentRight) - x)
    : fallbackWidth
}

export function getSilenceFashionEquipmentBottomY(
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

export function wrapSilenceFashionText(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const tokens = String(text || '').trim().match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*\s*|[^\s]+\s*|\s+/gu) || []
  const lines: string[] = []
  let line = ''

  for (const token of tokens) {
    const next = `${line}${token}`

    if (line && ctx.measureText(next).width > width) {
      lines.push(line)
      line = token

      if (ctx.measureText(line).width > width) {
        const splitLines = splitSilenceFashionTokenByWidth(ctx, line, width)
        lines.push(...splitLines.slice(0, -1))
        line = splitLines[splitLines.length - 1] || ''
      }
    } else {
      line = next

      if (ctx.measureText(line).width > width) {
        const splitLines = splitSilenceFashionTokenByWidth(ctx, line, width)
        lines.push(...splitLines.slice(0, -1))
        line = splitLines[splitLines.length - 1] || ''
      }
    }
  }

  if (line) {
    lines.push(line)
  }

  return lines
}

export function drawSilenceFashionTextFit(
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

export function drawSilenceFashionWrappedText(
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

export function drawSilenceFashionBackground(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
  const { renderData, assets } = options
  const background = assets?.['silence-fashion-background']?.image

  if (background) {
    ctx.drawImage(background, 0, 0, renderData.canvas.width, renderData.canvas.height)
    return
  }

  ctx.fillStyle = '#f8f8f6'
  ctx.fillRect(0, 0, renderData.canvas.width, renderData.canvas.height)
}

export function drawSilenceFashionImages(
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

export function drawSilenceFashionHeader(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
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

export function drawSilenceFashionZhEquipment(
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

export function drawSilenceFashionEnJaEquipment(ctx: CanvasRenderingContext2D, renderData: GlamourTemplateRenderData) {
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

export function renderSilenceFashionTemplateCanvas(ctx: CanvasRenderingContext2D, options: GlamourTemplateCanvasRenderContext) {
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
