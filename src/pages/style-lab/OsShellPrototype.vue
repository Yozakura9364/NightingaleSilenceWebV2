<template>
  <main class="os-shell-prototype" :aria-label="t(osShellDesktopPresentation.titleKey)">
    <section class="os-shell-window">
      <header class="os-shell-window__bar">
        <RouterLink
          class="os-shell-window__title"
          :to="osShellDesktopPresentation.route"
          :aria-label="t(textKeys.home)"
          :title="t(textKeys.home)"
        >
          <img
            class="os-shell-window__icon"
            :src="osShellDesktopPresentation.icon"
            alt=""
            aria-hidden="true"
          />
          <span>{{ t(osShellDesktopPresentation.titleKey) }}</span>
        </RouterLink>
        <RouterLink
          class="os-shell-window__settings"
          :to="siteRoutes.settings"
          :aria-label="t(textKeys.config)"
          :title="t(textKeys.config)"
        >
          <span :style="settingsIconStyle" aria-hidden="true"></span>
        </RouterLink>
      </header>

      <div class="os-shell-window__body">
        <nav class="os-shell-primary-launcher" :aria-label="t(osShellDesktopPresentation.titleKey)">
          <RouterLink
            v-for="entry in osShellPrimaryPresentations"
            :key="entry.id"
            class="os-shell-launcher__item"
            :class="`os-shell-launcher__item--${entry.id}`"
            :to="entry.route"
          >
            <img class="os-shell-launcher__icon" :src="entry.icon" alt="" aria-hidden="true" />
            <span>{{ t(entry.titleKey) }}</span>
          </RouterLink>
        </nav>

        <nav class="os-shell-launcher" :aria-label="t(osShellPrimaryPresentations[0].titleKey)">
          <RouterLink
            v-for="tool in osShellToolPresentations"
            :key="tool.id"
            class="os-shell-launcher__item"
            :to="tool.route"
          >
            <img class="os-shell-launcher__icon" :src="tool.icon" alt="" aria-hidden="true" />
            <span>{{ t(tool.titleKey) }}</span>
          </RouterLink>
        </nav>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { type CSSProperties } from 'vue'
import settingsIcon from '@/assets/icons/pixelarticons/settings-2.svg'
import { siteRoutes } from '@/config/site'
import {
  osShellDesktopPresentation,
  osShellPrimaryPresentations,
  osShellToolPresentations
} from '@/pages/style-lab/osShellPresentation'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
const settingsIconStyle = {
  '--os-shell-settings-icon-url': `url("${settingsIcon}")`
} as CSSProperties
</script>

<style scoped>
.os-shell-prototype {
  --os-shell-outline-width: 1px;

  min-height: 100vh;
  background: var(--ns-body-background);
  color: var(--ns-color-text);
  transition: background-color var(--ns-transition) ease, color var(--ns-transition) ease;
}

.os-shell-window {
  min-height: 100vh;
  background: transparent;
}

.os-shell-window__bar {
  display: flex;
  min-height: 28px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
  border-bottom: var(--os-shell-outline-width) solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bar-bg);
}

.os-shell-window__title {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
  color: var(--ns-pixel-window-title-color);
  font-family: var(--ns-font-pixel);
  font-size: 10px;
  font-weight: 950;
  line-height: 1;
  text-decoration: none;
  text-shadow: var(--ns-pixel-window-title-shadow);
}

.os-shell-window__title:focus-visible {
  outline: 2px solid #2a2138;
  outline-offset: 2px;
}

.os-shell-window__settings {
  display: inline-flex;
  flex: 0 0 28px;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  color: var(--ns-pixel-window-title-color);
}

.os-shell-window__settings > span {
  display: block;
  width: 16px;
  height: 16px;
  background: currentColor;
  mask: var(--os-shell-settings-icon-url) center / contain no-repeat;
  -webkit-mask: var(--os-shell-settings-icon-url) center / contain no-repeat;
}

.os-shell-window__settings:hover {
  color: var(--ns-color-accent-strong);
}

.os-shell-window__settings:focus-visible {
  outline: 2px solid var(--ns-color-accent-strong);
  outline-offset: -2px;
}

.os-shell-window__icon {
  display: block;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  object-fit: contain;
  image-rendering: pixelated;
}

.os-shell-window__body {
  min-height: calc(100vh - 28px);
  padding: 28px;
}

.os-shell-primary-launcher {
  position: relative;
  min-height: 92px;
}

.os-shell-launcher {
  display: grid;
  grid-template-columns: 92px;
  gap: 12px;
  margin-top: 12px;
}

.os-shell-primary-launcher .os-shell-launcher__item {
  position: absolute;
  top: 0;
  width: 92px;
}

.os-shell-launcher__item--ffxiv {
  left: 0;
}

.os-shell-launcher__item--about {
  right: 0;
}

.os-shell-launcher__item {
  display: grid;
  min-height: 92px;
  align-content: center;
  justify-items: center;
  gap: 6px;
  padding: 7px 4px;
  border: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text);
  font-family: var(--ns-font-pixel);
  font-size: 12px;
  font-weight: 950;
  line-height: 1.15;
  text-align: center;
  text-decoration: none;
  text-wrap: balance;
  cursor: pointer;
}

.os-shell-launcher__item:hover {
  transform: translateY(-2px);
}

.os-shell-launcher__item:active {
  transform: translateY(2px);
}

.os-shell-launcher__item:focus-visible {
  outline: 2px solid #2a2138;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: no-preference) {
  .os-shell-launcher__item {
    transition: transform 120ms steps(2, end);
  }
}

.os-shell-launcher__icon {
  display: block;
  width: 46px;
  height: 46px;
  object-fit: contain;
  image-rendering: pixelated;
}

@media (max-width: 620px) {
  .os-shell-window__body {
    min-height: calc(100vh - 28px);
    padding: 18px 14px;
  }

  .os-shell-launcher {
    gap: 8px;
  }
}
</style>
