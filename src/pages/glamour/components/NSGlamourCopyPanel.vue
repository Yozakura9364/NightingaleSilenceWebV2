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
import { textKeys } from '@/config/site'
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
  gap: 12px;
  padding: 14px;
  border-color: var(--ns-pixel-border);
  background: var(--ns-pixel-surface, var(--ns-color-surface));
  box-shadow: var(--ns-pixel-soft-shadow);
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

.nsglamour-copy__formats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface, var(--ns-color-surface-solid));
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsglamour-copy__format {
  min-width: 0;
  min-height: 34px;
  padding: 5px 6px;
  border: 0;
  border-right: 2px solid var(--ns-pixel-border);
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
  transition:
    background var(--ns-transition-fast),
    color var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}

.nsglamour-copy__format:last-child {
  border-right: 0;
}

.nsglamour-copy__format:hover {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-accent-strong);
}

.nsglamour-copy__format:focus-visible {
  z-index: 1;
  outline: 0;
  box-shadow: inset 0 0 0 2px var(--ns-color-cyan), var(--ns-focus-ring);
}

.nsglamour-copy__format--active {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-accent-strong);
  box-shadow: inset 0 -3px 0 var(--ns-color-accent);
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
  padding: 8px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface, var(--ns-color-surface-solid));
  color: var(--ns-pixel-ink, var(--ns-color-text));
  font: inherit;
  font-family: var(--ns-font-sans);
  font-size: 13px;
  resize: vertical;
  box-shadow: var(--ns-control-inset-shadow);
}

.nsglamour-copy__template-input:focus {
  outline: 0;
  border-color: var(--ns-pixel-border-cyan);
  box-shadow: var(--ns-control-inset-shadow), var(--ns-focus-ring);
}

.nsglamour-copy__output {
  box-sizing: border-box;
  width: 100%;
  min-height: 160px;
  padding: 9px 10px;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  background: var(--ns-pixel-surface, var(--ns-color-surface-solid));
  color: var(--ns-pixel-ink, var(--ns-color-text));
  font: inherit;
  font-family: var(--ns-font-sans);
  font-size: 14px;
  resize: vertical;
  box-shadow: var(--ns-control-inset-shadow);
}

.nsglamour-copy__output:focus {
  outline: 0;
  border-color: var(--ns-pixel-border-cyan);
  box-shadow: var(--ns-control-inset-shadow), var(--ns-focus-ring);
}
</style>
