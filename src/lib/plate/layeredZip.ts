// 分层 ZIP 的清单、条目命名与客户端打包/下载。

import { createNSPlateLayeredZipFilename } from '@/lib/plate/downloadFilenames'
import {
  normalizeCanvasSize,
  placeLayerOnFullCanvas,
  revokeCanvasBlobUrl
} from '@/lib/plate/layerCanvasTools'
import type { NSPlateLayeredExportLayer, NSPlateLayeredExportPayload } from '@/lib/plate/types'
import { createStoredZipBlob, type StoredZipFileEntry } from '@/lib/plate/zipArchive'

const LAYERED_ZIP_TEXT_ENCODER = new TextEncoder()

export function downloadPlateLayeredZip(blob: Blob, scale: number) {
  const filename = createNSPlateLayeredZipFilename(scale)
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
  const files: StoredZipFileEntry[] = []
  const composerConfig = normalizeComposerConfig(payload.composerConfigFull)

  if (composerConfig) {
    files.push({
      name: 'composer-config.json',
      bytes: encodeJsonFile(composerConfig)
    })
  }

  const layerManifest = createLayeredZipManifest(payload.layers, canvasWidth, canvasHeight)
  const layerManifestBytes = encodeJsonFile(layerManifest)

  files.push(
    {
      name: 'layers.json',
      bytes: layerManifestBytes
    },
    {
      name: 'manifest.json',
      bytes: layerManifestBytes
    }
  )

  for (let index = 0; index < payload.layers.length; index += 1) {
    const layer = payload.layers[index]
    const fullCanvasBlob = await placeLayerOnFullCanvas(layer, canvasWidth, canvasHeight)
    const bytes = new Uint8Array(await fullCanvasBlob.arrayBuffer())

    files.push({
      name: createLayeredZipLayerEntryName(index),
      bytes
    })

    // Free blob URL memory for this layer
    revokeCanvasBlobUrl(layer.rgbaData)
  }

  return createStoredZipBlob(files)
}

function createLayeredZipManifest(
  layers: NSPlateLayeredExportLayer[],
  canvasWidth: number,
  canvasHeight: number
) {
  return {
    app: 'NSPlate',
    format: 'nsplate-layered-zip-manifest',
    version: 2,
    coordinateSpace: 'fullCanvasTopLeft',
    canvasWidth,
    canvasHeight,
    generatedAt: new Date().toISOString(),
    layers: layers.map((layer, index) => ({
      index,
      file: createLayeredZipLayerEntryName(index),
      name: layer.name,
      x: Math.round(layer.x),
      y: Math.round(layer.y),
      width: Math.round(layer.width),
      height: Math.round(layer.height),
      sourceType: layer.sourceType ?? 'unknown'
    }))
  }
}

function createLayeredZipLayerEntryName(index: number) {
  return `L${String(index).padStart(3, '0')}.png`
}

function normalizeComposerConfig(value: unknown): Record<string, unknown> | null {
  return isRecord(value) && Number(value.version) === 1 ? value : null
}

function encodeJsonFile(value: unknown) {
  return LAYERED_ZIP_TEXT_ENCODER.encode(`${JSON.stringify(value, null, 2)}\n`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
