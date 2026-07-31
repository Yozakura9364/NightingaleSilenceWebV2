<template>
  <section class="nsglamour-snapshot">
    <header class="nsglamour-snapshot__header">
      <h2 class="ns-heading-bloom">{{ t(textKeys.nsglamourEquipmentPanel) }}</h2>
      <div class="nsglamour-snapshot__toolbar">
        <button
          type="button"
          class="nsglamour-snapshot__tool-button"
          :class="{ active: layoutMode === 'spacious' }"
          :aria-label="layoutToggleLabel"
          :title="layoutToggleLabel"
          :aria-pressed="layoutMode === 'spacious'"
          @click="toggleLayout"
        >
          <span
            class="nsglamour-snapshot__layout-icon"
            :class="{ 'is-spacious': layoutMode === 'spacious' }"
            aria-hidden="true"
          ></span>
        </button>

        <div ref="languageControl" class="nsglamour-snapshot__language-control">
          <button
            type="button"
            class="nsglamour-snapshot__tool-button"
            :aria-label="languageButtonLabel"
            :title="languageButtonLabel"
            aria-haspopup="menu"
            :aria-expanded="languageMenuOpen"
            @click.stop="languageMenuOpen = !languageMenuOpen"
          >
            <img :src="languagesIcon" alt="" aria-hidden="true" />
          </button>
          <div
            v-if="languageMenuOpen"
            class="nsglamour-snapshot__language-menu"
            role="menu"
            :aria-label="t(textKeys.nsglamourEquipmentLanguage)"
          >
            <button
              v-for="option in localeOptions"
              :key="option.locale"
              type="button"
              role="menuitemradio"
              :class="{ active: option.locale === activeLocale }"
              :aria-checked="option.locale === activeLocale"
              @click="selectLocale(option.locale)"
            >
              {{ option.accessibleLabel }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="nsglamour-snapshot__tool-button"
          :aria-label="themeToggleLabel"
          :title="themeToggleLabel"
          @click="toggleTheme"
        >
          <img :src="themeMode === 'night' ? sunIcon : moonIcon" alt="" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div
      class="nsglamour-snapshot__grid"
      :class="{ 'is-single-column': entryColumns.length === 1 }"
    >
      <div v-for="(column, columnIndex) in entryColumns" :key="columnIndex">
        <article
          v-for="entry in column"
          :key="entry.slot"
          class="nsglamour-snapshot__item"
          :class="{
            'nsglamour-snapshot__item--actionable': entry.itemId > 0,
            'nsglamour-snapshot__item--empty': !entry.itemName
          }"
          @contextmenu="openItemMenu($event, entry)"
          @pointerdown="startItemLongPress($event, entry)"
          @pointermove="moveItemLongPress"
          @pointerup="cancelItemLongPress"
          @pointercancel="cancelItemLongPress"
        >
          <img
            v-if="entry.iconUrl"
            class="nsglamour-snapshot__icon"
            :src="entry.iconUrl"
            :alt="entry.itemName"
            loading="lazy"
          />
          <div class="nsglamour-snapshot__body">
            <h3>{{ entry.slotName }}</h3>
            <strong v-if="entry.itemName">{{ entry.itemName }}</strong>
            <div v-if="entry.dyes.length" class="nsglamour-snapshot__dyes">
              <span
                v-for="(dye, index) in entry.dyes"
                :key="`${entry.slot}-${index}`"
                class="nsglamour-snapshot__dye"
              >
                <i :style="{ backgroundColor: dye.hex }" aria-hidden="true"></i>
                {{ dye.name }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>

    <FfxivItemReferenceMenu
      :position="itemActionMenu?.position ?? null"
      :item-id="itemActionMenu?.itemId ?? 0"
      :huiji-name="itemActionMenu?.huijiName ?? ''"
      :lodestone-name="itemActionMenu?.lodestoneName ?? ''"
      :ko-name="itemActionMenu?.koName ?? ''"
      :labels="referenceLabels"
      @close="closeItemMenu"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import languagesIcon from '@/assets/icons/pixelarticons/languages.svg'
import moonIcon from '@/assets/icons/moon.svg'
import sunIcon from '@/assets/icons/sun-alt.svg'
import FfxivItemReferenceMenu from '@/components/FfxivItemReferenceMenu.vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import {
  buildGlamourIconUrl,
  getDefaultSlotNames,
  normalizeGlamourLocale,
  resolveLocalized
} from '@/lib/glamour/equipment'
import type { GlamourLocale, GlamourSnapshot } from '@/lib/glamour/types'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'

