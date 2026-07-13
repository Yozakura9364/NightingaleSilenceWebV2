<template>
  <NSPlatePanel :title="t(textKeys.nsplatePresets)">
    <div ref="rootRef" class="nsplate-preset-selects">
      <label v-for="group in groups" :key="group.kind" class="nsplate-preset-select">
        <span class="nsplate-preset-select__control">
          <button
            class="nsplate-preset-select__step nsplate-preset-select__step--previous"
            type="button"
            :disabled="group.presets.length === 0"
            :aria-label="`${t(textKeys.previousPreset)} ${group.label}`"
            @click="stepPreset(group, -1)"
          />
          <span class="nsplate-preset-combo" :data-open="isPresetMenuOpen(group)">
            <button
              class="nsplate-preset-combo__button"
              type="button"
              :disabled="group.presets.length === 0"
              :aria-label="`${t(textKeys.nsplatePresets)} ${group.label}`"
              :aria-expanded="isPresetMenuOpen(group)"
              :aria-controls="presetMenuId(group)"
              @click="togglePresetMenu(group)"
              @keydown.esc.prevent="closePresetMenu"
            >
              <span>{{ selectedLabelForGroup(group) }}</span>
              <span class="nsplate-preset-combo__arrow" aria-hidden="true" />
            </button>

            <div
              v-if="isPresetMenuOpen(group)"
              :id="presetMenuId(group)"
              class="nsplate-preset-combo__menu"
              role="listbox"
              @click.stop
              @keydown.esc.prevent="closePresetMenu"
            >
              <label class="nsplate-preset-search">
                <span class="nsplate-preset-search__label">
                  {{ t(textKeys.nsplateSearchPresets) }}
                </span>
                <span class="nsplate-preset-search__control">
                  <input
                    :value="presetSearchForGroup(group)"
                    type="search"
                    :placeholder="t(textKeys.nsplateSearchPresets)"
                    :aria-label="`${group.label} ${t(textKeys.nsplateSearchPresets)}`"
                    @input="updatePresetSearch(group, $event)"
                    @keydown="handlePresetSearchKeydown"
                  />
                  <button
                    v-if="presetSearchForGroup(group)"
                    class="nsplate-preset-search__clear"
                    type="button"
                    :aria-label="t(textKeys.nsplateClearSearch)"
                    @click="clearPresetSearch(group)"
                  />
                </span>
              </label>

              <p
                v-if="filteredPresetsForGroup(group).length === 0"
                class="nsplate-preset-combo__empty"
              >
                {{ t(textKeys.nsplateSearchNoResults) }}
              </p>

              <template v-else>
                <button
                  v-for="preset in filteredPresetsForGroup(group)"
                  :key="preset.id"
                  class="nsplate-preset-combo__option"
                  type="button"
                  role="option"
                  :aria-selected="preset.id === selectedId"
                  :data-active="preset.id === selectedId"
                  @click="selectPreset(preset.id)"
                >
                  {{ preset.label }}
                </button>
              </template>
            </div>
          </span>
          <button
            class="nsplate-preset-select__step nsplate-preset-select__step--next"
            type="button"
            :disabled="group.presets.length === 0"
            :aria-label="`${t(textKeys.nextPreset)} ${group.label}`"
            @click="stepPreset(group, 1)"
          />
        </span>
      </label>
    </div>
  </NSPlatePanel>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { plateTextKeys as textKeys } from '@/locales/keys/plate'
import { useLocale } from '@/stores/locale'
import type { NSPlatePresetGroup, NSPlatePresetSummary } from '@/lib/plate/types'
import NSPlatePanel from '@/pages/plate/components/NSPlatePanel.vue'

