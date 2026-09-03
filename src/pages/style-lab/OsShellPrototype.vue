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

      <div
        class="os-shell-window__body home-desktop"
        :class="{
          'home-desktop--to-night': homeThemeTransition === 'to-night',
          'home-desktop--to-day': homeThemeTransition === 'to-day'
        }"
        @pointermove="handleHomeDesktopPointerMove"
        @pointerleave="resetHomePointer"
      >
        <span class="os-desktop-ambient os-desktop-ambient--depth" aria-hidden="true"></span>
        <span class="os-desktop-ambient os-desktop-ambient--stardust" aria-hidden="true"></span>

        <div class="home-day-foreground" :style="homeDayArtStyle" aria-hidden="true"></div>
        <div class="home-night-foreground" :style="homeNightArtStyle" aria-hidden="true"></div>

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
import { onBeforeUnmount, watch, type CSSProperties } from 'vue'
import settingsIcon from '@/assets/icons/pixelarticons/settings-2.svg'
import yoineArt from '@/assets/home/yoine-1.webp'
import yoinArt from '@/assets/home/yoin-1.webp'
import { siteRoutes } from '@/config/site'
import {
  osShellDesktopPresentation,
  osShellPrimaryPresentations,
  osShellToolPresentations
} from '@/pages/style-lab/osShellPresentation'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'
import { useHomeEffects } from '@/pages/home/composables/useHomeEffects'

const { t } = useLocale()
const settingsIconStyle = {
  '--os-shell-settings-icon-url': `url("${settingsIcon}")`
} as CSSProperties

const homeDayArtStyle = {
  '--home-day-art-url': `url("${yoineArt}")`
} as CSSProperties

const homeNightArtStyle = {
  '--home-night-art-url': `url("${yoinArt}")`
} as CSSProperties

const { current: themeMode } = useTheme()
const {
  homeThemeTransition,
  startHomeThemeTransition,
  handleHomePointerMove,
  resetHomePointer,
  cleanupEffects
} = useHomeEffects()

watch(themeMode, (mode) => {
  startHomeThemeTransition(mode)
})

function handleHomeDesktopPointerMove(event: PointerEvent) {
  handleHomePointerMove(event)
}

onBeforeUnmount(() => {
  cleanupEffects()
})
</script>

<style scoped>
.os-shell-prototype {
  --os-shell-outline-width: 1px;

  /* 旧主页桌面主题变量（取自 pages/home/styles/theme.css），供壁纸与中央立绘使用 */
  --home-theme-duration: 1100ms;
  --home-pink: #ff7cc2;
  --home-blue: #5edceb;
  --home-wallpaper-day: linear-gradient(135deg, #fff7fd 0%, #e9fbff 52%, #fff1fa 100%);
  --home-wallpaper-night: linear-gradient(135deg, #21172b 0%, #070911 54%, #10252c 100%);

  min-height: 100vh;
  background: var(--ns-body-background);
  color: var(--ns-color-text);
  transition:
    background-color var(--ns-transition) ease,
    color var(--ns-transition) ease;
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
  --home-pointer-x: 0;
  --home-pointer-y: 0;

  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: calc(100vh - 28px);
  padding: 28px;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--home-pink) 4%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, var(--home-blue) 4%, transparent) 1px, transparent 1px),
    var(--home-wallpaper-day);
  background-size:
    16px 16px,
    16px 16px,
    auto;
}

.os-shell-window__body::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--home-wallpaper-night);
  content: '';
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--home-theme-duration) ease;
}

:global(:root[data-theme='night'] .os-shell-window__body::before) {
  opacity: 1;
}

.os-desktop-ambient {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--home-theme-duration) ease;
}

.os-desktop-ambient--depth {
  background:
    radial-gradient(ellipse 58% 54% at 50% 72%, rgba(94, 234, 255, 0.13) 0 14%, transparent 45%),
    radial-gradient(ellipse 46% 74% at 88% 42%, rgba(255, 95, 184, 0.11) 0 8%, transparent 42%),
    radial-gradient(ellipse 36% 68% at 10% 62%, rgba(94, 234, 255, 0.08) 0 10%, transparent 48%),
    linear-gradient(
      90deg,
      rgba(255, 95, 184, 0.1),
      transparent 18%,
      transparent 78%,
      rgba(94, 234, 255, 0.1)
    ),
    linear-gradient(180deg, rgba(94, 234, 255, 0.08), transparent 24%, rgba(255, 95, 184, 0.05));
  mix-blend-mode: screen;
}

