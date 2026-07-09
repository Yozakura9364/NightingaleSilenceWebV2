<template>
  <section class="nsarmoire-store-panel">
    <div class="nsarmoire-store-panel__header">
      <h2 class="ns-heading-bloom">{{ t(textKeys.nsarmoireStoreOutfits) }}</h2>
    </div>

    <AppStatus
      v-if="status === 'loading'"
      compact
      tone="loading"
      :message="t(textKeys.nsarmoireStoreCatalogLoading)"
    />

    <AppStatus
      v-else-if="status === 'error'"
      compact
      tone="danger"
      :title="t(textKeys.nsarmoireStoreCatalogError)"
      :message="error ?? undefined"
    >
      <template #actions>
        <AppButton @click="$emit('reload')">
          {{ t(textKeys.nsarmoireStoreCatalogRetry) }}
        </AppButton>
      </template>
    </AppStatus>

    <template v-else>
      <div class="nsarmoire-store-panel__controls">
        <div class="nsarmoire-store-panel__search">
          <input
            id="nsarmoire-store-search"
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            :aria-label="t(textKeys.nsarmoireStoreSearchLabel)"
            :placeholder="t(textKeys.nsarmoireStoreSearchPlaceholder)"
          />
        </div>

        <AppField
          :label="t(textKeys.nsarmoireStoreFilterLabel)"
          for-id="nsarmoire-store-filter"
          density="compact"
        >
          <select id="nsarmoire-store-filter" v-model="selectedStatus">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </AppField>
      </div>

      <AppStatus
        v-if="visibleOutfits.length === 0"
        compact
        tone="info"
        :message="t(textKeys.nsarmoireStoreEmpty)"
      />

      <template v-else>
        <div class="nsarmoire-store-overview">
          <section v-for="group in groupedOutfits" :key="group.id" class="nsarmoire-store-group">
            <div class="nsarmoire-store-group__header">
              <h3>{{ group.label }}</h3>
              <span>{{ group.ownedCount }}/{{ group.totalCount }}</span>
            </div>

            <div class="nsarmoire-store-group__icons">
              <button
                v-for="state in group.outfits"
                :key="state.outfit.id"
                type="button"
                class="nsarmoire-store-icon"
                :class="[
                  `nsarmoire-store-icon--${state.status}`,
                  {
                    'nsarmoire-store-icon--selected':
                      selectedStoreState?.outfit.id === state.outfit.id
                  }
                ]"
                :title="getOutfitTooltip(state)"
                :aria-label="getOutfitTooltip(state)"
                @click="selectStoreOutfit(state)"
              >
                <img
                  v-if="getCoverIconUrl(state)"
                  :src="getCoverIconUrl(state)"
                  :alt="getStoreOutfitName(state.outfit)"
                  loading="lazy"
                  @error="hideBrokenImage"
                />
                <span v-else aria-hidden="true"></span>
              </button>
            </div>
          </section>
        </div>

        <article
          v-if="selectedStoreState"
          ref="detailPanel"
          class="nsarmoire-store-card"
          :class="`nsarmoire-store-card--${selectedStoreState.status}`"
        >
          <div class="nsarmoire-store-card__cover">
            <img
              v-if="getCoverIconUrl(selectedStoreState)"
              :src="getCoverIconUrl(selectedStoreState)"
              :alt="getStoreOutfitName(selectedStoreState.outfit)"
              loading="lazy"
              @error="hideBrokenImage"
            />
            <span v-else aria-hidden="true"></span>
          </div>

          <div class="nsarmoire-store-card__main">
            <div class="nsarmoire-store-card__title-row">
              <h3>{{ getStoreOutfitName(selectedStoreState.outfit) }}</h3>
              <span class="nsarmoire-store-card__status">
                <span>{{ getStatusLabel(selectedStoreState.status) }}</span>
                <span class="nsarmoire-store-card__progress">
                  {{ getOwnedProgressLabel(selectedStoreState) }}
                </span>
              </span>
            </div>

            <div class="nsarmoire-store-card__prices">
              <span
                v-for="price in selectedPriceViews"
                :key="price.region"
                class="nsarmoire-store-card__price"
              >
                <span class="nsarmoire-store-card__price-region">{{ price.regionLabel }}</span>
                <span class="nsarmoire-store-card__price-value">{{ price.priceLabel }}</span>
              </span>
              <span
                v-if="selectedPriceViews.length === 0"
                class="nsarmoire-store-card__price nsarmoire-store-card__price--empty"
              >
                {{ t(textKeys.nsarmoireStoreNoPrice) }}
              </span>
            </div>

            <ul v-if="selectedTagViews.length > 0" class="nsarmoire-store-card__tags">
              <li
                v-for="tag in selectedTagViews"
                :key="tag.key"
                :class="tag.className"
              >
                {{ tag.label }}
              </li>
            </ul>
          </div>

          <div class="nsarmoire-store-card__links" :aria-label="t(textKeys.nsarmoireStoreOpenLink)">
            <span
              v-if="selectedLinkViews.length === 0"
              class="nsarmoire-store-card__link nsarmoire-store-card__link--empty"
            >
              {{ t(textKeys.nsarmoireStoreNoLink) }}
            </span>
            <a
              v-for="link in selectedLinkViews"
              :key="link.region"
              class="nsarmoire-store-card__link"
              :href="link.url"
              :title="`${t(textKeys.nsarmoireStoreOpenLink)}: ${link.label}`"
              target="_blank"
              rel="noreferrer"
            >
              {{ link.label }}
            </a>
          </div>

          <div class="nsarmoire-store-card__items">
            <span class="nsarmoire-store-card__items-label">
              {{ t(textKeys.nsarmoireStoreItemsLabel) }}
            </span>

            <ul v-if="selectedPieceViews.length > 0">
              <li
                v-for="piece in selectedPieceViews"
                :key="piece.key"
                class="nsarmoire-store-card__piece"
                :class="{ 'nsarmoire-store-card__piece--owned': piece.owned }"
                @contextmenu="openItemActionMenu(piece, $event)"
                @pointerdown="startItemActionLongPress(piece, $event)"
                @pointermove="moveItemActionLongPress"
                @pointerup="cancelItemActionLongPress"
                @pointercancel="cancelItemActionLongPress"
                @pointerleave="cancelItemActionLongPress"
              >
                <div class="nsarmoire-store-card__piece-summary">
                  <img v-if="piece.iconUrl" :src="piece.iconUrl" :alt="piece.name" loading="lazy" />
                  <span
                    v-else
                    class="nsarmoire-store-card__piece-fallback"
                    aria-hidden="true"
                  ></span>
                  <span class="nsarmoire-store-card__piece-name">{{ piece.name }}</span>
                  <span class="nsarmoire-store-card__piece-status">
                    {{ piece.statusLabel }}
                  </span>
                </div>

                <ul v-if="piece.entries.length > 0" class="nsarmoire-store-card__piece-details">
                  <li v-for="entry in piece.entries" :key="entry.key">
                    <span>{{ entry.locationText }}</span>
                    <span>{{ entry.dyeText }}</span>
                    <span v-if="entry.bindText">{{ entry.bindText }}</span>
                  </li>
                  <li v-if="piece.hiddenEntryCount > 0">
                    <span>{{ getHiddenEntryCountLabel(piece.hiddenEntryCount) }}</span>
                  </li>
                </ul>
              </li>
            </ul>

            <span v-else class="nsarmoire-store-card__empty">
              {{ t(textKeys.nsarmoireStoreNoItems) }}
            </span>
          </div>
        </article>
      </template>
    </template>

    <NSArmoireItemActionMenu
      :menu="itemActionMenu"
      @close="closeItemActionMenu"
      @ignore-item="$emit('ignore-item', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import { analyzeArmoireStoreOutfits } from '@/lib/armoire/analyzeStoreOutfits'
