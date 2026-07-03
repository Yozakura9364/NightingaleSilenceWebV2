import { useFetch } from '@/composables/useFetch'
import { textKeys } from '@/config/site'
import {
  NSPLATE_NAMEPLATE_CATEGORIES,
  NSPLATE_PORTRAIT_CATEGORIES,
  NSPLATE_PORTRAIT_FRAME_CATEGORY
} from '@/lib/plate/draft'
import { uiMessages } from '@/locales/ui'
import type { Locale } from '@/stores/locale'
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
} from '@/lib/plate/types'

const presetKindLabels = {
  banner: textKeys.nsplatePortrait,
  charcard: textKeys.nsplateNameplate
} satisfies Record<NSPlatePresetKind, string>

const assetScopeLabels = {
  portrait: textKeys.nsplatePortrait,
  nameplate: textKeys.nsplateNameplate
} satisfies Record<NSPlateAssetScope, string>

const assetCategoryLabelKeys: Record<string, string> = {
  [NSPLATE_PORTRAIT_CATEGORIES[0]]: textKeys.nsplateCategoryPortraitBackground,
  [NSPLATE_PORTRAIT_CATEGORIES[1]]: textKeys.nsplateCategoryPortraitDecorFrame,
  [NSPLATE_PORTRAIT_CATEGORIES[2]]: textKeys.nsplateCategoryPortraitDecoration,
  [NSPLATE_PORTRAIT_FRAME_CATEGORY]: textKeys.nsplateCategoryPortraitFrame,
  [NSPLATE_NAMEPLATE_CATEGORIES[0]]: textKeys.nsplateCategoryNameplateBase,
  [NSPLATE_NAMEPLATE_CATEGORIES[1]]: textKeys.nsplateCategoryNameplateColor,
  [NSPLATE_NAMEPLATE_CATEGORIES[2]]: textKeys.nsplateCategoryNameplatePattern,
  [NSPLATE_NAMEPLATE_CATEGORIES[3]]: textKeys.nsplateCategoryNameplateFrame,
  [NSPLATE_NAMEPLATE_CATEGORIES[4]]: textKeys.nsplateCategoryNameplateTopDecor,
  [NSPLATE_NAMEPLATE_CATEGORIES[5]]: textKeys.nsplateCategoryNameplateBottomDecor,
  [NSPLATE_NAMEPLATE_CATEGORIES[6]]: textKeys.nsplateCategoryNameplateDecoration,
  [NSPLATE_NAMEPLATE_CATEGORIES[7]]: textKeys.nsplateCategoryNameplateDecorationAlt
}

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
    label: pickUiMessage(presetKindLabels[kind], locale),
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
      scopeLabel: pickUiMessage(assetScopeLabels[scope], locale),
      category,
      label: pickAssetCategoryLabel(category, locale),
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
      `${pickUiMessage(presetKindLabels[kind], locale)} ${index + 1}`

    return {
      id: `${kind}:${index}:${label}`,
      kind,
      kindLabel: pickUiMessage(presetKindLabels[kind], locale),
      label,
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
      scopeLabel: pickUiMessage(assetScopeLabels[scope], locale),
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

function pickUiMessage(key: string, locale: string) {
  const normalized = locale.trim() as Locale
  return uiMessages[key]?.[normalized] ?? uiMessages[key]?.['zh-CN'] ?? key
}

function pickAssetCategoryLabel(category: string, locale: string) {
  const key = assetCategoryLabelKeys[category]
  return key ? pickUiMessage(key, locale) : category
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
