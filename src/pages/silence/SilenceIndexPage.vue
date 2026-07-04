<template>
  <main class="ns-page silence-page">
    <SilenceGatePoster />
  </main>
</template>

<script setup lang="ts">
import SilenceGatePoster from '@/pages/silence/components/SilenceGatePoster.vue'
</script>

<style scoped>
.silence-page {
  position: relative;
  min-height: calc(100vh - 56px);
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 240, 249, 0.72), transparent 42%),
    linear-gradient(90deg, transparent 48%, rgba(199, 246, 250, 0.72)),
    repeating-linear-gradient(
      90deg,
      rgba(99, 217, 220, 0.1) 0 1px,
      transparent 1px 28px
    ),
    repeating-linear-gradient(0deg, rgba(239, 111, 178, 0.09) 0 1px, transparent 1px 28px),
    var(--ns-body-background);
}

.silence-page::before {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    radial-gradient(circle at 24% 22%, rgba(255, 255, 255, 0.74), transparent 30%),
    radial-gradient(circle at 82% 62%, rgba(99, 217, 220, 0.2), transparent 32%);
  content: '';
  pointer-events: none;
}

@media (max-width: 920px) {
  .silence-page {
    overflow: visible;
  }
}
</style>
