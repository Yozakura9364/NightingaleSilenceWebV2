import { getItemCardLocaleStyle } from '@/pages/item-card/lib/cardSettings'
import type { ItemCardRenderSettings } from '@/pages/item-card/lib/types'

const SCALE = 2
const PADDING_X = 16
const PADDING_Y = 12

function fontStack(fontFamily: string): string {
  return `"${fontFamily}", "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif`
}

function titleLineHeight(titleSize: number): number {
  return Math.max(10, Math.round(titleSize * 1.12))
}

export async function renderCustomTextCanvas(
  text: string,
  settings: ItemCardRenderSettings
): Promise<HTMLCanvasElement> {
  const locale = settings.outputLocales[0] || 'zh'
  const style = getItemCardLocaleStyle(settings, locale)
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const font = `${style.titleWeight} ${style.titleSize}px ${fontStack(style.fontFamily)}`

  await document.fonts?.load?.(font)

  const measureCanvas = document.createElement('canvas')
  const measureContext = measureCanvas.getContext('2d')
  if (!measureContext) {
    return measureCanvas
  }
  measureContext.font = font
  const width = Math.max(
    120,
    Math.ceil(Math.max(...lines.map((line) => measureContext.measureText(line).width), 0)) +
      PADDING_X * 2
  )
  const height = Math.max(1, lines.length * titleLineHeight(style.titleSize) + PADDING_Y * 2)
  const canvas = document.createElement('canvas')
  canvas.width = width * SCALE
  canvas.height = height * SCALE
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return canvas
  }
  ctx.scale(SCALE, SCALE)
  ctx.font = font
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = settings.fontColor
  ctx.strokeStyle = settings.strokeColor
  ctx.lineJoin = 'round'
  ctx.lineWidth = settings.strokeEnabled ? Math.max(0, style.titleSize * settings.strokeRatio) : 0

  lines.forEach((line, index) => {
    const y = PADDING_Y + index * titleLineHeight(style.titleSize)
    if (ctx.lineWidth > 0) {
      ctx.strokeText(line, PADDING_X, y)
    }
    ctx.fillText(line, PADDING_X, y)
  })

  return canvas
}
