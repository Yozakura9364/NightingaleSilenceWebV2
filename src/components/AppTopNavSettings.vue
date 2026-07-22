<template>
  <div class="app-top-nav__config">
    <button
      class="app-top-nav__config-button"
      type="button"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="emit('toggle')"
      @keydown.esc="emit('close')"
    >
      <span>{{ t(textKeys.config) }}</span>
      <span class="app-top-nav__config-command" aria-hidden="true">
        {{ t(textKeys.configCommand) }}
      </span>
    </button>

    <Transition name="panel">
      <AppPixelWindow
        v-if="open"
        class="app-top-nav__window app-top-nav__window--config"
        :title="t(textKeys.configTitle)"
        :close-label="t(textKeys.closeConfig)"
        role="dialog"
        :aria-label="t(textKeys.config)"
        @close="emit('close')"
        @keydown.esc="emit('close')"
      >
        <section class="app-top-nav__launcher-panel" :aria-label="t(textKeys.themeMode)">
          <div class="app-top-nav__theme-toggle" role="group" :aria-label="t(textKeys.themeMode)">
            <button
              class="app-top-nav__theme-option app-top-nav__theme-option--day"
              :class="{ 'app-top-nav__theme-option--active': themeMode === 'day' }"
              type="button"
              :aria-pressed="themeMode === 'day'"
              :aria-label="t(textKeys.day)"
              @click="setThemeMode('day')"
            >
              <span
                class="app-top-nav__theme-icon app-top-nav__theme-icon--day"
                :style="themeSunIconStyle"
                aria-hidden="true"
              ></span>
              <span class="app-top-nav__theme-caption" aria-hidden="true">
                {{ t(textKeys.dayCommand) }}
              </span>
            </button>
            <button
              class="app-top-nav__theme-option app-top-nav__theme-option--night"
              :class="{ 'app-top-nav__theme-option--active': themeMode === 'night' }"
              type="button"
              :aria-pressed="themeMode === 'night'"
              :aria-label="t(textKeys.night)"
              @click="setThemeMode('night')"
            >
              <span
                class="app-top-nav__theme-icon app-top-nav__theme-icon--night"
                :style="themeMoonIconStyle"
                aria-hidden="true"
              ></span>
              <span class="app-top-nav__theme-caption" aria-hidden="true">
                {{ t(textKeys.nightCommand) }}
              </span>
            </button>
          </div>

          <div class="app-top-nav__locale-toggle" role="group" :aria-label="t(textKeys.languageMode)">
            <button
              v-for="option in siteLocaleOptions"
              :key="option.locale"
              class="app-top-nav__locale-option"
              :class="{ 'app-top-nav__locale-option--active': locale === option.locale }"
              type="button"
              :aria-pressed="locale === option.locale"
              :aria-label="t(option.labelKey)"
              @click="setLocale(option.locale)"
            >
              <span>{{ t(option.labelKey) }}</span>
              <small>{{ t(option.commandKey) }}</small>
            </button>
          </div>
        </section>
      </AppPixelWindow>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import themeMoonIcon from '@/assets/icons/moon.svg'
import themeSunIcon from '@/assets/icons/sun-alt.svg'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { siteLocaleOptions } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  toggle: []
  close: []
}>()

const { current: locale, setLocale, t } = useLocale()
const { current: themeMode, setThemeMode } = useTheme()
const themeSunIconStyle = {
  '--app-theme-icon-url': `url("${themeSunIcon}")`
} as CSSProperties
const themeMoonIconStyle = {
  '--app-theme-icon-url': `url("${themeMoonIcon}")`
} as CSSProperties
</script>
