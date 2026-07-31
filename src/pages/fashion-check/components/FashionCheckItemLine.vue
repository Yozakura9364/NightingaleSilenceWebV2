<template>
  <div
    class="fashion-check-item-line"
    :class="{
      'fashion-check-item-line--has-slot': slotLabel,
      'fashion-check-item-line--has-secondary': secondaryText,
      'fashion-check-item-line--stacked-slot': stackedSlot,
      'fashion-check-item-line--actionable': item
    }"
    @contextmenu="openItemMenu"
    @pointerdown="startItemLongPress"
    @pointermove="moveItemLongPress"
    @pointerup="cancelItemLongPress"
    @pointercancel="cancelItemLongPress"
  >
    <div class="fashion-check-item-line__icon" aria-hidden="true">
      <img
        v-if="iconUrl && !imageFailed"
        :src="iconUrl"
        alt=""
        loading="lazy"
        @error="imageFailed = true"
      />
    </div>
    <b v-if="slotLabel" class="fashion-check-item-line__slot">{{ slotLabel }}</b>
    <span :class="item ? `fashion-check-item-line__name--rarity-${item.rarity}` : undefined">{{
      displayName ?? item?.name ?? label
    }}</span>
    <small v-if="points !== undefined">+{{ points }}</small>
    <small v-if="secondaryText" class="fashion-check-item-line__secondary">
      <span
        v-if="secondaryColor"
        class="fashion-check-item-line__swatch"
        :style="{ backgroundColor: secondaryColor }"
        aria-hidden="true"
      />
      <span>{{ secondaryText }}</span>
    </small>
    <FfxivItemReferenceMenu
      :position="itemActionMenu"
      :item-id="item?.itemId ?? 0"
      :huiji-name="item?.name ?? ''"
      :lodestone-name="item?.name ?? ''"
      :ko-name="koItemName"
      :labels="referenceLabels"
      @close="closeItemMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FfxivItemReferenceMenu from '@/components/FfxivItemReferenceMenu.vue'
import { getFfxivItemIconUrl } from '@/lib/ffxiv/itemIcon'
import type { FashionCheckItem, FashionCheckLocaleCatalog } from '@/lib/fashion-check/types'
import { fashionCheckTextKeys as keys } from '@/locales/keys/fashionCheck'
import { useLocale } from '@/stores/locale'

const LONG_PRESS_MS = 650
const LONG_PRESS_MOVE_TOLERANCE = 12
const ITEM_MENU_OPEN_EVENT = 'fashion-check-item-menu-open'

interface LongPressState {
  pointerId: number
  startX: number
  startY: number
  timer: number
}

const props = defineProps<{
  item?: FashionCheckItem
  displayName?: string
  iconId?: number
  slotLabel?: string
  label?: string
  points?: number
  secondaryText?: string
  secondaryColor?: string
  stackedSlot?: boolean
  localeCatalog?: FashionCheckLocaleCatalog
}>()

const resolvedIconId = computed(() => props.item?.iconId ?? props.iconId)
const iconUrl = computed(() => getFfxivItemIconUrl(resolvedIconId.value))
const imageFailed = ref(false)
const itemActionMenu = ref<{ x: number; y: number } | null>(null)
let longPressState: LongPressState | null = null
const { t } = useLocale()
const koItemName = computed(() => {
  const itemId = props.item?.itemId
  return itemId ? props.localeCatalog?.items[String(itemId)]?.ko || '' : ''
})
const referenceLabels = computed(() => ({
  huijiWiki: t(keys.referenceHuijiWiki),
  lodestone: t(keys.referenceLodestone),
  garlandData: t(keys.referenceGarlandData),
  krGuide: t(keys.referenceKrGuide)
}))

watch(resolvedIconId, () => {
  imageFailed.value = false
})

function closeItemMenu() {
  itemActionMenu.value = null
}

function cancelItemLongPress() {
  if (!longPressState) return

  window.clearTimeout(longPressState.timer)
  longPressState = null
}

function openItemMenu(event: MouseEvent | PointerEvent) {
  if (!props.item) return

  event.preventDefault()
  cancelItemLongPress()
  window.dispatchEvent(new Event(ITEM_MENU_OPEN_EVENT))
  itemActionMenu.value = { x: event.clientX, y: event.clientY }
}

