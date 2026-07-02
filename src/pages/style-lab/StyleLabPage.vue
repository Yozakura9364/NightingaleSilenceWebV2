<template>
  <main
    class="style-lab-page"
    data-style-preview="pixel-soft"
    :data-font-mode="fontMode"
    :data-pixel-tone="pixelTone"
  >
    <div class="ns-pixel-stage">
      <div class="ns-pixel-shell">
        <div class="ns-pixel-switch-row">
          <div class="ns-pixel-mode-switch" aria-label="Pixel tone">
            <button
              v-for="option in pixelToneOptions"
              :key="option.value"
              class="ns-pixel-mode-button"
              :class="{ 'ns-pixel-mode-button--active': pixelTone === option.value }"
              type="button"
              @click="pixelTone = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="ns-pixel-mode-switch" aria-label="Font mode">
            <button
              v-for="option in fontModeOptions"
              :key="option.value"
              class="ns-pixel-mode-button"
              :class="{ 'ns-pixel-mode-button--active': fontMode === option.value }"
              type="button"
              @click="fontMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <section class="ns-pixel-hero">
          <div class="ns-pixel-panel">
            <h1 class="ns-pixel-title">Pixel Soft</h1>
            <p class="ns-pixel-lead">
              粉/蓝候选皮肤预览。这里用于比较公共按钮、面板、表单和工具卡的像素风方向。
            </p>

            <div class="ns-pixel-actions">
              <button class="ns-pixel-button ns-pixel-button--primary" type="button">
                Primary
              </button>
              <button class="ns-pixel-button ns-pixel-button--blue" type="button">
                Action
              </button>
              <button class="ns-pixel-button" type="button">
                Default
              </button>
            </div>
          </div>

          <aside class="ns-pixel-window" aria-label="Pixel soft sample window">
            <div class="ns-pixel-window__bar">
              <span>preview.config</span>
              <span class="ns-pixel-dots" aria-hidden="true">
                <span class="ns-pixel-dot"></span>
                <span class="ns-pixel-dot"></span>
                <span class="ns-pixel-dot"></span>
              </span>
            </div>

            <div class="ns-pixel-cluster">
              <span class="ns-pixel-badge ns-pixel-badge--pink">pink</span>
              <span class="ns-pixel-badge">blue</span>
              <span class="ns-pixel-badge ns-pixel-badge--green">ready</span>
            </div>

            <div class="ns-pixel-swatch-row" aria-label="Pixel soft palette">
              <span class="ns-pixel-swatch ns-pixel-swatch--pink"></span>
              <span class="ns-pixel-swatch ns-pixel-swatch--blue"></span>
              <span class="ns-pixel-swatch ns-pixel-swatch--yellow"></span>
              <span class="ns-pixel-swatch ns-pixel-swatch--green"></span>
            </div>

            <div class="ns-pixel-meter" aria-label="Preview progress">
              <div class="ns-pixel-meter__bar"></div>
            </div>
          </aside>
        </section>

        <section class="ns-pixel-window">
          <div class="ns-pixel-window__bar">
            <span>components.demo</span>
            <span>01</span>
          </div>

          <div class="ns-pixel-toolbar" aria-label="Pixel toolbar sample">
            <button class="ns-pixel-button ns-pixel-button--primary" type="button">
              Save
            </button>
            <button class="ns-pixel-button" type="button">
              Import
            </button>
            <button class="ns-pixel-button ns-pixel-button--blue" type="button">
              Export
            </button>
          </div>

          <hr class="ns-pixel-divider">

          <div class="ns-pixel-form-grid">
            <label class="ns-pixel-label">
              Name
              <input class="ns-pixel-input" type="text" value="Nightingale Silence">
            </label>

            <label class="ns-pixel-label">
              Module
              <select class="ns-pixel-select">
                <option>FFXIV</option>
                <option>Glamour</option>
                <option>Plate</option>
              </select>
            </label>
          </div>
        </section>

        <section class="ns-pixel-grid" aria-label="Pixel tool card samples">
          <article class="ns-pixel-card">
            <span class="ns-pixel-badge ns-pixel-badge--pink">tool</span>
            <h2 class="ns-pixel-card__title">幻化工房</h2>
            <p class="ns-pixel-card__text">
              工具卡样式样本，用来观察像素边框、标题密度和长文本换行。
            </p>
            <button class="ns-pixel-button ns-pixel-button--primary" type="button">
              Open
            </button>
          </article>

          <article class="ns-pixel-card ns-pixel-card--blue">
            <span class="ns-pixel-badge">tool</span>
            <h2 class="ns-pixel-card__title">铭牌工房</h2>
            <p class="ns-pixel-card__text">
              蓝色表面样本，用来判断工具入口是否保持足够清爽。
            </p>
            <button class="ns-pixel-button ns-pixel-button--blue" type="button">
              Open
            </button>
          </article>

          <article class="ns-pixel-card">
            <span class="ns-pixel-badge ns-pixel-badge--green">status</span>
            <h2 class="ns-pixel-card__title">状态面板</h2>
            <p class="ns-pixel-card__text">
              状态标签、硬阴影和粉蓝配色的组合样本。
            </p>
            <button class="ns-pixel-button" type="button">
              Details
            </button>
          </article>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type FontMode = 'decorative' | 'all-pixel'
type PixelTone = 'classic' | 'light'

const fontMode = ref<FontMode>('decorative')
const pixelTone = ref<PixelTone>('classic')

const fontModeOptions: Array<{ label: string; value: FontMode }> = [
  { label: '装饰像素', value: 'decorative' },
  { label: '全部像素', value: 'all-pixel' }
]

const pixelToneOptions: Array<{ label: string; value: PixelTone }> = [
  { label: '当前像素', value: 'classic' },
  { label: '轻像素', value: 'light' }
]
</script>

<style scoped>
.style-lab-page {
  min-height: 100vh;
}
</style>
