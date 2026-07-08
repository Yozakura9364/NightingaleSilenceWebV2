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

    <template v-else>
      <p class="nsarmoire-set-panel__summary">{{ summary }}</p>

      <AppStatus
        v-if="setViews.length === 0"
        compact
        tone="info"
        :message="t(textKeys.nsarmoireGlamourSetNoSets)"
      />

      <template v-else>
        <ol class="nsarmoire-set-panel__list">
          <li
            v-for="set in visibleSetViews"
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
                  :class="{ 'nsarmoire-set-card__piece--stored': piece.stored }"
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
                  <span class="nsarmoire-set-card__piece-name">{{ piece.name }}</span>
                  <span class="nsarmoire-set-card__piece-status">
                    {{ piece.statusLabel }}
                  </span>
                </li>
              </ul>
            </div>
          </li>
        </ol>

        <div v-if="hasMoreSets" class="nsarmoire-set-panel__more">
          <AppButton @click="showMoreSets">
            {{ loadMoreLabel }}
          </AppButton>
        </div>
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
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type {
  ArmoireCatalog,
  ArmoireGlamourSetState,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'
import NSArmoireItemActionMenu from '@/pages/armoire/components/NSArmoireItemActionMenu.vue'
import {
  formatArmoireText,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'
import { useArmoireItemActionMenu } from '@/pages/armoire/composables/useArmoireItemActionMenu'
import { useLocale } from '@/stores/locale'

type SetStatus = 'complete' | 'incomplete' | 'notStored'

interface GlamourSetPieceView {
  key: string
  itemId: number
  name: string
  iconUrl: string
  stored: boolean
  statusLabel: string
}

interface GlamourSetView {
  key: string
  name: string
  status: SetStatus
  statusLabel: string
  pieces: GlamourSetPieceView[]
  sortPriority: number
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
const SET_BATCH_SIZE = 10
const visibleSetCount = ref(SET_BATCH_SIZE)

const setProgress = computed(() =>
  props.analysis?.glamourSetProgress.status === 'ready' ? props.analysis.glamourSetProgress : null
)

const summary = computed(() => {
  const progress = setProgress.value
  if (!progress) {
    return ''
  }

  return formatArmoireText(t, textKeys.nsarmoireGlamourSetStatsSummary, {
    stored: progress.storedSetCount,
    total: progress.availableSetCount,
    incomplete: progress.incompleteStoredSetCount
  })
})

const setViews = computed<GlamourSetView[]>(() =>
  (setProgress.value?.sets ?? [])
    .map((set) => toSetView(set))
    .sort(
      (left, right) => left.sortPriority - right.sortPriority || left.name.localeCompare(right.name)
    )
)

const visibleSetViews = computed(() => setViews.value.slice(0, visibleSetCount.value))
const hasMoreSets = computed(() => visibleSetViews.value.length < setViews.value.length)
const nextSetCount = computed(() =>
  Math.min(SET_BATCH_SIZE, setViews.value.length - visibleSetViews.value.length)
)
const loadMoreLabel = computed(() =>
  formatArmoireText(t, textKeys.nsarmoireLoadMoreList, { count: nextSetCount.value })
)

watch(
  () => [props.analysis, props.catalog.generatedAt] as const,
  () => {
    visibleSetCount.value = SET_BATCH_SIZE
  }
)

function toSetView(set: ArmoireGlamourSetState): GlamourSetView {
  const storedPieceIds = new Set(set.storedPieceItemIds)
  const status = getSetStatus(set)

  return {
    key: `glamour-set-${set.setItemId}`,
    name: set.setName || getArmoireItemName(props.catalog, set.setItemId, t),
    status,
    statusLabel: getSetStatusLabel(status),
    pieces: set.pieceItemIds.map((itemId) => ({
      key: `glamour-set-${set.setItemId}-${itemId}`,
      itemId,
      name: getArmoireItemName(props.catalog, itemId, t),
      iconUrl: getArmoireItemIconUrl(props.catalog, itemId),
      stored: storedPieceIds.has(itemId),
      statusLabel: storedPieceIds.has(itemId)
        ? t(textKeys.nsarmoireCollectionStatusStored)
        : t(textKeys.nsarmoireCollectionStatusMissing)
    })),
    sortPriority: getSetSortPriority(status)
  }
}

function getSetStatus(set: ArmoireGlamourSetState): SetStatus {
  if (!set.isStoredAsSet) {
    return 'notStored'
  }

  return set.missingPieceItemIds.length > 0 ? 'incomplete' : 'complete'
}

function getSetStatusLabel(status: SetStatus): string {
  const labelKeys: Record<SetStatus, string> = {
    complete: textKeys.nsarmoireGlamourSetComplete,
    incomplete: textKeys.nsarmoireGlamourSetIncomplete,
    notStored: textKeys.nsarmoireGlamourSetNotStored
  }

  return t(labelKeys[status])
}

function getSetSortPriority(status: SetStatus): number {
  const priorities: Record<SetStatus, number> = {
    incomplete: 0,
    notStored: 1,
    complete: 2
  }

  return priorities[status]
}

function showMoreSets(): void {
  visibleSetCount.value = Math.min(setViews.value.length, visibleSetCount.value + SET_BATCH_SIZE)
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

.nsarmoire-set-panel__summary {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 13px;
  line-height: 1.7;
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
  background: var(--ns-color-surface);
}

.nsarmoire-set-card--incomplete {
  border-color: var(--ns-status-warning-border);
}

.nsarmoire-set-card--complete {
  border-color: var(--ns-status-success-border);
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
  padding: 2px 6px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.nsarmoire-set-card--complete .nsarmoire-set-card__title-row > span,
.nsarmoire-set-card__piece--stored .nsarmoire-set-card__piece-status {
  border-color: var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
  color: var(--ns-color-text);
}

.nsarmoire-set-card--incomplete .nsarmoire-set-card__title-row > span {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
  color: var(--ns-color-text);
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
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-set-card__pieces li {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 5px 6px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  cursor: context-menu;
  -webkit-touch-callout: none;
}

.nsarmoire-set-card__pieces img,
.nsarmoire-set-card__piece-icon {
  width: 28px;
  height: 28px;
  border: 1px solid var(--ns-color-border);
  object-fit: cover;
}

.nsarmoire-set-card__piece-icon {
  background: var(--ns-pixel-surface);
}

.nsarmoire-set-card__piece-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
