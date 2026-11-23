<template>
  <div class="island-imap">
    <div
      ref="viewport"
      class="island-imap__viewport"
      :class="{ 'island-imap__viewport--grabbing': dragging }"
      role="img"
      :aria-label="label"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel.prevent="onWheel"
    >
      <div
        class="island-imap__plane"
        :style="{
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          '--marker-scale': `${1 / scale}`,
          backgroundImage: background ? `url(${background})` : undefined
        }"
      >
        <button
          v-for="marker in markers"
          :key="marker.id"
          type="button"
          class="island-imap__marker"
          :class="{
            'island-imap__marker--active': marker.id === selectedId,
            'island-imap__marker--highlight': marker.highlight
          }"
          :style="{ left: `${percent(marker.x)}%`, top: `${percent(marker.y)}%` }"
          :title="marker.name"
          @pointerdown.stop
          @click.stop="emit('select', marker.id)"
        >
          <IslandItemIcon :icon="marker.icon" :alt="marker.name" />
        </button>
      </div>
      <button type="button" class="island-imap__reset" @click="resetView">↺</button>
    </div>
    <p class="island-imap__hint">{{ t(islandTextKeys.mapHint) }}</p>
    <div v-if="selected" class="island-imap__info">
      <IslandItemIcon :icon="selected.icon" :alt="selected.name" />
      <strong>{{ selected.name }}</strong>
      <small>{{ kindLabel(selected.kind) }} · ({{ selected.x }}, {{ selected.y }})</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import IslandItemIcon from '@/pages/island/components/IslandItemIcon.vue'
import { islandCoordToPercent } from '@/lib/island/map'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

export interface IslandInteractiveMarker {
  id: string
  kind: 'animal' | 'gather'
  icon: number | null
  name: string
  x: number
  y: number
  highlight?: boolean
}

const props = withDefaults(
  defineProps<{
    label: string
    markers: IslandInteractiveMarker[]
    selectedId?: string
    background?: string
    sizeFactor?: number
  }>(),
  {
    selectedId: undefined,
    background: undefined,
    sizeFactor: 100
  }
)

const emit = defineEmits<{
  select: [id: string | null]
}>()

const { t } = useLocale()
const viewport = ref<HTMLElement | null>(null)
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const dragging = ref(false)
let lastX = 0
let lastY = 0

const MIN_SCALE = 1
const MAX_SCALE = 4

function percent(coord: number) {
  const raw = islandCoordToPercent(coord, props.sizeFactor)
  return Math.min(100, Math.max(0, raw))
}

const selected = computed(() => props.markers.find((marker) => marker.id === props.selectedId) ?? null)

function kindLabel(kind: string) {
  return kind === 'animal' ? t(islandTextKeys.mapKindAnimal) : t(islandTextKeys.mapKindGathering)
}

function onPointerDown(event: PointerEvent) {
  dragging.value = true
  lastX = event.clientX
  lastY = event.clientY
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) {
    return
  }
  tx.value += event.clientX - lastX
  ty.value += event.clientY - lastY
  lastX = event.clientX
  lastY = event.clientY
}

function onPointerUp() {
  dragging.value = false
}

function onWheel(event: WheelEvent) {
  const viewportEl = viewport.value
  if (!viewportEl) {
    return
  }
  const rect = viewportEl.getBoundingClientRect()
  const mx = event.clientX - rect.left - rect.width / 2
  const my = event.clientY - rect.top - rect.height / 2
  const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * (1 - event.deltaY * 0.0015)))
  if (next === scale.value) {
    return
  }
  // 以光标为中心缩放：保持光标下的地图点不动（transform-origin 为中心）。
  tx.value = mx - ((mx - tx.value) * next) / scale.value
  ty.value = my - ((my - ty.value) * next) / scale.value
  scale.value = next
}

function resetView() {
  scale.value = 1
  tx.value = 0
  ty.value = 0
}
</script>

<style scoped>
.island-imap__viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border: 1px solid var(--ns-color-border);
  border-radius: 8px;
  background-color: var(--ns-color-surface-solid);
  touch-action: none;
  cursor: grab;
  user-select: none;
}
.island-imap__viewport--grabbing {
  cursor: grabbing;
}
.island-imap__plane {
  position: absolute;
  inset: 0;
  transform-origin: center center;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  will-change: transform;
}
.island-imap__marker {
  position: absolute;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  transform: translate(-50%, -50%) scale(calc(1 / var(--marker-scale, 1)));
  border: 1px solid var(--ns-color-border-strong);
  border-radius: 50%;
  background: var(--ns-color-surface-solid);
  cursor: pointer;
}
.island-imap__marker :deep(.island-icon) {
  width: 26px;
  height: 26px;
}
.island-imap__marker--highlight {
  border-color: var(--ns-color-accent-strong);
}
.island-imap__marker--active {
  border-color: var(--ns-color-accent-strong);
  box-shadow: 0 0 0 2px var(--ns-color-accent-strong);
}
.island-imap__reset {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 32px;
  height: 32px;
  border: 1px solid var(--ns-color-border-strong);
  border-radius: 50%;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-size: 15px;
  cursor: pointer;
}
.island-imap__hint {
  margin: 6px 0 0;
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.island-imap__info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: 6px;
  font-size: 14px;
}
.island-imap__info small {
  color: var(--ns-color-text-muted);
}
</style>
