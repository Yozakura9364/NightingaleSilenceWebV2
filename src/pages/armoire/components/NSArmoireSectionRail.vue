<template>
  <nav class="nsarmoire-section-rail" :aria-label="t(textKeys.nsarmoireSectionNavigation)">
    <div class="nsarmoire-section-rail__list">
      <button
        v-for="item in items"
        :key="item.id"
        class="nsarmoire-section-rail__item"
        :class="[
          `nsarmoire-section-rail__item--${item.id}`,
          { 'nsarmoire-section-rail__item--active': item.id === activeSection }
        ]"
        type="button"
        :aria-label="t(item.labelKey)"
        :aria-current="item.id === activeSection ? 'page' : undefined"
        :title="t(item.labelKey)"
        @click="emit('update:activeSection', item.id)"
      >
        <span
          class="nsarmoire-section-rail__icon"
          :style="getIconStyle(item.id)"
          aria-hidden="true"
        ></span>
        <span class="nsarmoire-section-rail__label">
          {{ t(item.labelKey) }}
        </span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import archiveIcon from '@/assets/icons/pixelarticons/archive.svg'
import broomIcon from '@/assets/icons/pixelarticons/broom.svg'
import userIcon from '@/assets/icons/pixelarticons/user.svg'
import { textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

interface NSArmoireSectionRailItem {
  id: string
  labelKey: string
  shortLabelKey: string
}

defineProps<{
  items: NSArmoireSectionRailItem[]
  activeSection: string
}>()

const emit = defineEmits<{
  'update:activeSection': [value: string]
}>()

const iconStyleBySectionId: Record<string, { '--nsarmoire-section-icon-url': string }> = {
  cleanup: { '--nsarmoire-section-icon-url': `url("${broomIcon}")` },
  collection: { '--nsarmoire-section-icon-url': `url("${archiveIcon}")` },
  characters: { '--nsarmoire-section-icon-url': `url("${userIcon}")` }
}

function getIconStyle(sectionId: string) {
  return iconStyleBySectionId[sectionId] ?? null
}

const { t } = useLocale()
</script>

<style scoped>
.nsarmoire-section-rail {
  --nsarmoire-section-rail-font:
    'NS Fusion Pixel Trial', 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;

  display: grid;
  grid-template-rows: 1fr;
  min-width: 0;
  gap: 7px;
  min-height: calc(100vh - 58px);
  padding: 14px 4px;
  border-right: 2px solid var(--ns-pixel-border-soft);
  background: #fff0fb;
}

.nsarmoire-section-rail__list {
  display: grid;
  align-content: center;
  gap: 8px;
  min-width: 0;
}

.nsarmoire-section-rail__item {
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  min-width: 0;
  min-height: 42px;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: rgba(255, 255, 255, 0.92);
  color: var(--ns-color-text-muted);
  font-family: var(--nsarmoire-section-rail-font);
  font-size: 12px;
  font-weight: 950;
  line-height: 1.2;
  text-align: left;
  cursor: pointer;
  transition:
    background var(--ns-transition-fast),
    border-color var(--ns-transition-fast),
    color var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast),
    transform var(--ns-transition-fast),
    width var(--ns-transition-fast);
}

.nsarmoire-section-rail__item::after {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: -2px;
  width: 3px;
  background: var(--ns-color-accent);
  box-shadow: 2px 0 0 var(--ns-color-cyan);
  content: '';
  opacity: 0;
  transform: translateX(-2px);
  transition:
    opacity var(--ns-transition-fast),
    transform var(--ns-transition-fast);
}

.nsarmoire-section-rail__item:hover,
.nsarmoire-section-rail__item--active {
  border-color: var(--ns-pixel-border);
  color: var(--ns-color-accent-strong);
}

.nsarmoire-section-rail__item:hover {
  background: var(--ns-pixel-hover-surface);
  box-shadow: var(--ns-pixel-button-shadow-hover);
  transform: translate(-2px, -2px);
}

.nsarmoire-section-rail__item--active {
  background: var(--ns-pixel-cyan-surface);
  box-shadow: var(--ns-pixel-button-shadow);
  transform: translate(-1px, -1px);
}

.nsarmoire-section-rail__item:hover::after,
.nsarmoire-section-rail__item--active::after {
  opacity: 1;
  transform: translateX(0);
}

