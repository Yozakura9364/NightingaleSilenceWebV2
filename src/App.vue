<template>
  <a href="#main-content" class="app-skip-link ns-sr-only ns-sr-only--focusable">
    {{ t(textKeys.skipToMainContent) }}
  </a>
  <AppOsTitleBar v-if="showTopNav" />
  <div id="main-content" :class="{ 'app-main-content--with-title-bar': showTopNav }">
    <router-view v-slot="{ Component }">
      <Transition name="app-window" mode="out-in">
        <component :is="Component" :key="routeTransitionKey" />
      </Transition>
    </router-view>
  </div>
  <AppTaskbar v-if="showTaskbar" />
  <AppDialog :state="dialog.state" @close="dialog.close" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppOsTitleBar from '@/components/AppOsTitleBar.vue'
import AppTaskbar from '@/components/AppTaskbar.vue'
import AppDialog from '@/components/AppDialog.vue'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'
import { useDialog } from '@/composables/useDialog'

const { initLocale, t } = useLocale()
const { initThemeMode } = useTheme()
const dialog = useDialog()
const route = useRoute()
const isHomePage = computed(() => route.name === 'home')
const showTopNav = computed(() => !isHomePage.value && route.meta.hideTopNav !== true)
const showTaskbar = computed(() => route.meta.showTaskbar === true)
const routeTransitionKey = computed(() => String(route.name ?? route.path))

// Hide page content from screen readers while dialog is open
const appRoot = document.getElementById('app')
watch(
  () => dialog.state.visible,
  (visible) => {
    if (appRoot) {
      if (visible) {
        appRoot.setAttribute('aria-hidden', 'true')
        appRoot.setAttribute('inert', '')
      } else {
        appRoot.removeAttribute('aria-hidden')
        appRoot.removeAttribute('inert')
      }
    }
  }
)

initLocale()
initThemeMode()
</script>

<style>
/* Page route transitions — removed */
.app-skip-link {
  position: absolute;
  top: -100%;
  left: 8px;
  z-index: 3000;
  padding: 8px 16px;
  background: var(--ns-color-surface-solid, #fff);
  border: 2px solid var(--ns-pixel-border, #000);
  font-family: var(--ns-font-ui);
  font-size: 14px;
  font-weight: 800;
}
.app-skip-link:focus {
  top: 8px;
}

.app-main-content--with-title-bar {
  --ns-app-chrome-height: 29px;
}

/* Full-viewport pages inherit the compact OS title bar only when it is rendered. */
:root .ffxiv-tool-page--workspace {
  min-height: calc(100vh - var(--ns-app-chrome-height, 0px)) !important;
  overflow: hidden !important;
}

:root .ffxiv-tool-workspace--wide {
  height: calc(100vh - var(--ns-app-chrome-height, 0px)) !important;
}

/* 窄屏：workspace 页面允许纵向滚动，高度自适应内容（对齐模板工作台 1080px 单列断点） */
@media (max-width: 1080px) {
  :root .ffxiv-tool-page--workspace {
    min-height: 0 !important;
    overflow: visible !important;
  }

  :root .ffxiv-tool-workspace--wide {
    height: auto !important;
  }
}

:root .nsarmoire-section-rail {
  min-height: calc(100vh - var(--ns-app-chrome-height, 0px)) !important;
}

@media (min-width: 981px) {
  :root .nsarmoire-section-rail {
    height: calc(100vh - var(--ns-app-chrome-height, 0px)) !important;
  }
}

/* Silence full-viewport pages — override scoped min-height */
.silence-page {
  min-height: calc(100vh - var(--ns-app-chrome-height, 0px)) !important;
  overflow: hidden !important;
}

.silence-group-page {
  min-height: calc(100vh - var(--ns-app-chrome-height, 0px)) !important;
  overflow: hidden !important;
}

.silence-character-page {
  min-height: calc(100vh - var(--ns-app-chrome-height, 0px)) !important;
  overflow: hidden !important;
}

/* About page */
.about-page {
  min-height: calc(100vh - var(--ns-app-chrome-height, 0px)) !important;
  overflow: hidden !important;
}
</style>
