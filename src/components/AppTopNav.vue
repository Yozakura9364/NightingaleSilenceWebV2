<template>
  <header v-if="showNav" class="app-top-nav">
    <nav class="app-top-nav__inner" :aria-label="t(textKeys.primaryNavigation)">
      <RouterLink class="app-top-nav__brand" :to="siteRoutes.home">
        <span>{{ t(siteMeta.zhNameKey) }}</span>
        <span class="app-top-nav__brand-command" aria-hidden="true">
          {{ t(textKeys.homeCommand) }}
        </span>
      </RouterLink>

      <div ref="controlsRoot" class="app-top-nav__links">
        <div class="app-top-nav__menu">
          <button
            class="app-top-nav__menu-button"
            :class="{ 'app-top-nav__menu-button--active': isMenuRoute }"
            type="button"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            @click="toggleMenu"
            @keydown.esc="closeMenu"
          >
            <span>{{ t(textKeys.menu) }}</span>
            <span class="app-top-nav__menu-command" aria-hidden="true">
              {{ t(textKeys.menuCommand) }}
            </span>
          </button>

          <AppPixelWindow
            v-if="menuOpen"
            class="app-top-nav__window"
            :title="t(textKeys.menuTitle)"
            :close-label="t(textKeys.closeMenu)"
            role="menu"
            @close="closeMenu"
            @keydown.esc="closeMenu"
          >
            <div class="app-top-nav__launcher-tabs" :aria-label="t(textKeys.menuCategory)">
              <button
                v-for="section in menuSections"
                :key="section.id"
                class="app-top-nav__launcher-tab"
                :class="{ 'app-top-nav__launcher-tab--active': activeMenuSection === section.id }"
                type="button"
                @click="activeMenuSection = section.id"
                @mouseenter="activeMenuSection = section.id"
                @focus="activeMenuSection = section.id"
              >
                <span>{{ t(section.label) }}</span>
                <small>{{ t(section.status) }}</small>
              </button>
            </div>

            <section
              v-if="activeMenuSection === 'ffxiv'"
              class="app-top-nav__launcher-panel"
              :aria-label="t(textKeys.ffxivWorkshop)"
            >
              <div
                class="app-top-nav__window-children"
                :aria-label="`${t(textKeys.ffxivWorkshop)} ${t(textKeys.children)}`"
              >
                <RouterLink
                  v-for="tool in ffxivTools"
                  :key="tool.id"
                  class="app-top-nav__window-child"
                  :class="{ 'app-top-nav__window-child--active': route.path === tool.route }"
                  :to="tool.route"
                  role="menuitem"
                  @click="closeMenu"
                >
                  {{ t(tool.titleKey) }}
                </RouterLink>
              </div>
            </section>

            <section
              v-else-if="activeMenuSection === 'silence'"
              class="app-top-nav__launcher-panel"
              :aria-label="t(textKeys.silence)"
            >
              <RouterLink
                class="app-top-nav__window-link"
                :class="{ 'app-top-nav__window-link--active': route.path === siteRoutes.silence }"
                :to="siteRoutes.silence"
                role="menuitem"
                @click="closeMenu"
              >
                <span>{{ t(textKeys.silence) }}</span>
                <small>{{ t(textKeys.silenceCommand) }}</small>
              </RouterLink>

              <div
                class="app-top-nav__window-children"
                :aria-label="`${t(textKeys.silence)} ${t(textKeys.children)}`"
              >
                <RouterLink
                  v-for="group in silenceGroups"
                  :key="group.id"
                  class="app-top-nav__window-child"
                  :class="{ 'app-top-nav__window-child--active': route.path === group.route }"
                  :to="group.route"
                  role="menuitem"
                  @click="closeMenu"
                >
                  {{ t(group.titleKey) }}
                </RouterLink>
              </div>
            </section>

            <section v-else class="app-top-nav__launcher-panel" :aria-label="t(textKeys.about)">
              <RouterLink
                class="app-top-nav__window-link"
                :class="{ 'app-top-nav__window-link--active': route.path === siteRoutes.about }"
                :to="siteRoutes.about"
                role="menuitem"
                @click="closeMenu"
              >
                <span>{{ t(textKeys.about) }}</span>
                <small>{{ t(textKeys.aboutCommand) }}</small>
              </RouterLink>

              <RouterLink
                class="app-top-nav__window-link app-top-nav__window-link--home"
                :to="siteRoutes.home"
                role="menuitem"
                @click="closeMenu"
              >
                <span>{{ t(textKeys.home) }}</span>
                <small>{{ t(textKeys.homeCommand) }}</small>
              </RouterLink>
            </section>
          </AppPixelWindow>
        </div>

        <div class="app-top-nav__config">
          <button
            class="app-top-nav__config-button"
            type="button"
            :aria-expanded="configOpen"
            aria-haspopup="dialog"
            @click="toggleConfig"
            @keydown.esc="closeConfig"
          >
            <span>{{ t(textKeys.config) }}</span>
            <span class="app-top-nav__config-command" aria-hidden="true">
              {{ t(textKeys.configCommand) }}
            </span>
          </button>

          <AppPixelWindow
            v-if="configOpen"
            class="app-top-nav__window app-top-nav__window--config"
            :title="t(textKeys.configTitle)"
            :close-label="t(textKeys.closeConfig)"
            role="dialog"
            :aria-label="t(textKeys.config)"
            @close="closeConfig"
            @keydown.esc="closeConfig"
          >
            <section class="app-top-nav__launcher-panel" :aria-label="t(textKeys.themeMode)">
              <div
                class="app-top-nav__theme-toggle"
                role="group"
                :aria-label="t(textKeys.themeMode)"
              >
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
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useRoute } from 'vue-router'
import themeMoonIcon from '@/assets/icons/moon.svg'
import themeSunIcon from '@/assets/icons/sun-alt.svg'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import {
  ffxivTools,
  silenceGroups,
  siteLocaleOptions,
  siteMeta,
  siteRoutes,
  textKeys
} from '@/config/site'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'