import {
  getArmoireStoreItemDisplay,
  getArmoireStoreItemIconUrl
} from '@/lib/armoire/storeItemDisplayIndex'
import type {
  ArmoireCatalog,
  ArmoireOwnedItem,
  ArmoireSnapshot,
  ArmoireStoreCatalog,
  ArmoireStoreDetailTag,
  ArmoireStoreItemDisplayIndex,
  ArmoireStoreLinkRegion,
  ArmoireStoreOutfit,
  ArmoireStoreOutfitState,
  ArmoireStoreOutfitStatus,
  ArmoireStoreTag
} from '@/lib/armoire/types'
import type { ArmoireStoreCatalogStatus } from '@/pages/armoire/composables/useArmoireStoreCatalog'
import NSArmoireItemActionMenu from '@/pages/armoire/components/NSArmoireItemActionMenu.vue'
import {
  canShowArmoireBindState,
  formatArmoireDyeNames,
  formatArmoireText,
  getArmoireContainerLabel,
  getArmoireItemIconUrl,
  getArmoireItemName,
  getLocalizedArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'
import { useArmoireItemActionMenu } from '@/pages/armoire/composables/useArmoireItemActionMenu'
import { useLocale } from '@/stores/locale'

type StoreStatusFilter = ArmoireStoreOutfitStatus | 'all'
type StoreGroupId =
  | 'bonusCostume'
  | 'npcCostume'
  | 'seasonal'
  | 'collectorEditionBonus'
  | 'crossoverCostume'
  | 'fanFestivalCostume'
  | 'replicaCostume'
  | 'other'

interface StorePieceEntryView {
  key: string
  locationText: string
  dyeText: string
  bindText?: string
}

interface StorePieceView {
  key: string
  itemId?: number
  name: string
  iconUrl: string
  owned: boolean
  statusLabel: string
  entries: StorePieceEntryView[]
  hiddenEntryCount: number
}

interface StoreLinkView {
  region: ArmoireStoreLinkRegion
  url: string
  label: string
}

interface StorePriceView {
  region: ArmoireStoreLinkRegion
  regionLabel: string
  priceLabel: string
}

interface StoreTagView {
  key: string
  label: string
  className: string
}

interface StoreGroupDefinition {
  id: StoreGroupId
  labelKey: string
  tags?: ArmoireStoreTag[]
}

interface StoreGroupView {
  id: StoreGroupId
  label: string
  outfits: ArmoireStoreOutfitState[]
  ownedCount: number
  totalCount: number
}

const props = defineProps<{
  armoireCatalog: ArmoireCatalog
  error: string | null
  snapshot: ArmoireSnapshot
  status: ArmoireStoreCatalogStatus
  storeCatalog: ArmoireStoreCatalog
  storeItemDisplayIndex: ArmoireStoreItemDisplayIndex
}>()

defineEmits<{
  reload: []
  'ignore-item': [itemId: number]
}>()

const { current, t } = useLocale()
const {
  itemActionMenu,
  closeItemActionMenu,
  openItemActionMenu,
  startItemActionLongPress,
  moveItemActionLongPress,
  cancelItemActionLongPress
} = useArmoireItemActionMenu()
const STORE_PIECE_ENTRY_LIMIT = 3
const STORE_LINK_REGION_ORDER: ArmoireStoreLinkRegion[] = ['cn', 'tw', 'global', 'kr']
const STORE_PRICE_REGION_LABELS: Record<ArmoireStoreLinkRegion, string> = {
  cn: '简中服',
  tw: '繁中服',
  global: 'Global Server',
  kr: '한국 서버'
}
const SEASONAL_STORE_TAGS: ArmoireStoreTag[] = [
  'moonfireFaire',
  'huntingMoon',
  'hatchingTide',
  'theRising',
  'starlightCelebration',
  'valentioneDay',
  'littleLadiesDay',
  'allSaintsWake',
  'heavensturn',
  'goldSaucerFestival'
]
const STORE_TAG_DISPLAY_ORDER: ArmoireStoreTag[] = [
  'bonusCostume',
  'fanFestivalCostume',
  'collectorEditionBonus',
  'npcCostume',
  'replicaCostume',
  ...SEASONAL_STORE_TAGS,
  'crossoverCostume'
]
const STORE_TAG_ORDER_INDEX = new Map<ArmoireStoreTag, number>(
  STORE_TAG_DISPLAY_ORDER.map((tag, index) => [tag, index])
)
const STORE_GROUPS: StoreGroupDefinition[] = [
  {
    id: 'bonusCostume',
    labelKey: textKeys.nsarmoireStoreTagBonusCostume,
    tags: ['bonusCostume']
  },
  {
    id: 'fanFestivalCostume',
    labelKey: textKeys.nsarmoireStoreTagFanFestivalCostume,
    tags: ['fanFestivalCostume']
  },
  {
    id: 'npcCostume',
    labelKey: textKeys.nsarmoireStoreTagNpcCostume,
    tags: ['npcCostume']
  },
  {
    id: 'seasonal',
    labelKey: textKeys.nsarmoireStoreGroupSeasonal,
    tags: SEASONAL_STORE_TAGS
  },
  {
    id: 'collectorEditionBonus',
    labelKey: textKeys.nsarmoireStoreTagCollectorEditionBonus,
    tags: ['collectorEditionBonus']
  },
  {
    id: 'crossoverCostume',
    labelKey: textKeys.nsarmoireStoreTagCrossoverCostume,
    tags: ['crossoverCostume']
  },
  {
    id: 'replicaCostume',
    labelKey: textKeys.nsarmoireStoreTagReplicaCostume,
    tags: ['replicaCostume']
  },
  {
    id: 'other',
    labelKey: textKeys.nsarmoireStoreGroupOther
  }
]
const STORE_STATUS_ORDER: Record<ArmoireStoreOutfitStatus, number> = {
  complete: 0,
  partial: 1,
  needsMapping: 2,
  missing: 3
}
const searchQuery = ref('')
const selectedStatus = ref<StoreStatusFilter>('all')
const selectedOutfitId = ref<string | null>(null)
const detailPanel = ref<HTMLElement | null>(null)
const pendingDetailScrollFrames: number[] = []
let detailScrollToken = 0

const analysis = computed(() => analyzeArmoireStoreOutfits(props.snapshot, props.storeCatalog))

const statusOptions = computed<Array<{ value: StoreStatusFilter; label: string }>>(() => [
  { value: 'all', label: t(textKeys.nsarmoireStoreFilterAll) },
  { value: 'complete', label: t(textKeys.nsarmoireStoreStatusComplete) },
  { value: 'partial', label: t(textKeys.nsarmoireStoreStatusPartial) },
  { value: 'missing', label: t(textKeys.nsarmoireStoreStatusMissing) }
])

const filteredOutfits = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()

  return analysis.value.outfits.filter((state) => {
    if (selectedStatus.value !== 'all' && state.status !== selectedStatus.value) {
      return false
    }

    if (!query) {
      return true
    }

    return [
      getStoreOutfitName(state.outfit),
      ...Object.values(state.outfit.localizedNames ?? {}),
      ...getPriceViews(state.outfit).flatMap((price) => [price.regionLabel, price.priceLabel]),
      ...getTagViews(state.outfit).map((tag) => tag.label),
      ...state.outfit.itemNames
    ]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  })
})
const visibleOutfits = computed(() => sortStoreStates(filteredOutfits.value))
const selectedStoreState = computed(
  () =>
    visibleOutfits.value.find((state) => state.outfit.id === selectedOutfitId.value) ??
    visibleOutfits.value[0] ??
    null
)
const selectedPriceViews = computed(() =>
  selectedStoreState.value ? getPriceViews(selectedStoreState.value.outfit) : []
)
const selectedTagViews = computed(() =>
  selectedStoreState.value ? getTagViews(selectedStoreState.value.outfit) : []
)
const selectedLinkViews = computed(() =>
  selectedStoreState.value ? getStoreLinkViews(selectedStoreState.value.outfit) : []
)
const selectedPieceViews = computed(() =>
  selectedStoreState.value ? getPieceViews(selectedStoreState.value) : []
)
const groupedOutfits = computed<StoreGroupView[]>(() => {
  const groups = new Map<StoreGroupId, StoreGroupView>()

  for (const definition of STORE_GROUPS) {
    groups.set(definition.id, {
      id: definition.id,
      label: t(definition.labelKey),
      outfits: [],
      ownedCount: 0,
      totalCount: 0
    })
  }

  for (const state of visibleOutfits.value) {
    const group = groups.get(getStoreGroupDefinition(state.outfit).id)

    if (!group) {
      continue
    }

    group.outfits.push(state)
    group.totalCount += 1

    if (state.status === 'complete') {
      group.ownedCount += 1
    }
  }

  return Array.from(groups.values()).filter((group) => group.outfits.length > 0)
})

