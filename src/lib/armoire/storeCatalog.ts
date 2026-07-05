import {
  ARMOIRE_STORE_CATALOG_SCHEMA_VERSION,
  ARMOIRE_STORE_DETAIL_TAGS,
  ARMOIRE_STORE_TAGS,
  type ArmoireStoreCatalog,
  type ArmoireStoreCatalogSource,
  type ArmoireStoreDetailTag,
  type ArmoireStoreLinkRegion,
  type ArmoireStoreMappingSource,
  type ArmoireStoreOutfit,
  type ArmoireStoreRegion,
  type ArmoireStoreTag
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_STORE_CATALOG: ArmoireStoreCatalog = {
  schemaVersion: ARMOIRE_STORE_CATALOG_SCHEMA_VERSION,
  generatedAt: '',
  sources: [],
  outfits: []
}

const ARMOIRE_STORE_REGIONS = new Set<ArmoireStoreRegion>(['cn', 'global'])
const ARMOIRE_STORE_LINK_REGIONS = new Set<ArmoireStoreLinkRegion>(['cn', 'global', 'tw', 'kr'])
const ARMOIRE_STORE_MAPPING_SOURCES = new Set<ArmoireStoreMappingSource>([
  'cn-store',
  'global-store',
  'manual'
])
const ARMOIRE_STORE_TAG_SET = new Set<ArmoireStoreTag>(ARMOIRE_STORE_TAGS)
const ARMOIRE_STORE_DETAIL_TAG_SET = new Set<ArmoireStoreDetailTag>(ARMOIRE_STORE_DETAIL_TAGS)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStoreRegion(value: unknown): value is ArmoireStoreRegion {
  return typeof value === 'string' && ARMOIRE_STORE_REGIONS.has(value as ArmoireStoreRegion)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isStoreTagArray(value: unknown): value is ArmoireStoreTag[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every(
        (item) => typeof item === 'string' && ARMOIRE_STORE_TAG_SET.has(item as ArmoireStoreTag)
      ))
  )
}

function isStoreDetailTagArray(value: unknown): value is ArmoireStoreDetailTag[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every(
        (item) =>
          typeof item === 'string' &&
          ARMOIRE_STORE_DETAIL_TAG_SET.has(item as ArmoireStoreDetailTag)
      ))
  )
}

function isRegionalStoreUrls(value: unknown): value is ArmoireStoreOutfit['regionalStoreUrls'] {
  if (value === undefined) {
    return true
  }

  if (!isRecord(value)) {
    return false
  }

  return Object.entries(value).every(
    ([region, url]) =>
      ARMOIRE_STORE_LINK_REGIONS.has(region as ArmoireStoreLinkRegion) && typeof url === 'string'
  )
}

function isItemIdArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => Number.isInteger(item) && item > 0)
}

function isOptionalItemId(value: unknown): value is number | undefined {
  return value === undefined || (typeof value === 'number' && Number.isInteger(value) && value > 0)
}

function isStoreCatalogSource(value: unknown): value is ArmoireStoreCatalogSource {
  return (
    isRecord(value) &&
    typeof value.region === 'string' &&
    ARMOIRE_STORE_LINK_REGIONS.has(value.region as ArmoireStoreLinkRegion) &&
    typeof value.url === 'string' &&
    (value.note === undefined || typeof value.note === 'string')
  )
}

function isStoreOutfit(value: unknown): value is ArmoireStoreOutfit {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isStoreRegion(value.region) &&
    typeof value.name === 'string' &&
    typeof value.storeUrl === 'string' &&
    isRegionalStoreUrls(value.regionalStoreUrls) &&
    typeof value.sourceUrl === 'string' &&
    (value.productId === undefined || typeof value.productId === 'string') &&
    (value.skuId === undefined || typeof value.skuId === 'string') &&
    (value.globalProductId === undefined || typeof value.globalProductId === 'string') &&
    (value.globalProductName === undefined || typeof value.globalProductName === 'string') &&
    (value.globalItemNames === undefined || isStringArray(value.globalItemNames)) &&
    (value.globalItemUris === undefined || isStringArray(value.globalItemUris)) &&
    (value.priceLabel === undefined || typeof value.priceLabel === 'string') &&
    isOptionalItemId(value.coverItemId) &&
    isStringArray(value.itemNames) &&
    isItemIdArray(value.itemIds) &&
    isStoreTagArray(value.tags) &&
    isStoreDetailTagArray(value.detailTags) &&
    (value.mappingSource === undefined ||
      ARMOIRE_STORE_MAPPING_SOURCES.has(value.mappingSource as ArmoireStoreMappingSource)) &&
    (value.corrected === undefined || typeof value.corrected === 'boolean') &&
    (value.needsMapping === undefined || typeof value.needsMapping === 'boolean') &&
    (value.notes === undefined || typeof value.notes === 'string')
  )
}

export function isArmoireStoreCatalog(value: unknown): value is ArmoireStoreCatalog {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_STORE_CATALOG_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    Array.isArray(value.sources) &&
    value.sources.every(isStoreCatalogSource) &&
    Array.isArray(value.outfits) &&
    value.outfits.every(isStoreOutfit)
  )
}
