<template>
  <div class="island-planner">
    <div class="island-planner__filters">
      <label>
        <span>{{ t(islandTextKeys.scheduleWorkshopLevel) }}</span>
        <select :value="workshopLevel" @change="emit('update:workshopLevel', Number(($event.target as HTMLSelectElement).value))">
          <option v-for="level in [4, 3, 2, 1]" :key="level" :value="level">{{ level }}</option>
        </select>
      </label>
      <label>
        <span>{{ t(islandTextKeys.scheduleRestCycle) }}</span>
        <select :value="restCycle" @change="emit('update:restCycle', Number(($event.target as HTMLSelectElement).value))">
          <option v-for="cycle in [2, 3, 4, 5, 6, 7]" :key="cycle" :value="cycle">
            {{ t(islandTextKeys.scheduleCycleLabel) }} {{ cycle }}
          </option>
        </select>
      </label>
    </div>

    <div class="island-planner__total">
      <strong>{{ t(islandTextKeys.scheduleWeeklyTotal) }}:</strong>
      <span v-if="currency" class="island-planner__currency" :title="currency.name">
        <IslandItemIcon :icon="currency.icon" :alt="currency.name" />
      </span>
      <strong>{{ plan.weeklyEstimatedTotal }}</strong>
      <small v-if="currency" class="island-planner__currency-name">{{ currency.name }}</small>
      <small class="island-planner__assumption">{{ t(islandTextKeys.scheduleAssumptionNote) }}</small>
    </div>

    <div
      v-for="cycle in plan.cycles"
      :key="cycle.cycle"
      class="island-planner__cycle"
    >
      <h3>
        {{ t(islandTextKeys.scheduleCycleLabel) }} {{ cycle.cycle }}
        <small v-if="cycle.rest">{{ t(islandTextKeys.scheduleRest) }}</small>
        <small v-else>
          {{ t(islandTextKeys.scheduleEstimatedValue) }} {{ cycle.estimatedTotal }}
        </small>
      </h3>
      <div v-if="!cycle.rest" class="island-planner__workshops">
        <div v-for="workshop in cycle.workshops" :key="workshop.workshop" class="island-planner__workshop">
          <h4>{{ t(islandTextKeys.scheduleWorkshopLabel) }} {{ workshop.workshop }}</h4>
          <div class="island-planner__crafts">
            <span
              v-for="(craft, index) in workshop.crafts"
              :key="`${craft.productId}-${index}`"
              class="island-planner__craft"
            >
              <IslandItemIcon :icon="craft.icon" :alt="craft.name" />
              <span class="island-planner__craft-name">{{ craft.name }}</span>
              <small>{{ craft.hours }}{{ t(islandTextKeys.workshopHoursUnit) }} · {{ craft.estimatedValue }}</small>
            </span>
          </div>
        </div>
      </div>
      <div v-if="!cycle.rest" class="island-planner__materials">
        <span>{{ t(islandTextKeys.scheduleMaterials) }}:</span>
        <span v-for="(amount, name) in cycle.materialTotals" :key="name">
          {{ name }} ×{{ amount }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IslandItemIcon from '@/pages/island/components/IslandItemIcon.vue'
import { planWeeklySchedule, type IslandPopularityLevel, type ScheduleProduct, type WeeklyPlan } from '@/lib/island/schedule'
import type { IslandCurrency } from '@/lib/island/types'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  products: ScheduleProduct[]
  popularity: Record<string, IslandPopularityLevel>
  popularityRatios: Record<IslandPopularityLevel, number>
  grooveBonuses: number[]
  currency: IslandCurrency | null
  workshopLevel: number
  restCycle: number
}>()

const emit = defineEmits<{
  'update:workshopLevel': [value: number]
  'update:restCycle': [value: number]
}>()

const { t } = useLocale()

const plan = computed<WeeklyPlan>(() =>
  planWeeklySchedule(props.products, {
    popularity: props.popularity,
    popularityRatios: props.popularityRatios,
    grooveBonuses: props.grooveBonuses,
    workshopLevel: props.workshopLevel,
    restCycle: props.restCycle
  })
)
</script>

<style scoped>
.island-planner {
  display: grid;
  gap: 12px;
}
.island-planner__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.island-planner__filters label {
  display: grid;
  gap: 4px;
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-planner__filters select {
  min-width: 120px;
  padding: 7px 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: 8px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
}
.island-planner__total {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  font-size: 16px;
}
.island-planner__total strong:last-of-type {
  color: var(--ns-color-accent-strong);
}
.island-planner__currency {
  display: inline-flex;
}
.island-planner__currency :deep(.island-icon) {
  width: 22px;
  height: 22px;
}
.island-planner__currency-name,
.island-planner__assumption {
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-planner__cycle {
  padding: 10px 14px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
}
.island-planner__cycle h3 {
  margin: 0 0 8px;
  font-size: 15px;
}
.island-planner__cycle h3 small {
  margin-left: 8px;
  color: var(--ns-color-text-muted);
  font-weight: normal;
  font-size: 13px;
}
.island-planner__workshops {
  display: grid;
  gap: 10px;
}
.island-planner__workshop h4 {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--ns-color-text-muted);
}
.island-planner__crafts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.island-planner__craft {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
  background: var(--ns-color-surface-solid);
  font-size: 13px;
}
.island-planner__craft small {
  color: var(--ns-color-text-muted);
}
.island-planner__craft-name {
  max-width: 160px;
  overflow-wrap: anywhere;
}
.island-planner__materials {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 8px;
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
</style>