watch(
  () => [selectedStatus.value, searchQuery.value, props.storeCatalog.generatedAt] as const,
  () => {
    selectedOutfitId.value = visibleOutfits.value[0]?.outfit.id ?? null
  },
  { flush: 'post' }
)

watch(
  visibleOutfits,
  (outfits) => {
    if (!outfits.some((state) => state.outfit.id === selectedOutfitId.value)) {
      selectedOutfitId.value = outfits[0]?.outfit.id ?? null
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  cancelPendingDetailScroll()
})

function sortStoreStates(states: ArmoireStoreOutfitState[]): ArmoireStoreOutfitState[] {
  return [...states].sort((left, right) => {
    const groupDiff =
      STORE_GROUPS.findIndex((group) => group.id === getStoreGroupDefinition(left.outfit).id) -
      STORE_GROUPS.findIndex((group) => group.id === getStoreGroupDefinition(right.outfit).id)

    if (groupDiff !== 0) {
      return groupDiff
    }

    const globalProductDiff =
      getStoreGlobalProductSortValue(right.outfit) - getStoreGlobalProductSortValue(left.outfit)

    if (globalProductDiff !== 0) {
      return globalProductDiff
    }

    const statusDiff = STORE_STATUS_ORDER[left.status] - STORE_STATUS_ORDER[right.status]

    if (statusDiff !== 0) {
      return statusDiff
    }

    const completionDiff = right.ownedItemIds.length - left.ownedItemIds.length

    if (completionDiff !== 0) {
      return completionDiff
    }

    return getStoreOutfitName(left.outfit).localeCompare(
      getStoreOutfitName(right.outfit),
      undefined,
      {
        numeric: true,
        sensitivity: 'base'
      }
    )
  })
}

function getStoreGlobalProductSortValue(outfit: ArmoireStoreOutfit): number {
  const productId = Number(outfit.globalProductId)

  return Number.isFinite(productId) && productId > 0 ? productId : -1
}

function getStoreGroupDefinition(outfit: ArmoireStoreOutfit): StoreGroupDefinition {
  const outfitTags = new Set(outfit.tags ?? [])

  return (
    STORE_GROUPS.find((definition) => definition.tags?.some((tag) => outfitTags.has(tag))) ??
    STORE_GROUPS[STORE_GROUPS.length - 1]
  )
}

function getStatusLabel(status: ArmoireStoreOutfitStatus): string {
  const labelKeys: Record<ArmoireStoreOutfitStatus, string> = {
    complete: textKeys.nsarmoireStoreStatusComplete,
    partial: textKeys.nsarmoireStoreStatusPartial,
    missing: textKeys.nsarmoireStoreStatusMissing,
    needsMapping: textKeys.nsarmoireStoreStatusNeedsMapping
  }

  return t(labelKeys[status])
}

function getPriceRegionLabel(region: ArmoireStoreLinkRegion): string {
  return STORE_PRICE_REGION_LABELS[region]
}

function getOwnedProgressLabel(state: ArmoireStoreOutfitState): string {
  return `${state.ownedItemIds.length}/${state.mappedItemCount}`
}

function getPriceViews(outfit: ArmoireStoreOutfit): StorePriceView[] {
  const priceLabels: Partial<Record<ArmoireStoreLinkRegion, string>> = {
    ...outfit.regionalPriceLabels
  }

  if (outfit.priceLabel) {
    const fallbackRegion = getPriceFallbackRegion(outfit)

    if (!priceLabels[fallbackRegion]) {
      priceLabels[fallbackRegion] = outfit.priceLabel
    }
  }

  return STORE_LINK_REGION_ORDER.flatMap((region) => {
    const priceLabel = formatPriceLabel(region, priceLabels[region])

    return priceLabel
      ? [
          {
            region,
            regionLabel: getPriceRegionLabel(region),
            priceLabel
          }
        ]
      : []
  })
}

function getPriceFallbackRegion(outfit: ArmoireStoreOutfit): ArmoireStoreLinkRegion {
  return outfit.region
}

function formatPriceLabel(region: ArmoireStoreLinkRegion, label: string | undefined): string {
  const trimmedLabel = label?.trim() ?? ''

  if (!trimmedLabel) {
    return ''
  }

  if (region === 'cn') {
    return trimmedLabel.replace(/(\d)\s+(点券|点)$/gu, '$1$2')
  }

  if (region === 'tw') {
    return trimmedLabel.replace(/(\d)\s+(水晶)$/gu, '$1$2')
  }

  return trimmedLabel
}

function getTagLabelKey(tag: ArmoireStoreTag): string {
  const labelKeys: Record<ArmoireStoreTag, string> = {
    npcCostume: textKeys.nsarmoireStoreTagNpcCostume,
    bonusCostume: textKeys.nsarmoireStoreTagBonusCostume,
    collectorEditionBonus: textKeys.nsarmoireStoreTagCollectorEditionBonus,
    replicaCostume: textKeys.nsarmoireStoreTagReplicaCostume,
    fanFestivalCostume: textKeys.nsarmoireStoreTagFanFestivalCostume,
    crossoverCostume: textKeys.nsarmoireStoreTagCrossoverCostume,
    moonfireFaire: textKeys.nsarmoireStoreTagMoonfireFaire,
    huntingMoon: textKeys.nsarmoireStoreTagHuntingMoon,
    hatchingTide: textKeys.nsarmoireStoreTagHatchingTide,
    theRising: textKeys.nsarmoireStoreTagTheRising,
    starlightCelebration: textKeys.nsarmoireStoreTagStarlightCelebration,
    valentioneDay: textKeys.nsarmoireStoreTagValentioneDay,
    littleLadiesDay: textKeys.nsarmoireStoreTagLittleLadiesDay,
    allSaintsWake: textKeys.nsarmoireStoreTagAllSaintsWake,
    heavensturn: textKeys.nsarmoireStoreTagHeavensturn,
    goldSaucerFestival: textKeys.nsarmoireStoreTagGoldSaucerFestival
  }

  return labelKeys[tag]
}

function getDetailTagLabelKey(tag: ArmoireStoreDetailTag): string {
  const labelKeys: Record<ArmoireStoreDetailTag, string> = {
    maleOnly: textKeys.nsarmoireStoreDetailTagMaleOnly,
    femaleOnly: textKeys.nsarmoireStoreDetailTagFemaleOnly
  }

  return labelKeys[tag]
}

function getTagViews(outfit: ArmoireStoreOutfit): StoreTagView[] {
  const tags = getOrderedStoreTags(outfit.tags).map((tag) => ({
    key: `tag-${tag}`,
    label: t(getTagLabelKey(tag)),
    className: `nsarmoire-store-card__tag nsarmoire-store-card__tag--source nsarmoire-store-card__tag--${tag}`
  }))
  const detailTags = (outfit.detailTags ?? []).map((tag) => ({
    key: `detail-${tag}`,
    label: t(getDetailTagLabelKey(tag)),
    className: `nsarmoire-store-card__tag nsarmoire-store-card__tag--detail nsarmoire-store-card__tag--${tag}`
  }))

  return [...tags, ...detailTags]
}

function getOrderedStoreTags(tags: ArmoireStoreTag[] | undefined): ArmoireStoreTag[] {
  return [...(tags ?? [])].sort((left, right) => {
    const orderDiff =
      (STORE_TAG_ORDER_INDEX.get(left) ?? Number.MAX_SAFE_INTEGER) -
      (STORE_TAG_ORDER_INDEX.get(right) ?? Number.MAX_SAFE_INTEGER)

    if (orderDiff !== 0) {
      return orderDiff
    }

    return left.localeCompare(right)
  })
}

function getCoverIconUrl(state: ArmoireStoreOutfitState): string {
  const coverItemId = state.outfit.coverItemId ?? state.outfit.itemIds[0]

  return coverItemId ? getStoreItemIconUrl(coverItemId) : ''
}

function getStoreOutfitName(outfit: ArmoireStoreOutfit): string {
  return (
    outfit.localizedNames?.[current.value] ??
    outfit.localizedNames?.['zh-CN'] ??
    outfit.localizedNames?.en ??
    outfit.name
  )
}

function getOutfitTooltip(state: ArmoireStoreOutfitState): string {
  return `${getStoreOutfitName(state.outfit)}\n${getStatusLabel(state.status)}`
}

function selectStoreOutfit(state: ArmoireStoreOutfitState): void {
  selectedOutfitId.value = state.outfit.id
  queueDetailPanelScroll()
}

function queueDetailPanelScroll(): void {
  const scrollToken = detailScrollToken + 1

  detailScrollToken = scrollToken
  clearPendingDetailScrollFrames()

  void nextTick(() => {
    if (scrollToken !== detailScrollToken) {
      return
    }

    if (typeof window === 'undefined') {
      detailPanel.value?.scrollIntoView({ block: 'start' })
      return
    }

    const firstFrame = window.requestAnimationFrame(() => {
      if (scrollToken !== detailScrollToken) {
        return
      }

      const secondFrame = window.requestAnimationFrame(() => {
        clearPendingDetailScrollFrames()

        if (scrollToken === detailScrollToken) {
          scrollDetailPanelIntoView()
        }
      })

      pendingDetailScrollFrames.splice(0, pendingDetailScrollFrames.length, secondFrame)
    })

    pendingDetailScrollFrames.push(firstFrame)
  })
}

function scrollDetailPanelIntoView(): void {
  const target = detailPanel.value

  if (!target) {
    return
  }

  const scrollParent = getScrollableAncestor(target)

  if (!scrollParent) {
    target.scrollIntoView({ block: 'start', behavior: 'smooth' })
    return
  }

  const targetRect = target.getBoundingClientRect()
  const parentRect = scrollParent.getBoundingClientRect()
  const scrollMargin = 12

  scrollParent.scrollTo({
    top: scrollParent.scrollTop + targetRect.top - parentRect.top - scrollMargin,
    behavior: 'smooth'
  })
}

function getScrollableAncestor(element: HTMLElement): HTMLElement | null {
  if (typeof window === 'undefined') {
    return null
  }

  let parent = element.parentElement

  while (parent) {
    const style = window.getComputedStyle(parent)
    const canScrollY =
      /auto|scroll|overlay/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight

    if (canScrollY) {
      return parent
    }

    parent = parent.parentElement
  }

  return null
}

function cancelPendingDetailScroll(): void {
  detailScrollToken += 1
  clearPendingDetailScrollFrames()
}

function clearPendingDetailScrollFrames(): void {
  if (typeof window === 'undefined') {
    pendingDetailScrollFrames.length = 0
    return
  }

  for (const frame of pendingDetailScrollFrames) {
    window.cancelAnimationFrame(frame)
  }

  pendingDetailScrollFrames.length = 0
}

function getPieceViews(state: ArmoireStoreOutfitState): StorePieceView[] {
  if (state.status === 'needsMapping' && state.outfit.itemNames.length > 0) {
    return state.outfit.itemNames.map((name, index) => {
      const matchedItemId = getMatchedItemIdByName(state, name)

      return createPieceView(state, `${state.outfit.id}-name-${index}`, name, matchedItemId)
    })
  }

  return state.outfit.itemIds.map((itemId, index) =>
    createPieceView(
      state,
      `${state.outfit.id}-${itemId}-${index}`,
      getStoreItemName(itemId, state.outfit.itemNames[index]),
      itemId
    )
  )
}

function createPieceView(
  state: ArmoireStoreOutfitState,
  key: string,
  name: string,
  itemId: number | undefined
): StorePieceView {
  const ownedItems = itemId ? getOwnedEntriesForItemId(state, itemId) : []
  const visibleEntries = ownedItems.slice(0, STORE_PIECE_ENTRY_LIMIT)
  const owned = ownedItems.length > 0

  return {
    key,
    itemId,
    name,
    iconUrl: itemId ? getStoreItemIconUrl(itemId) : '',
    owned,
    statusLabel: getPieceStatusLabel(owned),
    entries: visibleEntries.map((item, index) => getPieceEntryView(key, item, index)),
    hiddenEntryCount: Math.max(ownedItems.length - visibleEntries.length, 0)
  }
}

function getOwnedEntriesForItemId(
  state: ArmoireStoreOutfitState,
  itemId: number
): ArmoireOwnedItem[] {
  return state.ownedItemsByItemId[itemId] ?? []
}

function getPieceEntryView(
  key: string,
  item: ArmoireOwnedItem,
  index: number
): StorePieceEntryView {
  return {
    key: `${key}-entry-${index}`,
    locationText: formatArmoireText(t, textKeys.nsarmoireStorePieceLocation, {
      location: getArmoireContainerLabel(item, t)
    }),
    dyeText: formatArmoireText(t, textKeys.nsarmoireStorePieceDye, {
      dyes: formatArmoireDyeNames(props.armoireCatalog, item.dyes, t)
    }),
    bindText: getPieceBindText(item)
  }
}

function getPieceBindText(item: ArmoireOwnedItem): string | undefined {
  if (!canShowArmoireBindState(props.armoireCatalog, item)) {
    return undefined
  }

  return formatArmoireText(t, textKeys.nsarmoireStorePieceBind, {
    state:
      item.spiritbond > 0
        ? t(textKeys.nsarmoireStorePieceBound)
        : t(textKeys.nsarmoireStorePieceUnbound)
  })
}

function getPieceStatusLabel(owned: boolean): string {
  return owned ? t(textKeys.nsarmoireStoreStatusComplete) : t(textKeys.nsarmoireStoreStatusMissing)
}

function getHiddenEntryCountLabel(count: number): string {
  return formatArmoireText(t, textKeys.nsarmoireStorePieceMoreEntries, { count })
}

function getStoreLinkViews(outfit: ArmoireStoreOutfit): StoreLinkView[] {
  const urls: Partial<Record<ArmoireStoreLinkRegion, string>> = {
    ...outfit.regionalStoreUrls
  }

  if (!urls[outfit.region]) {
    urls[outfit.region] = outfit.storeUrl
  }

  return STORE_LINK_REGION_ORDER.flatMap((region) => {
    const url = urls[region]?.trim()

    return url && isStoreLinkUrl(url) ? [{ region, url, label: getStoreLinkHost(url) }] : []
  })
}

function isStoreLinkUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

function getStoreLinkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0] || url
  }
}

