<script setup lang="ts">
// ContentFigure.vue — public image rendering (T041). src is already validated
// by the view model (stable CDN URL); alt is always rendered.
import type { ImageAlign, DisplayWidth } from '@/lib/content/render/contentViewModel'

export interface FigureImage {
  src: string
  alt: string
  caption: string | null
  align: ImageAlign
  displayWidth: DisplayWidth
}

defineProps<{ image: FigureImage }>()

function imgStyle(displayWidth: number): Record<string, string> {
  return { maxWidth: `${displayWidth}%` }
}
</script>

<template>
  <figure class="ns-figure" :class="`ns-figure-${image.align}`">
    <img
      class="ns-img"
      :src="image.src"
      :alt="image.alt"
      :style="imgStyle(image.displayWidth)"
      loading="lazy"
    />
    <figcaption v-if="image.caption" class="ns-caption">{{ image.caption }}</figcaption>
  </figure>
</template>
