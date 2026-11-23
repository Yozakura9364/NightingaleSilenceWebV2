<template>
  <div class="housing-region-switch" role="group" :aria-label="t(housingTextKeys.regionLabel)">
    <button
      type="button"
      :aria-pressed="modelValue === 'global'"
      :disabled="disabled"
      @click="select('global')"
    >
      {{ t(housingTextKeys.regionGlobal) }}
    </button>
    <button
      type="button"
      :aria-pressed="modelValue === 'cn'"
      :disabled="disabled"
      @click="select('cn')"
    >
      {{ t(housingTextKeys.regionCn) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { housingTextKeys } from '@/locales/keys/housing'
import { useLocale } from '@/stores/locale'
import type { HousingRegionKey } from '@/lib/housing/types'

const props = defineProps<{
  modelValue: HousingRegionKey
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: HousingRegionKey): void
}>()

const { t } = useLocale()

function select(region: HousingRegionKey): void {
  if (region !== props.modelValue) {
    emit('update:modelValue', region)
  }
}
</script>

<style scoped>
.housing-region-switch {
  display: inline-flex;
  overflow: hidden;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
}

.housing-region-switch button {
  min-height: 32px;
  padding: 0 14px;
  border: 0;
  border-left: var(--ns-line-width) solid var(--ns-color-border);
  background: var(--ns-color-surface);
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.housing-region-switch button:first-child {
  border-left: 0;
}

.housing-region-switch button[aria-pressed='true'] {
  background: var(--ns-color-accent-soft);
  color: var(--ns-color-accent-strong);
}

.housing-region-switch button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
