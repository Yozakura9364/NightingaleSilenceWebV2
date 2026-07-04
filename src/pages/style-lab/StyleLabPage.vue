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
              <AppButton variant="secondary">{{ t(textKeys.export) }}</AppButton>
              <AppButton>{{ t(textKeys.saveDraft) }}</AppButton>

              <template #end>
                <AppStatus compact tone="success" :message="t(textKeys.styleLabReady)" />
              </template>
            </AppToolbar>

            <div
              class="style-formal-sample__button-row"
              :aria-label="t(textKeys.styleLabFormalControls)"
            >
              <AppButton variant="ghost" size="compact">{{ t(textKeys.details) }}</AppButton>
              <AppButton variant="danger" size="compact">{{ t(textKeys.placeholder) }}</AppButton>
              <AppButton size="compact" disabled>{{ t(textKeys.placeholder) }}</AppButton>
              <AppButton size="icon" :aria-label="t(textKeys.details)">?</AppButton>
            </div>

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
              <AppStatus
                tone="loading"
                :title="t(textKeys.checking)"
                :message="t(textKeys.placeholder)"
              />
              <AppStatus
                tone="danger"
                :title="t(textKeys.status)"
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
            class="ns-pixel-window ns-pixel-icon-lab"
            :aria-label="t(textKeys.styleLabIconLab)"
          >
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.styleLabIconLab) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <nav class="ns-pixel-icon-text-bar" :aria-label="t(textKeys.styleLabIconTextBar)">
              <a class="ns-pixel-icon-text-bar__brand" href="#/">
                <span
                  class="ns-pixel-icon"
                  :style="pixelIconStyle(pixelHomeIcon)"
                  aria-hidden="true"
                ></span>
                <span class="ns-pixel-icon-text-bar__label">{{ t(textKeys.siteEnName) }}</span>
                <span class="ns-pixel-icon-text-bar__command">{{ t(textKeys.homeCommand) }}</span>
              </a>

              <div class="ns-pixel-icon-text-bar__actions">
                <button
                  v-for="action in pixelIconBarActions"
                  :key="action.id"
                  class="ns-pixel-icon-text-bar__button"
                  :class="{
                    'ns-pixel-icon-text-bar__button--active': action.active,
                    'ns-pixel-icon-text-bar__button--pink': action.variant === 'pink',
                    'ns-pixel-icon-text-bar__button--blue': action.variant === 'blue'
                  }"
                  type="button"
                >
                  <span
                    class="ns-pixel-icon"
                    :style="pixelIconStyle(action.icon)"
                    aria-hidden="true"
                  ></span>
                  <span class="ns-pixel-icon-text-bar__label">{{ t(action.labelKey) }}</span>
                  <span v-if="action.commandKey" class="ns-pixel-icon-text-bar__command">
                    {{ t(action.commandKey) }}
                  </span>
                </button>
              </div>
            </nav>

            <div class="ns-pixel-icon-lab__grid">
              <section class="ns-pixel-icon-lab__panel">
                <h2 class="ns-pixel-workbench__panel-title">
                  {{ t(textKeys.styleLabIconOnlyButtons) }}
                </h2>
                <div
                  class="ns-pixel-icon-lab__button-row"
                  :aria-label="t(textKeys.styleLabIconOnlyButtons)"
                >
                  <button
                    v-for="action in pixelIconButtons"
                    :key="action.id"
                    class="ns-pixel-icon-button"
                    :class="`ns-pixel-icon-button--${action.variant ?? 'plain'}`"
                    type="button"
                    :aria-label="t(action.labelKey)"
                    :title="t(action.labelKey)"
                  >
                    <span
                      class="ns-pixel-icon"
                      :style="pixelIconStyle(action.icon)"
                      aria-hidden="true"
                    ></span>
                  </button>
                </div>
              </section>

              <section class="ns-pixel-icon-lab__panel">
                <h2 class="ns-pixel-workbench__panel-title">
                  {{ t(textKeys.styleLabTextIconButtons) }}
                </h2>
                <div
                  class="ns-pixel-icon-lab__text-button-row"
                  :aria-label="t(textKeys.styleLabTextIconButtons)"
                >
                  <button
                    v-for="action in pixelTextIconButtons"
                    :key="action.id"
                    class="ns-pixel-button"
                    :class="{
                      'ns-pixel-button--primary': action.variant === 'pink',
                      'ns-pixel-button--blue': action.variant === 'blue'
                    }"
                    type="button"
                  >
                    <span
                      class="ns-pixel-icon"
                      :style="pixelIconStyle(action.icon)"
                      aria-hidden="true"
                    ></span>
                    <span>{{ t(action.labelKey) }}</span>
                  </button>
                </div>
              </section>

              <nav
                class="ns-pixel-icon-lab__panel ns-pixel-icon-menu"
                :aria-label="t(textKeys.styleLabIconMenuSample)"
              >
                <h2 class="ns-pixel-workbench__panel-title">
                  {{ t(textKeys.styleLabIconMenuSample) }}
                </h2>
                <a
                  v-for="item in pixelIconMenuItems"
                  :key="item.id"
                  class="ns-pixel-icon-menu__item"
                  :class="{ 'ns-pixel-icon-menu__item--active': item.active }"
                  :href="item.href"
                >
                  <span class="ns-pixel-icon-menu__main">
                    <span
                      class="ns-pixel-icon"
                      :style="pixelIconStyle(item.icon)"
                      aria-hidden="true"
                    ></span>
                    <span>{{ t(item.labelKey) }}</span>
                  </span>
                  <span>{{ t(item.commandKey) }}</span>
                </a>
              </nav>
            </div>

            <div class="ns-pixel-icon-lab__source">
              <span class="ns-pixel-badge ns-pixel-badge--green">
                {{ t(textKeys.styleLabIconSource) }}
              </span>
            </div>
          </section>

          <section
            class="ns-pixel-window ns-pixel-notebook-lab"
            :aria-label="t(textKeys.styleLabNotebookLab)"
          >
            <div class="ns-pixel-window__bar">
              <span class="ns-pixel-window__title">
                <span class="ns-pixel-window__icon" aria-hidden="true"></span>
                {{ t(textKeys.styleLabNotebookLab) }}
              </span>
              <span class="ns-pixel-window__controls" aria-hidden="true">
                <span class="ns-pixel-window__control ns-pixel-window__control--min"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--max"></span>
                <span class="ns-pixel-window__control ns-pixel-window__control--close"></span>
              </span>
            </div>

            <AppNotebookList
              :items="metaNotebookItems"
              :aria-label="t(textKeys.styleLabNotebookCard)"
            />
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
import { computed, ref, watch, type CSSProperties } from 'vue'
import pixelDownloadIcon from '@/assets/icons/pixelarticons/download.svg'
import pixelFolderIcon from '@/assets/icons/pixelarticons/folder.svg'
import pixelHomeIcon from '@/assets/icons/pixelarticons/home.svg'
import pixelImageIcon from '@/assets/icons/pixelarticons/image.svg'
import pixelLanguagesIcon from '@/assets/icons/pixelarticons/languages.svg'
import pixelMenuIcon from '@/assets/icons/pixelarticons/menu.svg'
import pixelSearchIcon from '@/assets/icons/pixelarticons/search.svg'
import pixelSettingsIcon from '@/assets/icons/pixelarticons/settings-2.svg'
import pixelStarIcon from '@/assets/icons/pixelarticons/star.svg'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppNotebookList from '@/components/AppNotebookList.vue'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import AppStatus from '@/components/AppStatus.vue'
import AppTabs from '@/components/AppTabs.vue'
import AppToolbar from '@/components/AppToolbar.vue'
import { ffxivTools, siteLocaleOptions, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'
import { useTheme, type ThemeMode } from '@/stores/theme'

type FontMode = 'decorative' | 'all-pixel'
type PixelTone = 'classic' | 'light' | 'cyber-night'
type PixelIconVariant = 'plain' | 'pink' | 'blue'
type StyleLabModuleOption = { id: string; label?: string; labelKey?: string }
type PixelIconAction = {
  id: string
  icon: string
  labelKey: string
  variant?: PixelIconVariant
}
type PixelIconMenuItem = PixelIconAction & {
  href: string
  commandKey: string
  active?: boolean
}
type PixelIconBarAction = PixelIconAction & {
  commandKey?: string
  active?: boolean
}

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
const pixelIconButtons: PixelIconAction[] = [
  { id: 'home', icon: pixelHomeIcon, labelKey: textKeys.styleLabIconHome, variant: 'pink' },
  { id: 'menu', icon: pixelMenuIcon, labelKey: textKeys.styleLabIconMenu },
  { id: 'config', icon: pixelSettingsIcon, labelKey: textKeys.styleLabIconConfig },
  { id: 'search', icon: pixelSearchIcon, labelKey: textKeys.styleLabIconSearch, variant: 'blue' },
  { id: 'language', icon: pixelLanguagesIcon, labelKey: textKeys.styleLabIconLanguage },
  { id: 'favorite', icon: pixelStarIcon, labelKey: textKeys.styleLabIconFavorite, variant: 'pink' }
]
const pixelTextIconButtons: PixelIconAction[] = [
  {
    id: 'download',
    icon: pixelDownloadIcon,
    labelKey: textKeys.styleLabIconDownload,
    variant: 'pink'
  },
  { id: 'image', icon: pixelImageIcon, labelKey: textKeys.styleLabIconImage, variant: 'blue' },
  { id: 'folder', icon: pixelFolderIcon, labelKey: textKeys.styleLabIconFolder },
  { id: 'search', icon: pixelSearchIcon, labelKey: textKeys.styleLabIconSearch }
]
const pixelIconBarActions: PixelIconBarAction[] = [
  {
    id: 'menu',
    icon: pixelMenuIcon,
    labelKey: textKeys.menu,
    commandKey: textKeys.menuCommand,
    active: true
  },
  {
    id: 'config',
    icon: pixelSettingsIcon,
    labelKey: textKeys.config,
    commandKey: textKeys.configCommand,
    variant: 'pink'
  },
  {
    id: 'language',
    icon: pixelLanguagesIcon,
    labelKey: textKeys.languageMode,
    commandKey: textKeys.localeZhCommand
  },
  {
    id: 'search',
    icon: pixelSearchIcon,
    labelKey: textKeys.styleLabIconSearch,
    variant: 'blue'
  }
]
const pixelIconMenuItems: PixelIconMenuItem[] = [
  {
    id: 'home',
    icon: pixelHomeIcon,
    labelKey: textKeys.home,
    commandKey: textKeys.homeCommand,
    href: '#/'
  },
  {
    id: 'ffxiv',
    icon: pixelFolderIcon,
    labelKey: textKeys.ffxivWorkshop,
    commandKey: textKeys.statusOpen,
    href: '#/ffxiv',
    active: true
  },
  {
    id: 'config',
    icon: pixelSettingsIcon,
    labelKey: textKeys.config,
    commandKey: textKeys.configCommand,
    href: '#/style-lab'
  },
  {
    id: 'about',
    icon: pixelStarIcon,
    labelKey: textKeys.about,
    commandKey: textKeys.aboutCommand,
    href: '#/about'
  }
]
const metaNotebookRows: Array<{
  id: string
  labelKey: string
  valueKey: string
  active: boolean
}> = [
  {
    id: 'portrait-bg',
    labelKey: textKeys.nsplateCategoryPortraitBackground,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'portrait-frame',
    labelKey: textKeys.nsplateCategoryPortraitDecorFrame,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'portrait-deco',
    labelKey: textKeys.nsplateCategoryPortraitDecoration,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-backing',
    labelKey: textKeys.nsplateCategoryNameplateBase,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-color',
    labelKey: textKeys.nsplateCategoryNameplateColor,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-pattern',
    labelKey: textKeys.nsplateCategoryNameplatePattern,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-frame',
    labelKey: textKeys.nsplateCategoryNameplateFrame,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-top',
    labelKey: textKeys.nsplateCategoryNameplateTopDecor,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-bottom',
    labelKey: textKeys.nsplateCategoryNameplateBottomDecor,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-decoration',
    labelKey: textKeys.nsplateCategoryNameplateDecoration,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'nameplate-decoration-alt',
    labelKey: textKeys.nsplateCategoryNameplateDecorationAlt,
    valueKey: textKeys.notSelected,
    active: false
  },
  {
    id: 'portrait-outer-frame',
    labelKey: textKeys.nsplateCategoryPortraitFrame,
    valueKey: textKeys.notSelected,
    active: false
  }
]
const metaNotebookItems = computed(() =>
  metaNotebookRows.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
    value: t(item.valueKey),
    active: item.active
  }))
)
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

