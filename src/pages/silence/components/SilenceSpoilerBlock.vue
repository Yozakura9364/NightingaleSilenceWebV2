<template>
  <details class="silence-character-spoiler">
    <summary>{{ t(textKeys.silenceCharacterSpoiler) }}</summary>
    <article
      v-for="spoiler in spoilers"
      :key="spoiler.id"
      class="silence-character-note"
    >
      <h3>{{ t(spoiler.titleKey) }}</h3>
      <p>{{ t(spoiler.bodyKey) }}</p>
    </article>
  </details>
</template>

<script setup lang="ts">
import { textKeys } from '@/config/site'
import type { SilenceCharacterTextBlock } from '@/data/silence/characters'
import { useLocale } from '@/stores/locale'

defineProps<{
  spoilers: SilenceCharacterTextBlock[]
}>()

const { t } = useLocale()
</script>

<style scoped>
.silence-character-spoiler {
  padding: 16px;
  border: 2px solid rgba(42, 33, 56, 0.36);
  background: rgba(255, 252, 255, 0.72);
  box-shadow: 6px 6px 0 rgba(42, 33, 56, 0.07);
}

.silence-character-spoiler summary {
  color: #2c2338;
  font-family: var(--ns-font-display);
  font-size: 28px;
  font-weight: 950;
  cursor: pointer;
}

.silence-character-note {
  display: grid;
  gap: 8px;
  min-width: 0;
  margin-top: 14px;
  padding: 16px;
  border: 2px solid rgba(42, 33, 56, 0.36);
  background: rgba(255, 252, 255, 0.72);
  box-shadow: 6px 6px 0 rgba(42, 33, 56, 0.07);
}

.silence-character-note h3 {
  margin: 0;
  color: #2c2338;
  font-family: var(--ns-font-display);
  font-size: 24px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.silence-character-note p {
  margin: 0;
  color: rgba(49, 40, 63, 0.68);
}
</style>
