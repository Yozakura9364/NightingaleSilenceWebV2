<template>
  <Teleport to="body">
    <div
      v-if="position"
      class="ffxiv-item-reference-menu"
      :class="{ 'ffxiv-item-reference-menu--legacy': props.variant === 'legacy' }"
      :style="menuStyle"
      role="menu"
      @click.stop
    >
      <button type="button" role="menuitem" :disabled="!huijiNameAvailable" @click="openHuijiWiki">
        <img src="/assets/icons/huiji.svg" alt="" aria-hidden="true" />
        {{ labels.huijiWiki }}
      </button>
      <button
        type="button"
        role="menuitem"
        :disabled="!lodestoneNameAvailable"
        @click="openLodestone"
      >
        <img src="/assets/icons/fashion-check/lodestone.ico" alt="" aria-hidden="true" />
        {{ labels.lodestone }}
      </button>
      <button type="button" role="menuitem" :disabled="itemId <= 0" @click="openGarland">
        <img src="/assets/icons/fashion-check/garland-data.png" alt="" aria-hidden="true" />
        {{ labels.garlandData }}
      </button>
      <button type="button" role="menuitem" :disabled="!krSearchName" @click="openKrGuide">
        <img src="/assets/icons/fashion-check/ffxiv-kr-guide.ico" alt="" aria-hidden="true" />
        {{ labels.krGuide }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  getGarlandItemUrl,
  getHuijiWikiItemUrl,
  getKrGuideSearchUrl,
  getLodestoneItemUrl
} from '@/lib/ffxiv/huijiWiki'

const MENU_WIDTH = 224
const MENU_HEIGHT = 138
const VIEWPORT_MARGIN = 8

const props = withDefaults(
  defineProps<{
    position: { x: number; y: number } | null
    itemId: number
    huijiName: string
    lodestoneName: string
    koName: string
    labels: {
      huijiWiki: string
      lodestone: string
      garlandData: string
      krGuide: string
    }
    variant?: 'pixel' | 'legacy'
  }>(),
  { variant: 'pixel' }
)

const emit = defineEmits<{
  close: []
}>()

const huijiNameAvailable = computed(() => Boolean(props.huijiName.trim()))
const lodestoneNameAvailable = computed(() => Boolean(props.lodestoneName.trim()))
const krSearchName = computed(() =>
  (props.koName || props.huijiName).replace(/\s*[:：]\s*.+$/, '').trim()
)

const menuStyle = computed(() => {
  if (!props.position || typeof window === 'undefined') return undefined

  const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN)
  const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - MENU_HEIGHT - VIEWPORT_MARGIN)
  const x = Math.min(Math.max(VIEWPORT_MARGIN, props.position.x), maxX)
  const y = Math.min(Math.max(VIEWPORT_MARGIN, props.position.y), maxY)
  return { left: `${x}px`, top: `${y}px` }
})

function openHuijiWiki(): void {
  if (props.huijiName) {
    window.open(getHuijiWikiItemUrl(props.huijiName), '_blank', 'noopener,noreferrer')
  }
  emit('close')
}

async function openLodestone(): Promise<void> {
  if (lodestoneNameAvailable.value) {
    const url = await getLodestoneItemUrl(props.itemId, props.lodestoneName)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  emit('close')
}

function openGarland(): void {
  if (props.itemId > 0) {
    window.open(getGarlandItemUrl(props.itemId), '_blank', 'noopener,noreferrer')
  }
  emit('close')
}

function openKrGuide(): void {
  if (krSearchName.value) {
    window.open(getKrGuideSearchUrl(krSearchName.value), '_blank', 'noopener,noreferrer')
  }
  emit('close')
}
</script>

<style scoped>
.ffxiv-item-reference-menu {
  position: fixed;
  z-index: 1200;
  display: grid;
  box-sizing: border-box;
  width: 224px;
  padding: 4px;
  border: 1px solid #000;
  background: var(--ns-color-surface-solid, #fff);
  box-shadow: none;
}

.ffxiv-item-reference-menu button {
  display: flex;
  width: 100%;
  min-height: 32px;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text);
  font: 900 13px/1.25 var(--ns-font-ui);
  text-align: left;
  box-shadow: none;
  cursor: pointer;
}

.ffxiv-item-reference-menu button:not(:disabled):hover,
.ffxiv-item-reference-menu button:not(:disabled):focus-visible {
  background: var(--ns-pixel-hover-surface);
  outline: 1px solid #000;
  outline-offset: -1px;
}

.ffxiv-item-reference-menu button:disabled {
  color: var(--ns-color-text-muted);
  cursor: not-allowed;
  opacity: 0.5;
}

.ffxiv-item-reference-menu img {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  object-fit: contain;
}

.ffxiv-item-reference-menu--legacy {
  padding: 5px;
  border-color: var(--ns-color-border);
  border-radius: 8px;
}

.ffxiv-item-reference-menu--legacy button {
  border-radius: 5px;
  font: 700 13px/1.35 var(--ns-font-ui);
}

.ffxiv-item-reference-menu--legacy button:not(:disabled):hover,
.ffxiv-item-reference-menu--legacy button:not(:disabled):focus-visible {
  background: var(--ns-color-surface-tint);
  outline: none;
}
</style>
