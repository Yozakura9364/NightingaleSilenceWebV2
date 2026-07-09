<template>
  <main class="ns-page home-page" :aria-label="t(textKeys.homeDesktop)">
    <section
      ref="desktopEl"
      class="home-desktop"
      aria-labelledby="home-title"
      @pointermove="handleHomePointerMove"
      @pointerleave="resetHomePointer"
    >
      <div class="home-desktop__wallpaper" aria-hidden="true">
        <span class="home-desktop__grid"></span>
        <span class="home-desktop__scanline"></span>
      </div>
      <div class="home-day-foreground" :style="homeDayArtStyle" aria-hidden="true"></div>
      <div class="home-night-foreground" :style="homeNightArtStyle" aria-hidden="true"></div>

      <nav class="home-desktop__icons" :aria-label="t(textKeys.primaryNavigation)">
        <RouterLink
          v-for="item in desktopIcons"
          :key="item.id"
          class="home-desktop-icon"
          :to="item.route"
          :class="`home-desktop-icon--${item.tone}`"
        >
          <span class="home-desktop-icon__image" :style="pixelIconStyle(item.icon)" aria-hidden="true"></span>
          <span class="home-desktop-icon__label">{{ t(item.labelKey) }}</span>
        </RouterLink>
      </nav>

      <article class="home-window home-window--main" :aria-label="t(siteMeta.zhNameKey)">
        <div class="home-window__bar">
          <span class="home-window__title">
            <span class="home-window__icon" :style="pixelIconStyle(pixelHomeIcon)" aria-hidden="true"></span>
            <span>{{ t(siteMeta.enNameKey) }}</span>
          </span>
          <span class="home-window__controls" aria-hidden="true">
            <span class="home-window__control home-window__control--min"></span>
            <span class="home-window__control home-window__control--max"></span>
            <span class="home-window__control home-window__control--close"></span>
          </span>
        </div>

        <div class="home-window__body home-window__body--main">
          <div class="home-profile">
            <div class="home-profile__art" :style="homeCharacterArtStyle" aria-hidden="true"></div>
            <div class="home-profile__copy">
              <p class="home-profile__command">{{ t(textKeys.homeDesktopCommand) }}</p>
              <h1 id="home-title">{{ t(siteMeta.zhNameKey) }}</h1>
              <p>{{ t(textKeys.placeholder) }}</p>
            </div>
          </div>
        </div>
      </article>

      <aside class="home-window home-window--links" :aria-label="t(textKeys.homeDesktopLinks)">
        <div class="home-window__bar home-window__bar--blue">
          <span class="home-window__title">
            <span class="home-window__icon" :style="pixelIconStyle(pixelFolderIcon)" aria-hidden="true"></span>
            <span>{{ t(textKeys.homeDesktopLinks) }}</span>
          </span>
          <span class="home-window__controls" aria-hidden="true">
            <span class="home-window__control home-window__control--min"></span>
            <span class="home-window__control home-window__control--close"></span>
          </span>
        </div>

        <div class="home-window__body home-link-list">
          <a
            v-for="link in homeSocialLinks"
            :key="link.id"
            class="home-link-list__item"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img :src="link.icon" alt="" aria-hidden="true">
            <span>{{ t(link.labelKey) }}</span>
          </a>
        </div>
      </aside>

      <aside class="home-window home-window--note" :aria-label="t(textKeys.homeDesktopMemo)">
        <div class="home-window__bar home-window__bar--pink">
          <span class="home-window__title">
            <span class="home-window__icon" :style="pixelIconStyle(pixelSparklesIcon)" aria-hidden="true"></span>
            <span>{{ t(textKeys.homeDesktopMemo) }}</span>
          </span>
          <span class="home-window__controls" aria-hidden="true">
            <span class="home-window__control home-window__control--close"></span>
          </span>
        </div>
        <div class="home-window__body home-memo">
          <span>{{ t(textKeys.placeholder) }}</span>
          <strong>{{ t(textKeys.homeDesktopReady) }}</strong>
        </div>
      </aside>

      <nav class="home-taskbar" :aria-label="t(textKeys.menuTitle)">
        <RouterLink class="home-taskbar__start" :to="siteRoutes.home">
          <span class="home-taskbar__start-icon" :style="pixelIconStyle(pixelSparklesIcon)" aria-hidden="true"></span>
          <span>{{ t(textKeys.homeDream) }}</span>
        </RouterLink>

        <span class="home-taskbar__separator" aria-hidden="true"></span>

        <div class="home-taskbar__windows">
          <RouterLink
            v-for="item in taskbarItems"
            :key="item.id"
            class="home-taskbar__window"
            :class="{ 'home-taskbar__window--active': item.active }"
            :to="item.route"
          >
            <span class="home-taskbar__dot" aria-hidden="true"></span>
            <span>{{ t(item.labelKey) }}</span>
          </RouterLink>
        </div>

        <span class="home-taskbar__separator" aria-hidden="true"></span>
        <button
          type="button"
          class="home-taskbar__clock"
          :aria-label="t(textKeys.homeDesktopClock)"
          @click="toggleHomeTheme"
        >
          <span class="home-taskbar__mode" aria-hidden="true"></span>
          <span>{{ t(textKeys.homeDesktopClock) }}</span>
        </button>
      </nav>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, type CSSProperties } from 'vue'
