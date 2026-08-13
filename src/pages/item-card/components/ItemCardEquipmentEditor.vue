<template>
  <section class="equipment-editor">
    <header class="equipment-editor__head">
      <div class="equipment-editor__head-row">
        <h2 class="equipment-editor__title ns-heading-bloom">
          {{ t(textKeys.nsglamourEquipmentPanel) }}
        </h2>
        <div
          class="equipment-editor__locales ns-segmented-control ns-segmented-control--small"
          :aria-label="t(textKeys.nsglamourEquipmentLanguage)"
        >
          <button
            v-for="locale in draft.locales"
            :key="locale"
            type="button"
            :aria-pressed="locale === draft.locale"
            @click="emit('update-locale', locale)"
          >
            {{ localeLabel(locale) }}
          </button>
        </div>
      </div>
      <div class="equipment-editor__head-row">
        <div
          class="equipment-editor__modes ns-segmented-control ns-segmented-control--small"
          :aria-label="t(textKeys.modeLabel)"
        >
          <button
            type="button"
            :aria-pressed="mode === 'compact'"
            @click="emit('update-mode', 'compact')"
          >
            {{ t(textKeys.modeCompact) }}
          </button>
          <button
            type="button"
            :aria-pressed="mode === 'full'"
            @click="emit('update-mode', 'full')"
          >
            {{ t(textKeys.modeFull) }}
          </button>
        </div>
        <button
          type="button"
          class="equipment-editor__clear"
          :disabled="!hasEntries"
          @click="emit('clear-draft')"
        >
          {{ t(textKeys.nsglamourClearDraft) }}
        </button>
      </div>
    </header>

    <div class="equipment-editor__rows">
      <ItemCardCatalogSearch
        :api-base="apiBase"
        :locale="draft.locale"
        :search-items="searchCatalogItems"
        :search-emotes="searchEmotes"
        @select="emit('add-catalog-item', $event)"
      />
      <div v-if="hasEntries" class="equipment-editor__bulk-layout">
        <span class="equipment-editor__bulk-label">{{ t(textKeys.singlePreviews) }}</span>
        <div
          class="equipment-editor__bulk-actions ns-segmented-control ns-segmented-control--small"
        >
          <button type="button" @click="emit('set-all-layouts', 'left')">
            {{ t(textKeys.allLeft) }}
          </button>
          <button type="button" @click="emit('set-all-layouts', 'right')">
            {{ t(textKeys.allRight) }}
          </button>
        </div>
      </div>
      <article
        v-for="entry in draft.entries"
        :key="rowId(entry)"
        class="equipment-row ns-glamour-item-info"
        :class="{
          'equipment-row--duplicate': entry.cardDuplicate,
          'equipment-row--plain-item': isPlainItem(entry),
          'equipment-row--emote': isEmote(entry),
          'equipment-row--draggable': Boolean(selectedCandidate(entry)),
          'equipment-row--dragging': draggedRowId === rowId(entry),
          'equipment-row--drop-before':
            dragTarget?.rowId === rowId(entry) && dragTarget.placement === 'before',
          'equipment-row--drop-after':
            dragTarget?.rowId === rowId(entry) && dragTarget.placement === 'after'
        }"
        :draggable="Boolean(selectedCandidate(entry))"
        :title="selectedCandidate(entry) ? t(textKeys.canvasDragHint) : undefined"
        @dragstart="startEntryDrag($event, entry)"
        @dragover="onEntryDragOver($event, entry)"
        @dragleave="onEntryDragLeave($event, entry)"
        @drop="onEntryDrop($event, entry)"
        @dragend="clearEntryDrag"
      >
        <div class="equipment-row__slot ns-glamour-item-info__slot">
          {{ rowTypeTitle(entry) }}
        </div>

        <div class="equipment-row__body">
          <div
            v-if="selectedCandidate(entry)"
            class="equipment-row__selected ns-glamour-item-info__item-row"
          >
            <img
              v-if="iconUrl(entry)"
              class="ns-glamour-item-info__icon"
              :src="iconUrl(entry)"
              :alt="candidateName(selectedCandidate(entry))"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="onIconError(entry)"
            />
            <div class="equipment-row__item ns-glamour-item-info__body">
              <strong class="ns-glamour-item-info__name">{{
                candidateName(selectedCandidate(entry))
              }}</strong>
              <div class="equipment-row__details">
                <div v-if="dyeCount(entry) > 0" class="equipment-row__dyes">
                  <GlamourDyePicker
                    v-for="(dye, dyeIndex) in displayDyes(entry)"
                    :key="dyeIndex"
                    :load-stains="loadStains"
                    :locale="draft.locale"
                    :label="dyeName(dye)"
                    :color="dyeColor(dye)"
                    :search-placeholder="t(textKeys.nsglamourEquipmentDyeSearchPlaceholder)"
                    :loading-text="t(textKeys.nsglamourEquipmentDyeLoading)"
                    :error-text="t(textKeys.nsglamourEquipmentDyeLoadError)"
                    :empty-text="t(textKeys.nsglamourEquipmentDyeSearchEmpty)"
                    @select="emit('set-entry-dye', rowId(entry), dyeIndex, $event)"
                  />
                </div>
                <span
                  v-else-if="
                    !isPlainItem(entry) &&
                    !isEmote(entry) &&
                    shouldRenderItemCardDyeDetails(entry.slot)
                  "
                  class="equipment-row__undyeable"
                >
                  {{ t(textKeys.nsglamourEquipmentUndyeable) }}
                </span>
                <div
                  v-if="selectedCandidate(entry)"
                  class="equipment-row__layout ns-segmented-control ns-segmented-control--small"
                >
                  <button
                    type="button"
                    :aria-pressed="layoutFor(entry) === 'left'"
                    @click.stop="emit('set-layout', rowId(entry), 'left')"
                  >
                    {{ t(textKeys.layoutLeft) }}
                  </button>
                  <button
                    type="button"
                    :aria-pressed="layoutFor(entry) === 'right'"
                    @click.stop="emit('set-layout', rowId(entry), 'right')"
                  >
                    {{ t(textKeys.layoutRight) }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="equipment-row__controls">
            <button
              type="button"
              class="equipment-row__remove ns-glamour-item-info__delete"
              :title="t(textKeys.nsglamourEquipmentRemoveRow)"
              :aria-label="t(textKeys.nsglamourEquipmentRemoveRow)"
              @click="emit('clear-entry', rowId(entry))"
            >
              {{ t(textKeys.nsglamourEquipmentDeleteSymbol) }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import ItemCardCatalogSearch from '@/pages/item-card/components/ItemCardCatalogSearch.vue'
import GlamourDyePicker from '@/components/glamour/GlamourDyePicker.vue'
import {
  buildGlamourIconUrl,
  getCandidateDyeCount,
  getCandidateName,
  getDisplayDyeEntries,
  getDyeEntryName,
  getItemCardRowId,
  shouldRenderItemCardDyeDetails,
  getSelectedCandidate,
  getSlotTitle,
  isItemCardEmote,
  isItemCardPlainItem
} from '@/pages/item-card/lib/equipment'
import { getFfxivItemIconHr1Url } from '@/lib/ffxiv/itemIcon'
import {
  ITEM_CARD_CANVAS_DRAG_MIME,
  encodeItemCardCanvasDragSource
} from '@/pages/item-card/lib/canvasDrag'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourDyeEntry,
  GlamourEquipmentEntry,
  ItemCardCatalogCategory,
  ItemCardLayout,
  ItemCardMode,
  GlamourStain
} from '@/pages/item-card/lib/types'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { itemCardUiMessages } from '@/pages/item-card/locales/messages'
import type { Locale } from '@/locales/types'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  draft: GlamourDraft
  hasEntries: boolean
  mode: ItemCardMode
  apiBase: string
  searchCatalogItems: (options: {
    query: string
    locale: string
    category: ItemCardCatalogCategory
    limit?: number
    signal?: AbortSignal
  }) => Promise<GlamourCandidate[]>
  searchEmotes: (options: {
    query: string
    locale: string
    limit?: number
    signal?: AbortSignal
  }) => Promise<GlamourCandidate[]>
  loadStains: (locale: string) => Promise<GlamourStain[]>
  layouts: Record<string, ItemCardLayout>
}>()

