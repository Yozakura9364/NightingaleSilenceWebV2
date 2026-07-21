import { createLruCache } from '@/lib/utils/lruCache'
import type { GlamourTemplateCanvasRenderContext } from './types'
import { renderEorzeaTemplateCanvas } from './render-eorzea'
import { renderHorizontalTemplateCanvas } from './render-horizontal'
import { renderDoublePicTemplateCanvas } from './render-double-pic'
import { renderRisingstonesTemplateCanvas } from './render-risingstones'
import { renderEcTemplateCanvas } from './render-ec'
import { renderSilenceFashionTemplateCanvas } from './render-silence'

export const glamourTemplateLuminanceMaskCache = createLruCache<string, HTMLCanvasElement>(50)

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
