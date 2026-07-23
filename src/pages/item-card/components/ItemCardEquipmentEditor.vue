<template>
  <section class="equipment-editor">
    <header class="equipment-editor__head">
      <h2>{{ t(textKeys.nsglamourEquipmentPanel) }}</h2>
      <div class="equipment-editor__locales" :aria-label="t(textKeys.nsglamourEquipmentLanguage)">
        <button
          v-for="locale in draft.locales"
          :key="locale"
          type="button"
          :class="{ active: locale === draft.locale }"
          @click="emit('update-locale', locale)"
        >
          {{ localeLabel(locale) }}
        </button>
      </div>
    </header>

    <div class="equipment-editor__rows">
      <ItemCardCatalogSearch
        :api-base="apiBase"
        :locale="draft.locale"
        :search-items="searchCatalogItems"
        @select="emit('add-catalog-item', $event)"
      />
      <article
        v-for="entry in draft.entries"
        :key="rowId(entry)"
        class="equipment-row"
        :class="{
          'equipment-row--duplicate': entry.cardDuplicate,
          'equipment-row--plain-item': isPlainItem(entry)
        }"
      >
        <div class="equipment-row__slot">
          {{ rowTypeTitle(entry) }}
        </div>

        <div class="equipment-row__body">
          <div v-if="selectedCandidate(entry)" class="equipment-row__selected">
            <img
              v-if="iconUrl(entry)"
              :src="iconUrl(entry)"
              :alt="candidateName(selectedCandidate(entry))"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <div class="equipment-row__item">
              <strong>{{ candidateName(selectedCandidate(entry)) }}</strong>
              <select
                v-if="(entry.candidates?.length || 0) > 1"
                :aria-label="t(textKeys.nsglamourEquipmentSwitchCandidate)"
                :value="selectedCandidate(entry)?.key"
                @change="selectCandidate(entry, $event)"
              >
                <option
                  v-for="candidate in entry.candidates"
                  :key="String(candidate.key || candidate.name)"
                  :value="candidate.key"
                >
                  {{ candidateName(candidate) }}
                </option>
              </select>
              <div v-if="dyeCount(entry) > 0" class="equipment-row__dyes">
                <div
                  v-for="(dye, dyeIndex) in displayDyes(entry)"
                  :key="dyeIndex"
                  class="dye-control"
                >
                  <button
                    type="button"
                    class="dye-control__button"
                    :style="{ '--dye-color': dyeColor(dye) }"
                    @click.stop="toggleDyePicker(entry, dyeIndex)"
                  >
                    <span aria-hidden="true" />
                    {{ dyeName(dye) }}
                  </button>
                  <div
                    v-if="activeDyeKey === dyeKey(rowId(entry), dyeIndex)"
                    class="dye-picker"
                    @click.stop
                  >
                    <input
                      v-model="dyeQuery"
                      type="search"
                      :placeholder="t(textKeys.nsglamourEquipmentDyeSearchPlaceholder)"
                    />
                    <p v-if="dyeLoading">{{ t(textKeys.nsglamourEquipmentDyeLoading) }}</p>
                    <p v-else-if="dyeError">{{ t(textKeys.nsglamourEquipmentDyeLoadError) }}</p>
                    <template v-else>
                      <div v-for="group in filteredDyeGroups" :key="group.key">
                        <b>{{ group.label }}</b>
                        <button
                          v-for="stain in group.items"
                          :key="String(stain.id)"
                          type="button"
                          :style="{ '--dye-color': String(stain.hex || 'transparent') }"
                          @click="chooseDye(entry, dyeIndex, stain)"
                        >
                          <span aria-hidden="true" />
                          {{ stainName(stain) }}
                        </button>
                      </div>
                      <p v-if="!filteredDyeGroups.length">
                        {{ t(textKeys.nsglamourEquipmentDyeSearchEmpty) }}
                      </p>
                    </template>
                  </div>
                </div>
              </div>
              <span
                v-else-if="selectedCandidate(entry) && !isPlainItem(entry)"
                class="equipment-row__undyeable"
              >
                {{ t(textKeys.nsglamourEquipmentUndyeable) }}
              </span>
            </div>
          </div>

          <div class="equipment-row__controls">
            <button
              type="button"
              class="equipment-row__remove"
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ItemCardCatalogSearch from '@/pages/item-card/components/ItemCardCatalogSearch.vue'
import {
  buildGlamourIconUrl,
  getCandidateDyeCount,
  getCandidateName,
  getDisplayDyeEntries,
  getDyeEntryName,
  getItemCardRowId,
  getSelectedCandidate,
  getSlotTitle,
  groupGlamourStains,
  stainMatchesQuery,
  isItemCardPlainItem
} from '@/pages/item-card/lib/equipment'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourDyeEntry,
  GlamourEquipmentEntry,
  ItemCardCatalogCategory,
  GlamourStain,
  GlamourStainGroup
} from '@/pages/item-card/lib/types'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { itemCardUiMessages } from '@/pages/item-card/locales/messages'
import type { Locale } from '@/locales/types'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  draft: GlamourDraft
  apiBase: string
  searchCatalogItems: (options: {
    query: string
    locale: string
    category: ItemCardCatalogCategory
    limit?: number
    signal?: AbortSignal
  }) => Promise<GlamourCandidate[]>
  loadStains: (locale: string) => Promise<GlamourStain[]>
}>()

