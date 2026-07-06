import {
  ARMOIRE_CATALOG_SCHEMA_VERSION,
  type ArmoireCatalog,
  type ArmoireCatalogItem,
  type ArmoireCompactDisplayItem,
  type ArmoireGlamourSet,
  type ArmoireIdenticalGroup,
  type ArmoireModelTuple
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_CATALOG: ArmoireCatalog = {
  schemaVersion: ARMOIRE_CATALOG_SCHEMA_VERSION,
  generatedAt: '',
  items: {},
  cabinetItemIds: [],
  glamourSetItems: [],
  identicalGroups: [],
  dyes: {}
}

const EXCLUDED_APPEARANCE_EQUIP_SLOT_CATEGORY_IDS = new Set([6, 14, 17])
const ARMOIRE_ICON_BASE_URL = 'https://img.nightingalesilence.com'

export function hasCabinetCatalog(catalog: ArmoireCatalog): boolean {
  return catalog.cabinetItemIds.length > 0
}

export function hasGlamourSetCatalog(catalog: ArmoireCatalog): boolean {
  return catalog.glamourSetItems.length > 0
}

export function hasIdenticalModelCatalog(catalog: ArmoireCatalog): boolean {
  return getIdenticalModelGroups(catalog).length > 0
}

function getMergedGeneratedAt(catalogs: ArmoireCatalog[]): string {
  const generatedAtValues = catalogs
    .map((catalog) => catalog.generatedAt)
    .filter(Boolean)
    .sort()

  return generatedAtValues[generatedAtValues.length - 1] ?? ''
}

function uniqueSortedNumbers(values: number[]): number[] {
  return Array.from(new Set(values)).sort((left, right) => left - right)
}

function mergeCatalogItems(catalogs: ArmoireCatalog[]): Record<number, ArmoireCatalogItem> {
  const items: Record<number, ArmoireCatalogItem> = {}

  for (const catalog of catalogs) {
    for (const [itemId, item] of Object.entries(catalog.items)) {
      items[Number(itemId)] = {
        ...items[Number(itemId)],
        ...item
      }
    }
  }

  return items
}

function mergeGlamourSetItems(catalogs: ArmoireCatalog[]): ArmoireGlamourSet[] {
  const glamourSets = new Map<number, ArmoireGlamourSet>()

  for (const catalog of catalogs) {
    for (const set of catalog.glamourSetItems) {
      const existingSet = glamourSets.get(set.setItemId)

      glamourSets.set(set.setItemId, {
        setItemId: set.setItemId,
        setName: set.setName ?? existingSet?.setName,
        pieceItemIds: uniqueSortedNumbers([
          ...(existingSet?.pieceItemIds ?? []),
          ...set.pieceItemIds
        ])
      })
    }
  }

  return Array.from(glamourSets.values()).sort((left, right) => left.setItemId - right.setItemId)
}

export function mergeArmoireCatalogs(...catalogs: ArmoireCatalog[]): ArmoireCatalog {
  if (catalogs.length === 0) {
    return EMPTY_ARMOIRE_CATALOG
  }

  return {
    schemaVersion: ARMOIRE_CATALOG_SCHEMA_VERSION,
    generatedAt: getMergedGeneratedAt(catalogs),
    items: mergeCatalogItems(catalogs),
    cabinetItemIds: uniqueSortedNumbers(catalogs.flatMap((catalog) => catalog.cabinetItemIds)),
    cabinetEntries: catalogs.flatMap((catalog) => catalog.cabinetEntries ?? []),
    glamourSetItems: mergeGlamourSetItems(catalogs),
    identicalGroups: catalogs.flatMap((catalog) => catalog.identicalGroups),
    dyes: Object.assign({}, ...catalogs.map((catalog) => catalog.dyes))
  }
}

export function getArmoireIconUrl(iconId: number | undefined): string {
  if (typeof iconId !== 'number' || iconId <= 0) {
    return ''
  }

  const normalizedIconId = Math.trunc(iconId)
  const iconFolder = (Math.floor(normalizedIconId / 1000) * 1000).toString().padStart(6, '0')
  const iconFile = normalizedIconId.toString().padStart(6, '0')

  return `${ARMOIRE_ICON_BASE_URL}/ui/icon/${iconFolder}/${iconFile}_hr1.png`
}

function createModelTupleKey(model: ArmoireModelTuple): string {
  return model.join('/')
}

function isEmptyModelTuple(model: ArmoireModelTuple): boolean {
  return model.every((value) => value === 0)
}

export function createModelPairKey(
  mainModel: ArmoireModelTuple,
  subModel: ArmoireModelTuple
): string {
  return `main:${createModelTupleKey(mainModel)}|sub:${createModelTupleKey(subModel)}`
}

function createModelCategoryKey(item: ArmoireCatalogItem): string | undefined {
  if (item.equipSlotCategoryId === undefined || item.itemUiCategoryId === undefined) {
    return undefined
  }

  if (
    item.equipSlotCategoryId <= 0 ||
    EXCLUDED_APPEARANCE_EQUIP_SLOT_CATEGORY_IDS.has(item.equipSlotCategoryId)
  ) {
    return undefined
  }

  return `slot:${item.equipSlotCategoryId}|ui:${item.itemUiCategoryId}`
}

export function getCatalogItemModelKey(item: ArmoireCatalogItem): string | undefined {
  const categoryKey = createModelCategoryKey(item)

  if (!categoryKey) {
    return undefined
  }

  if (item.mainModel && item.subModel) {
    if (isEmptyModelTuple(item.mainModel) && isEmptyModelTuple(item.subModel)) {
      return undefined
    }

    return `${createModelPairKey(item.mainModel, item.subModel)}|${categoryKey}`
  }

  if (item.modelKey) {
    return `${item.modelKey}|${categoryKey}`
  }

  return undefined
}

export function buildIdenticalGroupsFromCatalogItems(
  items: Record<number, ArmoireCatalogItem>
): ArmoireIdenticalGroup[] {
  const groupedItemIds = new Map<string, number[]>()

  for (const item of Object.values(items)) {
    const key = getCatalogItemModelKey(item)

    if (!key) {
      continue
    }

    const itemIds = groupedItemIds.get(key) ?? []
    itemIds.push(item.itemId)
    groupedItemIds.set(key, itemIds)
  }

  return Array.from(groupedItemIds.entries())
    .filter(([, itemIds]) => itemIds.length > 1)
    .map(([key, itemIds]) => ({
      key,
      itemIds: itemIds.sort((left, right) => left - right)
    }))
    .sort((left, right) => left.key.localeCompare(right.key))
}

export function getIdenticalModelGroups(catalog: ArmoireCatalog): ArmoireIdenticalGroup[] {
  const groupsFromItems = buildIdenticalGroupsFromCatalogItems(catalog.items)

  if (groupsFromItems.length > 0) {
    return groupsFromItems
  }

  return catalog.identicalGroups
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

export function isArmoireCompactDisplayItem(value: unknown): value is ArmoireCompactDisplayItem {
  return (
    Array.isArray(value) &&
    isPositiveInteger(value[0]) &&
    (value[1] === undefined || typeof value[1] === 'string') &&
    (value[2] === undefined || isPositiveInteger(value[2]))
  )
}

export function isArmoireCompactDisplayItemArray(
  value: unknown
): value is ArmoireCompactDisplayItem[] {
  return Array.isArray(value) && value.every(isArmoireCompactDisplayItem)
}

export function isPositiveIntegerArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isPositiveInteger)
}

export function createCatalogItemFromCompactDisplayItem(
  item: ArmoireCompactDisplayItem
): ArmoireCatalogItem {
  const [itemId, name, iconId] = item
  const catalogItem: ArmoireCatalogItem = { itemId }

  if (name) {
    catalogItem.name = name
  }

  if (iconId) {
    catalogItem.iconId = iconId
  }

  return catalogItem
}

export function createCatalogItemsFromCompactDisplayItems(
  items: readonly ArmoireCompactDisplayItem[]
): Record<number, ArmoireCatalogItem> {
  return Object.fromEntries(
    items.map((item) => {
      const catalogItem = createCatalogItemFromCompactDisplayItem(item)
      return [catalogItem.itemId, catalogItem]
    })
  )
}

export function isArmoireCatalog(value: unknown): value is ArmoireCatalog {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_CATALOG_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    isRecord(value.items) &&
    Array.isArray(value.cabinetItemIds) &&
    Array.isArray(value.glamourSetItems) &&
    Array.isArray(value.identicalGroups) &&
    isRecord(value.dyes)
  )
}
