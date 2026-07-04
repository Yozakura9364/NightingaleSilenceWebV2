<template>
  <div v-if="items.length" class="nsarmoire-readable-list-wrap">
    <ul class="nsarmoire-readable-list">
      <li
        v-for="item in visibleItems"
        :key="item.key"
        class="nsarmoire-readable-list__item"
        :class="[
          item.tone ? `nsarmoire-readable-list__item--${item.tone}` : undefined,
          item.visibleRelatedItems.length ? 'nsarmoire-readable-list__item--related' : undefined
        ]"
        :title="getItemTitle(item)"
      >
        <span class="nsarmoire-readable-list__icon" aria-hidden="true">
          <img
            v-if="item.iconUrl"
            :src="item.iconUrl"
            alt=""
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
            @error="hideBrokenIcon"
          />
        </span>
        <span class="nsarmoire-readable-list__body">
          <span class="nsarmoire-readable-list__name">{{ item.name }}</span>
          <small v-if="item.context">{{ item.context }}</small>
        </span>
        <ul v-if="item.visibleRelatedItems.length" class="nsarmoire-readable-list__related">
          <li
            v-for="relatedItem in item.visibleRelatedItems"
            :key="relatedItem.key"
            :title="relatedItem.name"
          >
            <span class="nsarmoire-readable-list__related-icon">
              <img
                v-if="relatedItem.iconUrl"
                :src="relatedItem.iconUrl"
                alt=""
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
              />
            </span>
            <span>{{ relatedItem.name }}</span>
          </li>
          <li
            v-if="item.hasHiddenRelatedItems"
            class="nsarmoire-readable-list__related-more"
            :title="item.relatedTitle"
          >
            <span class="nsarmoire-readable-list__related-more-count">
              +{{ item.hiddenRelatedItemCount }}
            </span>
          </li>
        </ul>
      </li>
    </ul>

    <div v-if="hasMoreItems" class="nsarmoire-readable-list__more">
      <AppButton :disabled="isExpansionPending" @click="showMoreItems">
        {{ loadMoreLabel }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import { textKeys } from '@/config/site'
import type { ArmoireReadableItemView } from '@/pages/armoire/utils/insightDisplay'
import { formatArmoireText } from '@/pages/armoire/utils/itemDisplay'
import { useLocale } from '@/stores/locale'

const EXPANDED_INITIAL_BATCH_SIZE = 12
const EXPANDED_BATCH_SIZE = 12
const RELATED_ITEM_PREVIEW_LIMIT = 8
type WindowWithIdleCallback = Window & {
  requestIdleCallback?: Window['requestIdleCallback']
  cancelIdleCallback?: Window['cancelIdleCallback']
}

const props = defineProps<{
  items: ArmoireReadableItemView[]
  limit?: number
  expanded?: boolean
}>()

const { t } = useLocale()
const renderedVisibleCount = ref(0)
const isExpansionPending = ref(false)
let animationFrameHandle: number | null = null
let idleCallbackHandle: number | null = null
let timeoutHandle: number | null = null

const collapsedVisibleLimit = computed(() => props.limit ?? props.items.length)

const firstExpandedLimit = computed(() =>
  Math.min(
    props.items.length,
    Math.max(collapsedVisibleLimit.value, EXPANDED_INITIAL_BATCH_SIZE)
  )
)

const visibleItems = computed(() => {
  return props.items
    .slice(0, Math.min(props.items.length, renderedVisibleCount.value))
    .map((item) => {
      const relatedItems = item.relatedItems ?? []

      return {
        ...item,
        visibleRelatedItems: relatedItems.slice(0, RELATED_ITEM_PREVIEW_LIMIT),
        hiddenRelatedItemCount: Math.max(relatedItems.length - RELATED_ITEM_PREVIEW_LIMIT, 0),
        hasHiddenRelatedItems: relatedItems.length > RELATED_ITEM_PREVIEW_LIMIT,
        relatedTitle: relatedItems.map((relatedItem) => relatedItem.name).join(' / ')
      }
    })
})

const hasMoreItems = computed(
  () => props.expanded === true && visibleItems.value.length < props.items.length
)

const nextBatchCount = computed(() =>
  Math.min(EXPANDED_BATCH_SIZE, Math.max(props.items.length - visibleItems.value.length, 0))
)

const loadMoreLabel = computed(() =>
  formatArmoireText(t, textKeys.nsarmoireLoadMoreList, { count: nextBatchCount.value })
)

watch(
  () => [props.expanded, props.items.length, props.limit] as const,
  () => {
    if (props.expanded === true) {
      renderedVisibleCount.value = Math.min(
        renderedVisibleCount.value || collapsedVisibleLimit.value,
        collapsedVisibleLimit.value
      )
      scheduleVisibleCount(firstExpandedLimit.value)
      return
    }

    cancelScheduledVisibleCount()
    isExpansionPending.value = false
    renderedVisibleCount.value = collapsedVisibleLimit.value
  },
  { immediate: true }
)

function showMoreItems(): void {
  scheduleVisibleCount(Math.min(
    props.items.length,
    renderedVisibleCount.value + EXPANDED_BATCH_SIZE
  ))
}

function scheduleVisibleCount(count: number): void {
  cancelScheduledVisibleCount()
  isExpansionPending.value = true

  animationFrameHandle = window.requestAnimationFrame(() => {
    animationFrameHandle = null
    const browserWindow = window as WindowWithIdleCallback

    const commit = () => {
      renderedVisibleCount.value = count
      isExpansionPending.value = false
      idleCallbackHandle = null
      timeoutHandle = null
    }

    if (browserWindow.requestIdleCallback) {
      idleCallbackHandle = browserWindow.requestIdleCallback(commit, { timeout: 120 })
      return
    }

    timeoutHandle = globalThis.setTimeout(commit, 0)
  })
}

function cancelScheduledVisibleCount(): void {
  if (animationFrameHandle !== null) {
    window.cancelAnimationFrame(animationFrameHandle)
    animationFrameHandle = null
  }

  const browserWindow = window as WindowWithIdleCallback

  if (idleCallbackHandle !== null && browserWindow.cancelIdleCallback) {
    browserWindow.cancelIdleCallback(idleCallbackHandle)
    idleCallbackHandle = null
  }

  if (timeoutHandle !== null) {
    globalThis.clearTimeout(timeoutHandle)
    timeoutHandle = null
  }
}

onBeforeUnmount(cancelScheduledVisibleCount)

function getItemTitle(item: ArmoireReadableItemView): string {
  return [
    item.name,
    item.context,
    item.relatedItems?.map((relatedItem) => relatedItem.name).join(' / ')
  ]
    .filter(Boolean)
    .join('\n')
}

function hideBrokenIcon(event: Event): void {
  const image = event.currentTarget

  if (image instanceof HTMLImageElement) {
    image.style.display = 'none'
    image.parentElement?.classList.add('nsarmoire-readable-list__icon--empty')
  }
}
</script>

<style scoped>
.nsarmoire-readable-list-wrap {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.nsarmoire-readable-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-readable-list__item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
  contain: layout paint style;
  content-visibility: auto;
  contain-intrinsic-size: auto 64px;
}

.nsarmoire-readable-list__item--danger {
  border-color: var(--ns-status-danger-border);
}

.nsarmoire-readable-list__item--related {
  grid-column: 1 / -1;
  grid-template-columns: 40px minmax(150px, 240px) minmax(0, 1fr);
  gap: 8px 12px;
  min-height: 0;
  padding: 8px 10px;
  contain-intrinsic-size: auto 78px;
}

.nsarmoire-readable-list__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-pixel-surface);
  image-rendering: auto;
}

