import type { ArmoireStoreOutfit, ArmoireStoreLinkRegion, ArmoireStoreTag, ArmoireStoreDetailTag } from '@/lib/armoire/types'

interface StoreReviewDraftEntry {
  regionalStoreUrls?: Record<string, string>
  regionalPriceLabels?: Record<string, string>
  itemIds?: number[]
  tags?: ArmoireStoreTag[]
  detailTags?: ArmoireStoreDetailTag[]
  corrected?: boolean
  excluded?: boolean
}

interface StoreReviewPatch {
  schemaVersion: 'nsarmoire.storeCatalogCorrections.v1'
  generatedAt: string
  outfits: Array<{
    id: string
    name: string
    productId?: string
    skuId?: string
    regionalStoreUrls?: Record<string, string>
    regionalPriceLabels?: Record<string, string>
    itemIds?: number[]
    itemNames?: string[]
    tags?: ArmoireStoreTag[]
    detailTags?: ArmoireStoreDetailTag[]
    corrected?: boolean
    needsMapping?: boolean
    excluded?: boolean
  }>
}

export function useArmoireStoreReviewPatch(
  getMergedItemIds: (outfit: ArmoireStoreOutfit) => number[],
  getMergedTags: (outfit: ArmoireStoreOutfit) => ArmoireStoreTag[],
  getMergedDetailTags: (outfit: ArmoireStoreOutfit) => ArmoireStoreDetailTag[],
  getStoreReviewOutfitName: (outfit: ArmoireStoreOutfit) => string,
  getArmoireItemName: (catalog: Record<string, any>, itemId: number, t: any) => string,
) {
  function hasStoredDraftEntry(entry: StoreReviewDraftEntry): boolean {
    return Boolean(
      entry.corrected ||
      (entry.regionalStoreUrls && Object.keys(entry.regionalStoreUrls).length > 0) ||
      (entry.regionalPriceLabels && Object.keys(entry.regionalPriceLabels).length > 0) ||
      (entry.itemIds && entry.itemIds.length > 0) ||
      entry.tags !== undefined ||
      entry.detailTags !== undefined ||
      entry.excluded === true
    )
  }

  function buildPatch(
    storeCatalogOutfits: ArmoireStoreOutfit[],
    draftEntries: Record<string, StoreReviewDraftEntry>,
    catalog: any,
    t: any,
  ): StoreReviewPatch {
    const outfitIndex = new Map(storeCatalogOutfits.map((outfit) => [outfit.id, outfit]))
    const outfits = Object.entries(draftEntries)
      .filter(([, draft]) => hasStoredDraftEntry(draft))
      .map(([id, draft]) => {
        const outfit = outfitIndex.get(id)
        if (!outfit) return null

        if (draft.excluded) {
          return {
            id,
            name: getStoreReviewOutfitName(outfit),
            productId: outfit.productId,
            skuId: outfit.skuId,
            excluded: true
          }
        }

        const mergedItemIds = getMergedItemIds(outfit)
        const itemIdsChanged = (draft.itemIds ?? []).length > 0
        const tagsChanged = draft.tags !== undefined
        const detailTagsChanged = draft.detailTags !== undefined
        const itemNames = mergedItemIds.map((itemId) => getArmoireItemName(catalog, itemId, t))
        const needsMapping =
          itemIdsChanged &&
          mergedItemIds.length >= Math.max(outfit.itemNames.length, mergedItemIds.length)
            ? false
            : outfit.needsMapping

        return {
          id,
          name: getStoreReviewOutfitName(outfit),
          productId: outfit.productId,
          skuId: outfit.skuId,
          ...(draft.regionalStoreUrls ? { regionalStoreUrls: draft.regionalStoreUrls } : {}),
          ...(draft.regionalPriceLabels ? { regionalPriceLabels: draft.regionalPriceLabels } : {}),
          ...(draft.corrected ? { corrected: true } : {}),
          ...(tagsChanged ? { tags: getMergedTags(outfit) } : {}),
          ...(detailTagsChanged ? { detailTags: getMergedDetailTags(outfit) } : {}),
          ...(itemIdsChanged ? { itemIds: mergedItemIds, itemNames, needsMapping } : {})
        }
      })
      .filter((outfit): outfit is NonNullable<typeof outfit> => Boolean(outfit))

    return {
      schemaVersion: 'nsarmoire.storeCatalogCorrections.v1',
      generatedAt: new Date().toISOString(),
      outfits
    }
  }

  return { buildPatch, hasStoredDraftEntry }
}