.nsarmoire-section-rail__item:active {
  box-shadow: var(--ns-pixel-soft-shadow);
  transform: translate(1px, 1px);
}

.nsarmoire-section-rail__item:focus-visible {
  outline: 0;
  box-shadow: var(--ns-focus-ring);
}

.nsarmoire-section-rail__icon {
  display: grid;
  place-items: center;
  justify-self: center;
  align-self: center;
  width: 22px;
  height: 22px;
  line-height: 0;
  transition:
    color var(--ns-transition-fast),
    filter var(--ns-transition-fast),
    transform var(--ns-transition-fast);
}

.nsarmoire-section-rail__icon::before {
  display: block;
  width: 18px;
  height: 18px;
  background: currentColor;
  content: '';
  mask: var(--nsarmoire-section-icon-url) center / contain no-repeat;
  -webkit-mask: var(--nsarmoire-section-icon-url) center / contain no-repeat;
}

.nsarmoire-section-rail__item:hover .nsarmoire-section-rail__icon,
.nsarmoire-section-rail__item:focus-visible .nsarmoire-section-rail__icon {
  filter: drop-shadow(2px 2px 0 rgba(42, 33, 56, 0.14));
  transform: translate(-1px, -1px) rotate(-4deg) scale(1.08);
}

.nsarmoire-section-rail__item--active .nsarmoire-section-rail__icon {
  color: var(--ns-color-accent-strong);
  filter: drop-shadow(2px 2px 0 rgba(42, 33, 56, 0.12));
}

.nsarmoire-section-rail__label {
  min-width: 0;
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    max-width var(--ns-transition-fast),
    opacity var(--ns-transition-fast);
}

@media (min-width: 981px) {
  .nsarmoire-section-rail {
    position: fixed;
    top: 58px;
    bottom: 0;
    left: 0;
    z-index: 20;
    align-self: start;
    width: 48px;
    height: calc(100vh - 58px);
    min-height: 0;
    overflow-y: auto;
    transition:
      width var(--ns-transition-fast),
      box-shadow var(--ns-transition-fast);
  }

  .nsarmoire-section-rail:hover {
    width: 116px;
    box-shadow: 4px 0 0 rgba(42, 33, 56, 0.08);
  }

  .nsarmoire-section-rail__item {
    grid-template-columns: 22px 0;
    gap: 0;
    justify-content: center;
    justify-items: center;
    width: 36px;
    padding: 5px;
    overflow: hidden;
  }

  .nsarmoire-section-rail:hover .nsarmoire-section-rail__item {
    grid-template-columns: 22px minmax(0, 1fr);
    gap: 7px;
    width: 100%;
    justify-content: start;
    justify-items: start;
  }

  .nsarmoire-section-rail:hover .nsarmoire-section-rail__label {
    max-width: 72px;
    opacity: 1;
  }
}

@media (max-width: 980px) {
  .nsarmoire-section-rail {
    grid-template-rows: auto;
    min-height: 0;
    padding: 8px;
    border: 2px solid var(--ns-pixel-border);
    background: var(--ns-pixel-surface);
  }

  .nsarmoire-section-rail__list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .nsarmoire-section-rail__item {
    justify-content: start;
  }

  .nsarmoire-section-rail__label {
    max-width: none;
    opacity: 1;
  }
}

@media (max-width: 520px) {
  .nsarmoire-section-rail__item {
    gap: 6px;
    padding-inline: 7px;
    font-size: 11px;
  }

  .nsarmoire-section-rail__icon {
    width: 22px;
    height: 22px;
  }

  .nsarmoire-section-rail__icon::before {
    width: 18px;
    height: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nsarmoire-section-rail,
  .nsarmoire-section-rail__item,
  .nsarmoire-section-rail__item::after,
  .nsarmoire-section-rail__icon,
  .nsarmoire-section-rail__label {
    transition-duration: 0.01ms;
  }

  .nsarmoire-section-rail__item:hover,
  .nsarmoire-section-rail__item--active,
  .nsarmoire-section-rail__item:active,
  .nsarmoire-section-rail__item:hover .nsarmoire-section-rail__icon,
  .nsarmoire-section-rail__item:focus-visible .nsarmoire-section-rail__icon {
    transform: none;
  }
}
</style>
