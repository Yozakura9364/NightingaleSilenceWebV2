<template>
  <div class="nsglamour-template__editor">
    <article v-for="row in rows" :key="row.slot" class="nsglamour-template__row">
      <h3>{{ row.slotName }}</h3>
      <div
        class="nsglamour-template__item"
        :class="{ 'nsglamour-template__item--search': !row.itemName }"
      >
        <template v-if="row.itemName">
          <img
            v-if="row.iconUrl"
            class="nsglamour-template__item-icon"
            :src="row.iconUrl"
            :alt="row.itemName"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <div class="nsglamour-template__item-body">
            <strong>{{ row.itemName }}</strong>
            <div v-if="row.dyeEntries.length" class="nsglamour-template__dye-controls">
              <div
                v-for="(dye, dyeIndex) in row.dyeEntries"
                :key="`${row.slot}-${dyeIndex}`"
                class="nsglamour-template__dye-select"
              >
                <button
                  type="button"
                  class="nsglamour-template__dye-chip"
                  :class="{ 'empty-dye': isNoDye(dye) }"
                  :style="{ '--nsglamour-dye-color': getDyeColor(dye) }"
                  :title="getDyeTitle(dyeIndex, row.dyeEntries.length)"
                  :aria-label="getDyeTitle(dyeIndex, row.dyeEntries.length)"
                  @click.stop="toggleDyePicker(row, dyeIndex)"
                >
                  {{ getDyeEntryLabel(dye) }}
                </button>

                <div
                  v-if="isDyePickerActive(row, dyeIndex)"
                  class="nsglamour-template__dye-panel"
                  @click.stop
                >
                  <input
                    type="search"
                    class="nsglamour-template__dye-search"
                    :value="getDyeSearchQuery(row.slot, dyeIndex)"
                    :placeholder="t(textKeys.nsglamourEquipmentDyeSearchPlaceholder)"
                    spellcheck="false"
                    autocomplete="off"
                    @input="updateDyeSearch(row.slot, dyeIndex, $event)"
                  />
                  <div class="nsglamour-template__dye-results">
                    <div
                      v-for="group in getDyeGroups(row.slot, dyeIndex)"
                      :key="group.key"
                      class="nsglamour-template__dye-group"
                    >
                      <div v-if="group.label" class="nsglamour-template__dye-group-title">
                        {{ group.label }}
                      </div>
                      <button
                        v-for="stain in group.items"
                        :key="stain.id"
                        type="button"
                        class="nsglamour-template__dye-option"
                        :style="{ '--nsglamour-dye-color': stain.hex || '#000000' }"
                        @click="selectDye(row, dyeIndex, stain)"
                      >
                        <span class="nsglamour-template__dye-swatch" aria-hidden="true"></span>
                        <span>{{ getStainName(stain) }}</span>
                      </button>
                    </div>
                    <div v-if="isDyeLoading()" class="nsglamour-template__dye-empty">
                      {{ t(textKeys.nsglamourEquipmentDyeLoading) }}
                    </div>
                    <div v-else-if="isDyeFailed()" class="nsglamour-template__dye-empty">
                      {{ t(textKeys.nsglamourEquipmentDyeLoadError) }}
                    </div>
                    <div
                      v-else-if="shouldShowDyeEmpty(row.slot, dyeIndex)"
                      class="nsglamour-template__dye-empty"
                    >
                      {{ t(textKeys.nsglamourEquipmentDyeSearchEmpty) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <small v-else-if="row.dyeStatusText">{{ row.dyeStatusText }}</small>
          </div>
          <button
            type="button"
            class="nsglamour-template__delete"
            :title="t(textKeys.nsglamourEquipmentDelete)"
            :aria-label="t(textKeys.nsglamourEquipmentDelete)"
            @click="clearEditorEntry(row)"
          >
            {{ t(textKeys.nsglamourEquipmentDeleteSymbol) }}
          </button>
        </template>

        <div v-else class="nsglamour-template__search">
          <input
            class="nsglamour-template__input"
            type="search"
            spellcheck="false"
            :placeholder="t(textKeys.nsglamourEquipmentSearchPlaceholder)"
            :value="getSearchQuery(row.slot)"
            @input="updateSearch(row, $event)"
          />
          <div v-if="shouldShowSearchPanel(row.slot)" class="nsglamour-template__search-results">
            <button
              v-for="candidate in getSearchResults(row.slot)"
              :key="getSearchResultKey(candidate)"
              type="button"
              class="nsglamour-template__search-result"
              @click="selectSearchResult(row, candidate)"
            >
              <img
                v-if="buildSearchIconUrl(candidate)"
                :src="buildSearchIconUrl(candidate)"
                :alt="getSearchCandidateName(candidate)"
                loading="lazy"
                referrerpolicy="no-referrer"
              />
              <span>{{ getSearchCandidateName(candidate) }}</span>
            </button>
            <div v-if="shouldShowSearchEmpty(row.slot)" class="nsglamour-template__search-empty">
              {{ t(textKeys.nsglamourEquipmentSearchEmpty) }}
            </div>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourLocale,
  GlamourStain
} from '@/lib/glamour/types'
import { useGlamourTemplateEquipmentEditor } from '@/pages/glamour/composables/useGlamourTemplateEquipmentEditor'
import type { GlamourTemplateEditorRow } from '@/pages/glamour/types/templateWorkspace'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  rows: GlamourTemplateEditorRow[]
  draft: GlamourDraft
  apiBase: string
  editorLocale: GlamourLocale
  searchItems: (options: {
    slot: string
    query: string
    locale: string
    limit?: number
  }) => Promise<GlamourCandidate[]>
  loadStains: (locale: string) => Promise<GlamourStain[]>
}>()

