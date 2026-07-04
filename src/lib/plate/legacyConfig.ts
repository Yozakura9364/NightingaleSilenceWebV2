import {
  NSPLATE_NAMEPLATE_CATEGORIES,
  NSPLATE_PORTRAIT_CATEGORIES,
  NSPLATE_PORTRAIT_FRAME_CATEGORY,
  createEmptyAssetSelection,
  getScopeForCategory,
  toggleAssetInSelection,
  type NSPlateAssetSelectionMap
} from '@/lib/plate/draft'
import { NSPLATE_CANVAS_DIMENSIONS } from '@/lib/plate/render'
import type {
  NSPlateAssetGroup,
  NSPlateAssetSummary,
  NSPlateCustomPortraitImage,
  NSPlatePanelTab,
  NSPlatePresetKind,
  NSPlatePresetSummary
} from '@/lib/plate/types'

export type NSPlateLegacyConfigImportErrorCode =
  | 'empty'
  | 'unsupported'
  | 'zip-manifest'
  | 'custom-portrait'

export class NSPlateLegacyConfigImportError extends Error {
  code: NSPlateLegacyConfigImportErrorCode

  constructor(code: NSPlateLegacyConfigImportErrorCode) {
    super(code)
    this.name = 'NSPlateLegacyConfigImportError'
    this.code = code
  }
}

export interface NSPlateLegacyConfigImportContext {
  presets: NSPlatePresetSummary[]
  assetGroups: NSPlateAssetGroup[]
}

export interface NSPlateLegacyConfigImportResult {
  selectedPresetIdsByKind: Record<NSPlatePresetKind, string | null>
  selectedAssetIdsByCategory: NSPlateAssetSelectionMap
  customPortrait: NSPlateCustomPortraitImage | null
  activePanel: NSPlatePanelTab | null
  matchedAssetCount: number
  missingAssetCount: number
  ignoredInfoLayerCount: number
}

interface LegacySelectionSnapshot {
  id: string
  file?: string
  path?: string
}

interface NormalizedLegacyConfig {
  presetBanner: string
  presetChar: string
  selectedByCategory: Record<string, LegacySelectionSnapshot | null>
  customPortrait: unknown
  activePanel: NSPlatePanelTab | null
  ignoredInfoLayerCount: number
}

const LEGACY_CONFIG_VERSION = 1
const LEGACY_CONFIG_CATEGORIES = [
  ...NSPLATE_PORTRAIT_CATEGORIES,
  ...NSPLATE_NAMEPLATE_CATEGORIES,
  NSPLATE_PORTRAIT_FRAME_CATEGORY
] as readonly string[]

export async function importNSPlateLegacyConfigText(
  rawText: string,
  context: NSPlateLegacyConfigImportContext
): Promise<NSPlateLegacyConfigImportResult> {
  const parsed = parseLegacyConfigFromText(rawText)
  const config = normalizeLegacyConfigObject(parsed)

  if (!config) {
    throw new NSPlateLegacyConfigImportError('unsupported')
  }

  const { selection, matchedAssetCount, missingAssetCount } = importLegacyAssetSelection(
    config,
    context.assetGroups
  )

  return {
    selectedPresetIdsByKind: {
      banner: findLegacyPresetId(context.presets, 'banner', config.presetBanner),
      charcard: findLegacyPresetId(context.presets, 'charcard', config.presetChar)
    },
    selectedAssetIdsByCategory: selection,
    customPortrait: await normalizeLegacyCustomPortrait(config.customPortrait),
    activePanel: config.activePanel,
    matchedAssetCount,
    missingAssetCount,
    ignoredInfoLayerCount: config.ignoredInfoLayerCount
  }
}

function parseLegacyConfigFromText(rawText: string) {
  const text = rawText.trim()

  if (!text) {
    throw new NSPlateLegacyConfigImportError('empty')
  }

  try {
    const parsed: unknown = JSON.parse(text)

    if (isLayeredZipManifest(parsed)) {
      throw new NSPlateLegacyConfigImportError('zip-manifest')
    }

    return parsed
  } catch (error) {
    if (error instanceof NSPlateLegacyConfigImportError) {
      throw error
    }
  }

  if (/^IC1\?/i.test(text)) {
    return parseLegacyCompactParams(text)
  }

  throw new NSPlateLegacyConfigImportError('unsupported')
}

