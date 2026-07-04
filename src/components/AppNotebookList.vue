<template>
  <div
    class="app-notebook-list"
    :style="notebookStyle"
    :data-theme-mode="themeMode"
    role="group"
    :aria-label="ariaLabel"
  >
    <div class="app-notebook-list__body">
      <div class="app-notebook-list__items ns-scroll-area ns-scroll-area--compact">
        <button
          v-for="item in items"
          :key="item.id"
          class="app-notebook-list__entry"
          :class="{ 'app-notebook-list__entry--muted': !item.active }"
          type="button"
          :disabled="item.disabled"
          @click="$emit('select', item)"
        >
          <span class="app-notebook-list__mark" aria-hidden="true"></span>
          <span class="app-notebook-list__copy">
            <strong>{{ item.label }}</strong>
            <small v-if="item.value">{{ item.value }}</small>
          </span>
        </button>

        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { useTheme } from '@/stores/theme'

type NotebookItem = {
  id: string
  label: string
  value?: string
  active?: boolean
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    items?: NotebookItem[]
    ariaLabel?: string
    height?: number
    mobileHeight?: number
    minWidth?: number
    maxWidth?: number
  }>(),
  {
    items: () => [],
    height: 312,
    mobileHeight: 282,
    minWidth: 214,
    maxWidth: 300
  }
)
const { current: themeMode } = useTheme()

defineEmits<{
  select: [item: NotebookItem]
}>()

const notebookStyle = computed(
  () =>
    ({
      '--app-notebook-height': `${props.height}px`,
      '--app-notebook-mobile-height': `${props.mobileHeight}px`,
      '--app-notebook-min-width': `${props.minWidth}px`,
      '--app-notebook-max-width': `${props.maxWidth}px`
    }) as CSSProperties
)
</script>

