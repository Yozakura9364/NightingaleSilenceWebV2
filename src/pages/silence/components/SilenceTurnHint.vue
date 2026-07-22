<template>
  <nav class="silence-turn-hints" :aria-label="label">
    <RouterLink
      v-if="leftTo"
      class="silence-turn-hint silence-turn-hint--left"
      :to="leftTo"
      :aria-label="resolvedLeftLabel"
    >
      <span class="silence-turn-hint__arrow" aria-hidden="true"></span>
    </RouterLink>
    <RouterLink
      v-if="rightTo"
      class="silence-turn-hint silence-turn-hint--right"
      :to="rightTo"
      :aria-label="resolvedRightLabel"
    >
      <span class="silence-turn-hint__arrow" aria-hidden="true"></span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  leftTo?: string
  leftLabel?: string
  rightTo?: string
  rightLabel?: string
}>()

const resolvedLeftLabel = computed(() => props.leftLabel ?? props.label)
const resolvedRightLabel = computed(() => props.rightLabel ?? props.label)
</script>

<style scoped>
.silence-turn-hints {
  position: absolute;
  inset: 0;
  z-index: 12;
  color: #2c2338;
  pointer-events: none;
}

.silence-turn-hint {
  position: absolute;
  top: 0;
  bottom: 0;
  width: clamp(64px, 7vw, 104px);
  color: currentColor;
  opacity: 0;
  pointer-events: auto;
  transition:
    opacity var(--ns-transition),
    transform var(--ns-transition);
}

.silence-turn-hint:hover,
.silence-turn-hint:focus-visible {
  opacity: 1;
}

.silence-turn-hint:focus-visible {
  outline: 3px solid var(--ns-color-accent);
  outline-offset: -8px;
}

.silence-turn-hint--left {
  left: 0;
  background: linear-gradient(90deg, rgba(239, 111, 178, 0.48), transparent);
}

.silence-turn-hint--right {
  right: 0;
  background: linear-gradient(270deg, rgba(99, 217, 220, 0.48), transparent);
}

.silence-turn-hint__arrow {
  position: absolute;
  top: 50%;
  display: block;
  width: clamp(52px, 7vw, 112px);
  height: 3px;
  background: currentColor;
  opacity: 0.74;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.72));
  transform: translateY(-50%);
}

.silence-turn-hint__arrow::before,
.silence-turn-hint__arrow::after {
  position: absolute;
  width: 18px;
  height: 3px;
  background: currentColor;
  content: '';
}

.silence-turn-hint--left .silence-turn-hint__arrow {
  left: clamp(18px, 4vw, 56px);
}

.silence-turn-hint--left .silence-turn-hint__arrow::before {
  left: 0;
  top: -6px;
  transform: rotate(-35deg);
  transform-origin: left center;
}

.silence-turn-hint--left .silence-turn-hint__arrow::after {
  left: 0;
  top: 6px;
  transform: rotate(35deg);
  transform-origin: left center;
}

.silence-turn-hint--right .silence-turn-hint__arrow {
  right: clamp(18px, 4vw, 56px);
}

.silence-turn-hint--right .silence-turn-hint__arrow::before {
  right: 0;
  top: -6px;
  transform: rotate(35deg);
  transform-origin: right center;
}

.silence-turn-hint--right .silence-turn-hint__arrow::after {
  right: 0;
  top: 6px;
  transform: rotate(-35deg);
  transform-origin: right center;
}

@media (max-width: 640px) {
  .silence-turn-hint {
    width: 86px;
  }

  .silence-turn-hint__arrow {
    width: 46px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .silence-turn-hint {
    opacity: 0.6;
    transition: none;
  }
}
</style>