function parseLegacyCompactParams(text: string) {
  const queryIndex = text.indexOf('?')
  const params = new URLSearchParams(queryIndex >= 0 ? text.slice(queryIndex + 1) : '')
  const zRaw = params.get('z')
  const z = zRaw === null || zRaw === '' ? 1 : Number(zRaw)

  return {
    v: LEGACY_CONFIG_VERSION,
    t: params.get('t') || 'd',
    ps: params.get('ps') || 'r',
    ap: params.get('ap') || 'p',
    z: Number.isFinite(z) ? z : 1,
    pb: params.get('pb') || '',
    pc: params.get('pc') || '',
    ip: params.get('ip') || '',
    sl: (params.get('sl') || '').split(','),
    cp: null
  }
}

function normalizeLegacyConfigObject(value: unknown): NormalizedLegacyConfig | null {
  if (!isRecord(value)) {
    return null
  }

  if (Number(value.version) === LEGACY_CONFIG_VERSION && isRecord(value.selected)) {
    return normalizeFullLegacyConfig(value)
  }

  if (Number(value.v) === LEGACY_CONFIG_VERSION) {
    return normalizeCompactLegacyConfig(value)
  }

  return null
}

function normalizeFullLegacyConfig(value: Record<string, unknown>): NormalizedLegacyConfig {
  const selected = isRecord(value.selected) ? value.selected : {}

  return {
    presetBanner: normalizeString(value.presetBanner),
    presetChar: normalizeString(value.presetChar),
    selectedByCategory: Object.fromEntries(
      LEGACY_CONFIG_CATEGORIES.map((category) => [
        category,
        normalizeLegacySelectionSnapshot(selected[category])
      ])
    ),
    customPortrait: value.customPortrait,
    activePanel: normalizeLegacyActivePanel(value.activePanel),
    ignoredInfoLayerCount: Array.isArray(value.infoLayers) ? value.infoLayers.length : 0
  }
}

function normalizeCompactLegacyConfig(value: Record<string, unknown>): NormalizedLegacyConfig {
  const selectedIds = Array.isArray(value.sl) ? value.sl : []

  return {
    presetBanner: normalizeString(value.pb),
    presetChar: normalizeString(value.pc),
    selectedByCategory: Object.fromEntries(
      LEGACY_CONFIG_CATEGORIES.map((category, index) => [
        category,
        normalizeLegacySelectionId(selectedIds[index])
      ])
    ),
    customPortrait: value.cp,
    activePanel: normalizeCompactActivePanel(value.ap),
    ignoredInfoLayerCount: Array.isArray(value.infoLayers) ? value.infoLayers.length : 0
  }
}

function importLegacyAssetSelection(
  config: NormalizedLegacyConfig,
  assetGroups: NSPlateAssetGroup[]
) {
  let selection = createEmptyAssetSelection(assetGroups)
  let matchedAssetCount = 0
  let missingAssetCount = 0

  for (const category of LEGACY_CONFIG_CATEGORIES) {
    const snapshot = config.selectedByCategory[category]

    if (!snapshot) {
      continue
    }

    const asset = findLegacyAssetForCategory(assetGroups, category, snapshot)

    if (!asset) {
      missingAssetCount += 1
      continue
    }

    selection = toggleAssetInSelection(selection, asset)
    matchedAssetCount += 1
  }

  return {
    selection,
    matchedAssetCount,
    missingAssetCount
  }
}

function findLegacyPresetId(
  presets: NSPlatePresetSummary[],
  kind: NSPlatePresetKind,
  legacyName: string
) {
  if (!legacyName) {
    return null
  }

  return (
    presets.find(
      (preset) =>
        preset.kind === kind &&
        (preset.id === legacyName ||
          normalizeString(preset.raw.name) === legacyName ||
          preset.label === legacyName)
    )?.id ?? null
  )
}