<style scoped>
.app-notebook-list {
  --app-notebook-ink: var(--ns-notebook-ink, #141414);
  --app-notebook-muted: var(--ns-notebook-muted, #655f6f);
  --app-notebook-line: var(--ns-notebook-line, rgba(0, 0, 0, 0.58));
  --app-notebook-paper: var(--ns-notebook-paper, #fffdf7);
  --app-notebook-fold: var(--ns-notebook-fold, #ece7f1);
  --app-notebook-fold-shadow: var(--ns-notebook-fold-shadow, rgba(70, 60, 84, 0.18));
  --app-notebook-border: var(--ns-notebook-border, #000);
  --app-notebook-cutout: var(--ns-notebook-cutout, var(--ns-pixel-window-bg));
  --app-notebook-mark-bg: var(--ns-notebook-mark-bg, var(--app-notebook-paper));
  --app-notebook-rule: 22px;
  --app-notebook-fold-size: 18px;
  --app-notebook-accent: var(--ns-notebook-accent);
  position: relative;
  display: grid;
  width: max-content;
  min-width: var(--app-notebook-min-width);
  max-width: calc(100vw - 72px);
  min-height: var(--app-notebook-height);
  margin: 10px 12px 14px;
  border: 2px solid var(--app-notebook-border);
  background: var(--app-notebook-paper);
  color: var(--app-notebook-ink);
  font-family: var(--ns-font-decorative);
  box-shadow: var(--ns-notebook-shadow, 4px 4px 0 rgba(0, 0, 0, 0.18));
}

.app-notebook-list[data-theme-mode='night'] {
  --app-notebook-ink: var(--ns-notebook-ink, #f0eefc);
  --app-notebook-muted: var(--ns-notebook-muted, #8f98b8);
  --app-notebook-line: var(--ns-notebook-line, rgba(102, 244, 255, 0.48));
  --app-notebook-paper: var(--ns-notebook-paper, #10141f);
  --app-notebook-fold: var(--ns-notebook-fold, #252034);
  --app-notebook-fold-shadow: var(--ns-notebook-fold-shadow, rgba(0, 0, 0, 0.38));
  --app-notebook-border: var(--ns-notebook-border, #000);
  --app-notebook-cutout: var(--ns-notebook-cutout, var(--ns-pixel-window-bg));
  --app-notebook-mark-bg: var(--ns-notebook-mark-bg, rgba(17, 22, 34, 0.96));
  --app-notebook-accent: var(--ns-notebook-accent, var(--ns-color-cyan));
  box-shadow:
    4px 4px 0 rgba(0, 0, 0, 0.64),
    inset 0 0 0 1px rgba(102, 244, 255, 0.18),
    0 0 26px rgba(102, 244, 255, 0.18);
}

.app-notebook-list::before,
.app-notebook-list::after {
  position: absolute;
  top: -2px;
  left: -2px;
  width: var(--app-notebook-fold-size);
  height: var(--app-notebook-fold-size);
  content: '';
  pointer-events: none;
}

.app-notebook-list::before {
  z-index: 3;
  background: var(--app-notebook-cutout);
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.app-notebook-list::after {
  z-index: 4;
  background:
    linear-gradient(225deg, rgba(255, 255, 255, 0.48), transparent 44%),
    linear-gradient(45deg, var(--app-notebook-fold-shadow), transparent 46%),
    linear-gradient(to left, var(--app-notebook-border) 0 2px, transparent 2px),
    linear-gradient(to top, var(--app-notebook-border) 0 2px, transparent 2px),
    linear-gradient(
      135deg,
      transparent 0 calc(50% - 1px),
      var(--app-notebook-border) calc(50% - 1px) calc(50% + 1px),
      transparent calc(50% + 1px)
    ),
    var(--app-notebook-fold);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
}

.app-notebook-list__body,
.app-notebook-list__entry {
  position: relative;
  z-index: 1;
}

.app-notebook-list__body {
  width: max-content;
  min-width: var(--app-notebook-min-width);
  max-width: var(--app-notebook-max-width);
  height: var(--app-notebook-height);
  overflow: hidden;
  background: var(--app-notebook-paper);
}

.app-notebook-list__items {
  box-sizing: border-box;
  display: block;
  width: max-content;
  min-width: var(--app-notebook-min-width);
  max-width: var(--app-notebook-max-width);
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
  padding: 0 14px 0 22px;
  background-color: var(--app-notebook-paper);
  background-image: linear-gradient(
    to bottom,
    transparent 0 calc(var(--app-notebook-rule) - 2px),
    var(--app-notebook-line) calc(var(--app-notebook-rule) - 2px)
      calc(var(--app-notebook-rule) - 1px),
    transparent calc(var(--app-notebook-rule) - 1px) var(--app-notebook-rule)
  );
  background-attachment: local;
  background-position: 22px 0;
  background-repeat: repeat-y;
  background-size: calc(100% - 46px) var(--app-notebook-rule);
}

.app-notebook-list__entry {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  min-height: calc(var(--app-notebook-rule) * 2);
  align-items: start;
  gap: 5px;
  padding: 0 2px 0 0;
  border: 0;
  background: transparent;
  color: var(--app-notebook-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.app-notebook-list__entry:disabled {
  cursor: default;
}

.app-notebook-list__mark {
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border: 2px solid var(--app-notebook-muted);
  background: var(--app-notebook-mark-bg);
  clip-path: polygon(
    0 25%,
    25% 25%,
    25% 0,
    75% 0,
    75% 25%,
    100% 25%,
    100% 75%,
    75% 75%,
    75% 100%,
    25% 100%,
    25% 75%,
    0 75%
  );
}

.app-notebook-list__entry:hover .app-notebook-list__mark,
.app-notebook-list__entry:focus-visible .app-notebook-list__mark {
  border-color: var(--app-notebook-accent);
}

.app-notebook-list__entry:focus-visible {
  outline: 0;
}

.app-notebook-list__copy {
  display: block;
  min-width: 0;
}

.app-notebook-list__copy strong,
.app-notebook-list__copy small {
  position: relative;
  display: block;
  height: var(--app-notebook-rule);
  min-width: 0;
  overflow: hidden;
  padding: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.app-notebook-list__copy strong {
  color: var(--app-notebook-ink);
  font-size: 12px;
  font-weight: 900;
  line-height: var(--app-notebook-rule);
}

.app-notebook-list__copy small {
  color: var(--app-notebook-muted);
  font-size: 10.5px;
  font-weight: 900;
  line-height: var(--app-notebook-rule);
}

@media (max-width: 620px) {
  .app-notebook-list {
    min-height: var(--app-notebook-mobile-height);
    margin: 10px 8px 12px;
  }

  .app-notebook-list__body {
    height: var(--app-notebook-mobile-height);
  }
}
</style>
