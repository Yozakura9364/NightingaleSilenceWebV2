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
          <label class="nsplate-info-panel__toggle">
            <input
              type="checkbox"
              :checked="entry.state.enabled"
              @change="setLayerEnabled(entry.state.slotId, $event)"
            />
          </label>
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
              <small>{{ t(getNSPlateInfoLayerTypeKey(entry.state.type)) }}</small>
              <span
                class="nsplate-info-panel__arrow"
                aria-hidden="true"
              />
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
              <span
                class="nsplate-info-panel__arrow"
                aria-hidden="true"
              />
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
              <span
                class="nsplate-info-panel__arrow"
                aria-hidden="true"
              />
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
import { computed, ref } from 'vue'
import { textKeys } from '@/config/site'
import {
  getNSPlateInfoAssetItemId,
  normalizeNSPlateInfoAssetValues,
  nsPlateInfoAssetMatchesValue
} from '@/lib/plate/infoLayerAssetMatching'
import {
  localizePlateInfoText,
  nsPlateInfoPresetDefinitions,
  type NSPlateInfoPresetId
} from '@/lib/plate/infoLayerFields'
import {
  NSPLATE_INFO_ACTIVITY_ICON_CATEGORY,
  NSPLATE_INFO_SPECIAL_BG_CATEGORY,
  NSPLATE_INFO_SPECIAL_DEFAULT_SYMBOL_ITEM_ID,
  NSPLATE_INFO_SPECIAL_MASK_CATEGORY,
  NSPLATE_INFO_SPECIAL_SYMBOL_CATEGORY,
  nsPlateInfoGraphicRenderDefinitions,
  type NSPlateInfoIconRenderDefinition
} from '@/lib/plate/infoLayerRenderDefinitions'
import {
  NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT,
  getNSPlateInfoActiveLayers,
  getNSPlateInfoLayerTypeKey,
  resetNSPlateInfoActivePreset,
  setNSPlateInfoBar48All,
  setNSPlateInfoActivePreset,
  setNSPlateInfoActivePresetLayersEnabled,
  toggleNSPlateInfoActivityIconMaterial,
  toggleNSPlateInfoBar48Cell,
  updateNSPlateInfoIconMaterial,
  updateNSPlateInfoLayerEnabled,
  updateNSPlateInfoSpecialMaterial,
  updateNSPlateInfoText,
  type NSPlateInfoLayerState,
  type NSPlateInfoBar48LayerState,
  type NSPlateInfoDraft,
  type NSPlateInfoIconLayerState,
  type NSPlateInfoSpecialLayerState,
  type NSPlateInfoSpecialMaterialKind
} from '@/lib/plate/infoLayers'
import { useLocale } from '@/stores/locale'
import type { NSPlateAssetGroup, NSPlateAssetSummary } from '@/lib/plate/types'
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

const BAR48_KEYS = {
  actions: 'plate.info.bar48.actions',
  allEmpty: 'plate.info.bar48.allEmpty',
  allOn: 'plate.info.bar48.allOn',
  stateSelect: 'plate.info.bar48.stateSelect',
  cellPrefix: 'plate.info.bar48.cellPrefix',
  cellSeparator: 'plate.info.bar48.cellSeparator',
  cellOn: 'plate.info.bar48.cellOn',
  cellOff: 'plate.info.bar48.cellOff'
} as const

const ICON_KEYS = {
  material: 'plate.info.icon.material',
  selectedCount: 'plate.info.icon.selectedCount'
} as const

const SPECIAL_KEYS = {
  background: 'plate.info.special.background',
  mask: 'plate.info.special.mask',
  symbol: 'plate.info.special.symbol',
  noBackground: 'plate.info.special.noBackground',
  noMask: 'plate.info.special.noMask',
  maskNeedsBackground: 'plate.info.special.maskNeedsBackground'
} as const

const ACTION_KEYS = {
  group: 'plate.info.actions.group',
  showAll: 'plate.info.actions.showAll',
  hideAll: 'plate.info.actions.hideAll',
  reset: 'plate.info.actions.reset',
  resetConfirm: 'plate.info.actions.resetConfirm'
} as const