import { RouterLink } from 'vue-router'
import pixelArchiveIcon from '@/assets/icons/pixelarticons/archive.svg'
import pixelAvatarCircleIcon from '@/assets/icons/pixelarticons/avatar-circle.svg'
import pixelFolderIcon from '@/assets/icons/pixelarticons/folder.svg'
import pixelHomeIcon from '@/assets/icons/pixelarticons/home.svg'
import pixelSparklesIcon from '@/assets/icons/pixelarticons/sparkles.svg'
import { siteMeta, siteRoutes, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'

const { t } = useLocale()
const { current: themeMode, setThemeMode } = useTheme()
const desktopEl = ref<HTMLElement | null>(null)

let pointerFrame = 0
let pointerTargetX = 0
let pointerTargetY = 0
let pointerCurrentX = 0
let pointerCurrentY = 0

const isHomeCharacterArtPreview = import.meta.env.DEV
const homeCharacterArtStyle = computed(
  () =>
    ({
      '--home-character-art-url': isHomeCharacterArtPreview ? 'url("/local-assets/yoine-1.png")' : 'none'
    }) as CSSProperties
)
const homeDayArtStyle = computed(
  () =>
    ({
      '--home-day-art-url': isHomeCharacterArtPreview ? 'url("/local-assets/yoine-6.png")' : 'none'
    }) as CSSProperties
)
const homeNightArtStyle = computed(
  () =>
    ({
      '--home-night-art-url': isHomeCharacterArtPreview ? 'url("/local-assets/yoin-3.png")' : 'none'
    }) as CSSProperties
)

const desktopIcons = [
  {
    id: 'dream',
    labelKey: textKeys.homeDream,
    route: siteRoutes.silence,
    icon: pixelSparklesIcon,
    tone: 'pink'
  },
  {
    id: 'angel',
    labelKey: textKeys.homeAngel,
    route: siteRoutes.silenceAngel,
    icon: pixelAvatarCircleIcon,
    tone: 'blue'
  },
  {
    id: 'glitch',
    labelKey: textKeys.homeGlitch,
    route: siteRoutes.silenceGlitch,
    icon: pixelArchiveIcon,
    tone: 'violet'
  },
  {
    id: 'network',
    labelKey: textKeys.homeNetworkNeighbor,
    route: siteRoutes.about,
    icon: pixelFolderIcon,
    tone: 'mint'
  }
] as const

const taskbarItems = [
  {
    id: 'profile',
    labelKey: textKeys.siteZhName,
    route: siteRoutes.home,
    active: true
  },
  {
    id: 'ffxiv',
    labelKey: textKeys.ffxivWorkshop,
    route: siteRoutes.ffxiv,
    active: false
  },
  {
    id: 'silence',
    labelKey: textKeys.silence,
    route: siteRoutes.silence,
    active: false
  }
] as const

const homeSocialLinks = [
  {
    id: 'huiji',
    labelKey: 'home.social.huiji',
    href: 'https://ff14.huijiwiki.com/wiki/%E5%88%86%E7%B1%BB:%E4%BD%9C%E8%80%85NIGHTINGALE',
    icon: '/assets/icons/huiji.svg'
  },
  {
    id: 'nga',
    labelKey: 'home.social.nga',
    href: 'https://nga.178.com/thread.php?authorid=12605886',
    icon: '/assets/icons/nga.svg'
  },
  {
    id: 'xiaohongshu',
    labelKey: 'home.social.xiaohongshu',
    href: 'https://xhslink.com/m/2xLfxolEhzS',
    icon: '/assets/icons/xiaohongshu.svg'
  },
  {
    id: 'weibo',
    labelKey: 'home.social.weibo',
    href: 'https://weibo.com/1734754935?refer_flag=1001030103_',
    icon: '/assets/icons/weibo.svg'
  },
  {
    id: 'douyin',
    labelKey: 'home.social.douyin',
    href: 'https://www.douyin.com/user/MS4wLjABAAAAtHfFkouTFs-quaZJ9EEgYjkWIa32xJSgiqNklbNuqQY',
    icon: '/assets/icons/douyin.svg'
  }
] as const

function pixelIconStyle(icon: string): CSSProperties {
  return {
    '--home-icon-url': `url("${icon}")`
  } as CSSProperties
}

function toggleHomeTheme() {
  setThemeMode(themeMode.value === 'night' ? 'day' : 'night')
}

function shouldReduceHomeMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function applyHomePointerFrame() {
  pointerCurrentX += (pointerTargetX - pointerCurrentX) * 0.14
  pointerCurrentY += (pointerTargetY - pointerCurrentY) * 0.14

  desktopEl.value?.style.setProperty('--home-pointer-x', pointerCurrentX.toFixed(3))
  desktopEl.value?.style.setProperty('--home-pointer-y', pointerCurrentY.toFixed(3))

  if (Math.abs(pointerTargetX - pointerCurrentX) > 0.002 || Math.abs(pointerTargetY - pointerCurrentY) > 0.002) {
    pointerFrame = window.requestAnimationFrame(applyHomePointerFrame)
    return
  }

  pointerFrame = 0
}

function scheduleHomePointerFrame() {
  if (pointerFrame || shouldReduceHomeMotion()) {
    return
  }

  pointerFrame = window.requestAnimationFrame(applyHomePointerFrame)
}

function handleHomePointerMove(event: PointerEvent) {
  const desktop = desktopEl.value

  if (!desktop || shouldReduceHomeMotion()) {
    return
  }

  const rect = desktop.getBoundingClientRect()
  pointerTargetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
  pointerTargetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
  scheduleHomePointerFrame()
}

function resetHomePointer() {
  pointerTargetX = 0
  pointerTargetY = 0
  scheduleHomePointerFrame()
}

onBeforeUnmount(() => {
  if (pointerFrame) {
    window.cancelAnimationFrame(pointerFrame)
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100svh;
  overflow: hidden;
  background: #fdf6ff;
  color: var(--home-ink);
  --home-theme-duration: 1100ms;
  --home-bg: #fff7fd;
  --home-bg-blue: #e8fbff;
  --home-surface: #ffffff;
  --home-surface-soft: rgba(255, 255, 255, 0.82);
  --home-pink-soft: #ffe4f4;
  --home-blue-soft: #dffbff;
  --home-mint-soft: #e3fff6;
  --home-violet-soft: #eee6ff;
  --home-ink: #2a2138;
  --home-muted: #6f637a;
  --home-pink: #ff7cc2;
  --home-blue: #5edceb;
  --home-border: #2a2138;
  --home-shadow: rgba(42, 33, 56, 0.22);
  --home-window-shadow:
    6px 6px 0 var(--home-shadow),
    0 0 22px rgba(94, 220, 235, 0.08);
  --home-window-bar:
    linear-gradient(90deg, rgba(255, 124, 194, 0.24), rgba(94, 220, 235, 0.22)),
    var(--home-surface);
  --home-wallpaper:
    radial-gradient(circle at 18% 18%, rgba(255, 124, 194, 0.2), transparent 28%),
    radial-gradient(circle at 84% 22%, rgba(94, 220, 235, 0.22), transparent 30%),
    linear-gradient(135deg, rgba(255, 247, 253, 0.98), rgba(232, 251, 255, 0.98));
}

:global(:root[data-theme='night'] .home-page) {
  --home-bg: #030407;
  --home-bg-blue: #071014;
  --home-surface: #0d1018;
  --home-surface-soft: rgba(13, 16, 24, 0.88);
  --home-pink-soft: #241324;
  --home-blue-soft: #102630;
  --home-mint-soft: #102821;
  --home-violet-soft: #201832;
  --home-ink: #f5f1fb;
  --home-muted: #cac2d0;
  --home-pink: #ff5fb8;
  --home-blue: #5eeaff;
  --home-border: #cbc2d2;
  --home-shadow: rgba(5, 9, 18, 0.66);
  --home-window-shadow:
    6px 6px 0 rgba(5, 9, 18, 0.78),
    0 0 18px rgba(94, 234, 255, 0.1),
    0 0 28px rgba(255, 95, 184, 0.08);
  --home-window-bar:
    linear-gradient(90deg, rgba(255, 95, 184, 0.18), rgba(94, 234, 255, 0.16)),
    #10131d;
  --home-wallpaper:
    radial-gradient(circle at 18% 14%, rgba(255, 95, 184, 0.18), transparent 28%),
    radial-gradient(circle at 82% 18%, rgba(94, 234, 255, 0.18), transparent 30%),
    linear-gradient(115deg, rgba(30, 20, 34, 0.58), rgba(3, 4, 7, 0.99) 52%, rgba(12, 34, 39, 0.42));
}

.home-desktop {
  position: relative;
  isolation: isolate;
  min-height: 100svh;
  padding: 26px 28px 58px;
  --home-pointer-x: 0;
  --home-pointer-y: 0;
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 124, 194, 0.2), transparent 28%),
    radial-gradient(circle at 84% 22%, rgba(94, 220, 235, 0.22), transparent 30%),
    linear-gradient(135deg, rgba(255, 247, 253, 0.98), rgba(232, 251, 255, 0.98));
}

.home-desktop__wallpaper,
.home-desktop__grid,
.home-desktop__scanline {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.home-desktop__wallpaper {
  background:
    radial-gradient(circle at 18% 14%, rgba(255, 95, 184, 0.18), transparent 28%),
    radial-gradient(circle at 82% 18%, rgba(94, 234, 255, 0.18), transparent 30%),
    linear-gradient(115deg, rgba(30, 20, 34, 0.58), rgba(3, 4, 7, 0.99) 52%, rgba(12, 34, 39, 0.42));
  opacity: 0;
  transition: opacity var(--home-theme-duration) ease;
}

:global(:root[data-theme='night'] .home-desktop__wallpaper) {
  opacity: 1;
}

.home-desktop__grid {
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--home-pink) 11%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, var(--home-blue) 11%, transparent) 1px, transparent 1px);
  background-size: 18px 18px;
}

