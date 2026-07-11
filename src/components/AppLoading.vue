<template>
  <div
    class="app-loading"
    :class="[
      `app-loading--${size}`,
      {
        'app-loading--compact': compact,
        'app-loading--overlay': overlay
      }
    ]"
    role="status"
    :aria-live="ariaLive"
    :aria-label="resolvedAriaLabel"
  >
    <div class="app-loading__card">
      <picture class="app-loading__media" aria-hidden="true">
        <source :srcset="loadingStill" media="(prefers-reduced-motion: reduce)" />
        <img class="app-loading__image" :src="loadingAnimation" alt="" decoding="async" />
      </picture>

      <div v-if="title || message || $slots.default" class="app-loading__content">
        <strong v-if="title" class="app-loading__title">{{ title }}</strong>
        <p v-if="message" class="app-loading__message">{{ message }}</p>
        <slot v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import loadingStill from '@/assets/loading/yoine-loading-still.png'
import loadingAnimation from '@/assets/loading/yoine-loading.webp'

const props = withDefaults(
  defineProps<{
    title?: string
    message?: string
    ariaLabel?: string
    ariaLive?: 'off' | 'polite' | 'assertive'
    compact?: boolean
    overlay?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    ariaLive: 'polite',
    compact: false,
    overlay: false,
    size: 'md'
  }
)

const resolvedAriaLabel = computed(() => props.ariaLabel || props.title || props.message)
</script>

<style scoped>
.app-loading {
  display: grid;
  min-width: 0;
  place-items: center;
  padding: 18px;
  color: var(--ns-color-text);
}

.app-loading--overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: color-mix(in srgb, var(--ns-color-bg) 62%, transparent);
}

.app-loading__card {
  display: grid;
  width: min(360px, 100%);
  min-width: 0;
  justify-items: center;
  gap: 10px;
  padding: 14px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bg, var(--ns-color-surface));
  box-shadow: var(--ns-pixel-window-shadow, var(--ns-pixel-soft-shadow));
}

.app-loading--compact .app-loading__card {
  grid-template-columns: 104px minmax(0, 1fr);
  align-items: center;
  justify-items: start;
  width: min(360px, 100%);
  padding: 10px 12px;
}

.app-loading__media {
  display: block;
  width: var(--app-loading-media-width);
  max-width: 100%;
  aspect-ratio: 560 / 203;
  overflow: hidden;
}

.app-loading__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: auto;
}

.app-loading__content {
  display: grid;
  min-width: 0;
  justify-items: center;
  gap: 4px;
  text-align: center;
}

.app-loading--compact .app-loading__content {
  justify-items: start;
  text-align: left;
}

.app-loading__title {
  min-width: 0;
  color: var(--ns-heading-bloom-color, var(--ns-color-text));
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 950;
  line-height: 1.2;
  text-shadow: var(--ns-heading-bloom-shadow, none);
}

.app-loading__message,
.app-loading__content :deep(p) {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.app-loading--sm {
  --app-loading-media-width: 132px;
}

.app-loading--md {
  --app-loading-media-width: 190px;
}

.app-loading--lg {
  --app-loading-media-width: 260px;
}

.app-loading--compact {
  --app-loading-media-width: 104px;
}

@media (max-width: 520px) {
  .app-loading {
    padding: 12px;
  }

  .app-loading--compact .app-loading__card {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .app-loading--compact .app-loading__content {
    justify-items: center;
    text-align: center;
  }
}
</style>
