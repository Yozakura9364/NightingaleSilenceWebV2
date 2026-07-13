<template>
  <header v-if="showNav" class="app-top-nav">
    <nav class="app-top-nav__inner" :aria-label="t(textKeys.primaryNavigation)">
      <RouterLink class="app-top-nav__brand" :to="siteRoutes.home">
        <span>{{ t(siteMeta.zhNameKey) }}</span>
        <span class="app-top-nav__brand-command" aria-hidden="true">
          {{ t(textKeys.homeCommand) }}
        </span>
      </RouterLink>

      <div ref="controlsRoot" class="app-top-nav__links">
        <AppTopNavMenu :open="menuOpen" @toggle="toggleMenu" @close="closeMenu" />
        <AppTopNavSettings :open="configOpen" @toggle="toggleConfig" @close="closeConfig" />
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppTopNavMenu from '@/components/AppTopNavMenu.vue'
import AppTopNavSettings from '@/components/AppTopNavSettings.vue'
import { siteMeta, siteRoutes } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const { t } = useLocale()
const menuOpen = ref(false)
const configOpen = ref(false)
const controlsRoot = ref<HTMLElement | null>(null)
const showNav = computed(() => route.path !== siteRoutes.home && route.meta.hideTopNav !== true)

function closeMenu() {
  menuOpen.value = false
}

function closeConfig() {
  configOpen.value = false
}

function closePopovers() {
  closeMenu()
  closeConfig()
}

function toggleMenu() {
  if (!menuOpen.value) {
    closeConfig()
    menuOpen.value = true
    return
  }

  closeMenu()
}

function toggleConfig() {
  if (!configOpen.value) {
    closeMenu()
    configOpen.value = true
    return
  }

  closeConfig()
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!menuOpen.value && !configOpen.value) {
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
