<template>
  <NSPlatePanel :title="t(textKeys.nsplatePortraitSide)">
    <div
      class="nsplate-portrait-side-switch"
      role="group"
      :aria-label="t(textKeys.nsplatePortraitSide)"
    >
      <NSPlateChoiceButton
        v-for="option in options"
        :key="option.value"
        :active="modelValue === option.value"
        layout="center"
        :aria-pressed="modelValue === option.value"
        @click="emit('update:modelValue', option.value)"
      >
        {{ t(option.labelKey) }}
      </NSPlateChoiceButton>
    </div>
  </NSPlatePanel>
</template>

<script setup lang="ts">
import { textKeys } from '@/config/site'
import type { NSPlatePortraitSide } from '@/lib/plate/types'
import { useLocale } from '@/stores/locale'
import NSPlateChoiceButton from '@/pages/plate/components/NSPlateChoiceButton.vue'
import NSPlatePanel from '@/pages/plate/components/NSPlatePanel.vue'

defineProps<{
  modelValue: NSPlatePortraitSide
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NSPlatePortraitSide]
}>()

const { t } = useLocale()
const options: { value: NSPlatePortraitSide; labelKey: string }[] = [
  { value: 'left', labelKey: textKeys.nsplatePortraitSideLeft },
  { value: 'right', labelKey: textKeys.nsplatePortraitSideRight }
]
</script>

<style scoped>
.nsplate-portrait-side-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}
</style>
