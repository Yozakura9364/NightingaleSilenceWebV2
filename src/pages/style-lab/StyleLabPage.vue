<template>
  <main
    class="style-lab-page"
    :data-style-preview="stylePreview"
    :data-font-mode="fontMode"
    :data-pixel-tone="pixelTone"
  >
    <div v-if="stylePreview === 'pixel-soft'" class="ns-pixel-stage">
      <div class="ns-pixel-shell">
        <div class="style-lab-picker" aria-label="Style preview">
          <button
            v-for="option in stylePreviewOptions"
            :key="option.value"
            class="style-lab-picker__button"
            :class="{ 'style-lab-picker__button--active': stylePreview === option.value }"
            type="button"
            @click="stylePreview = option.value"
          >
            {{ option.label }}
          </button>
        </div>

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
              <button class="ns-pixel-button ns-pixel-button--blue" type="button">Action</button>
              <button class="ns-pixel-button" type="button">Default</button>
            </div>
          </div>

          <aside class="ns-pixel-window" aria-label="Pixel soft sample window">
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                preview.config
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
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

        <section class="ns-pixel-menu-lab" aria-label="Millennium pixel popup menu sample">
          <div class="ns-pixel-menu-stage">
            <div class="ns-pixel-menu-stage__topbar">
              <span>Nightingale Silence</span>
              <button class="ns-pixel-menu-trigger" type="button">MENU.EXE</button>
            </div>

            <aside
              class="ns-pixel-window ns-pixel-menu-popup"
              aria-label="Popup menu window sample"
            >
              <div class="ns-pixel-window__bar">
                <span class="ns-pixel-window__title">
                  <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                  nightingale.menu
                </span>
                <span class="ns-pixel-window__controls" aria-hidden="true">
                  <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                  <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                  <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
                </span>
              </div>

              <nav class="ns-pixel-popup-menu" aria-label="Pixel popup navigation sample">
                <a
                  class="ns-pixel-popup-menu__item ns-pixel-popup-menu__item--active"
                  href="#/ffxiv"
                >
                  <span>FF14工具</span>
                  <span>OPEN</span>
                </a>

                <div class="ns-pixel-popup-menu__children" aria-label="FF14 tool children">
                  <a href="#/ffxiv/glamour">幻化工房</a>
                  <a href="#/ffxiv/plate">铭牌工房</a>
                </div>

                <a class="ns-pixel-popup-menu__item" href="#/about">
                  <span>About</span>
                  <span>TXT</span>
                </a>

                <a class="ns-pixel-popup-menu__item" href="#/style-lab">
                  <span>OC</span>
                  <span>WIP</span>
                </a>

                <div class="ns-pixel-popup-menu__children" aria-label="OC children">
                  <a href="#/style-lab">Silence</a>
                </div>
              </nav>

              <div class="ns-pixel-menu-popup__status">
                <span>STATUS</span>
                <strong>占位用，待编辑</strong>
              </div>
            </aside>
          </div>
        </section>

        <section
          class="ns-pixel-window ns-pixel-workbench"
          aria-label="Pixel soft workbench sample"
        >
          <div class="ns-pixel-window__bar">
            <span class="ns-pixel-window__title">
              <span class="ns-pixel-window__icon" aria-hidden="true"></span>
              workspace.preview
            </span>
            <span class="ns-pixel-window__controls" aria-hidden="true">
              <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
              <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
              <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
            </span>
          </div>

          <div class="ns-pixel-workbench__toolbar" aria-label="Workbench toolbar sample">
            <button class="ns-pixel-button ns-pixel-button--primary" type="button">导入</button>
            <button class="ns-pixel-button" type="button">保存草稿</button>
            <button class="ns-pixel-button ns-pixel-button--blue" type="button">导出</button>
            <span class="ns-pixel-workbench__hint">pixel-soft-lite / 占位用，待编辑</span>
          </div>

          <div class="ns-pixel-workbench__grid">
            <aside class="ns-pixel-workbench__side" aria-label="Workbench sidebar sample">
              <div class="ns-pixel-workbench__panel-title">工具</div>
              <button class="ns-pixel-tool-row ns-pixel-tool-row--active" type="button">
                <span>装备栏</span>
                <small>12</small>
              </button>
              <button class="ns-pixel-tool-row" type="button">
                <span>模板</span>
                <small>06</small>
              </button>
              <button class="ns-pixel-tool-row" type="button">
                <span>素材</span>
                <small>03</small>
              </button>

              <div class="ns-pixel-workbench__panel-title">图层</div>
              <div class="ns-pixel-layer-stack">
                <span>Title</span>
                <span>Character</span>
                <span>Equipment</span>
                <span>Background</span>
              </div>
            </aside>

            <section class="ns-pixel-workbench__canvas" aria-label="Workbench canvas sample">
              <div class="ns-pixel-canvas-card">
                <div class="ns-pixel-canvas-card__chrome">
                  <span>preview.canvas</span>
                  <span>1440 x 1920</span>
                </div>
                <div class="ns-pixel-canvas-card__body">
                  <div class="ns-pixel-canvas-card__avatar" aria-hidden="true"></div>
                  <div class="ns-pixel-canvas-card__lines">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>占位用，待编辑</p>
                </div>
              </div>
            </section>

            <aside class="ns-pixel-workbench__inspector" aria-label="Workbench inspector sample">
              <div class="ns-pixel-workbench__panel-title">检查器</div>
              <label class="ns-pixel-label">
                标题
                <input class="ns-pixel-input" type="text" value="占位用，待编辑" />
              </label>
              <label class="ns-pixel-label">
                语言
                <select class="ns-pixel-select">
                  <option>简体中文</option>
                  <option>English</option>
                  <option>Français</option>
                  <option>Deutsch</option>
                </select>
              </label>
              <div class="ns-pixel-mini-meters" aria-label="Workbench setting meters">
                <span style="--meter-width: 72%"></span>
                <span style="--meter-width: 48%"></span>
                <span style="--meter-width: 86%"></span>
              </div>
            </aside>
          </div>

          <div class="ns-pixel-workbench__status">
            <span>Ready</span>
            <span>12 items</span>
            <span>占位用，待编辑</span>
          </div>
        </section>

        <section class="ns-pixel-window">
          <div class="ns-pixel-window__bar">
            <span class="ns-pixel-window__title">
              <span class="ns-pixel-window__icon" aria-hidden="true"></span>
              components.demo
            </span>
            <span class="ns-pixel-window__controls" aria-hidden="true">
              <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
              <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
              <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
            </span>
          </div>

          <div class="ns-pixel-toolbar" aria-label="Pixel toolbar sample">
            <button class="ns-pixel-button ns-pixel-button--primary" type="button">Save</button>
            <button class="ns-pixel-button" type="button">Import</button>
            <button class="ns-pixel-button ns-pixel-button--blue" type="button">Export</button>
          </div>

          <hr class="ns-pixel-divider" />

          <div class="ns-pixel-form-grid">
            <label class="ns-pixel-label">
              Name
              <input class="ns-pixel-input" type="text" value="Nightingale Silence" />
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
            <button class="ns-pixel-button ns-pixel-button--primary" type="button">Open</button>
          </article>

          <article class="ns-pixel-card ns-pixel-card--blue">
            <span class="ns-pixel-badge">tool</span>
            <h2 class="ns-pixel-card__title">铭牌工房</h2>
            <p class="ns-pixel-card__text">蓝色表面样本，用来判断工具入口是否保持足够清爽。</p>
            <button class="ns-pixel-button ns-pixel-button--blue" type="button">Open</button>
          </article>

          <article class="ns-pixel-card">
            <span class="ns-pixel-badge ns-pixel-badge--green">status</span>
            <h2 class="ns-pixel-card__title">状态面板</h2>
            <p class="ns-pixel-card__text">状态标签、硬阴影和粉蓝配色的组合样本。</p>
            <button class="ns-pixel-button" type="button">Details</button>
          </article>
        </section>
      </div>
    </div>

    <div v-else class="ns-fantasy-stage">
      <div class="ns-fantasy-shell">
        <div class="style-lab-picker" aria-label="Style preview">
          <button
            v-for="option in stylePreviewOptions"
            :key="option.value"
            class="style-lab-picker__button"
            :class="{ 'style-lab-picker__button--active': stylePreview === option.value }"
            type="button"
            @click="stylePreview = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <section class="ns-fantasy-card" aria-label="Fantasy original character card sample">
          <aside class="ns-fantasy-portrait-panel">
            <div class="ns-fantasy-portrait" aria-hidden="true">
              <span>OC</span>
            </div>

            <div class="ns-fantasy-seal">
              <span>星海记录</span>
            </div>
          </aside>

          <div class="ns-fantasy-profile">
            <div class="ns-fantasy-heading">
              <p class="ns-fantasy-kicker">Final Fantasy XIV Original Character</p>
              <h1 class="ns-fantasy-title">夜莺不语</h1>
              <p class="ns-fantasy-subtitle">占星术士 / 星海旅人 / 水晶档案持有者</p>
            </div>

            <p class="ns-fantasy-lead">
              从艾欧泽亚的星图边缘走来，把每一次启程都写进银蓝色的手札。
              她收藏旧城的钟声、战场后的花瓣，以及没人愿意说出口的愿望。
            </p>

            <div class="ns-fantasy-tags" aria-label="Character keywords">
              <span>水晶</span>
              <span>月白</span>
              <span>蔷薇金</span>
              <span>远行</span>
            </div>

            <div class="ns-fantasy-stat-grid">
              <article class="ns-fantasy-stat">
                <span>JOB</span>
                <strong>占星术士</strong>
              </article>
              <article class="ns-fantasy-stat">
                <span>ROLE</span>
                <strong>Healer</strong>
              </article>
              <article class="ns-fantasy-stat">
                <span>HOME</span>
                <strong>伊修加德</strong>
              </article>
              <article class="ns-fantasy-stat">
                <span>MOOD</span>
                <strong>银蓝 / 酒红</strong>
              </article>
            </div>

            <div class="ns-fantasy-ledger">
              <section class="ns-fantasy-section">
                <h2>装备印象</h2>
                <ul>
                  <li>星盘边缘镶着细碎水晶，转动时像小型星河。</li>
                  <li>长外套带旧书页一样的纹理，袖口压着暗金线。</li>
                  <li>耳坠是旅途中换来的银色小坠饰。</li>
                </ul>
              </section>

              <section class="ns-fantasy-section">
                <h2>角色片段</h2>
                <p>
                  她总在黎明前整理行装。星图、墨水和一小束干花被放进同一个皮质匣子里，
                  像是给下一次相遇留下坐标。
                </p>
              </section>
            </div>

            <div class="ns-fantasy-actions" aria-label="Fantasy card action samples">
              <button class="ns-fantasy-button ns-fantasy-button--primary" type="button">
                档案
              </button>
              <button class="ns-fantasy-button" type="button">装备</button>
              <button class="ns-fantasy-button" type="button">故事</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type FontMode = 'decorative' | 'all-pixel'
type PixelTone = 'classic' | 'light'
type StylePreview = 'pixel-soft' | 'fantasy-card'

const fontMode = ref<FontMode>('decorative')
const pixelTone = ref<PixelTone>('classic')
const stylePreview = ref<StylePreview>('pixel-soft')

const fontModeOptions: Array<{ label: string; value: FontMode }> = [
  { label: '装饰像素', value: 'decorative' },
  { label: '全部像素', value: 'all-pixel' }
]

const pixelToneOptions: Array<{ label: string; value: PixelTone }> = [
  { label: '当前像素', value: 'classic' },
  { label: '轻像素', value: 'light' }
]

const stylePreviewOptions: Array<{ label: string; value: StylePreview }> = [
  { label: 'Pixel Soft', value: 'pixel-soft' },
  { label: 'Fantasy Card', value: 'fantasy-card' }
]
</script>

<style scoped>
.style-lab-page {
  min-height: 100vh;
}

.style-lab-picker {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.style-lab-picker__button {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--style-lab-picker-accent, #2a2138);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--style-lab-picker-accent, #2a2138);
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.style-lab-picker__button--active {
  background: var(--style-lab-picker-accent, #2a2138);
  color: var(--style-lab-picker-active, #ffffff);
}
</style>
