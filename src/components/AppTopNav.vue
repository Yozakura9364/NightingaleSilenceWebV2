<template>
  <header
    v-if="showNav"
    class="app-top-nav"
  >
    <nav class="app-top-nav__inner" aria-label="Site navigation">
      <RouterLink class="app-top-nav__brand" :to="siteRoutes.home">
        {{ siteMeta.zhName }}
      </RouterLink>

      <div class="app-top-nav__links">
        <div ref="menuRoot" class="app-top-nav__menu">
          <button
            class="app-top-nav__menu-button"
            :class="{ 'app-top-nav__menu-button--active': isFfxivRoute }"
            type="button"
            :aria-expanded="menuOpen"
            aria-haspopup="true"
            @click="toggleMenu"
            @keydown.esc="closeMenu"
          >
            <span>FF14工具</span>
            <span class="app-top-nav__chevron" aria-hidden="true">⌄</span>
          </button>

          <div
            v-if="menuOpen"
            class="app-top-nav__dropdown"
            role="menu"
          >
            <RouterLink
              class="app-top-nav__dropdown-link"
              :class="{ 'app-top-nav__dropdown-link--active': route.path === siteRoutes.ffxiv }"
              :to="siteRoutes.ffxiv"
              role="menuitem"
              @click="closeMenu"
            >
              FF14工具
            </RouterLink>
            <RouterLink
              v-for="tool in ffxivTools"
              :key="tool.id"
              class="app-top-nav__dropdown-link"
              :class="{ 'app-top-nav__dropdown-link--active': route.path === tool.route }"
              :to="tool.route"
              role="menuitem"
              @click="closeMenu"
            >
              {{ tool.title }}
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ffxivTools, siteMeta, siteRoutes } from '@/config/site'

const route = useRoute()
const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)
const showNav = computed(() => route.path !== siteRoutes.home && route.meta.hideTopNav !== true)
const isFfxivRoute = computed(() => route.path === siteRoutes.ffxiv || ffxivTools.some((tool) => route.path === tool.route))

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!menuOpen.value) {
    return
  }

  const target = event.target
  if (target instanceof Node && menuRoot.value?.contains(target)) {
    return
  }

  closeMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<style scoped>
.app-top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(88, 68, 105, 0.14);
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(16px);
}

.app-top-nav__inner {
  display: flex;
  min-height: 52px;
  width: min(var(--ns-content-width), calc(100vw - 32px));
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 0 auto;
}

.app-top-nav__brand,
.app-top-nav__menu-button {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  border-radius: var(--ns-radius-pill);
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.app-top-nav__brand {
  color: var(--ns-color-text);
}

.app-top-nav__links {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  overflow: visible;
}

.app-top-nav__menu {
  position: relative;
}

.app-top-nav__menu-button {
  gap: 6px;
  padding: 0 11px;
  border: 0;
  background: transparent;
  color: var(--ns-color-text-muted);
  cursor: pointer;
}

.app-top-nav__menu-button:hover,
.app-top-nav__menu-button--active,
.app-top-nav__menu-button[aria-expanded="true"] {
  background: var(--ns-color-accent-soft);
  color: var(--ns-color-accent-strong);
}

.app-top-nav__chevron {
  color: currentColor;
  font-size: 13px;
  transform: translateY(-1px);
}

.app-top-nav__dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 30;
  display: grid;
  min-width: 176px;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--ns-shadow-soft);
}

.app-top-nav__dropdown-link {
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 0 12px;
  border-radius: var(--ns-radius-sm);
  color: var(--ns-color-text-muted);
  font-size: 14px;
  font-weight: 850;
  white-space: nowrap;
}

.app-top-nav__dropdown-link:hover,
.app-top-nav__dropdown-link--active {
  background: var(--ns-color-accent-soft);
  color: var(--ns-color-accent-strong);
}

@media (max-width: 640px) {
  .app-top-nav__inner {
    width: min(var(--ns-content-width), calc(100vw - 24px));
    gap: 10px;
  }

  .app-top-nav__brand {
    flex: 0 0 auto;
  }

  .app-top-nav__dropdown {
    right: 0;
  }
}
</style>
