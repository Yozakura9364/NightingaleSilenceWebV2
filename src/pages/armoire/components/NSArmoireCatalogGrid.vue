<template>
  <div class="nsarmoire-catalog-grid">
    <NSArmoireCatalogCard
      v-for="item in items"
      :key="item.key"
      :item="item"
      @ignore-item="$emit('ignore-item', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ArmoireCatalogCardView } from '@/pages/armoire/composables/useArmoireCatalogGrid'
import NSArmoireCatalogCard from '@/pages/armoire/components/NSArmoireCatalogCard.vue'

defineProps<{
  items: ArmoireCatalogCardView[]
}>()

defineEmits<{
  'ignore-item': [itemId: number]
}>()
</script>

<style scoped>
.nsarmoire-catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 10px;
  min-width: 0;
}
</style>
