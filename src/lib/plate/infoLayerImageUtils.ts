import type {
  NSPlateInfoBar48RenderLayer,
  NSPlateInfoIconRenderLayer,
  NSPlateInfoSpecialRenderLayer
} from '@/lib/plate/infoLayerRenderTypes'

export function clampInfoLayerAlpha(value: number) {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(1, Math.max(0, value))
}

export function shouldSmoothWhenScaledDown(
  image: HTMLImageElement,
  drawWidth: number,
  drawHeight: number
) {
  const sourceWidth = Math.max(1, Number(image.naturalWidth) || Number(image.width) || 1)
  const sourceHeight = Math.max(1, Number(image.naturalHeight) || Number(image.height) || 1)
  const targetWidth = Math.max(1, Number(drawWidth) || 1)
  const targetHeight = Math.max(1, Number(drawHeight) || 1)

  return targetWidth < sourceWidth || targetHeight < sourceHeight
}

export function setInfoCanvasImageSmoothing(
  context: CanvasRenderingContext2D,
  enabled: boolean
) {
  context.imageSmoothingEnabled = enabled

  if ('imageSmoothingQuality' in context) {
    context.imageSmoothingQuality = enabled ? 'high' : 'low'
  }
}

export function resolveInfoIconDrawSize(
  image: HTMLImageElement,
  layer: NSPlateInfoIconRenderLayer
) {
  if (
    layer.sizeMode === 'fixed' &&
    Number.isFinite(layer.targetSize) &&
    Number(layer.targetSize) > 0
  ) {
    const size = Math.max(1, Math.round(Number(layer.targetSize)))
    return { width: size, height: size }
  }

  const scale = Number.isFinite(layer.scale) && layer.scale > 0 ? layer.scale : 1
  return {
    width: Math.max(1, Math.round(image.naturalWidth * scale)),
    height: Math.max(1, Math.round(image.naturalHeight * scale))
  }
}

export function resolveInfoSpecialDrawSize(
  image: HTMLImageElement,
  layer: NSPlateInfoSpecialRenderLayer
) {
  if (
    layer.sizeMode === 'fixed' &&
    Number.isFinite(layer.targetSize) &&
    Number(layer.targetSize) > 0
  ) {
    const size = Math.max(1, Math.round(Number(layer.targetSize)))
    return { width: size, height: size }
  }

  const scale = Number.isFinite(layer.scale) && layer.scale > 0 ? layer.scale : 1
  return {
    width: Math.max(1, Math.round(image.naturalWidth * scale)),
    height: Math.max(1, Math.round(image.naturalHeight * scale))
  }
}

export function tintInfoSpecialMaskImage(
  maskImage: HTMLImageElement,
  backgroundImage: HTMLImageElement,
  width: number,
  height: number,
  darkHex: string,
  lightHex: string
) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return null
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  setInfoCanvasImageSmoothing(
    context,
    shouldSmoothWhenScaledDown(maskImage, canvas.width, canvas.height)
  )
  context.drawImage(maskImage, 0, 0, canvas.width, canvas.height)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const backgroundData = getInfoSpecialBackgroundPixelData(
    backgroundImage,
    canvas.width,
    canvas.height
  )
  const dark = parseInfoSpecialHexColor(darkHex, '#5f3c22')
  const light = parseInfoSpecialHexColor(lightHex, '#f6d9a7')

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3]

    if (alpha === 0) {
      continue
    }

    if (backgroundData) {
      const backgroundAlpha = backgroundData[index + 3]

      if (backgroundAlpha === 0 || !isInfoSpecialBackgroundWhite(backgroundData, index)) {
        data[index + 3] = 0
        continue
      }
    }

    const colorMix = (data[index] + data[index + 1] + data[index + 2]) / 765
    data[index] = Math.round(dark.r + (light.r - dark.r) * colorMix)
    data[index + 1] = Math.round(dark.g + (light.g - dark.g) * colorMix)
    data[index + 2] = Math.round(dark.b + (light.b - dark.b) * colorMix)
  }

  context.putImageData(imageData, 0, 0)
  return canvas
}

export function isDefaultInfoBar48SpritePair(layer: NSPlateInfoBar48RenderLayer) {
  const emptyPath = normalizeBar48PathForCompare(layer.emptySource.url)
  const fillPath = normalizeBar48PathForCompare(layer.fillSource?.url ?? '')

  return (
    emptyPath.endsWith('ui/sprites/charactercard_3.png') &&
    fillPath.endsWith('ui/sprites/charactercard_4.png')
  )
}

function getInfoSpecialBackgroundPixelData(
  backgroundImage: HTMLImageElement,
  width: number,
  height: number
) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return null
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  setInfoCanvasImageSmoothing(context, false)
  context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
  return context.getImageData(0, 0, canvas.width, canvas.height).data
}

function isInfoSpecialBackgroundWhite(data: Uint8ClampedArray, index: number) {
  return data[index] === 255 && data[index + 1] === 255 && data[index + 2] === 255
}

function parseInfoSpecialHexColor(value: string, fallback: string) {
  const source = /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback
  const raw = source.slice(1)

  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16)
  }
}

function normalizeBar48PathForCompare(value: string) {
  return value.replace(/\\/g, '/').toLowerCase()
}
