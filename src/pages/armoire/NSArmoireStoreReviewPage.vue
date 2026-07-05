<template>
  <FfxivToolShell :tool="tool" variant="workspace">
    <main class="nsarmoire-store-review">
      <header class="nsarmoire-store-review__header">
        <div>
          <h1>{{ t(textKeys.nsarmoireStoreReviewTitle) }}</h1>
          <p>{{ t(textKeys.nsarmoireStoreReviewSummary) }}</p>
        </div>

        <div class="nsarmoire-store-review__actions">
          <span class="nsarmoire-store-review__edited-count">
            {{ editedCountLabel }}
          </span>
          <AppButton @click="copyPatch">
            {{ t(textKeys.nsarmoireStoreReviewCopyPatch) }}
          </AppButton>
          <AppButton @click="downloadPatch">
            {{ t(textKeys.nsarmoireStoreReviewDownloadPatch) }}
          </AppButton>
          <AppButton @click="resetDraft">
            {{ t(textKeys.nsarmoireStoreReviewResetDraft) }}
          </AppButton>
        </div>
      </header>

      <AppStatus
        v-if="storeCatalogStatus === 'loading' || catalogStatus === 'loading'"
        compact
        tone="loading"
        :message="t(textKeys.nsarmoireStoreCatalogLoading)"
      />

      <AppStatus
        v-else-if="storeCatalogStatus === 'error'"
        compact
        tone="danger"
        :title="t(textKeys.nsarmoireStoreCatalogError)"
        :message="storeCatalogError ?? undefined"
      >
        <template #actions>
          <AppButton @click="loadStoreCatalog">
            {{ t(textKeys.nsarmoireStoreCatalogRetry) }}
          </AppButton>
        </template>
      </AppStatus>

      <AppStatus v-if="statusMessageKey" compact tone="info" :message="t(statusMessageKey)" />

      <section class="nsarmoire-store-review__controls">
        <AppField
          :label="t(textKeys.nsarmoireStoreSearchLabel)"
          for-id="nsarmoire-store-review-search"
          density="compact"
        >
          <input
            id="nsarmoire-store-review-search"
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            :placeholder="t(textKeys.nsarmoireStoreSearchPlaceholder)"
          />
        </AppField>

        <AppField
          :label="t(textKeys.nsarmoireStoreFilterLabel)"
          for-id="nsarmoire-store-review-filter"
          density="compact"
        >
          <select id="nsarmoire-store-review-filter" v-model="selectedFilter">
            <option v-for="option in filterOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </AppField>
      </section>

      <AppStatus
        v-if="visibleOutfits.length === 0"
        compact
        tone="info"
        :message="t(textKeys.nsarmoireStoreReviewNoResults)"
      />

      <ol v-else class="nsarmoire-store-review__list">
        <li
          v-for="outfit in visibleOutfits"
          :key="outfit.id"
          class="nsarmoire-store-review__row"
          :class="{
            'nsarmoire-store-review__row--edited': isEdited(outfit.id),
            'nsarmoire-store-review__row--corrected': isCorrected(outfit.id),
            'nsarmoire-store-review__row--needs-mapping': isNeedsMapping(outfit)
          }"
        >
          <section class="nsarmoire-store-review__outfit">
            <div class="nsarmoire-store-review__cover">
              <img
                v-if="getCoverIconUrl(outfit)"
                :src="getCoverIconUrl(outfit)"
                :alt="outfit.name"
                loading="lazy"
                @error="hideBrokenImage"
              />
              <span v-else aria-hidden="true"></span>
            </div>

            <div class="nsarmoire-store-review__outfit-main">
              <span class="nsarmoire-store-review__column-label">
                {{ t(textKeys.nsarmoireStoreReviewOutfitColumn) }}
              </span>
              <h2>{{ outfit.name }}</h2>
              <div class="nsarmoire-store-review__meta">
                <span v-if="outfit.priceLabel">{{ outfit.priceLabel }}</span>
                <span v-if="outfit.productId">{{ outfit.productId }}</span>
                <span v-if="outfit.skuId">{{ outfit.skuId }}</span>
                <span v-if="outfit.mappingSource">{{ outfit.mappingSource }}</span>
              </div>
              <ul v-if="getTagLabels(outfit).length > 0" class="nsarmoire-store-review__tags">
                <li v-for="tag in getTagLabels(outfit)" :key="tag">{{ tag }}</li>
              </ul>
            </div>
          </section>

          <section class="nsarmoire-store-review__items">
            <span class="nsarmoire-store-review__column-label">
              {{ t(textKeys.nsarmoireStoreReviewItemsColumn) }}
            </span>

            <ul v-if="getPieceViews(outfit).length > 0">
              <li
                v-for="piece in getPieceViews(outfit)"
                :key="piece.key"
                :class="{ 'nsarmoire-store-review__item--draft': piece.isDraft }"
              >
                <img v-if="piece.iconUrl" :src="piece.iconUrl" :alt="piece.name" loading="lazy" />
                <span v-else class="nsarmoire-store-review__item-fallback" aria-hidden="true" />
                <span class="nsarmoire-store-review__item-name">{{ piece.name }}</span>
                <span v-if="piece.itemId" class="nsarmoire-store-review__item-id">
                  #{{ piece.itemId }}
                </span>
                <span v-if="piece.isDraft" class="nsarmoire-store-review__item-draft">
                  {{ t(textKeys.nsarmoireStoreReviewItemDraft) }}
                </span>
                <button
                  v-if="piece.isDraft && piece.itemId"
                  type="button"
                  class="nsarmoire-store-review__item-remove"
                  @click="removeDraftItem(outfit, piece.itemId)"
                >
                  {{ t(textKeys.nsarmoireStoreReviewRemoveItem) }}
                </button>
              </li>
            </ul>

            <span v-else class="nsarmoire-store-review__empty">
              {{ t(textKeys.nsarmoireStoreReviewNoItems) }}
            </span>

            <div class="nsarmoire-store-review__add-item">
              <label :for="getItemInputId(outfit.id)">
                {{ t(textKeys.nsarmoireStoreReviewAddItemLabel) }}
              </label>
              <div class="nsarmoire-store-review__add-item-control">
                <input
                  :id="getItemInputId(outfit.id)"
                  v-model="itemDraftInputs[outfit.id]"
                  type="text"
                  autocomplete="off"
                  :placeholder="t(textKeys.nsarmoireStoreReviewAddItemPlaceholder)"
                  @keydown.enter.prevent="addDraftItem(outfit)"
                />
                <button type="button" @click="addDraftItem(outfit)">
                  {{ t(textKeys.nsarmoireStoreReviewAddItem) }}
                </button>
              </div>
            </div>
          </section>

          <section class="nsarmoire-store-review__links">
            <span class="nsarmoire-store-review__column-label">
              {{ t(textKeys.nsarmoireStoreReviewLinksColumn) }}
            </span>

            <div
              v-for="region in linkRegions"
              :key="region.value"
              class="nsarmoire-store-review__link-field"
            >
              <label :for="getLinkInputId(outfit.id, region.value)">
                {{ t(region.labelKey) }}
              </label>
              <div class="nsarmoire-store-review__link-control">
                <input
                  :id="getLinkInputId(outfit.id, region.value)"
                  :value="getLinkValue(outfit, region.value)"
                  type="url"
                  autocomplete="off"
                  :placeholder="t(textKeys.nsarmoireStoreReviewLinkPlaceholder)"
                  @input="updateLink(outfit, region.value, $event)"
                />
                <a
                  v-if="getLinkValue(outfit, region.value)"
                  :href="getLinkValue(outfit, region.value)"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ t(textKeys.nsarmoireStoreReviewOpenLink) }}
                </a>
              </div>
            </div>
          </section>

          <section class="nsarmoire-store-review__state">
            <span class="nsarmoire-store-review__column-label">
              {{ t(textKeys.nsarmoireStoreReviewStateColumn) }}
            </span>
            <span v-if="isNeedsMapping(outfit)" class="nsarmoire-store-review__badge">
              {{ t(textKeys.nsarmoireStoreStatusNeedsMapping) }}
            </span>
            <span v-else class="nsarmoire-store-review__badge">
              {{ t(textKeys.nsarmoireStoreMetricMapped) }}
            </span>
            <span v-if="hasMissingLinks(outfit)" class="nsarmoire-store-review__badge">
              {{ t(textKeys.nsarmoireStoreReviewFilterMissingLinks) }}
            </span>
            <span v-if="isEdited(outfit.id)" class="nsarmoire-store-review__badge">
              {{ t(textKeys.nsarmoireStoreReviewFilterEdited) }}
            </span>
            <span
              class="nsarmoire-store-review__badge"
              :class="
                isCorrected(outfit.id)
                  ? 'nsarmoire-store-review__badge--corrected'
                  : 'nsarmoire-store-review__badge--pending'
              "
            >
              {{
                t(
                  isCorrected(outfit.id)
                    ? textKeys.nsarmoireStoreReviewStatusCorrected
                    : textKeys.nsarmoireStoreReviewStatusPendingCorrection
                )
              }}
            </span>
            <button
              type="button"
              class="nsarmoire-store-review__state-action"
              @click="setCorrectionState(outfit.id, !isCorrected(outfit.id))"
            >
              {{
                t(
                  isCorrected(outfit.id)
                    ? textKeys.nsarmoireStoreReviewUnconfirmCorrected
                    : textKeys.nsarmoireStoreReviewConfirmCorrected
                )
              }}
            </button>
          </section>
        </li>
      </ol>
    </main>
  </FfxivToolShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppStatus from '@/components/AppStatus.vue'
