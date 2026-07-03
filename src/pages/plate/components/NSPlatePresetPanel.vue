<template>
  <NSPlatePanel :title="t(textKeys.nsplatePresets)">
    <div class="nsplate-preset-selects">
      <label v-for="group in groups" :key="group.kind" class="nsplate-preset-select">
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
</script>

<style scoped>
.nsplate-preset-selects {
  display: grid;
  gap: 12px;
}

.nsplate-preset-select {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.nsplate-preset-select select {
  width: 100%;
  min-height: 36px;
  min-width: 0;
  padding: 0 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 850;
}

.nsplate-preset-select select:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ns-color-accent) 52%, transparent);
  outline-offset: 2px;
}
</style>
