<template>
  <NSPlatePanel :title="t(textKeys.nsplateInfoPreset)">
    <label class="nsplate-info-panel__field">
      <span>{{ t(textKeys.nsplateInfoPreset) }}</span>
      <select
        class="nsplate-info-panel__select"
        :value="modelValue.activePresetId"
        :aria-label="t(textKeys.nsplateInfoPreset)"
        @change="setActivePreset"
      >
        <option v-for="preset in nsPlateInfoPresetDefinitions" :key="preset.id" :value="preset.id">
          {{ localizePlateInfoText(preset.labelKey, preset.fallbackLabel, t) }}
        </option>
      </select>
    </label>
  </NSPlatePanel>

  <NSPlatePanel :title="t(textKeys.nsplateInfoFields)">
    <div class="nsplate-info-panel__actions" role="group" :aria-label="t(ACTION_KEYS.group)">
      <button
        class="nsplate-info-panel__action-button"
        type="button"
        @click="setAllLayersEnabled(true)"
      >
        {{ t(ACTION_KEYS.showAll) }}
      </button>
      <button
        class="nsplate-info-panel__action-button"
        type="button"
        @click="setAllLayersEnabled(false)"
      >
        {{ t(ACTION_KEYS.hideAll) }}
      </button>
      <button class="nsplate-info-panel__action-button" type="button" @click="resetActivePreset">
        {{ t(ACTION_KEYS.reset) }}
      </button>
    </div>

    <div class="nsplate-info-panel__list">
      <article
        v-for="entry in activeLayers"
        :key="entry.definition.slotId"
        class="nsplate-info-panel__card"
        :data-open="isLayerOpen(entry.state.slotId)"
        :data-expandable="isLayerExpandable(entry.state)"
      >
        <header class="nsplate-info-panel__card-head">
          <button
            class="nsplate-info-panel__visibility"
            type="button"
            :data-enabled="entry.state.enabled"
            :aria-pressed="entry.state.enabled"
            :aria-label="getLayerVisibilityLabel(entry.state.enabled)"
            :title="getLayerVisibilityLabel(entry.state.enabled)"
            @click="setLayerEnabled(entry.state.slotId, !entry.state.enabled)"
          >
            <svg
              v-if="entry.state.enabled"
              class="nsplate-info-panel__visibility-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M16 20H8v-2h8v2Zm-8-2H4v-2h4v2Zm12 0h-4v-2h4v2ZM4 16H2v-2h2v2Zm10-6h-2v2h2v-2h2v4h-2v2h-4v-2H8v-4h2V8h4v2Zm8 6h-2v-2h2v2ZM2 14H0v-4h2v4Zm22 0h-2v-4h2v4ZM4 10H2V8h2v2Zm18 0h-2V8h2v2ZM8 8H4V6h4v2Zm12 0h-4V6h4v2Zm-4-2H8V4h8v2Z"
              />
            </svg>
            <svg
              v-else
              class="nsplate-info-panel__visibility-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M0 10h2v4H0zm24 0h-2v4h2zm-8 0h-2v2h2zm-6 0H8v4h2zM2 8h2v2H2zm0 8h2v-2H2zm20-8h-2v2h2zm0 8h-2v-2h2zM4 6h4v2H4zm0 12h4v-2H4zM20 6h-4v2h4zM10 4h6v2h-6zM8 20h8v-2H8zm4-12h2v2h-2zm-2 6h4v2h-4zM8 8h2v2H8zm2 2h2v4h-2zm2 2h2v2h-2z"
              />
              <path
                d="M6 6h2v2H6zM4 4h2v2H4zM2 2h2v2H2zm12 12h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2z"
              />
            </svg>
          </button>
          <button
            class="nsplate-info-panel__card-toggle"
            type="button"
            :aria-expanded="
              isLayerExpandable(entry.state) ? isLayerOpen(entry.state.slotId) : undefined
            "
            :aria-controls="
              isLayerExpandable(entry.state) ? getLayerPanelId(entry.state.slotId) : undefined
            "
            :disabled="!isLayerExpandable(entry.state)"
            @click="toggleLayerOpen(entry.state.slotId)"
          >
            <span class="nsplate-info-panel__copy">
              <span class="nsplate-info-panel__title">
                {{
                  localizePlateInfoText(
                    entry.definition.labelKey,
                    entry.definition.fallbackLabel,
                    t
                  )
                }}
              </span>
              <span
                v-if="entry.state.type === 'text'"
                class="nsplate-info-panel__summary"
                :data-empty="!entry.state.text"
              >
                {{ entry.state.text || t(textKeys.placeholder) }}
              </span>
              <span v-else-if="entry.state.type === 'bar48'" class="nsplate-info-panel__summary">
                {{ getBar48Summary(entry.state) }}
              </span>
              <span v-else-if="entry.state.type === 'icon'" class="nsplate-info-panel__summary">
                {{ getIconSummary(entry.state) }}
              </span>
              <span v-else-if="entry.state.type === 'special'" class="nsplate-info-panel__summary">
                {{ getSpecialSummary(entry.state) }}
              </span>
            </span>
            <span class="nsplate-info-panel__right">
              <span class="nsplate-info-panel__arrow" aria-hidden="true" />
            </span>
          </button>
        </header>

        <div
          v-if="entry.state.type === 'text' && isLayerOpen(entry.state.slotId)"
          :id="getLayerPanelId(entry.state.slotId)"
          class="nsplate-info-panel__body"
        >
          <label class="nsplate-info-panel__textarea-label">
            <span>
              {{
                localizePlateInfoText(entry.definition.labelKey, entry.definition.fallbackLabel, t)
              }}
            </span>
            <textarea
              class="nsplate-info-panel__textarea"
              :value="entry.state.text"
              :aria-label="
                localizePlateInfoText(entry.definition.labelKey, entry.definition.fallbackLabel, t)
              "
              :placeholder="t(textKeys.placeholder)"
              @input="setTextLayerValue(entry.state.slotId, $event)"
            />
          </label>
        </div>

        <div
          v-else-if="entry.state.type === 'icon' && isLayerOpen(entry.state.slotId)"
          :id="getLayerPanelId(entry.state.slotId)"
          class="nsplate-info-panel__body"
        >
          <section
            class="nsplate-info-panel__material-section"
            :data-open="isIconMaterialSectionOpen(entry.state.slotId)"
          >
            <button
              class="nsplate-info-panel__material-head"
              type="button"
              :aria-expanded="isIconMaterialSectionOpen(entry.state.slotId)"
              :aria-controls="getIconMaterialSectionPanelId(entry.state.slotId)"
              @click="toggleIconMaterialSection(entry.state.slotId)"
            >
              <span>{{ t(ICON_KEYS.material) }}</span>
              <span class="nsplate-info-panel__material-selected">
                {{ getIconMaterialSelectionLabel(entry.state) }}
              </span>
              <span class="nsplate-info-panel__arrow" aria-hidden="true" />
            </button>

            <div
              v-if="isIconMaterialSectionOpen(entry.state.slotId)"
              :id="getIconMaterialSectionPanelId(entry.state.slotId)"
              class="nsplate-info-panel__material-body"
            >
              <p v-if="isActivityIconLayer(entry.state)" class="nsplate-info-panel__note">
                {{ getIconSelectedCountLabel(entry.state) }}
              </p>

              <div class="nsplate-info-panel__asset-grid">
                <NSPlateAssetCard
                  v-for="asset in getIconMaterialAssets(entry.state)"
                  :key="asset.id"
                  :asset="asset"
                  :active="isIconAssetSelected(entry.state, asset)"
                  prefer-original
                  @select="selectIconMaterial(entry.state, $event)"
                />
              </div>

              <p
                v-if="getIconMaterialAssets(entry.state).length === 0"
                class="nsplate-info-panel__note"
              >
                {{ t(textKeys.noAssets) }}
              </p>
            </div>
          </section>
        </div>

        <div
          v-else-if="entry.state.type === 'special' && isLayerOpen(entry.state.slotId)"
          :id="getLayerPanelId(entry.state.slotId)"
          class="nsplate-info-panel__body"
        >
          <section
            v-for="section in SPECIAL_MATERIAL_SECTIONS"
            :key="section.kind"
            class="nsplate-info-panel__special-section"
            :data-open="isSpecialSectionOpen(entry.state.slotId, section.kind)"
          >
            <button
              class="nsplate-info-panel__special-head"
              type="button"
              :aria-expanded="isSpecialSectionOpen(entry.state.slotId, section.kind)"
              :aria-controls="getSpecialSectionPanelId(entry.state.slotId, section.kind)"
              @click="toggleSpecialSection(entry.state.slotId, section.kind)"
            >
              <span>{{ t(section.labelKey) }}</span>
              <span class="nsplate-info-panel__special-selected">
                {{ getSpecialSelectionLabel(entry.state, section.kind) }}
              </span>
              <span class="nsplate-info-panel__arrow" aria-hidden="true" />
            </button>

            <div
              v-if="isSpecialSectionOpen(entry.state.slotId, section.kind)"
              :id="getSpecialSectionPanelId(entry.state.slotId, section.kind)"
              class="nsplate-info-panel__special-body"
            >
              <p
                v-if="section.kind === 'mask' && !hasSpecialBackground(entry.state)"
                class="nsplate-info-panel__note"
              >
                {{ t(SPECIAL_KEYS.maskNeedsBackground) }}
              </p>

              <div v-else class="nsplate-info-panel__asset-grid">
                <button
                  v-if="section.allowNone"
                  class="nsplate-info-panel__none-card"
                  type="button"
                  :data-active="!getSpecialMaterialValue(entry.state, section.kind)"
                  @click="clearSpecialMaterial(entry.state.slotId, section.kind)"
                >
                  {{ t(section.noneLabelKey) }}
                </button>

                <NSPlateAssetCard
                  v-for="asset in getSpecialMaterialAssets(section.kind)"
                  :key="asset.id"
                  :asset="asset"
                  :active="isSpecialAssetSelected(entry.state, section.kind, asset)"
                  @select="selectSpecialMaterial(entry.state.slotId, section.kind, $event)"
                />
              </div>

              <p
                v-if="
                  !(section.kind === 'mask' && !hasSpecialBackground(entry.state)) &&
                  getSpecialMaterialAssets(section.kind).length === 0
                "
                class="nsplate-info-panel__note"
              >
                {{ t(textKeys.noAssets) }}
              </p>
            </div>
          </section>
        </div>

        <div
          v-else-if="entry.state.type === 'bar48' && isLayerOpen(entry.state.slotId)"
          :id="getLayerPanelId(entry.state.slotId)"
          class="nsplate-info-panel__body"
        >
          <div
            class="nsplate-info-panel__bar-actions"
            role="group"
            :aria-label="t(BAR48_KEYS.actions)"
          >
            <button
              type="button"
              class="nsplate-info-panel__mini-button"
              @click="setBar48All(entry.state.slotId, false)"
            >
              {{ t(BAR48_KEYS.allEmpty) }}
            </button>
            <button
              type="button"
              class="nsplate-info-panel__mini-button"
              @click="setBar48All(entry.state.slotId, true)"
            >
              {{ t(BAR48_KEYS.allOn) }}
            </button>
          </div>

          <div
            class="nsplate-info-panel__bar-grid"
            role="group"
            :aria-label="t(BAR48_KEYS.stateSelect)"
          >
            <button
              v-for="(state, cellIndex) in entry.state.states"
              :key="cellIndex"
              class="nsplate-info-panel__bar-cell"
              type="button"
              :data-active="state === 1"
              :aria-label="getBar48CellLabel(cellIndex, state === 1)"
              :title="getBar48CellLabel(cellIndex, state === 1)"
              @click="toggleBar48Cell(entry.state.slotId, cellIndex)"
            >
              <span class="ns-sr-only">{{ getBar48CellLabel(cellIndex, state === 1) }}</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  </NSPlatePanel>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { textKeys } from '@/config/site'