const emit = defineEmits<{
  'update-locale': [locale: string]
  'add-catalog-item': [candidate: GlamourCandidate]
  'select-entry-candidate': [rowId: string, candidateKey: string | number | undefined]
  'clear-entry': [rowId: string]
  'set-entry-dye': [rowId: string, dyeIndex: number, stain: GlamourStain]
}>()

const { t } = useLocale()
const stains = ref<GlamourStain[]>([])
const dyeLoading = ref(false)
const dyeError = ref(false)
const activeDyeKey = ref('')
const dyeQuery = ref('')

const filteredDyeGroups = computed<GlamourStainGroup[]>(() =>
  groupGlamourStains(stains.value.filter((stain) => stainMatchesQuery(stain, dyeQuery.value)))
)

onMounted(() => document.addEventListener('click', closePickers))
onBeforeUnmount(() => document.removeEventListener('click', closePickers))

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

function selectedCandidate(entry: GlamourEquipmentEntry): GlamourCandidate | undefined {
  return getSelectedCandidate(entry)
}

function candidateName(candidate: GlamourCandidate | undefined): string {
  return getCandidateName(candidate, props.draft.locale, props.draft.source.locale)
}

function iconUrl(entry: GlamourEquipmentEntry): string {
  return buildGlamourIconUrl(props.apiBase, selectedCandidate(entry)?.icon)
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

function stainName(stain: GlamourStain): string {
  return getCandidateName({ name: stain.name, names: stain.names }, props.draft.locale)
}

function selectCandidate(entry: GlamourEquipmentEntry, event: Event) {
  emit('select-entry-candidate', rowId(entry), (event.currentTarget as HTMLSelectElement).value)
}

function dyeKey(slot: string, index: number): string {
  return `${slot}:${index}`
}

async function toggleDyePicker(entry: GlamourEquipmentEntry, index: number) {
  const key = dyeKey(rowId(entry), index)
  if (activeDyeKey.value === key) {
    activeDyeKey.value = ''
    return
  }
  activeDyeKey.value = key
  dyeQuery.value = ''
  if (stains.value.length) {
    return
  }
  dyeLoading.value = true
  dyeError.value = false
  try {
    stains.value = await props.loadStains(props.draft.locale)
  } catch {
    dyeError.value = true
  } finally {
    dyeLoading.value = false
  }
}

function chooseDye(entry: GlamourEquipmentEntry, index: number, stain: GlamourStain) {
  emit('set-entry-dye', rowId(entry), index, stain)
  activeDyeKey.value = ''
}

function closePickers() {
  activeDyeKey.value = ''
}
</script>

<style scoped>
.equipment-editor {
  display: grid;
  min-width: 0;
}

.equipment-editor__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--ns-color-border);
}

.equipment-editor__head h2 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 15px;
}

.equipment-editor__locales {
  display: inline-flex;
  max-width: 100%;
  overflow-x: auto;
}

.equipment-editor__locales button {
  min-height: 25px;
  padding: 3px 7px;
  border: 1px solid var(--ns-color-border);
  border-right: 0;
  border-radius: 0;
  background: var(--ns-color-surface);
  color: var(--ns-color-text-muted);
  font: 700 10px var(--ns-font-sans);
  white-space: nowrap;
  cursor: pointer;
}

.equipment-editor__locales button:last-child {
  border-right: 1px solid var(--ns-color-border);
}

.equipment-editor__locales button.active {
  background: var(--ns-color-accent);
  color: var(--ns-color-on-accent);
}

.equipment-editor__rows {
  display: grid;
}

.equipment-row {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  min-width: 0;
  border-bottom: 1px solid var(--ns-color-border);
}

.equipment-row__slot {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 5px;
  border-right: 1px solid var(--ns-color-border);
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

.equipment-row--duplicate .equipment-row__slot {
  box-shadow: inset 3px 0 0 var(--ns-color-accent);
}

.equipment-row--plain-item .equipment-row__slot {
  background: var(--ns-pixel-hover-surface);
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
  border-radius: 4px;
  object-fit: cover;
}

.equipment-row__item {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.equipment-row__item strong {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equipment-row__item select,
.dye-picker input {
  min-width: 0;
  height: 27px;
  padding: 3px 6px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 11px var(--ns-font-sans);
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
  border: 0;
  background: transparent;
  color: var(--ns-color-text-muted);
  font: 18px/1 var(--ns-font-sans);
  cursor: pointer;
}

.equipment-row__remove:hover {
  background: var(--ns-pixel-hover-surface);
  color: var(--ns-color-accent-strong);
}

.equipment-row__dyes {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.dye-control {
  position: relative;
}

.dye-control__button,
.dye-picker button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  padding: 3px 6px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font: 11px var(--ns-font-sans);
  cursor: pointer;
}

.dye-control__button span,
.dye-picker button span {
  width: 11px;
  height: 11px;
  flex: 0 0 auto;
  border: 1px solid rgba(15, 23, 42, 0.28);
  border-radius: 50%;
  background: var(--dye-color);
}

.equipment-row__undyeable {
  color: var(--ns-color-text-muted);
  font-size: 10px;
}

.dye-picker {
  position: absolute;
  z-index: 30;
  display: grid;
  gap: 7px;
  width: min(320px, calc(100vw - 56px));
  max-height: 300px;
  padding: 8px;
  overflow-y: auto;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bg);
  box-shadow: var(--ns-pixel-window-shadow);
}

.dye-picker > div {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.dye-picker b {
  width: 100%;
  color: var(--ns-color-text-muted);
  font-size: 10px;
}

.dye-picker p {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

</style>
