<template>
  <NSPlatePanel :title="t(textKeys.nsplatePresets)">
    <div class="nsplate-preset-selects">
      <label v-for="group in groups" :key="group.kind" class="nsplate-preset-select">
        <span class="nsplate-preset-select__control">
          <button
            class="nsplate-preset-select__step nsplate-preset-select__step--previous"
            type="button"
            :disabled="group.presets.length === 0"
            :aria-label="`${t(textKeys.previousPreset)} ${group.label}`"
            @click="stepPreset(group, -1)"
          />
          <select
            :value="selectedValueForGroup(group)"
            :disabled="group.presets.length === 0"
            :aria-label="`${t(textKeys.nsplatePresets)} ${group.label}`"
            @change="onPresetChange"
          >
            <option value="" disabled>{{ t(textKeys.selectPreset) }}</option>
            <option v-for="preset in group.presets" :key="preset.id" :value="preset.id">
              {{ preset.label }}
            </option>
          </select>
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
import { textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'
import type { NSPlatePresetGroup } from '@/lib/plate/types'
import NSPlatePanel from '@/pages/plate/components/NSPlatePanel.vue'

const props = defineProps<{
  groups: NSPlatePresetGroup[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'update:selectedId': [value: string]
}>()

const { t } = useLocale()

function selectedValueForGroup(group: NSPlatePresetGroup) {
  return group.presets.some((preset) => preset.id === props.selectedId)
    ? (props.selectedId ?? '')
    : ''
}

function onPresetChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value

  if (value) {
    emit('update:selectedId', value)
  }
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
.nsplate-preset-select select {
  min-height: 36px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background-color: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 850;
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

.nsplate-preset-select select {
  width: 100%;
  min-width: 0;
  padding: 0 var(--ns-select-padding-end) 0 var(--ns-select-padding-start);
  appearance: none;
  -webkit-appearance: none;
  background-image: var(--ns-select-caret-icon);
  background-position: right var(--ns-select-caret-right) center;
  background-repeat: no-repeat;
  background-size: var(--ns-select-caret-size) var(--ns-select-caret-size);
}

.nsplate-preset-select__step:focus-visible,
.nsplate-preset-select select:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ns-color-accent) 52%, transparent);
  outline-offset: 2px;
}
</style>
