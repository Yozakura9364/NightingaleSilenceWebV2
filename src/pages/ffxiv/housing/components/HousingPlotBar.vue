<template>
  <article class="housing-plot-bar">
    <span class="housing-plot-bar__district">{{ districtLabel }}</span>

    <span class="housing-plot-bar__location">
      {{ plot.ward }}<span class="housing-plot-bar__loc-label">{{ t(housingTextKeys.wardLabel) }}</span>{{ plot.plot }}<span class="housing-plot-bar__loc-label">{{ t(housingTextKeys.plotLabel) }}</span>
    </span>

    <span
      class="housing-plot-bar__badge"
      :class="`housing-plot-bar__badge--size-${plot.size}`"
    >
      {{ sizeLabel }}
    </span>

    <span class="housing-plot-bar__tag">{{ audienceLabel }}</span>
    <span
      v-if="purchaseLabel"
      class="housing-plot-bar__tag"
    >
      {{ purchaseLabel }}
    </span>
    <span
      v-if="phaseLabel"
      class="housing-plot-bar__tag"
      :class="`housing-plot-bar__tag--phase-${plot.phase}`"
    >
      {{ phaseLabel }}
    </span>

    <span class="housing-plot-bar__price">
      <span class="housing-plot-bar__price-value">{{ priceText }}</span>
      <span class="housing-plot-bar__price-unit">{{ t(housingTextKeys.currencyGil) }}</span>
    </span>

    <span v-if="plot.entries !== null" class="housing-plot-bar__entries" :class="{ 'housing-plot-bar__entries--open': isWideOpen }">
      <template v-if="plot.entries === 0">{{ t(housingTextKeys.entriesNone) }}</template>
      <template v-else>{{ plot.entries }}{{ t(housingTextKeys.entriesUnit) }}</template>
    </span>

    <span v-if="remainingText" class="housing-plot-bar__remaining">{{ remainingText }}</span>
    <span v-else-if="remainingExpired" class="housing-plot-bar__remaining">
      {{ t(housingTextKeys.remainingExpired) }}
    </span>

    <span class="housing-plot-bar__scan">
      <template v-if="scanParts">{{ scanParts.value }}{{ t(scanParts.unitKey) }}</template>
      <template v-else>{{ t(housingTextKeys.timeJustNow) }}</template>
    </span>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { housingTextKeys } from '@/locales/keys/housing'
import { useLocale } from '@/stores/locale'
import { formatPrice, formatRelativeTime, formatRemainingTime } from '@/lib/housing/format'
import type { HousingPlot } from '@/lib/housing/types'

const props = defineProps<{
  plot: HousingPlot
  now: number
}>()

const { t } = useLocale()

const districtLabel = computed(() =>
  props.plot.districtNameKey ? t(props.plot.districtNameKey) : props.plot.districtNameFallback
)

const sizeLabel = computed(() => {
  if (props.plot.size === 'medium') {
    return t(housingTextKeys.sizeMedium)
  }
  if (props.plot.size === 'large') {
    return t(housingTextKeys.sizeLarge)
  }
  return t(housingTextKeys.sizeSmall)
})

const audienceLabel = computed(() => {
  if (props.plot.audience === 'individual') {
    return t(housingTextKeys.audienceIndividual)
  }
  if (props.plot.audience === 'freeCompany') {
    return t(housingTextKeys.audienceFreeCompany)
  }
  return t(housingTextKeys.audienceBoth)
})

const purchaseLabel = computed(() =>
  props.plot.purchase === 'lottery' ? null : t(housingTextKeys.purchaseFirstCome)
)

const phaseLabel = computed(() => {
  if (props.plot.phase === 'entry') {
    return t(housingTextKeys.phaseEntry)
  }
  if (props.plot.phase === 'results') {
    return t(housingTextKeys.phaseResults)
  }
  if (props.plot.phase === 'upcoming') {
    return t(housingTextKeys.phaseUpcoming)
  }
  return null
})

const isWideOpen = computed(() => props.plot.entries === 0 && props.plot.phase === 'entry')

const priceText = computed(() => formatPrice(props.plot.price))

const remainingText = computed(() =>
  props.plot.phaseEndsAt !== null &&
  props.plot.phase !== 'unknown' &&
  // 下一轮地块的截止时间语义为上一轮残留，不展示倒计时
  props.plot.phase !== 'upcoming'
    ? formatRemainingTime(props.plot.phaseEndsAt, props.now, t)
    : null
)

const remainingExpired = computed(
  () =>
    props.plot.phaseEndsAt !== null &&
    props.plot.phase !== 'unknown' &&
    props.plot.phase !== 'upcoming' &&
    remainingText.value === null
)

const scanParts = computed(() => formatRelativeTime(props.plot.lastUpdatedAt, props.now))
</script>

<style scoped>
.housing-plot-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
  min-width: 0;
  padding: 7px 14px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: var(--ns-color-surface);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.housing-plot-bar:hover {
  border-color: var(--ns-color-border-strong);
  background: var(--ns-color-bg-soft);
}

.housing-plot-bar__district {
  min-width: 72px;
  overflow: hidden;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.housing-plot-bar__location {
  min-width: 96px;
  color: var(--ns-color-text);
  font-family: var(--ns-font-data);
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.housing-plot-bar__loc-label {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.housing-plot-bar__badge {
  padding: 1px 8px;
  border-radius: var(--ns-radius-xs);
  font-family: var(--ns-font-ui);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.housing-plot-bar__badge--size-small {
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text-muted);
}

.housing-plot-bar__badge--size-medium {
  background: var(--ns-color-cyan-soft);
  color: var(--ns-color-cyan);
}

.housing-plot-bar__badge--size-large {
  background: var(--ns-color-accent-soft);
  color: var(--ns-color-accent-strong);
}

.housing-plot-bar__tag {
  padding: 1px 7px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.housing-plot-bar__tag--phase-entry {
  border-color: color-mix(in srgb, var(--ns-color-accent) 42%, var(--ns-color-border));
  background: var(--ns-color-accent-soft);
  color: var(--ns-color-accent-strong);
}

.housing-plot-bar__tag--phase-results {
  border-color: color-mix(in srgb, var(--ns-color-warning) 42%, var(--ns-color-border));
  color: var(--ns-color-warning);
}

.housing-plot-bar__tag--phase-upcoming {
  border-color: color-mix(in srgb, var(--ns-color-cyan) 42%, var(--ns-color-border));
  background: var(--ns-color-cyan-soft);
  color: var(--ns-color-cyan);
}

.housing-plot-bar__price {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  margin-left: auto;
  white-space: nowrap;
}

.housing-plot-bar__price-value {
  color: var(--ns-color-text);
  font-family: var(--ns-font-data);
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.housing-plot-bar__price-unit {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 11px;
  font-weight: 700;
}

.housing-plot-bar__entries {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.housing-plot-bar__entries--open {
  color: var(--ns-color-success);
}

.housing-plot-bar__remaining {
  min-width: 72px;
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.housing-plot-bar__scan {
  min-width: 64px;
  overflow: hidden;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 11px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 680px) {
  .housing-plot-bar {
    gap: 4px 10px;
    padding: 7px 10px;
  }

  .housing-plot-bar__location {
    min-width: 0;
  }

  .housing-plot-bar__price {
    margin-left: 0;
  }

  .housing-plot-bar__remaining {
    min-width: 0;
  }

  .housing-plot-bar__scan {
    margin-left: auto;
    min-width: 0;
  }
}
</style>
