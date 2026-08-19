<template>
  <Teleport to="#item-card-canvas-layer-menu-host">
    <section
      v-if="open"
      id="item-card-canvas-layer-menu"
      class="canvas-board__layers"
      :aria-label="t(textKeys.canvasLayers)"
      @click.stop
    >
      <ol class="canvas-board__layer-list">
        <li
          v-for="layer in displayLayers"
          :key="layer.id"
          draggable="true"
          :class="{
            'canvas-board__layer-row--selected': layer.id === selectedLayerId,
            'canvas-board__layer-row--dragging': layer.id === dragSourceId,
            'canvas-board__layer-row--drag-over': layer.id === dragTargetId
          }"
          @click="emit('select', layer.id)"
          @dragstart="onDragStart($event, layer)"
          @dragover.prevent="onDragOver($event, layer)"
          @drop.prevent="emit('list-drop', layer)"
          @dragend="emit('list-drag-end')"
        >
          <div class="canvas-board__layer-head">
            <span class="canvas-board__layer-name">{{ layer.name }}</span>
            <span class="canvas-board__layer-ops">
              <button
                type="button"
                class="canvas-board__layer-ops--danger"
                :aria-label="t(textKeys.canvasLayerDelete)"
                :title="t(textKeys.canvasLayerDelete)"
                @click.stop="emit('remove', layer.id)"
              >
                ×
              </button>
            </span>
          </div>
          <div class="canvas-board__layer-controls" @click.stop>
            <div class="canvas-board__layer-scale">
              <span>{{ t(textKeys.canvasLayerScale) }}</span>
              <input
                class="ns-range"
                type="range"
                min="0.1"
                max="4"
                step="0.05"
                :value="layer.scale"
                :aria-label="`${t(textKeys.canvasLayerScale)}: ${layer.name}`"
                @input="emit('scale-input', layer, $event)"
              />
              <label class="canvas-board__layer-scale-value">
                <span class="ns-sr-only">{{ t(textKeys.canvasLayerScale) }}</span>
                <input
                  type="number"
                  min="10"
                  max="400"
                  step="1"
                  :value="Math.round(layer.scale * 100)"
                  :aria-label="`${t(textKeys.canvasLayerScale)}: ${layer.name}`"
                  @change="emit('scale-value-change', layer, $event)"
                />
                <span aria-hidden="true">%</span>
              </label>
            </div>
            <div class="canvas-board__layer-position">
              <label>
                <span aria-hidden="true">{{ t(textKeys.canvasLayerAxisX) }}</span>
                <input
                  type="number"
                  :value="layer.x"
                  :aria-label="`${t(textKeys.canvasLayerX)}: ${layer.name}`"
                  @input="emit('coordinate-input', layer, 'x', $event)"
                />
              </label>
              <label>
                <span aria-hidden="true">{{ t(textKeys.canvasLayerAxisY) }}</span>
                <input
                  type="number"
                  :value="layer.y"
                  :aria-label="`${t(textKeys.canvasLayerY)}: ${layer.name}`"
                  @input="emit('coordinate-input', layer, 'y', $event)"
                />
              </label>
            </div>
          </div>
        </li>
      </ol>
      <p v-if="!displayLayers.length" class="canvas-board__layers-empty">
        {{ t(textKeys.canvasEmpty) }}
      </p>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import type { ItemCardCanvasLayer } from '@/pages/item-card/lib/canvasTypes'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

defineProps<{
  open: boolean
  displayLayers: ItemCardCanvasLayer[]
  selectedLayerId: string
  dragSourceId: string
  dragTargetId: string
}>()

const emit = defineEmits<{
  select: [layerId: string]
  remove: [layerId: string]
  'scale-input': [layer: ItemCardCanvasLayer, event: Event]
  'scale-value-change': [layer: ItemCardCanvasLayer, event: Event]
  'coordinate-input': [layer: ItemCardCanvasLayer, axis: 'x' | 'y', event: Event]
  'list-drag-start': [event: DragEvent, layer: ItemCardCanvasLayer]
  'list-drag-over': [event: DragEvent, layer: ItemCardCanvasLayer]
  'list-drop': [layer: ItemCardCanvasLayer]
  'list-drag-end': []
}>()

const { t } = useLocale()

