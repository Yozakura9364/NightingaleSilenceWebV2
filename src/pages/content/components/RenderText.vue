<script setup lang="ts">
// RenderText.vue — recursive inline mark rendering for the public renderer (T041).
// No v-html: text is always rendered through interpolation (auto-escaped).
import { computed } from 'vue'
import { renderMark } from '@/lib/content/render/markRenderer'
import type { SafeMark } from '@/lib/content/render/contentViewModel'

const props = defineProps<{ text: string; marks: SafeMark[] }>()

const first = computed(() => props.marks[0] ?? null)
const rest = computed(() => props.marks.slice(1))
const rendered = computed(() => (first.value ? renderMark(first.value) : null))
</script>

<template>
  <template v-if="!rendered">{{ text }}</template>
  <component
    :is="rendered!.tag"
    v-else
    v-bind="rendered!.attrs ?? {}"
    :style="rendered!.style ?? undefined"
  >
    <RenderText :text="text" :marks="rest" />
  </component>
</template>