import {
  localizePlateInfoText,
  nsPlateInfoPresetDefinitions
} from '@/lib/plate/infoLayerFields'
import type { NSPlateInfoDraft } from '@/lib/plate/infoLayers'
import { useNSPlateInfoPanel } from '@/pages/plate/composables/useNSPlateInfoPanel'
import { useLocale } from '@/stores/locale'
import type { NSPlateAssetGroup } from '@/lib/plate/types'
import NSPlateAssetCard from '@/pages/plate/components/NSPlateAssetCard.vue'
import NSPlatePanel from '@/pages/plate/components/NSPlatePanel.vue'

const props = defineProps<{
  modelValue: NSPlateInfoDraft
  assetGroups: NSPlateAssetGroup[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NSPlateInfoDraft]
}>()

const { t } = useLocale()

const {
  ACTION_KEYS,
  BAR48_KEYS,
  ICON_KEYS,
  SPECIAL_KEYS,
  SPECIAL_MATERIAL_SECTIONS,
  activeLayers,
  clearSpecialMaterial,
  getBar48CellLabel,
  getBar48Summary,
  getIconMaterialAssets,
  getIconMaterialSectionPanelId,
  getIconMaterialSelectionLabel,
  getIconSelectedCountLabel,
  getIconSummary,
  getLayerPanelId,
  getLayerVisibilityLabel,
  getSpecialMaterialAssets,
  getSpecialMaterialValue,
  getSpecialSectionPanelId,
  getSpecialSelectionLabel,
  getSpecialSummary,
  hasSpecialBackground,
  isActivityIconLayer,
  isIconAssetSelected,
  isIconMaterialSectionOpen,
  isLayerExpandable,
  isLayerOpen,
  isSpecialAssetSelected,
  isSpecialSectionOpen,
  resetActivePreset,
  selectIconMaterial,
  selectSpecialMaterial,
  setActivePreset,
  setAllLayersEnabled,
  setBar48All,
  setLayerEnabled,
  setTextLayerValue,
  toggleBar48Cell,
  toggleIconMaterialSection,
  toggleLayerOpen,
  toggleSpecialSection
} = useNSPlateInfoPanel({
  modelValue: toRef(props, 'modelValue'),
  assetGroups: toRef(props, 'assetGroups'),
  t,
  updateModelValue: (value) => emit('update:modelValue', value)
})
</script>

