<template>
  <section class="nsglamour-recent ns-panel" :class="`nsglamour-recent--${variant}`">
    <header v-if="showSave" class="nsglamour-panel-header">
      <h2 class="ns-heading-bloom">{{ t(textKeys.nsglamourRecentPanel) }}</h2>
      <AppButton size="compact" :disabled="disabled" @click="saveConfig">
        {{ t(textKeys.nsglamourSaveConfig) }}
      </AppButton>
    </header>

    <div class="nsglamour-recent__head">
      <span>{{ t(textKeys.nsglamourRecentPanel) }}</span>
      <button type="button" class="nsglamour-recent__clear" @click="emit('clear')">
        {{ t(textKeys.nsglamourRecentClear) }}
      </button>
    </div>

    <div class="nsglamour-recent__list">
      <p v-if="!items.length" class="nsglamour-recent__empty">
        {{ t(textKeys.nsglamourRecentEmpty) }}
      </p>
      <div v-for="item in items" :key="item.id" class="nsglamour-recent__row">
        <button type="button" class="nsglamour-recent__item" @click="emit('restore', item)">
          <strong>{{ item.displayName || item.sourceName || t(textKeys.nsglamourRecentUnnamed) }}</strong>
          <span>{{ formatRecentMeta(item) }}</span>
        </button>
        <button
          type="button"
          class="nsglamour-recent__delete"
          :title="t(textKeys.nsglamourRecentDelete)"
          :aria-label="formatDeleteLabel(item)"
          @click="emit('delete', item.id)"
        >
          {{ t(textKeys.nsglamourRecentDeleteSymbol) }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import { formatGlamourText } from '@/lib/glamour/formatText'
import {
  formatGlamourRecentTime,
  getGlamourRecentSnapshotCount,
  normalizeGlamourConfigName
} from '@/lib/glamour/recent'
import type { GlamourRecentSnapshot } from '@/lib/glamour/types'
import { useDialog } from '@/composables/useDialog'
import { useLocale } from '@/stores/locale'

const props = withDefaults(
  defineProps<{
    items: GlamourRecentSnapshot[]
    disabled?: boolean
    defaultName?: string
    variant?: 'panel' | 'popover'
    showSave?: boolean
  }>(),
  {
    disabled: false,
    defaultName: '',
    variant: 'panel',
    showSave: true
  }
)

const emit = defineEmits<{
  save: [name: string]
  restore: [item: GlamourRecentSnapshot]
  delete: [id: string]
  clear: []
}>()

const { t } = useLocale()
const dialog = useDialog()

async function saveConfig() {
  const name = await dialog.prompt(
    t(textKeys.nsglamourConfigNamePrompt),
    normalizeGlamourConfigName(props.defaultName)
  )

  if (name === null) {
    return
  }

  emit('save', normalizeGlamourConfigName(name))
}

function formatRecentMeta(item: GlamourRecentSnapshot): string {
  return formatGlamourText(t(textKeys.nsglamourRecentMeta), {
    count: getGlamourRecentSnapshotCount(item),
    time: formatGlamourRecentTime(item.savedAt)
  })
}

function formatDeleteLabel(item: GlamourRecentSnapshot): string {
  return formatGlamourText(t(textKeys.nsglamourRecentDeleteNamed), {
    name: item.displayName || item.sourceName || t(textKeys.nsglamourRecentUnnamed)
  })
}
</script>

<style scoped>
.nsglamour-recent {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.nsglamour-recent--popover {
  width: min(320px, calc(100vw - 48px));
  padding: 10px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-pixel-window-bg);
  box-shadow: var(--ns-pixel-window-shadow);
}

.nsglamour-recent--popover .nsglamour-panel-header h2 {
  font-family: var(--ns-font-sans);
  font-size: 13px;
}

.nsglamour-panel-header,
.nsglamour-recent__head {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.nsglamour-panel-header h2 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 16px;
  font-weight: 950;
}

.nsglamour-recent__head {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.nsglamour-recent__clear {
  padding: 4px 0 5px;
  border: 0;
  border-bottom: 1px solid var(--ns-color-border);
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text-muted);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.nsglamour-recent__clear:hover,
.nsglamour-recent__clear:focus {
  border-bottom-color: var(--ns-color-accent);
  color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-recent__list {
  display: grid;
  max-height: 260px;
  overflow-y: auto;
}

.nsglamour-recent__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px;
  align-items: stretch;
  border-bottom: 1px solid var(--ns-color-border);
}

.nsglamour-recent__item {
  display: grid;
  gap: 3px;
  min-width: 0;
  padding: 8px 2px 9px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.nsglamour-recent__item:hover,
.nsglamour-recent__item:focus {
  color: var(--ns-color-accent);
  outline: none;
}

.nsglamour-recent__item strong {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nsglamour-recent__item span,
.nsglamour-recent__empty {
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.nsglamour-recent__empty {
  margin: 0;
  padding: 12px 4px;
  text-align: center;
}

.nsglamour-recent__delete {
  align-self: center;
  justify-self: end;
  width: 24px;
  min-width: 24px;
  height: 24px;
  min-height: 24px;
  padding: 0 0 2px;
  border: 0;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text-muted);
  font: inherit;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.nsglamour-recent__delete:hover,
.nsglamour-recent__delete:focus {
  border-bottom-color: var(--ns-status-danger-border, #c2410c);
  color: var(--ns-status-danger-text, #b91c1c);
  outline: none;
}
</style>
