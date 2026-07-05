<template>
  <aside class="nsplate-selection-note" :data-open="isOpen">
    <button
      class="nsplate-selection-note__summary"
      type="button"
      :aria-label="summaryLabel"
      :aria-expanded="isOpen"
      :title="summaryLabel"
      @click="isOpen = !isOpen"
    >
      <span
        class="nsplate-selection-note__summary-icon"
        :style="summaryIconStyle"
        aria-hidden="true"
      />
      <span v-if="isOpen" class="nsplate-selection-note__title">{{ title }}</span>
      <span
        v-if="isOpen || hasSelected"
        class="nsplate-selection-note__count"
        :data-compact="!isOpen"
      >
        {{ progressLabel }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="nsplate-selection-note__body"
      :data-theme-mode="themeMode"
      role="group"
      :aria-label="summaryLabel"
    >
      <div class="nsplate-selection-note__page">
        <div class="nsplate-selection-note__items ns-scroll-area ns-scroll-area--compact">
          <div
            v-for="item in items"
            :key="item.id"
            class="nsplate-selection-note__row"
            :data-active="item.selected"
            :data-movable="item.movable === true"
          >
            <button
              class="nsplate-selection-note__entry"
              type="button"
              @click="emit('focus-item', item)"
            >
              <span class="nsplate-selection-note__mark" aria-hidden="true"></span>
              <span class="nsplate-selection-note__copy">
                <strong>{{ item.label }}</strong>
                <small>{{ item.valueLabel }}</small>
              </span>
            </button>

            <span v-if="item.movable" class="nsplate-selection-note__moves">
              <button
                type="button"
                :aria-label="t(textKeys.nsplateLayerOrderMoveUp)"
                :title="t(textKeys.nsplateLayerOrderMoveUp)"
                :disabled="!item.canMoveUp"
                @click.stop="emit('move-popout-layer', 'up')"
              >
                <span
                  class="nsplate-selection-note__move-icon nsplate-selection-note__move-icon--up"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                :aria-label="t(textKeys.nsplateLayerOrderMoveDown)"
                :title="t(textKeys.nsplateLayerOrderMoveDown)"
                :disabled="!item.canMoveDown"
                @click.stop="emit('move-popout-layer', 'down')"
              >
                <span
                  class="nsplate-selection-note__move-icon nsplate-selection-note__move-icon--down"
                  aria-hidden="true"
                />
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import circleIcon from '@/assets/icons/circle.svg'
import sparklesIcon from '@/assets/icons/sparkles.svg'
import { textKeys } from '@/config/site'
import type { NSPlateSelectionNoteItem } from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'

const props = defineProps<{
  title: string
  items: NSPlateSelectionNoteItem[]
}>()

const emit = defineEmits<{
  'focus-item': [value: NSPlateSelectionNoteItem]
  'move-popout-layer': [direction: 'up' | 'down']
}>()

const { t } = useLocale()
const { current: themeMode } = useTheme()
const isOpen = ref(false)
const activeCount = computed(() => props.items.filter((item) => item.selected).length)
const hasSelected = computed(() => activeCount.value > 0)
const progressLabel = computed(() => `${activeCount.value}/${props.items.length}`)
const summaryLabel = computed(() => `${props.title} ${progressLabel.value}`)
const summaryIconStyle = computed(
  () =>
    ({
      '--nsplate-selection-note-icon': `url("${activeCount.value > 0 ? sparklesIcon : circleIcon}")`
    }) as CSSProperties
)
</script>

<style scoped>
.nsplate-selection-note {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 2;
  display: grid;
  max-height: calc(100% - 24px);
  max-width: min(320px, calc(100% - 24px));
  justify-items: start;
  gap: 6px;
  --ns-notebook-cutout: color-mix(in srgb, var(--ns-color-bg-soft) 88%, var(--ns-color-cyan-soft));
}

.nsplate-selection-note[data-open='false'] {
  max-height: none;
}

.nsplate-selection-note__summary {
  display: inline-flex;
  min-width: 34px;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 8px;
  border: 2px solid var(--ns-notebook-border);
  background: var(--ns-notebook-paper);
  color: var(--ns-notebook-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  text-align: left;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.18);
  cursor: pointer;
}

.nsplate-selection-note[data-open='false'] .nsplate-selection-note__summary {
  justify-content: center;
  height: 32px;
  padding: 0 8px;
}

.nsplate-selection-note__summary-icon {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  background: currentColor;
  color: var(--ns-color-accent-strong);
  image-rendering: pixelated;
  mask: var(--nsplate-selection-note-icon) center / contain no-repeat;
  -webkit-mask: var(--nsplate-selection-note-icon) center / contain no-repeat;
}

.nsplate-selection-note__title {
  overflow: hidden;
  max-width: 138px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nsplate-selection-note__count {
  color: var(--ns-notebook-muted);
  font-family: var(--ns-font-mono);
  font-size: 11px;
}

.nsplate-selection-note__count[data-compact='true'] {
  color: var(--ns-notebook-ink);
  font-size: 10px;
  font-weight: 900;
}

.nsplate-selection-note__body {
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
  min-width: 236px;
  max-width: calc(100vw - 72px);
  min-height: 288px;
  border: 2px solid var(--app-notebook-border);
  background: var(--app-notebook-paper);
  color: var(--app-notebook-ink);
  font-family: var(--ns-font-decorative);
  box-shadow: var(--ns-notebook-shadow, 4px 4px 0 rgba(0, 0, 0, 0.18));
}

.nsplate-selection-note__body[data-theme-mode='night'] {
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

.nsplate-selection-note__body::before,
.nsplate-selection-note__body::after {
  position: absolute;
  top: -2px;
  left: -2px;
  width: var(--app-notebook-fold-size);
  height: var(--app-notebook-fold-size);
  content: '';
  pointer-events: none;
}

.nsplate-selection-note__body::before {
  z-index: 3;
  background: var(--app-notebook-cutout);
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.nsplate-selection-note__body::after {
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

.nsplate-selection-note__page,
.nsplate-selection-note__row {
  position: relative;
  z-index: 1;
}

.nsplate-selection-note__page {
  width: max-content;
  min-width: 236px;
  max-width: 304px;
  height: 288px;
  overflow: hidden;
  background: var(--app-notebook-paper);
}

.nsplate-selection-note__items {
  box-sizing: border-box;
  display: block;
  width: max-content;
  min-width: 236px;
  max-width: 304px;
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
  padding: 0 10px 0 22px;
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

.nsplate-selection-note__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: calc(var(--app-notebook-rule) * 2);
  align-items: start;
  gap: 4px;
}

.nsplate-selection-note__entry {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  min-width: 0;
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

.nsplate-selection-note__mark {
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

.nsplate-selection-note__row[data-active='true'] .nsplate-selection-note__mark {
  border-color: var(--app-notebook-accent);
  background: color-mix(in srgb, var(--app-notebook-accent) 20%, var(--app-notebook-mark-bg));
}

.nsplate-selection-note__entry:hover .nsplate-selection-note__mark,
.nsplate-selection-note__entry:focus-visible .nsplate-selection-note__mark {
  border-color: var(--app-notebook-accent);
}

.nsplate-selection-note__entry:focus-visible,
.nsplate-selection-note__moves button:focus-visible {
  outline: 2px solid var(--ns-focus-ring);
  outline-offset: 1px;
}

.nsplate-selection-note__copy {
  display: block;
  min-width: 0;
}

.nsplate-selection-note__copy strong,
.nsplate-selection-note__copy small {
  position: relative;
  display: block;
  height: var(--app-notebook-rule);
  min-width: 0;
  overflow: hidden;
  padding: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nsplate-selection-note__copy strong {
  color: var(--app-notebook-ink);
  font-size: 12px;
  font-weight: 900;
  line-height: var(--app-notebook-rule);
}

.nsplate-selection-note__copy small {
  color: var(--app-notebook-muted);
  font-size: 10.5px;
  font-weight: 900;
  line-height: var(--app-notebook-rule);
}

.nsplate-selection-note__moves {
  display: grid;
  grid-template-columns: repeat(2, calc(var(--app-notebook-rule) + 1px));
  align-self: start;
  gap: 1px;
  height: calc(var(--app-notebook-rule) + 1px);
  margin-right: 2px;
  margin-top: -2px;
  transform: translateX(-12px);
}

.nsplate-selection-note__moves button {
  box-sizing: border-box;
  display: grid;
  width: calc(var(--app-notebook-rule) + 1px);
  height: calc(var(--app-notebook-rule) + 1px);
  padding: 0;
  place-items: center;
  border: 1px solid var(--app-notebook-border);
  appearance: none;
  background: var(--app-notebook-paper);
  color: var(--app-notebook-ink);
  cursor: pointer;
}

.nsplate-selection-note__move-icon {
  display: block;
  width: 14px;
  height: 14px;
  background-repeat: no-repeat;
  color: currentColor;
  image-rendering: pixelated;
}

.nsplate-selection-note__move-icon--up {
  background:
    linear-gradient(currentColor 0 0) 6px 0 / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 4px 2px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 2px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 8px 2px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 2px 4px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 4px 4px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 4px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 8px 4px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 10px 4px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 0 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 2px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 4px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 8px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 10px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 12px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 8px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 10px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 12px / 2px 2px no-repeat;
}

.nsplate-selection-note__move-icon--down {
  background:
    linear-gradient(currentColor 0 0) 6px 0 / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 2px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 4px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 0 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 2px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 4px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 8px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 10px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 12px 6px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 2px 8px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 4px 8px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 8px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 8px 8px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 10px 8px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 4px 10px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 10px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 8px 10px / 2px 2px no-repeat,
    linear-gradient(currentColor 0 0) 6px 12px / 2px 2px no-repeat;
}

.nsplate-selection-note__moves button:disabled {
  opacity: 0.36;
  cursor: default;
}

@media (max-width: 980px) {
  .nsplate-selection-note {
    display: none;
  }
}
</style>
