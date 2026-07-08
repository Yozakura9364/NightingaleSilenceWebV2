<template>
  <div
    v-if="menu"
    class="nsarmoire-item-action-menu"
    :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
    role="menu"
    @click.stop
  >
    <button type="button" role="menuitem" @click="openMenuItemWiki">
      {{ t(textKeys.nsarmoireActionOpenHuijiWiki) }}
    </button>
    <button
      v-if="canShowIgnoreMenuItem"
      type="button"
      role="menuitem"
      @click="ignoreMenuItem"
    >
      {{ t(textKeys.nsarmoireActionIgnoreCleanupItem) }}
    </button>
    <button
      v-if="canShowUnignoreMenuItem"
      type="button"
      role="menuitem"
      @click="unignoreMenuItem"
    >
      {{ t(textKeys.nsarmoireActionUnignoreCleanupItem) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { textKeys } from '@/config/site'
import type { ArmoireItemActionMenuState } from '@/pages/armoire/composables/useArmoireItemActionMenu'
import { getArmoireHuijiWikiItemUrl } from '@/pages/armoire/composables/useArmoireItemWikiNavigation'
import { useLocale } from '@/stores/locale'

const props = withDefaults(defineProps<{
  menu: ArmoireItemActionMenuState | null
  canIgnoreItems?: boolean
  canUnignoreItems?: boolean
}>(), {
  canIgnoreItems: true,
  canUnignoreItems: false
})

const emit = defineEmits<{
  close: []
  'ignore-item': [itemId: number]
  'unignore-item': [itemId: number]
}>()

const { t } = useLocale()
const menuItemId = computed(() => props.menu?.itemId ?? 0)
const canShowIgnoreMenuItem = computed(
  () => props.canIgnoreItems !== false && menuItemId.value > 0
)
const canShowUnignoreMenuItem = computed(
  () => props.canUnignoreItems === true && menuItemId.value > 0
)

function openMenuItemWiki(): void {
  const itemName = props.menu?.wikiItemName.trim()

  if (itemName) {
    window.open(getArmoireHuijiWikiItemUrl(itemName), '_blank', 'noopener,noreferrer')
  }

  emit('close')
}

function ignoreMenuItem(): void {
  if (menuItemId.value > 0) {
    emit('ignore-item', menuItemId.value)
  }

  emit('close')
}

function unignoreMenuItem(): void {
  if (menuItemId.value > 0) {
    emit('unignore-item', menuItemId.value)
  }

  emit('close')
}
</script>

<style scoped>
.nsarmoire-item-action-menu {
  position: fixed;
  z-index: 1200;
  display: grid;
  min-width: 168px;
  padding: 4px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface);
  box-shadow: var(--ns-pixel-button-shadow-hover);
}

.nsarmoire-item-action-menu button {
  display: block;
  width: 100%;
  min-height: 30px;
  padding: 6px 8px;
  border: 0;
  background: transparent;
  color: var(--ns-color-text);
  font: inherit;
  font-size: 12px;
  font-weight: 850;
  text-align: left;
  cursor: pointer;
}

.nsarmoire-item-action-menu button:hover,
.nsarmoire-item-action-menu button:focus-visible {
  background: var(--ns-color-bg-soft);
  outline: none;
}
</style>
