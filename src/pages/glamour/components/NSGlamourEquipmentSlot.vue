<template>
  <article
    class="nsglamour-slot"
    :class="{
      'nsglamour-slot--empty': !entry.itemName,
      'nsglamour-slot--with-icon': Boolean(entry.iconUrl),
      'nsglamour-slot--selected-no-dye':
        Boolean(entry.itemName) && !entry.dyeEntries.length && !entry.dyeStatusText
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
          @click="editor.clearEntry(entry)"
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
          :class="{ active: editor.isCandidatePickerActive(entry) }"
          :title="t(textKeys.nsglamourEquipmentSwitchCandidate)"
          :aria-label="t(textKeys.nsglamourEquipmentSwitchCandidate)"
          @click.stop="editor.toggleCandidatePicker(entry)"
        >
          {{ t(textKeys.nsglamourEquipmentSwitchCandidateSymbol) }}
        </button>
        <div
          v-if="editor.isCandidatePickerActive(entry)"
          class="nsglamour-slot__candidate-panel"
          @click.stop
        >
          <button
            v-for="candidate in entry.candidates"
            :key="editor.getSearchResultKey(candidate)"
            type="button"
            class="nsglamour-slot__candidate-option"
            :class="{ active: editor.isSelectedCandidate(entry, candidate) }"
            @click="editor.selectCandidate(entry, candidate)"
          >
            <img
              v-if="editor.buildSearchIconUrl(candidate)"
              :src="editor.buildSearchIconUrl(candidate)"
              :alt="editor.getSearchCandidateName(candidate)"
              loading="lazy"
            />
            <span>{{ editor.getSearchCandidateName(candidate) }}</span>
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
            :class="{ 'empty-dye': editor.isNoDye(dye) }"
            :style="{ '--nsglamour-dye-color': editor.getDyeColor(dye) }"
            :title="editor.getDyeTitle(dyeIndex, entry.dyeEntries.length)"
            :aria-label="editor.getDyeTitle(dyeIndex, entry.dyeEntries.length)"
            @click.stop="editor.toggleDyePicker(entry, dyeIndex)"
          >
            {{ editor.getDyeEntryLabel(dye) }}
          </button>

          <div
            v-if="editor.isDyePickerActive(entry, dyeIndex)"
            class="nsglamour-slot__dye-panel"
            @click.stop
          >
            <input
              type="search"
              class="nsglamour-slot__dye-search"
              :value="editor.getDyeSearchQuery(entry.slot, dyeIndex)"
              :placeholder="t(textKeys.nsglamourEquipmentDyeSearchPlaceholder)"
              spellcheck="false"
              autocomplete="off"
              @input="editor.updateDyeSearch(entry.slot, dyeIndex, $event)"
            />
            <div class="nsglamour-slot__dye-results">
              <div
                v-for="group in editor.getDyeGroups(entry.slot, dyeIndex)"
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
                  @click="editor.selectDye(entry, dyeIndex, stain)"
                >
                  <span class="nsglamour-slot__dye-swatch" aria-hidden="true"></span>
                  <span>{{ editor.getStainName(stain) }}</span>
                </button>
              </div>
              <div v-if="editor.isDyeLoading()" class="nsglamour-slot__dye-empty">
                {{ t(textKeys.nsglamourEquipmentDyeLoading) }}
              </div>
              <div v-else-if="editor.isDyeFailed()" class="nsglamour-slot__dye-empty">
                {{ t(textKeys.nsglamourEquipmentDyeLoadError) }}
              </div>
              <div
                v-else-if="editor.shouldShowDyeEmpty(entry.slot, dyeIndex)"
                class="nsglamour-slot__dye-empty"
              >
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
          :value="editor.getSearchQuery(entry.slot)"
          :placeholder="t(textKeys.nsglamourEquipmentSearchPlaceholder)"
          @input="editor.updateSearch(entry, $event)"
          @keydown.esc="editor.clearSearch(entry.slot)"
        />
        <div v-if="editor.shouldShowSearchPanel(entry.slot)" class="nsglamour-slot__search-results">
          <button
            v-for="candidate in editor.getSearchResults(entry.slot)"
            :key="editor.getSearchResultKey(candidate)"
            type="button"
            class="nsglamour-slot__search-result"
            @click="editor.selectSearchResult(entry, candidate)"
          >
            <img
              v-if="editor.buildSearchIconUrl(candidate)"
              :src="editor.buildSearchIconUrl(candidate)"
              :alt="editor.getSearchCandidateName(candidate)"
              loading="lazy"
            />
            <span>{{ editor.getSearchCandidateName(candidate) }}</span>
          </button>
          <div v-if="editor.shouldShowSearchEmpty(entry.slot)" class="nsglamour-slot__search-empty">
            {{ t(textKeys.nsglamourEquipmentSearchEmpty) }}
          </div>
          <div v-if="editor.isSearchFailed(entry.slot)" class="nsglamour-slot__search-empty">
            {{ t(textKeys.nsglamourEquipmentSearchError) }}
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import type { useGlamourEquipInfoEditor } from '@/pages/glamour/composables/useGlamourEquipInfoEditor'
import type { GlamourEquipmentEntryView } from '@/pages/glamour/types/equipmentPanel'
import { useLocale } from '@/stores/locale'

defineProps<{
  entry: GlamourEquipmentEntryView
  editor: ReturnType<typeof useGlamourEquipInfoEditor>
}>()

const { t } = useLocale()
</script>

<style scoped src="../styles/equipment-slot.css"></style>