import { getRequiredFfxivTool, textKeys } from '@/config/site'
import type {
  ArmoireStoreLinkRegion,
  ArmoireStoreOutfit,
  ArmoireStoreRegionalUrls
} from '@/lib/armoire/types'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import { useArmoireCatalog } from '@/pages/armoire/composables/useArmoireCatalog'
import { useArmoireStoreCatalog } from '@/pages/armoire/composables/useArmoireStoreCatalog'
import {
  formatArmoireText,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'
import { getArmoireStoreTagLabels } from '@/pages/armoire/utils/storeTagDisplay'
import { useLocale } from '@/stores/locale'

type StoreReviewFilter =
  'all' | 'pendingCorrection' | 'corrected' | 'needsMapping' | 'missingLinks' | 'edited'

interface StoreReviewPieceView {
  key: string
  name: string
  itemId?: number
  iconUrl: string
  isDraft: boolean
}

interface StoreReviewDraftEntry {
  regionalStoreUrls?: ArmoireStoreRegionalUrls
  itemIds?: number[]
  corrected?: boolean
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
    itemIds?: number[]
    itemNames?: string[]
    corrected?: boolean
    needsMapping?: boolean
  }>
}

const STORE_REVIEW_DRAFT_KEY = 'nsarmoire.storeReview.draft.v1'
const tool = getRequiredFfxivTool('armoire')
const { t } = useLocale()
const { catalog, status: catalogStatus } = useArmoireCatalog()
const {
  storeCatalog,
  status: storeCatalogStatus,
  error: storeCatalogError,
  loadStoreCatalog
} = useArmoireStoreCatalog()
const searchQuery = ref('')
const selectedFilter = ref<StoreReviewFilter>('all')
const statusMessageKey = ref<string | null>(null)
const draftEntries = ref<Record<string, StoreReviewDraftEntry>>(loadDraftEntries())
const itemDraftInputs = ref<Record<string, string>>({})