<style scoped>
.nsplate-info-panel__field {
  display: grid;
  gap: 6px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 900;
}

.nsplate-info-panel__select {
  min-height: 34px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
}

.nsplate-info-panel__list {
  display: grid;
  gap: 8px;
}

.nsplate-info-panel__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 8px;
}

.nsplate-info-panel__action-button {
  min-height: 30px;
  padding: 0 8px;
  overflow: hidden;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.nsplate-info-panel__action-button:hover {
  border-color: color-mix(in srgb, var(--ns-color-accent-strong) 50%, var(--ns-color-border));
  background: color-mix(in srgb, var(--ns-color-cyan) 10%, var(--ns-color-surface-solid));
}

.nsplate-info-panel__card {
  display: grid;
  overflow: visible;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 78%, transparent);
}

.nsplate-info-panel__card-head {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 7px var(--ns-control-caret-box-right) 7px 9px;
  user-select: none;
}

.nsplate-info-panel__card[data-open='true'] .nsplate-info-panel__card-head {
  position: sticky;
  top: calc(var(--nsplate-config-scroll-padding, 10px) * -1);
  z-index: 3;
  border-bottom: 1px solid color-mix(in srgb, var(--ns-color-border) 76%, transparent);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 94%, var(--ns-color-cyan-soft));
  box-shadow: 0 2px 0 color-mix(in srgb, var(--ns-color-border) 50%, transparent);
}

