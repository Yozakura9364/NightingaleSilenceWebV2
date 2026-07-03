<template>
  <NSPlatePanel title="预设" :meta="`${totalCount} 项`">
    <div class="nsplate-preset-selects">
      <label v-for="group in groups" :key="group.kind" class="nsplate-preset-select">
        <span class="nsplate-preset-select__label">
          <span>{{ group.label }}</span>
          <small>{{ group.presets.length }}</small>
        </span>

        <select
          :value="selectedValueForGroup(group)"
          :disabled="group.presets.length === 0"
          @change="onPresetChange"
        >
          <option value="" disabled>请选择预设</option>
          <option v-for="preset in group.presets" :key="preset.id" :value="preset.id">
            {{ preset.label }} · {{ preset.layerCount }} 层
          </option>
        </select>
      </label>
    </div>
  </NSPlatePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NSPlatePresetGroup } from '@/pages/plate/types'
import NSPlatePanel from '@/pages/plate/components/NSPlatePanel.vue'

const props = defineProps<{
  groups: NSPlatePresetGroup[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'update:selectedId': [value: string]
}>()

const totalCount = computed(() =>
  props.groups.reduce((count, group) => count + group.presets.length, 0)
)

function selectedValueForGroup(group: NSPlatePresetGroup) {
  return group.presets.some((preset) => preset.id === props.selectedId) ? props.selectedId ?? '' : ''
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

.nsplate-preset-select__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 900;
}

.nsplate-preset-select__label small {
  color: var(--ns-color-text-soft);
  font-family: var(--ns-font-mono);
  font-size: 11px;
  font-weight: 900;
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
  font: inherit;
  font-size: 12px;
  font-weight: 850;
}

.nsplate-preset-select select:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--ns-color-accent) 52%, transparent);
  outline-offset: 2px;
}
</style>