.home-desktop__scanline {
  opacity: 0.14;
  background: repeating-linear-gradient(180deg, transparent 0 8px, var(--home-border) 8px 9px);
}

.home-day-foreground,
.home-night-foreground {
  position: fixed;
  left: 50%;
  bottom: -2px;
  z-index: 12;
  display: block;
  height: min(104svh, 940px);
  filter:
    drop-shadow(10px 10px 0 rgba(5, 9, 18, 0.5))
    drop-shadow(-3px 0 0 rgba(255, 95, 184, 0.18))
    drop-shadow(3px 0 0 rgba(94, 234, 255, 0.18));
  pointer-events: none;
  transform: translate(
    calc(-50% + (var(--home-pointer-x) * 10px)),
    calc(var(--home-pointer-y) * 6px)
  );
  transition: opacity var(--home-theme-duration) ease;
  will-change: opacity, transform;
}

.home-day-foreground {
  width: min(68vw, 1040px);
  background: var(--home-day-art-url, none) center bottom / contain no-repeat;
  opacity: 1;
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s;
  visibility: visible;
}

.home-night-foreground {
  width: min(58vw, 820px);
  background: var(--home-night-art-url, none) center bottom / contain no-repeat;
  opacity: 0;
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s linear var(--home-theme-duration);
  transform: translate(
    calc(-50% + (var(--home-pointer-x) * -14px)),
    calc(22px + (var(--home-pointer-y) * 8px))
  );
  visibility: hidden;
}