const emit = defineEmits<{
  'update-locale': [locale: string]
  'add-catalog-item': [candidate: GlamourCandidate]
  'clear-entry': [rowId: string]
  'move-entry': [sourceRowId: string, targetRowId: string, placement: 'before' | 'after']
  'set-entry-dye': [rowId: string, dyeIndex: number, stain: GlamourStain]
  'set-layout': [rowId: string, layout: ItemCardLayout]
  'set-all-layouts': [layout: ItemCardLayout]
  'clear-draft': []
  'update-mode': [mode: ItemCardMode]
}>()

const { t } = useLocale()
const ITEM_CARD_ROW_DRAG_MIME = 'application/x-ns-item-card-row'
const draggedRowId = ref('')
const dragTarget = ref<{ rowId: string; placement: 'before' | 'after' } | null>(null)

function localeLabel(locale: string): string {
  return (
    {
      zh: 'CHS',
      fr: 'FR',
      de: 'DE',
      ja: 'JP',
      en: 'EN',
      tc: 'TC',
      ko: 'KO'
    }[locale] || locale.toUpperCase()
  )
}

function rowId(entry: GlamourEquipmentEntry): string {
  return getItemCardRowId(entry)
}

function slotTitle(entry: GlamourEquipmentEntry): string {
  return getSlotTitle(entry, props.draft.locale, {
    slot_names: props.draft.slotNames,
    default_locale: props.draft.source.locale
  })
}

