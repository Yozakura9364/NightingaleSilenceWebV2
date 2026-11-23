<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="island-map-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
      @click.self="emit('close')"
    >
      <div class="island-map-modal__panel ns-workbench-panel ns-workbench-panel--solid">
        <div class="island-map-modal__head">
          <strong>{{ label }}</strong>
          <button type="button" class="island-map-modal__close" @click="emit('close')">
            {{ t(islandTextKeys.mapClose) }}
          </button>
        </div>
        <IslandInteractiveMap
          :label="label"
          :markers="markers"
          :selected-id="highlightId"
          :background="ISLAND_MAP_BACKGROUND"
          :size-factor="ISLAND_MAP_SIZE_FACTOR"
          @select="emit('update:highlightId', $event)"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import IslandInteractiveMap, { type IslandInteractiveMarker } from '@/pages/island/components/IslandInteractiveMap.vue'
import { ISLAND_MAP_BACKGROUND, ISLAND_MAP_SIZE_FACTOR } from '@/lib/island/map'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  open: boolean
  label: string
  markers: IslandInteractiveMarker[]
  highlightId?: string
}>()

const emit = defineEmits<{
  close: []
  'update:highlightId': [id: string | null]
}>()

const { t } = useLocale()

// 弹窗打开时锁页面滚动。
watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  }
)
</script>

<style scoped>
.island-map-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.55);
}
.island-map-modal__panel {
  width: min(720px, 100%);
  max-height: calc(100vh - 32px);
  overflow: auto;
}
.island-map-modal__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.island-map-modal__close {
  padding: 6px 12px;
  border: 1px solid var(--ns-color-border-strong);
  border-radius: 6px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 13px;
  cursor: pointer;
}
</style>
