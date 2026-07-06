<template>
  <button
    class="nsplate-asset-card"
    :class="{ 'nsplate-asset-card--active': props.active }"
    :data-scope="props.asset.scope"
    :style="cardStyle"
    type="button"
    @click="emit('select', props.asset)"
  >
    <span class="nsplate-asset-card__image">
      <img
        v-if="imageSource"
        :src="imageSource"
        :alt="props.asset.label"
        loading="lazy"
        @load="updateImageRatio"
        @error="useFallbackImage"
      />
    </span>
    <span class="nsplate-asset-card__label">{{ props.asset.label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref, watch, type CSSProperties } from 'vue'
import sparklesIcon from '@/assets/icons/sparkles.svg'
import type { NSPlateAssetSummary } from '@/lib/plate/types'

const props = withDefaults(
  defineProps<{
    asset: NSPlateAssetSummary
    active: boolean
    preferOriginal?: boolean
  }>(),
  {
    preferOriginal: false
  }
)

const imageFallbackUsed = ref(false)
const imageRatio = ref<number | null>(null)
const imageSource = computed(() => {
  const primary = props.preferOriginal
    ? props.asset.imageUrl || props.asset.previewUrl
    : props.asset.previewUrl || props.asset.imageUrl
  const fallback = props.preferOriginal
    ? props.asset.previewUrl || props.asset.imageUrl
    : props.asset.imageUrl || props.asset.previewUrl

  return imageFallbackUsed.value ? fallback : primary
})

watch(
  () => props.asset.id,
  () => {
    imageFallbackUsed.value = false
    imageRatio.value = null
  }
)

function updateImageRatio(event: Event) {
  const image = event.currentTarget

  if (!(image instanceof HTMLImageElement) || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    imageRatio.value = null
    return
  }

  imageRatio.value = image.naturalWidth / image.naturalHeight
}

function useFallbackImage() {
  imageRatio.value = null
  imageFallbackUsed.value = true
}

const emit = defineEmits<{
  select: [value: NSPlateAssetSummary]
}>()

const cardStyle = computed(
  () =>
    ({
      '--nsplate-asset-card-active-icon': `url("${sparklesIcon}")`,
      ...(imageRatio.value
        ? { '--nsplate-asset-card-thumbnail-ratio': String(imageRatio.value) }
        : {})
    }) as CSSProperties
)
</script>

<style scoped>
.nsplate-asset-card {
  position: relative;
  display: grid;
  --nsplate-asset-card-thumbnail-ratio: 9 / 16;
  grid-template-rows: auto auto;
  align-self: start;
  gap: 6px;
  min-width: 0;
  padding: 7px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 76%, transparent);
  color: var(--ns-color-text);
  font: inherit;
  cursor: pointer;
}

.nsplate-asset-card[data-scope='nameplate'] {
  --nsplate-asset-card-thumbnail-ratio: 16 / 9;
}

.nsplate-asset-card:hover {
  border-color: color-mix(in srgb, var(--ns-color-accent-strong) 48%, var(--ns-color-border));
  background: color-mix(in srgb, var(--ns-color-cyan) 9%, var(--ns-color-surface-solid));
}

.nsplate-asset-card--active {
  border-color: var(--ns-color-accent-strong);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 90%, var(--ns-color-cyan-soft));
  box-shadow:
    inset 0 0 0 2px color-mix(in srgb, var(--ns-color-accent-strong) 78%, transparent),
    3px 3px 0 color-mix(in srgb, var(--ns-color-accent-strong) 22%, transparent);
}

.nsplate-asset-card--active::before,
.nsplate-asset-card--active::after {
  position: absolute;
  pointer-events: none;
  content: '';
}

.nsplate-asset-card--active::before {
  top: 3px;
  right: 3px;
  width: 18px;
  height: 18px;
  border: 1px solid var(--ns-color-accent-strong);
  background: var(--ns-color-bg);
  box-shadow: 2px 2px 0 color-mix(in srgb, var(--ns-color-accent-strong) 24%, transparent);
}

.nsplate-asset-card--active::after {
  top: 7px;
  right: 7px;
  width: 11px;
  height: 11px;
  background: var(--ns-color-accent-strong);
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--ns-color-accent) 45%, transparent));
  image-rendering: pixelated;
  mask: var(--nsplate-asset-card-active-icon) center / contain no-repeat;
  -webkit-mask: var(--nsplate-asset-card-active-icon) center / contain no-repeat;
}

.nsplate-asset-card--active .nsplate-asset-card__label {
  color: var(--ns-color-text);
}

.nsplate-asset-card__image {
  display: grid;
  aspect-ratio: var(--nsplate-asset-card-thumbnail-ratio);
  place-items: center;
  overflow: hidden;
  border-radius: var(--ns-radius-xs);
  background:
    linear-gradient(45deg, rgba(88, 68, 105, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(88, 68, 105, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(88, 68, 105, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(88, 68, 105, 0.08) 75%);
  background-position:
    0 0,
    0 6px,
    6px -6px,
    -6px 0;
  background-size: 12px 12px;
}

.nsplate-asset-card__image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.nsplate-asset-card__label {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.28;
  overflow-wrap: anywhere;
  text-align: center;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
</style>
