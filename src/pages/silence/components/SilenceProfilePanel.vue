<template>
  <div class="silence-character-basic-grid">
    <dl class="silence-character-fact-grid">
      <div v-for="field in profile" :key="field.id">
        <dt>{{ t(field.labelKey) }}</dt>
        <dd>{{ t(field.valueKey) }}</dd>
      </div>
    </dl>

    <div class="silence-character-color-chip">
      <span aria-hidden="true"></span>
      <div>
        <strong>{{ t(textKeys.silenceCharacterColor) }}</strong>
        <code>{{ color }}</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { textKeys } from '@/config/site'
import type { SilenceCharacterProfileField } from '@/data/silence/characters'
import { useLocale } from '@/stores/locale'

defineProps<{
  profile: SilenceCharacterProfileField[]
  color: string
}>()

const { t } = useLocale()
</script>

<style scoped>
.silence-character-basic-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.25fr);
  gap: 12px;
}

.silence-character-fact-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.silence-character-fact-grid div,
.silence-character-color-chip {
  border: 2px solid rgba(42, 33, 56, 0.36);
  background: rgba(255, 252, 255, 0.72);
  box-shadow: 6px 6px 0 rgba(42, 33, 56, 0.07);
}

.silence-character-fact-grid div {
  min-width: 0;
  padding: 12px;
  border-color: rgba(42, 33, 56, 0.24);
  background: rgba(255, 255, 255, 0.48);
}

.silence-character-fact-grid dt {
  color: color-mix(in srgb, var(--silence-character-color), #2c2338 42%);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
}

.silence-character-fact-grid dd {
  margin: 4px 0 0;
  color: rgba(49, 40, 63, 0.7);
  overflow-wrap: anywhere;
}

.silence-character-color-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
}

.silence-character-color-chip > span {
  width: 46px;
  aspect-ratio: 1;
  border: 2px solid rgba(42, 33, 56, 0.42);
  background: var(--silence-character-color);
  box-shadow: 4px 4px 0 rgba(42, 33, 56, 0.08);
}

.silence-character-color-chip div {
  display: grid;
  gap: 4px;
}

.silence-character-color-chip strong {
  color: color-mix(in srgb, var(--silence-character-color), #2c2338 44%);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
}

.silence-character-color-chip code {
  color: rgba(49, 40, 63, 0.72);
  font-family: var(--ns-font-decorative);
  font-size: 13px;
}

@media (max-width: 1040px) {
  .silence-character-fact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .silence-character-basic-grid,
  .silence-character-fact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