type MenuSectionId = 'ffxiv' | 'silence' | 'about'

const route = useRoute()
const { current: locale, setLocale, t } = useLocale()
const { current: themeMode, setThemeMode } = useTheme()
const menuOpen = ref(false)
const configOpen = ref(false)
const controlsRoot = ref<HTMLElement | null>(null)
const activeMenuSection = ref<MenuSectionId>('ffxiv')
const showNav = computed(() => route.path !== siteRoutes.home && route.meta.hideTopNav !== true)
const isFfxivRoute = computed(
  () => route.path === siteRoutes.ffxiv || ffxivTools.some((tool) => route.path === tool.route)
)
const isSilenceRoute = computed(
  () =>
    route.path === siteRoutes.silence ||
    silenceGroups.some((group) => route.path === group.route || route.path.startsWith(`${group.route}/`))
)
const isMenuRoute = computed(
  () => isFfxivRoute.value || isSilenceRoute.value || route.path === siteRoutes.about
)
const menuSections: Array<{ id: MenuSectionId; label: string; status: string }> = [
  { id: 'ffxiv', label: textKeys.ffxivWorkshop, status: textKeys.statusOpen },
  { id: 'silence', label: textKeys.silence, status: textKeys.statusOpen },
  { id: 'about', label: textKeys.about, status: textKeys.aboutCommand }
]
const themeSunIconStyle = {
  '--app-theme-icon-url': `url("${themeSunIcon}")`
} as CSSProperties
const themeMoonIconStyle = {
  '--app-theme-icon-url': `url("${themeMoonIcon}")`
} as CSSProperties

function closeMenu() {
  menuOpen.value = false
}

function closeConfig() {
  configOpen.value = false
}

function closePopovers() {
  closeMenu()
  closeConfig()
}

function toggleMenu() {
  if (!menuOpen.value) {
    closeConfig()
    activeMenuSection.value = getMenuSectionForRoute()
    menuOpen.value = true
    return
  }

  closeMenu()
}

function toggleConfig() {
  if (!configOpen.value) {
    closeMenu()
    configOpen.value = true
    return
  }

  closeConfig()
}

function getMenuSectionForRoute(): MenuSectionId {
  if (isFfxivRoute.value) {
    return 'ffxiv'
  }

  if (isSilenceRoute.value) {
    return 'silence'
  }

  if (route.path === siteRoutes.about) {
    return 'about'
  }

  return 'ffxiv'
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!menuOpen.value && !configOpen.value) {
    return
  }

  const target = event.target
  if (target instanceof Node && controlsRoot.value?.contains(target)) {
    return
  }

  closePopovers()
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})

watch(() => route.fullPath, closePopovers)
</script>

