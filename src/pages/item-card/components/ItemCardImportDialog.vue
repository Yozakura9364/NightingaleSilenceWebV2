<template>
  <div
    class="item-card-import"
    aria-modal="true"
    role="dialog"
    :aria-labelledby="titleId"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <form class="item-card-import__dialog" @submit.prevent="emit('submit')">
      <header>
        <h2 :id="titleId">{{ t(textKeys.importTitle) }}</h2>
        <button type="button" @click="emit('close')">
          {{ t(textKeys.importClose) }}
        </button>
      </header>

      <label>
        <span>{{ t(textKeys.importUrlLabel) }}</span>
        <input
          ref="urlInput"
          type="url"
          inputmode="url"
          autocomplete="url"
          spellcheck="false"
          :value="url"
          :placeholder="t(textKeys.importUrlPlaceholder)"
          :disabled="busy"
          @input="emit('update:url', ($event.currentTarget as HTMLInputElement).value)"
        />
      </label>

      <AppStatus
        v-if="statusMessage"
        compact
        :tone="statusTone"
        :message="statusMessage"
      />
      <p v-else>{{ t(textKeys.importHint) }}</p>

      <footer>
        <button type="button" :disabled="busy" @click="emit('open-text')">
          {{ t(textKeys.importText) }}
        </button>
        <button type="submit" class="item-card-import__primary" :disabled="busy">
          {{ t(textKeys.importSubmit) }}
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
  url: string
  busy: boolean
  statusMessage: string
  statusTone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'
}>()

const emit = defineEmits<{
  close: []
  submit: []
  'open-text': []
  'update:url': [url: string]
}>()

const { t } = useLocale()
const titleId = 'item-card-import-title'
const urlInput = ref<HTMLInputElement | null>(null)

onMounted(() => void nextTick(() => urlInput.value?.focus()))
</script>

<style scoped>
.item-card-import {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(17, 24, 39, 0.38);
}

.item-card-import__dialog {
  display: grid;
  gap: 12px;
  width: min(460px, 100%);
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bg);
  color: var(--ns-color-text);
  box-shadow: var(--ns-pixel-window-shadow);
}

.item-card-import header,
.item-card-import footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.item-card-import h2 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 16px;
}

.item-card-import label {
  display: grid;
  gap: 6px;
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.item-card-import input {
  min-width: 0;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 13px var(--ns-font-sans);
}

.item-card-import p {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}

.item-card-import button {
  min-height: 29px;
  padding: 4px 9px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font: 800 11px var(--ns-font-sans);
  cursor: pointer;
}

.item-card-import footer {
  justify-content: flex-end;
}

.item-card-import .item-card-import__primary {
  border-color: var(--ns-color-accent);
  background: var(--ns-color-accent);
  color: var(--ns-color-on-accent);
}

.item-card-import button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>
