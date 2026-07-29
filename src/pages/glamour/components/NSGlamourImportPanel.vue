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

    <form
      v-if="linkImportVisible"
      class="nsglamour-import__link-row"
      @submit.prevent="submitLink"
    >
      <input
        v-model="url"
        type="text"
        inputmode="url"
        autocomplete="url"
        :disabled="props.busy"
        :placeholder="t(textKeys.nsglamourImportLinkPlaceholder)"
        spellcheck="false"
      />
      <AppButton size="compact" :disabled="props.busy" @click="submitLink">
        {{ t(textKeys.nsglamourImportReadLink) }}
      </AppButton>
    </form>

    <form
      class="nsglamour-import__text-form"
      :class="{ 'is-dragover': charaDragover }"
      @submit.prevent="submitText"
      @dragenter="handleDragOver"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="nsglamour-import__controls">
        <label class="nsglamour-import__locale" for="nsglamour-source-locale">
          <span>{{ t(textKeys.nsglamourImportSourceLocale) }}</span>
          <select id="nsglamour-source-locale" v-model="sourceLocale" :disabled="props.busy">
            <option v-for="option in sourceLocaleOptions" :key="option.value" :value="option.value">
              {{ t(option.labelKey) }}
            </option>
          </select>
        </label>
        <div class="nsglamour-import__actions">
          <AppButton size="compact" variant="ghost" :disabled="props.busy" @click="$emit('clear')">
            {{ t(textKeys.nsglamourClearDraft) }}
          </AppButton>
          <AppButton size="compact" variant="primary" :disabled="props.busy" @click="submitText">
            {{ t(textKeys.nsglamourImportParseText) }}
          </AppButton>
        </div>
      </div>

      <label class="nsglamour-import__editor-label" for="nsglamour-import-text">
        {{ t(textKeys.nsglamourImportTextLabel) }}
      </label>
      <div class="nsglamour-import__editor">
        <pre ref="lineNumbersEl" class="nsglamour-import__line-numbers" aria-hidden="true">{{ lineNumbers }}</pre>
        <textarea
          id="nsglamour-import-text"
          v-model="text"
          :disabled="props.busy"
          :placeholder="t(textKeys.nsglamourImportTextPlaceholder)"
          rows="7"
          @scroll="syncLineNumbers"
        />
      </div>
    </form>

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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppStatus from '@/components/AppStatus.vue'
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
const lineNumbersEl = ref<HTMLElement | null>(null)
const linkImportVisible = false
const recentOpen = ref(false)
const url = ref('')
const text = ref('')
const sourceLocale = ref('zh')
const charaDragover = ref(false)
const lineNumbers = computed(() => {
  const count = Math.max(1, text.value.split('\n').length)
  return Array.from({ length: count }, (_, index) => index + 1).join('\n')
})

const sourceLocaleOptions = [
  { value: 'ja', labelKey: textKeys.nsglamourLocaleJa },
  { value: 'en', labelKey: textKeys.nsglamourLocaleEn },
  { value: 'fr', labelKey: textKeys.nsglamourLocaleFr },
  { value: 'de', labelKey: textKeys.nsglamourLocaleDe },
  { value: 'zh', labelKey: textKeys.nsglamourLocaleZh },
  { value: 'tc', labelKey: textKeys.nsglamourLocaleTc },
  { value: 'ko', labelKey: textKeys.nsglamourLocaleKo }
] as const

function submitText() {
  emit('parse-text', { text: text.value, sourceLocale: sourceLocale.value })
}

// Kept for restoring the external-link UI after the upstream access issue is resolved.
function submitLink() {
  emit('import-link', { url: normalizeGlamourLinkUrl(url.value) })
}

function handleDragOver(event: DragEvent) {
  if (!hasDraggedFiles(event)) {
    return
  }

  event.preventDefault()
  charaDragover.value = !props.busy

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = props.busy ? 'none' : 'copy'
  }
}

function handleDragLeave(event: DragEvent) {
  if (event.currentTarget === event.target) {
    charaDragover.value = false
  }
}

function handleDrop(event: DragEvent) {
  if (!hasDraggedFiles(event)) {
    return
  }

  event.preventDefault()
  charaDragover.value = false

  if (props.busy) {
    return
  }

  const file = event.dataTransfer?.files?.[0]

  if (file) {
    emit('parse-chara', file)
  }
}

function syncLineNumbers(event: Event) {
  if (lineNumbersEl.value) {
    lineNumbersEl.value.scrollTop = (event.currentTarget as HTMLTextAreaElement).scrollTop
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
  padding: 12px;
  border: 1px solid var(--ns-color-border, #d8d8d8);
  border-radius: 8px;
  background: var(--ns-color-surface-solid, #fff);
  box-shadow: 0 6px 18px rgb(20 28 45 / 6%);
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
  font-family: var(--ns-font-ui);
  font-size: 15px;
  font-weight: 700;
}

.nsglamour-panel-header {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
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

.nsglamour-import__text-form {
  display: grid;
  gap: 8px;
  position: relative;
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

.nsglamour-import__controls,
.nsglamour-import__actions,
.nsglamour-import__locale {
  display: flex;
  align-items: center;
}

.nsglamour-import__link-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.nsglamour-import__controls {
  justify-content: flex-end;
  gap: 12px;
}

.nsglamour-import__actions,
.nsglamour-import__locale {
  gap: 8px;
}

.nsglamour-import__locale span,
.nsglamour-import__editor-label {
  color: var(--ns-color-text-muted, #777);
  font-size: 12px;
  font-weight: 700;
}

.nsglamour-import__locale select {
  min-width: 92px;
  height: 30px;
  border: 0;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: 12px/1.35 var(--ns-font-ui);
}

.nsglamour-import__editor {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  min-height: clamp(180px, 26vh, 270px);
  overflow: hidden;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
}

.nsglamour-import__line-numbers {
  min-width: 44px;
  height: 100%;
  margin: 0;
  padding: 9px 8px 9px 10px;
  overflow: hidden;
  border-right: 1px solid var(--ns-color-border, #d8d8d8);
  color: var(--ns-color-text-muted, #777);
  font: 12px/1.35 var(--ns-font-mono, monospace);
  text-align: right;
  user-select: none;
}

.nsglamour-import__editor textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: clamp(180px, 26vh, 270px);
  padding: 9px 10px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: 12px/1.35 var(--ns-font-mono, monospace);
  outline: none;
  resize: vertical;
  white-space: pre;
}

.nsglamour-import__editor:focus-within {
  border-bottom-color: var(--ns-color-accent, #d97706);
}

.nsglamour-import__text-form.is-dragover .nsglamour-import__editor {
  outline: 1px dashed var(--ns-color-accent, #d97706);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--ns-color-accent, #d97706) 7%, transparent);
}

@media (max-width: 640px) {
  .nsglamour-import__recent-panel {
    right: -2px;
  }

  .nsglamour-import__controls {
    align-items: stretch;
    flex-direction: column;
  }

  .nsglamour-import__locale,
  .nsglamour-import__actions {
    justify-content: flex-end;
  }
}
</style>
