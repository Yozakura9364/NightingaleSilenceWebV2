import { ref, computed, type Ref } from 'vue'
import type {
  ArmoireCatalog,
  ArmoireStoreOutfit,
  ArmoireStoreLinkRegion,
  ArmoireStoreRegionalPriceLabels,
  ArmoireStoreRegionalUrls,
  ArmoireStoreTag,
  ArmoireStoreDetailTag
} from '@/lib/armoire/types'
import {
  ARMOIRE_STORE_DETAIL_TAGS,
  ARMOIRE_STORE_TAGS
} from '@/lib/armoire/types'
import {
  ARMOIRE_STORE_DETAIL_TAG_LABEL_KEYS,
  ARMOIRE_STORE_TAG_LABEL_KEYS,
} from '@/pages/armoire/utils/storeTagDisplay'
import {
  formatArmoireText,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'
import { armoireTextKeys as textKeys } from '@/locales/keys/armoire'
import type { Locale } from '@/locales/types'
import type { LocaleFunction } from '@/stores/locale'
import { useArmoireStoreReviewCandidate } from '@/pages/armoire/composables/useArmoireStoreReviewCandidate'
import type { ArmoireStoreCatalog } from '@/lib/armoire/types'

export interface StoreReviewDraftEntry {
  regionalStoreUrls?: ArmoireStoreRegionalUrls
  regionalPriceLabels?: ArmoireStoreRegionalPriceLabels
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
    regionalStoreUrls?: ArmoireStoreRegionalUrls
    regionalPriceLabels?: ArmoireStoreRegionalPriceLabels
    itemIds?: number[]
    itemNames?: string[]
    tags?: ArmoireStoreTag[]
    detailTags?: ArmoireStoreDetailTag[]
    corrected?: boolean
    needsMapping?: boolean
    excluded?: boolean
  }>
}

