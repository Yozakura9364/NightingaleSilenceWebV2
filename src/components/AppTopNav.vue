<template>
  <header v-if="showNav" ref="navEl" class="app-top-nav">
    <nav class="app-top-nav__inner" :aria-label="t(textKeys.primaryNavigation)">
      <RouterLink
        class="app-top-nav__brand app-top-nav__brand--art"
        :to="siteRoutes.home"
      >
        <span
          class="app-top-nav__brand-art"
          :style="topNavBrandArtStyle"
          aria-hidden="true"
        ></span>
        <span
          class="app-top-nav__brand-icon"
          :style="brandIconStyle"
          aria-hidden="true"
        ></span>
        <span class="app-top-nav__brand-name ns-sr-only">
          {{ t(siteMeta.zhNameKey) }}
        </span>
        <span
          class="app-top-nav__brand-command ns-sr-only"
          aria-hidden="true"
        >
          {{ t(textKeys.homeCommand) }}
        </span>
      </RouterLink>

      <div ref="controlsRoot" class="app-top-nav__links">
        <AppTopNavMenu />
        <AppTopNavSettings
          :open="configOpen"
          @open="openConfig"
          @toggle="toggleConfig"
          @close="closeConfig"
          @hover-close="closeConfig(false)"
        />
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useRoute } from 'vue-router'
import nightingaleTitleArt from '@/assets/home/nightingale-title-2.webp'
import homeIcon from '@/assets/icons/pixelarticons/home.svg'
import AppTopNavMenu from '@/components/AppTopNavMenu.vue'
import AppTopNavSettings from '@/components/AppTopNavSettings.vue'
import { siteMeta, siteRoutes } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const { t } = useLocale()
const configOpen = ref(false)
const controlsRoot = ref<HTMLElement | null>(null)
const topNavBrandArtStyle = {
  '--ns-top-nav-brand-art-url': `url("${nightingaleTitleArt}")`
} as CSSProperties
const showNav = computed(() => route.path !== siteRoutes.home && route.meta.hideTopNav !== true)
const navEl = ref<HTMLElement | null>(null)

onMounted(() => {
  nextTick(() => {
    if (navEl.value) {
      const el = navEl.value
      el.style.opacity = '0'
      el.style.transform = 'translateY(-8px)'
      requestAnimationFrame(() => {
        el.style.transition =
          'opacity 260ms cubic-bezier(0.22,1,0.36,1), transform 260ms cubic-bezier(0.22,1,0.36,1)'
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      })
    }
  })
})

const brandIconStyle = {
  '--ns-brand-icon-url': `url("${homeIcon}")`
} as CSSProperties

function closeConfig(restoreFocus = true) {
  configOpen.value = false
  if (restoreFocus) {
    previousActiveElement?.focus()
  }
  previousActiveElement = null
}

let previousActiveElement: HTMLElement | null = null

function closePopovers() {
  closeConfig()
}

function openConfig() {
  configOpen.value = true
}

function toggleConfig() {
  if (!configOpen.value) {
    previousActiveElement = document.activeElement as HTMLElement | null
    configOpen.value = true
    return
  }

  closeConfig()
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!configOpen.value) {
    return
  }

  const target = event.target
  if (target instanceof Node && controlsRoot.value?.contains(target)) {
    return
  }

  closePopovers()
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})

watch(() => route.fullPath, closePopovers)
</script>