:global(:root[data-theme='night'] .home-day-foreground) {
  opacity: 0;
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s linear var(--home-theme-duration);
  transform: translate(
    calc(-50% + (var(--home-pointer-x) * 10px)),
    calc(12px + (var(--home-pointer-y) * 6px))
  );
  visibility: hidden;
}

:global(:root[data-theme='night'] .home-night-foreground) {
  opacity: 1;
  transform: translate(
    calc(-50% + (var(--home-pointer-x) * -14px)),
    calc(var(--home-pointer-y) * 8px)
  );
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s;
  visibility: visible;
}

.home-desktop__icons {
  position: relative;
  z-index: 3;
  display: grid;
  width: 92px;
  gap: 12px;
}

.home-desktop-icon {
  display: grid;
  min-width: 0;
  justify-items: center;
  gap: 6px;
  padding: 7px 4px;
  border: 2px solid transparent;
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
}

.home-desktop-icon:hover,
.home-desktop-icon:focus-visible {
  border-color: var(--home-border);
  background: color-mix(in srgb, var(--home-surface) 74%, transparent);
  outline: 0;
}

.home-window__icon,
.home-taskbar__start-icon {
  display: inline-block;
  background: currentColor;
  mask: var(--home-icon-url) center / 100% 100% no-repeat;
  -webkit-mask: var(--home-icon-url) center / 100% 100% no-repeat;
}