const emit = defineEmits<{
  'replace-entry': [slot: string, candidate: GlamourCandidate]
  'clear-entry': [slot: string]
  'set-entry-dye': [slot: string, dyeIndex: number, stain: GlamourStain]
}>()

const { t } = useLocale()
const {
  getSearchQuery,
  getSearchResults,
  shouldShowSearchPanel,
  shouldShowSearchEmpty,
  getSearchCandidateName,
  buildSearchIconUrl,
  getSearchResultKey,
  getDyeSearchQuery,
  updateDyeSearch,
  isDyePickerActive,
  closeDyePicker,
  toggleDyePicker,
  getDyeGroups,
  shouldShowDyeEmpty,
  isDyeLoading,
  isDyeFailed,
  getDyeEntryLabel,
  getDyeColor,
  isNoDye,
  getStainName,
  getDyeTitle,
  selectDye,
  updateSearch,
  selectSearchResult,
  clearEditorEntry
} = useGlamourTemplateEquipmentEditor({
  apiBase: computed(() => props.apiBase),
  draft: computed(() => props.draft),
  editorLocale: computed(() => props.editorLocale),
  t,
  searchItems: props.searchItems,
  loadStains: props.loadStains,
  replaceEntry: (slot, candidate) => emit('replace-entry', slot, candidate),
  clearEntry: (slot) => emit('clear-entry', slot),
  setEntryDye: (slot, dyeIndex, stain) => emit('set-entry-dye', slot, dyeIndex, stain)
})

onMounted(() => {
  document.addEventListener('click', closeDyePicker)
  window.addEventListener('nsglamour:header-popover-open', closeDyePicker)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDyePicker)
  window.removeEventListener('nsglamour:header-popover-open', closeDyePicker)
})
</script>

<style scoped>
.nsglamour-template__editor {
  display: grid;
  min-width: 0;
  border-top: 1px solid var(--ns-color-border);
}

.nsglamour-template__row {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 76px;
  padding: 24px 0 10px;
  border-bottom: 1px solid var(--ns-color-border);
}