function findLegacyAssetForCategory(
  assetGroups: NSPlateAssetGroup[],
  category: string,
  snapshot: LegacySelectionSnapshot
) {
  const scope = getScopeForCategory(category)
  const group = assetGroups.find((item) => item.scope === scope && item.category === category)

  if (!group) {
    return null
  }

  const id = normalizeString(snapshot.id)
  const path = normalizePath(snapshot.path)
  const file = normalizePath(snapshot.file)

  return (
    findLegacyAsset(group.assets, (asset) => {
      const rawId = normalizeString(asset.raw.id)
      const rawPath = normalizePath(asset.raw.path)
      return Boolean(id && path && rawId === id && (asset.path === path || rawPath === path))
    }) ??
    findLegacyAsset(group.assets, (asset) => Boolean(id && normalizeString(asset.raw.id) === id)) ??
    findLegacyAsset(group.assets, (asset) => {
      const rawPath = normalizePath(asset.raw.path)
      return Boolean(path && (asset.path === path || rawPath === path))
    }) ??
    findLegacyAsset(group.assets, (asset) => {
      const rawFile = normalizePath(asset.raw.file)
      return Boolean(file && (asset.file === file || rawFile === file))
    }) ??
    null
  )
}

function findLegacyAsset(
  assets: NSPlateAssetSummary[],
  predicate: (asset: NSPlateAssetSummary) => boolean
) {
  return assets.find(predicate) ?? null
}

async function normalizeLegacyCustomPortrait(
  value: unknown
): Promise<NSPlateCustomPortraitImage | null> {
  if (!isRecord(value)) {
    return null
  }

  const dataUrl = normalizeString(value.dataUrl) || normalizeString(value.d)
  const fileName = normalizeString(value.fileName) || normalizeString(value.n) || 'custom.png'
  const scale = clampLegacyCustomPortraitScale(
    normalizeFiniteNumber(value.scale) ?? normalizeFiniteNumber(value.s) ?? 1
  )

  if (!dataUrl) {
    return null
  }

  const image = await loadImage(dataUrl)
  const portraitDataUrl = createLegacyCustomPortraitDataUrl(image, scale)

  return {
    id: `legacy:${fileName}:${dataUrl.length}:${Math.round(scale * 1000)}`,
    mode: 'standard',
    fileName,
    dataUrl: portraitDataUrl,
    width: NSPLATE_CANVAS_DIMENSIONS.portrait.width,
    height: NSPLATE_CANVAS_DIMENSIONS.portrait.height,
    scale: 1
  }
}

function createLegacyCustomPortraitDataUrl(image: HTMLImageElement, scale: number) {
  const canvas = document.createElement('canvas')
  const { width, height } = NSPLATE_CANVAS_DIMENSIONS.portrait
  const drawWidth = Math.round(image.naturalWidth * scale)
  const drawHeight = Math.round(image.naturalHeight * scale)
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new NSPlateLegacyConfigImportError('custom-portrait')
  }

  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.drawImage(
    image,
    Math.round((width - drawWidth) / 2),
    Math.round((height - drawHeight) / 2),
    drawWidth,
    drawHeight
  )

  return canvas.toDataURL('image/png')
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new NSPlateLegacyConfigImportError('custom-portrait'))
    image.src = source
  })
}

function normalizeLegacySelectionSnapshot(value: unknown): LegacySelectionSnapshot | null {
  if (!isRecord(value)) {
    return null
  }

  const id = normalizeString(value.id)

  if (!id) {
    return null
  }

  return {
    id,
    ...(normalizeString(value.file) ? { file: normalizeString(value.file) } : {}),
    ...(normalizeString(value.path) ? { path: normalizeString(value.path) } : {})
  }
}

function normalizeLegacySelectionId(value: unknown): LegacySelectionSnapshot | null {
  const id = normalizeString(value)
  return id ? { id } : null
}

function normalizeLegacyActivePanel(value: unknown): NSPlatePanelTab | null {
  if (value === 'portrait' || value === 'nameplate' || value === 'info') {
    return value
  }

  return null
}

function normalizeCompactActivePanel(value: unknown): NSPlatePanelTab | null {
  if (value === 'p' || value === 'portrait') {
    return 'portrait'
  }

  if (value === 'n' || value === 'nameplate') {
    return 'nameplate'
  }

  if (value === 'i' || value === 'info') {
    return 'info'
  }

  return null
}

function isLayeredZipManifest(value: unknown) {
  return (
    isRecord(value) &&
    value.coordinateSpace === 'fullCanvasTopLeft' &&
    Array.isArray(value.layers) &&
    Number(value.version) !== LEGACY_CONFIG_VERSION &&
    Number(value.v) !== LEGACY_CONFIG_VERSION
  )
}

function clampLegacyCustomPortraitScale(value: number) {
  return Math.max(0.2, Math.min(3, value))
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function normalizeFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizePath(value: unknown) {
  return normalizeString(value).replace(/\\/g, '/').replace(/^\/+/, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
