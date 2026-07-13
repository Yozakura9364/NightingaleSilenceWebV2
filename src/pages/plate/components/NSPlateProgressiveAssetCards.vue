<template>
  <div class="nsplate-progressive-asset-cards">
    <NSPlateAssetCard
      v-for="asset in visibleAssets"
      :key="asset.id"
      :asset="asset"
      :active="isActive(asset)"
      @select="emit('select', $event)"
    />
    <span
      v-if="hasMore"
      ref="sentinel"
      class="nsplate-progressive-asset-cards__sentinel"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { NSPlateAssetSummary } from '@/lib/plate/types'
import NSPlateAssetCard from '@/pages/plate/components/NSPlateAssetCard.vue'

const BATCH_SIZE = 72

const props = defineProps<{
  assets: NSPlateAssetSummary[]
  isActive: (asset: NSPlateAssetSummary) => boolean
}>()

const emit = defineEmits<{
  select: [asset: NSPlateAssetSummary]
}>()

const sentinel = ref<HTMLElement | null>(null)
const visibleCount = ref(BATCH_SIZE)
const visibleAssets = computed(() => props.assets.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < props.assets.length)
let observer: IntersectionObserver | null = null

function appendBatch() {
  visibleCount.value = Math.min(visibleCount.value + BATCH_SIZE, props.assets.length)
}

watch(
  () => props.assets,
  () => {
    visibleCount.value = BATCH_SIZE
  }
)

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        appendBatch()
      }
    },
    { rootMargin: '480px 0px' }
  )

  if (sentinel.value) {
    observer.observe(sentinel.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.nsplate-progressive-asset-cards {
  display: contents;
}

.nsplate-progressive-asset-cards__sentinel {
  grid-column: 1 / -1;
  height: 1px;
  pointer-events: none;
}
</style>
