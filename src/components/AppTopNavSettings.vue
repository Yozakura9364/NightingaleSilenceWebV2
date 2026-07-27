<template>
  <div class="app-top-nav__config" @pointerenter="scheduleOpen" @pointerleave="scheduleClose">
    <button
      class="app-top-nav__config-button"
      type="button"
      :aria-label="t(textKeys.config)"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="togglePanel"
      @keydown.esc="closePanel"
    >
      <span
        class="app-top-nav__mobile-mask-icon"
        :style="settingsIconStyle"
        aria-hidden="true"
      ></span>
      <span class="app-top-nav__config-label">{{ t(textKeys.config) }}</span>
    </button>

    <Transition name="panel">
      <AppPixelWindow
        v-if="open"
        class="app-top-nav__window app-top-nav__window--config"
        :title="t(textKeys.configTitle)"
        :close-label="t(textKeys.closeConfig)"
        role="dialog"
        :aria-label="t(textKeys.config)"
        @pointerenter="cancelClose"
        @close="closePanel"
        @keydown.esc="closePanel"
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

          <div
            class="app-top-nav__locale-toggle"
            role="group"
            :aria-label="t(textKeys.languageMode)"
          >
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
import { onBeforeUnmount, type CSSProperties } from 'vue'
import settingsIcon from '@/assets/icons/pixelarticons/settings-2.svg'
import themeMoonIcon from '@/assets/icons/moon.svg'
import themeSunIcon from '@/assets/icons/sun-alt.svg'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { siteLocaleOptions } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  open: []
  toggle: []
  close: []
  'hover-close': []
}>()

const HOVER_DELAY = 120
const CLOSE_DELAY = 500
let hoverTimer: ReturnType<typeof setTimeout> | null = null

function clearHoverTimer() {
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
}

function scheduleOpen(event: PointerEvent) {
  clearHoverTimer()
  if (event.pointerType !== 'mouse' || props.open) {
    return
  }

  hoverTimer = setTimeout(() => {
    hoverTimer = null
    emit('open')
  }, HOVER_DELAY)
}

function scheduleClose(event: PointerEvent) {
  clearHoverTimer()
  if (event.pointerType !== 'mouse') {
    return
  }

  hoverTimer = setTimeout(() => {
    hoverTimer = null
    emit('hover-close')
  }, CLOSE_DELAY)
}

function cancelClose() {
  clearHoverTimer()
}

function togglePanel() {
  clearHoverTimer()
  emit('toggle')
}

function closePanel() {
  clearHoverTimer()
  emit('close')
}

const { current: locale, setLocale, t } = useLocale()
const { current: themeMode, setThemeMode } = useTheme()
const themeSunIconStyle = {
  '--app-theme-icon-url': `url("${themeSunIcon}")`
} as CSSProperties
const themeMoonIconStyle = {
  '--app-theme-icon-url': `url("${themeMoonIcon}")`
} as CSSProperties
const settingsIconStyle = {
  '--app-top-nav-mobile-mask-url': `url("${settingsIcon}")`
} as CSSProperties

onBeforeUnmount(clearHoverTimer)
</script>
