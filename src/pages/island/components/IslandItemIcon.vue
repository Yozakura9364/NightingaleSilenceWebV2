<template>
  <img
    v-if="src"
    class="island-icon"
    :src="src"
    :alt="alt || ''"
    loading="lazy"
    @error="failed = true"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { islandIconUrl } from '@/lib/island/icons'

const props = defineProps<{
  icon: number | null | undefined
  alt?: string
}>()

const failed = ref(false)
watch(
  () => props.icon,
  () => {
    failed.value = false
  }
)

const src = computed(() => (failed.value ? null : islandIconUrl(props.icon)))
</script>

<style scoped>
.island-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  object-fit: contain;
}
</style>