const LOCALE_ORDER = ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko']
const SLOT_ORDER = [
  'MainHand',
  'OffHand',
  'HeadGear',
  'Body',
  'Hands',
  'Legs',
  'Feet',
  'Ears',
  'Neck',
  'Wrists',
  'LeftRing',
  'RightRing',
  'Glasses',
  'FashionAccessory'
] as const
const LAYOUT_STORAGE_KEY = 'nsglamour.snapshotLayout'
const LONG_PRESS_MS = 650
const LONG_PRESS_MOVE_TOLERANCE = 12
const ITEM_MENU_OPEN_EVENT = 'ffxiv-item-reference-menu-open'
const localeLabelKeys: Record<string, string> = {
  zh: textKeys.nsglamourLocaleZh,
  en: textKeys.nsglamourLocaleEn,
  ja: textKeys.nsglamourLocaleJa,
  ko: textKeys.nsglamourLocaleKo,
  tc: textKeys.nsglamourLocaleTc,
  fr: textKeys.nsglamourLocaleFr,
  de: textKeys.nsglamourLocaleDe
}

interface SnapshotDisplayEntry {
  slot: string
  slotName: string
  itemName: string
  itemId: number
  huijiName: string
  lodestoneName: string
  koName: string
  iconUrl: string
  dyes: Array<{ hex: string; name: string }>
}

interface SnapshotMenuTarget {
  position: { x: number; y: number }
  itemId: number
  huijiName: string
  lodestoneName: string
  koName: string
}

interface LongPressState {
  pointerId: number
  startX: number
  startY: number
  timer: number
}

const props = defineProps<{
  snapshot: GlamourSnapshot
  apiBase: string
}>()

const { current, t } = useLocale()
const { current: themeMode, setThemeMode } = useTheme()
const route = useRoute()
const router = useRouter()
const activeLocale = ref<GlamourLocale>(pickInitialLocale())
const layoutMode = ref<'compact' | 'spacious'>(readLayoutMode())
const languageMenuOpen = ref(false)
const languageControl = ref<HTMLElement | null>(null)
const itemActionMenu = ref<SnapshotMenuTarget | null>(null)
let longPressState: LongPressState | null = null

const referenceLabels = computed(() => ({
  huijiWiki: t(textKeys.nsglamourReferenceHuijiWiki),
  lodestone: t(textKeys.nsglamourReferenceLodestone),
  garlandData: t(textKeys.nsglamourReferenceGarlandData),
  krGuide: t(textKeys.nsglamourReferenceKrGuide)
}))

const localeOptions = computed(() =>
  [...props.snapshot.locales]
    .sort((left, right) => LOCALE_ORDER.indexOf(left) - LOCALE_ORDER.indexOf(right))
    .map((locale) => ({
      locale,
      accessibleLabel: t(localeLabelKeys[locale] || '') || locale
    }))
)

const languageButtonLabel = computed(() => {
  const currentOption = localeOptions.value.find((option) => option.locale === activeLocale.value)
  return `${t(textKeys.nsglamourEquipmentLanguage)}: ${currentOption?.accessibleLabel || activeLocale.value}`
})
const layoutToggleLabel = computed(() =>
  t(
    layoutMode.value === 'spacious'
      ? textKeys.nsglamourSnapshotLayoutCompact
      : textKeys.nsglamourSnapshotLayoutSpacious
  )
)
const themeToggleLabel = computed(() =>
  t(themeMode.value === 'night' ? textKeys.day : textKeys.night)
)