const SPECIAL_MATERIAL_SECTIONS = [
  {
    kind: 'background',
    category: NSPLATE_INFO_SPECIAL_BG_CATEGORY,
    labelKey: SPECIAL_KEYS.background,
    noneLabelKey: SPECIAL_KEYS.noBackground,
    allowNone: true
  },
  {
    kind: 'mask',
    category: NSPLATE_INFO_SPECIAL_MASK_CATEGORY,
    labelKey: SPECIAL_KEYS.mask,
    noneLabelKey: SPECIAL_KEYS.noMask,
    allowNone: true
  },
  {
    kind: 'symbol',
    category: NSPLATE_INFO_SPECIAL_SYMBOL_CATEGORY,
    labelKey: SPECIAL_KEYS.symbol,
    noneLabelKey: '',
    allowNone: false
  }
] satisfies {
  kind: NSPlateInfoSpecialMaterialKind
  category: string
  labelKey: string
  noneLabelKey: string
  allowNone: boolean
}[]

const activeLayers = computed(() => getNSPlateInfoActiveLayers(props.modelValue))
const openLayerIds = ref<Record<string, boolean>>({})
const openIconMaterialSectionIds = ref<Record<string, boolean>>({})
const openSpecialSectionIds = ref<Record<string, boolean>>({})

function setActivePreset(event: Event) {
  emit(
    'update:modelValue',
    setNSPlateInfoActivePreset(
      props.modelValue,
      (event.target as HTMLSelectElement).value as NSPlateInfoPresetId
    )
  )
}

function getLayerOpenKey(slotId: string) {
  return `${props.modelValue.activePresetId}:${slotId}`
}

function getLayerPanelId(slotId: string) {
  return `nsplate-info-layer-${props.modelValue.activePresetId}-${slotId}`
}

function isLayerOpen(slotId: string) {
  return openLayerIds.value[getLayerOpenKey(slotId)] === true
}

function isLayerExpandable(state: NSPlateInfoLayerState) {
  return (
    state.type === 'text' ||
    state.type === 'icon' ||
    state.type === 'bar48' ||
    state.type === 'special'
  )
}

function toggleLayerOpen(slotId: string) {
  const key = getLayerOpenKey(slotId)
  openLayerIds.value = {
    ...openLayerIds.value,
    [key]: !openLayerIds.value[key]
  }
}

function setLayerEnabled(slotId: string, event: Event) {
  emit(
    'update:modelValue',
    updateNSPlateInfoLayerEnabled(
      props.modelValue,
      slotId,
      (event.target as HTMLInputElement).checked
    )
  )
}

function setTextLayerValue(slotId: string, event: Event) {
  emit(
    'update:modelValue',
    updateNSPlateInfoText(props.modelValue, slotId, (event.target as HTMLTextAreaElement).value)
  )
}

function toggleBar48Cell(slotId: string, cellIndex: number) {
  emit('update:modelValue', toggleNSPlateInfoBar48Cell(props.modelValue, slotId, cellIndex))
}

function setBar48All(slotId: string, enabled: boolean) {
  emit('update:modelValue', setNSPlateInfoBar48All(props.modelValue, slotId, enabled))
}

function setAllLayersEnabled(enabled: boolean) {
  emit('update:modelValue', setNSPlateInfoActivePresetLayersEnabled(props.modelValue, enabled))
}

function resetActivePreset() {
  if (!window.confirm(t(ACTION_KEYS.resetConfirm))) {
    return
  }

  emit('update:modelValue', resetNSPlateInfoActivePreset(props.modelValue))
}

function getIconMaterialSectionOpenKey(slotId: string) {
  return `${props.modelValue.activePresetId}:${slotId}:icon-material`
}

function getIconMaterialSectionPanelId(slotId: string) {
  return `nsplate-info-icon-material-${props.modelValue.activePresetId}-${slotId}`
}

function isIconMaterialSectionOpen(slotId: string) {
  return openIconMaterialSectionIds.value[getIconMaterialSectionOpenKey(slotId)] === true
}

function toggleIconMaterialSection(slotId: string) {
  const key = getIconMaterialSectionOpenKey(slotId)
  openIconMaterialSectionIds.value = {
    ...openIconMaterialSectionIds.value,
    [key]: !openIconMaterialSectionIds.value[key]
  }
}