function getMatchedItemIdByName(state: ArmoireStoreOutfitState, name: string): number | undefined {
  return state.outfit.itemIds.find(
    (itemId) =>
      getArmoireStoreItemDisplay(props.storeItemDisplayIndex, itemId)?.name?.trim() ===
        name.trim() || props.armoireCatalog.items[itemId]?.name?.trim() === name.trim()
  )
}

function getStoreItemName(itemId: number, fallbackName: string | undefined): string {
  const storeDisplayItem = getArmoireStoreItemDisplay(props.storeItemDisplayIndex, itemId)

  return (
    getLocalizedArmoireItemName(storeDisplayItem, current.value) ??
    getLocalizedArmoireItemName(props.armoireCatalog.items[itemId], current.value) ??
    fallbackName ??
    getArmoireItemName(props.armoireCatalog, itemId, t)
  )
}

function getStoreItemIconUrl(itemId: number): string {
  return (
    getArmoireStoreItemIconUrl(props.storeItemDisplayIndex, itemId) ||
    getArmoireItemIconUrl(props.armoireCatalog, itemId)
  )
}

function hideBrokenImage(event: Event): void {
  const image = event.currentTarget

  if (image instanceof HTMLImageElement) {
    image.style.visibility = 'hidden'
  }
}
</script>

