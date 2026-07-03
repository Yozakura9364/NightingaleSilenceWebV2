<template>
  <header v-if="showNav" class="app-top-nav">
    <nav class="app-top-nav__inner" aria-label="Site navigation">
      <RouterLink class="app-top-nav__brand" :to="siteRoutes.home">
        <span>{{ siteMeta.zhName }}</span>
        <span class="app-top-nav__brand-command" aria-hidden="true">
          {{ siteLabels.homeCommand }}
        </span>
      </RouterLink>

      <div ref="controlsRoot" class="app-top-nav__links">
        <div class="app-top-nav__menu">
          <button
            class="app-top-nav__menu-button"
            :class="{ 'app-top-nav__menu-button--active': isFfxivRoute }"
            type="button"
            :aria-expanded="menuOpen"
            aria-haspopup="true"
            @click="toggleMenu"
            @keydown.esc="closeMenu"
          >
            <span>{{ siteLabels.menu }}</span>
            <span class="app-top-nav__menu-command" aria-hidden="true">
              {{ siteLabels.menuCommand }}
            </span>
          </button>

          <AppPixelWindow
            v-if="menuOpen"
            class="app-top-nav__window"
            title="MENU.EXE"
            close-label="关闭菜单"
            role="menu"
            @close="closeMenu"
            @keydown.esc="closeMenu"
          >
            <div class="app-top-nav__launcher-tabs" aria-label="菜单分类">
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
                <span>{{ section.label }}</span>
                <small>{{ section.status }}</small>
              </button>
            </div>

            <section
              v-if="activeMenuSection === 'ffxiv'"
              class="app-top-nav__launcher-panel"
              :aria-label="siteLabels.ffxivWorkshop"
            >
              <div
                class="app-top-nav__window-children"
                :aria-label="`${siteLabels.ffxivWorkshop}子页面`"
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
                  {{ tool.title }}
                </RouterLink>
              </div>
            </section>

            <section
              v-else-if="activeMenuSection === 'silence'"
              class="app-top-nav__launcher-panel"
              aria-label="Silence"
            >
              <div
                class="app-top-nav__window-link app-top-nav__window-link--disabled"
                role="menuitem"
                aria-disabled="true"
              >
                <span>OC</span>
                <small>WIP</small>
              </div>

              <div
                class="app-top-nav__window-children app-top-nav__window-children--single"
                aria-label="OC子页面"
              >
                <button
                  class="app-top-nav__window-child app-top-nav__window-child--disabled"
                  type="button"
                  disabled
                >
                  Silence
                </button>
              </div>
            </section>

            <section v-else class="app-top-nav__launcher-panel" :aria-label="siteLabels.about">
              <RouterLink
                class="app-top-nav__window-link"
                :class="{ 'app-top-nav__window-link--active': route.path === siteRoutes.about }"
                :to="siteRoutes.about"
                role="menuitem"
                @click="closeMenu"
              >
                <span>{{ siteLabels.about }}</span>
                <small>{{ siteLabels.aboutCommand }}</small>
              </RouterLink>

              <RouterLink
                class="app-top-nav__window-link app-top-nav__window-link--home"
                :to="siteRoutes.home"
                role="menuitem"
                @click="closeMenu"
              >
                <span>{{ siteLabels.home }}</span>
                <small>HOME</small>
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
            <span>{{ siteLabels.config }}</span>
            <span class="app-top-nav__config-command" aria-hidden="true">
              {{ siteLabels.configCommand }}
            </span>
          </button>

          <AppPixelWindow
            v-if="configOpen"
            class="app-top-nav__window app-top-nav__window--config"
            title="CONFIG.EXE"
            close-label="关闭设置"
            role="dialog"
            :aria-label="siteLabels.config"
            @close="closeConfig"
            @keydown.esc="closeConfig"
          >
            <section class="app-top-nav__launcher-panel" :aria-label="siteLabels.themeMode">
              <div class="app-top-nav__setting-title">
                <span>{{ siteLabels.themeMode }}</span>
                <small>{{ activeThemeCommand }}</small>
              </div>

              <div
                class="app-top-nav__theme-toggle"
                role="group"
                :aria-label="siteLabels.themeMode"
              >
                <button
                  class="app-top-nav__theme-option app-top-nav__theme-option--day"
                  :class="{ 'app-top-nav__theme-option--active': themeMode === 'day' }"
                  type="button"
                  :aria-pressed="themeMode === 'day'"
                  :aria-label="siteLabels.day"
                  @click="setThemeMode('day')"
                >
                  <span
                    class="app-top-nav__theme-icon app-top-nav__theme-icon--day"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" focusable="false">
                      <rect x="11" y="1" width="2" height="4" />
                      <rect x="11" y="19" width="2" height="4" />
                      <rect x="1" y="11" width="4" height="2" />
                      <rect x="19" y="11" width="4" height="2" />
                      <rect x="5" y="5" width="2" height="2" />
                      <rect x="17" y="5" width="2" height="2" />
                      <rect x="5" y="17" width="2" height="2" />
                      <rect x="17" y="17" width="2" height="2" />
                      <rect x="8" y="8" width="8" height="8" />
                    </svg>
                  </span>
                  <span class="app-top-nav__theme-caption" aria-hidden="true">
                    {{ siteLabels.dayCommand }}
                  </span>
                </button>
                <button
                  class="app-top-nav__theme-option app-top-nav__theme-option--night"
                  :class="{ 'app-top-nav__theme-option--active': themeMode === 'night' }"
                  type="button"
                  :aria-pressed="themeMode === 'night'"
                  :aria-label="siteLabels.night"
                  @click="setThemeMode('night')"
                >
                  <span
                    class="app-top-nav__theme-icon app-top-nav__theme-icon--night"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" focusable="false">
                      <rect x="10" y="3" width="5" height="2" />
                      <rect x="8" y="5" width="7" height="2" />
                      <rect x="7" y="7" width="6" height="2" />
                      <rect x="6" y="9" width="6" height="2" />
                      <rect x="6" y="11" width="6" height="2" />
                      <rect x="7" y="13" width="6" height="2" />
                      <rect x="8" y="15" width="7" height="2" />
                      <rect x="10" y="17" width="5" height="2" />
                      <rect class="app-top-nav__theme-star" x="18" y="4" width="2" height="2" />
                      <rect class="app-top-nav__theme-star" x="20" y="9" width="1" height="1" />
                      <rect class="app-top-nav__theme-star" x="17" y="14" width="2" height="2" />
                    </svg>
                  </span>
                  <span class="app-top-nav__theme-caption" aria-hidden="true">
                    {{ siteLabels.nightCommand }}
                  </span>
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { ffxivTools, siteLabels, siteMeta, siteRoutes } from '@/config/site'
import { useTheme } from '@/stores/theme'

