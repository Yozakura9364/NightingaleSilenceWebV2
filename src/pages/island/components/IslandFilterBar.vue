<template>
  <div class="island-filter">
    <input
      class="island-filter__input"
      type="search"
      :value="modelValue"
      :placeholder="t(islandTextKeys.searchPlaceholder)"
      :aria-label="t(islandTextKeys.searchPlaceholder)"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="count !== total" class="island-filter__count">{{ count }} / {{ total }}</span>
  </div>
</template>

<script setup lang="ts">
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

defineProps<{
  modelValue: string
  count: number
  total: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useLocale()
</script>

<style scoped>
.island-filter {
  display: flex;
  align-items: center;
  gap: 10px;
}
.island-filter__input {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid var(--ns-color-border);
  border-radius: 8px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 14px;
}
.island-filter__input:focus-visible {
  border-color: var(--ns-color-accent-strong);
  outline: 0;
}
.island-filter__count {
  flex-shrink: 0;
  color: var(--ns-color-text-muted);
  font-size: 13px;
  white-space: nowrap;
}
</style>
