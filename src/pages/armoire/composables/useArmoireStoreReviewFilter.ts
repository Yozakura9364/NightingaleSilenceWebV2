import { computed, ref, watch, type Ref } from 'vue'
import type { ArmoireStoreOutfit, ArmoireStoreLinkRegion, ArmoireStoreTag, ArmoireStoreDetailTag } from '@/lib/armoire/types'
import {
  ARMOIRE_STORE_TAGS,
  ARMOIRE_STORE_DETAIL_TAGS,
} from '@/lib/armoire/types'
import {
  ARMOIRE_STORE_TAG_LABEL_KEYS,
  ARMOIRE_STORE_DETAIL_TAG_LABEL_KEYS,
  getArmoireStoreTagLabels
} from '@/pages/armoire/utils/storeTagDisplay'
import { getArmoireItemName, getArmoireItemIconUrl } from '@/pages/armoire/utils/itemDisplay'
import type { LocaleFunction } from '@/stores/locale'
import type { ArmoireCatalog } from './useArmoireCatalog'
import type { ArmoireStoreCatalog } from './useArmoireStoreCatalog'

export type StoreReviewFilter =
  'all' | 'pendingCorrection' | 'corrected' | 'needsMapping' | 'missingLinks' | 'edited'

export type StoreReviewTagFilter =
  | 'all' | 'tagged' | 'untagged'
  | `store:${ArmoireStoreTag}`
  | `detail:${ArmoireStoreDetailTag}`