function pixelIconStyle(icon: string): CSSProperties {
  return {
    '--ns-pixel-icon-url': `url("${icon}")`
  } as CSSProperties
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

.style-formal-sample__button-row {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 10px;
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

.ns-pixel-icon-lab {
  margin-bottom: 30px;
}

.ns-pixel-icon-lab__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.15fr) minmax(260px, 0.9fr);
  gap: 14px;
  min-width: 0;
}

.ns-pixel-icon-lab__panel {
  display: grid;
  align-content: start;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
}

.ns-pixel-icon-text-bar {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px;
  border: 2px solid var(--ns-pixel-border);
  background:
    linear-gradient(90deg, rgba(255, 124, 194, 0.14), rgba(94, 220, 235, 0.14)),
    var(--ns-pixel-surface);
  box-shadow: 3px 3px 0 var(--ns-pixel-shadow);
}

.ns-pixel-icon-text-bar__brand,
.ns-pixel-icon-text-bar__button {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 2px 2px 0 rgba(42, 33, 56, 0.14);
}

.ns-pixel-icon-text-bar__brand {
  flex: 1 1 260px;
  max-width: 420px;
}

.ns-pixel-icon-text-bar__actions {
  display: flex;
  flex: 0 1 auto;
  min-width: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.ns-pixel-icon-text-bar__button {
  flex: 0 0 auto;
  min-width: 112px;
  cursor: pointer;
}

.ns-pixel-icon-text-bar__button--active,
.ns-pixel-icon-text-bar__button--blue {
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-icon-text-bar__button--pink {
  background: var(--ns-pixel-surface-pink);
}

.ns-pixel-icon-text-bar__label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ns-pixel-icon-text-bar__command {
  flex: 0 0 auto;
  margin-left: auto;
  color: var(--ns-pixel-muted);
  font-size: 10px;
}

.ns-pixel-icon-lab__button-row,
.ns-pixel-icon-lab__text-button-row {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 10px;
}

.ns-pixel-icon-button {
  display: inline-grid;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ns-pixel-shadow);
  transition:
    transform var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast),
    background var(--ns-transition-fast);
}

