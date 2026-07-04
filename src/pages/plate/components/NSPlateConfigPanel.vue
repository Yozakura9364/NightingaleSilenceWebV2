<template>
  <aside class="nsplate-config-panel">
    <div class="nsplate-config-panel__header">
      <div class="nsplate-config-panel__tabs">
        <AppTabs
          v-model="activeTab"
          :items="tabs"
          :aria-label="t(textKeys.nsplateConfig)"
          density="compact"
          stretch
        />
      </div>

      <div v-if="$slots.toolbar" class="nsplate-config-panel__toolbar">
        <slot name="toolbar" />
      </div>
    </div>

    <div class="nsplate-config-panel__scroll">
      <slot />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppTabs from '@/components/AppTabs.vue'
import { textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'
import type { NSPlatePanelTab } from '@/lib/plate/types'

const props = defineProps<{
  modelValue: NSPlatePanelTab
  tabs: { value: NSPlatePanelTab; label: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NSPlatePanelTab]
}>()

const { t } = useLocale()
const activeTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<style scoped>
.nsplate-config-panel {
  --nsplate-config-scroll-padding: 10px;
  --nsplate-panel-stack-gap: 18px;
  --nsplate-panel-title-gap: 12px;
  --nsplate-control-stack-gap: 12px;
  --nsplate-section-stack-gap: 8px;
  --nsplate-section-body-gap: 8px;

  display: flex;
  width: var(--nsplate-panel-width, clamp(340px, 31vw, 460px));
  min-width: 0;
  max-width: 52vw;
  flex: 0 0 var(--nsplate-panel-width, clamp(340px, 31vw, 460px));
  flex-direction: column;
  overflow: hidden;
  border-left: 2px solid var(--ns-pixel-divider);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 84%, transparent);
}

.nsplate-config-panel__header {
  position: relative;
  z-index: 4;
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 8px;
  padding: 10px;
  border-bottom: 2px solid var(--ns-pixel-divider);
  background: color-mix(in srgb, var(--ns-color-surface-solid) 88%, transparent);
}

.nsplate-config-panel__tabs {
  min-width: 0;
}

.nsplate-config-panel__toolbar {
  min-width: 0;
}

.nsplate-config-panel__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--nsplate-config-scroll-padding);
  scrollbar-width: thin;
}

@media (max-width: 980px) {
  .nsplate-config-panel {
    width: 100%;
    max-width: none;
    flex-basis: auto;
    border-top: 1px solid var(--ns-color-border);
    border-left: 0;
  }

  .nsplate-config-panel__header {
    position: sticky;
    top: 0;
    z-index: 4;
    background: color-mix(in srgb, var(--ns-color-surface-solid) 94%, transparent);
  }
}
</style>
