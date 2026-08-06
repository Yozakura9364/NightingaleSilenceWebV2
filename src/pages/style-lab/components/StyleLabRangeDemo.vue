<template>
  <section class="style-range-lab" :aria-label="t(textKeys.styleLabRangeTitle)">
    <AppPixelWindow :title="t(textKeys.styleLabRangeTitle)" :closable="false">
      <div class="style-range-lab__grid">
        <div class="style-range-lab__group">
          <h3 class="style-range-lab__group-title">{{ t(textKeys.styleLabRangeNormal) }}</h3>
          <div class="style-range-lab__row">
            <input
              v-model.number="normalValue"
              class="ns-range"
              type="range"
              min="0"
              max="100"
              step="1"
              :aria-label="t(textKeys.styleLabRangeNormal)"
            />
            <output>{{ normalValue }}</output>
          </div>
          <div class="style-range-lab__row">
            <input
              class="ns-range"
              type="range"
              min="0"
              max="100"
              step="1"
              value="40"
              disabled
              :aria-label="`${t(textKeys.styleLabRangeNormal)} / ${t(textKeys.styleLabRangeDisabled)}`"
            />
            <output>40</output>
          </div>
        </div>

        <div class="style-range-lab__group">
          <h3 class="style-range-lab__group-title">{{ t(textKeys.styleLabRangePixel) }}</h3>
          <div class="style-range-lab__row">
            <input
              v-model.number="pixelValue"
              class="ns-range ns-range--pixel"
              type="range"
              min="0"
              max="100"
              step="1"
              :aria-label="t(textKeys.styleLabRangePixel)"
            />
            <output>{{ pixelValue }}</output>
          </div>
          <div class="style-range-lab__row">
            <input
              class="ns-range ns-range--pixel"
              type="range"
              min="0"
              max="100"
              step="1"
              value="40"
              disabled
              :aria-label="`${t(textKeys.styleLabRangePixel)} / ${t(textKeys.styleLabRangeDisabled)}`"
            />
            <output>40</output>
          </div>
        </div>
      </div>
    </AppPixelWindow>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { allTextKeys as textKeys } from '@/locales/keys/all'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
const normalValue = ref(65)
const pixelValue = ref(65)
</script>

<style scoped>
.style-range-lab__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.style-range-lab__group {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.style-range-lab__group-title {
  margin: 0;
  font-family: var(--ns-font-pixel);
  font-size: 14px;
  font-weight: 950;
}

.style-range-lab__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 3ch;
  align-items: center;
  gap: 12px;
}

.style-range-lab__row output {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

@media (max-width: 760px) {
  .style-range-lab__grid {
    grid-template-columns: 1fr;
  }
}
</style>
