<template>
  <div v-if="items.length" class="nsarmoire-readable-list-wrap">
    <ul class="nsarmoire-readable-list">
      <li
        v-for="item in visibleItems"
        :key="item.key"
        class="nsarmoire-readable-list__item"
        :class="[
          item.tone ? `nsarmoire-readable-list__item--${item.tone}` : undefined,
          item.details?.length ? 'nsarmoire-readable-list__item--detailed' : undefined,
          item.visibleRelatedItems.length ? 'nsarmoire-readable-list__item--related' : undefined
        ]"
        :title="getItemTitle(item)"
        @contextmenu="openItemActionMenu(item, $event)"
        @pointerdown="startItemActionLongPress(item, $event)"
        @pointermove="moveItemActionLongPress"
        @pointerup="cancelItemActionLongPress"
        @pointercancel="cancelItemActionLongPress"
        @pointerleave="cancelItemActionLongPress"
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
          <dl v-if="item.details?.length" class="nsarmoire-readable-list__details">
            <div v-for="detail in item.details" :key="detail.key">
              <dt v-if="detail.title">{{ detail.title }}</dt>
              <dd v-for="line in detail.lines" :key="line">{{ line }}</dd>
              <dd
                v-if="detail.dyeLine"
                class="nsarmoire-readable-list__detail-line--dyes"
              >
                <span>{{ detail.dyeLine.label }}</span>
                <span class="nsarmoire-readable-list__dye-slots">
                  <span
                    v-for="dyeSlot in detail.dyeLine.slots"
                    :key="dyeSlot.key"
                    class="nsarmoire-readable-list__dye-slot"
                  >
                    <span
                      v-if="dyeSlot.color"
                      class="nsarmoire-readable-list__dye-swatch"
                      :style="{ backgroundColor: dyeSlot.color }"
                      aria-hidden="true"
                    />
                    <span>{{ dyeSlot.name }}</span>
                  </span>
                </span>
                <span v-if="detail.dyeLine.suffix">{{ detail.dyeLine.suffix }}</span>
              </dd>
            </div>
          </dl>
        </span>
        <ul v-if="item.visibleRelatedItems.length" class="nsarmoire-readable-list__related">
          <li
            v-for="relatedItem in item.visibleRelatedItems"
            :key="relatedItem.key"
            :class="relatedItem.status ? `nsarmoire-readable-list__related-item--${relatedItem.status}` : undefined"
            :title="getRelatedItemTitle(relatedItem)"
            @contextmenu.stop="openItemActionMenu(relatedItem, $event)"
            @pointerdown.stop="startItemActionLongPress(relatedItem, $event)"
            @pointermove.stop="moveItemActionLongPress"
            @pointerup.stop="cancelItemActionLongPress"
            @pointercancel.stop="cancelItemActionLongPress"
            @pointerleave.stop="cancelItemActionLongPress"
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
            <span class="nsarmoire-readable-list__related-text">
              <span>{{ relatedItem.name }}</span>
              <small v-if="relatedItem.statusLabel">{{ relatedItem.statusLabel }}</small>
            </span>
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

    <NSArmoireItemActionMenu
      :menu="itemActionMenu"
      :can-ignore-items="canIgnoreItems"
      :can-unignore-items="canUnignoreItems"
      @close="closeItemActionMenu"
      @ignore-item="$emit('ignore-item', $event)"
      @unignore-item="$emit('unignore-item', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import NSArmoireItemActionMenu from '@/pages/armoire/components/NSArmoireItemActionMenu.vue'
import type {
  ArmoireReadableItemRelatedView,
  ArmoireReadableItemView
} from '@/pages/armoire/utils/insightDisplay'
import { useArmoireItemActionMenu } from '@/pages/armoire/composables/useArmoireItemActionMenu'

const RELATED_ITEM_PREVIEW_LIMIT = 8
type WindowWithIdleCallback = Window & {
  requestIdleCallback?: Window['requestIdleCallback']
  cancelIdleCallback?: Window['cancelIdleCallback']
}

