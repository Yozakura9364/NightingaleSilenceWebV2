<template>
  <div
    class="fashion-check-item-line"
    :class="{
      'fashion-check-item-line--has-slot': slotLabel,
      'fashion-check-item-line--has-secondary': secondaryText
    }"
  >
    <div class="fashion-check-item-line__icon" aria-hidden="true">
      <img
        v-if="iconUrl && !imageFailed"
        :src="iconUrl"
        alt=""
        loading="lazy"
        @error="imageFailed = true"
      />
    </div>
    <b v-if="slotLabel" class="fashion-check-item-line__slot">{{ slotLabel }}</b>
    <span :class="item ? `fashion-check-item-line__name--rarity-${item.rarity}` : undefined">{{
      item?.name ?? label
    }}</span>
    <small v-if="points !== undefined">+{{ points }}</small>
    <small v-if="secondaryText" class="fashion-check-item-line__secondary">{{
      secondaryText
    }}</small>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getArmoireIconUrl } from '@/lib/armoire/catalog'
import type { FashionCheckItem } from '@/lib/fashion-check/types'

const props = defineProps<{
  item?: FashionCheckItem
  iconId?: number
  slotLabel?: string
  label?: string
  points?: number
  secondaryText?: string
}>()

const resolvedIconId = computed(() => props.item?.iconId ?? props.iconId)
const iconUrl = computed(() => getArmoireIconUrl(resolvedIconId.value))
const imageFailed = ref(false)

watch(resolvedIconId, () => {
  imageFailed.value = false
})
</script>

<style scoped>
.fashion-check-item-line {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.fashion-check-item-line--has-slot {
  grid-template-columns: 34px auto minmax(0, 1fr) auto;
}

.fashion-check-item-line--has-secondary {
  grid-template-rows: auto auto;
}

.fashion-check-item-line--has-secondary .fashion-check-item-line__icon {
  grid-row: 1 / span 2;
  align-self: center;
}

.fashion-check-item-line__secondary {
  grid-column: 2 / -1;
}

.fashion-check-item-line__slot {
  white-space: nowrap;
}

.fashion-check-item-line__icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  overflow: hidden;
}

.fashion-check-item-line__icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.fashion-check-item-line__name--rarity-1 {
  color: var(--ns-color-text);
}
.fashion-check-item-line__name--rarity-2 {
  color: #58a85f;
}
.fashion-check-item-line__name--rarity-3 {
  color: #4c8fd4;
}
.fashion-check-item-line__name--rarity-4 {
  color: #b06cd5;
}
.fashion-check-item-line__name--rarity-5 {
  color: #d89948;
}

.fashion-check-item-line small {
  color: var(--ns-color-text-muted);
}
</style>