.nsplate-info-panel__visibility {
  display: inline-grid;
  width: 24px;
  height: 24px;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--ns-color-accent-strong) 82%, var(--ns-color-text));
  cursor: pointer;
}

.nsplate-info-panel__visibility:hover {
  color: var(--ns-color-danger);
}

.nsplate-info-panel__visibility[data-enabled='false'] {
  color: color-mix(in srgb, var(--ns-color-text-muted) 76%, var(--ns-color-border));
}

.nsplate-info-panel__visibility-icon {
  width: 18px;
  height: 18px;
  image-rendering: pixelated;
}

.nsplate-info-panel__card-toggle {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--ns-control-caret-box-size);
  align-items: center;
  min-width: 0;
  width: 100%;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--ns-color-text);
  font: inherit;
  font-size: 13px;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
  user-select: none;
}

.nsplate-info-panel__card-toggle:disabled {
  cursor: default;
}

.nsplate-info-panel__card-toggle:not(:disabled):hover .nsplate-info-panel__title {
  color: var(--ns-color-accent-strong);
}

.nsplate-info-panel__title,
.nsplate-info-panel__summary {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
  white-space: nowrap;
}

.nsplate-info-panel__copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.nsplate-info-panel__summary {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsplate-info-panel__summary[data-empty='true'] {
  opacity: 0.72;
}

.nsplate-info-panel__right {
  display: grid;
  grid-template-columns: var(--ns-control-caret-box-size);
  align-items: center;
  justify-content: end;
  gap: 6px;
  user-select: none;
}

.nsplate-info-panel__arrow {
  display: grid;
  width: var(--ns-control-caret-box-size);
  height: var(--ns-control-caret-box-size);
  place-items: center;
  color: color-mix(in srgb, var(--ns-color-text) 58%, var(--ns-color-text-muted));
  image-rendering: pixelated;
}

.nsplate-info-panel__arrow::before {
  display: block;
  width: 16px;
  height: 20px;
  background:
    linear-gradient(currentColor 0 0) 2px 0 / 4px 4px no-repeat,
    linear-gradient(currentColor 0 0) 6px 4px / 4px 4px no-repeat,
    linear-gradient(currentColor 0 0) 10px 8px / 4px 4px no-repeat,
    linear-gradient(currentColor 0 0) 6px 12px / 4px 4px no-repeat,
    linear-gradient(currentColor 0 0) 2px 16px / 4px 4px no-repeat;
  content: '';
}

.nsplate-info-panel__card[data-open='true'] .nsplate-info-panel__arrow {
  color: var(--ns-color-accent-strong);
}

.nsplate-info-panel__card[data-open='true'] .nsplate-info-panel__arrow::before,
.nsplate-info-panel__special-section[data-open='true'] .nsplate-info-panel__arrow::before,
.nsplate-info-panel__material-section[data-open='true'] .nsplate-info-panel__arrow::before {
  width: 20px;
  height: 16px;
  background:
    linear-gradient(currentColor 0 0) 0 2px / 4px 4px no-repeat,
    linear-gradient(currentColor 0 0) 4px 6px / 4px 4px no-repeat,
    linear-gradient(currentColor 0 0) 8px 10px / 4px 4px no-repeat,
    linear-gradient(currentColor 0 0) 12px 6px / 4px 4px no-repeat,
    linear-gradient(currentColor 0 0) 16px 2px / 4px 4px no-repeat;
}

.nsplate-info-panel__card[data-expandable='false'] .nsplate-info-panel__arrow {
  visibility: hidden;
}

.nsplate-info-panel__body {
  display: grid;
  gap: 8px;
  padding: 6px 7px 8px;
}

.nsplate-info-panel__special-section,
.nsplate-info-panel__material-section {
  display: grid;
  overflow: visible;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 68%, transparent);
}

