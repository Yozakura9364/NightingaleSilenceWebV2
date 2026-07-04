import { getCustomPortraitSourceDrawRect } from '@/lib/plate/customPortrait'
import {
  NSPLATE_CANVAS_DIMENSIONS,
  getNameplateRenderSegments,
  getPlateLayerImageUrl,
  type NSPlateLayerPosition,
  type NSPlateNameplateRenderSegment,
  type NSPlateNameplateRenderPlan,
  type NSPlateRenderImageLayer
} from '@/lib/plate/render'
import type {
  NSPlateCustomPortraitImage,
  NSPlateLayeredExportLayer,
  NSPlateLayeredExportOptions,
  NSPlateLayeredExportPayload
} from '@/lib/plate/types'

const CUSTOM_PORTRAIT_LAYER_NAME = '自定义图片'
const CUSTOM_PORTRAIT_POPOUT_LAYER_NAME = '自定义图片（出框）'
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50
const ZIP_END_SIGNATURE = 0x06054b50
const ZIP_VERSION_NEEDED = 20
const ZIP_ENCODER = new TextEncoder()
const CRC32_TABLE = createCrc32Table()

export async function createNameplateLayeredExportPayload(
  plan: NSPlateNameplateRenderPlan,
  options: NSPlateLayeredExportOptions
): Promise<NSPlateLayeredExportPayload> {
  const scale = normalizeExportScale(options.scale)
  const layers: NSPlateLayeredExportLayer[] = []

  for (const segment of getNameplateRenderSegments(plan)) {
    await pushSegmentLayers(layers, segment, scale)
  }

  return {
    layers,
    canvasWidth: Math.round(plan.dimensions.width * scale),
    canvasHeight: Math.round(plan.dimensions.height * scale)
  }
}

async function pushSegmentLayers(
  output: NSPlateLayeredExportLayer[],
  segment: NSPlateNameplateRenderSegment,
  scale: number
) {
  if (segment.type === 'systemLayers') {
    await pushSystemLayers(output, segment.layers, scale)
    return
  }

  if (segment.type === 'portraitComposite') {
    await pushPortraitSystemLayers(
      output,
      segment.portraitBaseLayers,
      segment.portraitEmbed,
      scale
    )

    const customInFrameLayer = await createCustomPortraitInFrameLayer(
      segment.customPortrait,
      segment.portraitEmbed,
      scale
    )

    if (customInFrameLayer) {
      output.push(customInFrameLayer)
    }

    await pushPortraitSystemLayers(
      output,
      segment.portraitOverlayLayers,
      segment.portraitEmbed,
      scale
    )
    return
  }

  const customPopoutLayer = await createCustomPortraitPopoutLayer(
    segment.customPortrait,
    segment.portraitEmbed,
    segment.dimensions,
    scale
  )

  if (customPopoutLayer) {
    output.push(customPopoutLayer)
  }
}

export function downloadPlateLayeredZip(blob: Blob, scale: number) {
  const scaleSuffix = scale > 1 ? `_${Math.round(scale)}x` : ''
  const filename = `layered_export_${Date.now()}${scaleSuffix}.zip`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.download = filename
  link.href = url
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  return filename
}

export async function createLayeredZipBlobOnClient(
  payload: NSPlateLayeredExportPayload
): Promise<Blob> {
  const canvasWidth = normalizeCanvasSize(payload.canvasWidth)
  const canvasHeight = normalizeCanvasSize(payload.canvasHeight)
  const files: NSPlateZipFileEntry[] = []

  for (let index = 0; index < payload.layers.length; index += 1) {
    const layer = payload.layers[index]
    const fullCanvasBlob = await placeLayerOnFullCanvas(layer, canvasWidth, canvasHeight)
    const bytes = new Uint8Array(await fullCanvasBlob.arrayBuffer())

    files.push({
      name: `L${String(index).padStart(3, '0')}.png`,
      bytes
    })
  }

  return createStoredZipBlob(files)
}

async function pushSystemLayers(
  output: NSPlateLayeredExportLayer[],
  layers: NSPlateRenderImageLayer[],
  scale: number
) {
  for (const layer of layers) {
    const exportLayer = await createSystemLayerData(layer, layer.position, scale)

    if (exportLayer) {
      output.push(exportLayer)
    }
  }
}

async function pushPortraitSystemLayers(
  output: NSPlateLayeredExportLayer[],
  layers: NSPlateRenderImageLayer[],
  portraitEmbed: NSPlateLayerPosition,
  scale: number
) {
  for (const layer of layers) {
    const exportLayer = await createPortraitSystemLayerData(layer, portraitEmbed, scale)

    if (exportLayer) {
      output.push(exportLayer)
    }
  }
}

