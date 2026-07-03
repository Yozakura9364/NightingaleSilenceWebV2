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
        <button
          v-for="section in menuSections"
          :key="section.id"
          class="app-top-nav__launcher-tab"
          :class="{ 'app-top-nav__launcher-tab--active': activeMenuSection === section.id }"
          type="button"
          @click="activeMenuSection = section.id"
          @mouseenter="activeMenuSection = section.id"
          @focus="activeMenuSection = section.id"
        >
          <span>{{ t(section.label) }}</span>
          <small>{{ t(section.status) }}</small>
        </button>
      </div>

      <section
        v-if="activeMenuSection === 'ffxiv'"
        class="app-top-nav__launcher-panel"
        :aria-label="t(textKeys.ffxivWorkshop)"
      >
        <div
          class="app-top-nav__window-children"
          :aria-label="`${t(textKeys.ffxivWorkshop)} ${t(textKeys.children)}`"
        >
          <RouterLink
            v-for="tool in ffxivTools"
            :key="tool.id"
            class="app-top-nav__window-child"
            :class="{ 'app-top-nav__window-child--active': route.path === tool.route }"
            :to="tool.route"
            role="menuitem"
            @click="emit('close')"
          >
            {{ t(tool.titleKey) }}
          </RouterLink>
        </div>
      </section>

      <section
        v-else-if="activeMenuSection === 'silence'"
        class="app-top-nav__launcher-panel"
        :aria-label="t(textKeys.silence)"
      >
        <RouterLink
          class="app-top-nav__window-link"
          :class="{ 'app-top-nav__window-link--active': route.path === siteRoutes.silence }"
          :to="siteRoutes.silence"
          role="menuitem"
          @click="emit('close')"
        >
          <span>{{ t(textKeys.silence) }}</span>
          <small>{{ t(textKeys.silenceCommand) }}</small>
        </RouterLink>

        <div
          class="app-top-nav__window-children"
          :aria-label="`${t(textKeys.silence)} ${t(textKeys.children)}`"
        >
          <RouterLink
            v-for="group in silenceGroups"
            :key="group.id"
            class="app-top-nav__window-child"
            :class="{ 'app-top-nav__window-child--active': route.path === group.route }"
            :to="group.route"
            role="menuitem"
            @click="emit('close')"
          >
            {{ t(group.titleKey) }}
          </RouterLink>
        </div>
      </section>

      <section v-else class="app-top-nav__launcher-panel" :aria-label="t(textKeys.about)">
        <RouterLink
          class="app-top-nav__window-link"
          :class="{ 'app-top-nav__window-link--active': route.path === siteRoutes.about }"
          :to="siteRoutes.about"
          role="menuitem"
          @click="emit('close')"
        >
          <span>{{ t(textKeys.about) }}</span>
          <small>{{ t(textKeys.aboutCommand) }}</small>
        </RouterLink>

        <RouterLink
          class="app-top-nav__window-link app-top-nav__window-link--home"
          :to="siteRoutes.home"
          role="menuitem"
          @click="emit('close')"
        >
          <span>{{ t(textKeys.home) }}</span>
          <small>{{ t(textKeys.homeCommand) }}</small>
        </RouterLink>
      </section>
    </AppPixelWindow>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { ffxivTools, silenceGroups, siteRoutes, textKeys } from '@/config/site'
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
  () => route.path === siteRoutes.ffxiv || ffxivTools.some((tool) => route.path === tool.route)
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
const menuSections: Array<{ id: MenuSectionId; label: string; status: string }> = [
  { id: 'ffxiv', label: textKeys.ffxivWorkshop, status: textKeys.statusOpen },
  { id: 'silence', label: textKeys.silence, status: textKeys.statusOpen },
  { id: 'about', label: textKeys.about, status: textKeys.aboutCommand }
]

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
</script>