function getIconRenderDefinition(slotId: string): NSPlateInfoIconRenderDefinition | null {
  const definition = nsPlateInfoGraphicRenderDefinitions[props.modelValue.activePresetId].find(
    (item) => item.slotId === slotId
  )

  return definition?.type === 'icon' ? definition : null
}

function isIconRenderDefinitionActivity(definition: NSPlateInfoIconRenderDefinition | null) {
  return (
    definition?.isActivity === true || definition?.sourceCat === NSPLATE_INFO_ACTIVITY_ICON_CATEGORY
  )
}

function isActivityIconLayer(state: NSPlateInfoIconLayerState) {
  return isIconRenderDefinitionActivity(getIconRenderDefinition(state.slotId))
}

function getIconMaterialAssets(state: NSPlateInfoIconLayerState) {
  const definition = getIconRenderDefinition(state.slotId)

  if (!definition) {
    return []
  }

  return (
    props.assetGroups.find(
      (group) => group.scope === 'nameplate' && group.category === definition.sourceCat
    )?.assets ?? []
  )
}

function getIconSelectedValues(state: NSPlateInfoIconLayerState) {
  const definition = getIconRenderDefinition(state.slotId)

  if (isIconRenderDefinitionActivity(definition)) {
    return normalizeNSPlateInfoAssetValues(
      state.itemIds.length > 0
        ? state.itemIds
        : state.itemId
          ? [state.itemId]
          : definition?.itemIds.length
            ? definition.itemIds
            : definition?.itemId
              ? [definition.itemId]
              : [],
      NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT
    )
  }

  const value = state.itemId || definition?.itemId || ''
  return value ? [value] : []
}

function getIconSummary(state: NSPlateInfoIconLayerState) {
  return getIconMaterialSelectionLabel(state)
}

function getIconMaterialSelectionLabel(state: NSPlateInfoIconLayerState) {
  const selectedValues = getIconSelectedValues(state)

  if (isActivityIconLayer(state)) {
    return getIconSelectedCountText(selectedValues.length)
  }

  const selectedValue = selectedValues[0] ?? ''
  const asset = selectedValue ? findIconAssetByValue(state, selectedValue) : null

  return asset?.label ?? selectedValue ?? t(textKeys.notSelected)
}

function getIconSelectedCountLabel(state: NSPlateInfoIconLayerState) {
  return getIconSelectedCountText(getIconSelectedValues(state).length)
}

function getIconSelectedCountText(selectedCount: number) {
  return `${t(ICON_KEYS.selectedCount)} ${selectedCount}/${NSPLATE_INFO_ACTIVITY_ICON_MAX_COUNT}`
}

function selectIconMaterial(state: NSPlateInfoIconLayerState, asset: NSPlateAssetSummary) {
  const selectedValue = getIconSelectedValues(state).find((value) =>
    nsPlateInfoAssetMatchesValue(asset, value)
  )
  const itemId = selectedValue || getNSPlateInfoAssetItemId(asset)

  emit(
    'update:modelValue',
    isActivityIconLayer(state)
      ? toggleNSPlateInfoActivityIconMaterial(props.modelValue, state.slotId, itemId)
      : updateNSPlateInfoIconMaterial(props.modelValue, state.slotId, itemId)
  )
}

function isIconAssetSelected(state: NSPlateInfoIconLayerState, asset: NSPlateAssetSummary) {
  return getIconSelectedValues(state).some((value) => nsPlateInfoAssetMatchesValue(asset, value))
}

function findIconAssetByValue(state: NSPlateInfoIconLayerState, value: string) {
  return getIconMaterialAssets(state).find((asset) => nsPlateInfoAssetMatchesValue(asset, value))
}

function getSpecialSectionOpenKey(slotId: string, kind: NSPlateInfoSpecialMaterialKind) {
  return `${props.modelValue.activePresetId}:${slotId}:${kind}`
}

function getSpecialSectionPanelId(slotId: string, kind: NSPlateInfoSpecialMaterialKind) {
  return `nsplate-info-special-${props.modelValue.activePresetId}-${slotId}-${kind}`
}

function isSpecialSectionOpen(slotId: string, kind: NSPlateInfoSpecialMaterialKind) {
  return openSpecialSectionIds.value[getSpecialSectionOpenKey(slotId, kind)] === true
}

