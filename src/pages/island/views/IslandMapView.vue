<template>
  <section class="island-view">
    <p class="island-map-page__note">{{ t(islandTextKeys.mapHint) }}</p>
    <AppStatus v-if="!loading && error" tone="warning" :message="t(islandTextKeys.unavailable)" />
    <template v-else-if="!loading">
      <div class="island-map-page__filters" role="group" :aria-label="t(islandTextKeys.mapTitle)">
        <button
          type="button"
          class="island-map-page__filter"
          :class="{ 'island-map-page__filter--on': showAnimals }"
          @click="showAnimals = !showAnimals"
        >
          {{ t(islandTextKeys.mapFilterAnimals) }} ({{ animalMarkers.length }})
        </button>
        <button
          type="button"
          class="island-map-page__filter"
          :class="{ 'island-map-page__filter--on': showGathering }"
          @click="showGathering = !showGathering"
        >
          {{ t(islandTextKeys.mapFilterGathering) }} ({{ gatherMarkers.length }})
        </button>
      </div>
      <IslandInteractiveMap
        :label="t(islandTextKeys.mapTitle)"
        :markers="visibleMarkers"
        :selected-id="selectedId"
        :background="ISLAND_MAP_BACKGROUND"
        :size-factor="ISLAND_MAP_SIZE_FACTOR"
        @select="select"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import IslandInteractiveMap, { type IslandInteractiveMarker } from '@/pages/island/components/IslandInteractiveMap.vue'
import { ISLAND_MAP_BACKGROUND, ISLAND_MAP_SIZE_FACTOR } from '@/lib/island/map'
import { loadIslandMapMarkers, type IslandMapMarkerData } from '@/services/island/islandMarkers'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

const { t, current } = useLocale()
const loading = ref(true)
const error = ref(false)
const markerData = ref<IslandMapMarkerData>({ animals: [], gathering: [] })
const showAnimals = ref(true)
const showGathering = ref(true)
const selectedId = ref('')

const animalMarkers = computed<IslandInteractiveMarker[]>(() => markerData.value.animals)
const gatherMarkers = computed<IslandInteractiveMarker[]>(() => markerData.value.gathering)

const visibleMarkers = computed(() => {
  const list: IslandInteractiveMarker[] = []
  if (showAnimals.value) {
    list.push(...animalMarkers.value)
  }
  if (showGathering.value) {
    list.push(...gatherMarkers.value)
  }
  return list
})

function select(id: string | null) {
  selectedId.value = id ?? ''
}

onMounted(async () => {
  try {
    markerData.value = await loadIslandMapMarkers(current.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.island-map-page__note {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 14px;
}
.island-map-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.island-map-page__filter {
  padding: 7px 14px;
  border: 1px solid var(--ns-color-border);
  border-radius: 8px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 14px;
  cursor: pointer;
}
.island-map-page__filter--on {
  border-color: var(--ns-color-accent-strong);
  color: var(--ns-color-accent-strong);
}
</style>
