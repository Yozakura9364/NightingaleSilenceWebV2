<template>
  <section class="nsplate-canvas-area">
    <div class="nsplate-canvas-viewport">
      <div class="nsplate-canvas-frame" :class="canvasClass">
        <img
          v-if="selectedAsset?.previewUrl"
          :src="selectedAsset.previewUrl"
          :alt="selectedAsset.label"
        />
        <span v-else class="nsplate-canvas-frame__empty" aria-hidden="true" />
      </div>
    </div>

    <footer class="nsplate-canvas-footer">
      <dl class="nsplate-canvas-status" aria-label="NSPlate preview selection">
        <div>
          <dt>模式</dt>
          <dd>{{ modeLabel }}</dd>
        </div>
        <div>
          <dt>预设</dt>
          <dd>{{ presetLabel }}</dd>
        </div>
        <div>
          <dt>素材</dt>
          <dd>{{ assetLabel }}</dd>
        </div>
      </dl>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  NSPlateAssetSummary,
  NSPlateCanvasMode,
  NSPlatePresetSummary
} from '@/pages/plate/types'

const props = defineProps<{
  mode: NSPlateCanvasMode
  selectedPreset: NSPlatePresetSummary | null
  selectedAsset: NSPlateAssetSummary | null
}>()

const canvasClass = computed(() =>
  props.mode === 'portrait' ? 'nsplate-canvas-frame--portrait' : 'nsplate-canvas-frame--nameplate'
)
const modeLabel = computed(() => (props.mode === 'portrait' ? '肖像' : '铭牌'))
const presetLabel = computed(() => props.selectedPreset?.label ?? '-')
const assetLabel = computed(() => props.selectedAsset?.label ?? '-')
</script>

<style scoped>
.nsplate-canvas-area {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 12px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.18) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px),
    color-mix(in srgb, var(--ns-color-bg-soft) 88%, var(--ns-color-cyan-soft));
  background-size:
    44px 44px,
    44px 44px,
    auto;
}

.nsplate-canvas-viewport {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.nsplate-canvas-frame {
  display: grid;
  place-items: center;
  overflow: hidden;
  max-width: min(92%, 960px);
  max-height: 92%;
  border: 1px solid var(--ns-color-border-strong);
  background:
    linear-gradient(45deg, rgba(88, 68, 105, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(88, 68, 105, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(88, 68, 105, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(88, 68, 105, 0.08) 75%),
    var(--ns-color-surface-solid);
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
  background-size: 20px 20px;
  box-shadow: 0 10px 32px rgba(42, 33, 56, 0.1);
}

.nsplate-canvas-frame--portrait {
  aspect-ratio: 512 / 840;
  width: auto;
  height: min(84%, 560px);
}

.nsplate-canvas-frame--nameplate {
  aspect-ratio: 16 / 9;
  width: min(84%, 920px);
}

.nsplate-canvas-frame img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  image-rendering: auto;
}

.nsplate-canvas-frame__empty {
  display: block;
  width: 56px;
  height: 56px;
  border: 1px dashed var(--ns-color-border-strong);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 52%, transparent);
}

.nsplate-canvas-footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  padding-top: 10px;
}

.nsplate-canvas-status {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, auto));
  flex: 0 0 auto;
  gap: 0;
  max-width: min(760px, calc(100% - 32px));
  margin: 0;
  padding: 6px 8px;
  border: 2px solid var(--ns-pixel-border-soft);
  border-radius: 0;
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsplate-canvas-status div {
  display: grid;
  min-width: 0;
  gap: 2px;
  padding: 0 12px;
}

.nsplate-canvas-status div + div {
  border-left: 1px solid var(--ns-pixel-divider);
}

.nsplate-canvas-status dt,
.nsplate-canvas-status dd {
  margin: 0;
  min-width: 0;
}

.nsplate-canvas-status dt {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-decorative);
  font-size: 11px;
  font-weight: 950;
}

.nsplate-canvas-status dd {
  max-width: 180px;
  overflow: hidden;
  color: var(--ns-color-text);
  font-size: 12px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .nsplate-canvas-area {
    min-height: 46vh;
  }

  .nsplate-canvas-viewport {
    padding: 10px 0 4px;
  }

  .nsplate-canvas-status {
    grid-template-columns: 1fr;
    width: min(260px, calc(100% - 24px));
    max-width: none;
  }

  .nsplate-canvas-status div + div {
    border-top: 1px solid var(--ns-pixel-divider);
    border-left: 0;
    padding-top: 6px;
  }

  .nsplate-canvas-frame--nameplate {
    width: min(86vw, 560px);
  }
}
</style>
