<template>
  <div
    class="item-card-text-import"
    aria-modal="true"
    role="dialog"
    :aria-labelledby="titleId"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <form class="item-card-text-import__dialog" @submit.prevent="emit('submit')">
      <header>
        <h2 :id="titleId">{{ t(textKeys.importTextTitle) }}</h2>
        <button type="button" @click="emit('close')">
          {{ t(textKeys.importClose) }}
        </button>
      </header>

      <label>
        <span>{{ t(textKeys.importTextSourceLocale) }}</span>
        <select
          :value="sourceLocale"
          :disabled="busy"
          @change="emit('update:source-locale', ($event.currentTarget as HTMLSelectElement).value)"
        >
          <option v-for="option in localeOptions" :key="option.value" :value="option.value">
            {{ t(option.labelKey) }}
          </option>
        </select>
      </label>

      <label>
        <span>{{ t(textKeys.importTextLabel) }}</span>
        <textarea
          ref="textInput"
          :value="text"
          :placeholder="t(textKeys.importTextPlaceholder)"
          :disabled="busy"
          rows="12"
          spellcheck="false"
          @input="emit('update:text', ($event.currentTarget as HTMLTextAreaElement).value)"
        />
      </label>

      <AppStatus v-if="statusMessage" compact :tone="statusTone" :message="statusMessage" />

      <footer>
        <button type="submit" class="item-card-text-import__primary" :disabled="busy">
          {{ t(textKeys.importTextSubmit) }}
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

defineProps<{
  text: string
  sourceLocale: string
  busy: boolean
  statusMessage: string
  statusTone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'
}>()

const emit = defineEmits<{
  close: []
  submit: []
  'update:text': [text: string]
  'update:source-locale': [locale: string]
}>()

const { t } = useLocale()
const titleId = 'item-card-text-import-title'
const textInput = ref<HTMLTextAreaElement | null>(null)
const localeOptions = [
  { value: 'zh', labelKey: textKeys.localeZh },
  { value: 'en', labelKey: textKeys.localeEn },
  { value: 'ja', labelKey: textKeys.localeJa },
  { value: 'ko', labelKey: textKeys.localeKo },
  { value: 'tc', labelKey: textKeys.localeTc },
  { value: 'fr', labelKey: textKeys.localeFr },
  { value: 'de', labelKey: textKeys.localeDe }
] as const

onMounted(() => void nextTick(() => textInput.value?.focus()))
</script>

<style scoped>
.item-card-text-import {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(17, 24, 39, 0.38);
}

.item-card-text-import__dialog {
  display: grid;
  gap: 12px;
  width: min(560px, 100%);
  max-height: calc(100vh - 36px);
  padding: 16px;
  overflow-y: auto;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bg);
  color: var(--ns-color-text);
  box-shadow: var(--ns-pixel-window-shadow);
}

.item-card-text-import header,
.item-card-text-import footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.item-card-text-import h2 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 16px;
}

.item-card-text-import label {
  display: grid;
  gap: 6px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.item-card-text-import select,
.item-card-text-import textarea {
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 13px var(--ns-font-sans);
}

.item-card-text-import select {
  min-height: 32px;
}

.item-card-text-import textarea {
  resize: vertical;
  line-height: 1.55;
}

.item-card-text-import button {
  min-height: 29px;
  padding: 4px 9px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font: 800 11px var(--ns-font-sans);
  cursor: pointer;
}

.item-card-text-import footer {
  justify-content: flex-end;
}

.item-card-text-import .item-card-text-import__primary {
  border-color: var(--ns-color-accent);
  background: var(--ns-color-accent);
  color: var(--ns-color-on-accent);
}

.item-card-text-import button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>