.nsglamour-template__row h3 {
  position: absolute;
  top: 7px;
  left: 0;
  min-width: 0;
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.nsglamour-template__item {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.nsglamour-template__item--search {
  display: block;
}

.nsglamour-template__item-icon {
  display: block;
  width: 36px;
  height: 36px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  object-fit: cover;
}

.nsglamour-template__item-body {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.nsglamour-template__item-body strong,
.nsglamour-template__item-body small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-template__item-body strong {
  font-size: 14px;
  line-height: 1.35;
}

.nsglamour-template__item-body small {
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.nsglamour-template__dye-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.nsglamour-template__dye-select {
  position: relative;
  min-width: 0;
}

.nsglamour-template__dye-chip {
  display: inline-grid;
  grid-template-columns: 12px minmax(0, 1fr);
  align-items: center;
  gap: 5px;
  max-width: 132px;
  min-height: 24px;
  padding: 2px 7px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--ns-color-text-muted);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.nsglamour-template__dye-chip::before {
  content: '';
  width: 10px;
  height: 10px;
  border: 1px solid var(--ns-color-border);
  background:
    linear-gradient(45deg, #ddd 25%, transparent 25% 75%, #ddd 75%) 0 0 / 6px 6px,
    var(--nsglamour-dye-color, transparent);
}

.nsglamour-template__dye-chip:not(.empty-dye)::before {
  background: var(--nsglamour-dye-color, #000);
}

.nsglamour-template__dye-chip.empty-dye::before {
  border: 0;
  background: url('/data/glamour/templates/com_icon_clear.svg') center / 10px 10px no-repeat;
}

.nsglamour-template__dye-chip:hover,
.nsglamour-template__dye-chip:focus {
  border-color: var(--ns-color-accent);
  color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-template__dye-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 10;
  display: grid;
  gap: 6px;
  width: min(280px, 82vw);
  padding: 8px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  box-shadow: 0 10px 22px rgba(20, 28, 45, 0.12);
}

.nsglamour-template__dye-search {
  box-sizing: border-box;
  width: 100%;
  min-height: 30px;
  padding: 4px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
}

.nsglamour-template__dye-results {
  display: grid;
  max-height: 230px;
  overflow-y: auto;
}

.nsglamour-template__dye-group {
  display: grid;
}

.nsglamour-template__dye-group-title,
.nsglamour-template__dye-empty {
  padding: 6px 4px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 800;
}

.nsglamour-template__dye-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  min-height: 28px;
  padding: 4px 6px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.nsglamour-template__dye-option:hover,
.nsglamour-template__dye-option:focus {
  background: var(--ns-color-surface);
  outline: none;
}

.nsglamour-template__dye-swatch {
  width: 14px;
  height: 14px;
  border: 1px solid var(--ns-color-border);
  background: var(--nsglamour-dye-color, #000);
}

.nsglamour-template__dye-option span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-template__delete {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--ns-color-text-muted);
  font: inherit;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
}

.nsglamour-template__delete:hover,
.nsglamour-template__delete:focus {
  border-color: var(--ns-color-danger, #c2410c);
  color: var(--ns-color-danger, #c2410c);
  outline: none;
}

.nsglamour-template__search {
  position: relative;
  min-width: 0;
}

.nsglamour-template__input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 13px;
  font-weight: 400;
}

.nsglamour-template__input:focus {
  outline: auto;
}

.nsglamour-template__search-results {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  left: 0;
  z-index: 8;
  display: grid;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  box-shadow: 0 10px 22px rgba(20, 28, 45, 0.12);
}

.nsglamour-template__search-result {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 34px;
  padding: 5px 8px;
  border: 0;
  border-bottom: 1px solid var(--ns-color-border);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.nsglamour-template__search-result:last-child {
  border-bottom: 0;
}

.nsglamour-template__search-result:hover,
.nsglamour-template__search-result:focus {
  background: var(--ns-color-surface);
  outline: none;
}

.nsglamour-template__search-result img {
  display: block;
  width: 24px;
  height: 24px;
  object-fit: cover;
}

.nsglamour-template__search-result span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-template__search-empty {
  padding: 9px 10px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}
</style>
