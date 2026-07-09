<template>
  <main class="ns-page ffxiv-page">
    <div class="ns-page-shell">
      <RouterLink class="ffxiv-back" :to="siteRoutes.home">← {{ t(textKeys.back) }}</RouterLink>

      <p v-if="categoryKicker" class="ns-eyebrow">{{ categoryKicker }}</p>
      <h1 class="ns-title ns-heading-bloom">{{ t(ffxivCategory.titleKey) }}</h1>
      <p v-if="categoryDescription" class="ns-lead">{{ categoryDescription }}</p>

      <div class="ns-tool-grid">
        <RouterLink
          v-for="tool in toolCards"
          :key="tool.id"
          class="ffxiv-tool-card"
          :class="[`ffxiv-tool-card--${tool.id}`, { 'ffxiv-tool-card--primary': tool.isPrimary }]"
          :to="tool.route"
        >
          <div class="ffxiv-tool-card__main">
            <span class="ffxiv-tool-card__badge">{{ toolBadge }}</span>
            <h2 class="ffxiv-tool-card__title ns-heading-bloom">
              <img class="ffxiv-tool-card__title-icon" :src="tool.icon" alt="" aria-hidden="true" />
              {{ tool.title }}
            </h2>
            <p v-if="tool.summary" class="ffxiv-tool-card__text">{{ tool.summary }}</p>
          </div>
          <span class="ffxiv-tool-card__button">{{ actionLabel }}</span>
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import pixelArchiveIcon from '@/assets/icons/pixelarticons/archive.svg'
import pixelAvatarCircleIcon from '@/assets/icons/pixelarticons/avatar-circle.svg'
import pixelSparklesIcon from '@/assets/icons/pixelarticons/sparkles.svg'
import { ffxivTools, getCategory, siteRoutes, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

const ffxivCategory = getCategory('ffxiv') ?? {
  titleKey: textKeys.ffxivWorkshop,
  kickerKey: textKeys.placeholder,
  descriptionKey: textKeys.placeholder
}
const { t } = useLocale()

const categoryKicker = computed(() => t(ffxivCategory.kickerKey).trim())
const categoryDescription = computed(() => t(ffxivCategory.descriptionKey).trim())
const actionLabel = computed(() => t(textKeys.open).trim())
const toolBadge = computed(() => t(textKeys.ffxivToolBadge).trim())
const toolIcons: Record<string, string> = {
  glamour: pixelSparklesIcon,
  plate: pixelAvatarCircleIcon,
  armoire: pixelArchiveIcon
}
const toolCards = computed(() =>
  ffxivTools.map((tool) => ({
    ...tool,
    icon: toolIcons[tool.id] ?? pixelSparklesIcon,
    title: t(tool.titleKey).trim(),
    summary: t(tool.summaryKey).trim(),
    statusLabel: t(tool.statusLabelKey).trim(),
    isPrimary: tool.id === 'glamour'
  }))
)
</script>

<style scoped>
.ffxiv-page {
  background: var(--ns-body-background);
}

.ffxiv-page :deep(.ns-page-shell) {
  width: min(1040px, calc(100vw - 32px));
}

.ffxiv-back {
  display: inline-flex;
  margin-bottom: 32px;
  color: var(--ns-color-text-muted);
  font-size: 14px;
  font-weight: 800;
}

.ffxiv-back:hover {
  color: var(--ns-color-accent-strong);
}

.ffxiv-page :deep(.ns-title) {
  max-width: 780px;
}

.ffxiv-page :deep(.ns-tool-grid) {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: minmax(260px, auto);
  align-items: stretch;
  gap: 18px;
}

.ffxiv-tool-card {
  --ffxiv-card-border: var(--ns-pixel-border);
  --ffxiv-card-shadow: var(--ns-pixel-button-shadow);
  --ffxiv-card-shadow-hover: var(--ns-pixel-button-shadow-hover);
  --ffxiv-card-shadow-active: var(--ns-pixel-soft-shadow);
  --ffxiv-card-surface: var(--ns-color-surface-solid);
  --ffxiv-card-surface-pink: var(--ns-pixel-pink-surface);
  --ffxiv-card-surface-blue: var(--ns-pixel-cyan-surface);
  --ffxiv-card-accent: var(--ns-color-accent);
  --ffxiv-card-blue: var(--ns-pixel-cyan-surface);
  --ffxiv-card-ink: var(--ns-color-text);
  --ffxiv-card-muted: var(--ns-color-text-muted);
  position: relative;
  display: grid;
  min-height: 260px;
  gap: 18px;
  padding: 18px;
  border: 2px solid var(--ffxiv-card-border);
  background: var(--ffxiv-card-surface);
  box-shadow: var(--ffxiv-card-shadow);
  color: var(--ffxiv-card-ink);
  transition:
    transform var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.ffxiv-tool-card:hover {
  transform: translate(-1px, -1px);
  box-shadow: var(--ffxiv-card-shadow-hover);
}

.ffxiv-tool-card:active {
  transform: translate(2px, 2px);
  box-shadow: var(--ffxiv-card-shadow-active);
}

.ffxiv-tool-card--plate {
  background: var(--ffxiv-card-surface);
}

.ffxiv-tool-card__main {
  display: grid;
  align-content: start;
  gap: 18px;
  min-width: 0;
}

.ffxiv-tool-card__badge {
  display: inline-flex;
  align-items: center;
  width: 100%;
  min-height: 42px;
  padding: 0 14px;
  border: 2px solid var(--ffxiv-card-border);
  background: var(--ffxiv-card-surface-pink);
  color: var(--ffxiv-card-ink);
  font-family: var(--ns-font-decorative);
  font-size: 15px;
  font-weight: 900;
  box-shadow: var(--ns-pixel-soft-shadow);
}

.ffxiv-tool-card--plate .ffxiv-tool-card__badge {
  background: var(--ffxiv-card-surface-blue);
}

.ffxiv-tool-card--armoire .ffxiv-tool-card__badge {
  background: var(--ns-status-success-bg);
}

.ffxiv-tool-card__title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: var(--ffxiv-card-ink);
  font-family: var(--ns-font-decorative);
  font-size: 28px;
  font-weight: 950;
  line-height: 1.12;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.ffxiv-tool-card__title-icon {
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  color: currentColor;
  filter: var(--ns-pixel-icon-filter);
  image-rendering: pixelated;
}

.ffxiv-tool-card__text {
  margin: 0;
  color: var(--ffxiv-card-muted);
  font-family: var(--ns-font-sans);
  font-size: 16px;
  font-weight: 650;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.ffxiv-tool-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 54px;
  margin-top: auto;
  padding: 0 16px;
  border: 2px solid var(--ffxiv-card-border);
  background: var(--ffxiv-card-accent);
  box-shadow: var(--ffxiv-card-shadow);
  color: var(--ns-color-on-accent);
  font-family: var(--ns-font-decorative);
  font-size: 17px;
  font-weight: 950;
  text-shadow: var(--ns-control-primary-text-shadow);
  transition:
    transform var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.ffxiv-tool-card--plate .ffxiv-tool-card__button {
  background: var(--ffxiv-card-blue);
  color: var(--ns-color-text);
  text-shadow: none;
}

.ffxiv-tool-card--armoire .ffxiv-tool-card__button {
  background: var(--ffxiv-card-surface);
  color: var(--ffxiv-card-ink);
  text-shadow: none;
}

.ffxiv-tool-card:hover .ffxiv-tool-card__button {
  transform: translate(-1px, -1px);
  box-shadow: var(--ffxiv-card-shadow-hover);
}

@media (max-width: 860px) {
  .ffxiv-page :deep(.ns-tool-grid) {
    grid-template-columns: 1fr;
  }

  .ffxiv-tool-card--primary {
    min-height: 260px;
  }
}

@media (max-width: 680px) {
  .ffxiv-page :deep(.ns-page-shell) {
    width: min(100%, calc(100vw - 24px));
  }

  .ffxiv-back {
    margin-bottom: 24px;
  }

  .ffxiv-tool-card,
  .ffxiv-tool-card--primary {
    min-height: 230px;
    padding: 16px;
  }

  .ffxiv-tool-card__title {
    font-size: 26px;
  }

  .ffxiv-tool-card__text {
    font-size: 15px;
  }
}
</style>
