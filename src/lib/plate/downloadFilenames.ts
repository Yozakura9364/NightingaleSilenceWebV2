import type { NSPlateCanvasExportFormat } from '@/lib/plate/exportCanvas'

export function createNSPlateConfigFilename(date = new Date()) {
  return `plate-config_${formatNSPlateFilenameTimestamp(date)}.json`
}

export function createNSPlateCanvasImageFilename(
  format: NSPlateCanvasExportFormat,
  scale: number,
  date = new Date()
) {
  const scaleSuffix = createScaleSuffix(scale)
  const backgroundSuffix = format === 'jpg' ? '_white-bg' : ''

  return `plate-nameplate_${formatNSPlateFilenameTimestamp(date)}${scaleSuffix}${backgroundSuffix}.${format}`
}

export function createNSPlateLayeredZipFilename(scale: number, date = new Date()) {
  return `plate-layers_${formatNSPlateFilenameTimestamp(date)}${createScaleSuffix(scale)}.zip`
}

function createScaleSuffix(scale: number) {
  const normalizedScale = Number.isFinite(scale) ? Math.round(scale) : 1

  return normalizedScale > 1 ? `_${normalizedScale}x` : ''
}

function formatNSPlateFilenameTimestamp(date: Date) {
  const parts = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  ].map((part) => String(part).padStart(2, '0'))

  return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}`
}
