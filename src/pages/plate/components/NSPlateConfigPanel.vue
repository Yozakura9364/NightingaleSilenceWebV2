<template>
  <aside class="nsplate-config-panel">
    <div class="nsplate-config-panel__tabs">
      <AppTabs
        v-model="activeTab"
        :items="tabs"
        :aria-label="t(textKeys.nsplateConfig)"
        density="compact"
        stretch
      />
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
import type { NSPlatePanelTab } from '@/pages/plate/types'

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

.nsplate-config-panel__tabs {
  display: block;
  flex: 0 0 auto;
  padding: 10px 10px 8px;
  border-bottom: 2px solid var(--ns-pixel-divider);
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

  .nsplate-config-panel__tabs {
    position: sticky;
    top: 0;
    z-index: 2;
    background: color-mix(in srgb, var(--ns-color-surface-solid) 92%, transparent);
  }
}
</style>