function startItemLongPress(event: PointerEvent) {
  if (!props.item || event.pointerType === 'mouse') return

  cancelItemLongPress()
  longPressState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    timer: window.setTimeout(() => {
      if (longPressState?.pointerId === event.pointerId) {
        openItemMenu(event)
      }
    }, LONG_PRESS_MS)
  }
}

function moveItemLongPress(event: PointerEvent) {
  if (!longPressState || longPressState.pointerId !== event.pointerId) return

  const distance = Math.hypot(
    event.clientX - longPressState.startX,
    event.clientY - longPressState.startY
  )
  if (distance > LONG_PRESS_MOVE_TOLERANCE) cancelItemLongPress()
}

function closeItemMenuByKeyboard(event: KeyboardEvent) {
  if (event.key === 'Escape') closeItemMenu()
}

onMounted(() => {
  window.addEventListener(ITEM_MENU_OPEN_EVENT, closeItemMenu)
  window.addEventListener('click', closeItemMenu)
  window.addEventListener('scroll', closeItemMenu, true)
  window.addEventListener('keydown', closeItemMenuByKeyboard)
})

onBeforeUnmount(() => {
  cancelItemLongPress()
  window.removeEventListener(ITEM_MENU_OPEN_EVENT, closeItemMenu)
  window.removeEventListener('click', closeItemMenu)
  window.removeEventListener('scroll', closeItemMenu, true)
  window.removeEventListener('keydown', closeItemMenuByKeyboard)
})
</script>

<style scoped>
.fashion-check-item-line {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.fashion-check-item-line--actionable {
  cursor: context-menu;
}

.fashion-check-item-line--has-slot {
  grid-template-columns: 34px auto minmax(0, 1fr) auto;
}

.fashion-check-item-line--has-secondary {
  grid-template-rows: auto auto;
}

.fashion-check-item-line--has-secondary .fashion-check-item-line__icon {
  grid-row: 1 / span 2;
  align-self: center;
}

.fashion-check-item-line__secondary {
  display: flex;
  grid-column: 2 / -1;
  gap: 8px;
  align-items: center;
}

.fashion-check-item-line__swatch {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border: 1px solid var(--ns-pixel-border);
}

.fashion-check-item-line--stacked-slot {
  grid-template-columns: 34px minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  row-gap: 5px;
}

.fashion-check-item-line--stacked-slot .fashion-check-item-line__slot {
  grid-column: 1 / -1;
  grid-row: 1;
  font-size: 12px;
}

.fashion-check-item-line--stacked-slot .fashion-check-item-line__icon {
  grid-column: 1;
  grid-row: 2;
}

.fashion-check-item-line--stacked-slot > span:not(.fashion-check-item-line__swatch) {
  grid-column: 2;
  grid-row: 2;
}

.fashion-check-item-line--stacked-slot.fashion-check-item-line--has-secondary {
  grid-template-rows: auto auto auto;
}

.fashion-check-item-line--stacked-slot.fashion-check-item-line--has-secondary
  .fashion-check-item-line__icon {
  grid-row: 2 / span 2;
}

.fashion-check-item-line--stacked-slot .fashion-check-item-line__secondary {
  grid-column: 2 / -1;
  grid-row: 3;
}

.fashion-check-item-line > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.fashion-check-item-line__slot {
  white-space: nowrap;
}

.fashion-check-item-line__icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--ns-pixel-border);
  background: var(--ns-color-bg-soft);
  overflow: hidden;
}

.fashion-check-item-line__icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.fashion-check-item-line__name--rarity-1 {
  color: var(--ns-color-text);
}
.fashion-check-item-line__name--rarity-2 {
  color: #58a85f;
}
.fashion-check-item-line__name--rarity-3 {
  color: #4c8fd4;
}
.fashion-check-item-line__name--rarity-4 {
  color: #b06cd5;
}
.fashion-check-item-line__name--rarity-5 {
  color: #d89948;
}

.fashion-check-item-line small {
  color: var(--ns-color-text-muted);
}
</style>
