<template>
  <div class="housing-filter-bar">
    <div
      v-for="group in filterGroups"
      :key="group.key"
      class="housing-filter-bar__group"
      role="group"
      :aria-label="group.label"
    >
      <span class="housing-filter-bar__label">{{ group.label }}</span>
      <div class="housing-filter-bar__options">
        <button
          v-for="option in group.options"
          :key="option.value"
          type="button"
          :aria-pressed="group.model.value === option.value"
          @click="select(group.key, option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { housingTextKeys } from '@/locales/keys/housing'
import { useLocale } from '@/stores/locale'

export type HousingSizeFilter = 'all' | 'small' | 'medium' | 'large'
export type HousingAudienceFilter = 'all' | 'individual' | 'freeCompany'
export type HousingCycleFilter = 'all' | 'current' | 'next'
export type HousingGroupFilter = 'district' | 'size'

const size = defineModel<HousingSizeFilter>('size', { required: true })
const audience = defineModel<HousingAudienceFilter>('audience', { required: true })
const cycle = defineModel<HousingCycleFilter>('cycle', { required: true })
const group = defineModel<HousingGroupFilter>('group', { required: true })

const { t } = useLocale()

const filterGroups = computed(() => [
  {
    key: 'group' as const,
    label: t(housingTextKeys.groupLabel),
    model: group,
    options: [
      { value: 'district' as const, label: t(housingTextKeys.groupDistrict) },
      { value: 'size' as const, label: t(housingTextKeys.groupSize) }
    ]
  },
  {
    key: 'size' as const,
    label: t(housingTextKeys.filterSizeLabel),
    model: size,
    options: [
      { value: 'all' as const, label: t(housingTextKeys.filterAll) },
      { value: 'small' as const, label: t(housingTextKeys.sizeSmall) },
      { value: 'medium' as const, label: t(housingTextKeys.sizeMedium) },
      { value: 'large' as const, label: t(housingTextKeys.sizeLarge) }
    ]
  },
  {
    key: 'audience' as const,
    label: t(housingTextKeys.filterAudienceLabel),
    model: audience,
    options: [
      { value: 'all' as const, label: t(housingTextKeys.filterAll) },
      { value: 'individual' as const, label: t(housingTextKeys.audienceIndividual) },
      { value: 'freeCompany' as const, label: t(housingTextKeys.audienceFreeCompany) }
    ]
  },
  {
    key: 'cycle' as const,
    label: t(housingTextKeys.filterCycleLabel),
    model: cycle,
    options: [
      { value: 'all' as const, label: t(housingTextKeys.filterAll) },
      { value: 'current' as const, label: t(housingTextKeys.filterCycleCurrent) },
      { value: 'next' as const, label: t(housingTextKeys.filterCycleNext) }
    ]
  }
])

function select(key: 'size' | 'audience' | 'cycle' | 'group', value: string): void {
  if (key === 'size') {
    size.value = value as HousingSizeFilter
  } else if (key === 'audience') {
    audience.value = value as HousingAudienceFilter
  } else if (key === 'group') {
    group.value = value as HousingGroupFilter
  } else {
    cycle.value = value as HousingCycleFilter
  }
}
</script>

<style scoped>
.housing-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding: 12px 16px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface);
}

.housing-filter-bar__group {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.housing-filter-bar__label {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.housing-filter-bar__options {
  display: inline-flex;
  overflow: hidden;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
}

.housing-filter-bar__options button {
  min-height: 28px;
  padding: 0 12px;
  border: 0;
  border-left: var(--ns-line-width) solid var(--ns-color-border);
  background: var(--ns-color-surface);
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.housing-filter-bar__options button:first-child {
  border-left: 0;
}

.housing-filter-bar__options button[aria-pressed='true'] {
  background: var(--ns-color-accent-soft);
  color: var(--ns-color-accent-strong);
}
</style>