export function useArmoireStoreReviewFilter(
  storeCatalog: Ref<ArmoireStoreCatalog>,
  catalog: Ref<ArmoireCatalog>,
  draftEntries: Ref<Record<string, any>>,
  t: LocaleFunction,
  getLinkValue: (outfit: ArmoireStoreOutfit, region: ArmoireStoreLinkRegion) => string,
  getMergedTags: (outfit: ArmoireStoreOutfit) => ArmoireStoreTag[],
  getMergedDetailTags: (outfit: ArmoireStoreOutfit) => ArmoireStoreDetailTag[],
  getMergedItemIds: (outfit: ArmoireStoreOutfit) => number[],
) {
  const STORE_REVIEW_BATCH_SIZE = 10
  const STORE_TAG_SET = new Set<ArmoireStoreTag>(ARMOIRE_STORE_TAGS)
  const STORE_DETAIL_TAG_SET = new Set<ArmoireStoreDetailTag>(ARMOIRE_STORE_DETAIL_TAGS)

  const linkRegions: Array<{ value: ArmoireStoreLinkRegion; labelKey: string }> = [
    { value: 'cn', labelKey: '' },
    { value: 'global', labelKey: '' },
    { value: 'tw', labelKey: '' },
    { value: 'kr', labelKey: '' }
  ]

  const searchQuery = ref('')
  const selectedFilter = ref<StoreReviewFilter>('all')
  const selectedTagFilter = ref<StoreReviewTagFilter>('all')
  const visibleOutfitCount = ref(STORE_REVIEW_BATCH_SIZE)
  const loadMoreSentinel = ref<HTMLElement | null>(null)
  let loadMoreObserver: IntersectionObserver | null = null

  function isStoreTag(value: unknown): value is ArmoireStoreTag {
    return typeof value === 'string' && STORE_TAG_SET.has(value as ArmoireStoreTag)
  }

  function isStoreDetailTag(value: unknown): value is ArmoireStoreDetailTag {
    return typeof value === 'string' && STORE_DETAIL_TAG_SET.has(value as ArmoireStoreDetailTag)
  }

  const storeTagOptions = computed(() =>
    ARMOIRE_STORE_TAGS.map((value) => ({
      value,
      label: t(ARMOIRE_STORE_TAG_LABEL_KEYS[value])
    }))
  )

  const storeDetailTagOptions = computed(() =>
    ARMOIRE_STORE_DETAIL_TAGS.map((value) => ({
      value,
      label: t(ARMOIRE_STORE_DETAIL_TAG_LABEL_KEYS[value])
    }))
  )

  const filterOptions = computed(() => [
    { value: 'all' as const, label: '' },
    { value: 'pendingCorrection' as const, label: '' },
    { value: 'corrected' as const, label: '' },
    { value: 'needsMapping' as const, label: '' },
    { value: 'missingLinks' as const, label: '' },
    { value: 'edited' as const, label: '' },
  ])

  const tagFilterOptions = computed(() => [
    { value: 'all' as const, label: '' },
    { value: 'untagged' as const, label: '' },
    { value: 'tagged' as const, label: '' },
    ...storeTagOptions.value.map((option) => ({
      value: `store:${option.value}` as StoreReviewTagFilter,
      label: option.label
    })),
    ...storeDetailTagOptions.value.map((option) => ({
      value: `detail:${option.value}` as StoreReviewTagFilter,
      label: option.label
    }))
  ])

  function isCorrected(outfitId: string): boolean {
    return Boolean(draftEntries.value[outfitId]?.corrected)
  }

  function isEdited(outfitId: string): boolean {
    const draft = draftEntries.value[outfitId]
    if (!draft) return false
    return Boolean(
      (draft.regionalStoreUrls && Object.keys(draft.regionalStoreUrls).length > 0) ||
      (draft.regionalPriceLabels && Object.keys(draft.regionalPriceLabels).length > 0) ||
      (draft.itemIds && draft.itemIds.length > 0) ||
      draft.tags !== undefined ||
      draft.detailTags !== undefined ||
      draft.excluded === true
    )
  }

  function isNeedsMapping(outfit: ArmoireStoreOutfit): boolean {
    const itemIds = getMergedItemIds(outfit)
    return Boolean(outfit.needsMapping || itemIds.length < outfit.itemNames.length)
  }

  function hasMissingLinks(outfit: ArmoireStoreOutfit): boolean {
    return linkRegions.some((region) => !getLinkValue(outfit, region.value))
  }

  function matchesTagFilter(outfit: ArmoireStoreOutfit): boolean {
    const filter = selectedTagFilter.value
    if (filter === 'all') return true

    const tags = getMergedTags(outfit)
    const detailTags = getMergedDetailTags(outfit)

    if (filter === 'tagged') return tags.length > 0 || detailTags.length > 0
    if (filter === 'untagged') return tags.length === 0 && detailTags.length === 0
    if (filter.startsWith('store:')) {
      const tag = filter.slice('store:'.length) as ArmoireStoreTag
      return isStoreTag(tag) && tags.includes(tag)
    }
    if (filter.startsWith('detail:')) {
      const tag = filter.slice('detail:'.length) as ArmoireStoreDetailTag
      return isStoreDetailTag(tag) && detailTags.includes(tag)
    }
    return true
  }

  function getStoreReviewOutfitName(outfit: ArmoireStoreOutfit): string {
    return (
      outfit.localizedNames?.['zh-CN'] ??
      outfit.localizedNames?.en ??
      outfit.name
    )
  }

  function buildSearchText(outfit: ArmoireStoreOutfit): string {
    return [
      getStoreReviewOutfitName(outfit),
      outfit.name,
      ...Object.values(outfit.localizedNames ?? {}),
      outfit.productId ?? '',
      outfit.skuId ?? '',
      outfit.priceLabel ?? '',
      outfit.mappingSource ?? '',
      ...outfit.itemNames,
      ...(outfit.globalItemNames ?? []),
      ...getArmoireStoreTagLabels(t, getMergedTags(outfit), getMergedDetailTags(outfit)),
      ...getMergedItemIds(outfit).map((itemId) => getArmoireItemName(catalog.value, itemId, t)),
      ...linkRegions.map((region) => getLinkValue(outfit, region.value))
    ].join(' ')
  }

  const filteredOutfits = computed(() => {
    const query = searchQuery.value.trim().toLocaleLowerCase()
    return storeCatalog.value.outfits.filter((outfit) => {
      if (selectedFilter.value === 'needsMapping' && !isNeedsMapping(outfit)) return false
      if (selectedFilter.value === 'pendingCorrection' && isCorrected(outfit.id)) return false
      if (selectedFilter.value === 'corrected' && !isCorrected(outfit.id)) return false
      if (selectedFilter.value === 'missingLinks' && !hasMissingLinks(outfit)) return false
      if (selectedFilter.value === 'edited' && !isEdited(outfit.id)) return false
      if (!matchesTagFilter(outfit)) return false
      if (!query) return true
      return buildSearchText(outfit).toLocaleLowerCase().includes(query)
    })
  })

  const visibleOutfits = computed(() => filteredOutfits.value.slice(0, visibleOutfitCount.value))
  const hasMoreVisibleOutfits = computed(() => visibleOutfitCount.value < filteredOutfits.value.length)

  watch([searchQuery, selectedFilter, selectedTagFilter, () => storeCatalog.value.generatedAt], () => {
    visibleOutfitCount.value = STORE_REVIEW_BATCH_SIZE
  })

  watch(loadMoreSentinel, (element) => observeLoadMoreSentinel(element), { flush: 'post' })

  function loadMoreVisibleOutfits() {
    visibleOutfitCount.value = Math.min(
      visibleOutfitCount.value + STORE_REVIEW_BATCH_SIZE,
      filteredOutfits.value.length
    )
  }

  function observeLoadMoreSentinel(element: HTMLElement | null) {
    disconnectLoadMoreObserver()
    if (!element || typeof window === 'undefined' || !('IntersectionObserver' in window)) return
    loadMoreObserver = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) loadMoreVisibleOutfits() },
      { rootMargin: '600px 0px' }
    )
    loadMoreObserver.observe(element)
  }

  function disconnectLoadMoreObserver() {
    loadMoreObserver?.disconnect()
    loadMoreObserver = null
  }

  return {
    searchQuery,
    selectedFilter,
    selectedTagFilter,
    filterOptions,
    tagFilterOptions,
    storeTagOptions,
    storeDetailTagOptions,
    filteredOutfits,
    visibleOutfits,
    hasMoreVisibleOutfits,
    visibleOutfitCount,
    loadMoreSentinel,
    linkRegions,
    loadMoreVisibleOutfits,
    observeLoadMoreSentinel,
    disconnectLoadMoreObserver,
    isCorrected,
    isEdited,
    isNeedsMapping,
    hasMissingLinks,
    matchesTagFilter,
    getStoreReviewOutfitName,
    isStoreTag,
    isStoreDetailTag,
  }
}