const props = defineProps<{
  groups: NSPlatePresetGroup[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'update:selectedId': [value: string]
}>()

const { t } = useLocale()
const rootRef = ref<HTMLElement | null>(null)
const openGroupKind = ref<string | null>(null)
const presetSearchByGroup = ref<Record<string, string>>({})

function selectedPresetForGroup(group: NSPlatePresetGroup) {
  return group.presets.find((preset) => preset.id === props.selectedId) ?? null
}

function selectedLabelForGroup(group: NSPlatePresetGroup) {
  return selectedPresetForGroup(group)?.label ?? t(textKeys.selectPreset)
}

function presetMenuId(group: NSPlatePresetGroup) {
  return `nsplate-preset-menu-${group.kind}`
}

function isPresetMenuOpen(group: NSPlatePresetGroup) {
  return openGroupKind.value === group.kind
}

function togglePresetMenu(group: NSPlatePresetGroup) {
  openGroupKind.value = isPresetMenuOpen(group) ? null : group.kind
}

function closePresetMenu() {
  openGroupKind.value = null
}

function selectPreset(presetId: string) {
  emit('update:selectedId', presetId)
  closePresetMenu()
}

function presetSearchForGroup(group: NSPlatePresetGroup) {
  return presetSearchByGroup.value[group.kind] ?? ''
}

function updatePresetSearch(group: NSPlatePresetGroup, event: Event) {
  presetSearchByGroup.value = {
    ...presetSearchByGroup.value,
    [group.kind]: (event.target as HTMLInputElement).value
  }
}

function handlePresetSearchKeydown(event: KeyboardEvent) {
  event.stopPropagation()

  if (event.key === 'Escape') {
    event.preventDefault()
    closePresetMenu()
  }
}

function clearPresetSearch(group: NSPlatePresetGroup) {
  presetSearchByGroup.value = {
    ...presetSearchByGroup.value,
    [group.kind]: ''
  }
}

function filteredPresetsForGroup(group: NSPlatePresetGroup) {
  const query = normalizeSearchText(presetSearchForGroup(group))

  if (!query) {
    return group.presets
  }

  return group.presets.filter((preset) => createPresetSearchText(preset).includes(query))
}

function createPresetSearchText(preset: NSPlatePresetSummary) {
  const rawNames = preset.raw.names ? Object.values(preset.raw.names) : []

  return normalizeSearchText([preset.id, preset.label, preset.raw.name, ...rawNames].join(' '))
}

function normalizeSearchText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target

  if (target instanceof Node && rootRef.value?.contains(target)) {
    return
  }

  closePresetMenu()
}

function stepPreset(group: NSPlatePresetGroup, direction: -1 | 1) {
  if (!group.presets.length) {
    return
  }

  const currentIndex = group.presets.findIndex((preset) => preset.id === props.selectedId)
  const nextIndex =
    currentIndex >= 0
      ? (currentIndex + direction + group.presets.length) % group.presets.length
      : direction > 0
        ? 0
        : group.presets.length - 1
  const preset = group.presets[nextIndex]

  if (preset) {
    emit('update:selectedId', preset.id)
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<style scoped>
.nsplate-preset-selects {
  display: grid;
  gap: var(--nsplate-control-stack-gap);
}

.nsplate-preset-select {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.nsplate-preset-select__control {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 34px;
  gap: 6px;
  min-width: 0;
}

.nsplate-preset-select__step,
.nsplate-preset-combo__button {
  min-height: 36px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background-color: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 850;
}

.nsplate-preset-combo {
  position: relative;
  min-width: 0;
}

.nsplate-preset-select__step {
  display: inline-grid;
  place-items: center;
  padding: 0;
  box-shadow: 2px 2px 0 color-mix(in srgb, var(--ns-color-border-strong) 28%, transparent);
  cursor: pointer;
}

.nsplate-preset-select__step:hover:not(:disabled) {
  border-color: var(--ns-color-accent);
  color: var(--ns-color-accent);
}

.nsplate-preset-select__step:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 color-mix(in srgb, var(--ns-color-border-strong) 28%, transparent);
}

.nsplate-preset-select__step:disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.nsplate-preset-combo__button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--ns-control-caret-box-size);
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 0 var(--ns-control-caret-box-right) 0 var(--ns-select-padding-start);
  text-align: left;
  cursor: pointer;
}

.nsplate-preset-combo__button:disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.nsplate-preset-combo__button span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsplate-preset-combo__button:hover:not(:disabled) {
  border-color: var(--ns-color-accent);
}

.nsplate-preset-combo__arrow {
  display: grid;
  width: var(--ns-control-caret-box-size);
  height: var(--ns-control-caret-box-size);
  place-items: center;
  color: color-mix(in srgb, var(--ns-color-text) 70%, var(--ns-color-text-muted));
}

