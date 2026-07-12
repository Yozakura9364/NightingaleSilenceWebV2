export const NSPLATE_DEFAULT_IMAGE_BASE = 'https://img.nightingalesilence.com'

export function normalizeNSPlateResourcePath(path: unknown) {
  return String(path ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

export function normalizeNSPlateUiAssetPath(path: unknown) {
  const value = normalizeNSPlateResourcePath(path).replace(/\s+/g, ' ')
  const lower = value.toLowerCase()
  const uiIndex = lower.lastIndexOf('/ui/')

  return uiIndex >= 0 ? value.slice(uiIndex + 1).replace(/^\/+/, '') : value
}

export function normalizeNSPlateResourceBase(base: string | null | undefined) {
  const trimmed = String(base ?? '')
    .trim()
    .replace(/\/+$/, '')

  if (!trimmed) {
    return undefined
  }

  if (isAbsoluteNSPlateAssetUrl(trimmed)) {
    return trimmed
  }

  return trimmed.replace(/^\/portable(?=\/|$)/i, '')
}

export function joinNSPlateResourceUrl(base: string | null | undefined, path: string) {
  const normalizedBase = normalizeNSPlateResourceBase(base)
  const normalizedPath = normalizeNSPlateResourcePath(path)

  if (!normalizedBase || !normalizedPath) {
    return undefined
  }

  if (isAbsoluteNSPlateAssetUrl(normalizedPath)) {
    return normalizedPath
  }

  return `${normalizedBase}/${normalizedPath}`
}

export function resolveNSPlateImageUrl(
  path: string,
  base: string | null | undefined = NSPLATE_DEFAULT_IMAGE_BASE
) {
  return joinNSPlateResourceUrl(base, path) ?? ''
}

export function isAbsoluteNSPlateAssetUrl(value: string) {
  return /^(https?:)?\/\//i.test(value) || /^data:/i.test(value) || /^blob:/i.test(value)
}