function rowTypeTitle(entry: GlamourEquipmentEntry): string {
  if (isEmote(entry)) {
    const message = itemCardUiMessages[textKeys.catalogCategoryEmote]
    return message?.[itemCardUiLocale(props.draft.locale)] ?? message?.['zh-CN'] ?? ''
  }
  if (!isPlainItem(entry)) {
    return slotTitle(entry)
  }

  const message = itemCardUiMessages[textKeys.catalogItemType]
  return message?.[itemCardUiLocale(props.draft.locale)] ?? message?.['zh-CN'] ?? ''
}

function itemCardUiLocale(locale: string): Locale {
  if (locale === 'zh' || locale === 'tc') {
    return 'zh-CN'
  }
  return ['en', 'ja', 'ko', 'fr', 'de'].includes(locale) ? (locale as Locale) : 'en'
}

function isPlainItem(entry: GlamourEquipmentEntry): boolean {
  return isItemCardPlainItem(entry)
}

function isEmote(entry: GlamourEquipmentEntry): boolean {
  return isItemCardEmote(entry)
}

function layoutFor(entry: GlamourEquipmentEntry): ItemCardLayout {
  return props.layouts[rowId(entry)] === 'right' ? 'right' : 'left'
}

function selectedCandidate(entry: GlamourEquipmentEntry): GlamourCandidate | undefined {
  return getSelectedCandidate(entry)
}

function candidateName(candidate: GlamourCandidate | undefined): string {
  return getCandidateName(candidate, props.draft.locale, props.draft.source.locale)
}

const forceRerender = ref(0)
function iconUrl(entry: GlamourEquipmentEntry): string {
  void forceRerender.value
  const candidate = selectedCandidate(entry)
  const key = `${entry.slot}-${candidate?.icon ?? ''}`
  if (iconFallbacked.get(key)) {
    const numericId = Number(candidate?.icon)
    if (Number.isFinite(numericId) && numericId > 0) {
      return getFfxivItemIconHr1Url(numericId)
    }
  }
  return buildGlamourIconUrl(props.apiBase, candidate?.icon)
}

// hd 失败 -> hr1 兜底 (Vue 响应式, 按 entry key 记录)
const iconFallbacked = reactive(new Map<string, boolean>())
function onIconError(entry: GlamourEquipmentEntry) {
  const candidate = selectedCandidate(entry)
  const key = `${entry.slot}-${candidate?.icon ?? ''}`
  if (iconFallbacked.get(key)) return
  const numericId = Number(candidate?.icon)
  if (!Number.isFinite(numericId) || numericId <= 0) return
  const fallbackUrl = getFfxivItemIconHr1Url(numericId)
  if (!fallbackUrl) return
  iconFallbacked.set(key, true)
  forceRerender.value++
}

