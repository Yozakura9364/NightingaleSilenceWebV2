<template>
  <article class="custom-text-preview-row">
    <header>
      <strong>{{ title }}</strong>
      <button
        type="button"
        class="custom-text-preview-row__action ns-button ns-button--compact"
        @click="download"
      >
        {{ t(textKeys.customTextDownload) }}
      </button>
    </header>
    <div
      class="custom-text-preview-row__canvas ns-transparency-grid ns-scroll-area ns-scroll-area--compact"
    >
      <canvas ref="canvasElement" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { canvasToBlob, downloadBlob } from '@/pages/item-card/lib/cardRenderer'
import { makeItemCardCustomTextFileName } from '@/pages/item-card/lib/customText'
import { renderCustomTextCanvas } from '@/pages/item-card/lib/customTextRenderer'
import type { ItemCardCustomText, ItemCardRenderSettings } from '@/pages/item-card/lib/types'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  item: ItemCardCustomText
  settings: ItemCardRenderSettings
  index: number
}>()

const { t } = useLocale()
const canvasElement = ref<HTMLCanvasElement | null>(null)
const title = computed(() => props.item.text.split(/\r?\n/, 1)[0] || props.item.text)
let renderId = 0

watch(
  () => [props.item.text, props.settings],
  () => void render(),
  { deep: true }
)
onMounted(() => void render())

async function makeCanvas() {
  return renderCustomTextCanvas(props.item.text, props.settings)
}

async function render() {
  const taskId = ++renderId
  const rendered = await makeCanvas()
  if (taskId !== renderId || !canvasElement.value) {
    return
  }
  const canvas = canvasElement.value
  canvas.width = rendered.width
  canvas.height = rendered.height
  canvas.style.width = rendered.style.width
  canvas.style.height = rendered.style.height
  canvas.getContext('2d')?.drawImage(rendered, 0, 0)
}

async function download() {
  const canvas = await makeCanvas()
  downloadBlob(
    await canvasToBlob(canvas),
    makeItemCardCustomTextFileName(props.item.text, props.index)
  )
}
</script>

<style scoped>
.custom-text-preview-row {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface);
}

.custom-text-preview-row header {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.custom-text-preview-row header strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-text-preview-row__action {
  flex: 0 0 auto;
  min-height: 30px;
  padding: 4px 9px;
  border: var(--ns-line-width) solid var(--ns-color-border-strong);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-shadow-soft);
  color: var(--ns-color-text);
  font: 700 11px/1.15 var(--ns-font-ui);
  white-space: nowrap;
  cursor: pointer;
}

.custom-text-preview-row__action:hover,
.custom-text-preview-row__action:focus-visible {
  border-color: var(--ns-color-accent);
  background: var(--ns-color-surface-tint);
  outline: 0;
}

.custom-text-preview-row__canvas {
  min-width: 0;
  padding: 8px;
}

.custom-text-preview-row canvas {
  display: block;
  max-width: none;
}

@media (max-width: 640px) {
  .custom-text-preview-row header {
    align-items: stretch;
    flex-direction: column;
  }

  .custom-text-preview-row__action {
    align-self: flex-start;
  }
}
</style>
