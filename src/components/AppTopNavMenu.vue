<template>
  <div ref="navRoot" class="app-top-nav__nav">
    <!-- 狒狒14工房 -->
    <div
      class="app-top-nav__dropdown-group"
      @pointerenter="openFfxivDropdown"
      @pointerleave="scheduleCloseFfxiv"
    >
      <button
        class="app-top-nav__nav-link"
        :class="{
          'app-top-nav__nav-link--active': isFfxivRoute,
          'app-top-nav__nav-link--parent': true
        }"
        type="button"
        :aria-label="t(textKeys.ffxivWorkshop)"
        aria-haspopup="dialog"
        aria-controls="app-top-nav-ffxiv-menu"
        :aria-expanded="ffxivOpen"
        @click="toggleFfxiv"
        @keydown.esc="closeDropdowns"
      >
        <span
          class="app-top-nav__mobile-mask-icon"
          :style="mobileIconStyle(ffxivWorkshopMonoIcon)"
          aria-hidden="true"
        ></span>
        <span class="app-top-nav__nav-label">{{ t(textKeys.ffxivWorkshop) }}</span>
        <span class="app-top-nav__nav-arrow" aria-hidden="true">&#9660;</span>
      </button>

      <Transition name="dropdown">
        <AppPixelWindow
          v-if="ffxivOpen"
          id="app-top-nav-ffxiv-menu"
          class="app-top-nav__window app-top-nav__window--menu app-top-nav__window--ffxiv"
          :title="t(textKeys.menuTitle)"
          :close-label="t(textKeys.closeMenu)"
          role="dialog"
          :aria-label="t(textKeys.ffxivWorkshop)"
          @pointerenter="cancelCloseFfxiv"
          @pointerleave="scheduleCloseFfxiv"
          @close="closeDropdowns"
          @keydown.esc="closeDropdowns"
        >
          <nav class="app-top-nav__dropdown" :aria-label="t(textKeys.ffxivWorkshop)">
            <RouterLink
              class="app-top-nav__dropdown-link"
              :class="{ 'app-top-nav__dropdown-link--active': route.path === siteRoutes.ffxiv }"
              :to="siteRoutes.ffxiv"
              @click="closeDropdowns"
            >
              <span
                class="app-top-nav__dropdown-icon"
                :style="toolIconStyle(ffxivWorkshopMonoIcon)"
                aria-hidden="true"
              ></span>
              <span>{{ t(textKeys.ffxivWorkshop) }}</span>
            </RouterLink>
            <RouterLink
              v-for="tool in ffxivTools"
              :key="tool.id"
              class="app-top-nav__dropdown-link"
              :class="{ 'app-top-nav__dropdown-link--active': isRouteUnder(tool.route) }"
              :to="tool.route"
              @click="closeDropdowns"
            >
              <span
                class="app-top-nav__dropdown-icon"
                :style="toolIconStyle(toolIconMap[tool.id] ?? folderIcon)"
                aria-hidden="true"
              ></span>
              <span>{{ t(tool.titleKey) }}</span>
            </RouterLink>
          </nav>
        </AppPixelWindow>
      </Transition>
    </div>

    <!-- Silence -->
    <div
      v-if="isSilenceEnabled"
      class="app-top-nav__dropdown-group"
      @pointerenter="openSilenceDropdown"
      @pointerleave="scheduleCloseSilence"
    >
      <button
        class="app-top-nav__nav-link"
        :class="{
          'app-top-nav__nav-link--active': isSilenceRoute,
          'app-top-nav__nav-link--parent': true
        }"
        type="button"
        :aria-label="t(textKeys.silence)"
        aria-haspopup="dialog"
        aria-controls="app-top-nav-silence-menu"
        :aria-expanded="silenceOpen"
        @click="toggleSilence"
        @keydown.esc="closeDropdowns"
      >
        <span
          class="app-top-nav__mobile-mask-icon"
          :style="mobileIconStyle(imageIcon)"
          aria-hidden="true"
        ></span>
        <span class="app-top-nav__nav-label">{{ t(textKeys.silence) }}</span>
        <span class="app-top-nav__nav-arrow" aria-hidden="true">&#9660;</span>
      </button>

      <Transition name="dropdown">
        <AppPixelWindow
          v-if="silenceOpen"
          id="app-top-nav-silence-menu"
          class="app-top-nav__window app-top-nav__window--menu app-top-nav__window--silence"
          :title="t(textKeys.menuTitle)"
          :close-label="t(textKeys.closeMenu)"
          role="dialog"
          :aria-label="t(textKeys.silence)"
          @pointerenter="cancelCloseSilence"
          @pointerleave="scheduleCloseSilence"
          @close="closeDropdowns"
          @keydown.esc="closeDropdowns"
        >
          <nav class="app-top-nav__dropdown" :aria-label="t(textKeys.silence)">
            <RouterLink
              class="app-top-nav__dropdown-link"
              :class="{ 'app-top-nav__dropdown-link--active': route.path === siteRoutes.silence }"
              :to="siteRoutes.silence"
              @click="closeDropdowns"
            >
              <span
                class="app-top-nav__dropdown-icon"
                :style="toolIconStyle(imageIcon)"
                aria-hidden="true"
              ></span>
              <span>{{ t(textKeys.silence) }}</span>
            </RouterLink>
            <RouterLink
              v-for="group in silenceGroups"
              :key="group.id"
              class="app-top-nav__dropdown-link"
              :class="{
                'app-top-nav__dropdown-link--active':
                  route.path === group.route || route.path.startsWith(`${group.route}/`)
              }"
              :to="group.route"
              @click="closeDropdowns"
            >
              <span
                class="app-top-nav__dropdown-icon"
                :style="toolIconStyle(groupIconMap[group.id] ?? imageIcon)"
                aria-hidden="true"
              ></span>
              <span>{{ t(groupMenuTitleKeyMap[group.id]) }}</span>
            </RouterLink>
          </nav>
        </AppPixelWindow>
      </Transition>
    </div>

    <!-- 关于 -->
    <RouterLink
      class="app-top-nav__nav-link"
      :class="{ 'app-top-nav__nav-link--active': isAboutRoute }"
      :to="siteRoutes.about"
      :aria-label="t(textKeys.about)"
    >
      <span
        class="app-top-nav__mobile-mask-icon app-top-nav__mobile-mask-icon--about"
        :style="mobileIconStyle(aboutMonoIcon)"
        aria-hidden="true"
      ></span>
      <span class="app-top-nav__nav-label">{{ t(textKeys.about) }}</span>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import folderIcon from '@/assets/icons/pixelarticons/folder.svg'
