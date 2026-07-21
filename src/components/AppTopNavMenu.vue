<template>
  <div class="app-top-nav__nav">
    <!-- 狒狒14工房 -->
    <div
      class="app-top-nav__dropdown-group"
      @mouseenter="openFfxivDropdown"
      @mouseleave="closeFfxivDropdown"
    >
      <RouterLink
        class="app-top-nav__nav-link"
        :class="{
          'app-top-nav__nav-link--active': isFfxivRoute,
          'app-top-nav__nav-link--parent': true
        }"
        :to="siteRoutes.ffxiv"
      >
        <span>{{ t(textKeys.ffxivWorkshop) }}</span>
        <span class="app-top-nav__nav-arrow" aria-hidden="true">&#9660;</span>
      </RouterLink>

      <div
        v-if="ffxivOpen"
        class="app-top-nav__dropdown"
        @mouseenter="cancelFfxivClose"
        @mouseleave="closeFfxivDropdown"
      >
        <RouterLink
          v-for="tool in ffxivTools"
          :key="tool.id"
          class="app-top-nav__dropdown-link"
          :class="{ 'app-top-nav__dropdown-link--active': isRouteUnder(tool.route) }"
          :to="tool.route"
        >
          <span
            class="app-top-nav__dropdown-icon"
            :style="toolIconStyle(toolIconMap[tool.id] ?? folderIcon)"
            aria-hidden="true"
          ></span>
          <span>{{ t(tool.titleKey) }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Silence -->
    <div
      v-if="isSilenceEnabled"
      class="app-top-nav__dropdown-group"
      @mouseenter="openSilenceDropdown"
      @mouseleave="closeSilenceDropdown"
    >
      <RouterLink
        class="app-top-nav__nav-link"
        :class="{
          'app-top-nav__nav-link--active': isSilenceRoute,
          'app-top-nav__nav-link--parent': true
        }"
        :to="siteRoutes.silence"
      >
        <span>{{ t(textKeys.silence) }}</span>
        <span class="app-top-nav__nav-arrow" aria-hidden="true">&#9660;</span>
      </RouterLink>

      <div
        v-if="silenceOpen"
        class="app-top-nav__dropdown"
        @mouseenter="cancelSilenceClose"
        @mouseleave="closeSilenceDropdown"
      >
        <RouterLink
          v-for="group in silenceGroups"
          :key="group.id"
          class="app-top-nav__dropdown-link"
          :class="{
            'app-top-nav__dropdown-link--active':
              route.path === group.route || route.path.startsWith(`${group.route}/`)
          }"
          :to="group.route"
        >
          <span
            class="app-top-nav__dropdown-icon"
            :style="toolIconStyle(groupIconMap[group.id] ?? imageIcon)"
            aria-hidden="true"
          ></span>
          <span>{{ t(groupMenuTitleKeyMap[group.id]) }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- 关于 -->
    <RouterLink
      class="app-top-nav__nav-link"
      :class="{ 'app-top-nav__nav-link--active': isAboutRoute }"
      :to="siteRoutes.about"
    >
      <span>{{ t(textKeys.about) }}</span>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, type CSSProperties } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import archiveIcon from '@/assets/icons/pixelarticons/archive.svg'
import avatarCircleIcon from '@/assets/icons/pixelarticons/avatar-circle.svg'
import folderIcon from '@/assets/icons/pixelarticons/folder.svg'
import imageIcon from '@/assets/icons/pixelarticons/image.svg'
import sparklesIcon from '@/assets/icons/pixelarticons/sparkles.svg'
import starIcon from '@/assets/icons/pixelarticons/star.svg'
import userIcon from '@/assets/icons/pixelarticons/user.svg'
import { isSilenceEnabled } from '@/config/features'
import { ffxivTools, silenceGroups, siteRoutes } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const { t } = useLocale()

const ffxivOpen = ref(false)
const silenceOpen = ref(false)
let ffxivTimer: ReturnType<typeof setTimeout> | null = null
let silenceTimer: ReturnType<typeof setTimeout> | null = null

const HOVER_DELAY = 120
const CLOSE_DELAY = 200

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
const groupMenuTitleKeyMap: Record<(typeof silenceGroups)[number]['id'], string> = {
  angel: textKeys.menuSilenceAngel,
  glitch: textKeys.menuSilenceGlitch
}

const isFfxivRoute = computed(
  () => route.path === siteRoutes.ffxiv || ffxivTools.some((tool) => isRouteUnder(tool.route))
)
const isSilenceRoute = computed(
  () =>
    isSilenceEnabled &&
    (route.path === siteRoutes.silence ||
      silenceGroups.some(
        (group) => route.path === group.route || route.path.startsWith(`${group.route}/`)
      ))
)
const isAboutRoute = computed(() => route.path === siteRoutes.about)

// FFXIV dropdown
function openFfxivDropdown() {
  if (ffxivTimer) clearTimeout(ffxivTimer)
  ffxivTimer = setTimeout(() => { ffxivOpen.value = true }, HOVER_DELAY)
}

function closeFfxivDropdown() {
  if (ffxivTimer) clearTimeout(ffxivTimer)
  ffxivTimer = setTimeout(() => { ffxivOpen.value = false }, CLOSE_DELAY)
}

function cancelFfxivClose() {
  if (ffxivTimer) clearTimeout(ffxivTimer)
  ffxivTimer = null
}

// Silence dropdown
function openSilenceDropdown() {
  if (silenceTimer) clearTimeout(silenceTimer)
  silenceTimer = setTimeout(() => { silenceOpen.value = true }, HOVER_DELAY)
}

function closeSilenceDropdown() {
  if (silenceTimer) clearTimeout(silenceTimer)
  silenceTimer = setTimeout(() => { silenceOpen.value = false }, CLOSE_DELAY)
}

function cancelSilenceClose() {
  if (silenceTimer) clearTimeout(silenceTimer)
  silenceTimer = null
}

function isRouteUnder(baseRoute: string): boolean {
  return route.path === baseRoute || route.path.startsWith(`${baseRoute}/`)
}

function toolIconStyle(icon: string): CSSProperties {
  return {
    '--app-top-nav-dropdown-icon-url': `url("${icon}")`
  } as CSSProperties
}

onBeforeUnmount(() => {
  if (ffxivTimer) clearTimeout(ffxivTimer)
  if (silenceTimer) clearTimeout(silenceTimer)
})
</script>