.home-desktop-icon__image {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  padding: 9px;
  border: 2px solid var(--home-border);
  background-color: var(--home-ink);
  box-shadow: 3px 3px 0 var(--home-shadow);
}

.home-desktop-icon--pink .home-desktop-icon__image {
  color: var(--home-ink);
  background-color: var(--home-pink-soft);
}

.home-desktop-icon--blue .home-desktop-icon__image {
  background-color: var(--home-blue-soft);
}

.home-desktop-icon--violet .home-desktop-icon__image {
  background-color: var(--home-violet-soft);
}

.home-desktop-icon--mint .home-desktop-icon__image {
  background-color: var(--home-mint-soft);
}

.home-desktop-icon__image::before {
  display: block;
  width: 24px;
  height: 24px;
  background: currentColor;
  content: '';
  mask: var(--home-icon-url) center / 100% 100% no-repeat;
  -webkit-mask: var(--home-icon-url) center / 100% 100% no-repeat;
}

.home-desktop-icon__label {
  display: -webkit-box;
  overflow: hidden;
  max-width: 84px;
  min-height: 28px;
  text-shadow: 1px 1px 0 var(--home-surface);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (prefers-reduced-motion: no-preference) {
  .home-page,
  .home-desktop-icon,
  .home-desktop-icon__image,
  .home-desktop-icon__label,
  .home-window,
  .home-window__bar,
  .home-window__control,
  .home-window__body--main,
  .home-profile__copy,
  .home-profile__command,
  .home-profile__copy h1,
  .home-profile__copy p,
  .home-link-list__item,
  .home-memo,
  .home-memo strong,
  .home-taskbar,
  .home-taskbar__start,
  .home-taskbar__window,
  .home-taskbar__clock,
  .home-taskbar__dot,
  .home-taskbar__mode {
    transition:
      background-color var(--home-theme-duration) ease,
      border-color var(--home-theme-duration) ease,
      box-shadow var(--home-theme-duration) ease,
      color var(--home-theme-duration) ease,
      filter var(--home-theme-duration) ease,
      opacity var(--home-theme-duration) ease,
      text-shadow var(--home-theme-duration) ease;
  }
}

:global(:root[data-theme='night'] .home-desktop-icon__label) {
  text-shadow: 1px 1px 0 #030407;
}

.home-window {
  position: absolute;
  z-index: 4;
  display: grid;
  min-width: 0;
  border: 2px solid var(--home-border);
  background: var(--home-surface);
  box-shadow: var(--home-window-shadow);
}

.home-window--main {
  top: 64px;
  right: 28%;
  bottom: 82px;
  left: 150px;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 460px;
}

.home-window--links {
  top: 78px;
  right: 34px;
  width: min(320px, 28vw);
}

.home-window--note {
  right: 70px;
  bottom: 112px;
  width: min(300px, 26vw);
}

.home-window__bar {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 6px 10px;
  border-bottom: 2px solid var(--home-border);
  background: var(--home-window-bar);
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
}

.home-window__bar--blue {
  background: var(--home-blue-soft);
}

.home-window__bar--pink {
  background: var(--home-pink-soft);
}

.home-window__title {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  overflow: hidden;
}

.home-window__title span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-window__icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
}

