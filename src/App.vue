<template>
  <a href="#main-content" class="app-skip-link ns-sr-only ns-sr-only--focusable">
    {{ t(textKeys.skipToMainContent) }}
  </a>
  <AppTopNav />
  <div id="main-content">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </div>
  <AppTaskbar v-if="isHomePage" />
  <AppDialog :state="dialog.state" @close="dialog.close" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppTopNav from '@/components/AppTopNav.vue'
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

/* Adjust full-viewport pages for the 56px top navigation and its 2px border. */
:root .ffxiv-tool-page--workspace {
  min-height: calc(100vh - 58px) !important;
  overflow: hidden !important;
}

:root .ffxiv-tool-workspace--wide {
  height: calc(100vh - 58px) !important;
}

:root .nsarmoire-section-rail {
  min-height: calc(100vh - 58px) !important;
}

@media (min-width: 981px) {
  :root .nsarmoire-section-rail {
    height: calc(100vh - 58px) !important;
  }
}

/* Silence full-viewport pages — override scoped min-height */
.silence-page {
  min-height: calc(100vh - 58px) !important;
  overflow: hidden !important;
}

.silence-group-page {
  min-height: calc(100vh - 58px) !important;
  overflow: hidden !important;
}

.silence-character-page {
  min-height: calc(100vh - 58px) !important;
  overflow: hidden !important;
}

/* About page */
.about-page {
  min-height: calc(100vh - 58px) !important;
  overflow: hidden !important;
}
</style>
