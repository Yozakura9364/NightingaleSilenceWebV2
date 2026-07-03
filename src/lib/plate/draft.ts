import type {
  NSPlateAssetGroup,
  NSPlateAssetScope,
  NSPlateAssetSummary,
  NSPlatePresetKind,
  NSPlatePresetSummary
} from '@/lib/plate/types'

export const NSPLATE_PORTRAIT_CATEGORIES = ['肖像背景', '肖像装饰框', '肖像装饰物'] as const

export const NSPLATE_NAMEPLATE_CATEGORIES = [
  '铭牌背衬',
  '铭牌底色',
  '铭牌花纹',
  '铭牌外框',
  '铭牌顶部装饰',
  '铭牌底部装饰',
  '铭牌装饰物',
  '铭牌装饰物B'
] as const

export const NSPLATE_PORTRAIT_FRAME_CATEGORY = '肖像外框'

export const NSPLATE_NAMEPLATE_PRESET_CATEGORIES = [
  ...NSPLATE_NAMEPLATE_CATEGORIES,
  NSPLATE_PORTRAIT_FRAME_CATEGORY
] as const

const EXCLUSIVE_CATEGORY_BY_CATEGORY: Record<string, string> = {
  铭牌装饰物: '铭牌装饰物B',
  铭牌装饰物B: '铭牌装饰物'
}

export type NSPlateAssetSelectionMap = Record<string, string | null>

export interface NSPlatePresetApplyResult {
  selection: NSPlateAssetSelectionMap
  matchedCount: number
  missingCount: number
}

export function getPlateAssetSectionKey(scope: NSPlateAssetScope, category: string) {
  return `${scope}:${category}`
}

export function getPlateAssetSectionKeyForAsset(asset: NSPlateAssetSummary) {
  return getPlateAssetSectionKey(asset.scope, asset.category)
}

export function getCategoriesForPresetKind(kind: NSPlatePresetKind): readonly string[] {
  return kind === 'banner' ? NSPLATE_PORTRAIT_CATEGORIES : NSPLATE_NAMEPLATE_PRESET_CATEGORIES
}

export function getScopeForCategory(category: string): NSPlateAssetScope {
  return NSPLATE_PORTRAIT_CATEGORIES.includes(
    category as (typeof NSPLATE_PORTRAIT_CATEGORIES)[number]
  )
    ? 'portrait'
    : 'nameplate'
}

export function getSectionKeyForCategory(category: string) {
  return getPlateAssetSectionKey(getScopeForCategory(category), category)
}

export function createEmptyAssetSelection(groups: NSPlateAssetGroup[]): NSPlateAssetSelectionMap {
  return Object.fromEntries(groups.map((group) => [getPlateAssetSectionKey(group.scope, group.category), null]))
}

export function toggleAssetInSelection(
  selection: NSPlateAssetSelectionMap,
  asset: NSPlateAssetSummary
): NSPlateAssetSelectionMap {
  const sectionKey = getPlateAssetSectionKeyForAsset(asset)
  const nextSelection: NSPlateAssetSelectionMap = { ...selection }
  const isAlreadySelected = nextSelection[sectionKey] === asset.id

  nextSelection[sectionKey] = isAlreadySelected ? null : asset.id

  const exclusiveCategory = EXCLUSIVE_CATEGORY_BY_CATEGORY[asset.category]

  if (!isAlreadySelected && exclusiveCategory) {
    nextSelection[getSectionKeyForCategory(exclusiveCategory)] = null
  }

  return nextSelection
}

export function selectedAssetForGroup(
  selection: NSPlateAssetSelectionMap,
  group: NSPlateAssetGroup
) {
  const selectedId = selection[getPlateAssetSectionKey(group.scope, group.category)]

  if (!selectedId) {
    return null
  }

  return group.assets.find((asset) => asset.id === selectedId) ?? null
}

export function getSelectedAssetsByCategory(
  groups: NSPlateAssetGroup[],
  selection: NSPlateAssetSelectionMap
) {
  return groups
    .map((group) => selectedAssetForGroup(selection, group))
    .filter((asset): asset is NSPlateAssetSummary => asset !== null)
}

export function applyPresetToAssetSelection(
  selection: NSPlateAssetSelectionMap,
  groups: NSPlateAssetGroup[],
  preset: NSPlatePresetSummary
): NSPlatePresetApplyResult {
  const categories = getCategoriesForPresetKind(preset.kind)
  const nextSelection: NSPlateAssetSelectionMap = { ...selection }
  let matchedCount = 0
  let missingCount = 0

  for (const category of categories) {
    nextSelection[getSectionKeyForCategory(category)] = null
  }

  for (const layer of preset.raw.layers ?? []) {
    const category = String(layer.cat ?? '').trim()

    if (!category || !categories.includes(category)) {
      continue
    }

    const asset = findAssetForPresetLayer(groups, category, layer.id)

    if (!asset) {
      missingCount += 1
      continue
    }

    nextSelection[getPlateAssetSectionKeyForAsset(asset)] = asset.id
    matchedCount += 1
  }

  return {
    selection: nextSelection,
    matchedCount,
    missingCount
  }
}

function findAssetForPresetLayer(
  groups: NSPlateAssetGroup[],
  category: string,
  layerId: string | number | undefined
) {
  const id = String(layerId ?? '').trim()

  if (!id) {
    return null
  }

  return (
    groups
      .find((group) => group.category === category && group.scope === getScopeForCategory(category))
      ?.assets.find((asset) => String(asset.raw.id ?? '').trim() === id) ?? null
  )
}
