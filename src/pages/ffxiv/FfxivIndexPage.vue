<template>
  <main class="ns-page ffxiv-page">
    <div class="ns-page-shell">
      <h1 class="ns-title ns-heading-bloom ns-animate ns-animate--fade-in-down ns-animate-visible">
        {{ t(ffxivCategory.titleKey) }}
      </h1>

      <div class="ns-tool-grid ns-stagger ns-animate-visible">
        <RouterLink
          v-for="tool in toolCards"
          :key="tool.id"
          class="ffxiv-tool-card"
          :class="`ffxiv-tool-card--${tool.id}`"
          :to="tool.route"
        >
          <img class="ffxiv-tool-card__icon" :src="tool.icon" alt="" aria-hidden="true" />
          <h2 class="ffxiv-tool-card__title ns-heading-bloom">
            {{ tool.title }}
          </h2>
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import pixelArchiveIcon from '@/assets/icons/pixelarticons/archive.svg'
import pixelAvatarCircleIcon from '@/assets/icons/pixelarticons/avatar-circle.svg'
import pixelImageIcon from '@/assets/icons/pixelarticons/image.svg'
import pixelSparklesIcon from '@/assets/icons/pixelarticons/sparkles.svg'
import { ffxivTools, getCategory } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

const ffxivCategory = getCategory('ffxiv') ?? {
  titleKey: textKeys.ffxivWorkshop,
  kickerKey: textKeys.placeholder,
  descriptionKey: textKeys.placeholder
}
const { t } = useLocale()

const toolIcons: Record<string, string> = {
  itemCard: pixelImageIcon,
  glamour: pixelSparklesIcon,
  plate: pixelAvatarCircleIcon,
  armoire: pixelArchiveIcon,
  fashionCheck: pixelSparklesIcon
}
const toolCardOrder = ['plate', 'glamour', 'armoire', 'fashionCheck', 'itemCard']
const toolCards = computed(() =>
  [...ffxivTools]
    .sort((left, right) => toolCardOrder.indexOf(left.id) - toolCardOrder.indexOf(right.id))
    .map((tool) => ({
      ...tool,
      icon: toolIcons[tool.id] ?? pixelSparklesIcon,
      title: t(tool.titleKey).trim()
    }))
)
</script>

<style scoped>
.ffxiv-page {
  background: var(--ns-body-background);
}

.ffxiv-page :deep(.ns-page-shell) {
  width: min(1040px, calc(100vw - 32px));
  padding-top: 24px;
}

.ffxiv-page :deep(.ns-title) {
  max-width: 780px;
}

.ffxiv-page :deep(.ns-tool-grid) {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: minmax(240px, auto);
  align-items: stretch;
  gap: 18px;
}

.ffxiv-tool-card {
  --ffxiv-card-border: var(--ns-pixel-border);
  --ffxiv-card-shadow: var(--ns-pixel-button-shadow);
  --ffxiv-card-shadow-hover: var(--ns-pixel-button-shadow-hover);
  --ffxiv-card-shadow-active: var(--ns-pixel-soft-shadow);
  --ffxiv-card-surface: var(--ns-color-surface-solid);
  --ffxiv-card-ink: var(--ns-color-text);
  position: relative;
  display: grid;
  grid-template-rows: auto auto;
  align-content: center;
  justify-items: center;
  min-height: 220px;
  gap: 16px;
  padding: 18px;
  border: 2px solid var(--ffxiv-card-border);
  background: var(--ffxiv-card-surface);
  box-shadow: var(--ffxiv-card-shadow);
  color: var(--ffxiv-card-ink);
  text-decoration: none;
  transition:
    background var(--ns-transition-fast),
    color var(--ns-transition-fast),
    transform var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.ffxiv-tool-card:hover {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-accent-strong);
  transform: translate(-1px, -1px);
  box-shadow: var(--ffxiv-card-shadow-hover);
}

.ffxiv-tool-card:active {
  transform: translate(2px, 2px);
  box-shadow: var(--ffxiv-card-shadow-active);
}

.ffxiv-tool-card__icon {
  width: 48px;
  height: 48px;
  filter: var(--ns-pixel-icon-filter);
  image-rendering: pixelated;
}

.ffxiv-tool-card__title {
  margin: 0;
  color: var(--ffxiv-card-ink);
  font-family: var(--ns-font-decorative);
  font-size: 30px;
  font-weight: 950;
  line-height: 1.12;
  letter-spacing: 0;
  text-align: center;
  overflow-wrap: anywhere;
}

@media (max-width: 860px) {
  .ffxiv-page :deep(.ns-tool-grid) {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .ffxiv-page :deep(.ns-page-shell) {
    width: min(100%, calc(100vw - 24px));
  }

  .ffxiv-tool-card {
    min-height: 220px;
    padding: 16px;
  }

  .ffxiv-tool-card__title {
    font-size: 26px;
  }
}
</style>
