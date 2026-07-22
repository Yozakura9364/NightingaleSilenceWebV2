<template>
  <FfxivToolShell :tool="tool" :boundary="boundary" variant="workspace">
    <div class="nsglamour-page">
      <RouterLink
        class="nsglamour-page-turn"
        :class="turnButtonClass"
        :to="turnTarget"
        :title="turnLabel"
        :aria-label="turnLabel"
      >
        <span
          class="nsglamour-page-turn__arrow"
          :style="turnIconStyle"
          aria-hidden="true"
        ></span>
        <small>{{ turnLabel }}</small>
      </RouterLink>

      <NSGlamourWorkspace :boundary="boundary" :mode="mode" />
    </div>
  </FfxivToolShell>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import chevronLeftIcon from '@/assets/icons/chevron-left.svg'
import chevronRightIcon from '@/assets/icons/chevron-right.svg'
import { getRequiredFfxivTool, siteRoutes } from '@/config/site'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import { glamourUiMessages } from '@/locales/modules/glamour'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import NSGlamourWorkspace from '@/pages/glamour/components/NSGlamourWorkspace.vue'
import { getApiBoundary } from '@/services/apiBoundaries'
import { loadMessages, useLocale } from '@/stores/locale'

loadMessages(glamourUiMessages)

const tool = getRequiredFfxivTool('glamour')
const boundary = getApiBoundary('glamour')
const route = useRoute()
const { t } = useLocale()

const mode = computed(() =>
  route.path === siteRoutes.glamourEquipInfo ? 'equipinfo' : 'template'
)
const isEquipInfoMode = computed(() => mode.value === 'equipinfo')
const turnTarget = computed(() =>
  isEquipInfoMode.value ? siteRoutes.glamourTemplate : siteRoutes.glamourEquipInfo
)
const turnLabel = computed(() =>
  isEquipInfoMode.value ? t(textKeys.nsglamourTemplatePage) : t(textKeys.nsglamourEquipInfoPage)
)
const turnButtonClass = computed(() => ({
  'nsglamour-page-turn--prev': isEquipInfoMode.value,
  'nsglamour-page-turn--next': !isEquipInfoMode.value
}))
const turnIconStyle = computed(
  () =>
    ({
      '--nsglamour-page-turn-icon': `url("${isEquipInfoMode.value ? chevronLeftIcon : chevronRightIcon}")`
    }) as CSSProperties
)
</script>

<style scoped>
.nsglamour-page {
  --ns-ffxiv-workspace-bg: var(--ns-glamour-workspace-bg);

  position: relative;
  box-sizing: border-box;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding-inline: 46px;
  background: var(--ns-ffxiv-workspace-bg);
}

.nsglamour-page-turn {
  position: fixed;
  top: 50%;
  z-index: 20;
  display: inline-flex;
  overflow: hidden;
  width: 40px;
  min-width: 0;
  height: 52px;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 0 8px;
  border: 2px solid transparent;
  background: transparent;
  color: var(--ns-color-text);
  font-family: var(--ns-font-decorative);
  font-weight: 900;
  box-shadow: none;
  text-decoration: none;
  transform: translateY(-50%);
  transition:
    width 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;
}

.nsglamour-page-turn:hover,
.nsglamour-page-turn:focus-visible {
  width: 146px;
  border-color: var(--ns-pixel-border);
  background: var(--ns-pixel-pink-surface);
  color: var(--ns-color-accent-strong);
  box-shadow: var(--ns-pixel-button-shadow-hover);
  outline: none;
}

.nsglamour-page-turn--prev {
  left: 0;
}

.nsglamour-page-turn--next {
  right: 0;
  flex-direction: row-reverse;
}

.nsglamour-page-turn--next:hover,
.nsglamour-page-turn--next:focus-visible {
  background: var(--ns-pixel-cyan-surface);
}

.nsglamour-page-turn__arrow {
  display: block;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  background: currentColor;
  image-rendering: pixelated;
  mask: var(--nsglamour-page-turn-icon) center / 100% 100% no-repeat;
  -webkit-mask: var(--nsglamour-page-turn-icon) center / 100% 100% no-repeat;
}

.nsglamour-page-turn small {
  display: grid;
  overflow: hidden;
  width: 86px;
  max-width: 0;
  min-height: 32px;
  place-items: center;
  color: currentColor;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.15;
  opacity: 0;
  text-align: center;
  transition:
    max-width 0.25s ease,
    opacity 0.25s ease;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.nsglamour-page-turn:hover small,
.nsglamour-page-turn:focus-visible small {
  max-width: 86px;
  opacity: 1;
}

.nsglamour-page-turn:active {
  box-shadow: var(--ns-pixel-soft-shadow);
  transform: translate(2px, calc(-50% + 2px));
}

.nsglamour-page-turn:focus-visible {
  box-shadow:
    var(--ns-focus-ring),
    var(--ns-pixel-button-shadow-hover);
}

@media (max-width: 720px) {
  .nsglamour-page {
    padding-inline: 42px;
  }

  .nsglamour-page-turn {
    width: 38px;
    height: 48px;
    padding-inline: 7px;
  }

  .nsglamour-page-turn:hover,
  .nsglamour-page-turn:focus-visible {
    width: 132px;
  }

  .nsglamour-page-turn__arrow {
    width: 18px;
    height: 18px;
  }

  .nsglamour-page-turn small {
    width: 78px;
    min-height: 32px;
    font-size: 12px;
  }

  .nsglamour-page-turn:hover small,
  .nsglamour-page-turn:focus-visible small {
    max-width: 78px;
  }
}
</style>
