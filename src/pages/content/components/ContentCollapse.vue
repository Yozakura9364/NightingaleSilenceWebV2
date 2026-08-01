<script setup lang="ts">
// ContentCollapse.vue — public collapse rendering (T041) via native
// <details>/<summary> (no JS state needed). Body renders through ContentRichText.
import ContentRichText from './ContentRichText.vue'
import type { SafeBlock } from '@/lib/content/render/contentViewModel'

defineProps<{ title: string; blocks: SafeBlock[] }>()
</script>

<template>
  <details class="ns-collapse">
    <summary class="ns-collapse-summary">{{ title }}</summary>
    <div class="ns-collapse-body">
      <ContentRichText :document="{ blocks }" />
    </div>
  </details>
</template>
