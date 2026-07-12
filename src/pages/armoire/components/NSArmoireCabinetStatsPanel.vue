<template>
  <section class="nsarmoire-collection-panel">
    <div class="nsarmoire-collection-panel__header">
      <h2 class="ns-heading-bloom">{{ t(textKeys.nsarmoireCollectionCabinetStats) }}</h2>
    </div>

    <AppStatus v-if="!analysis" compact tone="info" :message="t(textKeys.nsarmoireSnapshotEmpty)" />

    <AppStatus
      v-else-if="analysis.cabinetProgress.status === 'missingCatalog'"
      compact
      tone="loading"
      :message="t(textKeys.nsarmoireCollectionNeedsCatalog)"
    />

    <div v-else class="nsarmoire-collection-panel__groups">
      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireCabinetTransferableTitle)"
        :count="transferableCount"
        :toggle-label="getToggleLabel('transferable', transferableCount)"
        :sticky-header="isGroupExpanded('transferable')"
        @toggle="toggleGroup('transferable')"
      >
        <template v-if="isGroupExpanded('transferable')">
          <ul v-if="hasVisibleTransferableItems" class="nsarmoire-collection-panel__list">
            <li
              v-for="item in visibleTransferableItems"
              :key="item.key"
              :class="{ 'nsarmoire-collection-panel__item--valuable-dye': item.hasValuableDye }"
              @contextmenu="openItemActionMenu(item, $event)"
              @pointerdown="startItemActionLongPress(item, $event)"
              @pointermove="moveItemActionLongPress"
              @pointerup="cancelItemActionLongPress"
              @pointercancel="cancelItemActionLongPress"
              @pointerleave="cancelItemActionLongPress"
            >
              <img
                v-if="item.iconUrl"
                :src="item.iconUrl"
                :alt="item.name"
                loading="lazy"
                @error="hideBrokenImage"
              />
              <span
                v-else
                class="nsarmoire-collection-panel__icon-fallback"
                aria-hidden="true"
              ></span>
              <span class="nsarmoire-collection-panel__body">
                <span class="nsarmoire-collection-panel__name">{{ item.name }}</span>
                <small v-if="item.locationLabel">{{ item.locationLabel }}</small>
                <small
                  v-if="item.dyeLine"
                  class="nsarmoire-collection-panel__dyes"
                >
                  <span>{{ t(textKeys.nsarmoireHintDyed) }}</span>
                  <span class="nsarmoire-collection-panel__dye-slots">
                    <span
                      v-for="dyeSlot in item.dyeLine.slots"
                      :key="dyeSlot.key"
                      class="nsarmoire-collection-panel__dye-slot"
                    >
                      <span
                        v-if="dyeSlot.color"
                        class="nsarmoire-collection-panel__dye-swatch"
                        :style="{ backgroundColor: dyeSlot.color }"
                        aria-hidden="true"
                      />
                      <span>{{ dyeSlot.name }}</span>
                    </span>
                  </span>
                  <span v-if="item.dyeLine.suffix">{{ item.dyeLine.suffix }}</span>
                </small>
              </span>
              <span class="nsarmoire-collection-panel__badge nsarmoire-collection-panel__badge--action">
                {{ t(textKeys.nsarmoireCollectionStatusTransferable) }}
              </span>
            </li>
          </ul>

          <AppStatus v-else compact tone="info" :message="t(textKeys.nsarmoireCollectionNoItems)" />

          <AppButton v-if="hasMoreTransferableItems" @click="showMoreTransferableItems">
            {{ transferableLoadMoreLabel }}
          </AppButton>
        </template>
      </NSArmoireActionCard>

      <NSArmoireActionCard
        :title="t(textKeys.nsarmoireCabinetMissingTitle)"
        :count="missingCount"
        :toggle-label="getToggleLabel('missing', missingCount)"
        :sticky-header="isGroupExpanded('missing')"
        @toggle="toggleGroup('missing')"
      >
        <template v-if="isGroupExpanded('missing')">
          <ul v-if="hasVisibleMissingItems" class="nsarmoire-collection-panel__list">
            <li
              v-for="item in visibleMissingItems"
              :key="item.key"
              @contextmenu="openItemActionMenu(item, $event)"
              @pointerdown="startItemActionLongPress(item, $event)"
              @pointermove="moveItemActionLongPress"
              @pointerup="cancelItemActionLongPress"
              @pointercancel="cancelItemActionLongPress"
              @pointerleave="cancelItemActionLongPress"
            >
              <img
                v-if="item.iconUrl"
                :src="item.iconUrl"
                :alt="item.name"
                loading="lazy"
                @error="hideBrokenImage"
              />
              <span
                v-else
                class="nsarmoire-collection-panel__icon-fallback"
                aria-hidden="true"
              ></span>
              <span class="nsarmoire-collection-panel__name">{{ item.name }}</span>
              <span class="nsarmoire-collection-panel__badge-list">
                <span
                  v-if="item.isOwned"
                  class="nsarmoire-collection-panel__badge nsarmoire-collection-panel__badge--owned"
                >
                  {{ t(textKeys.nsarmoireCollectionStatusOwned) }}
                </span>
                <span
                  v-if="item.isDyed"
                  class="nsarmoire-collection-panel__badge nsarmoire-collection-panel__badge--warning"
                >
                  {{ t(textKeys.nsarmoireCollectionStatusDyed) }}
                </span>
                <span
                  v-if="!item.isOwned"
                  class="nsarmoire-collection-panel__badge nsarmoire-collection-panel__badge--muted"
                >
                  {{ t(textKeys.nsarmoireCollectionStatusUnowned) }}
                </span>
              </span>
            </li>
          </ul>

          <AppStatus v-else compact tone="info" :message="t(textKeys.nsarmoireCollectionNoItems)" />

          <AppButton v-if="hasMoreMissingItems" @click="showMoreMissingItems">
            {{ missingLoadMoreLabel }}
          </AppButton>
        </template>
      </NSArmoireActionCard>
    </div>

    <NSArmoireItemActionMenu
      :menu="itemActionMenu"
      @close="closeItemActionMenu"
      @ignore-item="$emit('ignore-item', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import { getEffectiveOwnedItemDyes } from '@/lib/armoire/buildOwnedIndex'
