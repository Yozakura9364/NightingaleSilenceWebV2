<template>
  <header class="app-os-title-bar">
    <RouterLink
      class="app-os-title-bar__home"
      :to="siteRoutes.home"
      :aria-label="t(textKeys.home)"
      :title="t(textKeys.home)"
    >
      <span class="app-os-title-bar__icon" :style="homeIconStyle" aria-hidden="true"></span>
      <span class="app-os-title-bar__label">{{ windowTitle }}</span>
    </RouterLink>

    <RouterLink
      class="app-os-title-bar__settings"
      :class="{ 'app-os-title-bar__settings--active': isSettingsPage }"
      :to="settingsActionRoute"
      :aria-label="settingsActionLabel"
      :title="settingsActionLabel"
    >
      <span class="app-os-title-bar__icon" :style="settingsIconStyle" aria-hidden="true"></span>
    </RouterLink>
  </header>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import homeIcon from '@/assets/icons/pixelarticons/home.svg'
import settingsIcon from '@/assets/icons/pixelarticons/settings-2.svg'
import { formatWindowTitle, siteMeta, siteRoutes } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const { messages, t } = useLocale()

const isSettingsPage = computed(() => route.path === siteRoutes.settings)
const settingsActionRoute = computed(() =>
  isSettingsPage.value ? siteRoutes.home : siteRoutes.settings
)
const settingsActionLabel = computed(() =>
  t(isSettingsPage.value ? textKeys.home : textKeys.config)
)
const siteName = computed(() => t(siteMeta.zhNameKey))
const pageTitle = computed(() => {
  const routeTitle = route.meta.titleKey ?? route.meta.title
  if (typeof routeTitle !== 'string' || routeTitle === siteMeta.zhNameKey) {
    return ''
  }

  return routeTitle in messages.value ? t(routeTitle) : routeTitle
})
const windowTitle = computed(() => formatWindowTitle(siteName.value, pageTitle.value))
const homeIconStyle = {
  '--app-os-title-bar-icon-url': `url("${homeIcon}")`
} as CSSProperties
const settingsIconStyle = {
  '--app-os-title-bar-icon-url': `url("${settingsIcon}")`
} as CSSProperties
</script>
