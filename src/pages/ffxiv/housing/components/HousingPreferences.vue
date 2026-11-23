<template>
  <section class="housing-preferences">
    <button
      type="button"
      class="housing-preferences__header"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="housing-preferences__title">{{ t(housingTextKeys.prefTitle) }}</span>
      <span class="housing-preferences__count">{{ preferences.length }}</span>
      <span class="housing-preferences__chevron">
        {{ open ? t(housingTextKeys.groupCollapse) : t(housingTextKeys.groupExpand) }}
      </span>
    </button>

    <div v-if="open" class="housing-preferences__body">
      <p v-if="preferences.length === 0" class="housing-preferences__hint">
        {{ t(housingTextKeys.prefEmptyHint) }}
      </p>

      <ul v-if="preferences.length > 0" class="housing-preferences__list">
        <li v-for="(pref, index) in preferences" :key="`${pref.district}-${pref.ward}-${pref.plot}`">
          <span class="housing-preferences__label">{{ labelFor(pref) }}</span>
          <button type="button" class="housing-preferences__remove" @click="remove(index)">
            {{ t(housingTextKeys.prefRemove) }}
          </button>
        </li>
      </ul>

      <form class="housing-preferences__form" @submit.prevent="add">
        <select v-model="draftDistrict" :aria-label="t(housingTextKeys.prefDistrictLabel)">
          <option v-for="(key, slug) in districts" :key="slug" :value="slug">{{ t(key) }}</option>
        </select>
        <select v-model="draftWard" :aria-label="t(housingTextKeys.wardLabel)">
          <option :value="null">{{ t(housingTextKeys.prefWardAll) }}</option>
          <option v-for="ward in 30" :key="ward" :value="ward">{{ ward }}</option>
        </select>
        <input
          v-model.number="draftPlot"
          type="number"
          min="1"
          max="60"
          required
          :aria-label="t(housingTextKeys.plotLabel)"
        />
        <button type="submit" class="housing-preferences__add">{{ t(housingTextKeys.prefAdd) }}</button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { housingTextKeys } from '@/locales/keys/housing'
import { useLocale } from '@/stores/locale'
import { districtNameKeyBySlug } from '@/lib/housing/regions'
import type { PlotPreference } from '@/lib/housing/housingCache'

const props = defineProps<{
  preferences: PlotPreference[]
}>()

const emit = defineEmits<{
  (event: 'update:preferences', value: PlotPreference[]): void
}>()

const { t } = useLocale()
const open = ref(false)
const districts = districtNameKeyBySlug
const draftDistrict = ref('mist')
const draftWard = ref<number | null>(null)
const draftPlot = ref<number | null>(null)

function labelFor(pref: PlotPreference): string {
  const district = t(districtNameKeyBySlug[pref.district] ?? pref.district)
  const ward = pref.ward == null ? t(housingTextKeys.prefWardAll) : `${pref.ward}${t(housingTextKeys.wardLabel)}`
  return `${district} · ${ward} · ${pref.plot}${t(housingTextKeys.plotLabel)}`
}

function add(): void {
  if (!draftPlot.value || draftPlot.value < 1 || draftPlot.value > 60) {
    return
  }
  const next: PlotPreference = {
    district: draftDistrict.value,
    ward: draftWard.value || null,
    plot: draftPlot.value
  }
  const exists = props.preferences.some(
    (pref) => pref.district === next.district && pref.ward === next.ward && pref.plot === next.plot
  )
  if (!exists) {
    emit('update:preferences', [...props.preferences, next])
  }
  draftPlot.value = null
}

function remove(index: number): void {
  emit(
    'update:preferences',
    props.preferences.filter((_, itemIndex) => itemIndex !== index)
  )
}
</script>

<style scoped>
.housing-preferences {
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-color-surface);
}

.housing-preferences__header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 14px;
  border: 0;
  background: transparent;
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  text-align: left;
}

.housing-preferences__count {
  color: var(--ns-color-accent-strong);
  font-family: var(--ns-font-data);
  font-variant-numeric: tabular-nums;
}

.housing-preferences__chevron {
  margin-left: auto;
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.housing-preferences__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 14px 12px;
}

.housing-preferences__hint {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 12px;
}

.housing-preferences__list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.housing-preferences__list li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  font-family: var(--ns-font-ui);
  font-size: 12px;
}

.housing-preferences__remove {
  border: 0;
  background: transparent;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
}

.housing-preferences__remove:hover {
  color: var(--ns-color-danger);
}

.housing-preferences__form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.housing-preferences__form select,
.housing-preferences__form input {
  min-height: 30px;
  padding: 0 8px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 700;
}

.housing-preferences__form input {
  width: 72px;
}

.housing-preferences__add {
  min-height: 30px;
  padding: 0 14px;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-xs);
  background: var(--ns-color-accent-soft);
  color: var(--ns-color-accent-strong);
  font-family: var(--ns-font-ui);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
</style>