import imageIcon from '@/assets/icons/pixelarticons/image.svg'
import platePortraitMonoIcon from '@/assets/icons/plate/portrait-mono.webp'
import aboutMonoIcon from '@/assets/icons/site/about-mono.png'
import armoireMonoIcon from '@/assets/icons/site/armoire-mono.png'
import fashionCheckMonoIcon from '@/assets/icons/site/fashion-check-mono.png'
import ffxivWorkshopMonoIcon from '@/assets/icons/site/ffxiv-workshop-mono.png'
import glamourMonoIcon from '@/assets/icons/site/glamour-mono.png'
import itemCardMonoIcon from '@/assets/icons/site/item-card-mono.png'
import silenceAngelMonoIcon from '@/assets/icons/site/silence-angel-mono.png'
import silenceGlitchMonoIcon from '@/assets/icons/site/silence-glitch-mono.png'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { isSilenceEnabled } from '@/config/features'
import { ffxivTools, silenceGroups, siteRoutes } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const { t } = useLocale()
const emit = defineEmits<{
  open: []
}>()

const ffxivOpen = ref(false)
const silenceOpen = ref(false)
const navRoot = ref<HTMLElement | null>(null)
const ffxivTimer: { value: ReturnType<typeof setTimeout> | null } = { value: null }
const silenceTimer: { value: ReturnType<typeof setTimeout> | null } = { value: null }

const HOVER_DELAY = 120
const CLOSE_DELAY = 500

const toolIconMap: Record<string, string> = {
  itemCard: itemCardMonoIcon,
  glamour: glamourMonoIcon,
  plate: platePortraitMonoIcon,
  armoire: armoireMonoIcon,
  fashionCheck: fashionCheckMonoIcon
}
const groupIconMap: Record<string, string> = {
  angel: silenceAngelMonoIcon,
  glitch: silenceGlitchMonoIcon
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
  closeDropdowns()
})

function closeDropdowns() {
  cancelClose(ffxivTimer)
  cancelClose(silenceTimer)
  ffxivOpen.value = false
  silenceOpen.value = false
}

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
function openFfxivDropdown(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return

  silenceOpen.value = false
  cancelClose(silenceTimer)
  emit('open')
  scheduleOpen(ffxivTimer, ffxivOpen, HOVER_DELAY)
}

function scheduleCloseFfxiv(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return

  scheduleClose(ffxivTimer, ffxivOpen, CLOSE_DELAY)
}

function cancelCloseFfxiv() {
  cancelClose(ffxivTimer)
}

function toggleFfxiv() {
  cancelClose(ffxivTimer)
  cancelClose(silenceTimer)
  silenceOpen.value = false
  if (!ffxivOpen.value) emit('open')
  ffxivOpen.value = !ffxivOpen.value
}

// --- Silence dropdown ---
function openSilenceDropdown(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return

  ffxivOpen.value = false
  cancelClose(ffxivTimer)
  emit('open')
  scheduleOpen(silenceTimer, silenceOpen, HOVER_DELAY)
}

function scheduleCloseSilence(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return

  scheduleClose(silenceTimer, silenceOpen, CLOSE_DELAY)
}

function cancelCloseSilence() {
  cancelClose(silenceTimer)
}

function toggleSilence() {
  cancelClose(ffxivTimer)
  cancelClose(silenceTimer)
  ffxivOpen.value = false
  if (!silenceOpen.value) emit('open')
  silenceOpen.value = !silenceOpen.value
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!ffxivOpen.value && !silenceOpen.value) return

  const target = event.target
  if (target instanceof Node && navRoot.value?.contains(target)) return

  closeDropdowns()
}

function isRouteUnder(baseRoute: string): boolean {
  return route.path === baseRoute || route.path.startsWith(`${baseRoute}/`)
}

function toolIconStyle(icon: string): CSSProperties {
  return {
    '--app-top-nav-dropdown-icon-url': `url("${icon}")`
  } as CSSProperties
}

function mobileIconStyle(icon: string): CSSProperties {
  return {
    '--app-top-nav-mobile-mask-url': `url("${icon}")`
  } as CSSProperties
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  if (ffxivTimer.value) clearTimeout(ffxivTimer.value)
  if (silenceTimer.value) clearTimeout(silenceTimer.value)
})

defineExpose({ closeDropdowns })
</script>
