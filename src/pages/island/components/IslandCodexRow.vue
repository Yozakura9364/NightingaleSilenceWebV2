<template>
  <article class="island-codex-row">
    <div class="island-codex-row__main">
      <IslandItemIcon :icon="icon ?? null" :alt="title" />
      <strong>{{ title }}</strong>
      <small v-for="tag in tags" :key="tag">{{ tag }}</small>
    </div>
    <div v-if="meta.length" class="island-codex-row__meta">
      <span v-for="entry in meta" :key="entry">{{ entry }}</span>
    </div>
    <button
      v-if="mapTarget"
      type="button"
      class="island-codex-row__locate"
      @click.stop="emit('map', mapTarget)"
    >
      {{ t(islandTextKeys.mapMarkerLabel) }}
    </button>
  </article>
</template>

<script setup lang="ts">
import IslandItemIcon from '@/pages/island/components/IslandItemIcon.vue'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

withDefaults(
  defineProps<{
    icon?: number | null
    title: string
    tags?: string[]
    meta?: string[]
    mapTarget?: string
  }>(),
  { tags: () => [], meta: () => [], mapTarget: '' }
)

const emit = defineEmits<{
  map: [rowKey: string]
}>()

const { t } = useLocale()
</script>

<style scoped>
.island-codex-row {
  display: grid;
  gap: 4px;
  padding: 10px 14px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
}
.island-codex-row__main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.island-codex-row__main strong {
  font-size: 15px;
  overflow-wrap: anywhere;
}
.island-codex-row__main small {
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-codex-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-codex-row__locate {
  justify-self: start;
  border: 0;
  padding: 0;
  background: none;
  color: var(--ns-color-accent-strong);
  font-family: var(--ns-font-ui);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}
</style>
