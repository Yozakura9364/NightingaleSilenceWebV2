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

    <template v-else>
      <p class="nsarmoire-collection-panel__summary">{{ summary }}</p>

      <div class="nsarmoire-collection-panel__groups">
        <section class="nsarmoire-collection-panel__group">
          <h3>{{ t(textKeys.nsarmoireCabinetTransferableTitle) }}</h3>

          <ul v-if="hasVisibleTransferableItems" class="nsarmoire-collection-panel__list">
            <li
              v-for="item in visibleTransferableItems"
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
              <span class="nsarmoire-collection-panel__badge">
                {{ t(textKeys.nsarmoireCollectionStatusTransferable) }}
              </span>
            </li>
          </ul>

          <AppStatus v-else compact tone="info" :message="t(textKeys.nsarmoireCollectionNoItems)" />

          <AppButton v-if="hasMoreTransferableItems" @click="showMoreTransferableItems">
            {{ transferableLoadMoreLabel }}
          </AppButton>
        </section>

        <section class="nsarmoire-collection-panel__group">
          <h3>{{ t(textKeys.nsarmoireCabinetMissingTitle) }}</h3>

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
        </section>
      </div>
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
import type { ArmoireCatalog, ArmoireSnapshotAnalysis } from '@/lib/armoire/types'
import NSArmoireItemActionMenu from '@/pages/armoire/components/NSArmoireItemActionMenu.vue'
import {
  formatArmoireText,
  getArmoireItemIconUrl,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'
import { useArmoireItemActionMenu } from '@/pages/armoire/composables/useArmoireItemActionMenu'
import { useLocale } from '@/stores/locale'

interface CabinetItemView {
  key: string
  itemId: number
  name: string
  iconUrl: string
  isOwned: boolean
  isDyed: boolean
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
const visibleTransferableCount = ref(CABINET_BATCH_SIZE)
const visibleMissingCount = ref(CABINET_BATCH_SIZE)

const cabinetProgress = computed(() =>
  props.analysis?.cabinetProgress.status === 'ready' ? props.analysis.cabinetProgress : null
)

const summary = computed(() => {
  const progress = cabinetProgress.value
  if (!progress) {
    return ''
  }

  return formatArmoireText(t, textKeys.nsarmoireCabinetStatsSummary, {
    stored: progress.storedCount,
    total: progress.storableCount,
    transferable: progress.transferableItemIds.length,
    missing: progress.missingCabinetItemIds.length
  })
})

const transferableItems = computed(() =>
  toItemViews(cabinetProgress.value?.transferableItemIds ?? [])
)
const missingItems = computed(() => toItemViews(cabinetProgress.value?.missingCabinetItemIds ?? []))

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
    visibleTransferableCount.value = CABINET_BATCH_SIZE
    visibleMissingCount.value = CABINET_BATCH_SIZE
  }
)

function toItemViews(itemIds: number[]): CabinetItemView[] {
  const progress = cabinetProgress.value
  const ownedItemIds = new Set(progress?.ownedCabinetItemIds ?? [])
  const dyedOwnedItemIds = new Set(progress?.dyedOwnedCabinetItemIds ?? [])

  return itemIds.map((itemId) => ({
    key: `cabinet-${itemId}`,
    itemId,
    name: getArmoireItemName(props.catalog, itemId, t),
    iconUrl: getArmoireItemIconUrl(props.catalog, itemId),
    isOwned: ownedItemIds.has(itemId),
    isDyed: dyedOwnedItemIds.has(itemId)
  }))
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

.nsarmoire-collection-panel h2,
.nsarmoire-collection-panel h3 {
  margin: 0;
  font-family: var(--ns-font-sans);
  font-weight: 800;
  letter-spacing: 0;
}

.nsarmoire-collection-panel h2 {
  font-size: 16px;
}

.nsarmoire-collection-panel h3 {
  font-size: 14px;
}

.nsarmoire-collection-panel__summary {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 13px;
  line-height: 1.7;
}

.nsarmoire-collection-panel__groups {
  display: grid;
  gap: 10px;
}

.nsarmoire-collection-panel__group {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.nsarmoire-collection-panel__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-collection-panel__list li {
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

.nsarmoire-collection-panel__list img,
.nsarmoire-collection-panel__icon-fallback {
  width: 28px;
  height: 28px;
  border: 1px solid var(--ns-color-border);
  object-fit: cover;
}

.nsarmoire-collection-panel__icon-fallback {
  background: var(--ns-pixel-surface);
}

.nsarmoire-collection-panel__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsarmoire-collection-panel__badge {
  padding: 2px 6px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.nsarmoire-collection-panel__badge-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}

.nsarmoire-collection-panel__badge--owned {
  border-color: var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
}

.nsarmoire-collection-panel__badge--warning {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
  color: var(--ns-color-text);
}

.nsarmoire-collection-panel__badge--muted {
  border-color: var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  color: var(--ns-color-text-muted);
}

@media (max-width: 640px) {
  .nsarmoire-collection-panel__list {
    grid-template-columns: 1fr;
  }
}
</style>
