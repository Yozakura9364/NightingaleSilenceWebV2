<template>
  <div class="app-top-nav__nav">
    <!-- 狒狒14工房 -->
    <div
      class="app-top-nav__dropdown-group"
      @mouseenter="openFfxivDropdown"
      @mouseleave="scheduleCloseFfxiv"
      @focusin="onFfxivFocusIn"
    >
      <RouterLink
        class="app-top-nav__nav-link"
        :class="{
          'app-top-nav__nav-link--active': isFfxivRoute,
          'app-top-nav__nav-link--parent': true
        }"
        :to="siteRoutes.ffxiv"
        :aria-haspopup="true"
        :aria-expanded="ffxivOpen"
        @keydown.enter.prevent="toggleFfxiv"
        @keydown.space.prevent="toggleFfxiv"
      >
        <span>{{ t(textKeys.ffxivWorkshop) }}</span>
        <span class="app-top-nav__nav-arrow" aria-hidden="true">&#9660;</span>
      </RouterLink>

      <Transition name="dropdown">
        <div
          v-if="ffxivOpen"
          class="app-top-nav__dropdown"
          role="menu"
          @mouseenter="cancelCloseFfxiv"
          @mouseleave="scheduleCloseFfxiv"
        >
          <RouterLink
            v-for="tool in ffxivTools"
            :key="tool.id"
            role="menuitem"
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
      </Transition>
    </div>

    <!-- Silence -->
    <div
      v-if="isSilenceEnabled"
      class="app-top-nav__dropdown-group"
      @mouseenter="openSilenceDropdown"
      @mouseleave="scheduleCloseSilence"
      @focusin="onSilenceFocusIn"
    >
      <RouterLink
        class="app-top-nav__nav-link"
        :class="{
          'app-top-nav__nav-link--active': isSilenceRoute,
          'app-top-nav__nav-link--parent': true
        }"
        :to="siteRoutes.silence"
        :aria-haspopup="true"
        :aria-expanded="silenceOpen"
        @keydown.enter.prevent="toggleSilence"
        @keydown.space.prevent="toggleSilence"
      >
        <span>{{ t(textKeys.silence) }}</span>
        <span class="app-top-nav__nav-arrow" aria-hidden="true">&#9660;</span>
      </RouterLink>

      <Transition name="dropdown">
        <div
          v-if="silenceOpen"
          class="app-top-nav__dropdown"
          role="menu"
          @mouseenter="cancelCloseSilence"
          @mouseleave="scheduleCloseSilence"
        >
          <RouterLink
            v-for="group in silenceGroups"
            :key="group.id"
            role="menuitem"
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
      </Transition>
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
import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import archiveIcon from '@/assets/icons/pixelarticons/archive.svg'
import avatarCircleIcon from '@/assets/icons/pixelarticons/avatar-circle.svg'
import folderIcon from '@/assets/icons/pixelarticons/folder.svg'
import imageIcon from '@/assets/icons/pixelarticons/image.svg'
import starIcon from '@/assets/icons/pixelarticons/star.svg'
import userIcon from '@/assets/icons/pixelarticons/user.svg'
import glamourPrismMonoIcon from '@/assets/icons/glamour/prism-mono.svg'
import { isSilenceEnabled } from '@/config/features'
import { ffxivTools, silenceGroups, siteRoutes } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const { t } = useLocale()

const ffxivOpen = ref(false)
const silenceOpen = ref(false)
const ffxivTimer: { value: ReturnType<typeof setTimeout> | null } = { value: null }
const silenceTimer: { value: ReturnType<typeof setTimeout> | null } = { value: null }

const HOVER_DELAY = 120
const CLOSE_DELAY = 500

const toolIconMap: Record<string, string> = {
  itemCard: imageIcon,
  glamour: glamourPrismMonoIcon,
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

// Close all dropdowns on navigation
watch(() => route.fullPath, () => {
  ffxivOpen.value = false
  silenceOpen.value = false
})

// --- shared dropdown helpers ---
function scheduleOpen(timer: { value: ReturnType<typeof setTimeout> | null }, openRef: ReturnType<typeof ref<boolean>>, delay: number) {
  if (timer.value) clearTimeout(timer.value)
  timer.value = setTimeout(() => { openRef.value = true }, delay)
}

function scheduleClose(timer: { value: ReturnType<typeof setTimeout> | null }, openRef: ReturnType<typeof ref<boolean>>, delay: number) {
  if (timer.value) clearTimeout(timer.value)
  timer.value = setTimeout(() => { openRef.value = false }, delay)
}

function cancelClose(timer: { value: ReturnType<typeof setTimeout> | null }) {
  if (timer.value) clearTimeout(timer.value)
  timer.value = null
}

// --- FFXIV dropdown ---
function openFfxivDropdown() {
  silenceOpen.value = false
  cancelClose(silenceTimer)
  scheduleOpen(ffxivTimer, ffxivOpen, HOVER_DELAY)
}

function scheduleCloseFfxiv() {
  scheduleClose(ffxivTimer, ffxivOpen, CLOSE_DELAY)
}

function cancelCloseFfxiv() {
  cancelClose(ffxivTimer)
}

function toggleFfxiv() {
  silenceOpen.value = false
  ffxivOpen.value = !ffxivOpen.value
}

function onFfxivFocusIn() {
  silenceOpen.value = false
  cancelClose(ffxivTimer)
  ffxivOpen.value = true
}

// --- Silence dropdown ---
function openSilenceDropdown() {
  ffxivOpen.value = false
  cancelClose(ffxivTimer)
  scheduleOpen(silenceTimer, silenceOpen, HOVER_DELAY)
}

function scheduleCloseSilence() {
  scheduleClose(silenceTimer, silenceOpen, CLOSE_DELAY)
}

function cancelCloseSilence() {
  cancelClose(silenceTimer)
}

function toggleSilence() {
  ffxivOpen.value = false
  silenceOpen.value = !silenceOpen.value
}

function onSilenceFocusIn() {
  ffxivOpen.value = false
  cancelClose(silenceTimer)
  silenceOpen.value = true
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
  if (ffxivTimer.value) clearTimeout(ffxivTimer.value)
  if (silenceTimer.value) clearTimeout(silenceTimer.value)
})
</script>