const linkRegions: Array<{ value: ArmoireStoreLinkRegion; labelKey: string }> = [
  { value: 'cn', labelKey: textKeys.nsarmoireStoreReviewRegionCn },
  { value: 'global', labelKey: textKeys.nsarmoireStoreReviewRegionGlobal },
  { value: 'tw', labelKey: textKeys.nsarmoireStoreReviewRegionTw },
  { value: 'kr', labelKey: textKeys.nsarmoireStoreReviewRegionKr }
]

const filterOptions = computed<Array<{ value: StoreReviewFilter; label: string }>>(() => [
  { value: 'all', label: t(textKeys.nsarmoireStoreReviewFilterAll) },
  {
    value: 'pendingCorrection',
    label: t(textKeys.nsarmoireStoreReviewFilterPendingCorrection)
  },
  { value: 'corrected', label: t(textKeys.nsarmoireStoreReviewFilterCorrected) },
  { value: 'needsMapping', label: t(textKeys.nsarmoireStoreReviewFilterNeedsMapping) },
  { value: 'missingLinks', label: t(textKeys.nsarmoireStoreReviewFilterMissingLinks) },
  { value: 'edited', label: t(textKeys.nsarmoireStoreReviewFilterEdited) }
])

const filteredOutfits = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()

  return storeCatalog.value.outfits.filter((outfit) => {
    if (selectedFilter.value === 'needsMapping' && !isNeedsMapping(outfit)) {
      return false
    }

    if (selectedFilter.value === 'pendingCorrection' && isCorrected(outfit.id)) {
      return false
    }

    if (selectedFilter.value === 'corrected' && !isCorrected(outfit.id)) {
      return false
    }

    if (selectedFilter.value === 'missingLinks' && !hasMissingLinks(outfit)) {
      return false
    }

    if (selectedFilter.value === 'edited' && !isEdited(outfit.id)) {
      return false
    }

    if (!query) {
      return true
    }

    return buildSearchText(outfit).toLocaleLowerCase().includes(query)
  })
})

