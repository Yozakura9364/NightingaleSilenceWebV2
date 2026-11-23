<template>
  <label class="housing-server-picker">
    <span class="housing-server-picker__label">{{ t(housingTextKeys.serverLabel) }}</span>
    <select
      class="housing-server-picker__select"
      :value="modelValue"
      :disabled="disabled"
      @change="onChange"
    >
      <template v-if="region === 'global'">
        <optgroup
          v-for="group in worldGroups"
          :key="group.datacenterName"
          :label="group.datacenterName"
        >
          <option v-for="world in group.worlds" :key="world.id" :value="world.id">
            {{ world.name }}
          </option>
        </optgroup>
      </template>
      <template v-else>
        <optgroup
          v-for="group in cnGroups"
          :key="group.dataCenterName"
          :label="group.dataCenterName"
        >
          <option v-for="server in group.servers" :key="server.id" :value="server.id">
            {{ server.name }}
          </option>
        </optgroup>
      </template>
    </select>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { housingTextKeys } from '@/locales/keys/housing'
import { useLocale } from '@/stores/locale'
import { groupCnServersByDataCenter, groupWorldsByDataCenter } from '@/lib/housing/regions'
import type { HousingRegionKey, HousingWorld } from '@/lib/housing/types'

const props = defineProps<{
  region: HousingRegionKey
  modelValue: number
  worlds: readonly HousingWorld[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void
}>()

const { t } = useLocale()

const worldGroups = computed(() => groupWorldsByDataCenter(props.worlds))
const cnGroups = groupCnServersByDataCenter()

function onChange(event: Event): void {
  const value = Number((event.target as HTMLSelectElement).value)
  if (Number.isInteger(value) && value !== props.modelValue) {
    emit('update:modelValue', value)
  }
}
</script>

<style scoped>
.housing-server-picker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.housing-server-picker__label {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.housing-server-picker__select {
  min-height: 32px;
  max-width: 200px;
  padding: 0 10px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 13px;
  font-weight: 700;
}

.housing-server-picker__select:disabled {
  opacity: 0.6;
}
</style>
