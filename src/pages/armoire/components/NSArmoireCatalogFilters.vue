<template>
  <div class="nsarmoire-catalog-filters" :aria-label="label">
    <AppButton
      v-for="option in options"
      :key="option.key"
      :variant="option.key === selected ? 'primary' : 'default'"
      @click="$emit('update:selected', option.key)"
    >
      <span>{{ option.label }}</span>
      <strong>{{ option.count }}</strong>
    </AppButton>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import type {
  ArmoireCatalogGridFilter,
  ArmoireCatalogGridFilterOption
} from '@/pages/armoire/composables/useArmoireCatalogGrid'

defineProps<{
  options: ArmoireCatalogGridFilterOption[]
  selected: ArmoireCatalogGridFilter
  label: string
}>()

defineEmits<{
  'update:selected': [filter: ArmoireCatalogGridFilter]
}>()
</script>

<style scoped>
.nsarmoire-catalog-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.nsarmoire-catalog-filters :deep(.ns-button) {
  min-width: 0;
  gap: 8px;
}

.nsarmoire-catalog-filters strong {
  font-family: var(--ns-font-mono);
}
</style>