const visibleOutfits = computed(() => filteredOutfits.value)
const editedCount = computed(
  () => Object.values(draftEntries.value).filter((entry) => hasStoredDraftEntry(entry)).length
)
const editedCountLabel = computed(() =>
  editedCount.value > 0
    ? formatArmoireText(t, textKeys.nsarmoireStoreReviewChangedCount, {
        count: editedCount.value
      })
    : t(textKeys.nsarmoireStoreReviewNoChanges)
)

function isStoreReviewDraftEntry(value: unknown): value is StoreReviewDraftEntry {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function loadDraftEntries(): Record<string, StoreReviewDraftEntry> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORE_REVIEW_DRAFT_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : null

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    const entries: Record<string, StoreReviewDraftEntry> = {}

    for (const [outfitId, value] of Object.entries(parsed)) {
      if (!isStoreReviewDraftEntry(value)) {
        continue
      }

      if ('regionalStoreUrls' in value || 'itemIds' in value || 'corrected' in value) {
        const normalized = normalizeDraftEntry(value)

        if (hasStoredDraftEntry(normalized)) {
          entries[outfitId] = normalized
        }
        continue
      }

      entries[outfitId] = {
        regionalStoreUrls: value as ArmoireStoreRegionalUrls
      }
    }

    return entries
  } catch {
    return {}
  }
}

function saveDraftEntries(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORE_REVIEW_DRAFT_KEY, JSON.stringify(draftEntries.value))
}

function hasDraftEntry(entry: StoreReviewDraftEntry): boolean {
  return Boolean(
    (entry.regionalStoreUrls && Object.keys(entry.regionalStoreUrls).length > 0) ||
    (entry.itemIds && entry.itemIds.length > 0)
  )
}

function hasStoredDraftEntry(entry: StoreReviewDraftEntry): boolean {
  return Boolean(hasDraftEntry(entry) || entry.corrected)
}

function normalizeDraftEntry(entry: StoreReviewDraftEntry): StoreReviewDraftEntry {
  return {
    ...(entry.regionalStoreUrls && Object.keys(entry.regionalStoreUrls).length > 0
      ? { regionalStoreUrls: entry.regionalStoreUrls }
      : {}),
    ...(entry.itemIds && entry.itemIds.length > 0
      ? { itemIds: getUniqueItemIds(entry.itemIds) }
      : {}),
    ...(entry.corrected ? { corrected: true } : {})
  }
}

function getUniqueItemIds(itemIds: number[]): number[] {
  return Array.from(new Set(itemIds.filter((itemId) => Number.isInteger(itemId) && itemId > 0)))
}

function getBaseLink(outfit: ArmoireStoreOutfit, region: ArmoireStoreLinkRegion): string {
  return outfit.regionalStoreUrls?.[region] ?? (region === 'cn' ? outfit.storeUrl : '')
}

function getLinkValue(outfit: ArmoireStoreOutfit, region: ArmoireStoreLinkRegion): string {
  return draftEntries.value[outfit.id]?.regionalStoreUrls?.[region] ?? getBaseLink(outfit, region)
}

function updateLink(
  outfit: ArmoireStoreOutfit,
  region: ArmoireStoreLinkRegion,
  event: Event
): void {
  const input = event.currentTarget

  if (!(input instanceof HTMLInputElement)) {
    return
  }

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

  if (hasStoredDraftEntry(outfitDraft)) {
    nextDraft[outfit.id] = normalizeDraftEntry(outfitDraft)
  } else {
    delete nextDraft[outfit.id]
  }

  draftEntries.value = nextDraft
  statusMessageKey.value = null
  saveDraftEntries()
}

function isEdited(outfitId: string): boolean {
  const draft = draftEntries.value[outfitId]

  return Boolean(draft && hasDraftEntry(draft))
}

function isCorrected(outfitId: string): boolean {
  return Boolean(draftEntries.value[outfitId]?.corrected)
}

