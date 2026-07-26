<template>
  <div class="ffxiv-countdown" aria-live="off">
    <span class="ffxiv-countdown__part">
      <strong>{{ parts.days }}</strong>
      <small>{{ t(textKeys.countdownDays) }}</small>
    </span>
    <span class="ffxiv-countdown__part">
      <strong>{{ padded(parts.hours) }}</strong>
      <small>{{ t(textKeys.countdownHours) }}</small>
    </span>
    <span class="ffxiv-countdown__part">
      <strong>{{ padded(parts.minutes) }}</strong>
      <small>{{ t(textKeys.countdownMinutes) }}</small>
    </span>
    <span class="ffxiv-countdown__part">
      <strong>{{ padded(parts.seconds) }}</strong>
      <small>{{ t(textKeys.countdownSeconds) }}</small>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCountdownParts } from '@/lib/ffxiv/time/countdown'
import { ffxivTextKeys as textKeys } from '@/locales/keys/ffxiv'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  targetAt: number
  now: number
}>()

const { t } = useLocale()
const parts = computed(() => getCountdownParts(props.targetAt, props.now))

function padded(value: number): string {
  return String(value).padStart(2, '0')
}
</script>

<style scoped>
.ffxiv-countdown {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, auto));
  justify-content: start;
  gap: 12px;
  min-width: 0;
  font-family: var(--ns-font-data);
  font-variant-numeric: tabular-nums;
}

.ffxiv-countdown__part {
  display: inline-flex;
  min-width: 0;
  align-items: baseline;
  gap: 3px;
  white-space: nowrap;
}

.ffxiv-countdown__part strong {
  color: var(--ns-color-text);
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

.ffxiv-countdown__part small {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 11px;
  font-weight: 800;
}

@media (max-width: 420px) {
  .ffxiv-countdown {
    gap: 8px;
  }

  .ffxiv-countdown__part strong {
    font-size: 20px;
  }
}
</style>
