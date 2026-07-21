<template>
  <AppTopNav v-if="!isArmoireLocalApp" />
  <router-view />
  <AppTaskbar v-if="!isArmoireLocalApp" />
  <AppDialog :state="dialog.state" @close="dialog.close" />
</template>

<script setup lang="ts">
import AppTopNav from '@/components/AppTopNav.vue'
import AppTaskbar from '@/components/AppTaskbar.vue'
import AppDialog from '@/components/AppDialog.vue'
import { isArmoireLocalApp } from '@/config/features'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'
import { useDialog } from '@/composables/useDialog'

const { initLocale } = useLocale()
const { initThemeMode, setThemeMode } = useTheme()
const dialog = useDialog()

document.documentElement.toggleAttribute('data-armoire-local-app', isArmoireLocalApp)

initLocale()
if (isArmoireLocalApp) {
  setThemeMode('day')
}
initThemeMode()
</script>

<style>
:root[data-armoire-local-app] .ffxiv-tool-page--workspace {
  min-height: 100vh;
}

:root[data-armoire-local-app] .ffxiv-tool-workspace--wide {
  height: 100vh;
}

@media (min-width: 981px) {
  :root[data-armoire-local-app] .nsarmoire-section-rail {
    top: 0;
    height: 100vh;
  }
}

/* Leave room for the fixed global taskbar (44px + 2px border) */
.ns-page {
  padding-bottom: 46px;
}

.home-page,
.ffxiv-tool-page--workspace,
.about-page,
.silence-page,
.silence-group-page,
.silence-character-page {
  padding-bottom: 0;
}

/* Adjust full-viewport pages for nav (56px) + bottom taskbar (46px) */
:root:not([data-armoire-local-app]) .ffxiv-tool-page--workspace {
  min-height: calc(100vh - 102px) !important;
  overflow: hidden !important;
}

:root:not([data-armoire-local-app]) .ffxiv-tool-workspace--wide {
  height: calc(100vh - 102px) !important;
}

:root:not([data-armoire-local-app]) .nsarmoire-section-rail {
  min-height: calc(100vh - 102px) !important;
}

@media (min-width: 981px) {
  :root:not([data-armoire-local-app]) .nsarmoire-section-rail {
    height: calc(100vh - 102px) !important;
  }
}

:root[data-armoire-local-app] .ffxiv-tool-page--workspace {
  min-height: 100vh;
}

:root[data-armoire-local-app] .ffxiv-tool-workspace--wide {
  height: 100vh;
}

@media (min-width: 981px) {
  :root[data-armoire-local-app] .nsarmoire-section-rail {
    top: 0;
    height: 100vh;
  }
}

/* Silence full-viewport pages — override scoped min-height */
.silence-page {
  min-height: calc(100vh - 102px) !important;
  overflow: hidden !important;
}

.silence-group-page {
  min-height: calc(100vh - 102px) !important;
  overflow: hidden !important;
}

.silence-character-page {
  min-height: calc(100vh - 102px) !important;
  overflow: hidden !important;
}

/* About page */
.about-page {
  min-height: calc(100vh - 102px) !important;
  overflow: hidden !important;
}
</style>