.os-desktop-ambient--stardust {
  background:
    radial-gradient(circle at 16px 24px, rgba(94, 234, 255, 0.72) 0 1px, transparent 2px),
    radial-gradient(circle at 128px 76px, rgba(255, 95, 184, 0.46) 0 1px, transparent 2px),
    radial-gradient(circle at 244px 34px, rgba(245, 241, 251, 0.42) 0 1px, transparent 2px),
    radial-gradient(circle at 76px 156px, rgba(94, 234, 255, 0.38) 0 1px, transparent 2px);
  background-position:
    12px 18px,
    46px 32px,
    82px 64px,
    0 0;
  background-size:
    286px 214px,
    342px 268px,
    408px 302px,
    238px 198px;
  mix-blend-mode: screen;
}

:global(:root[data-theme='night'] .os-desktop-ambient--depth) {
  opacity: 1;
}

:global(:root[data-theme='night'] .os-desktop-ambient--stardust) {
  opacity: 0.32;
}

@media (prefers-reduced-motion: no-preference) {
  :global(:root[data-theme='night'] .os-desktop-ambient--stardust) {
    animation: home-night-stardust 7s steps(1, end) infinite;
  }
}

/* ---- 中央大立绘（白天 yoine / 夜晚 yoin，配置一致） ---- */

.home-day-foreground,
.home-night-foreground {
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 12;
  display: block;
  height: min(78svh, 720px);
  width: min(52vw, 720px);
  filter: drop-shadow(10px 10px 0 rgba(5, 9, 18, 0.5))
    drop-shadow(-3px 0 0 rgba(255, 95, 184, 0.18)) drop-shadow(3px 0 0 rgba(94, 234, 255, 0.18));
  pointer-events: none;
  transform: translate(
    calc(-50% + (var(--home-pointer-x) * 10px)),
    calc(-50% + (var(--home-pointer-y) * 6px))
  );
  transition: opacity var(--home-theme-duration) ease;
  will-change: opacity, transform;
}

.home-day-foreground {
  background: var(--home-day-art-url, none) center bottom / contain no-repeat;
  opacity: 1;
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s;
  visibility: visible;
}

.home-night-foreground {
  height: min(52svh, 520px);
  background: var(--home-night-art-url, none) center bottom / contain no-repeat;
  opacity: 0;
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s linear var(--home-theme-duration);
  visibility: hidden;
}

:global(:root[data-theme='night'] .home-day-foreground) {
  opacity: 0;
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s linear var(--home-theme-duration);
  visibility: hidden;
}

:global(:root[data-theme='night'] .home-night-foreground) {
  opacity: 1;
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s;
  visibility: visible;
}

:global(:root[data-theme='night'] .home-desktop--to-night .home-day-foreground) {
  transition:
    opacity 320ms steps(5, end),
    transform 320ms steps(5, end),
    visibility 0s linear 320ms;
}

:global(:root[data-theme='night'] .home-desktop--to-night .home-night-foreground) {
  transition:
    opacity 720ms steps(6, end) 220ms,
    transform 720ms steps(6, end) 220ms,
    visibility 0s linear 220ms;
}

:global(:root:not([data-theme='night']) .home-desktop--to-day .home-night-foreground) {
  transition:
    opacity 280ms steps(4, end),
    transform 280ms steps(4, end),
    visibility 0s linear 280ms;
}

:global(:root:not([data-theme='night']) .home-desktop--to-day .home-day-foreground) {
  transition:
    opacity 720ms steps(6, end) 180ms,
    transform 720ms steps(6, end) 180ms,
    visibility 0s linear 180ms;
}