async function createSystemLayerData(
  layer: NSPlateRenderImageLayer,
  position: NSPlateLayerPosition,
  exportScale: number
) {
  const image = await loadLayerImage(getPlateLayerImageUrl(layer))

  if (!image) {
    return null
  }

  const layerScale = position.scale ?? 1
  const width = Math.max(1, Math.round(image.naturalWidth * layerScale * exportScale))
  const height = Math.max(1, Math.round(image.naturalHeight * layerScale * exportScale))
  const canvas = createLayerCanvas(width, height)
  const context = getLayerContext(canvas, false)

  context.drawImage(image, 0, 0, width, height)

  return {
    name: layer.category,
    x: Math.round(position.x * exportScale),
    y: Math.round(position.y * exportScale),
    width,
    height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'system'
  } satisfies NSPlateLayeredExportLayer
}

async function createPortraitSystemLayerData(
  layer: NSPlateRenderImageLayer,
  portraitEmbed: NSPlateLayerPosition,
  exportScale: number
) {
  const image = await loadLayerImage(getPlateLayerImageUrl(layer))

  if (!image) {
    return null
  }

  const layerScale = layer.position.scale ?? 1
  const width = Math.max(1, Math.round(image.naturalWidth * layerScale))
  const height = Math.max(1, Math.round(image.naturalHeight * layerScale))
  const offsetX =
    layer.placement === 'center' && width <= NSPLATE_CANVAS_DIMENSIONS.portrait.width
      ? (NSPLATE_CANVAS_DIMENSIONS.portrait.width - width) / 2
      : layer.position.x
  const offsetY =
    layer.placement === 'center' && height <= NSPLATE_CANVAS_DIMENSIONS.portrait.height
      ? (NSPLATE_CANVAS_DIMENSIONS.portrait.height - height) / 2
      : layer.position.y
  const canvas = createLayerCanvas(
    Math.max(1, Math.round(width * exportScale)),
    Math.max(1, Math.round(height * exportScale))
  )
  const context = getLayerContext(canvas, false)

  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return {
    name: layer.category,
    x: Math.round((portraitEmbed.x + offsetX) * exportScale),
    y: Math.round((portraitEmbed.y + offsetY) * exportScale),
    width: canvas.width,
    height: canvas.height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'system'
  } satisfies NSPlateLayeredExportLayer
}

async function createCustomPortraitInFrameLayer(
  customPortrait: NSPlateCustomPortraitImage | null,
  portraitEmbed: NSPlateLayerPosition,
  exportScale: number
) {
  if (!customPortrait) {
    return null
  }

  const portrait = NSPLATE_CANVAS_DIMENSIONS.portrait
  const canvas = createLayerCanvas(
    Math.round(portrait.width * exportScale),
    Math.round(portrait.height * exportScale)
  )
  const context = getLayerContext(canvas, true)

  if (customPortrait.mode === 'popout') {
    const image = await loadLayerImage(customPortrait.sourceDataUrl ?? customPortrait.dataUrl)

    if (!image) {
      return null
    }

    const rect = getCustomPortraitSourceDrawRect(customPortrait)
    const splitY = Math.round(customPortrait.splitY ?? 0)

    context.save()
    context.beginPath()
    context.rect(
      0,
      splitY * exportScale,
      canvas.width,
      Math.max(0, (portrait.height - splitY) * exportScale)
    )
    context.clip()
    context.drawImage(
      image,
      rect.x * exportScale,
      rect.y * exportScale,
      rect.width * exportScale,
      rect.height * exportScale
    )
    context.restore()
  } else {
    const image = await loadLayerImage(customPortrait.dataUrl)

    if (!image) {
      return null
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  }

  return {
    name: CUSTOM_PORTRAIT_LAYER_NAME,
    x: Math.round(portraitEmbed.x * exportScale),
    y: Math.round(portraitEmbed.y * exportScale),
    width: canvas.width,
    height: canvas.height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'custom'
  } satisfies NSPlateLayeredExportLayer
}

async function createCustomPortraitPopoutLayer(
  customPortrait: NSPlateCustomPortraitImage | null,
  portraitEmbed: NSPlateLayerPosition,
  dimensions: { width: number; height: number },
  exportScale: number
) {
  if (!customPortrait || customPortrait.mode !== 'popout') {
    return null
  }

  const image = await loadLayerImage(customPortrait.sourceDataUrl ?? customPortrait.dataUrl)

  if (!image) {
    return null
  }

  const rect = getCustomPortraitSourceDrawRect(customPortrait)
  const splitY = Math.round(customPortrait.splitY ?? 0)
  const canvas = createLayerCanvas(
    Math.round(dimensions.width * exportScale),
    Math.round(dimensions.height * exportScale)
  )
  const context = getLayerContext(canvas, true)

  context.save()
  context.beginPath()
  context.rect(0, 0, canvas.width, (portraitEmbed.y + splitY) * exportScale)
  context.clip()
  context.drawImage(
    image,
    (portraitEmbed.x + rect.x) * exportScale,
    (portraitEmbed.y + rect.y) * exportScale,
    rect.width * exportScale,
    rect.height * exportScale
  )
  context.restore()

  return {
    name: CUSTOM_PORTRAIT_POPOUT_LAYER_NAME,
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    rgbaData: canvas.toDataURL('image/png'),
    sourceType: 'custom'
  } satisfies NSPlateLayeredExportLayer
}

function createLayerCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  return canvas
}