<style scoped>
.app-top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 2px solid var(--ns-pixel-border);
  background: var(--ns-top-nav-bg);
  font-family: var(--ns-font-decorative);
  box-shadow: var(--ns-pixel-nav-shadow);
}

.app-top-nav__inner {
  display: flex;
  min-height: 56px;
  width: min(var(--ns-content-width), calc(100vw - 32px));
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 0 auto;
}

.app-top-nav__brand,
.app-top-nav__menu-button,
.app-top-nav__config-button {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  border-radius: 0;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.app-top-nav__brand {
  color: var(--ns-color-text);
  text-decoration: none;
}

.app-top-nav__links {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  overflow: visible;
}

.app-top-nav__menu {
  position: relative;
}

.app-top-nav__config {
  position: relative;
}

.app-top-nav__brand,
.app-top-nav__menu-button,
.app-top-nav__config-button {
  gap: 6px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  color: var(--ns-color-text);
  box-shadow: var(--ns-pixel-button-shadow);
  cursor: pointer;
}

.app-top-nav__menu-button,
.app-top-nav__config-button {
  width: var(--ns-top-nav-control-width);
  justify-content: space-between;
}

.app-top-nav__brand:hover,
.app-top-nav__menu-button:hover,
.app-top-nav__menu-button--active,
.app-top-nav__menu-button[aria-expanded='true'],
.app-top-nav__config-button:hover,
.app-top-nav__config-button[aria-expanded='true'] {
  background: var(--ns-pixel-hover-surface);
  color: var(--ns-color-text);
  transform: translate(-1px, -1px);
  box-shadow: var(--ns-pixel-button-shadow-hover);
}

.app-top-nav__brand-command,
.app-top-nav__menu-command,
.app-top-nav__config-command {
  padding: 3px 5px;
  border-left: 1px solid var(--ns-pixel-divider);
  color: var(--ns-color-text-muted);
  font-size: 10px;
  letter-spacing: 0.02em;
}

.app-top-nav__window {
  position: absolute;
  top: calc(100% + var(--ns-top-nav-popup-gap));
  right: 0;
  z-index: 30;
  width: min(var(--ns-top-nav-menu-width), calc(100vw - 28px));
}

.app-top-nav__window--config {
  width: min(var(--ns-top-nav-config-width), calc(100vw - 28px));
}

.app-top-nav__launcher-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.app-top-nav__launcher-tab {
  display: grid;
  min-width: 0;
  min-height: 52px;
  place-items: center;
  gap: 3px;
  padding: 6px 8px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface);
  color: var(--ns-color-text-muted);
  box-shadow: var(--ns-pixel-soft-shadow);
  cursor: pointer;
}

.app-top-nav__launcher-tab span {
  max-width: 100%;
  color: currentColor;
  font-size: 15px;
  font-weight: 950;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-top-nav__launcher-tab small {
  color: var(--ns-pixel-muted);
  font-size: 10px;
  font-weight: 950;
  letter-spacing: 0.04em;
}

.app-top-nav__launcher-tab:hover,
.app-top-nav__launcher-tab--active {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-accent-strong);
}

.app-top-nav__launcher-panel {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 10px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-pixel-panel-grid-bg);
}

.app-top-nav__window-link,
.app-top-nav__window-child {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 38px;
  padding: 0 10px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface);
  color: var(--ns-color-text);
  font-size: 13px;
  font-weight: 900;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: var(--ns-pixel-soft-shadow);
}

.app-top-nav__window-link span,
.app-top-nav__window-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-top-nav__window-link small {
  color: var(--ns-color-text-muted);
  font-size: 10px;
  font-weight: 950;
  letter-spacing: 0.02em;
}

.app-top-nav__window-link--home {
  background: var(--ns-pixel-warm-surface);
}

.app-top-nav__window-link:hover,
.app-top-nav__window-link--active,
.app-top-nav__window-child:hover,
.app-top-nav__window-child--active {
  background: var(--ns-pixel-hover-surface);
  color: var(--ns-color-accent-strong);
}

.app-top-nav__window-link--disabled,
.app-top-nav__window-child--disabled {
  color: var(--ns-pixel-disabled);
  cursor: not-allowed;
}