<style scoped>
.nsarmoire-store-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
}

.nsarmoire-store-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsarmoire-store-panel h2,
.nsarmoire-store-panel h3,
.nsarmoire-store-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0;
}

.nsarmoire-store-panel__controls {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(160px, 220px);
  align-items: end;
  gap: 10px;
  min-width: 0;
}

.nsarmoire-store-panel__search {
  align-self: end;
  min-width: 0;
}

.nsarmoire-store-panel__search input {
  box-sizing: border-box;
  width: 100%;
  min-height: 34px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface, var(--ns-color-surface-solid));
  color: var(--ns-pixel-ink, var(--ns-color-text));
  font: inherit;
  font-family: var(--ns-font-sans);
  font-size: 13px;
  box-shadow: var(--ns-control-inset-shadow);
}

.nsarmoire-store-panel__search input:focus {
  outline: 0;
  border-color: var(--ns-pixel-border-cyan);
  box-shadow: var(--ns-control-inset-shadow), var(--ns-focus-ring);
}

.nsarmoire-store-overview {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
}

.nsarmoire-store-group {
  display: grid;
  grid-template-columns: minmax(158px, 220px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
}

.nsarmoire-store-group__header {
  display: inline-flex;
  grid-column: 1;
  min-width: 0;
  align-items: baseline;
  gap: 8px;
}

.nsarmoire-store-group__header h3 {
  min-width: 0;
  color: var(--ns-color-text);
  overflow-wrap: anywhere;
}

.nsarmoire-store-group__header span {
  flex: 0 0 auto;
  color: var(--ns-color-text);
  font-size: 18px;
  font-weight: 900;
  white-space: nowrap;
}

.nsarmoire-store-group__icons {
  display: flex;
  grid-column: 2;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.nsarmoire-store-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  padding: 3px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  cursor: pointer;
}

.nsarmoire-store-icon:hover,
.nsarmoire-store-icon:focus-visible {
  border-color: var(--ns-color-accent);
  outline: none;
  box-shadow: 0 2px 6px rgba(42, 33, 56, 0.16);
}

.nsarmoire-store-icon--selected {
  border-color: var(--ns-color-accent);
  box-shadow: 0 1px 4px rgba(42, 33, 56, 0.12);
}

.nsarmoire-store-icon img,
.nsarmoire-store-icon span {
  display: block;
  width: 38px;
  height: 38px;
  image-rendering: auto;
  object-fit: cover;
}

.nsarmoire-store-icon span {
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
}

.nsarmoire-store-icon--missing img,
.nsarmoire-store-icon--needsMapping img {
  filter: grayscale(1);
  opacity: 0.42;
}

.nsarmoire-store-icon--partial::after,
.nsarmoire-store-icon--needsMapping::after {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 12px;
  height: 12px;
  border: 2px solid var(--ns-color-surface);
  content: '';
}

.nsarmoire-store-icon--partial::after {
  background: var(--ns-color-warning);
}

.nsarmoire-store-icon--needsMapping::after {
  background: var(--ns-color-danger);
}

.nsarmoire-store-card {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) max-content;
  align-items: start;
  gap: 10px 12px;
  min-width: 0;
  scroll-margin-top: 12px;
  padding: 10px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
}

