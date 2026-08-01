<script setup lang="ts">
// ContentGallery.vue — public gallery rendering (T041). Layout is one of the
// three validated values; each image keeps its full display attrs
// (caption/align/displayWidth) and renders through ContentFigure.
import ContentFigure from './ContentFigure.vue'
import type { SafeGallery } from '@/lib/content/render/contentViewModel'

defineProps<{ gallery: SafeGallery }>()
</script>

<template>
  <figure class="ns-gallery" :class="`ns-gallery-${gallery.layout}`">
    <ContentFigure
      v-for="(image, i) in gallery.images"
      :key="i"
      :image="image"
    />
  </figure>
</template>