const entries = computed<SnapshotDisplayEntry[]>(() => {
  const entriesBySlot = new Map(props.snapshot.entries.map((entry) => [entry.slot, entry]))
  const orderedSlots =
    layoutMode.value === 'spacious'
      ? [...SLOT_ORDER]
      : [...props.snapshot.entries]
          .sort((left, right) => slotRank(left.slot) - slotRank(right.slot))
          .map((entry) => entry.slot)

  return orderedSlots.map((slot) => {
    const entry = entriesBySlot.get(slot)
    if (!entry) {
      return {
        slot,
        slotName:
          resolveLocalized(props.snapshot.slot_names[slot], activeLocale.value) ||
          resolveLocalized(getDefaultSlotNames(slot), activeLocale.value) ||
          slot,
        itemName: '',
        itemId: 0,
        huijiName: '',
        lodestoneName: '',
        koName: '',
        iconUrl: '',
        dyes: []
      }
    }

    const itemName = resolveLocalized(entry.item.names, activeLocale.value) || entry.item.name
    return {
      slot: entry.slot,
      slotName:
        resolveLocalized(entry.slot_names, activeLocale.value) ||
        resolveLocalized(props.snapshot.slot_names[entry.slot], activeLocale.value) ||
        entry.slot,
      itemName,
      itemId: parseSnapshotItemId(entry.item.key),
      huijiName: entry.item.names.zh || itemName,
      lodestoneName: entry.item.names.ja || entry.item.names.en || itemName,
      koName: entry.item.names.ko || itemName,
      iconUrl: buildGlamourIconUrl(props.apiBase, entry.item.icon),
      dyes: entry.item.dyes.map((dye) => ({
        hex: dye.hex === 'transparent' ? 'transparent' : dye.hex,
        name:
          resolveLocalized(dye.names, activeLocale.value) ||
          (dye.isEmpty
            ? resolveLocalized(props.snapshot.no_dye_labels, activeLocale.value)
            : dye.name)
      }))
    }
  })
})

const entryColumns = computed<SnapshotDisplayEntry[][]>(() => {
  if (entries.value.length <= 5) return [entries.value]

  const splitAt = Math.ceil(entries.value.length / 2)
  return [entries.value.slice(0, splitAt), entries.value.slice(splitAt)]
})

watch(
  () => props.snapshot,
  () => {
    closeItemMenu()
    activeLocale.value = pickInitialLocale()
  }
)

function parseSnapshotItemId(value: string): number {
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) return 0

  const itemId = Number.parseInt(normalized, 10)
  return Number.isSafeInteger(itemId) && itemId > 0 ? itemId : 0
}

function slotRank(slot: string): number {
  const rank = SLOT_ORDER.indexOf(slot as (typeof SLOT_ORDER)[number])
  return rank < 0 ? SLOT_ORDER.length : rank
}

function readLayoutMode(): 'compact' | 'spacious' {
  try {
    return localStorage.getItem(LAYOUT_STORAGE_KEY) === 'spacious' ? 'spacious' : 'compact'
  } catch {
    return 'compact'
  }
}

function toggleLayout(): void {
  layoutMode.value = layoutMode.value === 'compact' ? 'spacious' : 'compact'
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, layoutMode.value)
  } catch {
    // The viewer still works when browser storage is unavailable.
  }
}

function selectLocale(locale: GlamourLocale): void {
  activeLocale.value = locale
  languageMenuOpen.value = false
  const urlLocale = locale === 'zh' ? 'zh-CN' : locale === 'tc' ? 'zh-TW' : locale
  void router.replace({ query: { ...route.query, lang: urlLocale } })
}

function toggleTheme(): void {
  languageMenuOpen.value = false
  setThemeMode(themeMode.value === 'night' ? 'day' : 'night')
}

function closeItemMenu(): void {
  itemActionMenu.value = null
}

function cancelItemLongPress(): void {
  if (!longPressState) return

  window.clearTimeout(longPressState.timer)
  longPressState = null
}

function openItemMenu(event: MouseEvent | PointerEvent, entry: SnapshotDisplayEntry): void {
  if (entry.itemId <= 0) return

  event.preventDefault()
  cancelItemLongPress()
  window.dispatchEvent(new Event(ITEM_MENU_OPEN_EVENT))
  itemActionMenu.value = {
    position: { x: event.clientX, y: event.clientY },
    itemId: entry.itemId,
    huijiName: entry.huijiName,
    lodestoneName: entry.lodestoneName,
    koName: entry.koName
  }
}

function startItemLongPress(event: PointerEvent, entry: SnapshotDisplayEntry): void {
  if (entry.itemId <= 0 || event.pointerType === 'mouse') return

  cancelItemLongPress()
  longPressState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    timer: window.setTimeout(() => {
      if (longPressState?.pointerId === event.pointerId) {
        openItemMenu(event, entry)
      }
    }, LONG_PRESS_MS)
  }
}

function moveItemLongPress(event: PointerEvent): void {
  if (!longPressState || longPressState.pointerId !== event.pointerId) return

  const distance = Math.hypot(
    event.clientX - longPressState.startX,
    event.clientY - longPressState.startY
  )
  if (distance > LONG_PRESS_MOVE_TOLERANCE) cancelItemLongPress()
}

function closeItemMenuByKeyboard(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  closeItemMenu()
  languageMenuOpen.value = false
}