function getLayerContext(canvas: HTMLCanvasElement, smoothing: boolean) {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('canvas-context')
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = smoothing

  if (smoothing && 'imageSmoothingQuality' in context) {
    context.imageSmoothingQuality = 'high'
  }

  return context
}

function normalizeExportScale(scale: number) {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('invalid-scale')
  }

  return scale
}

function loadLayerImage(source: string) {
  if (!source) {
    return Promise.resolve(null)
  }

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()

    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const finish = () => resolve(image)

      if (typeof image.decode === 'function') {
        void image.decode().then(finish).catch(finish)
      } else {
        finish()
      }
    }
    image.onerror = () => resolve(null)
    image.src = source
  })
}

interface NSPlateZipFileEntry {
  name: string
  bytes: Uint8Array
}

interface NSPlateCentralDirectoryEntry extends NSPlateZipFileEntry {
  crc: number
  localHeaderOffset: number
  nameBytes: Uint8Array
}

async function placeLayerOnFullCanvas(
  layer: NSPlateLayeredExportLayer,
  canvasWidth: number,
  canvasHeight: number
) {
  const image = await loadLayerImage(layer.rgbaData)

  if (!image) {
    throw new Error('layer-image-decode')
  }

  const canvas = createLayerCanvas(canvasWidth, canvasHeight)
  const context = getLayerContext(canvas, false)

  context.drawImage(image, Math.round(layer.x), Math.round(layer.y))
  return canvasToPngBlob(canvas)
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('canvas-blob'))
    }, 'image/png')
  })
}

function createStoredZipBlob(files: NSPlateZipFileEntry[]) {
  const chunks: Uint8Array[] = []
  const centralDirectory: NSPlateCentralDirectoryEntry[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = ZIP_ENCODER.encode(file.name)
    const crc = crc32(file.bytes)
    const localHeader = createLocalFileHeader(nameBytes, file.bytes.length, crc)

    chunks.push(localHeader, file.bytes)
    centralDirectory.push({
      ...file,
      crc,
      localHeaderOffset: offset,
      nameBytes
    })
    offset += localHeader.length + file.bytes.length
  }

  const centralDirectoryOffset = offset
  for (const file of centralDirectory) {
    const centralHeader = createCentralDirectoryHeader(file)

    chunks.push(centralHeader)
    offset += centralHeader.length
  }

  chunks.push(
    createEndOfCentralDirectory(
      centralDirectory.length,
      offset - centralDirectoryOffset,
      centralDirectoryOffset
    )
  )

  return new Blob(chunks, { type: 'application/zip' })
}

function createLocalFileHeader(nameBytes: Uint8Array, size: number, crc: number) {
  const header = new Uint8Array(30 + nameBytes.length)
  const view = new DataView(header.buffer)

  view.setUint32(0, ZIP_LOCAL_FILE_HEADER_SIGNATURE, true)
  view.setUint16(4, ZIP_VERSION_NEEDED, true)
  view.setUint16(6, 0x0800, true)
  view.setUint16(8, 0, true)
  view.setUint32(14, crc, true)
  view.setUint32(18, size, true)
  view.setUint32(22, size, true)
  view.setUint16(26, nameBytes.length, true)
  header.set(nameBytes, 30)

  return header
}

function createCentralDirectoryHeader(file: NSPlateCentralDirectoryEntry) {
  const header = new Uint8Array(46 + file.nameBytes.length)
  const view = new DataView(header.buffer)

  view.setUint32(0, ZIP_CENTRAL_DIRECTORY_SIGNATURE, true)
  view.setUint16(4, ZIP_VERSION_NEEDED, true)
  view.setUint16(6, ZIP_VERSION_NEEDED, true)
  view.setUint16(8, 0x0800, true)
  view.setUint16(10, 0, true)
  view.setUint32(16, file.crc, true)
  view.setUint32(20, file.bytes.length, true)
  view.setUint32(24, file.bytes.length, true)
  view.setUint16(28, file.nameBytes.length, true)
  view.setUint32(42, file.localHeaderOffset, true)
  header.set(file.nameBytes, 46)

  return header
}

function createEndOfCentralDirectory(fileCount: number, centralSize: number, centralOffset: number) {
  const header = new Uint8Array(22)
  const view = new DataView(header.buffer)

  view.setUint32(0, ZIP_END_SIGNATURE, true)
  view.setUint16(8, fileCount, true)
  view.setUint16(10, fileCount, true)
  view.setUint32(12, centralSize, true)
  view.setUint32(16, centralOffset, true)

  return header
}

function createCrc32Table() {
  const table = new Uint32Array(256)

  for (let index = 0; index < table.length; index += 1) {
    let value = index

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }

    table[index] = value >>> 0
  }

  return table
}

function crc32(bytes: Uint8Array) {
  let value = 0xffffffff

  for (const byte of bytes) {
    value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8)
  }

  return (value ^ 0xffffffff) >>> 0
}

function normalizeCanvasSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('invalid-canvas-size')
  }

  return Math.max(1, Math.round(value))
}
