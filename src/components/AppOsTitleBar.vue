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
import blogMonoIcon from '@/assets/icons/site/blog-mono.svg'
import aboutMonoIcon from '@/assets/icons/site/about-mono.png'
import armoireMonoIcon from '@/assets/icons/site/armoire-mono.png'
import fashionCheckMonoIcon from '@/assets/icons/site/fashion-check-mono.png'
import ffxivWorkshopMonoIcon from '@/assets/icons/site/ffxiv-workshop-mono.png'
import glamourMonoIcon from '@/assets/icons/site/glamour-mono.png'
import itemCardMonoIcon from '@/assets/icons/site/item-card-mono.png'
import silenceAngelMonoIcon from '@/assets/icons/site/silence-angel-mono.png'
import silenceGlitchMonoIcon from '@/assets/icons/site/silence-glitch-mono.png'
import plateMonoIcon from '@/assets/icons/plate/portrait-mono.webp'
import { formatWindowTitle, siteMeta, siteRoutes } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const { messages, t } = useLocale()

// 左上角图标：进入对应页面后显示该页面的单色小标（与主页桌面图标一一对应）
const routeMonoIcons: { prefix: string; icon: string }[] = [
  { prefix: '/ffxiv/glamour', icon: glamourMonoIcon },
  { prefix: '/ffxiv/plate', icon: plateMonoIcon },
  { prefix: '/ffxiv/armoire', icon: armoireMonoIcon },
  { prefix: '/ffxiv/fashioncheck', icon: fashionCheckMonoIcon },
  { prefix: '/ffxiv/fashion-check', icon: fashionCheckMonoIcon },
  { prefix: '/ffxiv/item-card', icon: itemCardMonoIcon },
  { prefix: '/ffxiv', icon: ffxivWorkshopMonoIcon },
  { prefix: '/silence/angel', icon: silenceAngelMonoIcon },
  { prefix: '/silence/glitch', icon: silenceGlitchMonoIcon },
  { prefix: '/about', icon: aboutMonoIcon },
  { prefix: '/blog', icon: blogMonoIcon }
]

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
const activeRouteIcon = computed(
  () => routeMonoIcons.find((rule) => route.path.startsWith(rule.prefix))?.icon ?? homeIcon
)
const homeIconStyle = computed(
  () =>
    ({
      '--app-os-title-bar-icon-url': `url("${activeRouteIcon.value}")`
    }) as CSSProperties
)
const settingsIconStyle = {
  '--app-os-title-bar-icon-url': `url("${settingsIcon}")`
} as CSSProperties
</script>