.nsplate-info-panel__special-head,
.nsplate-info-panel__material-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(72px, 116px) var(--ns-control-caret-box-size);
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 32px;
  padding: 6px var(--ns-control-caret-box-right) 6px 8px;
  border: 0;
  background: transparent;
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
  user-select: none;
}

.nsplate-info-panel__special-section[data-open='true'] .nsplate-info-panel__special-head,
.nsplate-info-panel__material-section[data-open='true'] .nsplate-info-panel__material-head {
  position: sticky;
  top: calc(var(--nsplate-config-scroll-padding, 10px) * -1);
  z-index: 4;
  border-bottom: 1px solid color-mix(in srgb, var(--ns-color-border) 76%, transparent);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 96%, var(--ns-color-cyan-soft));
  box-shadow: 0 2px 0 color-mix(in srgb, var(--ns-color-border) 50%, transparent);
}

.nsplate-info-panel__special-head:hover,
.nsplate-info-panel__material-head:hover {
  background: color-mix(in srgb, var(--ns-color-cyan) 11%, transparent);
}

.nsplate-info-panel__special-head > span:first-child,
.nsplate-info-panel__material-head > span:first-child,
.nsplate-info-panel__special-selected,
.nsplate-info-panel__material-selected {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsplate-info-panel__special-selected,
.nsplate-info-panel__material-selected {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
  text-align: right;
}

.nsplate-info-panel__special-section[data-open='true'] .nsplate-info-panel__special-selected,
.nsplate-info-panel__material-section[data-open='true'] .nsplate-info-panel__material-selected {
  color: var(--ns-color-accent-strong);
}

.nsplate-info-panel__special-body,
.nsplate-info-panel__material-body {
  display: grid;
  gap: 7px;
  padding: 6px 7px 8px;
}

.nsplate-info-panel__asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: var(--nsplate-section-body-gap);
  align-content: start;
}