export function useArmoireStoreReviewDraft(
  catalog: Ref<ArmoireCatalog>,
  storeCatalog: Ref<ArmoireStoreCatalog>,
  t: LocaleFunction,
  current: Ref<Locale>,
) {
  const STORE_REVIEW_DRAFT_KEY = 'nsarmoire.storeReview.draft.v1'
  const STORE_TAG_SET = new Set<ArmoireStoreTag>(ARMOIRE_STORE_TAGS)
  const STORE_DETAIL_TAG_SET = new Set<ArmoireStoreDetailTag>(ARMOIRE_STORE_DETAIL_TAGS)
  const candidateHelpers = useArmoireStoreReviewCandidate(getUniqueItemIds)

  const draftEntries = ref<Record<string, StoreReviewDraftEntry>>(loadDraftEntries())
  const itemDraftInputs = ref<Record<string, string>>({})
  const statusMessageKey = ref<string | null>(null)

  const linkRegions: Array<{ value: ArmoireStoreLinkRegion; labelKey: string }> = [
    { value: 'cn', labelKey: textKeys.nsarmoireStoreReviewRegionCn },
    { value: 'global', labelKey: textKeys.nsarmoireStoreReviewRegionGlobal },
    { value: 'tw', labelKey: textKeys.nsarmoireStoreReviewRegionTw },
    { value: 'kr', labelKey: textKeys.nsarmoireStoreReviewRegionKr }
  ]

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

  // --- Draft persistence ---

  function isStoreReviewDraftEntry(value: unknown): value is StoreReviewDraftEntry {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  function loadDraftEntries(): Record<string, StoreReviewDraftEntry> {
    if (typeof window === 'undefined') return {}

    try {
      const raw = window.localStorage.getItem(STORE_REVIEW_DRAFT_KEY)
      const parsed = raw ? (JSON.parse(raw) as unknown) : null
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

      const entries: Record<string, StoreReviewDraftEntry> = {}
      for (const [outfitId, value] of Object.entries(parsed)) {
        if (!isStoreReviewDraftEntry(value)) continue
        if (
          'regionalStoreUrls' in value ||
          'regionalPriceLabels' in value ||
          'itemIds' in value ||
          'tags' in value ||
          'detailTags' in value ||
          'corrected' in value ||
          'excluded' in value
        ) {
          const normalized = normalizeDraftEntry(value)
          if (hasStoredDraftEntry(normalized)) entries[outfitId] = normalized
          continue
        }
        entries[outfitId] = { regionalStoreUrls: value as ArmoireStoreRegionalUrls }
      }
      return entries
    } catch {
      return {}
    }
  }

  function saveDraftEntries(): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORE_REVIEW_DRAFT_KEY, JSON.stringify(draftEntries.value))
  }

  // --- Normalization and helpers ---

  function normalizeDraftEntry(entry: StoreReviewDraftEntry): StoreReviewDraftEntry {
    const shouldKeepTags = Array.isArray(entry.tags)
    const shouldKeepDetailTags = Array.isArray(entry.detailTags)
    return {
      ...(entry.regionalStoreUrls && Object.keys(entry.regionalStoreUrls).length > 0
        ? { regionalStoreUrls: entry.regionalStoreUrls } : {}),
      ...(entry.regionalPriceLabels && Object.keys(entry.regionalPriceLabels).length > 0
        ? { regionalPriceLabels: entry.regionalPriceLabels } : {}),
      ...(entry.itemIds && entry.itemIds.length > 0
        ? { itemIds: getUniqueItemIds(entry.itemIds) } : {}),
      ...(shouldKeepTags ? { tags: getUniqueStoreTags(entry.tags) } : {}),
      ...(shouldKeepDetailTags ? { detailTags: getUniqueStoreDetailTags(entry.detailTags) } : {}),
      ...(entry.corrected ? { corrected: true } : {}),
      ...(entry.excluded ? { excluded: true } : {})
    }
  }

  function getUniqueItemIds(itemIds: number[]): number[] {
    return Array.from(new Set(itemIds.filter((itemId) => Number.isInteger(itemId) && itemId > 0)))
  }

  function isStoreTag(value: unknown): value is ArmoireStoreTag {
    return typeof value === 'string' && STORE_TAG_SET.has(value as ArmoireStoreTag)
  }

  function isStoreDetailTag(value: unknown): value is ArmoireStoreDetailTag {
    return typeof value === 'string' && STORE_DETAIL_TAG_SET.has(value as ArmoireStoreDetailTag)
  }

  function getUniqueStoreTags(tags: readonly unknown[] | undefined): ArmoireStoreTag[] {
    return Array.from(new Set((tags ?? []).filter(isStoreTag)))
  }

  function getUniqueStoreDetailTags(detailTags: readonly unknown[] | undefined): ArmoireStoreDetailTag[] {
    return Array.from(new Set((detailTags ?? []).filter(isStoreDetailTag)))
  }

  function areSameStringArrays(left: readonly string[], right: readonly string[]): boolean {
    return left.length === right.length && left.every((value, index) => value === right[index])
  }

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

  function commitDraftEntry(
    outfitId: string,
    outfitDraft: StoreReviewDraftEntry,
    nextDraft: Record<string, StoreReviewDraftEntry>
  ): void {
    if (hasStoredDraftEntry(outfitDraft)) {
      nextDraft[outfitId] = normalizeDraftEntry(outfitDraft)
    } else {
      delete nextDraft[outfitId]
    }
    draftEntries.value = nextDraft
    statusMessageKey.value = null
    saveDraftEntries()
  }

  // --- Link/price helpers ---

  function getBaseLink(outfit: ArmoireStoreOutfit, region: ArmoireStoreLinkRegion): string {
    return outfit.regionalStoreUrls?.[region] ?? (region === outfit.region ? outfit.storeUrl : '')
  }

  function getLinkValue(outfit: ArmoireStoreOutfit, region: ArmoireStoreLinkRegion): string {
    return draftEntries.value[outfit.id]?.regionalStoreUrls?.[region] ?? getBaseLink(outfit, region)
  }

  function getFallbackPriceRegion(outfit: ArmoireStoreOutfit): ArmoireStoreLinkRegion {
    if (outfit.region === 'cn' || outfit.region === 'global') return outfit.region
    if (outfit.regionalStoreUrls?.global) return 'global'
    return 'cn'
  }

  function getBasePriceLabel(outfit: ArmoireStoreOutfit, region: ArmoireStoreLinkRegion): string {
    return outfit.regionalPriceLabels?.[region] ??
      (outfit.priceLabel && getFallbackPriceRegion(outfit) === region ? outfit.priceLabel : '')
  }

  function getPriceValue(outfit: ArmoireStoreOutfit, region: ArmoireStoreLinkRegion): string {
    return draftEntries.value[outfit.id]?.regionalPriceLabels?.[region] ?? getBasePriceLabel(outfit, region)
  }

  function updateLink(outfit: ArmoireStoreOutfit, region: ArmoireStoreLinkRegion, event: Event): void {
    const input = event.currentTarget
    if (!(input instanceof HTMLInputElement)) return
    const value = input.value.trim()
    const baseValue = getBaseLink(outfit, region)
    const nextDraft = { ...draftEntries.value }
    const outfitDraft = { ...(nextDraft[outfit.id] ?? {}) }
    const regionalStoreUrls = { ...(outfitDraft.regionalStoreUrls ?? {}) }

    if (!value || value === baseValue) {
      delete regionalStoreUrls[region]
    } else {
      regionalStoreUrls[region] = value
    }
    if (Object.keys(regionalStoreUrls).length > 0) {
      outfitDraft.regionalStoreUrls = regionalStoreUrls
    } else {
      delete outfitDraft.regionalStoreUrls
    }
    commitDraftEntry(outfit.id, outfitDraft, nextDraft)
  }

  function updatePrice(outfit: ArmoireStoreOutfit, region: ArmoireStoreLinkRegion, event: Event): void {
    const input = event.currentTarget
    if (!(input instanceof HTMLInputElement)) return
    const value = input.value.trim()
    const baseValue = getBasePriceLabel(outfit, region)
    const nextDraft = { ...draftEntries.value }
    const outfitDraft = { ...(nextDraft[outfit.id] ?? {}) }
    const regionalPriceLabels = { ...(outfitDraft.regionalPriceLabels ?? {}) }

    if (!value || value === baseValue) {
      delete regionalPriceLabels[region]
    } else {
      regionalPriceLabels[region] = value
    }
    if (Object.keys(regionalPriceLabels).length > 0) {
      outfitDraft.regionalPriceLabels = regionalPriceLabels
    } else {
      delete outfitDraft.regionalPriceLabels
    }
    commitDraftEntry(outfit.id, outfitDraft, nextDraft)
  }

  // --- State ---

  function isEdited(outfitId: string): boolean {
    const draft = draftEntries.value[outfitId]
    return Boolean(draft && hasStoredDraftEntry(draft))
  }

  function isCorrected(outfitId: string): boolean {
    return Boolean(draftEntries.value[outfitId]?.corrected)
  }

  function isExcluded(outfitId: string): boolean {
    return Boolean(draftEntries.value[outfitId]?.excluded)
  }

  function isNeedsMapping(outfit: ArmoireStoreOutfit): boolean {
    const itemIds = getMergedItemIds(outfit)
    return Boolean(outfit.needsMapping || itemIds.length < outfit.itemNames.length)
  }

  function hasMissingLinks(outfit: ArmoireStoreOutfit): boolean {
    return linkRegions.some((region) => !getLinkValue(outfit, region.value))
  }

  function setCorrectionState(outfitId: string, corrected: boolean): void {
    const nextDraft = { ...draftEntries.value }
    const outfitDraft = { ...(nextDraft[outfitId] ?? {}) }
    if (corrected) {
      outfitDraft.corrected = true
      delete outfitDraft.excluded
    } else {
      delete outfitDraft.corrected
    }
    commitDraftEntry(outfitId, outfitDraft, nextDraft)
  }

  function setExcludedState(outfitId: string, excluded: boolean): void {
    const nextDraft = { ...draftEntries.value }
    const outfitDraft = { ...(nextDraft[outfitId] ?? {}) }
    if (excluded) {
      outfitDraft.excluded = true
      delete outfitDraft.corrected
    } else {
      delete outfitDraft.excluded
    }
    commitDraftEntry(outfitId, outfitDraft, nextDraft)
  }

  // --- Tags ---

  function getStoreTagLabel(tag: ArmoireStoreTag): string {
    return t(ARMOIRE_STORE_TAG_LABEL_KEYS[tag])
  }

  function getStoreDetailTagLabel(tag: ArmoireStoreDetailTag): string {
    return t(ARMOIRE_STORE_DETAIL_TAG_LABEL_KEYS[tag])
  }

  function getMergedTags(outfit: ArmoireStoreOutfit): ArmoireStoreTag[] {
    return getUniqueStoreTags(draftEntries.value[outfit.id]?.tags ?? outfit.tags ?? [])
  }

  function getMergedDetailTags(outfit: ArmoireStoreOutfit): ArmoireStoreDetailTag[] {
    return getUniqueStoreDetailTags(draftEntries.value[outfit.id]?.detailTags ?? outfit.detailTags ?? [])
  }

  function getAvailableStoreTagOptions(outfit: ArmoireStoreOutfit) {
    const selectedTags = new Set(getMergedTags(outfit))
    return storeTagOptions.value.filter((option) => !selectedTags.has(option.value))
  }

  function getAvailableStoreDetailTagOptions(outfit: ArmoireStoreOutfit) {
    const selectedTags = new Set(getMergedDetailTags(outfit))
    return storeDetailTagOptions.value.filter((option) => !selectedTags.has(option.value))
  }

  function addStoreTagFromEvent(outfit: ArmoireStoreOutfit, event: Event): void {
    const select = event.currentTarget
    if (!(select instanceof HTMLSelectElement)) return
    const tag = select.value
    select.value = ''
    if (!isStoreTag(tag)) return
    setDraftTags(outfit, getUniqueStoreTags([...getMergedTags(outfit), tag]))
  }

  function addDetailTagFromEvent(outfit: ArmoireStoreOutfit, event: Event): void {
    const select = event.currentTarget
    if (!(select instanceof HTMLSelectElement)) return
    const tag = select.value
    select.value = ''
    if (!isStoreDetailTag(tag)) return
    setDraftDetailTags(outfit, getUniqueStoreDetailTags([...getMergedDetailTags(outfit), tag]))
  }

  function removeStoreTag(outfit: ArmoireStoreOutfit, tag: ArmoireStoreTag): void {
    setDraftTags(outfit, getUniqueStoreTags(getMergedTags(outfit).filter((t) => t !== tag)))
  }

  function removeDetailTag(outfit: ArmoireStoreOutfit, tag: ArmoireStoreDetailTag): void {
    setDraftDetailTags(outfit, getUniqueStoreDetailTags(getMergedDetailTags(outfit).filter((t) => t !== tag)))
  }

  function setDraftTags(outfit: ArmoireStoreOutfit, tags: ArmoireStoreTag[]): void {
    const baseTags = getUniqueStoreTags(outfit.tags ?? [])
    const nextTags = getUniqueStoreTags(tags)
    const nextDraft = { ...draftEntries.value }
    const outfitDraft = { ...(nextDraft[outfit.id] ?? {}) }
    if (areSameStringArrays(nextTags, baseTags)) {
      delete outfitDraft.tags
    } else {
      outfitDraft.tags = nextTags
    }
    commitDraftEntry(outfit.id, outfitDraft, nextDraft)
  }

  function setDraftDetailTags(outfit: ArmoireStoreOutfit, detailTags: ArmoireStoreDetailTag[]): void {
    const baseTags = getUniqueStoreDetailTags(outfit.detailTags ?? [])
    const nextTags = getUniqueStoreDetailTags(detailTags)
    const nextDraft = { ...draftEntries.value }
    const outfitDraft = { ...(nextDraft[outfit.id] ?? {}) }
    if (areSameStringArrays(nextTags, baseTags)) {
      delete outfitDraft.detailTags
    } else {
      outfitDraft.detailTags = nextTags
    }
    commitDraftEntry(outfit.id, outfitDraft, nextDraft)
  }

  // --- Items ---

  function getDraftItemIds(outfit: ArmoireStoreOutfit): number[] {
    return getUniqueItemIds(draftEntries.value[outfit.id]?.itemIds ?? [])
  }

  function getMergedItemIds(outfit: ArmoireStoreOutfit): number[] {
    return getUniqueItemIds([...outfit.itemIds, ...getDraftItemIds(outfit)])
  }

  function getStoreReviewOutfitName(outfit: ArmoireStoreOutfit): string {
    return (outfit.localizedNames as Record<string, string | undefined> | undefined)?.[current.value] ??
      outfit.localizedNames?.['zh-CN'] ??
      outfit.localizedNames?.en ??
      outfit.name
  }

  function getCoverIconUrl(outfit: ArmoireStoreOutfit): string {
    const coverItemId = outfit.coverItemId ?? getMergedItemIds(outfit)[0]
    return coverItemId ? getArmoireItemIconUrl(catalog.value, coverItemId) : ''
  }

  function getPieceViews(outfit: ArmoireStoreOutfit) {
    const mergedItemIds = getMergedItemIds(outfit)
    const draftItemIds = new Set(getDraftItemIds(outfit))
    const usedItemIds = new Set<number>()
    const views: Array<{ key: string; name: string; itemId?: number; iconUrl: string; isDraft: boolean }> = []

    outfit.itemNames.forEach((name, index) => {
      const itemId = mergedItemIds.find(
        (candidateId) =>
          !usedItemIds.has(candidateId) &&
          catalog.value.items[candidateId]?.name?.trim() === name.trim()
      )
      if (!itemId) {
        views.push({ key: `${outfit.id}-name-${index}`, name, iconUrl: '', isDraft: false })
        return
      }
      usedItemIds.add(itemId)
      views.push({
        key: `${outfit.id}-name-${index}-${itemId}`,
        name: getArmoireItemName(catalog.value, itemId, t),
        itemId,
        iconUrl: getArmoireItemIconUrl(catalog.value, itemId),
        isDraft: draftItemIds.has(itemId)
      })
    })

    for (const itemId of mergedItemIds) {
      if (usedItemIds.has(itemId)) continue
      views.push({
        key: `${outfit.id}-${itemId}`,
        name: getArmoireItemName(catalog.value, itemId, t),
        itemId,
        iconUrl: getArmoireItemIconUrl(catalog.value, itemId),
        isDraft: draftItemIds.has(itemId)
      })
    }
    return views
  }

  function getCandidateViews(outfit: ArmoireStoreOutfit) {
    const existingItemIds = new Set(getMergedItemIds(outfit))
    const candidates = Object.values(catalog.value.items)
      .filter((item: any) => item.name?.trim())
      .map((item: any) => ({
        item,
        name: item.name.trim(),
        score: candidateHelpers.getCandidateScore(item.name.trim(), candidateHelpers.buildCandidateSearchKeys(outfit))
      }))
      .filter((entry: any) => entry.score > 0)
      .sort(
        (left: any, right: any) =>
          right.score - left.score ||
          left.name.length - right.name.length ||
          left.item.itemId - right.item.itemId
      )
      .slice(0, 12)
      .map((entry: any) => {
        const pieceItemIds = candidateHelpers.getCandidatePieceItemIds(entry.item.pieceItemIds, catalog.value)
        return {
          itemId: entry.item.itemId,
          name: entry.name,
          iconUrl: '',
          isAdded: existingItemIds.has(entry.item.itemId),
          pieceItemIds,
          arePiecesAdded:
            pieceItemIds.length > 0 && pieceItemIds.every((id: number) => existingItemIds.has(id))
        }
      })
    return candidates.length > 0 ? candidates : []
  }

  function getLinkInputId(outfitId: string, region: ArmoireStoreLinkRegion): string {
    return `nsarmoire-store-review-${outfitId}-${region}`
  }

  function getPriceInputId(outfitId: string, region: ArmoireStoreLinkRegion): string {
    return `nsarmoire-store-review-${outfitId}-${region}-price`
  }

  function getItemInputId(outfitId: string): string {
    return `nsarmoire-store-review-${outfitId}-item`
  }

  function addDraftItem(outfit: ArmoireStoreOutfit): void {
    const input = itemDraftInputs.value[outfit.id]?.trim() ?? ''
    const itemId = candidateHelpers.resolveCatalogItemId(input, catalog.value)
    if (!itemId) {
      statusMessageKey.value = textKeys.nsarmoireStoreReviewItemNotFound
      return
    }
    addDraftItemId(outfit, itemId)
    itemDraftInputs.value = { ...itemDraftInputs.value, [outfit.id]: '' }
  }

  function addDraftItemId(outfit: ArmoireStoreOutfit, itemId: number): void {
    addDraftItemIds(outfit, [itemId])
  }

  function addDraftItemIds(outfit: ArmoireStoreOutfit, itemIds: number[]): void {
    const existingItemIds = new Set(getMergedItemIds(outfit))
    const nextItemIds = getUniqueItemIds(
      itemIds.filter((itemId) => catalog.value.items[itemId] && !existingItemIds.has(itemId))
    )
    if (nextItemIds.length === 0) {
      statusMessageKey.value = textKeys.nsarmoireStoreReviewItemDuplicate
      return
    }
    const nextDraft = { ...draftEntries.value }
    const outfitDraft = { ...(nextDraft[outfit.id] ?? {}) }
    outfitDraft.itemIds = getUniqueItemIds([...(outfitDraft.itemIds ?? []), ...nextItemIds])
    nextDraft[outfit.id] = normalizeDraftEntry(outfitDraft)
    draftEntries.value = nextDraft
    statusMessageKey.value = textKeys.nsarmoireStoreReviewItemAdded
    saveDraftEntries()
  }

  function removeDraftItem(outfit: ArmoireStoreOutfit, itemId: number): void {
    const nextDraft = { ...draftEntries.value }
    const outfitDraft = { ...(nextDraft[outfit.id] ?? {}) }
    outfitDraft.itemIds = getUniqueItemIds((outfitDraft.itemIds ?? []).filter((id) => id !== itemId))
    commitDraftEntry(outfit.id, outfitDraft, nextDraft)
  }

  function hideBrokenImage(event: Event): void {
    const image = event.currentTarget
    if (image instanceof HTMLImageElement) {
      image.style.visibility = 'hidden'
    }
  }

  // --- Patch ---

  function buildPatch(): StoreReviewPatch {
    const outfitIndex = new Map<string, ArmoireStoreOutfit>(storeCatalog.value.outfits.map((o: ArmoireStoreOutfit) => [o.id, o]))
    const outfits = Object.entries(draftEntries.value)
      .filter(([, draft]) => hasStoredDraftEntry(draft))
      .map(([id, draft]) => {
        const outfit = outfitIndex.get(id)
        if (!outfit) return null
        if (draft.excluded) {
          return { id, name: getStoreReviewOutfitName(outfit), productId: outfit.productId, skuId: outfit.skuId, excluded: true }
        }
        const mergedItemIds = getMergedItemIds(outfit)
        const itemIdsChanged = (draft.itemIds ?? []).length > 0
        const tagsChanged = draft.tags !== undefined
        const detailTagsChanged = draft.detailTags !== undefined
        const itemNames = mergedItemIds.map((itemId) => getArmoireItemName(catalog.value, itemId, t))
        const needsMapping = itemIdsChanged && mergedItemIds.length >= Math.max(outfit.itemNames.length, mergedItemIds.length)
          ? false : outfit.needsMapping
        return {
          id, name: getStoreReviewOutfitName(outfit), productId: outfit.productId, skuId: outfit.skuId,
          ...(draft.regionalStoreUrls ? { regionalStoreUrls: draft.regionalStoreUrls } : {}),
          ...(draft.regionalPriceLabels ? { regionalPriceLabels: draft.regionalPriceLabels } : {}),
          ...(draft.corrected ? { corrected: true } : {}),
          ...(tagsChanged ? { tags: getMergedTags(outfit) } : {}),
          ...(detailTagsChanged ? { detailTags: getMergedDetailTags(outfit) } : {}),
          ...(itemIdsChanged ? { itemIds: mergedItemIds, itemNames, needsMapping } : {})
        }
      })
      .filter((outfit): outfit is NonNullable<typeof outfit> => Boolean(outfit))

    return { schemaVersion: 'nsarmoire.storeCatalogCorrections.v1', generatedAt: new Date().toISOString(), outfits }
  }

  const editedCount = computed(() =>
    Object.values(draftEntries.value).filter((entry) => hasStoredDraftEntry(entry)).length
  )
  const editedCountLabel = computed(() =>
    editedCount.value > 0
      ? formatArmoireText(t, textKeys.nsarmoireStoreReviewChangedCount, { count: editedCount.value })
      : t(textKeys.nsarmoireStoreReviewNoChanges)
  )

  async function copyPatch(): Promise<void> {
    if (editedCount.value === 0) {
      statusMessageKey.value = textKeys.nsarmoireStoreReviewNoChanges
      return
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildPatch(), null, 2))
      statusMessageKey.value = textKeys.nsarmoireStoreReviewPatchCopied
    } catch {
      statusMessageKey.value = textKeys.nsarmoireStoreReviewPatchCopyFailed
    }
  }

  function downloadPatch(): void {
    if (editedCount.value === 0 || typeof window === 'undefined') {
      statusMessageKey.value = textKeys.nsarmoireStoreReviewNoChanges
      return
    }
    const blob = new Blob([`${JSON.stringify(buildPatch(), null, 2)}\n`], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'armoire-store-catalog-corrections.json'
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  function resetDraft(): void {
    draftEntries.value = {}
    itemDraftInputs.value = {}
    statusMessageKey.value = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORE_REVIEW_DRAFT_KEY)
    }
  }

  function reloadStoreCatalog(): void {
    ;(window as any).__nsarmoireStoreReviewReload?.()
  }

  return {
    draftEntries,
    itemDraftInputs,
    statusMessageKey,
    linkRegions,
    storeTagOptions,
    storeDetailTagOptions,
    getLinkValue,
    updateLink,
    getPriceValue,
    updatePrice,
    isEdited,
    isCorrected,
    isExcluded,
    isNeedsMapping,
    hasMissingLinks,
    setCorrectionState,
    setExcludedState,
    getStoreTagLabel,
    getStoreDetailTagLabel,
    getMergedTags,
    getMergedDetailTags,
    getAvailableStoreTagOptions,
    getAvailableStoreDetailTagOptions,
    addStoreTagFromEvent,
    addDetailTagFromEvent,
    removeStoreTag,
    removeDetailTag,
    getDraftItemIds,
    getMergedItemIds,
    getStoreReviewOutfitName,
    getCoverIconUrl,
    getPieceViews,
    getCandidateViews,
    getLinkInputId,
    getPriceInputId,
    getItemInputId,
    addDraftItem,
    addDraftItemId,
    addDraftItemIds,
    removeDraftItem,
    hideBrokenImage,
    buildPatch,
    copyPatch,
    downloadPatch,
    resetDraft,
    reloadStoreCatalog,
    editedCountLabel,
    getUniqueItemIds,
    candidateHelpers,
  }
}
