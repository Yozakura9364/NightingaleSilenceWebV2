<template>
  <section class="nsglamour-copy ns-panel">
    <header class="nsglamour-panel-header">
      <h2 class="ns-heading-bloom">{{ t(textKeys.nsglamourCopyPanel) }}</h2>
      <AppButton size="compact" :disabled="disabled || !copyText" @click="copyOutput">
        {{ t(textKeys.nsglamourCopyAction) }}
      </AppButton>
    </header>

    <div class="nsglamour-copy__formats" :aria-label="t(textKeys.nsglamourCopyFormat)">
      <button
        v-for="option in formatOptions"
        :key="option.value"
        type="button"
        class="nsglamour-copy__format"
        :class="{ 'nsglamour-copy__format--active': option.value === copyFormat }"
        :aria-pressed="option.value === copyFormat"
        @click="emit('update-copy-format', option.value)"
      >
        {{ t(option.labelKey) }}
      </button>
    </div>

    <div v-if="copyFormat === 'custom'" class="nsglamour-copy__template">
      <div class="nsglamour-copy__template-head">
        <label for="nsglamour-copy-template">{{ t(textKeys.nsglamourCopyTemplate) }}</label>
        <AppButton size="compact" variant="secondary" @click="emit('reset-custom-template')">
          {{ t(textKeys.nsglamourCopyResetTemplate) }}
        </AppButton>
      </div>
      <textarea
        id="nsglamour-copy-template"
        class="nsglamour-copy__template-input"
        :value="customTemplate"
        spellcheck="false"
        rows="5"
        @input="emitTemplateUpdate"
      />
    </div>

    <textarea
      id="nsglamour-copy-output"
      class="nsglamour-copy__output"
      :aria-label="t(textKeys.nsglamourCopyOutput)"
      :value="copyText"
      readonly
      rows="7"
    />

    <AppStatus
      v-if="statusMessage"
      compact
      :tone="statusTone"
      :message="statusMessage"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import AppStatus from '@/components/AppStatus.vue'
import { glamourTextKeys as textKeys } from '@/locales/keys/glamour'
import type { GlamourCopyFormat } from '@/lib/glamour/copyText'
import { useLocale } from '@/stores/locale'

const props = withDefaults(
  defineProps<{
    copyText: string
    copyFormat: GlamourCopyFormat
    customTemplate: string
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)

const emit = defineEmits<{
  'update-copy-format': [format: GlamourCopyFormat]
  'update-custom-template': [template: string]
  'reset-custom-template': []
}>()

const { t } = useLocale()
const statusKey = ref('')
const statusTone = ref<'success' | 'warning' | 'danger'>('success')
const statusMessage = computed(() => (statusKey.value ? t(statusKey.value) : ''))

const formatOptions: Array<{ value: GlamourCopyFormat; labelKey: string }> = [
  { value: 'format1', labelKey: textKeys.nsglamourCopyFormatOne },
  { value: 'format2', labelKey: textKeys.nsglamourCopyFormatTwo },
  { value: 'format3', labelKey: textKeys.nsglamourCopyFormatThree },
  { value: 'format4', labelKey: textKeys.nsglamourCopyFormatFour },
  { value: 'custom', labelKey: textKeys.nsglamourCopyFormatCustom }
]

function emitTemplateUpdate(event: Event) {
  emit('update-custom-template', (event.currentTarget as HTMLTextAreaElement).value)
}

async function copyOutput() {
  if (!props.copyText) {
    statusKey.value = textKeys.nsglamourStatusCopyEmpty
    statusTone.value = 'warning'
    return
  }

  try {
    await navigator.clipboard.writeText(props.copyText)
    statusKey.value = textKeys.nsglamourStatusCopied
    statusTone.value = 'success'
  } catch {
    statusKey.value = textKeys.nsglamourStatusCopyError
    statusTone.value = 'danger'
  }
}
</script>

<style scoped>
.nsglamour-copy {
  display: grid;
  gap: 10px;
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
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
}

.nsglamour-panel-header h2 {
  margin: 0;
  font-family: var(--ns-font-ui);
  font-size: 15px;
  font-weight: 700;
}

.nsglamour-copy__formats {
  display: flex;
  width: max-content;
  max-width: 100%;
  gap: 14px;
  overflow-x: auto;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
}

.nsglamour-copy__format {
  min-width: 0;
  flex: 0 0 auto;
  min-height: 30px;
  padding: 0 0 7px;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--ns-pixel-muted, var(--ns-color-text-muted));
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  box-shadow: none;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--ns-transition-fast), border-color var(--ns-transition-fast);
}

.nsglamour-copy__format:hover {
  border-bottom-color: var(--ns-color-accent, #d97706);
  background: transparent;
  color: var(--ns-color-accent-strong);
}

.nsglamour-copy__format:focus-visible {
  outline: none;
}

.nsglamour-copy__format--active {
  border-bottom-color: var(--ns-color-accent, #d97706);
  background: transparent;
  color: var(--ns-color-accent-strong);
  box-shadow: none;
}

.nsglamour-copy__template {
  display: grid;
  gap: 8px;
}

.nsglamour-copy__template-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.nsglamour-copy__template-head label {
  font-size: 13px;
  font-weight: 700;
}

.nsglamour-copy__template-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 120px;
  padding: 10px 0;
  border: 0;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text);
  font: inherit;
  font-family: var(--ns-font-ui);
  font-size: 13px;
  resize: vertical;
  box-shadow: none;
}

.nsglamour-copy__template-input:focus {
  outline: 0;
  border-bottom-color: var(--ns-color-accent, #d97706);
  box-shadow: none;
}

.nsglamour-copy__output {
  box-sizing: border-box;
  width: 100%;
  min-height: 240px;
  padding: 10px 0;
  border: 0;
  border-bottom: 1px solid var(--ns-color-border, #d8d8d8);
  border-radius: 0;
  background: transparent;
  color: var(--ns-color-text);
  font: inherit;
  font-family: var(--ns-font-ui);
  font-size: 14px;
  resize: vertical;
  line-height: 1.7;
  box-shadow: none;
}

.nsglamour-copy__output:focus {
  outline: 0;
  border-bottom-color: var(--ns-color-accent, #d97706);
  box-shadow: none;
}
</style>
