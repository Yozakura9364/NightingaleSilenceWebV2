<template>
  <div class="app-top-nav__menu">
    <button
      class="app-top-nav__menu-button"
      :class="{ 'app-top-nav__menu-button--active': isMenuRoute }"
      type="button"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="emit('toggle')"
      @keydown.esc="emit('close')"
    >
      <span>{{ t(textKeys.menu) }}</span>
      <span class="app-top-nav__menu-command" aria-hidden="true">
        {{ t(textKeys.menuCommand) }}
      </span>
    </button>

    <AppPixelWindow
      v-if="open"
      class="app-top-nav__window"
      :title="t(textKeys.menuTitle)"
      :close-label="t(textKeys.closeMenu)"
      role="menu"
      @close="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div class="app-top-nav__launcher-tabs" :aria-label="t(textKeys.menuCategory)">
        <RouterLink
          class="app-top-nav__window-link app-top-nav__window-link--home"
          :class="{ 'app-top-nav__window-link--active': route.path === siteRoutes.home }"
          :to="siteRoutes.home"
          role="menuitem"
          @click="emit('close')"
        >
          <span class="app-top-nav__window-link-main">
            <span
              class="app-top-nav__icon"
              :style="iconStyle(homeIcon)"
              aria-hidden="true"
            ></span>
            <span class="app-top-nav__window-label">{{ t(textKeys.home) }}</span>
          </span>
          <small>{{ t(textKeys.homeCommand) }}</small>
        </RouterLink>

        <RouterLink
          class="app-top-nav__window-link app-top-nav__window-link--section"
          :class="{
            'app-top-nav__window-link--active': isFfxivRoute,
            'app-top-nav__window-link--expanded': activeMenuSection === 'ffxiv'
          }"
          :to="siteRoutes.ffxiv"
          role="menuitem"
          @mouseenter="activeMenuSection = 'ffxiv'"
          @focus="activeMenuSection = 'ffxiv'"
          @click="emit('close')"
        >
          <span class="app-top-nav__window-link-main">
            <span
              class="app-top-nav__icon"
              :style="iconStyle(folderIcon)"
              aria-hidden="true"
            ></span>
            <span class="app-top-nav__window-label">{{ t(textKeys.ffxivWorkshop) }}</span>
          </span>
          <small>{{ t(textKeys.statusOpen) }}</small>
        </RouterLink>

        <RouterLink
          v-for="tool in ffxivTools"
          v-show="activeMenuSection === 'ffxiv'"
          :key="tool.id"
          class="app-top-nav__window-child"
          :class="{ 'app-top-nav__window-child--active': isRouteUnder(tool.route) }"
          :to="tool.route"
          role="menuitem"
          @click="emit('close')"
        >
          <span class="app-top-nav__window-child-main">
            <span
              class="app-top-nav__icon app-top-nav__icon--child"
              :style="iconStyle(toolIconMap[tool.id] ?? folderIcon)"
              aria-hidden="true"
            ></span>
            <span class="app-top-nav__window-label">{{ t(tool.titleKey) }}</span>
          </span>
        </RouterLink>

        <RouterLink
          class="app-top-nav__window-link app-top-nav__window-link--section"
          :class="{
            'app-top-nav__window-link--active': isSilenceRoute,
            'app-top-nav__window-link--expanded': activeMenuSection === 'silence'
          }"
          :to="siteRoutes.silence"
          role="menuitem"
          @mouseenter="activeMenuSection = 'silence'"
          @focus="activeMenuSection = 'silence'"
          @click="emit('close')"
        >
          <span class="app-top-nav__window-link-main">
            <span
              class="app-top-nav__icon"
              :style="iconStyle(imageIcon)"
              aria-hidden="true"
            ></span>
            <span class="app-top-nav__window-label">{{ t(textKeys.silence) }}</span>
          </span>
          <small>{{ t(textKeys.silenceCommand) }}</small>
        </RouterLink>

        <RouterLink
          v-for="group in silenceGroups"
          v-show="activeMenuSection === 'silence'"
          :key="group.id"
          class="app-top-nav__window-child"
          :class="{ 'app-top-nav__window-child--active': route.path === group.route }"
          :to="group.route"
          role="menuitem"
          @click="emit('close')"
        >
          <span class="app-top-nav__window-child-main">
            <span
              class="app-top-nav__icon app-top-nav__icon--child"
              :style="iconStyle(groupIconMap[group.id] ?? imageIcon)"
              aria-hidden="true"
            ></span>
            <span class="app-top-nav__window-label">{{ t(group.titleKey) }}</span>
          </span>
        </RouterLink>

        <RouterLink
          class="app-top-nav__window-link"
          :class="{ 'app-top-nav__window-link--active': route.path === siteRoutes.about }"
          :to="siteRoutes.about"
          role="menuitem"
          @click="emit('close')"
        >
          <span class="app-top-nav__window-link-main">
            <span
              class="app-top-nav__icon"
              :style="iconStyle(starIcon)"
              aria-hidden="true"
            ></span>
            <span class="app-top-nav__window-label">{{ t(textKeys.about) }}</span>
          </span>
          <small>{{ t(textKeys.aboutCommand) }}</small>
        </RouterLink>
      </div>
    </AppPixelWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type CSSProperties } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import archiveIcon from '@/assets/icons/pixelarticons/archive.svg'
import avatarCircleIcon from '@/assets/icons/pixelarticons/avatar-circle.svg'
import folderIcon from '@/assets/icons/pixelarticons/folder.svg'
import homeIcon from '@/assets/icons/pixelarticons/home.svg'
import imageIcon from '@/assets/icons/pixelarticons/image.svg'
import sparklesIcon from '@/assets/icons/pixelarticons/sparkles.svg'
import starIcon from '@/assets/icons/pixelarticons/star.svg'
import userIcon from '@/assets/icons/pixelarticons/user.svg'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { ffxivTools, silenceGroups, siteRoutes } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

type MenuSectionId = 'ffxiv' | 'silence' | 'about'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  toggle: []
  close: []
}>()

const route = useRoute()
const { t } = useLocale()
const activeMenuSection = ref<MenuSectionId>('ffxiv')

const isFfxivRoute = computed(
  () => route.path === siteRoutes.ffxiv || ffxivTools.some((tool) => isRouteUnder(tool.route))
)
const isSilenceRoute = computed(
  () =>
    route.path === siteRoutes.silence ||
    silenceGroups.some(
      (group) => route.path === group.route || route.path.startsWith(`${group.route}/`)
    )
)
const isMenuRoute = computed(
  () => isFfxivRoute.value || isSilenceRoute.value || route.path === siteRoutes.about
)
const toolIconMap: Record<string, string> = {
  itemCard: imageIcon,
  glamour: sparklesIcon,
  plate: avatarCircleIcon,
  armoire: archiveIcon
}
const groupIconMap: Record<string, string> = {
  angel: userIcon,
  glitch: starIcon
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      activeMenuSection.value = getMenuSectionForRoute()
    }
  },
  { immediate: true }
)

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

function isRouteUnder(baseRoute: string): boolean {
  return route.path === baseRoute || route.path.startsWith(`${baseRoute}/`)
}

function iconStyle(icon: string): CSSProperties {
  return {
    '--app-top-nav-icon-url': `url("${icon}")`
  } as CSSProperties
}
</script>