type MenuSectionId = 'ffxiv' | 'silence' | 'about'

const route = useRoute()
const { current: themeMode, setThemeMode } = useTheme()
const menuOpen = ref(false)
const configOpen = ref(false)
const controlsRoot = ref<HTMLElement | null>(null)
const activeMenuSection = ref<MenuSectionId>('ffxiv')
const showNav = computed(() => route.path !== siteRoutes.home && route.meta.hideTopNav !== true)
const isFfxivRoute = computed(
  () => route.path === siteRoutes.ffxiv || ffxivTools.some((tool) => route.path === tool.route)
)
const menuSections: Array<{ id: MenuSectionId; label: string; status: string }> = [
  { id: 'ffxiv', label: siteLabels.ffxivWorkshop, status: 'OPEN' },
  { id: 'silence', label: 'Silence', status: 'WIP' },
  { id: 'about', label: siteLabels.about, status: siteLabels.aboutCommand }
]
const activeThemeCommand = computed(() =>
  themeMode.value === 'night' ? siteLabels.nightCommand : siteLabels.dayCommand
)

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
  width: 104px;
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
  top: calc(100% + 12px);
  right: 0;
  z-index: 30;
  width: min(460px, calc(100vw - 28px));
}

.app-top-nav__window--config {
  width: min(320px, calc(100vw - 28px));
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

.app-top-nav__setting-title {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--ns-color-text);
  font-size: 13px;
  font-weight: 950;
}

.app-top-nav__setting-title small {
  color: var(--ns-color-text-muted);
  font-size: 10px;
  font-weight: 950;
  letter-spacing: 0.02em;
}

.app-top-nav__theme-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.app-top-nav__theme-option {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 76px;
  place-items: center;
  gap: 6px;
  padding: 9px 8px 7px;
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

.app-top-nav__theme-option::before {
  position: absolute;
  inset: 5px;
  border: 1px solid transparent;
  content: '';
  pointer-events: none;
}

.app-top-nav__theme-option:hover {
  background: var(--ns-pixel-hover-surface);
  color: var(--ns-color-accent-strong);
  transform: translate(-1px, -1px);
  box-shadow: var(--ns-pixel-button-shadow-hover);
}

.app-top-nav__theme-option--active {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-accent-strong);
  animation: app-theme-option-pop 240ms steps(2, end);
}

.app-top-nav__theme-option--active::before {
  border-color: currentColor;
  animation: app-theme-scan 680ms steps(4, end);
}

.app-top-nav__theme-icon {
  display: block;
  width: 34px;
  height: 34px;
  color: currentColor;
  image-rendering: pixelated;
}

.app-top-nav__theme-icon svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: currentColor;
  shape-rendering: crispEdges;
}

.app-top-nav__theme-option--day.app-top-nav__theme-option--active .app-top-nav__theme-icon--day {
  animation: app-theme-sun-bounce 820ms steps(4, end) infinite;
}

.app-top-nav__theme-option--night.app-top-nav__theme-option--active .app-top-nav__theme-star {
  animation: app-theme-star-blink 900ms steps(2, end) infinite;
}

.app-top-nav__theme-caption {
  color: var(--ns-color-text-muted);
  font-size: 10px;
  font-weight: 950;
  letter-spacing: 0.04em;
  line-height: 1;
}

.app-top-nav__theme-option--active .app-top-nav__theme-caption {
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

@keyframes app-theme-star-blink {
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