function onDragStart(event: DragEvent, layer: ItemCardCanvasLayer) {
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLButtonElement
  ) {
    event.preventDefault()
    return
  }
  emit('list-drag-start', event, layer)
}

function onDragOver(event: DragEvent, layer: ItemCardCanvasLayer) {
  emit('list-drag-over', event, layer)
}
</script>

<style scoped>
.canvas-board__layers {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  right: 0;
  display: grid;
  gap: 6px;
  width: min(420px, calc(100vw - 24px));
  padding: 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-shadow-panel);
}

.canvas-board__layer-list {
  display: grid;
  gap: 8px;
  max-height: min(52vh, 360px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  scrollbar-gutter: auto;
  list-style: none;
}

.canvas-board__layer-list li {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface);
  font-size: 12px;
  cursor: grab;
  transition:
    border-color var(--ns-transition-fast),
    background var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.canvas-board__layer-list li:hover {
  border-color: var(--ns-color-accent);
  box-shadow: var(--ns-shadow-soft);
}

.canvas-board__layer-list li.canvas-board__layer-row--dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.canvas-board__layer-list li.canvas-board__layer-row--drag-over {
  border-color: var(--ns-color-accent-strong);
  box-shadow: inset 0 2px 0 var(--ns-color-accent-strong);
}

.canvas-board__layer-list li.canvas-board__layer-row--selected,
.canvas-board__layer-list li.canvas-board__layer-row--selected:hover {
  border-color: var(--ns-color-accent);
  background: var(--ns-color-accent-soft);
  box-shadow: var(--ns-shadow-soft);
}

.canvas-board__layer-name {
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-board__layer-head {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.canvas-board__layer-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  min-width: 0;
}

.canvas-board__layers-empty {
  margin: 0;
  padding: 4px 2px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  line-height: 1.5;
}

.canvas-board__layer-scale {
  display: flex;
  flex: 1 1 180px;
  min-width: 168px;
  align-items: center;
  gap: 6px;
}

.canvas-board__layer-scale > span {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.canvas-board__layer-scale input[type='range'] {
  flex: 1 1 80px;
  width: 80px;
  min-width: 0;
  accent-color: var(--ns-color-accent-strong);
}

.canvas-board__layer-scale-value {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.canvas-board__layer-scale-value input {
  width: 48px;
  min-height: 24px;
  padding: 2px 4px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 11px var(--ns-font-data);
  text-align: right;
}

.canvas-board__layer-scale-value input:focus,
.canvas-board__layer-position input:focus {
  border-color: var(--ns-color-accent-strong);
  outline: 0;
}

.canvas-board__layer-position {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.canvas-board__layer-position label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.canvas-board__layer-position label > span {
  color: var(--ns-color-text-muted);
  font: 700 11px var(--ns-font-data);
}

.canvas-board__layer-position input {
  width: 54px;
  min-height: 24px;
  padding: 2px 4px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 11px var(--ns-font-data);
}

.canvas-board__layer-ops {
  display: flex;
  flex: 0 0 auto;
  gap: 3px;
}

.canvas-board__layer-ops button {
  min-width: 28px;
  min-height: 28px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--ns-radius-sm);
  background: transparent;
  box-shadow: none;
  color: var(--ns-color-text-muted);
  font: 700 11px/1 var(--ns-font-ui);
  cursor: pointer;
  transition:
    border-color var(--ns-transition-fast),
    color var(--ns-transition-fast),
    background var(--ns-transition-fast);
}

.canvas-board__layer-ops button:hover,
.canvas-board__layer-ops button:focus-visible {
  border-color: var(--ns-color-accent);
  background: var(--ns-color-accent-soft);
  color: var(--ns-color-text);
  outline: 0;
}

.canvas-board__layer-ops button.canvas-board__layer-ops--danger:hover,
.canvas-board__layer-ops button.canvas-board__layer-ops--danger:focus-visible {
  border-color: var(--ns-color-danger, #b4453c);
  background: transparent;
  color: var(--ns-color-danger, #b4453c);
}

@media (max-width: 720px) {
  .canvas-board__layers {
    width: min(420px, calc(100vw - 24px));
  }

  .canvas-board__layer-position {
    justify-content: space-between;
  }
}
</style>
