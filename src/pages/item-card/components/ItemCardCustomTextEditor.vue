<template>
  <section class="custom-text-editor">
    <header class="custom-text-editor__head">
      <h2 class="custom-text-editor__title ns-heading-bloom">
        {{ t(textKeys.customTextPanel) }}
      </h2>
      <div class="custom-text-editor__add">
        <label for="item-card-custom-text-input">
          {{ t(textKeys.customTextInputLabel) }}
        </label>
        <textarea
          id="item-card-custom-text-input"
          v-model="newText"
          :placeholder="t(textKeys.customTextInputPlaceholder)"
          rows="2"
          @keydown.ctrl.enter.prevent="addText"
          @keydown.meta.enter.prevent="addText"
        />
        <button
          type="button"
          class="ns-button ns-button--compact"
          :disabled="!newText.trim()"
          @click="addText"
        >
          {{ t(textKeys.customTextAdd) }}
        </button>
      </div>
    </header>

    <div v-if="items.length" class="custom-text-editor__items">
      <article v-for="(item, index) in items" :key="item.id" class="custom-text-item">
        <span
          class="custom-text-item__drag-handle"
          draggable="true"
          :title="t(textKeys.canvasDragHint)"
          aria-hidden="true"
          @dragstart="startTextDrag($event, item)"
        >
          ⋮⋮
        </span>
        <textarea
          :value="item.text"
          :aria-label="`${t(textKeys.customTextInputLabel)} ${index + 1}`"
          rows="2"
          draggable="false"
          @input="updateText(item.id, $event)"
        />
        <div
          class="custom-text-item__preview ns-transparency-grid"
          role="img"
          :aria-label="item.text"
          draggable="false"
        >
          <canvas :ref="(element) => setCanvasRef(item.id, element)" draggable="false" />
        </div>
        <div class="custom-text-item__actions">
          <button
            type="button"
            class="ns-button ns-button--compact"
            draggable="false"
            @click="remove(item.id)"
          >
            {{ t(textKeys.customTextDelete) }}
          </button>
        </div>
      </article>
    </div>
    <p v-else class="custom-text-editor__empty">{{ t(textKeys.customTextEmpty) }}</p>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import {
  ITEM_CARD_CANVAS_DRAG_MIME,
  encodeItemCardCanvasDragSource
} from '@/pages/item-card/lib/canvasDrag'
import { renderCustomTextCanvas } from '@/pages/item-card/lib/customTextRenderer'
import type { ItemCardCustomText, ItemCardRenderSettings } from '@/pages/item-card/lib/types'
import { useItemCardCustomText } from '@/pages/item-card/composables/useItemCardCustomText'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  settings: ItemCardRenderSettings
}>()

const { t } = useLocale()
const { items, add, update, remove } = useItemCardCustomText()
const newText = ref('')
const canvasElements = new Map<string, HTMLCanvasElement>()
let renderId = 0

watch([items, () => props.settings], () => void renderAll(), { deep: true })
onMounted(() => void renderAll())
onBeforeUnmount(() => canvasElements.clear())

function setCanvasRef(id: string, element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLCanvasElement) {
    canvasElements.set(id, element)
  } else {
    canvasElements.delete(id)
  }
}

function addText() {
  if (add(newText.value)) {
    newText.value = ''
    void nextTick(renderAll)
  }
}

function updateText(id: string, event: Event) {
  update(id, (event.currentTarget as HTMLTextAreaElement).value)
}

function startTextDrag(event: DragEvent, item: ItemCardCustomText) {
  const transfer = event.dataTransfer
  if (!transfer) {
    event.preventDefault()
    return
  }
  transfer.effectAllowed = 'copy'
  transfer.setData(
    ITEM_CARD_CANVAS_DRAG_MIME,
    encodeItemCardCanvasDragSource({ kind: 'customText', sourceId: item.id })
  )
  transfer.setData('text/plain', item.text)
}

async function renderAll() {
  const taskId = ++renderId
  await nextTick()
  await Promise.all(
    items.value.map(async (item) => {
      const rendered = await renderCustomTextCanvas(item.text, props.settings)
      const canvas = canvasElements.get(item.id)
      if (taskId !== renderId || !canvas) {
        return
      }
      canvas.width = rendered.width
      canvas.height = rendered.height
      canvas.style.width = rendered.style.width
      canvas.style.height = rendered.style.height
      canvas.getContext('2d')?.drawImage(rendered, 0, 0)
    })
  )
}
</script>

<style scoped>
.custom-text-editor {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 14px;
}

.custom-text-editor__head,
.custom-text-editor__add,
.custom-text-item {
  display: grid;
  gap: 9px;
  min-width: 0;
}

.custom-text-editor__head {
  padding-bottom: 12px;
  border-bottom: var(--ns-line-width) solid var(--ns-color-border);
}

.custom-text-editor__title {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
}

.custom-text-editor__add label,
.custom-text-item textarea {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.custom-text-editor textarea {
  width: 100%;
  min-width: 0;
  padding: 7px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 12px/1.45 var(--ns-font-ui);
  resize: vertical;
}

.custom-text-editor__add button,
.custom-text-item__actions button {
  justify-self: start;
}

.custom-text-editor__items {
  display: grid;
  gap: 12px;
}

.custom-text-item {
  padding: 10px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface);
}

.custom-text-item__drag-handle {
  display: inline-flex;
  width: fit-content;
  color: var(--ns-color-text-muted);
  font: 700 14px/1 var(--ns-font-ui);
  letter-spacing: -2px;
  cursor: grab;
  user-select: none;
}

.custom-text-item__drag-handle:active {
  cursor: grabbing;
}

.custom-text-item__preview {
  min-width: 0;
  min-height: 64px;
  padding: 8px;
  overflow: auto;
}

.custom-text-item__preview canvas {
  display: block;
  max-width: none;
}

.custom-text-item__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.custom-text-editor__empty {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}
</style>
