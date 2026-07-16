<template>
  <AppTopNav v-if="!isArmoireLocalApp" />
  <router-view />
</template>

<script setup lang="ts">
import AppTopNav from '@/components/AppTopNav.vue'
import { isArmoireLocalApp } from '@/config/features'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'

const { initLocale } = useLocale()
const { initThemeMode, setThemeMode } = useTheme()

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
</style>
