<template>
  <section class="ns-recent-panel ns-panel" :class="`ns-recent-panel--${variant}`">
    <header class="ns-recent-panel__header">
      <h2 class="ns-heading-bloom">{{ t(textKeys.nsglamourRecentPanel) }}</h2>
      <AppButton v-if="showSave" size="compact" :disabled="disabled" @click="saveConfig">
        {{ t(textKeys.nsglamourSaveConfig) }}
      </AppButton>
    </header>

    <div class="ns-recent-panel__list">
      <p v-if="!items.length" class="ns-recent-panel__empty">
        {{ t(textKeys.nsglamourRecentEmpty) }}
      </p>
      <div v-for="item in items" :key="item.id" class="ns-recent-panel__row">
        <button type="button" class="ns-recent-panel__item" @click="emit('restore', item)">
          <strong>{{
            item.displayName || item.sourceName || t(textKeys.nsglamourRecentUnnamed)
          }}</strong>
          <span>{{ formatRecentMeta(item) }}</span>
        </button>
        <button
          type="button"
          class="ns-recent-panel__delete"
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
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { formatGlamourText } from '@/lib/glamour/formatText'
import {
  formatGlamourRecentTime,
  getGlamourRecentSnapshotCount,
  normalizeGlamourConfigName
} from '@/pages/item-card/lib/recent'
import type { GlamourRecentSnapshot } from '@/pages/item-card/lib/types'
import { useLocale } from '@/stores/locale'
import { useDialog } from '@/composables/useDialog'

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