function dyeCount(entry: GlamourEquipmentEntry): number {
  return getCandidateDyeCount(selectedCandidate(entry), entry.slot)
}

function displayDyes(entry: GlamourEquipmentEntry): GlamourDyeEntry[] {
  return getDisplayDyeEntries(
    selectedCandidate(entry),
    entry.slot,
    props.draft.noDyeLabels,
    props.draft.locale
  )
}

function dyeName(dye: GlamourDyeEntry): string {
  return getDyeEntryName(dye, props.draft.noDyeLabels, props.draft.locale)
}

function dyeColor(dye: GlamourDyeEntry): string {
  return String(dye.hex || 'transparent')
}

function startEntryDrag(event: DragEvent, entry: GlamourEquipmentEntry) {
  const candidate = selectedCandidate(entry)
  const transfer = event.dataTransfer
  if (!candidate || !transfer) {
    event.preventDefault()
    return
  }
  const sourceRowId = rowId(entry)
  draggedRowId.value = sourceRowId
  dragTarget.value = null
  transfer.effectAllowed = 'copyMove'
  transfer.setData(ITEM_CARD_ROW_DRAG_MIME, sourceRowId)
  transfer.setData(
    ITEM_CARD_CANVAS_DRAG_MIME,
    encodeItemCardCanvasDragSource({ kind: 'item', sourceId: sourceRowId })
  )
  transfer.setData('text/plain', candidateName(candidate))
}

function hasEntryDrag(event: DragEvent): boolean {
  return Boolean(draggedRowId.value && event.dataTransfer?.types.includes(ITEM_CARD_ROW_DRAG_MIME))
}

function onEntryDragOver(event: DragEvent, entry: GlamourEquipmentEntry) {
  const targetRowId = rowId(entry)
  if (!hasEntryDrag(event) || targetRowId === draggedRowId.value) {
    return
  }

  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dragTarget.value = {
    rowId: targetRowId,
    placement: event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
  }
}

function onEntryDragLeave(event: DragEvent, entry: GlamourEquipmentEntry) {
  const row = event.currentTarget as HTMLElement
  if (event.relatedTarget instanceof Node && row.contains(event.relatedTarget)) {
    return
  }
  if (dragTarget.value?.rowId === rowId(entry)) {
    dragTarget.value = null
  }
}

function onEntryDrop(event: DragEvent, entry: GlamourEquipmentEntry) {
  if (!hasEntryDrag(event)) {
    return
  }

  event.preventDefault()
  const sourceRowId = event.dataTransfer?.getData(ITEM_CARD_ROW_DRAG_MIME) || draggedRowId.value
  const target = dragTarget.value
  if (sourceRowId && target && target.rowId === rowId(entry)) {
    emit('move-entry', sourceRowId, target.rowId, target.placement)
  }
  clearEntryDrag()
}

function clearEntryDrag() {
  draggedRowId.value = ''
  dragTarget.value = null
}
</script>

<style scoped>
.equipment-editor {
  display: grid;
  min-width: 0;
}

.equipment-editor__head {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: var(--ns-line-width) solid var(--ns-color-border);
}

.equipment-editor__head-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.equipment-editor__title {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
}

.equipment-editor__locales {
  flex: 0 1 auto;
}

.equipment-editor__modes {
  flex: 0 0 auto;
}

.equipment-editor__clear {
  min-height: 25px;
  padding: 3px 7px;
  border: var(--ns-line-width) solid transparent;
  border-radius: var(--ns-radius-sm);
  background: transparent;
  color: var(--ns-color-text-muted);
  font: 700 10px/1 var(--ns-font-ui);
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color var(--ns-transition-fast),
    color var(--ns-transition-fast);
}

