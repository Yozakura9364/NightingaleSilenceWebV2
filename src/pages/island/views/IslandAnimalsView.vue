<template>
  <section class="island-view">
    <p class="island-animals__note">{{ t(islandTextKeys.animalsSpawnNote) }}</p>
    <IslandFilterBar v-model="keyword" :count="visibleEntries.length" :total="animals.length" />
    <AppStatus v-if="!loading && error" tone="warning" :message="t(islandTextKeys.unavailable)" />

    <template v-else-if="!loading">
      <div class="island-animals__status ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact">
        <span>
          {{ t(islandTextKeys.animalsEorzeaTime) }}
          <strong>{{ etClock }}</strong>
        </span>
        <span>
          {{ t(islandTextKeys.animalsCatchableCount) }}
          <strong>{{ catchableCount }} / {{ animals.length }}</strong>
        </span>
      </div>

      <div class="island-view__list">
        <article
          v-for="entry in visibleEntries"
          :key="entry.animal.id"
          class="ns-workbench-panel ns-workbench-panel--soft ns-workbench-panel--compact island-view__row"
        >
          <div class="island-view__main">
            <IslandItemIcon :icon="entry.animal.icon" :alt="entry.animal.name" />
            <strong>{{ entry.animal.name || entry.animal.id }}</strong>
            <small>{{ sizeLabel(entry.animal.size) }}</small>
            <small>{{ t(islandTextKeys.colRarity) }} {{ entry.animal.rarity }}</small>
            <span v-if="entry.state?.active" class="island-animals__badge island-animals__badge--active">
              {{ t(islandTextKeys.catchableNow) }}
            </span>
          </div>
          <div class="island-view__meta">
            <span>
              {{ t(islandTextKeys.colRewards) }}:
              {{ entry.animal.rewards.map((reward) => pickIslandName(reward.names, current)).join(listSeparator) }}
            </span>
          </div>
          <div class="island-view__meta">
            <span v-if="entry.animal.spawn?.spawnHour !== undefined && entry.animal.spawn?.durationHours">
              {{ t(islandTextKeys.spawnWindow) }}: {{ entry.windowText }} {{ t(islandTextKeys.etUnit) }}
            </span>
            <span v-else>{{ t(islandTextKeys.spawnAlways) }}</span>
            <span v-if="entry.animal.spawn?.weather">
              {{ t(islandTextKeys.spawnWeather) }}: {{ pickIslandName(entry.animal.spawn.weather.names, current) }}
            </span>
            <span v-if="entry.animal.spawn">
              {{ t(islandTextKeys.animalsPositionLabel) }}: ({{ entry.animal.spawn.x }}, {{ entry.animal.spawn.y }})
            </span>
            <button
              v-if="entry.animal.spawn"
              type="button"
              class="island-animals__locate"
              @click="openMapModal(entry.animal.id)"
            >
              {{ t(islandTextKeys.mapMarkerLabel) }}
            </button>
          </div>
          <div v-if="entry.state" class="island-view__meta">
            <span v-if="entry.state.active">
              {{ t(islandTextKeys.catchableLeft) }}: {{ formatEorzeaMinutes(entry.state.minutesLeft ?? 0) }} {{ t(islandTextKeys.etUnit) }}
            </span>
            <span v-else-if="entry.state.minutesUntilNext !== null">
              {{ t(islandTextKeys.catchableNext) }}: {{ formatEorzeaMinutes(entry.state.minutesUntilNext) }} {{ t(islandTextKeys.etUnit) }}
            </span>
          </div>
        </article>
        <AppStatus v-if="!visibleEntries.length" tone="warning" :message="t(islandTextKeys.noResults)" />
      </div>
    </template>

    <IslandMapModal
      :open="modalOpen"
      :label="t(islandTextKeys.mapTitle)"
      :markers="modalMarkerList"
      :highlight-id="modalHighlight"
      @close="modalOpen = false"
      @update:highlight-id="modalHighlight = $event ?? ''"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import IslandFilterBar from '@/pages/island/components/IslandFilterBar.vue'
