<template>
  <nav class="silence-turn-hints" :aria-label="label">
    <RouterLink
      v-if="leftTo"
      class="silence-turn-hint silence-turn-hint--left"
      :to="leftTo"
      :aria-label="resolvedLeftLabel"
    />
    <RouterLink
      v-if="rightTo"
      class="silence-turn-hint silence-turn-hint--right"
      :to="rightTo"
      :aria-label="resolvedRightLabel"
    />
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

@media (max-width: 640px) {
  .silence-turn-hint {
    width: 86px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .silence-turn-hint {
    opacity: 0.6;
    transition: none;
  }
}
</style>