.nsarmoire-readable-list__icon img {
  display: block;
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.nsarmoire-readable-list__icon--empty {
  display: none;
}

.nsarmoire-readable-list__body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.nsarmoire-readable-list__name,
.nsarmoire-readable-list small {
  min-width: 0;
  overflow-wrap: anywhere;
}

.nsarmoire-readable-list__name {
  font-size: 12px;
  font-weight: 900;
  line-height: 1.3;
}

.nsarmoire-readable-list small {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-mono);
  font-size: 10.5px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.nsarmoire-readable-list__related {
  grid-column: 3;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-readable-list__related li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  width: clamp(150px, 18vw, 220px);
  min-height: 44px;
  min-width: 0;
  padding: 5px 7px;
  border: 1px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
  contain: layout paint style;
}

.nsarmoire-readable-list__related-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-pixel-surface);
}

.nsarmoire-readable-list__related-icon img {
  display: block;
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.nsarmoire-readable-list__related span:last-child {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  overflow-wrap: anywhere;
  font-size: 11.5px;
  font-weight: 780;
  line-height: 1.25;
  text-align: left;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.nsarmoire-readable-list__related-more {
  align-content: center;
  justify-content: center;
  width: auto;
  min-height: 44px;
}

.nsarmoire-readable-list__related-more-count {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-pixel-surface);
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 950;
}

@media (max-width: 560px) {
  .nsarmoire-readable-list {
    grid-template-columns: 1fr;
  }

  .nsarmoire-readable-list__item--related {
    grid-template-columns: 36px minmax(0, 1fr);
    min-height: 0;
  }

  .nsarmoire-readable-list__related {
    grid-column: 1 / -1;
    margin-top: 2px;
  }
}

.nsarmoire-readable-list__more {
  display: flex;
  justify-content: flex-start;
}
</style>
