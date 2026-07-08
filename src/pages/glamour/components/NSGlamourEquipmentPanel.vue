<template>
  <section class="nsglamour-equipment">
    <header class="nsglamour-equipment__header">
      <div>
        <h2 class="ns-heading-bloom">{{ t(textKeys.nsglamourEquipmentPanel) }}</h2>
        <p v-if="sourceDisplayName" class="nsglamour-equipment__source">
          <strong>{{ sourceDisplayName }}</strong>
          <span v-if="sourceMetaText">{{ sourceMetaText }}</span>
        </p>
      </div>

      <div class="nsglamour-equipment__actions">
        <select
          id="nsglamour-equipment-locale"
          class="nsglamour-equipment__locale"
          :aria-label="t(textKeys.nsglamourEquipmentLanguage)"
          :value="draft.locale"
          @change="emitLocale"
        >
          <option v-for="option in localeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <AppButton size="compact" :disabled="!hasEquipment" @click="saveConfig">
          {{ t(textKeys.nsglamourSaveConfig) }}
        </AppButton>
      </div>
    </header>

    <section v-if="draft.warnings.length" class="nsglamour-equipment__warnings">
      <strong>{{ t(textKeys.nsglamourWarnings) }}</strong>
      <ul>
        <li v-for="warning in draft.warnings" :key="warning">{{ warning }}</li>
      </ul>
    </section>

    <div class="nsglamour-equipment__grid nsglamour-equipment__grid--desktop">
      <div
        v-for="(column, columnIndex) in entryColumns"
        :key="columnIndex"
        class="nsglamour-equipment__column"
      >
        <article
          v-for="entry in column"
          :key="entry.slot"
          class="nsglamour-slot"
          :class="{
            'nsglamour-slot--empty': !entry.itemName,
            'nsglamour-slot--with-icon': Boolean(entry.iconUrl),
            'nsglamour-slot--selected-no-dye': Boolean(entry.itemName) && !entry.dyeEntries.length && !entry.dyeStatusText
          }"
        >
          <div v-if="entry.iconUrl" class="nsglamour-slot__icon" aria-hidden="true">
            <img :src="entry.iconUrl" :alt="entry.itemName" loading="lazy" />
          </div>

          <div class="nsglamour-slot__body">
            <div class="nsglamour-slot__topline">
              <h3>{{ entry.slotName }}</h3>
              <button
                v-if="entry.itemName"
                type="button"
                class="nsglamour-slot__delete"
                :title="t(textKeys.nsglamourEquipmentDelete)"
                :aria-label="t(textKeys.nsglamourEquipmentDelete)"
                @click="clearEntry(entry)"
              >
                {{ t(textKeys.nsglamourEquipmentDeleteSymbol) }}
              </button>
            </div>

            <div v-if="entry.itemName" class="nsglamour-slot__item-row">
              <strong class="nsglamour-slot__item">
                {{ entry.itemName }}
              </strong>
              <button
                v-if="entry.hasCandidateOptions"
                type="button"
                class="nsglamour-slot__candidate-switch"
                :class="{ active: activeCandidateSlot === entry.slot }"
                :title="t(textKeys.nsglamourEquipmentSwitchCandidate)"
                :aria-label="t(textKeys.nsglamourEquipmentSwitchCandidate)"
                @click.stop="toggleCandidatePicker(entry)"
              >
                {{ t(textKeys.nsglamourEquipmentSwitchCandidateSymbol) }}
              </button>
              <div
                v-if="activeCandidateSlot === entry.slot"
                class="nsglamour-slot__candidate-panel"
                @click.stop
              >
                <button
                  v-for="candidate in entry.candidates"
                  :key="getSearchResultKey(candidate)"
                  type="button"
                  class="nsglamour-slot__candidate-option"
                  :class="{ active: isSelectedCandidate(entry, candidate) }"
                  @click="selectCandidate(entry, candidate)"
                >
                  <img
                    v-if="buildSearchIconUrl(candidate)"
                    :src="buildSearchIconUrl(candidate)"
                    :alt="getSearchCandidateName(candidate)"
                    loading="lazy"
                  />
                  <span>{{ getSearchCandidateName(candidate) }}</span>
                </button>
              </div>
            </div>

            <div v-if="entry.dyeEntries.length" class="nsglamour-slot__dye-controls">
              <div
                v-for="(dye, dyeIndex) in entry.dyeEntries"
                :key="`${entry.slot}-${dyeIndex}`"
                class="nsglamour-slot__dye-select"
              >
                <button
                  type="button"
                  class="nsglamour-slot__dye-chip"
                  :class="{ 'empty-dye': isNoDye(dye) }"
                  :style="{ '--nsglamour-dye-color': getDyeColor(dye) }"
                  :title="getDyeTitle(dyeIndex, entry.dyeEntries.length)"
                  :aria-label="getDyeTitle(dyeIndex, entry.dyeEntries.length)"
                  @click.stop="toggleDyePicker(entry, dyeIndex)"
                >
                  {{ getDyeEntryLabel(dye) }}
                </button>

                <div
                  v-if="isDyePickerActive(entry, dyeIndex)"
                  class="nsglamour-slot__dye-panel"
                  @click.stop
                >
                  <input
                    type="search"
                    class="nsglamour-slot__dye-search"
                    :value="getDyeSearchQuery(entry.slot, dyeIndex)"
                    :placeholder="t(textKeys.nsglamourEquipmentDyeSearchPlaceholder)"
                    spellcheck="false"
                    autocomplete="off"
                    @input="updateDyeSearch(entry.slot, dyeIndex, $event)"
                  />
                  <div class="nsglamour-slot__dye-results">
                    <div
                      v-for="group in getDyeGroups(entry.slot, dyeIndex)"
                      :key="group.key"
                      class="nsglamour-slot__dye-group"
                    >
                      <div v-if="group.label" class="nsglamour-slot__dye-group-title">
                        {{ group.label }}
                      </div>
                      <button
                        v-for="stain in group.items"
                        :key="stain.id"
                        type="button"
                        class="nsglamour-slot__dye-option"
                        :style="{ '--nsglamour-dye-color': stain.hex || '#000000' }"
                        @click="selectDye(entry, dyeIndex, stain)"
                      >
                        <span class="nsglamour-slot__dye-swatch" aria-hidden="true"></span>
                        <span>{{ getStainName(stain) }}</span>
                      </button>
                    </div>
                    <div v-if="isDyeLoading()" class="nsglamour-slot__dye-empty">
                      {{ t(textKeys.nsglamourEquipmentDyeLoading) }}
                    </div>
                    <div v-else-if="isDyeFailed()" class="nsglamour-slot__dye-empty">
                      {{ t(textKeys.nsglamourEquipmentDyeLoadError) }}
                    </div>
                    <div v-else-if="shouldShowDyeEmpty(entry.slot, dyeIndex)" class="nsglamour-slot__dye-empty">
                      {{ t(textKeys.nsglamourEquipmentDyeSearchEmpty) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="entry.dyeStatusText" class="nsglamour-slot__dye-text">
              {{ entry.dyeStatusText }}
            </div>

            <div v-else-if="!entry.itemName" class="nsglamour-slot__search">
              <input
                type="search"
                class="nsglamour-slot__search-input"
                :value="getSearchQuery(entry.slot)"
                :placeholder="t(textKeys.nsglamourEquipmentSearchPlaceholder)"
                @input="updateSearch(entry, $event)"
                @keydown.esc="clearSearch(entry.slot)"
              />
              <div v-if="shouldShowSearchPanel(entry.slot)" class="nsglamour-slot__search-results">
                <button
                  v-for="candidate in getSearchResults(entry.slot)"
                  :key="getSearchResultKey(candidate)"
                  type="button"
                  class="nsglamour-slot__search-result"
                  @click="selectSearchResult(entry, candidate)"
                >
                  <img
                    v-if="buildSearchIconUrl(candidate)"
                    :src="buildSearchIconUrl(candidate)"
                    :alt="getSearchCandidateName(candidate)"
                    loading="lazy"
                  />
                  <span>{{ getSearchCandidateName(candidate) }}</span>
                </button>
                <div
                  v-if="shouldShowSearchEmpty(entry.slot)"
                  class="nsglamour-slot__search-empty"
                >
                  {{ t(textKeys.nsglamourEquipmentSearchEmpty) }}
                </div>
                <div
                  v-if="searchFailed[entry.slot]"
                  class="nsglamour-slot__search-empty"
                >
                  {{ t(textKeys.nsglamourEquipmentSearchError) }}
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div class="nsglamour-equipment__grid nsglamour-equipment__grid--mobile">
      <article
        v-for="entry in mobileEntries"
        :key="entry.slot"
        class="nsglamour-slot"
        :class="{
          'nsglamour-slot--empty': !entry.itemName,
          'nsglamour-slot--with-icon': Boolean(entry.iconUrl),
          'nsglamour-slot--selected-no-dye': Boolean(entry.itemName) && !entry.dyeEntries.length && !entry.dyeStatusText
        }"
      >
        <div v-if="entry.iconUrl" class="nsglamour-slot__icon" aria-hidden="true">
          <img :src="entry.iconUrl" :alt="entry.itemName" loading="lazy" />
        </div>

        <div class="nsglamour-slot__body">
          <div class="nsglamour-slot__topline">
            <h3>{{ entry.slotName }}</h3>
            <button
              v-if="entry.itemName"
              type="button"
              class="nsglamour-slot__delete"
              :title="t(textKeys.nsglamourEquipmentDelete)"
              :aria-label="t(textKeys.nsglamourEquipmentDelete)"
              @click="clearEntry(entry)"
            >
              {{ t(textKeys.nsglamourEquipmentDeleteSymbol) }}
            </button>
          </div>

          <div v-if="entry.itemName" class="nsglamour-slot__item-row">
            <strong class="nsglamour-slot__item">
              {{ entry.itemName }}
            </strong>
            <button
              v-if="entry.hasCandidateOptions"
              type="button"
              class="nsglamour-slot__candidate-switch"
              :class="{ active: activeCandidateSlot === entry.slot }"
              :title="t(textKeys.nsglamourEquipmentSwitchCandidate)"
              :aria-label="t(textKeys.nsglamourEquipmentSwitchCandidate)"
              @click.stop="toggleCandidatePicker(entry)"
            >
              {{ t(textKeys.nsglamourEquipmentSwitchCandidateSymbol) }}
            </button>
            <div
              v-if="activeCandidateSlot === entry.slot"
              class="nsglamour-slot__candidate-panel"
              @click.stop
            >
              <button
                v-for="candidate in entry.candidates"
                :key="getSearchResultKey(candidate)"
                type="button"
                class="nsglamour-slot__candidate-option"
                :class="{ active: isSelectedCandidate(entry, candidate) }"
                @click="selectCandidate(entry, candidate)"
              >
                <img
                  v-if="buildSearchIconUrl(candidate)"
                  :src="buildSearchIconUrl(candidate)"
                  :alt="getSearchCandidateName(candidate)"
                  loading="lazy"
                />
                <span>{{ getSearchCandidateName(candidate) }}</span>
              </button>
            </div>
          </div>

          <div v-if="entry.dyeEntries.length" class="nsglamour-slot__dye-controls">
            <div
              v-for="(dye, dyeIndex) in entry.dyeEntries"
              :key="`${entry.slot}-${dyeIndex}`"
              class="nsglamour-slot__dye-select"
            >
              <button
                type="button"
                class="nsglamour-slot__dye-chip"
                :class="{ 'empty-dye': isNoDye(dye) }"
                :style="{ '--nsglamour-dye-color': getDyeColor(dye) }"
                :title="getDyeTitle(dyeIndex, entry.dyeEntries.length)"
                :aria-label="getDyeTitle(dyeIndex, entry.dyeEntries.length)"
                @click.stop="toggleDyePicker(entry, dyeIndex)"
              >
                {{ getDyeEntryLabel(dye) }}
              </button>

              <div
                v-if="isDyePickerActive(entry, dyeIndex)"
                class="nsglamour-slot__dye-panel"
                @click.stop
              >
                <input
                  type="search"
                  class="nsglamour-slot__dye-search"
                  :value="getDyeSearchQuery(entry.slot, dyeIndex)"
                  :placeholder="t(textKeys.nsglamourEquipmentDyeSearchPlaceholder)"
                  spellcheck="false"
                  autocomplete="off"
                  @input="updateDyeSearch(entry.slot, dyeIndex, $event)"
                />
                <div class="nsglamour-slot__dye-results">
                  <div
                    v-for="group in getDyeGroups(entry.slot, dyeIndex)"
                    :key="group.key"
                    class="nsglamour-slot__dye-group"
                  >
                    <div v-if="group.label" class="nsglamour-slot__dye-group-title">
                      {{ group.label }}
                    </div>
                    <button
                      v-for="stain in group.items"
                      :key="stain.id"
                      type="button"
                      class="nsglamour-slot__dye-option"
                      :style="{ '--nsglamour-dye-color': stain.hex || '#000000' }"
                      @click="selectDye(entry, dyeIndex, stain)"
                    >
                      <span class="nsglamour-slot__dye-swatch" aria-hidden="true"></span>
                      <span>{{ getStainName(stain) }}</span>
                    </button>
                  </div>
                  <div v-if="isDyeLoading()" class="nsglamour-slot__dye-empty">
                    {{ t(textKeys.nsglamourEquipmentDyeLoading) }}
                  </div>
                  <div v-else-if="isDyeFailed()" class="nsglamour-slot__dye-empty">
                    {{ t(textKeys.nsglamourEquipmentDyeLoadError) }}
                  </div>
                  <div v-else-if="shouldShowDyeEmpty(entry.slot, dyeIndex)" class="nsglamour-slot__dye-empty">
                    {{ t(textKeys.nsglamourEquipmentDyeSearchEmpty) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="entry.dyeStatusText" class="nsglamour-slot__dye-text">
            {{ entry.dyeStatusText }}
          </div>

          <div v-else-if="!entry.itemName" class="nsglamour-slot__search">
            <input
              type="search"
              class="nsglamour-slot__search-input"
              :value="getSearchQuery(entry.slot)"
              :placeholder="t(textKeys.nsglamourEquipmentSearchPlaceholder)"
              @input="updateSearch(entry, $event)"
              @keydown.esc="clearSearch(entry.slot)"
            />
            <div v-if="shouldShowSearchPanel(entry.slot)" class="nsglamour-slot__search-results">
              <button
                v-for="candidate in getSearchResults(entry.slot)"
                :key="getSearchResultKey(candidate)"
                type="button"
                class="nsglamour-slot__search-result"
                @click="selectSearchResult(entry, candidate)"
              >
                <img
                  v-if="buildSearchIconUrl(candidate)"
                  :src="buildSearchIconUrl(candidate)"
                  :alt="getSearchCandidateName(candidate)"
                  loading="lazy"
                />
                <span>{{ getSearchCandidateName(candidate) }}</span>
              </button>
              <div
                v-if="shouldShowSearchEmpty(entry.slot)"
                class="nsglamour-slot__search-empty"
              >
                {{ t(textKeys.nsglamourEquipmentSearchEmpty) }}
              </div>
              <div
                v-if="searchFailed[entry.slot]"
                class="nsglamour-slot__search-empty"
              >
                {{ t(textKeys.nsglamourEquipmentSearchError) }}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import { textKeys } from '@/config/site'
import {
  buildGlamourIconUrl,
  getCandidateDyeCount,
  getCandidateName,
  getDisplayDyeEntries,
  getDyeEntryName,
  getEquipmentDyeSummary,
  getSelectedCandidate,
  getSlotTitle,
  groupGlamourStains,
  isNoDyeEntry,
  resolveLocalized,
  stainMatchesQuery
} from '@/lib/glamour/equipment'
import { normalizeGlamourConfigName } from '@/lib/glamour/recent'
import type {
  GlamourCandidate,
  GlamourDraft,
  GlamourDyeEntry,
  GlamourDyeSummary,
  GlamourStain,
  GlamourStainGroup
} from '@/lib/glamour/types'
import { useLocale } from '@/stores/locale'

const EQUIPINFO_LEFT_COLUMN_SLOTS = [
  'MainHand',
  'HeadGear',
  'Body',
  'Hands',
  'Legs',
  'Feet',
  'Glasses'
]

const EQUIPINFO_RIGHT_COLUMN_SLOTS = [
  'OffHand',
  'Ears',
  'Neck',
  'Wrists',
  'LeftRing',
  'RightRing',
  'FashionAccessory'
]

const EQUIPINFO_MOBILE_SLOTS = [
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
]

interface EquipmentEntryView {
  slot: string
  slotName: string
  itemName: string
  iconUrl: string
  dyeStatusText: string
  dyeEntries: GlamourDyeEntry[]
  candidates: GlamourCandidate[]
  hasCandidateOptions: boolean
}

const props = defineProps<{
  draft: GlamourDraft
  apiBase: string
  searchItems: (options: {
    slot: string
    query: string
    locale: string
    limit?: number
  }) => Promise<GlamourCandidate[]>
  loadStains: (locale: string) => Promise<GlamourStain[]>
}>()

const emit = defineEmits<{
  'update-locale': [locale: string]
  'replace-entry': [slot: string, candidate: GlamourCandidate]
  'clear-entry': [slot: string]
  'select-entry-candidate': [slot: string, candidateKey: string | number | undefined]
  'set-entry-dye': [slot: string, dyeIndex: number, stain: GlamourStain]
  'save-config': [name: string]
}>()

const { t } = useLocale()
const searchQueries = reactive<Record<string, string>>({})
const searchResults = reactive<Record<string, GlamourCandidate[]>>({})
const searchTouched = reactive<Record<string, boolean>>({})
const searchFailed = reactive<Record<string, boolean>>({})
const searchBusy = reactive<Record<string, boolean>>({})
const searchTimers = new Map<string, number>()
const activeCandidateSlot = ref('')
const activeDyePicker = ref<{ slot: string; index: number } | null>(null)
const stainLists = reactive<Record<string, GlamourStain[]>>({})
const stainLoading = reactive<Record<string, boolean>>({})
const stainFailed = reactive<Record<string, boolean>>({})
const dyeSearchQueries = reactive<Record<string, string>>({})

const localeLabelKeys: Record<string, string> = {
  zh: textKeys.nsglamourLocaleZh,
  en: textKeys.nsglamourLocaleEn,
  ja: textKeys.nsglamourLocaleJa,
  ko: textKeys.nsglamourLocaleKo,
  tc: textKeys.nsglamourLocaleTc,
  fr: textKeys.nsglamourLocaleFr,
  de: textKeys.nsglamourLocaleDe
}

const localeOptions = computed(() =>
  props.draft.locales.map((locale) => ({
    value: locale,
    label: t(localeLabelKeys[locale] ?? '') || props.draft.localeLabels[locale] || locale
  }))
)

const entryViews = computed<EquipmentEntryView[]>(() =>
  props.draft.entries.map((entry) => {
    const candidate = getSelectedCandidate(entry)
    const dyeSummary = getEquipmentDyeSummary(entry, props.draft.locale, props.draft.noDyeLabels)
    const dyeEntries =
      candidate && getCandidateDyeCount(candidate, entry.slot) > 0
        ? getDisplayDyeEntries(candidate, entry.slot, props.draft.noDyeLabels, props.draft.locale)
        : []

    return {
      slot: entry.slot,
      slotName: getSlotTitle(entry, props.draft.locale, {
        slot_names: props.draft.slotNames,
        default_locale: props.draft.source.locale
      }),
      itemName: getCandidateName(candidate, props.draft.locale, props.draft.source.locale),
      iconUrl: buildGlamourIconUrl(props.apiBase, candidate?.icon),
      dyeStatusText: formatDyeSummary(dyeSummary),
      dyeEntries,
      candidates: Array.isArray(entry.candidates) ? entry.candidates : [],
      hasCandidateOptions: Array.isArray(entry.candidates) && entry.candidates.length > 1
    }
  })
)

const entryColumns = computed<EquipmentEntryView[][]>(() => {
  const entriesBySlot = new Map(entryViews.value.map((entry) => [entry.slot, entry]))

  return [
    EQUIPINFO_LEFT_COLUMN_SLOTS.map((slot) => entriesBySlot.get(slot)).filter(isEntryView),
    EQUIPINFO_RIGHT_COLUMN_SLOTS.map((slot) => entriesBySlot.get(slot)).filter(isEntryView)
  ]
})

const mobileEntries = computed<EquipmentEntryView[]>(() => {
  const entriesBySlot = new Map(entryViews.value.map((entry) => [entry.slot, entry]))

  return EQUIPINFO_MOBILE_SLOTS.map((slot) => entriesBySlot.get(slot)).filter(isEntryView)
})

const sourceDisplayName = computed(() => props.draft.source.name || props.draft.source.title || '')
const sourceMetaText = computed(() => {
  const title = props.draft.source.title

  return title && title !== sourceDisplayName.value ? title : ''
})
const hasEquipment = computed(() => entryViews.value.some((entry) => Boolean(entry.itemName)))

function isEntryView(entry: EquipmentEntryView | undefined): entry is EquipmentEntryView {
  return Boolean(entry)
}

function formatDyeSummary(summary: GlamourDyeSummary): string {
  if (summary.kind === 'empty') {
    return ''
  }

  if (summary.kind === 'ignored') {
    return ''
  }

  if (summary.kind === 'undyeable') {
    return summary.text || t(textKeys.nsglamourEquipmentUndyeable)
  }

  if (summary.kind === 'none') {
    return summary.text
  }

  return summary.text
}

function getSearchQuery(slot: string): string {
  return searchQueries[slot] || ''
}

function getSearchResults(slot: string): GlamourCandidate[] {
  return searchResults[slot] || []
}

function shouldShowSearchPanel(slot: string): boolean {
  return Boolean(getSearchQuery(slot).trim() && (searchTouched[slot] || searchFailed[slot]))
}

function shouldShowSearchEmpty(slot: string): boolean {
  return Boolean(
    getSearchQuery(slot).trim() &&
      searchTouched[slot] &&
      !searchBusy[slot] &&
      !searchFailed[slot] &&
      getSearchResults(slot).length === 0
  )
}

function getSearchCandidateName(candidate: GlamourCandidate): string {
  return getCandidateName(candidate, props.draft.locale, props.draft.source.locale)
}

function buildSearchIconUrl(candidate: GlamourCandidate): string {
  return buildGlamourIconUrl(props.apiBase, candidate.icon)
}

function getSearchResultKey(candidate: GlamourCandidate): string {
  return String(candidate.key ?? candidate.name ?? JSON.stringify(candidate.names ?? {}))
}

function clearSearch(slot: string) {
  const timer = searchTimers.get(slot)

  if (timer) {
    window.clearTimeout(timer)
    searchTimers.delete(slot)
  }

  searchQueries[slot] = ''
  searchResults[slot] = []
  searchTouched[slot] = false
  searchFailed[slot] = false
  searchBusy[slot] = false
}

function getDyePickerKey(slot: string, index: number): string {
  return `${slot}:${index}`
}

function getDyeSearchQuery(slot: string, index: number): string {
  return dyeSearchQueries[getDyePickerKey(slot, index)] || ''
}

function updateDyeSearch(slot: string, index: number, event: Event) {
  dyeSearchQueries[getDyePickerKey(slot, index)] = (event.currentTarget as HTMLInputElement).value
}

function isDyePickerActive(entry: EquipmentEntryView, index: number): boolean {
  return activeDyePicker.value?.slot === entry.slot && activeDyePicker.value.index === index
}

async function ensureStainsForCurrentLocale() {
  const locale = props.draft.locale

  if (stainLists[locale] || stainLoading[locale]) {
    return
  }

  stainLoading[locale] = true
  stainFailed[locale] = false

  try {
    stainLists[locale] = await props.loadStains(locale)
  } catch {
    stainLists[locale] = []
    stainFailed[locale] = true
  } finally {
    stainLoading[locale] = false
  }
}

function toggleDyePicker(entry: EquipmentEntryView, index: number) {
  if (isDyePickerActive(entry, index)) {
    activeDyePicker.value = null
    return
  }

  activeCandidateSlot.value = ''
  activeDyePicker.value = { slot: entry.slot, index }
  void ensureStainsForCurrentLocale()
}

function getDyeGroups(slot: string, index: number): GlamourStainGroup[] {
  const query = getDyeSearchQuery(slot, index)
  const stains = stainLists[props.draft.locale] || []
  return groupGlamourStains(stains.filter((stain) => stainMatchesQuery(stain, query)))
}

function shouldShowDyeEmpty(slot: string, index: number): boolean {
  return Boolean(
    activeDyePicker.value &&
      !isDyeLoading() &&
      !isDyeFailed() &&
      getDyeGroups(slot, index).length === 0
  )
}

function isDyeLoading(): boolean {
  return Boolean(stainLoading[props.draft.locale])
}

function isDyeFailed(): boolean {
  return Boolean(stainFailed[props.draft.locale])
}

function getDyeEntryLabel(dye: GlamourDyeEntry): string {
  return getDyeEntryName(dye, props.draft.noDyeLabels, props.draft.locale)
}

function getDyeColor(dye: GlamourDyeEntry): string {
  return isNoDye(dye) ? 'transparent' : dye.hex || '#000000'
}

function isNoDye(dye: GlamourDyeEntry): boolean {
  return isNoDyeEntry(dye)
}

function getStainName(stain: GlamourStain): string {
  return resolveLocalized(stain.names, props.draft.locale, props.draft.source.locale) || stain.name
}

function formatMessage(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  )
}

function getDyeTitle(index: number, count: number): string {
  if (count > 1) {
    return formatMessage(t(textKeys.nsglamourEquipmentDyeSlotNumber), { number: index + 1 })
  }

  return t(textKeys.nsglamourEquipmentDyeSlot)
}

function selectDye(entry: EquipmentEntryView, dyeIndex: number, stain: GlamourStain) {
  emit('set-entry-dye', entry.slot, dyeIndex, stain)
  activeDyePicker.value = null
}

function updateSearch(entry: EquipmentEntryView, event: Event) {
  const slot = entry.slot
  const query = (event.currentTarget as HTMLInputElement).value
  const timer = searchTimers.get(slot)

  if (timer) {
    window.clearTimeout(timer)
  }

  searchQueries[slot] = query
  searchResults[slot] = []
  searchTouched[slot] = false
  searchFailed[slot] = false

  if (!query.trim()) {
    searchBusy[slot] = false
    searchTimers.delete(slot)
    return
  }

  searchTimers.set(
    slot,
    window.setTimeout(() => {
      void runSearch(slot, query)
    }, 180)
  )
}

async function runSearch(slot: string, query: string) {
  searchBusy[slot] = true
  searchFailed[slot] = false

  try {
    const results = await props.searchItems({
      slot,
      query: query.trim(),
      locale: props.draft.locale,
      limit: 20
    })

    if (searchQueries[slot] === query) {
      searchResults[slot] = results
      searchTouched[slot] = true
    }
  } catch {
    if (searchQueries[slot] === query) {
      searchResults[slot] = []
      searchTouched[slot] = true
      searchFailed[slot] = true
    }
  } finally {
    if (searchQueries[slot] === query) {
      searchBusy[slot] = false
    }
  }
}

function selectSearchResult(entry: EquipmentEntryView, candidate: GlamourCandidate) {
  emit('replace-entry', entry.slot, candidate)
  clearSearch(entry.slot)
  activeCandidateSlot.value = ''
  activeDyePicker.value = null
}

function clearEntry(entry: EquipmentEntryView) {
  emit('clear-entry', entry.slot)
  clearSearch(entry.slot)
  activeCandidateSlot.value = ''
  activeDyePicker.value = null
}

function toggleCandidatePicker(entry: EquipmentEntryView) {
  activeDyePicker.value = null
  activeCandidateSlot.value = activeCandidateSlot.value === entry.slot ? '' : entry.slot
}

function isSelectedCandidate(entry: EquipmentEntryView, candidate: GlamourCandidate): boolean {
  return String(entry.candidates[0]?.key ?? '') === String(candidate.key ?? '')
}

function selectCandidate(entry: EquipmentEntryView, candidate: GlamourCandidate) {
  emit('select-entry-candidate', entry.slot, candidate.key)
  activeCandidateSlot.value = ''
}

function saveConfig() {
  const name = window.prompt(
    t(textKeys.nsglamourConfigNamePrompt),
    normalizeGlamourConfigName(sourceDisplayName.value || t(textKeys.nsglamourRecentUnnamed))
  )

  if (name === null) {
    return
  }

  emit('save-config', normalizeGlamourConfigName(name))
}

function emitLocale(event: Event) {
  emit('update-locale', (event.currentTarget as HTMLSelectElement).value)
}
</script>

<style scoped>
.nsglamour-equipment {
  display: grid;
  align-content: start;
  min-height: 0;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ns-color-border, #d8d8d8);
  background: var(--ns-color-surface-solid, #fff);
  color: var(--ns-color-text, #222);
}

.nsglamour-equipment__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, auto);
  gap: 12px;
  align-items: end;
}

.nsglamour-equipment__header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.nsglamour-equipment__source {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0 0;
  color: var(--ns-color-text-muted, #777);
  font-size: 12px;
  line-height: 1.35;
}

.nsglamour-equipment__source strong,
.nsglamour-equipment__source span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-equipment__source strong {
  max-width: 100%;
  color: var(--ns-color-text, #222);
  font-weight: 700;
}

.nsglamour-equipment__source span {
  max-width: 100%;
}

.nsglamour-equipment__actions {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: end;
  gap: 8px;
}

.nsglamour-equipment__actions :deep(.ns-button) {
  min-width: 92px;
  white-space: nowrap;
}

.nsglamour-equipment__locale {
  appearance: auto;
  -webkit-appearance: menulist;
  box-sizing: border-box;
  width: min(220px, 100%);
  min-width: 0;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid var(--ns-color-border, #cfcfcf);
  border-radius: 4px;
  background: var(--ns-color-surface-solid, #fff);
  color: inherit;
  font: inherit;
  font-size: 13px;
}

.nsglamour-equipment__locale:focus {
  outline: auto;
  outline-offset: 0;
}

.nsglamour-equipment__warnings {
  display: grid;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
}

.nsglamour-equipment__warnings strong {
  font-size: 12px;
  font-weight: 700;
}

.nsglamour-equipment__warnings ul {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-inline-start: 18px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}

.nsglamour-equipment__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 28px;
  min-height: 0;
  border-top: 1px solid var(--ns-color-border, #d8d8d8);
}

.nsglamour-equipment__grid--mobile {
  display: none;
}

.nsglamour-equipment__column {
  display: grid;
  min-width: 0;
}

.nsglamour-slot {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  min-height: 78px;
  padding: 22px 0 10px;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
  background: transparent;
}

.nsglamour-slot--with-icon {
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 8px;
}

.nsglamour-slot--empty {
  color: var(--ns-color-text-muted, #777);
}

.nsglamour-slot--selected-no-dye .nsglamour-slot__body {
  align-self: center;
}

.nsglamour-slot__icon {
  align-self: center;
  width: 42px;
  height: 42px;
}

.nsglamour-slot__icon img {
  display: block;
  width: 42px;
  height: 42px;
  border: 1px solid var(--ns-color-border, #d8d8d8);
  border-radius: 6px;
  image-rendering: auto;
  object-fit: cover;
}

.nsglamour-slot__body {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.nsglamour-slot__topline {
  position: absolute;
  top: 7px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.nsglamour-slot__topline h3 {
  min-width: 0;
  margin: 0;
  color: var(--ns-color-text-muted, #777);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-slot__delete {
  flex: 0 0 auto;
  width: 22px;
  min-width: 22px;
  height: 22px;
  min-height: 22px;
  padding: 0 0 2px;
  border: 0;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text-muted, #777);
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.nsglamour-slot__delete:hover,
.nsglamour-slot__delete:focus {
  border-bottom-color: var(--ns-status-danger-border, #c2410c);
  color: var(--ns-status-danger-text, #b91c1c);
  outline: none;
}

.nsglamour-slot__item-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.nsglamour-slot__item {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.nsglamour-slot__candidate-switch {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  min-width: 22px;
  height: 22px;
  min-height: 22px;
  padding: 0;
  border: 0;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text-muted, #777);
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
}

.nsglamour-slot__candidate-switch:hover,
.nsglamour-slot__candidate-switch:focus,
.nsglamour-slot__candidate-switch.active {
  border-bottom-color: var(--ns-color-accent, #d97706);
  color: var(--ns-color-accent, #d97706);
  outline: none;
}

.nsglamour-slot__candidate-panel {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  z-index: 6;
  display: grid;
  gap: 0;
  width: min(420px, calc(100vw - 42px));
  max-height: 260px;
  min-width: 0;
  padding: 5px;
  overflow: auto;
  border: 1px solid var(--ns-color-border, #d8d8d8);
  background: var(--ns-color-surface-solid, #fff);
  box-shadow: 0 8px 20px rgba(20, 28, 45, 0.08);
}

.nsglamour-slot__candidate-option {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  min-width: 0;
  padding: 5px 8px;
  border: 0;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.nsglamour-slot__candidate-option:hover,
.nsglamour-slot__candidate-option:focus,
.nsglamour-slot__candidate-option.active {
  border-bottom-color: var(--ns-color-accent, #d97706);
  color: var(--ns-color-accent, #d97706);
  outline: none;
}

.nsglamour-slot__candidate-option img {
  display: block;
  width: 42px;
  height: 42px;
  border: 1px solid var(--ns-color-border, #d8d8d8);
  border-radius: 6px;
  object-fit: cover;
}

.nsglamour-slot__candidate-option span {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-slot__dye-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
  min-width: 0;
  min-height: 26px;
}

.nsglamour-slot__dye-select {
  position: relative;
  display: inline-flex;
  flex: 0 1 140px;
  min-width: 0;
  max-width: 100%;
}

.nsglamour-slot__dye-chip {
  width: 140px;
  max-width: 100%;
  min-height: 25px;
  padding: 3px 6px 4px 22px;
  overflow: hidden;
  border: 0;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
  border-radius: 0;
  background:
    radial-gradient(circle at 11px center, var(--nsglamour-dye-color, #000000) 0 5px, transparent 6px),
    transparent;
  color: inherit;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.nsglamour-slot__dye-chip.empty-dye {
  background:
    url('/data/glamour/templates/com_icon_clear.svg') 6px center / 10px 10px no-repeat,
    transparent;
  color: var(--ns-color-text-muted, #777);
}

.nsglamour-slot__dye-chip:hover,
.nsglamour-slot__dye-chip:focus {
  border-bottom-color: var(--ns-color-accent, #d97706);
  color: var(--ns-color-accent, #d97706);
  outline: none;
}

.nsglamour-slot__dye-panel {
  position: absolute;
  z-index: 8;
  top: calc(100% + 4px);
  left: 0;
  display: grid;
  gap: 4px;
  width: min(240px, calc(100vw - 42px));
  max-height: 240px;
  padding: 5px;
  overflow: hidden;
  border: 1px solid var(--ns-color-border, #d8d8d8);
  background: var(--ns-color-surface-solid, #fff);
  box-shadow: 0 8px 20px rgba(20, 28, 45, 0.08);
}

.nsglamour-slot__dye-search {
  box-sizing: border-box;
  width: 100%;
  height: 28px;
  padding: 0 0 4px;
  border: 0;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  outline: none;
}

.nsglamour-slot__dye-search:focus {
  border-bottom-color: var(--ns-color-accent, #d97706);
}

.nsglamour-slot__dye-results {
  display: grid;
  gap: 2px;
  max-height: 190px;
  overflow-y: auto;
}

.nsglamour-slot__dye-group {
  display: grid;
  gap: 2px;
}

.nsglamour-slot__dye-group-title {
  padding: 6px 7px 3px;
  color: var(--ns-color-text-muted, #777);
  font-size: 10px;
  font-weight: 800;
  pointer-events: none;
  user-select: none;
}

.nsglamour-slot__dye-option {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  min-width: 0;
  padding: 5px 0 6px;
  border: 0;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.nsglamour-slot__dye-option:hover,
.nsglamour-slot__dye-option:focus {
  border-bottom-color: var(--ns-color-accent, #d97706);
  color: var(--ns-color-accent, #d97706);
  outline: none;
}

.nsglamour-slot__dye-option span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-slot__dye-swatch {
  flex: 0 0 auto;
  width: 11px;
  height: 11px;
  border: 1px solid rgba(17, 24, 39, 0.28);
  border-radius: 999px;
  background: var(--nsglamour-dye-color, #000000);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

.nsglamour-slot__dye-empty,
.nsglamour-slot__dye-text {
  color: var(--ns-color-text-muted, #777);
  font-size: 11px;
}

.nsglamour-slot__dye-empty {
  padding: 10px 6px;
  text-align: center;
}

.nsglamour-slot__meta {
  display: grid;
  gap: 3px;
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}

.nsglamour-slot__meta div {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 6px;
  min-width: 0;
}

.nsglamour-slot__meta dt,
.nsglamour-slot__meta dd {
  min-width: 0;
  margin: 0;
}

.nsglamour-slot__meta dt {
  font-weight: 700;
}

.nsglamour-slot__meta dd {
  overflow-wrap: anywhere;
}

.nsglamour-slot__search {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.nsglamour-slot__search-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 30px;
  padding: 4px 0;
  border: 0;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 13px;
  outline: none;
}

.nsglamour-slot__search-input:focus {
  border-bottom-color: var(--ns-color-accent, #d97706);
}

.nsglamour-slot__search-results {
  display: grid;
  gap: 0;
  max-height: 180px;
  min-width: 0;
  overflow: auto;
  border: 1px solid var(--ns-color-border, #d8d8d8);
  background: var(--ns-color-surface, #fff);
}

.nsglamour-slot__search-result {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 52px;
  padding: 5px 8px;
  border: 0;
  border-bottom: 1px solid var(--ns-color-border, #e4e4e4);
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.nsglamour-slot__search-result:hover,
.nsglamour-slot__search-result:focus {
  background: var(--ns-color-surface-muted, #f5f5f5);
  outline: none;
}

.nsglamour-slot__search-result img {
  display: block;
  width: 42px;
  height: 42px;
  border: 1px solid var(--ns-color-border, #d8d8d8);
  border-radius: 6px;
  object-fit: cover;
}

.nsglamour-slot__search-result span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-slot__search-empty {
  padding: 8px 6px;
  color: var(--ns-color-text-muted, #777);
  font-size: 12px;
}

@media (max-width: 1080px) {
  .nsglamour-equipment__grid--desktop {
    display: none;
  }

  .nsglamour-equipment__grid--mobile {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }
}

@media (max-width: 640px) {
  .nsglamour-equipment__header {
    grid-template-columns: 1fr;
  }

  .nsglamour-equipment__actions {
    align-items: stretch;
    justify-content: start;
  }
}
</style>