function setCorrectionState(outfitId: string, corrected: boolean): void {
  const nextDraft = { ...draftEntries.value }
  const outfitDraft = { ...(nextDraft[outfitId] ?? {}) }

  if (corrected) {
    outfitDraft.corrected = true
  } else {
    delete outfitDraft.corrected
  }

  if (hasStoredDraftEntry(outfitDraft)) {
    nextDraft[outfitId] = normalizeDraftEntry(outfitDraft)
  } else {
    delete nextDraft[outfitId]
  }

  draftEntries.value = nextDraft
  statusMessageKey.value = null
  saveDraftEntries()
}

function isNeedsMapping(outfit: ArmoireStoreOutfit): boolean {
  const itemIds = getMergedItemIds(outfit)

  return Boolean(outfit.needsMapping || itemIds.length < outfit.itemNames.length)
}

function hasMissingLinks(outfit: ArmoireStoreOutfit): boolean {
  return linkRegions.some((region) => !getLinkValue(outfit, region.value))
}

function buildSearchText(outfit: ArmoireStoreOutfit): string {
  return [
    outfit.name,
    outfit.productId ?? '',
    outfit.skuId ?? '',
    outfit.priceLabel ?? '',
    outfit.mappingSource ?? '',
    ...outfit.itemNames,
    ...(outfit.globalItemNames ?? []),
    ...getTagLabels(outfit),
    ...getMergedItemIds(outfit).map((itemId) => getArmoireItemName(catalog.value, itemId, t)),
    ...linkRegions.map((region) => getLinkValue(outfit, region.value))
  ].join(' ')
}

function getTagLabels(outfit: ArmoireStoreOutfit): string[] {
  return getArmoireStoreTagLabels(t, outfit.tags, outfit.detailTags)
}

function getDraftItemIds(outfit: ArmoireStoreOutfit): number[] {
  return getUniqueItemIds(draftEntries.value[outfit.id]?.itemIds ?? [])
}

function getMergedItemIds(outfit: ArmoireStoreOutfit): number[] {
  return getUniqueItemIds([...outfit.itemIds, ...getDraftItemIds(outfit)])
}

function getCoverIconUrl(outfit: ArmoireStoreOutfit): string {
  const coverItemId = outfit.coverItemId ?? getMergedItemIds(outfit)[0]

  return coverItemId ? getArmoireItemIconUrl(catalog.value, coverItemId) : ''
}

