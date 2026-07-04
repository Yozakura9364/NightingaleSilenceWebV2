<template>
  <ul v-if="items.length" class="nsarmoire-readable-list">
    <li
      v-for="item in visibleItems"
      :key="item.key"
      class="nsarmoire-readable-list__item"
      :class="item.tone ? `nsarmoire-readable-list__item--${item.tone}` : undefined"
    >
      <span class="nsarmoire-readable-list__icon" aria-hidden="true">
        <img
          v-if="item.iconUrl"
          :src="item.iconUrl"
          alt=""
          loading="eager"
          decoding="async"
          referrerpolicy="no-referrer"
          @error="hideBrokenIcon"
        />
      </span>
      <span class="nsarmoire-readable-list__body">
        <span class="nsarmoire-readable-list__name">{{ item.name }}</span>
        <small>{{ item.context }}</small>
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ArmoireReadableItemView } from '@/pages/armoire/utils/insightDisplay'

const props = defineProps<{
  items: ArmoireReadableItemView[]
  limit?: number
  expanded?: boolean
}>()

const visibleItems = computed(() => {
  if (props.expanded || !props.limit) {
    return props.items
  }

  return props.items.slice(0, props.limit)
})

function hideBrokenIcon(event: Event): void {
  const image = event.currentTarget

  if (image instanceof HTMLImageElement) {
    image.style.display = 'none'
    image.parentElement?.classList.add('nsarmoire-readable-list__icon--empty')
  }
}
</script>

<style scoped>
.nsarmoire-readable-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-readable-list__item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface);
}

.nsarmoire-readable-list__item--danger {
  border-color: var(--ns-status-danger-border);
}

.nsarmoire-readable-list__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-pixel-surface);
  image-rendering: auto;
}

.nsarmoire-readable-list__icon img {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.nsarmoire-readable-list__icon--empty {
  display: none;
}

.nsarmoire-readable-list__body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.nsarmoire-readable-list__name,
.nsarmoire-readable-list small {
  min-width: 0;
  overflow-wrap: anywhere;
}

.nsarmoire-readable-list__name {
  font-weight: 900;
}

.nsarmoire-readable-list small {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-mono);
  font-size: 12px;
  line-height: 1.5;
}
</style>