function closeLanguageMenu(event: MouseEvent): void {
  if (!languageControl.value?.contains(event.target as Node)) {
    languageMenuOpen.value = false
  }
}

function pickInitialLocale(): GlamourLocale {
  const preferredLocale = normalizeGlamourLocale(
    (typeof route.query.lang === 'string' ? route.query.lang : '') || current.value
  )
  return props.snapshot.locales.includes(preferredLocale)
    ? preferredLocale
    : props.snapshot.locales[0] || 'zh'
}

onMounted(() => {
  window.addEventListener(ITEM_MENU_OPEN_EVENT, closeItemMenu)
  window.addEventListener('click', closeItemMenu)
  window.addEventListener('scroll', closeItemMenu, true)
  window.addEventListener('keydown', closeItemMenuByKeyboard)
  window.addEventListener('click', closeLanguageMenu)
})

onBeforeUnmount(() => {
  cancelItemLongPress()
  window.removeEventListener(ITEM_MENU_OPEN_EVENT, closeItemMenu)
  window.removeEventListener('click', closeItemMenu)
  window.removeEventListener('scroll', closeItemMenu, true)
  window.removeEventListener('keydown', closeItemMenuByKeyboard)
  window.removeEventListener('click', closeLanguageMenu)
})
</script>

<style scoped>
.nsglamour-snapshot {
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid, #fff);
  color: var(--ns-color-text);
  box-shadow: 0 6px 18px rgb(20 28 45 / 6%);
}

.nsglamour-snapshot__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ns-color-border);
}

.nsglamour-snapshot__toolbar {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.nsglamour-snapshot__tool-button {
  display: inline-grid;
  width: 34px;
  height: 34px;
  padding: 6px;
  place-items: center;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface);
  color: var(--ns-color-text);
  box-shadow: var(--ns-pixel-button-shadow);
  cursor: pointer;
}

.nsglamour-snapshot__tool-button:hover,
.nsglamour-snapshot__tool-button.active {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-accent-strong);
}

.nsglamour-snapshot__tool-button img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.nsglamour-snapshot__layout-icon {
  position: relative;
  display: block;
  width: 16px;
  height: 14px;
}

.nsglamour-snapshot__layout-icon::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 1px;
  width: 14px;
  height: 2px;
  background: currentColor;
  box-shadow:
    0 3px currentColor,
    0 6px currentColor;
}

.nsglamour-snapshot__layout-icon.is-spacious::before {
  top: 1px;
  box-shadow:
    0 5px currentColor,
    0 10px currentColor;
}

.nsglamour-snapshot__language-control {
  position: relative;
}

.nsglamour-snapshot__language-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  display: grid;
  width: max-content;
  min-width: 132px;
  padding: 4px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-panel-shadow);
}

.nsglamour-snapshot__language-menu button {
  padding: 7px 10px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text);
  text-align: left;
  cursor: pointer;
}

.nsglamour-snapshot__language-menu button:hover,
.nsglamour-snapshot__language-menu button.active {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-accent-strong);
}

.nsglamour-snapshot__header h2,
.nsglamour-snapshot__body h3,
.nsglamour-snapshot__body strong {
  margin: 0;
}

.nsglamour-snapshot__header h2 {
  font-size: 16px;
}

.nsglamour-snapshot__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 28px;
}

.nsglamour-snapshot__grid.is-single-column {
  grid-template-columns: minmax(0, 1fr);
}

.nsglamour-snapshot__item {
  display: flex;
  min-height: 72px;
  min-width: 0;
  gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid var(--ns-color-border);
}

.nsglamour-snapshot__item--empty {
  cursor: default;
}

.nsglamour-snapshot__item--actionable {
  cursor: context-menu;
}

.nsglamour-snapshot__icon {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  object-fit: contain;
  image-rendering: auto;
}

.nsglamour-snapshot__body {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.nsglamour-snapshot__body h3 {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.nsglamour-snapshot__body strong {
  overflow-wrap: anywhere;
  font-size: 14px;
}

.nsglamour-snapshot__dyes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}

.nsglamour-snapshot__dye {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.nsglamour-snapshot__dye i {
  display: block;
  width: 10px;
  height: 10px;
  border: 1px solid var(--ns-color-border-strong, #777);
}

@media (max-width: 720px) {
  .nsglamour-snapshot__header {
    align-items: flex-start;
  }

  .nsglamour-snapshot__grid {
    grid-template-columns: 1fr;
  }
}
</style>
