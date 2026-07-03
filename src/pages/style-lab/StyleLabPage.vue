<template>
  <main class="style-lab-page">
    <section class="style-formal-sample" :aria-label="t(textKeys.styleLabFormalComponents)">
      <div class="style-formal-sample__shell">
        <AppPixelWindow :title="t(textKeys.styleLabFormalComponents)" :closable="false">
          <div class="style-formal-sample__content">
            <AppToolbar
              :title="t(textKeys.styleLabFormalControls)"
              :aria-label="t(textKeys.styleLabFormalControls)"
            >
              <AppButton variant="primary">{{ t(textKeys.import) }}</AppButton>
              <AppButton>{{ t(textKeys.saveDraft) }}</AppButton>
              <AppButton>{{ t(textKeys.export) }}</AppButton>

              <template #end>
                <AppStatus compact tone="success" :message="t(textKeys.styleLabReady)" />
              </template>
            </AppToolbar>

            <AppTabs
              v-model="formalTab"
              :items="formalTabs"
              :aria-label="t(textKeys.styleLabCommonTabsPreview)"
              stretch
            />

            <div class="style-formal-sample__grid">
              <AppField
                :label="t(textKeys.styleLabTitleField)"
                for-id="style-lab-formal-title"
                :description="t(textKeys.placeholder)"
              >
                <input id="style-lab-formal-title" type="text" :value="t(textKeys.placeholder)" />
              </AppField>

              <AppField :label="t(textKeys.styleLabLanguage)" for-id="style-lab-formal-locale">
                <select id="style-lab-formal-locale">
                  <option v-for="option in siteLocaleOptions" :key="option.locale">
                    {{ t(option.labelKey) }}
                  </option>
                </select>
              </AppField>
            </div>

            <div class="style-formal-sample__states" :aria-label="t(textKeys.styleLabFormalStates)">
              <AppStatus
                tone="info"
                :title="t(textKeys.styleLabAppStatus)"
                :message="t(textKeys.placeholder)"
              />
              <AppStatus
                tone="warning"
                :title="t(textKeys.styleLabFormalStates)"
                :message="t(textKeys.placeholder)"
              />
            </div>
          </div>
        </AppPixelWindow>
      </div>
    </section>

    <section
      class="style-lab-experiment"
      data-style-preview="pixel-soft"
      :data-font-mode="fontMode"
      :data-pixel-tone="effectivePixelTone"
    >
      <div class="ns-pixel-stage">
        <div class="ns-pixel-shell">
          <div class="ns-pixel-switch-row">
            <div class="ns-pixel-mode-switch" :aria-label="t(textKeys.styleLabPixelTone)">
              <button
                v-for="option in pixelToneOptions"
                :key="option.value"
                class="ns-pixel-mode-button"
                :class="{ 'ns-pixel-mode-button--active': effectivePixelTone === option.value }"
                type="button"
                @click="setPixelTone(option.value)"
              >
                {{ t(option.labelKey) }}
              </button>
            </div>

            <div class="ns-pixel-mode-switch" :aria-label="t(textKeys.styleLabFontMode)">
              <button
                v-for="option in fontModeOptions"
                :key="option.value"
                class="ns-pixel-mode-button"
                :class="{ 'ns-pixel-mode-button--active': fontMode === option.value }"
                type="button"
                @click="fontMode = option.value"
              >
                {{ t(option.labelKey) }}
              </button>
            </div>
          </div>

          <section class="ns-pixel-hero">
            <div class="ns-pixel-panel">
              <h1 class="ns-pixel-title">{{ t(textKeys.styleLabTitle) }}</h1>
              <p class="ns-pixel-lead">
                {{ t(textKeys.styleLabSampleLead) }}
              </p>

              <div class="ns-pixel-actions">
                <button class="ns-pixel-button ns-pixel-button--primary" type="button">
                  {{ t(textKeys.styleLabPrimary) }}
                </button>
                <button class="ns-pixel-button ns-pixel-button--blue" type="button">
                  {{ t(textKeys.styleLabAction) }}
                </button>
                <button class="ns-pixel-button" type="button">
                  {{ t(textKeys.styleLabDefault) }}
                </button>
              </div>
            </div>

            <aside class="ns-pixel-window" :aria-label="t(textKeys.styleLabWindowSample)">
              <div class="ns-pixel-window__bar">
                <span class="ns-pixel-window__title">
                  <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                  {{ t(textKeys.styleLabWindowSample) }}
                </span>
                <span class="ns-pixel-window__controls" aria-hidden="true">
                  <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                  <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                  <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
                </span>
              </div>

              <div class="ns-pixel-cluster">
                <span class="ns-pixel-badge ns-pixel-badge--pink">{{
                  t(textKeys.placeholder)
                }}</span>
                <span class="ns-pixel-badge">{{ t(textKeys.placeholder) }}</span>
                <span class="ns-pixel-badge ns-pixel-badge--green">{{
                  t(textKeys.styleLabReady)
                }}</span>
              </div>

              <div class="ns-pixel-swatch-row" :aria-label="t(textKeys.styleLabPalette)">
                <span class="ns-pixel-swatch ns-pixel-swatch--pink"></span>
                <span class="ns-pixel-swatch ns-pixel-swatch--blue"></span>
                <span class="ns-pixel-swatch ns-pixel-swatch--yellow"></span>
                <span class="ns-pixel-swatch ns-pixel-swatch--green"></span>
              </div>

              <div class="ns-pixel-meter" :aria-label="t(textKeys.styleLabProgress)">
                <div class="ns-pixel-meter__bar"></div>
              </div>
            </aside>
          </section>

          <section class="ns-pixel-menu-lab" :aria-label="t(textKeys.styleLabPopupMenuSample)">
            <div class="ns-pixel-menu-stage">
              <div class="ns-pixel-menu-stage__topbar">
                <span>{{ t(textKeys.siteEnName) }}</span>
                <button class="ns-pixel-menu-trigger" type="button">
                  {{ t(textKeys.menuTitle) }}
                </button>
              </div>

              <aside
                class="ns-pixel-window ns-pixel-menu-popup"
                :aria-label="t(textKeys.styleLabPopupWindowSample)"
              >
                <div class="ns-pixel-window__bar">
                  <span class="ns-pixel-window__title">
                    <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                    {{ t(textKeys.menuTitle) }}
                  </span>
                  <span class="ns-pixel-window__controls" aria-hidden="true">
                    <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                    <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                    <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
                  </span>
                </div>

                <nav
                  class="ns-pixel-popup-menu"
                  :aria-label="t(textKeys.styleLabPopupNavigationSample)"
                >
                  <a
                    class="ns-pixel-popup-menu__item ns-pixel-popup-menu__item--active"
                    href="#/ffxiv"
                  >
                    <span>{{ t(textKeys.ffxivWorkshop) }}</span>
                    <span>{{ t(textKeys.statusOpen) }}</span>
                  </a>

                  <div
                    class="ns-pixel-popup-menu__children"
                    :aria-label="t(textKeys.styleLabFfxivChildren)"
                  >
                    <a href="#/ffxiv/glamour">{{ t(textKeys.glamourTitle) }}</a>
                    <a href="#/ffxiv/plate">{{ t(textKeys.plateTitle) }}</a>
                  </div>

                  <a class="ns-pixel-popup-menu__item" href="#/about">
                    <span>{{ t(textKeys.about) }}</span>
                    <span>{{ t(textKeys.aboutCommand) }}</span>
                  </a>

                  <a class="ns-pixel-popup-menu__item" href="#/style-lab">
                    <span>{{ t(textKeys.oc) }}</span>
                    <span>{{ t(textKeys.statusWip) }}</span>
                  </a>

                  <div
                    class="ns-pixel-popup-menu__children"
                    :aria-label="t(textKeys.styleLabOcChildren)"
                  >
                    <a href="#/style-lab">{{ t(textKeys.silence) }}</a>
                  </div>
                </nav>

                <div class="ns-pixel-menu-popup__status">
                  <span>{{ t(textKeys.status) }}</span>
                  <strong>{{ t(textKeys.placeholder) }}</strong>
                </div>
              </aside>
            </div>
          </section>

          <section
            class="ns-pixel-window ns-pixel-workbench"
            :aria-label="t(textKeys.styleLabWorkbenchSample)"
          >
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.styleLabWorkbenchSample) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <div
              class="ns-pixel-workbench__toolbar"
              :aria-label="t(textKeys.styleLabWorkbenchToolbar)"
            >
              <button class="ns-pixel-button ns-pixel-button--primary" type="button">
                {{ t(textKeys.import) }}
              </button>
              <button class="ns-pixel-button" type="button">{{ t(textKeys.saveDraft) }}</button>
              <button class="ns-pixel-button ns-pixel-button--blue" type="button">
                {{ t(textKeys.export) }}
              </button>
              <span class="ns-pixel-workbench__hint">
                {{ t(textKeys.styleLabSkinName) }} / {{ t(textKeys.placeholder) }}
              </span>
            </div>

            <div class="ns-pixel-workbench__grid">
              <aside
                class="ns-pixel-workbench__side"
                :aria-label="t(textKeys.styleLabWorkbenchSidebar)"
              >
                <div class="ns-pixel-workbench__panel-title">{{ t(textKeys.styleLabTools) }}</div>
                <button class="ns-pixel-tool-row ns-pixel-tool-row--active" type="button">
                  <span>{{ t(textKeys.styleLabEquipmentPanel) }}</span>
                  <small>12</small>
                </button>
                <button class="ns-pixel-tool-row" type="button">
                  <span>{{ t(textKeys.styleLabTemplate) }}</span>
                  <small>06</small>
                </button>
                <button class="ns-pixel-tool-row" type="button">
                  <span>{{ t(textKeys.styleLabAssets) }}</span>
                  <small>03</small>
                </button>

                <div class="ns-pixel-workbench__panel-title">{{ t(textKeys.styleLabLayers) }}</div>
                <div class="ns-pixel-layer-stack">
                  <span>{{ t(textKeys.styleLabTitleField) }}</span>
                  <span>{{ t(textKeys.styleLabCharacter) }}</span>
                  <span>{{ t(textKeys.styleLabEquipment) }}</span>
                  <span>{{ t(textKeys.styleLabBackground) }}</span>
                </div>
              </aside>

              <section
                class="ns-pixel-workbench__canvas"
                :aria-label="t(textKeys.styleLabWorkbenchCanvas)"
              >
                <div class="ns-pixel-canvas-card">
                  <div class="ns-pixel-canvas-card__chrome">
                    <span>{{ t(textKeys.styleLabWorkbenchCanvas) }}</span>
                    <span>{{ styleLabCanvasSize }}</span>
                  </div>
                  <div class="ns-pixel-canvas-card__body">
                    <div class="ns-pixel-canvas-card__avatar" aria-hidden="true"></div>
                    <div class="ns-pixel-canvas-card__lines">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p>{{ t(textKeys.placeholder) }}</p>
                  </div>
                </div>
              </section>

              <aside
                class="ns-pixel-workbench__inspector"
                :aria-label="t(textKeys.styleLabWorkbenchInspector)"
              >
                <div class="ns-pixel-workbench__panel-title">
                  {{ t(textKeys.styleLabInspector) }}
                </div>
                <label class="ns-pixel-label">
                  {{ t(textKeys.styleLabTitleField) }}
                  <input class="ns-pixel-input" type="text" :value="t(textKeys.placeholder)" />
                </label>
                <label class="ns-pixel-label">
                  {{ t(textKeys.styleLabLanguage) }}
                  <select class="ns-pixel-select">
                    <option v-for="option in siteLocaleOptions" :key="option.locale">
                      {{ t(option.labelKey) }}
                    </option>
                  </select>
                </label>
                <div class="ns-pixel-mini-meters" :aria-label="t(textKeys.styleLabWorkbenchMeters)">
                  <span style="--meter-width: 72%"></span>
                  <span style="--meter-width: 48%"></span>
                  <span style="--meter-width: 86%"></span>
                </div>
              </aside>
            </div>

            <div class="ns-pixel-workbench__status">
              <span>{{ t(textKeys.styleLabReady) }}</span>
              <span>12 {{ t(textKeys.itemsUnit) }}</span>
              <span>{{ t(textKeys.placeholder) }}</span>
            </div>
          </section>

          <section class="ns-pixel-window">
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.styleLabToolbarSample) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <div class="ns-pixel-toolbar" :aria-label="t(textKeys.styleLabToolbarSample)">
              <button class="ns-pixel-button ns-pixel-button--primary" type="button">
                {{ t(textKeys.save) }}
              </button>
              <button class="ns-pixel-button" type="button">{{ t(textKeys.import) }}</button>
              <button class="ns-pixel-button ns-pixel-button--blue" type="button">
                {{ t(textKeys.export) }}
              </button>
            </div>

            <hr class="ns-pixel-divider" />

            <div class="ns-pixel-form-grid">
              <label class="ns-pixel-label">
                {{ t(textKeys.styleLabName) }}
                <input class="ns-pixel-input" type="text" :value="t(textKeys.siteEnName)" />
              </label>

              <label class="ns-pixel-label">
                {{ t(textKeys.styleLabModule) }}
                <select class="ns-pixel-select">
                  <option v-for="option in styleLabModuleOptions" :key="option.id">
                    {{ moduleOptionLabel(option) }}
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section class="ns-pixel-window">
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.styleLabCommonToolbarPreview) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <div class="style-common-components">
              <AppToolbar
                :title="t(textKeys.styleLabAppToolbar)"
                :aria-label="t(textKeys.styleLabCommonToolbarPreview)"
              >
                <AppButton variant="primary">{{ t(textKeys.placeholder) }}</AppButton>
                <AppButton>{{ t(textKeys.placeholder) }}</AppButton>

                <template #end>
                  <AppStatus compact tone="success" :message="t(textKeys.placeholder)" />
                </template>
              </AppToolbar>

              <AppTabs
                v-model="commonTab"
                :items="commonTabs"
                :aria-label="t(textKeys.styleLabCommonTabsPreview)"
                stretch
              />

              <div class="style-common-components__grid">
                <AppField
                  :label="t(textKeys.placeholder)"
                  for-id="style-lab-common-title"
                  :description="t(textKeys.placeholder)"
                >
                  <input id="style-lab-common-title" type="text" :value="t(textKeys.placeholder)" />
                </AppField>

                <AppField :label="t(textKeys.placeholder)" for-id="style-lab-common-module">
                  <select id="style-lab-common-module">
                    <option v-for="option in styleLabToolOptions" :key="option.id">
                      {{ moduleOptionLabel(option) }}
                    </option>
                  </select>
                </AppField>
              </div>

              <AppStatus
                tone="info"
                :title="t(textKeys.styleLabAppStatus)"
                :message="t(textKeys.placeholder)"
              >
                <template #actions>
                  <AppButton>{{ t(textKeys.placeholder) }}</AppButton>
                </template>
              </AppStatus>
            </div>
          </section>

          <section class="ns-pixel-grid" :aria-label="t(textKeys.styleLabToolCardSamples)">
            <article class="ns-pixel-card">
              <span class="ns-pixel-badge ns-pixel-badge--pink">{{
                t(textKeys.styleLabToolBadge)
              }}</span>
              <h2 class="ns-pixel-card__title">{{ t(textKeys.glamourTitle) }}</h2>
              <p class="ns-pixel-card__text">
                {{ t(textKeys.placeholder) }}
              </p>
              <button class="ns-pixel-button ns-pixel-button--primary" type="button">
                {{ t(textKeys.open) }}
              </button>
            </article>

            <article class="ns-pixel-card ns-pixel-card--blue">
              <span class="ns-pixel-badge">{{ t(textKeys.styleLabToolBadge) }}</span>
              <h2 class="ns-pixel-card__title">{{ t(textKeys.plateTitle) }}</h2>
              <p class="ns-pixel-card__text">{{ t(textKeys.placeholder) }}</p>
              <button class="ns-pixel-button ns-pixel-button--blue" type="button">
                {{ t(textKeys.open) }}
              </button>
            </article>

            <article class="ns-pixel-card">
              <span class="ns-pixel-badge ns-pixel-badge--green">{{ t(textKeys.status) }}</span>
              <h2 class="ns-pixel-card__title">{{ t(textKeys.styleLabStatusPanel) }}</h2>
              <p class="ns-pixel-card__text">{{ t(textKeys.placeholder) }}</p>
              <button class="ns-pixel-button" type="button">{{ t(textKeys.details) }}</button>
            </article>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import '@/styles/experiments/pixel-soft.css'
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import AppStatus from '@/components/AppStatus.vue'
import AppTabs from '@/components/AppTabs.vue'
import AppToolbar from '@/components/AppToolbar.vue'
import { ffxivTools, siteLocaleOptions, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'
import { useTheme, type ThemeMode } from '@/stores/theme'

type FontMode = 'decorative' | 'all-pixel'
type PixelTone = 'classic' | 'light' | 'cyber-night'
type StyleLabModuleOption = { id: string; label?: string; labelKey?: string }

const { t } = useLocale()
const { current: themeMode, setThemeMode } = useTheme()
const fontMode = ref<FontMode>('decorative')
const pixelTone = ref<PixelTone>(defaultPixelTone(themeMode.value))
const styleLabCanvasSize = '1440 x 1920'
const styleLabToolOptions: StyleLabModuleOption[] = ffxivTools.map((tool) => ({
  id: tool.id,
  label: tool.projectName
}))
const styleLabModuleOptions: StyleLabModuleOption[] = [
  { id: 'ffxiv', labelKey: textKeys.ffxivWorkshopShort },
  ...styleLabToolOptions
]

const fontModeOptions: Array<{ labelKey: string; value: FontMode }> = [
  { labelKey: textKeys.styleLabDecorativePixels, value: 'decorative' },
  { labelKey: textKeys.styleLabAllPixels, value: 'all-pixel' }
]

const pixelToneOptions: Array<{ labelKey: string; value: PixelTone }> = [
  { labelKey: textKeys.styleLabCurrentPixel, value: 'classic' },
  { labelKey: textKeys.styleLabLightPixel, value: 'light' },
  { labelKey: textKeys.styleLabCyberNight, value: 'cyber-night' }
]
const commonTab = ref('field')
const formalTab = ref('field')

const commonTabs = computed(() =>
  [
    { labelKey: textKeys.styleLabAppField, value: 'field', meta: '01' },
    { labelKey: textKeys.styleLabAppToolbar, value: 'toolbar', meta: '02' },
    { labelKey: textKeys.styleLabAppStatus, value: 'status', meta: '03' }
  ].map((item) => ({ ...item, label: t(item.labelKey) }))
)

const formalTabs = commonTabs
const effectivePixelTone = computed<PixelTone>(() =>
  defaultPixelTone(themeMode.value, pixelTone.value)
)

watch(themeMode, (mode) => {
  pixelTone.value = defaultPixelTone(mode, pixelTone.value)
})

function defaultPixelTone(mode: ThemeMode, preferredTone: PixelTone = 'classic'): PixelTone {
  if (mode === 'night') {
    return 'cyber-night'
  }

  return preferredTone === 'cyber-night' ? 'classic' : preferredTone
}

function setPixelTone(tone: PixelTone) {
  pixelTone.value = tone
  setThemeMode(tone === 'cyber-night' ? 'night' : 'day')
}

function moduleOptionLabel(option: StyleLabModuleOption) {
  return option.labelKey ? t(option.labelKey) : (option.label ?? option.id)
}
</script>

<style scoped>
.style-lab-page {
  min-height: 100vh;
  background: var(--ns-body-background);
  color: var(--ns-color-text);
}

.style-formal-sample {
  padding: 36px 0 0;
}

.style-formal-sample__shell {
  width: min(var(--ns-content-width), calc(100vw - 32px));
  margin: 0 auto;
}

.style-formal-sample__content {
  display: grid;
  min-width: 0;
  gap: 16px;
}

.style-formal-sample__grid,
.style-formal-sample__states {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.style-lab-experiment[data-pixel-tone='cyber-night'] :deep(.ns-pixel-stage) {
  background: transparent;
}

.style-common-components {
  display: grid;
  min-width: 0;
  gap: 16px;
}

.style-common-components__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 620px) {
  .style-formal-sample {
    padding-top: 24px;
  }

  .style-formal-sample__shell {
    width: min(var(--ns-content-width), calc(100vw - 24px));
  }

  .style-formal-sample__grid,
  .style-formal-sample__states {
    grid-template-columns: 1fr;
  }

  .style-common-components__grid {
    grid-template-columns: 1fr;
  }
}
</style>
