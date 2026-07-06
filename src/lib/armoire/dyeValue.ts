import {
  ARMOIRE_STORE_SPECIAL_DYE_IDS,
  type ArmoireCatalog,
  type ArmoireDyeValueCategory
} from '@/lib/armoire/types'

const EXTRA_DYE_1_IDS = new Set([86, 87, 88, 89, 90, 91, 92, 93, 94])
const EXTRA_DYE_2_IDS = new Set([95, 96, 97, 98, 99, 100, 121, 122, 123, 124, 125])
const STORE_SPECIAL_DYE_IDS = new Set<number>(ARMOIRE_STORE_SPECIAL_DYE_IDS)

export function getArmoireDyeValueCategory(
  dyeId: number,
  catalog?: ArmoireCatalog
): ArmoireDyeValueCategory | undefined {
  const catalogCategory = catalog?.dyes[dyeId]?.valueCategory

  if (catalogCategory) {
    return catalogCategory
  }

  if (dyeId >= 1 && dyeId <= 85) {
    return 'general'
  }

  if (EXTRA_DYE_1_IDS.has(dyeId)) {
    return 'extra1'
  }

  if (EXTRA_DYE_2_IDS.has(dyeId)) {
    return 'extra2'
  }

  if (STORE_SPECIAL_DYE_IDS.has(dyeId)) {
    return 'storeSpecial'
  }

  return undefined
}

export function getArmoireDyeValueCategories(
  dyeIds: readonly number[],
  catalog: ArmoireCatalog
): ArmoireDyeValueCategory[] {
  const categories = new Set<ArmoireDyeValueCategory>()

  for (const dyeId of dyeIds) {
    if (dyeId <= 0) {
      continue
    }

    const category = getArmoireDyeValueCategory(dyeId, catalog)

    if (category) {
      categories.add(category)
    }
  }

  return Array.from(categories)
}
