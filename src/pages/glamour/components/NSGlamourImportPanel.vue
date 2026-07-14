<template>
  <section ref="rootEl" class="nsglamour-import ns-panel">
    <header class="nsglamour-panel-header">
      <h2 class="ns-heading-bloom">{{ t(textKeys.nsglamourImportPanel) }}</h2>
      <div class="nsglamour-import__recent">
        <button
          type="button"
          class="nsglamour-import__recent-button ns-icon-button"
          :title="t(textKeys.nsglamourRecentPanel)"
          :aria-label="t(textKeys.nsglamourRecentPanel)"
          aria-haspopup="dialog"
          :aria-expanded="recentOpen ? 'true' : 'false'"
          @click.stop="toggleRecent"
        >
          <img :src="recentIconUrl" alt="" aria-hidden="true" />
        </button>

        <NSGlamourRecentPanel
          v-if="recentOpen"
          class="nsglamour-import__recent-panel"
          variant="popover"
          :items="recentItems"
          :disabled="busy"
          :default-name="recentDefaultName"
          @save="emit('save-recent', $event)"
          @restore="restoreRecent"
          @delete="emit('delete-recent', $event)"
          @clear="emit('clear-recent')"
        />
      </div>
    </header>

    <div class="nsglamour-import__form">
      <AppField :label="t(textKeys.nsglamourImportLinkLabel)" for-id="nsglamour-import-url">
        <form
          class="nsglamour-import__link-row"
          @submit.prevent="submitLink"
          @dragover="handleDragOver"
          @drop="handleDrop"
        >
          <input
            id="nsglamour-import-url"
            v-model="url"
            type="text"
            inputmode="url"
            autocomplete="url"
            :disabled="props.busy"
            :placeholder="t(textKeys.nsglamourImportLinkPlaceholder)"
            spellcheck="false"
          />
          <AppButton :disabled="props.busy" @click="submitLink">
            {{ t(textKeys.nsglamourImportReadLink) }}
          </AppButton>
        </form>
      </AppField>

      <form class="nsglamour-import__text-form" @submit.prevent="submitText">
        <AppField :label="t(textKeys.nsglamourImportSourceLocale)" for-id="nsglamour-source-locale">
          <select id="nsglamour-source-locale" v-model="sourceLocale" :disabled="props.busy">
            <option v-for="option in sourceLocaleOptions" :key="option.value" :value="option.value">
              {{ t(option.labelKey) }}
            </option>
          </select>
        </AppField>

        <AppField :label="t(textKeys.nsglamourImportTextLabel)" for-id="nsglamour-import-text">
          <textarea
            id="nsglamour-import-text"
            v-model="text"
            :disabled="props.busy"
            :placeholder="t(textKeys.nsglamourImportTextPlaceholder)"
            rows="7"
          />
        </AppField>

        <AppToolbar :aria-label="t(textKeys.nsglamourImportPanel)" density="compact">
          <AppButton variant="primary" :disabled="props.busy" @click="submitText">
            {{ t(textKeys.nsglamourImportParseText) }}
          </AppButton>
          <AppButton variant="ghost" :disabled="props.busy" @click="$emit('clear')">
            {{ t(textKeys.nsglamourClearDraft) }}
          </AppButton>
        </AppToolbar>
      </form>
    </div>

    <AppStatus
      v-if="props.statusMessage"
      class="nsglamour-import__status"
      compact
      :tone="props.statusTone"
      :message="props.statusMessage"
    />
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppField from '@/components/AppField.vue'
import AppStatus from '@/components/AppStatus.vue'
import AppToolbar from '@/components/AppToolbar.vue'
import recentIconUrl from '@/assets/icons/pixelarticons/clock.svg'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import { normalizeGlamourLinkUrl } from '@/lib/glamour/links'
import type { GlamourRecentSnapshot } from '@/lib/glamour/types'
import NSGlamourRecentPanel from '@/pages/glamour/components/NSGlamourRecentPanel.vue'
import { useLocale } from '@/stores/locale'