.nsplate-preset-combo__arrow::before {
  width: 15px;
  height: 13px;
  background:
    linear-gradient(currentColor 0 0) 0 2px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 3px 5px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 6px 8px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 9px 5px / 3px 3px no-repeat,
    linear-gradient(currentColor 0 0) 12px 2px / 3px 3px no-repeat;
  content: '';
}

.nsplate-preset-combo[data-open='true'] .nsplate-preset-combo__arrow::before {
  transform: rotate(180deg);
}

.nsplate-preset-combo__menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  left: 0;
  z-index: 20;
  display: grid;
  max-height: min(340px, 48vh);
  gap: 4px;
  padding: 6px;
  overflow: auto;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: var(--ns-color-surface-solid);
  box-shadow:
    3px 3px 0 color-mix(in srgb, var(--ns-color-border-strong) 26%, transparent),
    0 8px 22px color-mix(in srgb, var(--ns-color-border-strong) 18%, transparent);
}

.nsplate-preset-search {
  position: sticky;
  top: -6px;
  z-index: 1;
  display: grid;
  padding: 0 0 4px;
  background: var(--ns-color-surface-solid);
}

.nsplate-preset-search__label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.nsplate-preset-search__control {
  position: relative;
  display: grid;
}

.nsplate-preset-search input {
  width: 100%;
  min-width: 0;
  height: 30px;
  padding: 0 32px 0 8px;
  border: 1px solid color-mix(in srgb, var(--ns-color-border) 82%, transparent);
  border-radius: var(--ns-radius-xs);
  background: color-mix(in srgb, var(--ns-color-bg) 52%, var(--ns-color-surface-solid));
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 760;
}

.nsplate-preset-search input::placeholder {
  color: var(--ns-color-text-muted);
  opacity: 0.78;
}

.nsplate-preset-search input:focus-visible {
  border-color: var(--ns-color-accent);
  outline: 2px solid color-mix(in srgb, var(--ns-color-accent) 35%, transparent);
  outline-offset: 1px;
}

.nsplate-preset-search__clear {
  position: absolute;
  top: 5px;
  right: 6px;
  display: grid;
  width: 20px;
  height: 20px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--ns-color-text-muted);
  cursor: pointer;
}

.nsplate-preset-search__clear::before,
.nsplate-preset-search__clear::after {
  grid-area: 1 / 1;
  width: 12px;
  height: 2px;
  background: currentColor;
  content: '';
}

.nsplate-preset-search__clear::before {
  transform: rotate(45deg);
}

.nsplate-preset-search__clear::after {
  transform: rotate(-45deg);
}

.nsplate-preset-search__clear:hover {
  color: var(--ns-color-accent-strong);
}

.nsplate-preset-combo__option {
  width: 100%;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid transparent;
  border-radius: var(--ns-radius-xs);
  background: transparent;
  color: var(--ns-color-text);
  font: inherit;
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}

.nsplate-preset-combo__option:hover,
.nsplate-preset-combo__option[data-active='true'] {
  border-color: color-mix(in srgb, var(--ns-color-accent-strong) 48%, var(--ns-color-border));
  background: color-mix(in srgb, var(--ns-color-cyan) 11%, transparent);
}

.nsplate-preset-combo__option[data-active='true'] {
  color: var(--ns-color-accent-strong);
}

.nsplate-preset-combo__empty {
  margin: 0;
  padding: 7px 8px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 800;
}

.nsplate-preset-select__step::before {
  content: '';
  display: block;
  width: 10px;
  height: 12px;
  background:
    linear-gradient(currentColor 0 0) 2px 1px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 4px 3px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 5px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 4px 7px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 2px 9px / 2px 2px no-repeat;
  image-rendering: pixelated;
}

.nsplate-preset-select__step--previous::before {
  transform: scaleX(-1);
}

.nsplate-preset-select__step--next::before {
  transform: none;
}

.nsplate-preset-select__step:focus-visible,
.nsplate-preset-combo__button:focus-visible,
.nsplate-preset-combo__option:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ns-color-accent) 52%, transparent);
  outline-offset: 2px;
}
</style>