.ns-pixel-icon-button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ns-pixel-shadow);
}

.ns-pixel-icon-button:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ns-pixel-shadow);
}

.ns-pixel-icon-button--pink {
  background: var(--ns-pixel-surface-pink);
}

.ns-pixel-icon-button--blue {
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-icon {
  display: inline-block;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  background: currentColor;
  image-rendering: pixelated;
  mask: var(--ns-pixel-icon-url) center / 100% 100% no-repeat;
  -webkit-mask: var(--ns-pixel-icon-url) center / 100% 100% no-repeat;
}

.ns-pixel-icon-menu {
  gap: 8px;
}

.ns-pixel-icon-menu__item {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 38px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-pixel-ink);
  font-family: var(--ns-pixel-font);
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 2px 2px 0 rgba(42, 33, 56, 0.14);
}

.ns-pixel-icon-menu__item--active {
  background: var(--ns-pixel-surface-blue);
}

.ns-pixel-icon-menu__main {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.ns-pixel-icon-menu__main span:last-child,
.ns-pixel-icon-menu__item > span:last-child {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ns-pixel-icon-lab__source {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
}

.ns-pixel-notebook-lab {
  overflow: hidden;
  width: max-content;
  min-width: 246px;
  max-width: min(100%, 326px);
  margin-inline: auto;
  margin-bottom: 22px;
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

  .ns-pixel-icon-lab__grid {
    grid-template-columns: 1fr;
  }

  .ns-pixel-icon-text-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .ns-pixel-icon-text-bar__brand {
    flex-basis: auto;
    max-width: none;
    width: 100%;
  }

  .ns-pixel-icon-text-bar__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .ns-pixel-icon-text-bar__button {
    width: 100%;
    min-width: 0;
  }

  .ns-pixel-icon-lab__text-button-row .ns-pixel-button {
    width: 100%;
  }
}
</style>