const props = withDefaults(
  defineProps<{
    busy?: boolean
    statusMessage?: string
    statusTone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'
    recentItems?: GlamourRecentSnapshot[]
    recentDefaultName?: string
  }>(),
  {
    busy: false,
    statusTone: 'neutral',
    recentItems: () => [],
    recentDefaultName: ''
  }
)

const emit = defineEmits<{
  'import-link': [payload: { url: string }]
  'parse-text': [payload: { text: string; sourceLocale: string }]
  'parse-chara': [file: File]
  'save-recent': [name: string]
  'restore-recent': [item: GlamourRecentSnapshot]
  'delete-recent': [id: string]
  'clear-recent': []
  clear: []
}>()

const { t } = useLocale()
const rootEl = ref<HTMLElement | null>(null)
const recentOpen = ref(false)
const url = ref('')
const text = ref('')
const sourceLocale = ref('zh')

const sourceLocaleOptions = [
  { value: 'zh', labelKey: textKeys.nsglamourLocaleZh },
  { value: 'en', labelKey: textKeys.nsglamourLocaleEn },
  { value: 'ja', labelKey: textKeys.nsglamourLocaleJa },
  { value: 'ko', labelKey: textKeys.nsglamourLocaleKo },
  { value: 'tc', labelKey: textKeys.nsglamourLocaleTc },
  { value: 'fr', labelKey: textKeys.nsglamourLocaleFr },
  { value: 'de', labelKey: textKeys.nsglamourLocaleDe }
] as const

function submitText() {
  emit('parse-text', { text: text.value, sourceLocale: sourceLocale.value })
}

function submitLink() {
  emit('import-link', { url: normalizeGlamourLinkUrl(url.value) })
}

function handleDragOver(event: DragEvent) {
  if (!hasDraggedFiles(event)) {
    return
  }

  event.preventDefault()

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = props.busy ? 'none' : 'copy'
  }
}

function handleDrop(event: DragEvent) {
  if (!hasDraggedFiles(event)) {
    return
  }

  event.preventDefault()

  if (props.busy) {
    return
  }

  const file = event.dataTransfer?.files?.[0]

  if (file) {
    emit('parse-chara', file)
  }
}

function toggleRecent() {
  recentOpen.value = !recentOpen.value
}

function closeRecent() {
  recentOpen.value = false
}

function restoreRecent(item: GlamourRecentSnapshot) {
  emit('restore-recent', item)
  closeRecent()
}

function handleDocumentClick(event: MouseEvent) {
  if (!rootEl.value || rootEl.value.contains(event.target as Node)) {
    return
  }

  closeRecent()
}

function hasDraggedFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.nsglamour-import {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.nsglamour-panel-header {
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

.nsglamour-import__recent {
  position: relative;
  display: inline-flex;
  align-self: center;
  justify-self: end;
}

.nsglamour-import__recent-button {
  width: 30px;
  min-width: 30px;
  height: 30px;
  min-height: 30px;
}

.nsglamour-import__recent-button img {
  display: block;
  width: 18px;
  height: 18px;
  filter: var(--ns-pixel-icon-filter);
}

.nsglamour-import__recent-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 9;
}

.nsglamour-import__form,
.nsglamour-import__text-form {
  display: grid;
  gap: 12px;
}

.nsglamour-import__status {
  min-height: 0;
  padding: 4px 0 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.nsglamour-import__status :deep(.app-status__mark) {
  width: 8px;
  height: 8px;
  border-width: 2px;
}

.nsglamour-import__status :deep(.app-status__message) {
  font-size: 12px;
}

.nsglamour-import__link-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: end;
}

@media (max-width: 640px) {
  .nsglamour-import__recent-panel {
    right: -2px;
  }

  .nsglamour-import__link-row {
    grid-template-columns: 1fr;
  }
}
</style>
