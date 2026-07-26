<template>
  <main class="ns-page ffxiv-page">
    <div class="ns-page-shell">
      <h1 class="ffxiv-section-title ns-heading-bloom ns-animate ns-animate--fade-in-down ns-animate-visible">
        {{ t(textKeys.workshops) }}
      </h1>

      <div class="ns-tool-grid ns-stagger ns-animate-visible">
        <RouterLink
          v-for="tool in toolCards"
          :key="tool.id"
          class="ffxiv-tool-card"
          :class="`ffxiv-tool-card--${tool.id}`"
          :to="tool.route"
        >
          <img
            class="ffxiv-tool-card__icon"
            :class="{ 'ffxiv-tool-card__icon--full-color': tool.fullColorIcon }"
            :src="tool.icon"
            alt=""
            aria-hidden="true"
          />
          <h2 class="ffxiv-tool-card__title ns-heading-bloom">
            {{ tool.title }}
          </h2>
        </RouterLink>
      </div>

      <FfxivClockPanel />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import pixelSparklesIcon from '@/assets/icons/pixelarticons/sparkles.svg'
import platePortraitIcon from '@/assets/icons/plate/portrait-64.webp'
import armoireIcon from '@/assets/icons/site/armoire-64.png'
import fashionCheckIcon from '@/assets/icons/site/fashion-check-64.png'
import glamourIcon from '@/assets/icons/site/glamour-64.png'
import itemCardIcon from '@/assets/icons/site/item-card-64.png'
import FfxivClockPanel from '@/pages/ffxiv/components/FfxivClockPanel.vue'
import { ffxivTools } from '@/config/site'
import { ffxivTextKeys as textKeys } from '@/locales/keys/ffxiv'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()

const toolIcons: Record<string, string> = {
  itemCard: itemCardIcon,
  glamour: glamourIcon,
  plate: platePortraitIcon,
  armoire: armoireIcon,
  fashionCheck: fashionCheckIcon
}
const toolCardOrder = ['plate', 'glamour', 'armoire', 'fashionCheck', 'itemCard']
const toolCards = computed(() =>
  [...ffxivTools]
    .sort((left, right) => toolCardOrder.indexOf(left.id) - toolCardOrder.indexOf(right.id))
    .map((tool) => ({
      ...tool,
      icon: toolIcons[tool.id] ?? pixelSparklesIcon,
      fullColorIcon: tool.id in toolIcons,
      title: t(tool.titleKey).trim()
    }))
)
</script>

<style scoped>
.ffxiv-page {
  background: var(--ns-body-background);
}

.ffxiv-page :deep(.ns-page-shell) {
  width: min(1280px, calc(100vw - 32px));
  padding-top: 24px;
}

.ffxiv-section-title {
  margin: 0;
  font-family: var(--ns-font-pixel);
  font-size: 22px;
  font-weight: 950;
  line-height: 1.2;
}

.ffxiv-page :deep(.ns-tool-grid) {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: stretch;
  gap: 14px;
  margin-top: 14px;
}

.ffxiv-tool-card {
  --ffxiv-card-ink: var(--ns-color-text);
  position: relative;
  display: grid;
  grid-template-rows: auto auto;
  align-content: center;
  justify-items: center;
  min-width: 0;
  min-height: 0;
  gap: 12px;
  padding: 18px 8px;
  color: var(--ffxiv-card-ink);
  text-decoration: none;
  transition:
    color var(--ns-transition-fast),
    transform var(--ns-transition-fast);
}

.ffxiv-tool-card:hover {
  color: var(--ns-color-accent-strong);
  transform: translateY(-2px);
}

.ffxiv-tool-card:active {
  transform: translateY(0);
}

.ffxiv-tool-card__icon {
  width: 48px;
  height: 48px;
  filter: var(--ns-pixel-icon-filter);
  image-rendering: pixelated;
}

.ffxiv-tool-card__icon--full-color {
  width: 64px;
  height: 64px;
  filter: none;
}

.ffxiv-tool-card__title {
  margin: 0;
  color: var(--ffxiv-card-ink);
  font-family: var(--ns-font-pixel);
  font-size: 26px;
  font-weight: 950;
  line-height: 1.08;
  letter-spacing: 0;
  text-align: center;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

@media (max-width: 900px) {
  .ffxiv-tool-card {
    gap: 8px;
    padding: 10px;
  }

  .ffxiv-tool-card__icon {
    width: 42px;
    height: 42px;
  }

  .ffxiv-tool-card__icon--full-color {
    width: 54px;
    height: 54px;
  }

  .ffxiv-tool-card__title {
    font-size: 18px;
  }
}

@media (max-width: 680px) {
  .ffxiv-page :deep(.ns-page-shell) {
    width: min(100%, calc(100vw - 24px));
  }

  .ffxiv-page :deep(.ns-tool-grid) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .ffxiv-tool-card__title {
    font-size: 20px;
  }
}
</style>