.equipment-editor__clear:hover:not(:disabled),
.equipment-editor__clear:focus-visible {
  border-color: var(--ns-color-danger, #b4453c);
  color: var(--ns-color-danger, #b4453c);
  outline: 0;
}

.equipment-editor__clear:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.equipment-editor__bulk-layout {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: var(--ns-line-width) solid var(--ns-color-border);
}

.equipment-editor__bulk-label {
  color: var(--ns-color-text-muted);
  font: 700 12px/1.3 var(--ns-font-ui);
}

.equipment-editor__bulk-actions {
  flex: 0 0 auto;
}

.equipment-editor__rows {
  display: grid;
}

.equipment-row {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  min-width: 0;
  border-bottom: var(--ns-line-width) solid var(--ns-color-border);
}

.equipment-row--draggable {
  cursor: grab;
}

.equipment-row--draggable:active {
  cursor: grabbing;
}

.equipment-row--dragging {
  opacity: 0.48;
}

.equipment-row--drop-before {
  box-shadow: inset 0 3px 0 var(--ns-color-accent);
}

.equipment-row--drop-after {
  box-shadow: inset 0 -3px 0 var(--ns-color-accent);
}

.equipment-row__slot {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 5px;
  border-right: var(--ns-line-width) solid var(--ns-color-border);
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 800;
  text-align: center;
}

.equipment-row__body {
  position: relative;
  display: grid;
  gap: 7px;
  min-width: 0;
  padding: 8px 36px 8px 8px;
}

.equipment-row--plain-item .equipment-row__slot {
  background: var(--ns-color-surface-tint);
  color: var(--ns-color-text);
}

.equipment-row__selected {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  min-width: 0;
}

.equipment-row__selected > img {
  width: 42px;
  height: 42px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  object-fit: cover;
}

.equipment-row__item {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.equipment-row__item strong {
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equipment-row__item select,
.dye-picker input {
  min-width: 0;
  height: 27px;
  padding: 3px 6px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 11px var(--ns-font-ui);
}

.equipment-row__details {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin-top: 4px;
}

.equipment-row__controls {
  position: absolute;
  top: 7px;
  right: 6px;
  display: flex;
  gap: 2px;
}

.equipment-row__remove {
  display: grid;
  place-items: center;
  width: 24px;
  min-width: 24px;
  height: 24px;
  min-height: 24px;
  padding: 0;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: transparent;
  color: var(--ns-color-text-muted);
  font: 700 16px/1 var(--ns-font-ui);
  cursor: pointer;
}

.equipment-row__remove:hover {
  border-color: var(--ns-color-accent);
  background: var(--ns-color-surface-tint);
  color: var(--ns-color-accent);
}

.equipment-row__dyes {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 5px;
}

.equipment-row__layout {
  display: inline-flex;
  gap: 0;
  margin-left: 0;
  align-self: center;
}

.dye-control {
  position: relative;
  flex: 0 0 auto;
}

.dye-control__button,
.dye-picker button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  padding: 3px 6px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font: 11px var(--ns-font-ui);
  cursor: pointer;
}

.dye-picker button {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 5px 0 6px;
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  text-align: left;
}

.dye-picker button:hover,
.dye-picker button:focus {
  border-bottom-color: var(--ns-color-accent-strong);
  color: var(--ns-color-accent-strong);
  outline: none;
}

.dye-control__button span,
.dye-picker button span {
  width: 11px;
  height: 11px;
  flex: 0 0 auto;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: 50%;
  background: var(--dye-color);
}

.equipment-row__undyeable {
  flex: 0 0 auto;
  color: var(--ns-color-text-muted);
  font-size: 10px;
}

.dye-picker {
  position: absolute;
  z-index: 30;
  top: calc(100% + 4px);
  left: 0;
  display: grid;
  gap: 4px;
  width: min(240px, calc(100vw - 42px));
  max-height: 240px;
  padding: 5px;
  overflow: hidden;
}

.dye-picker__results {
  display: grid;
  gap: 2px;
  max-height: 190px;
  overflow-y: auto;
}

.dye-picker__group {
  display: grid;
  gap: 2px;
}

.dye-picker__group-title {
  padding: 6px 7px 3px;
  color: var(--ns-color-text-muted);
  font-size: 10px;
  font-weight: 800;
}

.dye-picker p {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

@media (max-width: 760px) {
  .dye-picker {
    position: fixed;
    right: 28px;
    left: 28px;
    width: auto;
  }
}
</style>