.home-window__controls {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  margin-left: auto;
}

.home-window__control {
  position: relative;
  width: 18px;
  height: 18px;
  border: 2px solid var(--home-border);
  background: var(--home-surface);
}

.home-window__control--min::before,
.home-window__control--close::before,
.home-window__control--close::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9px;
  height: 2px;
  background: currentColor;
  content: '';
  transform: translate(-50%, -50%);
}

.home-window__control--max::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border: 2px solid currentColor;
  content: '';
  transform: translate(-50%, -50%);
}

.home-window__control--close::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.home-window__control--close::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.home-window__body {
  min-width: 0;
  padding: 14px;
}

.home-window__body--main {
  position: relative;
  overflow: hidden;
  padding: 0;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--home-pink) 9%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, var(--home-blue) 9%, transparent) 1px, transparent 1px),
    color-mix(in srgb, var(--home-surface) 92%, var(--home-blue-soft));
  background-size:
    16px 16px,
    16px 16px,
    auto;
}

.home-profile {
  position: relative;
  min-height: 100%;
}

.home-profile__art {
  position: absolute;
  display: none;
  right: 0;
  bottom: -18px;
  left: 22%;
  height: calc(100% + 44px);
  background: var(--home-character-art-url, none) center bottom / contain no-repeat;
  filter:
    drop-shadow(8px 8px 0 color-mix(in srgb, var(--home-shadow) 72%, transparent))
    drop-shadow(-3px 0 0 color-mix(in srgb, var(--home-pink) 22%, transparent))
    drop-shadow(3px 0 0 color-mix(in srgb, var(--home-blue) 22%, transparent));
  opacity: 0;
  pointer-events: none;
  transition:
    opacity var(--home-theme-duration) ease,
    transform var(--home-theme-duration) ease,
    filter var(--home-theme-duration) ease;
}

:global(:root[data-theme='night'] .home-night-foreground::before),
:global(:root[data-theme='night'] .home-night-foreground::after) {
  position: absolute;
  inset: 0;
  background: inherit;
  content: '';
  opacity: 0;
  pointer-events: none;
}

:global(:root[data-theme='night'] .home-night-foreground::before) {
  clip-path: polygon(0 13%, 100% 11%, 100% 19%, 0 21%, 0 43%, 100% 40%, 100% 47%, 0 50%);
  filter: hue-rotate(70deg) saturate(1.4);
  mix-blend-mode: screen;
  transform: translate(calc(var(--home-pointer-x) * 7px + 2px), calc(var(--home-pointer-y) * -3px));
  animation: home-glitch-cyan 1800ms steps(2, end) infinite;
}

