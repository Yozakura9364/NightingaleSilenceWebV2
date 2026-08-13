<template>
  <main class="app-settings-page" :aria-label="t(textKeys.config)">
    <div class="app-settings-page__content">
      <h1 class="ns-sr-only">{{ t(textKeys.config) }}</h1>

      <section class="app-settings-page__section" :aria-labelledby="themeHeadingId">
        <h2 :id="themeHeadingId">{{ t(textKeys.themeMode) }}</h2>
        <div
          class="app-settings-page__theme-options"
          role="group"
          :aria-label="t(textKeys.themeMode)"
        >
          <button
            v-for="option in themeOptions"
            :key="option.value"
            class="app-settings-page__theme-option"
            :class="{ 'app-settings-page__theme-option--active': themeMode === option.value }"
            type="button"
            :aria-pressed="themeMode === option.value"
            @click="setThemeMode(option.value)"
          >
            <span
              class="app-settings-page__theme-icon"
              :style="option.iconStyle"
              aria-hidden="true"
            ></span>
            <span>{{ t(option.labelKey) }}</span>
            <small>{{ t(option.commandKey) }}</small>
          </button>
        </div>
      </section>

      <section class="app-settings-page__section" :aria-labelledby="localeHeadingId">
        <h2 :id="localeHeadingId">{{ t(textKeys.languageMode) }}</h2>
        <div
          class="app-settings-page__locale-options"
          role="group"
          :aria-label="t(textKeys.languageMode)"
        >
          <button
            v-for="option in siteLocaleOptions"
            :key="option.locale"
            class="app-settings-page__locale-option"
            :class="{ 'app-settings-page__locale-option--active': locale === option.locale }"
            type="button"
            :aria-pressed="locale === option.locale"
            @click="setLocale(option.locale)"
          >
            <span>{{ t(option.labelKey) }}</span>
            <small>{{ t(option.commandKey) }}</small>
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import moonIcon from '@/assets/icons/moon.svg'
import sunIcon from '@/assets/icons/sun-alt.svg'
import { siteLocaleOptions } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'
import { useTheme, type ThemeMode } from '@/stores/theme'

const themeHeadingId = 'app-settings-theme'
const localeHeadingId = 'app-settings-locale'
const { current: locale, setLocale, t } = useLocale()
const { current: themeMode, setThemeMode } = useTheme()

interface ThemeOption {
  value: ThemeMode
  labelKey: string
  commandKey: string
  iconStyle: CSSProperties
}

const themeOptions: ThemeOption[] = [
  {
    value: 'day',
    labelKey: textKeys.day,
    commandKey: textKeys.dayCommand,
    iconStyle: { '--app-settings-theme-icon-url': `url("${sunIcon}")` }
  },
  {
    value: 'night',
    labelKey: textKeys.night,
    commandKey: textKeys.nightCommand,
    iconStyle: { '--app-settings-theme-icon-url': `url("${moonIcon}")` }
  }
]
</script>

<style scoped>
.app-settings-page {
  min-height: calc(100vh - var(--ns-app-chrome-height, 0px));
  padding: 40px 28px 64px;
}

.app-settings-page__content {
  width: min(100%, 720px);
  margin: 0 auto;
}

.app-settings-page__section {
  padding: 0 0 28px;
  border-bottom: 1px solid var(--ns-pixel-divider);
}

.app-settings-page__section + .app-settings-page__section {
  padding-top: 28px;
}

.app-settings-page__section h2 {
  margin: 0 0 16px;
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 14px;
  font-weight: 950;
  line-height: 1;
}

.app-settings-page__theme-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.app-settings-page__locale-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.app-settings-page__theme-option,
.app-settings-page__locale-option {
  display: grid;
  justify-items: center;
  border: 1px solid var(--ns-pixel-border);
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-weight: 950;
  cursor: pointer;
}

.app-settings-page__theme-option {
  min-height: 104px;
  align-content: center;
  gap: 8px;
  padding: 12px;
  font-size: 13px;
}

.app-settings-page__locale-option {
  min-height: 52px;
  align-content: center;
  gap: 3px;
  padding: 6px 4px;
  font-size: 14px;
}

.app-settings-page__theme-option:hover,
.app-settings-page__theme-option--active,
.app-settings-page__locale-option:hover,
.app-settings-page__locale-option--active {
  color: var(--ns-color-accent-strong);
}

.app-settings-page__theme-option:active,
.app-settings-page__locale-option:active {
  transform: translateY(1px);
}

.app-settings-page__theme-option:focus-visible,
.app-settings-page__locale-option:focus-visible {
  outline: 2px solid var(--ns-color-accent-strong);
  outline-offset: 2px;
}

.app-settings-page__theme-icon {
  display: block;
  width: 36px;
  height: 36px;
  background: currentColor;
  mask: var(--app-settings-theme-icon-url) center / contain no-repeat;
  -webkit-mask: var(--app-settings-theme-icon-url) center / contain no-repeat;
}

.app-settings-page small {
  color: var(--ns-color-text-muted);
  font-size: 9px;
  line-height: 1;
}

.app-settings-page__theme-option--active small,
.app-settings-page__locale-option--active small {
  color: currentColor;
}

@media (max-width: 620px) {
  .app-settings-page {
    padding: 28px 14px 48px;
  }

  .app-settings-page__locale-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