.os-shell-primary-launcher {
  position: relative;
  z-index: 1;
  pointer-events: none;
  display: grid;
  grid-template-columns: repeat(2, 92px);
  grid-template-rows: repeat(2, 92px);
  grid-auto-flow: column;
  column-gap: 12px;
  row-gap: 12px;
  justify-content: space-between;
  width: 100%;
  min-height: 196px;
}

.os-shell-primary-launcher .os-shell-launcher__item--ffxiv {
  grid-area: 1 / 1;
}

.os-shell-primary-launcher .os-shell-launcher__item--about {
  grid-area: 2 / 2;
}

.os-shell-primary-launcher .os-shell-launcher__item--blog {
  grid-area: 1 / 2;
}

.os-shell-launcher {
  position: relative;
  z-index: 1;
  pointer-events: none;
  display: grid;
  grid-template-columns: 92px;
  gap: 12px;
  margin-top: -92px;
}

.os-shell-primary-launcher .os-shell-launcher__item {
  position: static;
  width: 92px;
}

.os-shell-launcher__item {
  pointer-events: auto;
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

.os-shell-launcher__item:hover span {
  color: var(--ns-color-accent-strong);
}

.os-shell-launcher__icon {
  display: block;
  width: 46px;
  height: 46px;
  object-fit: contain;
  image-rendering: pixelated;
}

@media (prefers-reduced-motion: no-preference) {
  .os-shell-launcher__item {
    transition: transform 120ms steps(2, end);
  }

  .os-shell-launcher__item:hover .os-shell-launcher__icon,
  .os-shell-launcher__item:focus-visible .os-shell-launcher__icon {
    animation: os-icon-hop 280ms steps(2, end);
  }

  .os-shell-launcher__icon {
    animation: os-icon-idle 9s steps(1, end) infinite;
  }

  .os-shell-primary-launcher .os-shell-launcher__item:nth-child(1) .os-shell-launcher__icon {
    animation-delay: 0s;
  }

  .os-shell-primary-launcher .os-shell-launcher__item:nth-child(2) .os-shell-launcher__icon {
    animation-delay: 2.6s;
  }

  .os-shell-primary-launcher .os-shell-launcher__item:nth-child(3) .os-shell-launcher__icon {
    animation-delay: 4.8s;
  }

  .os-shell-launcher .os-shell-launcher__item:nth-child(1) .os-shell-launcher__icon {
    animation-delay: 1.1s;
  }

  .os-shell-launcher .os-shell-launcher__item:nth-child(2) .os-shell-launcher__icon {
    animation-delay: 3.4s;
  }

  .os-shell-launcher .os-shell-launcher__item:nth-child(3) .os-shell-launcher__icon {
    animation-delay: 5.2s;
  }

  .os-shell-launcher .os-shell-launcher__item:nth-child(4) .os-shell-launcher__icon {
    animation-delay: 0.7s;
  }

  .os-shell-launcher .os-shell-launcher__item:nth-child(5) .os-shell-launcher__icon {
    animation-delay: 4.1s;
  }
}

@keyframes os-icon-idle {
  0%,
  86%,
  100% {
    transform: translateY(0);
  }

  88% {
    transform: translateY(-2px);
  }

  90% {
    transform: translateY(1px);
  }

  92% {
    transform: translateY(0);
  }
}

@keyframes os-icon-hop {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-4px);
  }

  100% {
    transform: translateY(0);
  }
}

@keyframes home-night-stardust {
  0%,
  100% {
    opacity: 0.24;
    transform: translate3d(0, 0, 0);
  }

  28% {
    opacity: 0.34;
    transform: translate3d(2px, -1px, 0);
  }

  54% {
    opacity: 0.18;
    transform: translate3d(-1px, 1px, 0);
  }

  78% {
    opacity: 0.3;
    transform: translate3d(1px, 0, 0);
  }
}

@media (max-width: 620px) {
  .os-shell-window__body {
    min-height: calc(100vh - 28px);
    padding: 18px 14px;
  }

  .os-shell-launcher {
    gap: 8px;
  }

  .home-day-foreground,
  .home-night-foreground {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-day-foreground,
  .home-night-foreground {
    transform: translate(-50%, -50%) !important;
  }
}
</style>