function getPieceViews(outfit: ArmoireStoreOutfit): StoreReviewPieceView[] {
  const mergedItemIds = getMergedItemIds(outfit)
  const draftItemIds = new Set(getDraftItemIds(outfit))
  const usedItemIds = new Set<number>()
  const views: StoreReviewPieceView[] = []

  outfit.itemNames.forEach((name, index) => {
    const itemId = mergedItemIds.find(
      (candidateId) =>
        !usedItemIds.has(candidateId) &&
        catalog.value.items[candidateId]?.name?.trim() === name.trim()
    )

    if (!itemId) {
      views.push({
        key: `${outfit.id}-name-${index}`,
        name,
        iconUrl: '',
        isDraft: false
      })
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
    if (usedItemIds.has(itemId)) {
      continue
    }

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

function resolveCatalogItemId(input: string): number | undefined {
  const query = input.trim()

  if (!query) {
    return undefined
  }

  const numericId = Number(query)

  if (Number.isInteger(numericId) && catalog.value.items[numericId]) {
    return numericId
  }

  const exactMatch = Object.values(catalog.value.items).find((item) => item.name?.trim() === query)

  if (exactMatch) {
    return exactMatch.itemId
  }

  const partialMatches = Object.values(catalog.value.items)
    .filter((item) => item.name?.includes(query))
    .sort(
      (left, right) =>
        (left.name?.length ?? 0) - (right.name?.length ?? 0) || left.itemId - right.itemId
    )

  return partialMatches[0]?.itemId
}

function addDraftItem(outfit: ArmoireStoreOutfit): void {
  const input = itemDraftInputs.value[outfit.id]?.trim() ?? ''
  const itemId = resolveCatalogItemId(input)

  if (!itemId) {
    statusMessageKey.value = textKeys.nsarmoireStoreReviewItemNotFound
    return
  }

  if (getMergedItemIds(outfit).includes(itemId)) {
    statusMessageKey.value = textKeys.nsarmoireStoreReviewItemDuplicate
    return
  }

  const nextDraft = { ...draftEntries.value }
  const outfitDraft = { ...(nextDraft[outfit.id] ?? {}) }
  outfitDraft.itemIds = getUniqueItemIds([...(outfitDraft.itemIds ?? []), itemId])
  nextDraft[outfit.id] = normalizeDraftEntry(outfitDraft)
  draftEntries.value = nextDraft
  itemDraftInputs.value = {
    ...itemDraftInputs.value,
    [outfit.id]: ''
  }
  statusMessageKey.value = textKeys.nsarmoireStoreReviewItemAdded
  saveDraftEntries()
}

function removeDraftItem(outfit: ArmoireStoreOutfit, itemId: number): void {
  const nextDraft = { ...draftEntries.value }
  const outfitDraft = { ...(nextDraft[outfit.id] ?? {}) }
  outfitDraft.itemIds = getUniqueItemIds((outfitDraft.itemIds ?? []).filter((id) => id !== itemId))

  if (hasStoredDraftEntry(outfitDraft)) {
    nextDraft[outfit.id] = normalizeDraftEntry(outfitDraft)
  } else {
    delete nextDraft[outfit.id]
  }

  draftEntries.value = nextDraft
  statusMessageKey.value = null
  saveDraftEntries()
}

function buildPatch(): StoreReviewPatch {
  const outfitIndex = new Map(storeCatalog.value.outfits.map((outfit) => [outfit.id, outfit]))
  const outfits = Object.entries(draftEntries.value)
    .filter(([, draft]) => hasStoredDraftEntry(draft))
    .map(([id, draft]) => {
      const outfit = outfitIndex.get(id)

      if (!outfit) {
        return null
      }

      const mergedItemIds = getMergedItemIds(outfit)
      const itemIdsChanged = (draft.itemIds ?? []).length > 0
      const itemNames = mergedItemIds.map((itemId) => getArmoireItemName(catalog.value, itemId, t))
      const needsMapping =
        itemIdsChanged &&
        mergedItemIds.length >= Math.max(outfit.itemNames.length, mergedItemIds.length)
          ? false
          : outfit.needsMapping

      return {
        id,
        name: outfit.name,
        productId: outfit.productId,
        skuId: outfit.skuId,
        ...(draft.regionalStoreUrls ? { regionalStoreUrls: draft.regionalStoreUrls } : {}),
        ...(draft.corrected ? { corrected: true } : {}),
        ...(itemIdsChanged
          ? {
              itemIds: mergedItemIds,
              itemNames,
              needsMapping
            }
          : {})
      }
    })
    .filter((outfit): outfit is NonNullable<typeof outfit> => Boolean(outfit))

  return {
    schemaVersion: 'nsarmoire.storeCatalogCorrections.v1',
    generatedAt: new Date().toISOString(),
    outfits
  }
}

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

  const blob = new Blob([`${JSON.stringify(buildPatch(), null, 2)}\n`], {
    type: 'application/json'
  })
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

function getLinkInputId(outfitId: string, region: ArmoireStoreLinkRegion): string {
  return `nsarmoire-store-review-${outfitId}-${region}`
}

function getItemInputId(outfitId: string): string {
  return `nsarmoire-store-review-${outfitId}-item`
}

function hideBrokenImage(event: Event): void {
  const image = event.currentTarget

  if (image instanceof HTMLImageElement) {
    image.style.visibility = 'hidden'
  }
}
</script>

<style scoped>
.nsarmoire-store-review {
  display: grid;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  background: #ffffff;
  font-family: var(--ns-font-sans);
}

.nsarmoire-store-review__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
  padding: 14px;
  border: 2px solid var(--ns-pixel-border);
  background: #ffffff;
}

.nsarmoire-store-review__header h1,
.nsarmoire-store-review__outfit h2 {
  margin: 0;
  font-family: var(--ns-font-sans);
  letter-spacing: 0;
}

.nsarmoire-store-review__header h1 {
  font-size: 18px;
  font-weight: 850;
}

.nsarmoire-store-review__header p {
  margin: 6px 0 0;
  color: var(--ns-color-text-muted);
  line-height: 1.7;
}

.nsarmoire-store-review__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.nsarmoire-store-review__edited-count {
  padding: 6px 8px;
  border: 1px solid var(--ns-pixel-border-soft);
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.nsarmoire-store-review__controls {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(160px, 240px);
  gap: 10px;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border);
  background: #ffffff;
}

.nsarmoire-store-review__list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-store-review__row {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(300px, 1.2fr) minmax(360px, 1.4fr) minmax(
      120px,
      0.45fr
    );
  gap: 12px;
  align-items: start;
  min-width: 0;
  padding: 10px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: #ffffff;
}

.nsarmoire-store-review__row--edited {
  border-color: var(--ns-status-warning-border);
}

.nsarmoire-store-review__row--corrected {
  border-color: var(--ns-status-success-border);
}

.nsarmoire-store-review__row--needs-mapping {
  box-shadow: inset 4px 0 0 var(--ns-status-danger-border);
}

.nsarmoire-store-review__outfit {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
}

.nsarmoire-store-review__cover {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
}

.nsarmoire-store-review__cover img,
.nsarmoire-store-review__cover span {
  display: block;
  width: 44px;
  height: 44px;
  object-fit: cover;
}

.nsarmoire-store-review__cover span,
.nsarmoire-store-review__item-fallback {
  border: 1px solid var(--ns-pixel-border-soft);
  background: #ffffff;
}

.nsarmoire-store-review__outfit-main,
.nsarmoire-store-review__items,
.nsarmoire-store-review__links,
.nsarmoire-store-review__state {
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
}

.nsarmoire-store-review__outfit h2 {
  overflow: hidden;
  font-size: 15px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-store-review__column-label {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}

.nsarmoire-store-review__tags {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-store-review__tags li {
  padding: 2px 5px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__items ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 5px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-store-review__items li {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto auto auto;
  align-items: center;
  max-width: none;
  min-width: 0;
  gap: 5px;
  padding: 3px 6px 3px 3px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: #ffffff;
  color: var(--ns-color-text);
  font-size: 12px;
}

.nsarmoire-store-review__item--draft {
  border-color: var(--ns-status-warning-border);
}

.nsarmoire-store-review__items img,
.nsarmoire-store-review__item-fallback {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  object-fit: cover;
}

.nsarmoire-store-review__item-name {
  min-width: 0;
  line-height: 1.35;
}

.nsarmoire-store-review__item-id,
.nsarmoire-store-review__empty,
.nsarmoire-store-review__item-draft {
  flex: 0 0 auto;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.nsarmoire-store-review__item-draft {
  color: var(--ns-color-text);
  font-weight: 850;
}

.nsarmoire-store-review__item-remove,
.nsarmoire-store-review__add-item-control button,
.nsarmoire-store-review__state-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 6px;
  border: 1px solid var(--ns-pixel-border);
  background: #ffffff;
  color: var(--ns-color-text);
  font: inherit;
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__add-item {
  display: grid;
  gap: 4px;
  margin-top: 2px;
}

.nsarmoire-store-review__add-item label {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__add-item-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 5px;
}

.nsarmoire-store-review__add-item-control input {
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: #ffffff;
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
}

.nsarmoire-store-review__link-field {
  display: grid;
  gap: 3px;
}

.nsarmoire-store-review__link-field label {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-store-review__link-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 5px;
}

.nsarmoire-store-review__link-control input {
  min-width: 0;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: #ffffff;
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
}

.nsarmoire-store-review__link-control a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 8px;
  border: 1px solid var(--ns-pixel-border);
  background: #ffffff;
  color: var(--ns-color-text);
  font-size: 12px;
  font-weight: 850;
  text-decoration: none;
}

.nsarmoire-store-review__badge {
  display: inline-flex;
  justify-self: start;
  padding: 3px 6px;
  border: 1px solid var(--ns-pixel-border);
  background: var(--ns-color-surface);
  font-size: 12px;
  font-weight: 850;
}

.nsarmoire-store-review__badge--pending {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
}

.nsarmoire-store-review__badge--corrected {
  border-color: var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
}

.nsarmoire-store-review__state-action {
  justify-self: start;
  min-height: 26px;
  margin-top: 2px;
  background: #ffffff;
}

@media (max-width: 1180px) {
  .nsarmoire-store-review__row {
    grid-template-columns: minmax(220px, 0.9fr) minmax(280px, 1fr);
  }
}

@media (max-width: 760px) {
  .nsarmoire-store-review {
    padding: 8px;
  }

  .nsarmoire-store-review__header,
  .nsarmoire-store-review__controls,
  .nsarmoire-store-review__row {
    grid-template-columns: 1fr;
  }

  .nsarmoire-store-review__actions {
    justify-content: flex-start;
  }
}
</style>