.nsarmoire-store-card__cover {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
}

.nsarmoire-store-card__cover img,
.nsarmoire-store-card__cover span {
  display: block;
  width: 56px;
  height: 56px;
  image-rendering: auto;
  object-fit: cover;
}

.nsarmoire-store-card__cover span {
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
}

.nsarmoire-store-card--complete {
  border-color: var(--ns-status-success-border);
}

.nsarmoire-store-card--partial {
  border-color: var(--ns-status-warning-border);
}

.nsarmoire-store-card--needsMapping {
  border-color: var(--ns-status-danger-border);
}

.nsarmoire-store-card__main,
.nsarmoire-store-card__items {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.nsarmoire-store-card__title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.nsarmoire-store-card h3 {
  min-width: 0;
  overflow: hidden;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-store-card__status {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text);
  font-size: 12px;
  font-weight: 800;
}

.nsarmoire-store-card__progress {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-decorative);
  font-weight: 750;
}

.nsarmoire-store-card__prices {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 4px;
}

.nsarmoire-store-card__price {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-height: 22px;
  padding: 2px 6px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text);
  font-size: 12px;
  line-height: 1.25;
}

.nsarmoire-store-card__price-region {
  flex: 0 0 auto;
  color: var(--ns-color-text);
  font-weight: 900;
  white-space: nowrap;
}

