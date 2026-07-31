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
      class="ns-form-dialog ns-scroll-area ns-scroll-area--compact"
      @submit.prevent="emit('submit')"
    >
      <header class="ns-form-dialog__header">
        <h2 :id="titleId" class="ns-form-dialog__title">{{ t(textKeys.importTitle) }}</h2>
        <button type="button" class="ns-button ns-button--compact" @click="emit('close')">
          {{ t(textKeys.importClose) }}
        </button>
      </header>

      <AppField
        :label="t(textKeys.importUrlLabel)"
        for-id="item-card-import-url"
        density="compact"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <input
          id="item-card-import-url"
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
      </AppField>

      <AppStatus v-if="statusMessage" compact :tone="statusTone" :message="statusMessage" />
      <p v-else class="ns-form-dialog__hint">{{ t(textKeys.importHint) }}</p>

      <footer class="ns-form-dialog__footer">
        <button
          type="button"
          class="ns-button ns-button--compact"
          :disabled="busy"
          @click="emit('open-text')"
        >
          {{ t(textKeys.importText) }}
        </button>
        <button
          type="submit"
          class="ns-button ns-button--compact ns-button--primary"
          :disabled="busy"
        >
          {{ t(textKeys.importSubmit) }}
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

const props = defineProps<{
  url: string
  busy: boolean
  statusMessage: string
  statusTone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading'
}>()

const emit = defineEmits<{
  close: []
  submit: []
  'open-text': []
  'parse-chara': [file: File]
  'update:url': [url: string]
}>()

const { t } = useLocale()
const titleId = 'item-card-import-title'
const urlInput = ref<HTMLInputElement | null>(null)

onMounted(() => void nextTick(() => urlInput.value?.focus()))

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

function hasDraggedFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types || []).includes('Files')
}
</script>
