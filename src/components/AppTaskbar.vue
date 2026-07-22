<template>
  <nav class="app-taskbar" :aria-label="t(textKeys.menuTitle)">
    <RouterLink class="app-taskbar__start" :to="siteRoutes.home">
      <span class="app-taskbar__start-icon" :style="pixelIconStyle(pixelSparklesIcon)" aria-hidden="true"></span>
      <span>{{ t(textKeys.homeDream) }}</span>
      <span class="app-taskbar__command" aria-hidden="true">HOME</span>
    </RouterLink>

    <div class="app-taskbar__windows app-taskbar__windows--day">
      <a
        v-for="link in homeSocialLinks"
        :key="link.id"
        class="app-taskbar__window"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t(link.labelKey)"
        :title="t(link.labelKey)"
      >
        <img class="app-taskbar__social-icon" :src="link.icon" alt="" aria-hidden="true">
        <span>{{ t(link.labelKey) }}</span>
      </a>
    </div>

    <div class="app-taskbar__windows app-taskbar__windows--night">
      <RouterLink
        v-for="item in taskbarItems"
        :key="item.id"
        class="app-taskbar__window"
        :class="{ 'app-taskbar__window--active': item.active }"
        :aria-current="item.active ? 'page' : undefined"
        :to="item.route"
      >
        <span class="app-taskbar__dot" aria-hidden="true"></span>
        <span>{{ t(item.labelKey) }}</span>
      </RouterLink>
    </div>

    <span class="app-taskbar__icp">测试备案号：12345号</span>

    <button
      type="button"
      class="app-taskbar__clock"
      :aria-label="t(textKeys.homeDesktopClock)"
      @click="toggleTheme"
    >
      <span class="app-taskbar__mode" aria-hidden="true">
        <span class="app-taskbar__mode-icon app-taskbar__mode-icon--day" :style="modeIconStyle(sunIcon)"></span>
        <span class="app-taskbar__mode-icon app-taskbar__mode-icon--night" :style="modeIconStyle(moonIcon)"></span>
      </span>
      <span>{{ clockLabel }}</span>
      <span class="app-taskbar__command" aria-hidden="true">TIME</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { RouterLink } from 'vue-router'
import pixelSparklesIcon from '@/assets/icons/pixelarticons/sparkles.svg'
import moonIcon from '@/assets/icons/moon.svg'
import sunIcon from '@/assets/icons/sun-alt.svg'
import { isSilenceEnabled } from '@/config/features'
import { siteRoutes } from '@/config/site'
import { siteSocialLinks } from '@/config/socialLinks'
import { homeTextKeys as textKeys } from '@/locales/keys/home'
import { homeUiMessages } from '@/locales/modules/home'
import { loadMessages, useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'

loadMessages(homeUiMessages)

const { t } = useLocale()
const { current: themeMode, setThemeMode } = useTheme()

const clockLabel = computed(() => (themeMode.value === 'night' ? '00:29' : '06:29'))

const taskbarItems = [
  { id: 'profile', labelKey: textKeys.siteZhName, route: siteRoutes.home, active: false },
  { id: 'ffxiv', labelKey: textKeys.ffxivWorkshop, route: siteRoutes.ffxiv, active: false },
  ...(isSilenceEnabled ? [{ id: 'silence', labelKey: textKeys.silence, route: siteRoutes.silence, active: false }] : [])
] as const

const homeSocialLinks = siteSocialLinks.map((link) => ({
  ...link,
  labelKey: `home.social.${link.id}`
}))

function toggleTheme() {
  setThemeMode(themeMode.value === 'night' ? 'day' : 'night')
}

function pixelIconStyle(icon: string): CSSProperties {
  return { '--app-taskbar-icon-url': `url("${icon}")` } as CSSProperties
}

function modeIconStyle(icon: string): CSSProperties {
  return { '--app-taskbar-mode-icon-url': `url("${icon}")` } as CSSProperties
}
</script>

<style scoped>
/* ---- Taskbar Container ---- */
.app-taskbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 8;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  min-height: 46px;
  padding: 5px 7px;
  border-top: 2px solid var(--ns-pixel-border);
  background: var(--ns-top-nav-bg);
  box-shadow: var(--ns-pixel-nav-shadow);
  font-family: var(--ns-font-decorative);
}