import IslandItemIcon from '@/pages/island/components/IslandItemIcon.vue'
import IslandMapModal from '@/pages/island/components/IslandMapModal.vue'
import type { IslandInteractiveMarker } from '@/pages/island/components/IslandInteractiveMap.vue'
import {
  animalSpawnWindowState,
  currentEorzeaMinuteOfDay,
  formatEorzeaMinutes,
  formatSpawnWindow
} from '@/lib/island/animals'
import { islandListSeparator, pickIslandName } from '@/lib/island/localization'
import type { IslandAnimal } from '@/lib/island/types'
import { loadIslandAnimals } from '@/services/island/islandApi'
import { loadIslandMapMarkers, type IslandMapMarkerData } from '@/services/island/islandMarkers'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

const { t, current } = useLocale()
const loading = ref(true)
const error = ref(false)
const animals = ref<IslandAnimal[]>([])
const nowMs = ref(Date.now())
const keyword = ref('')
const modalOpen = ref(false)
const modalHighlight = ref('')
const modalMarkers = ref<IslandMapMarkerData>({ animals: [], gathering: [] })
const modalMarkerList = computed<IslandInteractiveMarker[]>(() => [
  ...modalMarkers.value.animals,
  ...modalMarkers.value.gathering
])
let timerId: number | undefined

const listSeparator = computed(() => islandListSeparator(current.value))
const eorzeaMinute = computed(() => currentEorzeaMinuteOfDay(nowMs.value))
const etClock = computed(() => formatEorzeaMinutes(eorzeaMinute.value))

interface AnimalEntry {
  animal: IslandAnimal
  state: ReturnType<typeof animalSpawnWindowState> | null
  windowText: string
}

const allEntries = computed<AnimalEntry[]>(() =>
  animals.value.map((animal) => {
    const spawn = animal.spawn
    if (spawn?.spawnHour === undefined || spawn?.durationHours === undefined) {
      return { animal, state: null, windowText: '' }
    }
    return {
      animal,
      state: animalSpawnWindowState(spawn.spawnHour, spawn.durationHours, eorzeaMinute.value),
      windowText: formatSpawnWindow(spawn.spawnHour, spawn.durationHours)
    }
  })
)

const catchableCount = computed(() => allEntries.value.filter((entry) => entry.state?.active).length)

const visibleEntries = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) {
    return allEntries.value
  }
  return allEntries.value.filter((entry) => entry.animal.name.toLowerCase().includes(value))
})

function sizeLabel(size: number) {
  return size === 2 ? t(islandTextKeys.sizeLarge) : t(islandTextKeys.sizeSmall)
}

function openMapModal(id: string) {
  modalHighlight.value = `a-${id}`
  modalOpen.value = true
}

onMounted(async () => {
  timerId = window.setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
  try {
    const [animalsFile, markerData] = await Promise.all([
      loadIslandAnimals(),
      loadIslandMapMarkers(current.value)
    ])
    animals.value = animalsFile.animals.map((animal) => ({
      ...animal,
      name: pickIslandName(animal.names, current.value) || animal.id
    }))
    modalMarkers.value = markerData
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  if (timerId !== undefined) {
    window.clearInterval(timerId)
  }
})
</script>

<style scoped>
@import './island-view-shared.css';
.island-animals__note {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 14px;
}
.island-animals__status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
  font-size: 15px;
  color: var(--ns-color-text-muted);
}
.island-animals__status strong {
  margin-left: 6px;
  color: var(--ns-color-text);
  font-size: 18px;
}
.island-animals__badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.island-animals__badge--active {
  background: var(--ns-color-accent-strong);
  color: var(--ns-color-surface-solid);
}
.island-animals__locate {
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
