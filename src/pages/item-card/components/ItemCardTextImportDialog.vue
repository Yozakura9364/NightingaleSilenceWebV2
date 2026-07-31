<template>
  <div
    class="ns-form-dialog-overlay"
    aria-modal="true"
    role="dialog"
    :aria-labelledby="titleId"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <form
      class="ns-form-dialog ns-form-dialog--wide ns-scroll-area ns-scroll-area--compact"
      @submit.prevent="emit('submit')"
    >
      <header class="ns-form-dialog__header">
        <h2 :id="titleId" class="ns-form-dialog__title">
          {{ t(textKeys.importTextTitle) }}
        </h2>
        <button type="button" class="ns-button ns-button--compact" @click="emit('close')">
          {{ t(textKeys.importClose) }}
        </button>
      </header>

      <AppField
        :label="t(textKeys.importTextSourceLocale)"
        for-id="item-card-text-import-locale"
        density="compact"
      >
        <select
          id="item-card-text-import-locale"
          :value="sourceLocale"
          :disabled="busy"
          @change="emit('update:source-locale', ($event.currentTarget as HTMLSelectElement).value)"
        >
          <option v-for="option in localeOptions" :key="option.value" :value="option.value">
            {{ t(option.labelKey) }}
          </option>
        </select>
      </AppField>

      <AppField
        :label="t(textKeys.importTextLabel)"
        for-id="item-card-text-import-text"
        density="compact"
      >
        <textarea
          id="item-card-text-import-text"
          ref="textInput"
          :value="text"
          :placeholder="t(textKeys.importTextPlaceholder)"
          :disabled="busy"
          rows="12"
          spellcheck="false"
          @input="emit('update:text', ($event.currentTarget as HTMLTextAreaElement).value)"
        />
      </AppField>

      <AppStatus v-if="statusMessage" compact :tone="statusTone" :message="statusMessage" />

      <footer class="ns-form-dialog__footer">
        <button
          type="submit"
          class="ns-button ns-button--compact ns-button--primary"
          :disabled="busy"
        >
          {{ t(textKeys.importTextSubmit) }}
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import AppField from '@/components/AppField.vue'
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