.nsplate-info-panel__none-card {
  display: grid;
  min-height: 72px;
  place-items: center;
  padding: 7px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 76%, transparent);
  color: var(--ns-color-text-muted);
  font: inherit;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.25;
  cursor: pointer;
}

.nsplate-info-panel__none-card:hover {
  border-color: color-mix(in srgb, var(--ns-color-accent-strong) 48%, var(--ns-color-border));
  background: color-mix(in srgb, var(--ns-color-cyan) 9%, var(--ns-color-surface-solid));
}

.nsplate-info-panel__none-card[data-active='true'] {
  border-color: var(--ns-color-accent-strong);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 90%, var(--ns-color-cyan-soft));
  color: var(--ns-color-text);
  box-shadow:
    inset 0 0 0 2px color-mix(in srgb, var(--ns-color-accent-strong) 78%, transparent),
    3px 3px 0 color-mix(in srgb, var(--ns-color-accent-strong) 22%, transparent);
}

.nsplate-info-panel__note {
  margin: 0;
  padding: 5px 2px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
}

.nsplate-info-panel__textarea-label {
  display: grid;
  gap: 6px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 900;
}

.nsplate-info-panel__textarea {
  min-height: 72px;
  resize: vertical;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font: inherit;
  line-height: 1.5;
}

.nsplate-info-panel__bar-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.nsplate-info-panel__mini-button {
  min-height: 30px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.nsplate-info-panel__mini-button:hover {
  border-color: color-mix(in srgb, var(--ns-color-accent-strong) 50%, var(--ns-color-border));
  background: color-mix(in srgb, var(--ns-color-cyan) 10%, var(--ns-color-surface-solid));
}

.nsplate-info-panel__bar-grid {
  display: grid;
  grid-template-columns: repeat(24, minmax(8px, 1fr));
  gap: 3px;
  padding: 7px;
  border: 1px solid var(--ns-color-border);
  background: color-mix(in srgb, var(--ns-color-surface) 82%, var(--ns-color-bg-soft));
}

.nsplate-info-panel__bar-cell {
  display: block;
  aspect-ratio: 1 / 1;
  min-width: 0;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--ns-color-border) 82%, transparent);
  background: var(--ns-color-surface-solid);
  cursor: pointer;
}

.nsplate-info-panel__bar-cell[data-active='true'] {
  border-color: var(--ns-color-accent-strong);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--ns-color-accent) 74%, white),
      var(--ns-color-cyan)
    ),
    var(--ns-color-accent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ns-color-bg) 58%, transparent);
}

.nsplate-info-panel__bar-cell:hover {
  border-color: var(--ns-color-accent-strong);
}

@media (max-width: 560px) {
  .nsplate-info-panel__bar-grid {
    grid-template-columns: repeat(12, minmax(12px, 1fr));
  }
}
</style>
