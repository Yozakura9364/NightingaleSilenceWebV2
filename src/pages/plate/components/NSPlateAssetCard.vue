<template>
  <button
    class="nsplate-asset-card"
    :class="{ 'nsplate-asset-card--active': active }"
    type="button"
    @click="emit('select', asset)"
  >
    <span class="nsplate-asset-card__image">
      <img v-if="asset.previewUrl" :src="asset.previewUrl" :alt="asset.label" loading="lazy" />
    </span>
    <span class="nsplate-asset-card__label">{{ asset.label }}</span>
  </button>
</template>

<script setup lang="ts">
import type { NSPlateAssetSummary } from '@/lib/plate/types'

defineProps<{
  asset: NSPlateAssetSummary
  active: boolean
}>()

const emit = defineEmits<{
  select: [value: NSPlateAssetSummary]
}>()
</script>

<style scoped>
.nsplate-asset-card {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 7px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 76%, transparent);
  color: var(--ns-color-text);
  font: inherit;
  cursor: pointer;
}

.nsplate-asset-card:hover,
.nsplate-asset-card--active {
  border-color: rgba(239, 111, 178, 0.52);
  background: rgba(255, 225, 241, 0.62);
}

.nsplate-asset-card__image {
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  border-radius: var(--ns-radius-xs);
  background:
    linear-gradient(45deg, rgba(88, 68, 105, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(88, 68, 105, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(88, 68, 105, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(88, 68, 105, 0.08) 75%);
  background-position:
    0 0,
    0 6px,
    6px -6px,
    -6px 0;
  background-size: 12px 12px;
}

.nsplate-asset-card__image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.nsplate-asset-card__label {
  overflow: hidden;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
