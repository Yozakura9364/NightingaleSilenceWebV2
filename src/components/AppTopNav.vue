<template>
  <header v-if="showNav" class="app-top-nav">
    <nav class="app-top-nav__inner" :aria-label="t(textKeys.primaryNavigation)">
      <RouterLink
        class="app-top-nav__brand"
        :class="{ 'app-top-nav__brand--art': isLocalBrandPreview }"
        :to="siteRoutes.home"
      >
        <span
          v-if="isLocalBrandPreview"
          class="app-top-nav__brand-art"
          :style="topNavBrandArtStyle"
          aria-hidden="true"
        ></span>
        <span
          class="app-top-nav__brand-icon"
          :class="{ 'ns-sr-only': isLocalBrandPreview }"
          :style="brandIconStyle"
          aria-hidden="true"
        ></span>
        <span :class="{ 'ns-sr-only': isLocalBrandPreview }">{{ t(siteMeta.zhNameKey) }}</span>
        <span
          class="app-top-nav__brand-command"
          :class="{ 'ns-sr-only': isLocalBrandPreview }"
          aria-hidden="true"
        >
          {{ t(textKeys.homeCommand) }}
        </span>
      </RouterLink>

      <div ref="controlsRoot" class="app-top-nav__links">
        <AppTopNavMenu />
        <AppTopNavSettings :open="configOpen" @toggle="toggleConfig" @close="closeConfig" />
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useRoute } from 'vue-router'
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
const isLocalBrandPreview = import.meta.env.DEV
const localAssetBase = import.meta.env.VITE_LOCAL_ASSET_BASE
const topNavBrandArtStyle = {
  '--ns-top-nav-brand-art-url': isLocalBrandPreview
    ? `url("${localAssetBase}/nightingale-title-2.webp")`
    : 'none'
} as CSSProperties
const showNav = computed(() => route.path !== siteRoutes.home && route.meta.hideTopNav !== true)
const brandIconStyle = {
  '--ns-brand-icon-url': `url("${homeIcon}")`
} as CSSProperties

function closeConfig() {
  configOpen.value = false
  previousActiveElement?.focus()
  previousActiveElement = null
}

let previousActiveElement: HTMLElement | null = null

function closePopovers() {
  closeConfig()
}

function toggleConfig() {
  if (!configOpen.value) {
    previousActiveElement = document.activeElement as HTMLElement | null
    configOpen.value = true
    return
  }

  closeConfig()
}

const configTriggerRef = ref<HTMLButtonElement | null>(null)

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