:global(:root[data-theme='night'] .home-night-foreground::after) {
  clip-path: polygon(0 27%, 100% 25%, 100% 31%, 0 34%, 0 66%, 100% 63%, 100% 70%, 0 72%);
  filter: hue-rotate(-45deg) saturate(1.35);
  mix-blend-mode: lighten;
  transform: translate(calc(var(--home-pointer-x) * -6px - 2px), calc(var(--home-pointer-y) * 3px));
  animation: home-glitch-pink 2200ms steps(2, end) infinite;
}

@keyframes home-glitch-cyan {
  0%,
  82%,
  100% {
    opacity: 0;
  }

  84%,
  88% {
    opacity: 0.34;
  }

  91% {
    opacity: 0.14;
  }
}

@keyframes home-glitch-pink {
  0%,
  74%,
  100% {
    opacity: 0;
  }

  76%,
  80% {
    opacity: 0.26;
  }

  83% {
    opacity: 0.12;
  }
}

.home-profile__copy {
  position: absolute;
  top: 28px;
  left: 28px;
  z-index: 2;
  display: grid;
  max-width: min(390px, 48%);
  gap: 10px;
  padding: 14px;
  border: 2px solid var(--home-border);
  background: var(--home-surface-soft);
  box-shadow: 4px 4px 0 color-mix(in srgb, var(--home-shadow) 72%, transparent);
}

.home-profile__command {
  margin: 0;
  color: var(--home-pink);
  font-family: var(--ns-font-decorative);
  font-size: 11px;
  font-weight: 950;
}

.home-profile__copy h1 {
  margin: 0;
  color: var(--home-ink);
  font-family: var(--ns-font-display);
  font-size: clamp(40px, 6vw, 74px);
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  text-shadow:
    2px 2px 0 var(--home-blue-soft),
    4px 4px 0 color-mix(in srgb, var(--home-pink) 22%, transparent);
}

:global(:root[data-theme='night'] .home-profile__copy h1) {
  text-shadow:
    2px 2px 0 rgba(94, 234, 255, 0.42),
    -2px 0 0 rgba(255, 95, 184, 0.32),
    0 0 12px rgba(94, 234, 255, 0.18);
}

.home-profile__copy p:last-child {
  margin: 0;
  color: var(--home-muted);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.7;
}

.home-link-list {
  display: grid;
  gap: 8px;
}

.home-link-list__item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
  min-height: 38px;
  padding: 0 9px;
  border: 2px solid var(--home-border);
  background: var(--home-surface);
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  text-decoration: none;
  box-shadow: 2px 2px 0 color-mix(in srgb, var(--home-shadow) 70%, transparent);
}

.home-link-list__item:hover,
.home-link-list__item:focus-visible {
  background: var(--home-blue-soft);
  outline: 0;
  transform: translate(-1px, -1px);
}

.home-link-list__item img {
  display: block;
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.home-memo {
  display: grid;
  gap: 8px;
  color: var(--home-muted);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
}

.home-memo strong {
  color: var(--home-pink);
  font-size: 11px;
}

.home-taskbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 8;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  padding: 5px 7px;
  border-top: 2px solid var(--home-border);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--home-surface) 88%, transparent), var(--home-pink-soft)),
    var(--home-surface);
}