const props = withDefaults(defineProps<{
  items: ArmoireReadableItemView[]
  limit?: number
  expanded?: boolean
  canIgnoreItems?: boolean
  canUnignoreItems?: boolean
}>(), {
  canIgnoreItems: true,
  canUnignoreItems: false
})

defineEmits<{
  'ignore-item': [itemId: number]
  'unignore-item': [itemId: number]
}>()

const renderedVisibleCount = ref(0)
let animationFrameHandle: number | null = null
let idleCallbackHandle: number | null = null
let timeoutHandle: number | null = null
const {
  itemActionMenu,
  closeItemActionMenu,
  openItemActionMenu,
  startItemActionLongPress,
  moveItemActionLongPress,
  cancelItemActionLongPress
} = useArmoireItemActionMenu()

const collapsedVisibleLimit = computed(() => props.limit ?? props.items.length)
const canIgnoreItems = computed(() => props.canIgnoreItems !== false)
const canUnignoreItems = computed(() => props.canUnignoreItems === true)

const visibleItems = computed(() => {
  return props.items
    .slice(0, Math.min(props.items.length, renderedVisibleCount.value))
    .map((item) => {
      const relatedItems = item.relatedItems ?? []
      const shouldShowAllRelatedItems = props.expanded === true
      const visibleRelatedItems = shouldShowAllRelatedItems
        ? relatedItems
        : relatedItems.slice(0, RELATED_ITEM_PREVIEW_LIMIT)

      return {
        ...item,
        visibleRelatedItems,
        hiddenRelatedItemCount: Math.max(relatedItems.length - visibleRelatedItems.length, 0),
        hasHiddenRelatedItems: relatedItems.length > visibleRelatedItems.length,
        relatedTitle: relatedItems.map((relatedItem) => relatedItem.name).join(' / ')
      }
    })
})

watch(
  () => [props.expanded, props.items.length, props.limit] as const,
  () => {
    if (props.expanded === true) {
      renderedVisibleCount.value = Math.min(
        renderedVisibleCount.value || collapsedVisibleLimit.value,
        collapsedVisibleLimit.value
      )
      scheduleVisibleCount(props.items.length)
      return
    }

    cancelScheduledVisibleCount()
    renderedVisibleCount.value = collapsedVisibleLimit.value
  },
  { immediate: true }
)

