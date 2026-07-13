<template>
  <div
    class="nsglamour-template-import"
    aria-modal="true"
    role="dialog"
    :aria-labelledby="titleId"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <form class="nsglamour-template-import__dialog" @submit.prevent="emit('submit')">
      <div class="nsglamour-template-import__head">
        <h2 :id="titleId" class="ns-heading-bloom">
          {{ t(textKeys.nsglamourTemplateImportTitle) }}
        </h2>
        <button
          type="button"
          class="nsglamour-template__secondary ns-compact-action"
          @click="emit('close')"
        >
          {{ t(textKeys.nsglamourTemplateImportClose) }}
        </button>
      </div>

      <label class="nsglamour-template__field">
        <span>{{ t(textKeys.nsglamourTemplateImportUrlLabel) }}</span>
        <input
          ref="urlInputEl"
          class="nsglamour-template__input"
          type="text"
          inputmode="url"
          autocomplete="url"
          spellcheck="false"
          :value="url"
          :placeholder="t(textKeys.nsglamourTemplateImportUrlPlaceholder)"
          :disabled="busy"
          @input="emit('update:url', ($event.currentTarget as HTMLInputElement).value)"
        />
      </label>

      <AppStatus
        v-if="statusMessage"
        compact
        class="nsglamour-template-import__status"
        :tone="statusTone"
        :message="statusMessage"
      />
      <p v-else class="nsglamour-template-import__hint">
        {{ t(textKeys.nsglamourTemplateImportHint) }}
      </p>

      <div class="nsglamour-template-import__actions">
        <button type="submit" class="nsglamour-template__primary" :disabled="busy">
          {{ t(textKeys.nsglamourTemplateImportSubmit) }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
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
  'update:url': [url: string]
}>()

const { t } = useLocale()
const titleId = 'nsglamour-template-import-title'
const urlInputEl = ref<HTMLInputElement | null>(null)

onMounted(() => {
  void nextTick(() => urlInputEl.value?.focus())
})
</script>

<style scoped>
.nsglamour-template-import {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(17, 24, 39, 0.32);
}

.nsglamour-template-import__dialog {
  display: grid;
  gap: 12px;
  width: min(460px, 100%);
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-window-bg);
  color: var(--ns-color-text);
  box-shadow: var(--ns-pixel-window-shadow);
}

.nsglamour-template-import__head,
.nsglamour-template-import__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.nsglamour-template-import__head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.nsglamour-template__field {
  display: grid;
  gap: 6px;
  min-width: 0;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 700;
}

.nsglamour-template__input {
  box-sizing: border-box;
  min-width: 0;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 4px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-sans);
  font-size: 13px;
  font-weight: 400;
}

.nsglamour-template__input:focus {
  outline: auto;
}

.nsglamour-template-import__hint {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 12px;
}

.nsglamour-template-import__status {
  min-height: 0;
}

.nsglamour-template-import__actions {
  justify-content: flex-end;
  padding-top: 4px;
}

.nsglamour-template__primary {
  min-height: 30px;
  padding: 4px 10px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-color-accent);
  color: var(--ns-color-on-accent);
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 950;
  box-shadow: var(--ns-pixel-button-shadow);
  cursor: pointer;
}

.nsglamour-template__primary:hover,
.nsglamour-template__primary:focus-visible {
  border-color: var(--ns-pixel-border);
  background: var(--ns-pixel-hover-surface);
  color: var(--ns-color-accent-strong);
  box-shadow: var(--ns-pixel-button-shadow-hover);
  outline: none;
  transform: translate(-1px, -1px);
}

.nsglamour-template__primary:active {
  box-shadow: var(--ns-pixel-soft-shadow);
  transform: translate(2px, 2px);
}

.nsglamour-template__primary:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 640px) {
  .nsglamour-template-import__head,
  .nsglamour-template-import__actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