.home-taskbar__start,
.home-taskbar__window,
.home-taskbar__clock {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  padding: 0 9px;
  border: 2px solid var(--home-border);
  background: var(--home-surface);
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  text-decoration: none;
  box-shadow:
    inset -2px -2px 0 color-mix(in srgb, var(--home-shadow) 42%, transparent),
    inset 2px 2px 0 color-mix(in srgb, #ffffff 88%, transparent);
}

.home-taskbar__start {
  flex: 0 0 auto;
  min-width: 104px;
  background: var(--home-pink-soft);
}

.home-taskbar__start-icon {
  width: 18px;
  height: 18px;
  color: var(--home-pink);
}

.home-taskbar__separator {
  flex: 0 0 auto;
  width: 2px;
  height: 30px;
  border-left: 2px solid color-mix(in srgb, var(--home-border) 48%, transparent);
  border-right: 2px solid color-mix(in srgb, #ffffff 70%, transparent);
}

.home-taskbar__windows {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.home-taskbar__window {
  flex: 1 1 0;
  max-width: 230px;
  justify-content: flex-start;
}

.home-taskbar__start:hover,
.home-taskbar__start:focus-visible,
.home-taskbar__window:hover,
.home-taskbar__window:focus-visible {
  background: var(--home-blue-soft);
  outline: 0;
}

.home-taskbar__window--active {
  background: var(--home-surface-soft);
  box-shadow:
    inset 2px 2px 0 color-mix(in srgb, var(--home-shadow) 54%, transparent),
    inset -2px -2px 0 color-mix(in srgb, #ffffff 70%, transparent);
}

.home-taskbar__dot {
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  border: 2px solid var(--home-border);
  background: var(--home-pink);
}

.home-taskbar__window:nth-child(even) .home-taskbar__dot {
  background: var(--home-blue);
}

.home-taskbar__window span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-taskbar__clock {
  flex: 0 0 auto;
  justify-content: center;
  min-width: 126px;
  background: var(--home-blue-soft);
  cursor: pointer;
}

.home-taskbar__mode {
  width: 16px;
  height: 16px;
  border: 2px solid var(--home-border);
  background: #ffd95f;
  box-shadow:
    0 -4px 0 -2px #ffd95f,
    0 4px 0 -2px #ffd95f,
    4px 0 0 -2px #ffd95f,
    -4px 0 0 -2px #ffd95f;
}

:global(:root[data-theme='night'] .home-taskbar__mode) {
  border-radius: 50%;
  background: var(--home-blue);
  box-shadow:
    0 0 0 2px rgba(94, 234, 255, 0.14),
    0 0 12px rgba(94, 234, 255, 0.3);
}

@media (max-width: 1080px) {
  .home-window--main {
    right: 24px;
    left: 132px;
  }

  .home-window--links,
  .home-window--note {
    display: none;
  }

  .home-profile__copy {
    max-width: min(360px, 52%);
  }
}

@media (max-width: 720px) {
  .home-page {
    overflow-y: auto;
  }

  .home-desktop {
    display: grid;
    gap: 14px;
    min-height: 100svh;
    padding: 14px 14px 58px;
  }

  .home-desktop__icons {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
    gap: 8px;
  }

  .home-desktop-icon {
    font-size: 11px;
  }

  .home-desktop-icon__image {
    width: 40px;
    height: 40px;
  }

  .home-window {
    position: relative;
    inset: auto;
    width: 100%;
  }

  .home-window--main {
    min-height: min(62svh, 520px);
  }

  .home-window--links {
    display: grid;
  }

  .home-day-foreground,
  .home-night-foreground {
    display: none;
  }

  .home-window--note {
    display: none;
  }

  .home-profile__art {
    display: block;
    left: 8%;
    opacity: 0.92;
  }

  :global(:root[data-theme='night'] .home-profile__art) {
    display: block;
    opacity: 0.92;
  }

  .home-profile__copy {
    top: 16px;
    left: 16px;
    max-width: calc(100% - 32px);
  }

  .home-taskbar__windows {
    display: none;
  }

  .home-taskbar__clock {
    min-width: 94px;
    font-size: 11px;
  }
}

@media (max-width: 440px) {
  .home-desktop__icons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-profile__copy h1 {
    font-size: 42px;
  }

  .home-taskbar__start {
    min-width: 88px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page *,
  .home-page *::before,
  .home-page *::after {
    animation: none !important;
    transition: none !important;
  }

  .home-night-foreground,
  .home-day-foreground,
  .home-profile__art {
    transform: none !important;
  }
}
</style>