/* ---- Base button / link style (matching top nav) ---- */
.app-taskbar__start,
.app-taskbar__window,
.app-taskbar__clock {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface);
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  box-shadow: var(--ns-pixel-button-shadow);
  cursor: pointer;
  transition:
    background var(--ns-transition-fast),
    color var(--ns-transition-fast),
    transform var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.app-taskbar__start:hover,
.app-taskbar__window:hover,
.app-taskbar__clock:hover {
  background: var(--ns-pixel-hover-surface);
  color: var(--ns-color-text);
  transform: translate(-1px, -1px);
  box-shadow: var(--ns-pixel-button-shadow-hover);
}

.app-taskbar__start:active,
.app-taskbar__window:active,
.app-taskbar__clock:active {
  transform: translate(1px, 1px);
  box-shadow: var(--ns-pixel-soft-shadow);
}

/* ---- Start button ---- */
.app-taskbar__start {
  flex: 0 0 auto;
  min-width: auto;
}

.app-taskbar__command {
  padding: 3px 5px;
  margin-left: 2px;
  border-left: 1px solid var(--ns-pixel-divider);
  color: var(--ns-color-text-muted);
  font-size: 10px;
  letter-spacing: 0.02em;
}

.app-taskbar__start-icon {
  display: block;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  background: currentColor;
  color: var(--ns-color-accent);
  image-rendering: pixelated;
  mask: var(--app-taskbar-icon-url) center / contain no-repeat;
  -webkit-mask: var(--app-taskbar-icon-url) center / contain no-repeat;
}

/* ---- Windows area ---- */
.app-taskbar__windows {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.app-taskbar__windows--day {
  display: none;
}

:root:not([data-theme='night']) .app-taskbar__windows--day {
  display: flex;
  flex: 1 1 auto;
}

:root:not([data-theme='night']) .app-taskbar__windows--night {
  display: none;
}

.app-taskbar__window {
  flex: 0 1 auto;
  max-width: 200px;
  justify-content: flex-start;
}

.app-taskbar__window--social img {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  image-rendering: pixelated;
}

.app-taskbar__social-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  image-rendering: pixelated;
}

.app-taskbar__window--active {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-accent-strong);
}

.app-taskbar__dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border: 2px solid var(--ns-color-accent);
  background: var(--ns-color-accent);
}

.app-taskbar__window:nth-child(even) .app-taskbar__dot {
  border-color: var(--ns-color-cyan);
  background: var(--ns-color-cyan);
}

.app-taskbar__window span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- ICP text ---- */
.app-taskbar__icp {
  flex: 0 0 auto;
  padding: 0 6px;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-decorative);
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

/* ---- Clock button ---- */
.app-taskbar__clock {
  flex: 0 0 auto;
  min-width: auto;
  justify-content: center;
  cursor: pointer;
}

.app-taskbar__mode {
  position: relative;
  display: block;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
}

.app-taskbar__mode-icon {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  background: currentColor;
  image-rendering: pixelated;
  mask: var(--app-taskbar-mode-icon-url) center / contain no-repeat;
  -webkit-mask: var(--app-taskbar-mode-icon-url) center / contain no-repeat;
}

.app-taskbar__mode-icon--day {
  color: #f5a623;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.app-taskbar__mode-icon--night {
  color: #7fd9e3;
  opacity: 0;
  transition: opacity 0.3s ease;
}

:root[data-theme='night'] .app-taskbar__mode-icon--day {
  opacity: 0;
}

:root[data-theme='night'] .app-taskbar__mode-icon--night {
  opacity: 1;
}

/* ---- Responsive ---- */
@media (max-width: 640px) {
  .app-taskbar {
    z-index: 30;
  }

  .app-taskbar__windows {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    touch-action: pan-x;
    -webkit-overflow-scrolling: touch;
  }

  .app-taskbar__windows::-webkit-scrollbar {
    display: none;
  }

  :root:not([data-theme='night']) .app-taskbar__windows--day,
  :root[data-theme='night'] .app-taskbar__windows--night {
    display: flex;
  }

  :root:not([data-theme='night']) .app-taskbar__windows--night,
  :root[data-theme='night'] .app-taskbar__windows--day {
    display: none;
  }

  .app-taskbar__window {
    flex: 0 0 auto;
    scroll-snap-align: start;
  }

  .app-taskbar__windows--night .app-taskbar__window {
    width: auto;
    min-width: 112px;
    max-width: 150px;
  }

  .app-taskbar__clock {
    min-width: auto;
    font-size: 11px;
  }
}
</style>