.nsarmoire-store-card__price-value {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--ns-color-text-muted);
  font-weight: 750;
}

.nsarmoire-store-card__price--empty {
  color: var(--ns-color-text-muted);
  font-weight: 750;
}

.nsarmoire-store-card__tags {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-store-card__tag {
  padding: 2px 6px;
  border: 1px solid transparent;
  background: var(--ns-color-accent);
  color: var(--ns-color-on-accent);
  font-size: 11px;
  font-weight: 900;
  line-height: 1.2;
}

.nsarmoire-store-card__tag--detail {
  background: var(--ns-color-danger);
}

.nsarmoire-store-card__tag--maleOnly {
  background: #2f6fd6;
}

.nsarmoire-store-card__tag--femaleOnly {
  background: var(--ns-color-danger);
}

.nsarmoire-store-card__tag--npcCostume {
  background: #4d78d8;
}

.nsarmoire-store-card__tag--bonusCostume {
  background: #b14dc4;
}

.nsarmoire-store-card__tag--collectorEditionBonus {
  background: #8a6a2d;
}

.nsarmoire-store-card__tag--fanFestivalCostume {
  background: #6a55c8;
}

.nsarmoire-store-card__tag--crossoverCostume {
  background: #2b7770;
}

.nsarmoire-store-card__tag--replicaCostume {
  background: #6c6f7f;
}

.nsarmoire-store-card__items {
  grid-column: 1 / -1;
  padding-top: 8px;
  border-top: 1px solid var(--ns-pixel-border-soft);
}

.nsarmoire-store-card__items-label,
.nsarmoire-store-card__empty {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.nsarmoire-store-card__items > ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-store-card__piece {
  display: grid;
  align-content: start;
  min-width: 0;
  gap: 5px;
  padding: 5px 8px 5px 5px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text-muted);
  font-size: 12px;
  cursor: context-menu;
  -webkit-touch-callout: none;
}

.nsarmoire-store-card__piece--owned {
  border-color: var(--ns-status-success-border);
  background: color-mix(in srgb, var(--ns-status-success-bg) 42%, var(--ns-color-surface));
  color: var(--ns-color-text);
}

.nsarmoire-store-card__piece-summary {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.nsarmoire-store-card__items img,
.nsarmoire-store-card__piece-fallback {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border: 1px solid var(--ns-pixel-border-soft);
  image-rendering: auto;
  object-fit: cover;
}

.nsarmoire-store-card__piece-fallback {
  background: var(--ns-color-surface);
}

.nsarmoire-store-card__piece-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-store-card__piece-status {
  flex: 0 0 auto;
  padding: 1px 4px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font-size: 11px;
  font-weight: 800;
}

.nsarmoire-store-card__piece-details {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0 0 0 39px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  line-height: 1.45;
  list-style: none;
}

.nsarmoire-store-card__piece-details li {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 2px 8px;
  padding: 0;
  border: 0;
  background: transparent;
}

.nsarmoire-store-card__piece-details span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.nsarmoire-store-card__links {
  display: flex;
  min-width: 0;
  max-width: min(100%, 460px);
  align-items: flex-start;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 6px;
  justify-self: end;
}

.nsarmoire-store-card__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 7px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text);
  font-size: 11px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}

.nsarmoire-store-card__link:hover {
  border-color: var(--ns-color-accent);
  box-shadow: 0 2px 5px rgba(42, 33, 56, 0.14);
}

.nsarmoire-store-card__link--empty {
  border-color: color-mix(in srgb, var(--ns-pixel-border) 55%, transparent);
  background: var(--ns-color-surface-tint);
  color: var(--ns-color-text-muted);
  cursor: default;
}

.nsarmoire-store-card__link--empty:hover {
  transform: none;
  box-shadow: none;
}

@media (max-width: 920px) {
  .nsarmoire-store-panel__controls,
  .nsarmoire-store-card,
  .nsarmoire-store-group {
    grid-template-columns: 1fr;
  }

  .nsarmoire-store-group__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .nsarmoire-store-group__header span,
  .nsarmoire-store-card__links {
    grid-column: auto;
    justify-self: start;
  }

  .nsarmoire-store-card__links {
    flex-wrap: wrap;
  }

  .nsarmoire-store-group__icons {
    grid-column: auto;
  }

  .nsarmoire-store-card__cover {
    justify-self: start;
  }
}
</style>