function toggleSpecialSection(slotId: string, kind: NSPlateInfoSpecialMaterialKind) {
  const key = getSpecialSectionOpenKey(slotId, kind)
  openSpecialSectionIds.value = {
    ...openSpecialSectionIds.value,
    [key]: !openSpecialSectionIds.value[key]
  }
}

function getSpecialMaterialAssets(kind: NSPlateInfoSpecialMaterialKind) {
  const section = SPECIAL_MATERIAL_SECTIONS.find((item) => item.kind === kind)

  if (!section) {
    return []
  }

  return (
    props.assetGroups.find(
      (group) => group.scope === 'nameplate' && group.category === section.category
    )?.assets ?? []
  )
}

function getSpecialMaterialValue(
  state: NSPlateInfoSpecialLayerState,
  kind: NSPlateInfoSpecialMaterialKind
) {
  if (kind === 'background') {
    return state.bgItemId
  }

  if (kind === 'mask') {
    return state.maskItemId
  }

  return state.symbolItemId || NSPLATE_INFO_SPECIAL_DEFAULT_SYMBOL_ITEM_ID
}

function getSpecialSummary(state: NSPlateInfoSpecialLayerState) {
  return getSpecialSelectionLabel(state, 'symbol')
}

function getSpecialSelectionLabel(
  state: NSPlateInfoSpecialLayerState,
  kind: NSPlateInfoSpecialMaterialKind
) {
  const value = getSpecialMaterialValue(state, kind)

  if (!value && kind === 'background') {
    return t(SPECIAL_KEYS.noBackground)
  }

  if (!value && kind === 'mask') {
    return t(SPECIAL_KEYS.noMask)
  }

  const asset = findSpecialAssetByValue(kind, value)
  return asset?.label ?? value ?? t(textKeys.notSelected)
}

function hasSpecialBackground(state: NSPlateInfoSpecialLayerState) {
  return getSpecialMaterialValue(state, 'background').length > 0
}

function clearSpecialMaterial(slotId: string, kind: NSPlateInfoSpecialMaterialKind) {
  if (kind === 'symbol') {
    return
  }

  emit('update:modelValue', updateNSPlateInfoSpecialMaterial(props.modelValue, slotId, kind, ''))
}

function selectSpecialMaterial(
  slotId: string,
  kind: NSPlateInfoSpecialMaterialKind,
  asset: NSPlateAssetSummary
) {
  emit(
    'update:modelValue',
    updateNSPlateInfoSpecialMaterial(props.modelValue, slotId, kind, getSpecialAssetItemId(asset))
  )
}

function isSpecialAssetSelected(
  state: NSPlateInfoSpecialLayerState,
  kind: NSPlateInfoSpecialMaterialKind,
  asset: NSPlateAssetSummary
) {
  return specialAssetMatchesValue(asset, getSpecialMaterialValue(state, kind))
}

function findSpecialAssetByValue(kind: NSPlateInfoSpecialMaterialKind, value: string) {
  return getSpecialMaterialAssets(kind).find((asset) => specialAssetMatchesValue(asset, value))
}

function specialAssetMatchesValue(asset: NSPlateAssetSummary, value: string) {
  return nsPlateInfoAssetMatchesValue(asset, value)
}

function getSpecialAssetItemId(asset: NSPlateAssetSummary) {
  return getNSPlateInfoAssetItemId(asset)
}

function getBar48Summary(state: NSPlateInfoBar48LayerState) {
  return `${state.states.filter((item) => item === 1).length}/${state.states.length}`
}

function getBar48CellLabel(cellIndex: number, enabled: boolean) {
  return `${t(BAR48_KEYS.cellPrefix)}${cellIndex + 1}${t(BAR48_KEYS.cellSeparator)}${t(enabled ? BAR48_KEYS.cellOn : BAR48_KEYS.cellOff)}`
}
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

.nsplate-info-panel__card-head small {
  flex: 0 0 auto;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 900;
  user-select: none;
}

.nsplate-info-panel__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nsplate-info-panel__toggle input {
  flex: 0 0 auto;
}

.nsplate-info-panel__card-toggle {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(58px, auto);
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
  grid-template-columns: minmax(0, 1fr) var(--ns-control-caret-box-size);
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
