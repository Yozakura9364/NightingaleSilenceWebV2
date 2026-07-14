import type {
  ArmoireCabinetEntry,
  ArmoireCatalog,
  ArmoireCatalogItem,
  ArmoireDye
} from '@/lib/armoire/types'

export interface ArmoireCabinetCatalogView {
  generatedAt: string
  items: Record<number, ArmoireCatalogItem>
  dyes: Record<number, ArmoireDye>
  cabinetItemIds: number[]
  cabinetEntries: ArmoireCabinetEntry[]
}

export interface ArmoireCabinetGroupableItem {
  itemId: number
  cabinetOrder: number
  cabinetSortKey: number
  cabinetId: number
  categoryId: number
  categoryName: string
  categoryMenuOrder: number
  subCategoryId: number
  subCategoryName: string
  subCategoryOrder: number
}

export interface ArmoireCabinetCategoryGroup<T extends ArmoireCabinetGroupableItem> {
  key: string
  label: string
  order: number
  count: number
  subCategories: ArmoireCabinetSubCategoryGroup<T>[]
}

export interface ArmoireCabinetSubCategoryGroup<T extends ArmoireCabinetGroupableItem> {
  key: string
  label: string
  order: number
  count: number
  items: T[]
}

function compareNumber(left: number, right: number): number {
  return left === right ? 0 : left - right
}

function uniqueSortedNumbers(values: readonly number[]): number[] {
  return Array.from(new Set(values)).sort((left, right) => left - right)
}

export function getArmoireCabinetGroupableItem(
  itemId: number,
  entry: ArmoireCabinetEntry | null | undefined
): ArmoireCabinetGroupableItem {
  return {
    itemId,
    cabinetOrder: entry?.order ?? Number.MAX_SAFE_INTEGER,
    cabinetSortKey: entry?.sortKey ?? Number.MAX_SAFE_INTEGER,
    cabinetId: entry?.cabinetId ?? Number.MAX_SAFE_INTEGER,
    categoryId: entry?.categoryId ?? 0,
    categoryName: entry?.categoryName ?? '',
    categoryMenuOrder: entry?.categoryMenuOrder ?? Number.MAX_SAFE_INTEGER,
    subCategoryId: entry?.subCategoryId ?? 0,
    subCategoryName: entry?.subCategoryName ?? '',
    subCategoryOrder: entry?.subCategoryOrder ?? Number.MAX_SAFE_INTEGER
  }
}

export function compareArmoireCabinetOrder(
  left: ArmoireCabinetGroupableItem,
  right: ArmoireCabinetGroupableItem
): number {
  return (
    compareArmoireCabinetGroupOrder(left, right) ||
    compareNumber(left.cabinetOrder, right.cabinetOrder) ||
    compareNumber(left.cabinetSortKey, right.cabinetSortKey) ||
    compareNumber(left.cabinetId, right.cabinetId)
  )
}

export function compareArmoireCabinetGroupOrder(
  left: ArmoireCabinetGroupableItem,
  right: ArmoireCabinetGroupableItem
): number {
  return (
    compareNumber(left.categoryMenuOrder, right.categoryMenuOrder) ||
    compareNumber(left.categoryId, right.categoryId) ||
    compareNumber(left.subCategoryOrder, right.subCategoryOrder) ||
    compareNumber(left.subCategoryId, right.subCategoryId)
  )
}

export function sortArmoireCabinetEntries(
  entries: readonly ArmoireCabinetEntry[]
): ArmoireCabinetEntry[] {
  return [...entries].sort((left, right) =>
    compareArmoireCabinetOrder(
      getArmoireCabinetGroupableItem(left.itemId, left),
      getArmoireCabinetGroupableItem(right.itemId, right)
    )
  )
}

export function mergeArmoireCabinetEntries(
  entries: readonly ArmoireCabinetEntry[]
): ArmoireCabinetEntry[] {
  const entriesByCabinetId = new Map<number, ArmoireCabinetEntry>()

  for (const entry of entries) {
    entriesByCabinetId.set(entry.cabinetId, {
      ...entriesByCabinetId.get(entry.cabinetId),
      ...entry
    })
  }

  return sortArmoireCabinetEntries(Array.from(entriesByCabinetId.values()))
}

export function createArmoireCabinetCatalogView(
  catalog: ArmoireCatalog
): ArmoireCabinetCatalogView {
  const cabinetEntries = mergeArmoireCabinetEntries(catalog.cabinetEntries ?? [])

  return {
    generatedAt: catalog.generatedAt,
    items: catalog.items,
    dyes: catalog.dyes,
    cabinetItemIds: uniqueSortedNumbers([
      ...catalog.cabinetItemIds,
      ...cabinetEntries.map((entry) => entry.itemId)
    ]),
    cabinetEntries
  }
}

export function buildArmoireCabinetEntryByItemId(
  entries: readonly ArmoireCabinetEntry[]
): Map<number, ArmoireCabinetEntry> {
  return new Map(entries.map((entry) => [entry.itemId, entry]))
}

export function buildArmoireCabinetItemGroups<T extends ArmoireCabinetGroupableItem>(
  items: readonly T[]
): ArmoireCabinetCategoryGroup<T>[] {
  const categoryMap = new Map<string, ArmoireCabinetCategoryGroup<T>>()

  for (const item of items) {
    const categoryKey = item.categoryId > 0 ? `category-${item.categoryId}` : 'category-unknown'
    let category = categoryMap.get(categoryKey)

    if (!category) {
      category = {
        key: categoryKey,
        label: item.categoryName,
        order: item.categoryMenuOrder,
        count: 0,
        subCategories: []
      }
      categoryMap.set(categoryKey, category)
    }

    category.count += 1

    const subCategoryKey =
      item.subCategoryId > 0
        ? `${categoryKey}-sub-${item.subCategoryId}`
        : `${categoryKey}-sub-unknown`
    let subCategory = category.subCategories.find((group) => group.key === subCategoryKey)

    if (!subCategory) {
      subCategory = {
        key: subCategoryKey,
        label: item.subCategoryName,
        order: item.subCategoryOrder,
        count: 0,
        items: []
      }
      category.subCategories.push(subCategory)
    }

    subCategory.count += 1
    subCategory.items.push(item)
  }

  return Array.from(categoryMap.values())
    .sort(
      (left, right) =>
        compareNumber(left.order, right.order) || left.label.localeCompare(right.label)
    )
    .map((category) => ({
      ...category,
      subCategories: category.subCategories.sort(
        (left, right) =>
          compareNumber(left.order, right.order) || left.label.localeCompare(right.label)
      )
    }))
}
