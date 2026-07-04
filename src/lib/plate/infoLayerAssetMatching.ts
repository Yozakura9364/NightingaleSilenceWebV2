import type { NSPlateAssetSummary } from '@/lib/plate/types'

export function nsPlateInfoAssetMatchesValue(asset: NSPlateAssetSummary, value: string) {
  const target = normalizeNSPlateInfoAssetToken(value)

  if (!target) {
    return false
  }

  return getNSPlateInfoAssetTokens(asset).includes(target)
}

export function getNSPlateInfoAssetItemId(asset: NSPlateAssetSummary) {
  return getNSPlateInfoAssetTokens(asset)[0] || normalizeNSPlateInfoAssetToken(asset.id) || asset.id
}

export function normalizeNSPlateInfoAssetValues(value: unknown, maxCount: number) {
  const source = Array.isArray(value)
    ? value
    : value === null || value === undefined || value === ''
      ? []
      : [value]
  const seen = new Set<string>()
  const output: string[] = []

  for (const item of source) {
    if (output.length >= maxCount) {
      break
    }

    const normalized = String(item ?? '')
      .trim()
      .slice(0, 300)

    if (!normalized || seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    output.push(normalized)
  }

  return output
}

function getNSPlateInfoAssetTokens(asset: NSPlateAssetSummary) {
  return Array.from(
    new Set(
      [asset.raw.id, asset.raw.file, asset.raw.path, asset.file, asset.path]
        .map((item) => normalizeNSPlateInfoAssetToken(item))
        .filter((item) => item.length > 0)
    )
  )
}

function normalizeNSPlateInfoAssetToken(raw: unknown) {
  const source = String(raw ?? '')
    .trim()
    .slice(0, 120)

  if (!source) {
    return ''
  }

  const normalizedPath = source.replace(/\\/g, '/')
  const rawBase = normalizedPath.split('/').pop() || normalizedPath
  let base = rawBase

  try {
    base = decodeURIComponent(rawBase)
  } catch {
    base = rawBase
  }

  const numeric = base.match(/^(\d{6})(?:_[^./\\]+)?(?:\.[A-Za-z0-9]+)?$/)

  if (numeric) {
    return numeric[1]
  }

  return base.toLowerCase()
}