import type {
  ArmoireCatalog,
  ArmoireDyeRiskItem,
  ArmoireOwnedItem,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'
import NSArmoireActionCard from '@/pages/armoire/components/NSArmoireActionCard.vue'
import NSArmoireItemActionMenu from '@/pages/armoire/components/NSArmoireItemActionMenu.vue'
import {
  formatArmoireText,
  getArmoireContainerLabel,
  getArmoireDyeSlotViews,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'
import type { ArmoireDyeSlotView } from '@/pages/armoire/utils/itemDisplay'
import { useArmoireItemActionMenu } from '@/pages/armoire/composables/useArmoireItemActionMenu'
import { useLocale } from '@/stores/locale'

interface CabinetItemView {
  key: string
  itemId: number
  name: string
  iconUrl: string
  isOwned: boolean
  isDyed: boolean
  locationLabel: string
  dyeLine: CabinetItemDyeLine | null
  hasValuableDye: boolean
}

interface CabinetItemDyeLine {
  slots: ArmoireDyeSlotView[]
  suffix: string
}

const props = defineProps<{
  analysis: ArmoireSnapshotAnalysis | null
  catalog: ArmoireCatalog
}>()

defineEmits<{
  'ignore-item': [itemId: number]
}>()

const { t } = useLocale()
const {
  itemActionMenu,
  closeItemActionMenu,
  openItemActionMenu,
  startItemActionLongPress,
  moveItemActionLongPress,
  cancelItemActionLongPress
} = useArmoireItemActionMenu()
const CABINET_BATCH_SIZE = 24
type CabinetGroupKey = 'transferable' | 'missing'
const expandedGroups = ref<Partial<Record<CabinetGroupKey, boolean>>>({})
const visibleTransferableCount = ref(CABINET_BATCH_SIZE)
const visibleMissingCount = ref(CABINET_BATCH_SIZE)

const cabinetProgress = computed(() =>
  props.analysis?.cabinetProgress.status === 'ready' ? props.analysis.cabinetProgress : null
)

const transferableCount = computed(() => cabinetProgress.value?.transferableItemIds.length ?? 0)
const missingCount = computed(() => cabinetProgress.value?.missingCabinetItemIds.length ?? 0)

const transferableItems = computed(() =>
  isGroupExpanded('transferable')
    ? toItemViews(cabinetProgress.value?.transferableItemIds ?? [])
    : []
)
const missingItems = computed(() =>
  isGroupExpanded('missing') ? toItemViews(cabinetProgress.value?.missingCabinetItemIds ?? []) : []
)

const visibleTransferableItems = computed(() =>
  transferableItems.value.slice(0, visibleTransferableCount.value)
)

const visibleMissingItems = computed(() => missingItems.value.slice(0, visibleMissingCount.value))
const hasVisibleTransferableItems = computed(() => visibleTransferableItems.value.length !== 0)
const hasVisibleMissingItems = computed(() => visibleMissingItems.value.length !== 0)

const hasMoreTransferableItems = computed(
  () => visibleTransferableItems.value.length < transferableItems.value.length
)

const hasMoreMissingItems = computed(
  () => visibleMissingItems.value.length < missingItems.value.length
)

const nextTransferableCount = computed(() =>
  Math.min(
    CABINET_BATCH_SIZE,
    transferableItems.value.length - visibleTransferableItems.value.length
  )
)

const nextMissingCount = computed(() =>
  Math.min(CABINET_BATCH_SIZE, missingItems.value.length - visibleMissingItems.value.length)
)

const transferableLoadMoreLabel = computed(() =>
  formatArmoireText(t, textKeys.nsarmoireLoadMoreList, { count: nextTransferableCount.value })
)

const missingLoadMoreLabel = computed(() =>
  formatArmoireText(t, textKeys.nsarmoireLoadMoreList, { count: nextMissingCount.value })
)

watch(
  () => [props.analysis, props.catalog.generatedAt] as const,
  () => {
    expandedGroups.value = {}
    visibleTransferableCount.value = CABINET_BATCH_SIZE
    visibleMissingCount.value = CABINET_BATCH_SIZE
  }
)

function isGroupExpanded(key: CabinetGroupKey): boolean {
  return expandedGroups.value[key] === true
}

function toggleGroup(key: CabinetGroupKey): void {
  expandedGroups.value = {
    ...expandedGroups.value,
    [key]: !isGroupExpanded(key)
  }
}

function getToggleLabel(key: CabinetGroupKey, itemCount: number): string {
  if (itemCount <= 0) {
    return ''
  }

  return isGroupExpanded(key) ? t(textKeys.nsarmoireCollapseList) : t(textKeys.nsarmoireExpandList)
}

function toItemViews(itemIds: number[]): CabinetItemView[] {
  const progress = cabinetProgress.value
  const ownedItemIds = new Set(progress?.ownedCabinetItemIds ?? [])
  const dyedOwnedItemIds = new Set(progress?.dyedOwnedCabinetItemIds ?? [])
  const dyeRiskItemsByItemId = getDyeRiskItemsByItemId()

  return itemIds
    .map((itemId) => {
      const entries = progress?.transferableEntriesByItemId[itemId] ?? []
      const dyeRiskItems = dyeRiskItemsByItemId.get(itemId) ?? []
      const hasValuableDye = dyeRiskItems.some((item) => item.hasValuableDye)

      return {
        key: `cabinet-${itemId}`,
        itemId,
        name: getArmoireItemName(props.catalog, itemId, t),
        iconUrl: getArmoireItemIconUrl(props.catalog, itemId),
        isOwned: ownedItemIds.has(itemId),
        isDyed: dyedOwnedItemIds.has(itemId),
        locationLabel: getItemLocationLabel(entries),
        dyeLine: getItemDyeLine(itemId, entries, dyeRiskItems),
        hasValuableDye
      }
    })
    .sort(
      (left, right) =>
        Number(left.hasValuableDye) - Number(right.hasValuableDye) ||
        left.name.localeCompare(right.name)
    )
}

function getDyeRiskItemsByItemId(): Map<number, ArmoireDyeRiskItem[]> {
  const items = new Map<number, ArmoireDyeRiskItem[]>()

  for (const item of props.analysis?.dyeRisk.items ?? []) {
    const entries = items.get(item.itemId)

    if (entries) {
      entries.push(item)
    } else {
      items.set(item.itemId, [item])
    }
  }

  return items
}

function getItemLocationLabel(entries: readonly ArmoireOwnedItem[]): string {
  const locations = Array.from(new Set(entries.map((entry) => getArmoireContainerLabel(entry, t))))

  return locations.length > 0
    ? formatArmoireText(t, textKeys.nsarmoireHintCurrentLocation, {
        locations: locations.join(' / ')
      })
    : ''
}

function getItemDyeLine(
  itemId: number,
  entries: readonly ArmoireOwnedItem[],
  dyeRiskItems: readonly ArmoireDyeRiskItem[]
): CabinetItemDyeLine | null {
  if (props.catalog.items[itemId]?.dyeSlotCount === 0) {
    return null
  }

  const dyedEntry = entries.find((entry) =>
    getEffectiveOwnedItemDyes(entry).some((dyeId) => dyeId > 0)
  )

  if (!dyedEntry) {
    return null
  }

  const slots = getArmoireDyeSlotViews(
    props.catalog,
    getEffectiveOwnedItemDyes(dyedEntry),
    props.catalog.items[itemId]?.dyeSlotCount,
    t
  ).filter((slot) => {
    const keyParts = slot.key.split('-')
    return keyParts[keyParts.length - 1] !== '0'
  })

  if (slots.length === 0) {
    return null
  }

  return {
    slots,
    suffix: dyeRiskItems.some((item) => item.hasValuableDye)
      ? t(textKeys.nsarmoireHintValuableDyeDeferredSuffix)
      : ''
  }
}

function showMoreTransferableItems(): void {
  visibleTransferableCount.value = Math.min(
    transferableItems.value.length,
    visibleTransferableCount.value + CABINET_BATCH_SIZE
  )
}

function showMoreMissingItems(): void {
  visibleMissingCount.value = Math.min(
    missingItems.value.length,
    visibleMissingCount.value + CABINET_BATCH_SIZE
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
.nsarmoire-collection-panel {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
}

.nsarmoire-collection-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsarmoire-collection-panel h2 {
  margin: 0;
  font-family: var(--ns-font-sans);
  font-weight: 800;
  letter-spacing: 0;
}

.nsarmoire-collection-panel h2 {
  font-size: 16px;
}

.nsarmoire-collection-panel__groups {
  display: grid;
  gap: 10px;
}

.nsarmoire-collection-panel__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-collection-panel__list li {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) minmax(82px, auto);
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 58px;
  padding: 8px 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  cursor: context-menu;
  -webkit-touch-callout: none;
}

.nsarmoire-collection-panel__item--valuable-dye {
  color: var(--ns-color-text-muted);
  filter: grayscale(0.45);
  opacity: 0.72;
}

.nsarmoire-collection-panel__list img,
.nsarmoire-collection-panel__icon-fallback {
  width: 40px;
  height: 40px;
  border: 1px solid var(--ns-color-border);
  object-fit: contain;
}

.nsarmoire-collection-panel__icon-fallback {
  background: var(--ns-pixel-surface);
}

.nsarmoire-collection-panel__body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.nsarmoire-collection-panel__name,
.nsarmoire-collection-panel__body small {
  min-width: 0;
  overflow: hidden;
}

.nsarmoire-collection-panel__name {
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.25;
  white-space: nowrap;
}

.nsarmoire-collection-panel__body small {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-collection-panel__badge {
  justify-self: end;
  width: fit-content;
  max-width: min(36vw, 160px);
  min-width: 0;
  overflow: hidden;
  padding: 5px 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text-muted);
  font-size: 13px;
  font-weight: 850;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-collection-panel__badge--action {
  border-color: var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text);
}

.nsarmoire-collection-panel__badge-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}

.nsarmoire-collection-panel__badge--owned {
  border-color: var(--ns-status-info-border);
  background: var(--ns-status-info-bg);
  color: var(--ns-status-info-text);
}

.nsarmoire-collection-panel__badge--warning {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
  color: var(--ns-color-text);
}

.nsarmoire-collection-panel__badge--muted {
  border-color: var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text-muted);
}

.nsarmoire-collection-panel__dyes {
  display: flex;
  align-items: center;
  gap: 5px;
}

.nsarmoire-collection-panel__dye-slots,
.nsarmoire-collection-panel__dye-slot {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.nsarmoire-collection-panel__dye-slots {
  gap: 3px 5px;
}

.nsarmoire-collection-panel__dye-slot {
  gap: 3px;
}

.nsarmoire-collection-panel__dye-slot + .nsarmoire-collection-panel__dye-slot::before {
  content: '/';
  color: var(--ns-color-text-muted);
}

.nsarmoire-collection-panel__dye-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  border: 1px solid var(--ns-color-border-strong);
  box-shadow: var(--ns-control-inset-shadow);
}

@media (max-width: 640px) {
  .nsarmoire-collection-panel__list {
    grid-template-columns: 1fr;
  }
}
</style>
