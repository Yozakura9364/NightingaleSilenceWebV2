<template>
  <section class="nsarmoire-set-panel">
    <div class="nsarmoire-set-panel__header">
      <h2 class="ns-heading-bloom">{{ t(textKeys.nsarmoireCollectionGlamourSetStats) }}</h2>
    </div>

    <AppStatus v-if="!analysis" compact tone="info" :message="t(textKeys.nsarmoireSnapshotEmpty)" />

    <AppStatus
      v-else-if="analysis.glamourSetProgress.status === 'missingCatalog'"
      compact
      tone="loading"
      :message="t(textKeys.nsarmoireCollectionNeedsCatalog)"
    />

    <AppStatus
      v-else-if="setCount === 0"
      compact
      tone="info"
      :message="t(textKeys.nsarmoireGlamourSetNoSets)"
    />

    <div v-else class="nsarmoire-set-panel__groups">
      <NSArmoireActionCard
        v-for="group in statusGroups"
        :key="group.status"
        :title="group.label"
        :count="group.count"
        :toggle-label="getToggleLabel(group.status, group.count)"
        :sticky-header="isGroupExpanded(group.status)"
        @toggle="toggleGroup(group.status)"
      >
        <AppStatus
          v-if="isGroupExpanded(group.status) && group.count === 0"
          compact
          tone="info"
          :message="t(textKeys.nsarmoireCollectionNoItems)"
        />
        <ol v-if="isGroupExpanded(group.status) && group.sets.length > 0" class="nsarmoire-set-panel__list">
          <li
            v-for="set in group.sets"
            :key="set.key"
            class="nsarmoire-set-card"
            :class="`nsarmoire-set-card--${set.status}`"
          >
            <div class="nsarmoire-set-card__title-row">
              <h3>{{ set.name }}</h3>
              <span>{{ set.statusLabel }}</span>
            </div>

            <div class="nsarmoire-set-card__pieces">
              <strong>{{ t(textKeys.nsarmoireGlamourSetPieces) }}</strong>
              <ul>
                <li
                  v-for="piece in set.pieces"
                  :key="piece.key"
                  :class="[
                    `nsarmoire-set-card__piece--${piece.status}`,
                    piece.hasValuableDye ? 'nsarmoire-set-card__piece--valuable-dye' : undefined
                  ]"
                  :title="piece.tooltip"
                  @contextmenu="openItemActionMenu(piece, $event)"
                  @pointerdown="startItemActionLongPress(piece, $event)"
                  @pointermove="moveItemActionLongPress"
                  @pointerup="cancelItemActionLongPress"
                  @pointercancel="cancelItemActionLongPress"
                  @pointerleave="cancelItemActionLongPress"
                >
                  <img
                    v-if="piece.iconUrl"
                    :src="piece.iconUrl"
                    :alt="piece.name"
                    loading="lazy"
                    @error="hideBrokenImage"
                  />
                  <span v-else class="nsarmoire-set-card__piece-icon" aria-hidden="true"></span>
                  <span class="nsarmoire-set-card__piece-body">
                    <span class="nsarmoire-set-card__piece-name">{{ piece.name }}</span>
                    <small v-if="piece.locationLabel">{{ piece.locationLabel }}</small>
                    <small
                      v-if="piece.dyeLine"
                      class="nsarmoire-set-card__piece-dyes"
                    >
                      <span>{{ t(textKeys.nsarmoireHintDyed) }}</span>
                      <span class="nsarmoire-set-card__dye-slots">
                        <span
                          v-for="dyeSlot in piece.dyeLine.slots"
                          :key="dyeSlot.key"
                          class="nsarmoire-set-card__dye-slot"
                        >
                          <span
                            v-if="dyeSlot.color"
                            class="nsarmoire-set-card__dye-swatch"
                            :style="{ backgroundColor: dyeSlot.color }"
                            aria-hidden="true"
                          />
                          <span>{{ dyeSlot.name }}</span>
                        </span>
                      </span>
                      <span v-if="piece.dyeLine.suffix">{{ piece.dyeLine.suffix }}</span>
                    </small>
                  </span>
                  <span class="nsarmoire-set-card__piece-status">
                    {{ piece.statusLabel }}
                  </span>
                </li>
              </ul>
            </div>
          </li>
        </ol>
        <div v-if="isGroupExpanded(group.status) && group.hasMore" class="nsarmoire-set-panel__more">
          <AppButton @click="showMoreSets(group.status)">
            {{ getLoadMoreLabel(group) }}
          </AppButton>
        </div>
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
import type {
  ArmoireCatalog,
  ArmoireGlamourSetState,
  ArmoireGlamourSetPieceEntry,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'
import NSArmoireActionCard from '@/pages/armoire/components/NSArmoireActionCard.vue'
import NSArmoireItemActionMenu from '@/pages/armoire/components/NSArmoireItemActionMenu.vue'
import {
  formatArmoireText,
  getArmoireDyeSlotViews,
  getArmoireContainerLabel,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'
import type { ArmoireDyeSlotView } from '@/pages/armoire/utils/itemDisplay'
import { useArmoireItemActionMenu } from '@/pages/armoire/composables/useArmoireItemActionMenu'
import { useLocale } from '@/stores/locale'

type SetStatus =
  | 'loosePiecesToStore'
  | 'canCreateSet'
  | 'missingPieces'
  | 'unowned'
  | 'completeStored'
type PieceStatus = 'stored' | 'loose' | 'missing'

interface GlamourSetPieceView {
  key: string
  itemId: number
  name: string
  iconUrl: string
  status: PieceStatus
  statusLabel: string
  locationLabel: string
  dyeLine: GlamourSetPieceDyeLine | null
  tooltip: string
  hasValuableDye: boolean
  sortPriority: number
}

interface GlamourSetPieceDyeLine {
  slots: ArmoireDyeSlotView[]
  suffix: string
}

interface GlamourSetView {
  key: string
  name: string
  status: SetStatus
  statusLabel: string
  pieces: GlamourSetPieceView[]
  sortPriority: number
  hasValuableDye: boolean
}

interface GlamourSetStatusGroupView {
  status: SetStatus
  label: string
  count: number
  sets: GlamourSetView[]
  hasMore: boolean
  nextCount: number
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
const SET_BATCH_SIZE = 24
const expandedGroups = ref<Partial<Record<SetStatus, boolean>>>({})
const visibleSetCounts = ref<Partial<Record<SetStatus, number>>>({})

const setProgress = computed(() =>
  props.analysis?.glamourSetProgress.status === 'ready' ? props.analysis.glamourSetProgress : null
)
const setCount = computed(() => setProgress.value?.sets.length ?? 0)

const statusGroupOptions: SetStatus[] = [
  'loosePiecesToStore',
  'canCreateSet',
  'missingPieces',
  'unowned',
  'completeStored'
]

const statusGroups = computed<GlamourSetStatusGroupView[]>(() =>
  statusGroupOptions.map((status) => {
    const rawSets = (setProgress.value?.sets ?? []).filter((set) => getSetStatus(set) === status)

    return {
      status,
      label: getSetStatusLabel(status),
      count: rawSets.length,
      sets: isGroupExpanded(status)
        ? toSortedSetViews(rawSets.slice(0, getVisibleSetCount(status)))
        : [],
      hasMore: isGroupExpanded(status) && getVisibleSetCount(status) < rawSets.length,
      nextCount: Math.min(SET_BATCH_SIZE, rawSets.length - getVisibleSetCount(status))
    }
  })
)

watch(
  () => [props.analysis, props.catalog.generatedAt] as const,
  () => {
    expandedGroups.value = {}
    visibleSetCounts.value = {}
  }
)

function isGroupExpanded(status: SetStatus): boolean {
  return expandedGroups.value[status] === true
}

function toggleGroup(status: SetStatus): void {
  const nextExpanded = !isGroupExpanded(status)
  expandedGroups.value = {
    ...expandedGroups.value,
    [status]: nextExpanded
  }

  if (nextExpanded && !visibleSetCounts.value[status]) {
    visibleSetCounts.value = {
      ...visibleSetCounts.value,
      [status]: SET_BATCH_SIZE
    }
  }
}

function getToggleLabel(status: SetStatus, itemCount: number): string {
  if (itemCount <= 0) {
    return ''
  }

  return isGroupExpanded(status) ? t(textKeys.nsarmoireCollapseList) : t(textKeys.nsarmoireExpandList)
}

function toSortedSetViews(sets: readonly ArmoireGlamourSetState[]): GlamourSetView[] {
  return sets
    .map((set) => toSetView(set))
    .sort(
      (left, right) =>
        left.sortPriority - right.sortPriority ||
        Number(left.hasValuableDye) - Number(right.hasValuableDye) ||
        left.name.localeCompare(right.name)
    )
}

function getVisibleSetCount(status: SetStatus): number {
  return visibleSetCounts.value[status] ?? SET_BATCH_SIZE
}

function showMoreSets(status: SetStatus): void {
  visibleSetCounts.value = {
    ...visibleSetCounts.value,
    [status]: getVisibleSetCount(status) + SET_BATCH_SIZE
  }
}

function getLoadMoreLabel(group: GlamourSetStatusGroupView): string {
  return formatArmoireText(t, textKeys.nsarmoireLoadMoreList, { count: group.nextCount })
}

function toSetView(set: ArmoireGlamourSetState): GlamourSetView {
  const storedByBucketPieceIds = new Set(set.storedByBucketPieceItemIds)
  const status = getSetStatus(set)
  const pieces = set.pieceItemIds
    .map((itemId) => toPieceView(set, itemId, storedByBucketPieceIds))
    .sort(
      (left, right) =>
        left.sortPriority - right.sortPriority ||
        Number(left.hasValuableDye) - Number(right.hasValuableDye) ||
        left.name.localeCompare(right.name)
    )
  const hasValuableDye = pieces.some((piece) => piece.status === 'loose' && piece.hasValuableDye)

  return {
    key: `glamour-set-${set.setItemId}`,
    name: set.setName || getArmoireItemName(props.catalog, set.setItemId, t),
    status,
    statusLabel: getSetStatusLabel(status),
    pieces,
    sortPriority: getSetSortPriority(status),
    hasValuableDye
  }
}

function toPieceView(
  set: ArmoireGlamourSetState,
  itemId: number,
  storedByBucketPieceIds: ReadonlySet<number>
): GlamourSetPieceView {
  const ownership = set.pieceOwnershipByItemId[itemId]
  const entries = ownership?.looseEntries ?? set.loosePieceEntriesByItemId[itemId] ?? []
  const status = ownership?.status ?? getPieceStatus(itemId, entries, storedByBucketPieceIds)
  const name = getArmoireItemName(props.catalog, itemId, t)
  const statusLabel = getPieceStatusLabel(status)
  const locationLabel = status === 'loose' ? getLoosePieceLocationLabel(entries) : ''
  const dyeLine = status === 'loose' ? getLoosePieceDyeLine(itemId, entries) : null

  return {
    key: `glamour-set-${set.setItemId}-${itemId}`,
    itemId,
    name,
    iconUrl: getArmoireItemIconUrl(props.catalog, itemId),
    status,
    statusLabel,
    locationLabel,
    dyeLine,
    tooltip: [
      name,
      locationLabel,
      dyeLine ? formatDyeLineTooltip(dyeLine) : '',
      statusLabel
    ].filter(Boolean).join('\n'),
    hasValuableDye: status === 'loose' && entries.some((entry) => entry.hasValuableDye),
    sortPriority: getPieceSortPriority(status)
  }
}

function getSetStatus(set: ArmoireGlamourSetState): SetStatus {
  const looseCount = set.loosePieceItemIds.length

  if (set.isStoredAsSet) {
    if (set.missingPieceItemIds.length > 0) {
      return 'missingPieces'
    }

    return looseCount > 0 ? 'loosePiecesToStore' : 'completeStored'
  }

  return looseCount > 0 ? 'canCreateSet' : 'unowned'
}

function getSetStatusLabel(status: SetStatus): string {
  const labelKeys: Record<SetStatus, string> = {
    loosePiecesToStore: textKeys.nsarmoireGlamourSetLoosePiecesToStore,
    canCreateSet: textKeys.nsarmoireGlamourSetCanCreateSet,
    missingPieces: textKeys.nsarmoireGlamourSetMissingPieces,
    unowned: textKeys.nsarmoireGlamourSetUnowned,
    completeStored: textKeys.nsarmoireGlamourSetCompleteStored
  }

  return t(labelKeys[status])
}

function getSetSortPriority(status: SetStatus): number {
  const priorities: Record<SetStatus, number> = {
    loosePiecesToStore: 0,
    canCreateSet: 1,
    missingPieces: 2,
    unowned: 3,
    completeStored: 4
  }

  return priorities[status]
}

function getPieceStatus(
  itemId: number,
  looseEntries: readonly ArmoireGlamourSetPieceEntry[],
  storedByBucketPieceIds: ReadonlySet<number>
): PieceStatus {
  if (storedByBucketPieceIds.has(itemId)) {
    return 'stored'
  }

  if (looseEntries.length > 0) {
    return 'loose'
  }

  return 'missing'
}

function getPieceStatusLabel(status: PieceStatus): string {
  const labelKeys: Record<PieceStatus, string> = {
    stored: textKeys.nsarmoireCollectionStatusStored,
    loose: textKeys.nsarmoireCollectionStatusToStore,
    missing: textKeys.nsarmoireCollectionStatusUnowned
  }

  return t(labelKeys[status])
}

function getPieceSortPriority(status: PieceStatus): number {
  const priorities: Record<PieceStatus, number> = {
    stored: 0,
    loose: 1,
    missing: 2
  }

  return priorities[status]
}

function getLoosePieceLocationLabel(entries: readonly ArmoireGlamourSetPieceEntry[]): string {
  const locations = Array.from(new Set(entries.map((entry) => getArmoireContainerLabel(entry, t))))

  return locations.length > 0
    ? formatArmoireText(t, textKeys.nsarmoireHintCurrentLocation, {
        locations: locations.join(' / ')
      })
    : ''
}

function getLoosePieceDyeLine(
  itemId: number,
  entries: readonly ArmoireGlamourSetPieceEntry[]
): GlamourSetPieceDyeLine | null {
  if (props.catalog.items[itemId]?.dyeSlotCount === 0) {
    return null
  }

  const dyedEntry = entries.find((entry) => entry.dyeIds.some((dyeId) => dyeId > 0))

  if (!dyedEntry) {
    return null
  }

  const slots = getArmoireDyeSlotViews(
    props.catalog,
    dyedEntry.dyeIds,
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
    suffix: entries.some((entry) => entry.hasValuableDye)
      ? t(textKeys.nsarmoireHintValuableDyeDeferredSuffix)
      : ''
  }
}

function formatDyeLineTooltip(dyeLine: GlamourSetPieceDyeLine): string {
  return [
    t(textKeys.nsarmoireHintDyed),
    dyeLine.slots.map((slot) => slot.name).join(' / '),
    dyeLine.suffix
  ].filter(Boolean).join(' ')
}

function hideBrokenImage(event: Event): void {
  const image = event.currentTarget

  if (image instanceof HTMLImageElement) {
    image.style.visibility = 'hidden'
  }
}
</script>

<style scoped>
.nsarmoire-set-panel {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
}

.nsarmoire-set-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsarmoire-set-panel h2,
.nsarmoire-set-panel h3 {
  margin: 0;
  font-family: var(--ns-font-sans);
  font-weight: 800;
  letter-spacing: 0;
}

.nsarmoire-set-panel h2 {
  font-size: 16px;
}

.nsarmoire-set-panel__groups {
  display: grid;
  gap: 10px;
}

.nsarmoire-set-panel__list {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-set-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 9px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface-solid);
}

.nsarmoire-set-card--unowned {
  color: var(--ns-color-text-muted);
}

.nsarmoire-set-card__title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.nsarmoire-set-card h3 {
  min-width: 0;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-set-card__title-row > span,
.nsarmoire-set-card__piece-status {
  flex: 0 0 auto;
  max-width: min(44vw, 320px);
  min-width: 0;
  overflow: hidden;
  padding: 5px 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text-muted);
  font-size: 13px;
  font-weight: 850;
  line-height: 1.25;
  white-space: nowrap;
}

.nsarmoire-set-card--completeStored .nsarmoire-set-card__title-row > span,
.nsarmoire-set-card--canCreateSet .nsarmoire-set-card__title-row > span,
.nsarmoire-set-card--loosePiecesToStore .nsarmoire-set-card__title-row > span,
.nsarmoire-set-card--missingPieces .nsarmoire-set-card__title-row > span,
.nsarmoire-set-card--unowned .nsarmoire-set-card__title-row > span,
.nsarmoire-set-card__piece--stored .nsarmoire-set-card__piece-status,
.nsarmoire-set-card__piece--loose .nsarmoire-set-card__piece-status,
.nsarmoire-set-card__piece--missing .nsarmoire-set-card__piece-status {
  border-color: var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text);
}

.nsarmoire-set-card__piece--missing {
  opacity: 0.62;
}

.nsarmoire-set-card__piece--valuable-dye {
  color: var(--ns-color-text-muted);
  filter: grayscale(0.45);
  opacity: 0.72;
}

.nsarmoire-set-card__pieces {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.nsarmoire-set-card__pieces strong {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.nsarmoire-set-card__pieces ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-set-card__pieces li {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) minmax(132px, auto);
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

.nsarmoire-set-card__pieces img,
.nsarmoire-set-card__piece-icon {
  width: 40px;
  height: 40px;
  border: 1px solid var(--ns-color-border);
  object-fit: contain;
}

.nsarmoire-set-card__piece-icon {
  background: var(--ns-pixel-surface);
}

.nsarmoire-set-card__piece-body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.nsarmoire-set-card__piece-name,
.nsarmoire-set-card__piece-body small {
  min-width: 0;
  overflow: hidden;
}

.nsarmoire-set-card__piece-name {
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.25;
  white-space: nowrap;
}

.nsarmoire-set-card__piece-body small {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-set-card__piece-dyes {
  display: flex;
  align-items: center;
  gap: 5px;
}

.nsarmoire-set-card__dye-slots,
.nsarmoire-set-card__dye-slot {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.nsarmoire-set-card__dye-slots {
  gap: 3px 5px;
}

.nsarmoire-set-card__dye-slot {
  gap: 3px;
}

.nsarmoire-set-card__dye-slot + .nsarmoire-set-card__dye-slot::before {
  content: '/';
  color: var(--ns-color-text-muted);
}

.nsarmoire-set-card__dye-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  border: 1px solid var(--ns-color-border-strong);
  box-shadow: var(--ns-control-inset-shadow);
}

.nsarmoire-set-card__piece-status {
  justify-self: end;
  width: fit-content;
  text-overflow: ellipsis;
}

.nsarmoire-set-panel__more {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 720px) {
  .nsarmoire-set-card__title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .nsarmoire-set-card__pieces ul {
    grid-template-columns: 1fr;
  }
}
</style>
