import { useFetch } from '@/composables/useFetch'
import type {
  NSPlateAsset,
  NSPlateAssetGroup,
  NSPlateAssetScope,
  NSPlateAssetSummary,
  NSPlateFilesResponse,
  NSPlatePreset,
  NSPlatePresetGroup,
  NSPlatePresetKind,
  NSPlatePresetSummary,
  NSPlatePresetsResponse
} from '@/pages/plate/types'

const presetKindLabels = {
  banner: '肖像',
  charcard: '铭牌'
} satisfies Record<NSPlatePresetKind, string>

const assetScopeLabels = {
  portrait: '肖像',
  nameplate: '铭牌'
} satisfies Record<NSPlateAssetScope, string>

export function useNSPlateApi(apiBase: string) {
  const { createClient } = useFetch()
  const client = createClient(apiBase)

  return {
    fetchPresets: () => client.api<NSPlatePresetsResponse>('/presets', { cache: 'no-store' }),
    fetchFiles: () => client.api<NSPlateFilesResponse>('/files', { cache: 'no-store' })
  }
}

export function normalizePresets(
  response: NSPlatePresetsResponse | null,
  locale: string
): NSPlatePresetGroup[] {
  return (['banner', 'charcard'] as const).map((kind) => ({
    kind,
    label: presetKindLabels[kind],
    presets: normalizePresetList(kind, response?.[kind] ?? [], locale)
  }))
}

export function normalizeFiles(
  response: NSPlateFilesResponse | null,
  locale: string
): NSPlateAssetGroup[] {
  const meta = response?._meta

  return (['portrait', 'nameplate'] as const).flatMap((scope) => {
    const groups = response?.[scope] ?? {}

    return Object.entries(groups).map(([category, assets]) => ({
      scope,
      scopeLabel: assetScopeLabels[scope],
      category,
      label: category,
      assets: normalizeAssetList(scope, category, Array.isArray(assets) ? assets : [], meta, locale)
    }))
  })
}

function normalizePresetList(
  kind: NSPlatePresetKind,
  presets: NSPlatePreset[],
  locale: string
): NSPlatePresetSummary[] {
  return presets.map((preset, index) => {
    const label =
      pickLocalizedName(preset.names, locale) ??
      normalizeText(preset.name) ??
      `${presetKindLabels[kind]} ${index + 1}`

    return {
      id: `${kind}:${index}:${label}`,
      kind,
      kindLabel: presetKindLabels[kind],
      label,
      layerCount: Array.isArray(preset.layers) ? preset.layers.length : 0,
      raw: preset
    }
  })
}

function normalizeAssetList(
  scope: NSPlateAssetScope,
  category: string,
  assets: NSPlateAsset[],
  meta: NSPlateFilesResponse['_meta'],
  locale: string
): NSPlateAssetSummary[] {
  return assets.map((asset, index) => {
    const file = normalizeText(asset.file) ?? ''
    const path = normalizeResourcePath(asset.path ?? file)
    const label =
      pickLocalizedName(asset.names, locale) ??
      normalizeText(asset.name) ??
      normalizeText(asset.id) ??
      file ??
      `${category} ${index + 1}`

    return {
      id: `${scope}:${category}:${index}:${normalizeText(asset.id) ?? file ?? path}`,
      scope,
      scopeLabel: assetScopeLabels[scope],
      category,
      label,
      file,
      path,
      imageUrl: joinResourceUrl(meta?.imgBase, path),
      previewUrl: joinResourceUrl(meta?.previewImgBase, path),
      raw: asset
    }
  })
}

function pickLocalizedName(names: Record<string, string> | undefined, locale: string) {
  if (!names) {
    return undefined
  }

  const byLowerKey = new Map(
    Object.entries(names).map(([key, value]) => [key.toLowerCase(), normalizeText(value)])
  )

  for (const key of getLocaleCandidates(locale)) {
    const value = byLowerKey.get(key.toLowerCase())

    if (value) {
      return value
    }
  }

  return undefined
}

function getLocaleCandidates(locale: string) {
  const normalized = locale.trim()
  const short = normalized.split('-')[0]

  return [normalized, short, 'zh-CN', 'zh', 'cn', 'en', 'ja', 'ko']
}

function normalizeText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || undefined
}

function normalizeResourcePath(path: unknown) {
  return String(path ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

function normalizeResourceBase(base: string | null | undefined) {
  const trimmed = String(base ?? '')
    .trim()
    .replace(/\/+$/, '')

  if (!trimmed) {
    return undefined
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
    return trimmed
  }

  return trimmed.replace(/^\/portable(?=\/|$)/i, '')
}

function joinResourceUrl(base: string | null | undefined, path: string) {
  const normalizedBase = normalizeResourceBase(base)

  if (!normalizedBase || !path) {
    return undefined
  }

  if (/^https?:\/\//i.test(path) || path.startsWith('//')) {
    return path
  }

  return `${normalizedBase}/${path.replace(/^\/+/, '')}`
}