.app-top-nav__window-children {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.app-top-nav__window-children--single {
  grid-template-columns: minmax(0, 1fr);
}

.app-top-nav__window-child {
  justify-content: center;
  min-height: 34px;
  background: var(--ns-pixel-pink-surface);
  cursor: pointer;
}

.app-top-nav__window-child:disabled {
  cursor: not-allowed;
}

.app-top-nav__theme-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.app-top-nav__locale-toggle {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.app-top-nav__theme-option,
.app-top-nav__locale-option {
  position: relative;
  display: grid;
  min-width: 0;
  place-items: center;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface);
  color: var(--ns-color-text);
  box-shadow: var(--ns-pixel-soft-shadow);
  cursor: pointer;
  overflow: hidden;
  transition:
    background var(--ns-transition-fast),
    color var(--ns-transition-fast),
    transform var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.app-top-nav__theme-option {
  min-height: 76px;
  gap: 6px;
  padding: 9px 8px 7px;
}

.app-top-nav__locale-option {
  min-height: 42px;
  gap: 2px;
  padding: 5px 4px 4px;
}

.app-top-nav__theme-option::before,
.app-top-nav__locale-option::before {
  position: absolute;
  inset: 5px;
  border: 1px solid transparent;
  content: '';
  pointer-events: none;
}

.app-top-nav__theme-option:hover,
.app-top-nav__locale-option:hover {
  background: var(--ns-pixel-hover-surface);
  color: var(--ns-color-accent-strong);
  transform: translate(-1px, -1px);
  box-shadow: var(--ns-pixel-button-shadow-hover);
}

.app-top-nav__theme-option--active,
.app-top-nav__locale-option--active {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-accent-strong);
  animation: app-theme-option-pop 240ms steps(2, end);
}

.app-top-nav__theme-option--active::before,
.app-top-nav__locale-option--active::before {
  border-color: currentColor;
  animation: app-theme-scan 680ms steps(4, end);
}

.app-top-nav__theme-icon {
  display: block;
  width: 38px;
  height: 38px;
  background: currentColor;
  color: currentColor;
  image-rendering: pixelated;
  mask: var(--app-theme-icon-url) center / contain no-repeat;
  -webkit-mask: var(--app-theme-icon-url) center / contain no-repeat;
}

.app-top-nav__theme-option--day.app-top-nav__theme-option--active .app-top-nav__theme-icon--day {
  animation: app-theme-sun-bounce 820ms steps(4, end) infinite;
}

.app-top-nav__theme-option--night.app-top-nav__theme-option--active
  .app-top-nav__theme-icon--night {
  animation: app-theme-moon-glow 900ms steps(2, end) infinite;
}

.app-top-nav__theme-caption {
  color: var(--ns-color-text-muted);
  font-size: 10px;
  font-weight: 950;
  letter-spacing: 0.04em;
  line-height: 1;
}

.app-top-nav__locale-option span {
  color: currentColor;
  font-size: 14px;
  font-weight: 950;
  line-height: 1;
}

.app-top-nav__locale-option small {
  color: var(--ns-color-text-muted);
  font-size: 9px;
  font-weight: 950;
  letter-spacing: 0.04em;
  line-height: 1;
}

.app-top-nav__theme-option--active .app-top-nav__theme-caption,
.app-top-nav__locale-option--active small {
  color: currentColor;
}

@keyframes app-theme-option-pop {
  0% {
    transform: translate(0, 0) scale(1);
  }

  45% {
    transform: translate(-1px, -2px) scale(1.04);
  }

  100% {
    transform: translate(0, 0) scale(1);
  }
}

@keyframes app-theme-scan {
  0% {
    opacity: 0;
    transform: translateY(-2px);
  }

  45% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateY(2px);
  }
}

@keyframes app-theme-sun-bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-2px);
  }
}

@keyframes app-theme-moon-glow {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.35;
  }
}

@media (max-width: 640px) {
  .app-top-nav__inner {
    width: min(var(--ns-content-width), calc(100vw - 24px));
    gap: 10px;
  }

  .app-top-nav__brand {
    flex: 0 0 auto;
  }

  .app-top-nav__window {
    position: fixed;
    top: 58px;
    right: 12px;
    left: 12px;
    width: auto;
  }

  .app-top-nav__launcher-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .app-top-nav__window-children {
    grid-template-columns: 1fr;
    padding-left: 0;
  }
}

@media (max-width: 420px) {
  .app-top-nav__brand-command,
  .app-top-nav__menu-command,
  .app-top-nav__config-command {
    display: none;
  }

  .app-top-nav__menu-button,
  .app-top-nav__config-button {
    width: 58px;
    justify-content: center;
  }
}
</style>