function scheduleVisibleCount(count: number): void {
  cancelScheduledVisibleCount()

  animationFrameHandle = window.requestAnimationFrame(() => {
    animationFrameHandle = null
    const browserWindow = window as WindowWithIdleCallback

    const commit = () => {
      renderedVisibleCount.value = count
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

onBeforeUnmount(() => {
  cancelScheduledVisibleCount()
  cancelItemActionLongPress()
})

function getItemTitle(item: ArmoireReadableItemView): string {
  return [
    item.name,
    item.context,
    item.details
      ?.flatMap((detail) => [
        detail.title,
        ...detail.lines,
        detail.dyeLine
          ? `${detail.dyeLine.label}${detail.dyeLine.slots
              .map((slot) => slot.name)
              .join(' / ')}${detail.dyeLine.suffix ?? ''}`
          : ''
      ])
      .join('\n'),
    item.relatedItems?.map((relatedItem) => relatedItem.name).join(' / ')
  ]
    .filter(Boolean)
    .join('\n')
}

function getRelatedItemTitle(item: ArmoireReadableItemRelatedView): string {
  return [item.name, item.statusLabel].filter(Boolean).join('\n')
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
  grid-template-columns: repeat(auto-fill, minmax(244px, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-readable-list__item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: start;
  gap: 9px;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  contain: layout paint style;
  content-visibility: auto;
  contain-intrinsic-size: auto 76px;
  cursor: context-menu;
  -webkit-touch-callout: none;
}

.nsarmoire-readable-list__item--danger {
  border-color: var(--ns-status-danger-border);
}

.nsarmoire-readable-list__item--muted {
  color: var(--ns-color-text-muted);
  background: var(--ns-color-bg-soft);
  filter: grayscale(0.45);
  opacity: 0.72;
}

.nsarmoire-readable-list__item--related {
  grid-column: 1 / -1;
  grid-template-columns: 42px minmax(170px, 260px) minmax(0, 1fr);
  gap: 8px 12px;
  min-height: 0;
  padding: 8px 10px;
  contain-intrinsic-size: auto 92px;
}

.nsarmoire-readable-list__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-pixel-surface);
  image-rendering: auto;
}

.nsarmoire-readable-list__icon img {
  display: block;
  width: 36px;
  height: 36px;
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
  font-size: 13px;
  font-weight: 900;
  line-height: 1.3;
}

.nsarmoire-readable-list small {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-mono);
  font-size: 11px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.nsarmoire-readable-list__details {
  display: grid;
  gap: 5px;
  margin: 2px 0 0;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-sans);
  font-size: 11px;
  line-height: 1.35;
}

.nsarmoire-readable-list__details div {
  display: grid;
  gap: 1px;
}

.nsarmoire-readable-list__details dt,
.nsarmoire-readable-list__details dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

.nsarmoire-readable-list__details dt {
  font-weight: 850;
}

.nsarmoire-readable-list__detail-line--dyes {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
}

.nsarmoire-readable-list__dye-slots,
.nsarmoire-readable-list__dye-slot {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.nsarmoire-readable-list__dye-slots {
  flex-wrap: wrap;
  gap: 2px 4px;
}

.nsarmoire-readable-list__dye-slot {
  gap: 3px;
}

.nsarmoire-readable-list__dye-slot + .nsarmoire-readable-list__dye-slot::before {
  content: '/';
  color: var(--ns-color-text-muted);
}

.nsarmoire-readable-list__dye-swatch {
  display: inline-block;
  width: 13px;
  height: 13px;
  flex: 0 0 13px;
  border: 1px solid var(--ns-color-border-strong);
  box-shadow: var(--ns-control-inset-shadow);
}

.nsarmoire-readable-list__related {
  grid-column: 3;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 5px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-readable-list__related li {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  width: clamp(164px, 18vw, 228px);
  min-height: 48px;
  min-width: 0;
  padding: 4px 6px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
  contain: layout paint style;
  cursor: context-menu;
  -webkit-touch-callout: none;
}

.nsarmoire-readable-list__related-item--unstored {
  color: var(--ns-color-text-muted);
}

.nsarmoire-readable-list__related-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-pixel-surface);
}

.nsarmoire-readable-list__related-icon img {
  display: block;
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.nsarmoire-readable-list__related-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.nsarmoire-readable-list__related-text > span {
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

.nsarmoire-readable-list__related-text small {
  width: fit-content;
  max-width: 100%;
  padding: 1px 4px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-color-text-muted);
  font-size: 10px;
  font-weight: 850;
  line-height: 1.15;
}

.nsarmoire-readable-list__related-item--stored .nsarmoire-readable-list__related-text small {
  border-color: var(--ns-color-success);
  color: var(--ns-color-success);
}

.nsarmoire-readable-list__related-item--unstored .nsarmoire-readable-list__related-icon {
  opacity: 0.58;
}

.nsarmoire-readable-list__related-more {
  align-content: center;
  justify-content: center;
  width: auto;
  min-height: 48px;
}

.nsarmoire-readable-list__related-more-count {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
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

  .nsarmoire-readable-list__item--detailed {
    grid-column: 1 / -1;
  }

  .nsarmoire-readable-list__item--related {
    grid-template-columns: 44px minmax(0, 1fr);
    min-height: 0;
  }

  .nsarmoire-readable-list__related {
    grid-column: 1 / -1;
    margin-top: 2px;
  }
}

</style>
