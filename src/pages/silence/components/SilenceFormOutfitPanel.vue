<template>
  <div class="silence-form-outfit">
    <nav
      v-if="showForms && hasMultipleForms"
      class="silence-form-outfit__form-tabs"
      :aria-label="t(textKeys.silenceCharacterForms)"
    >
      <RouterLink
        v-for="form in visibleForms"
        :key="form.id"
        class="silence-form-outfit__form-tab"
        :class="{ 'silence-form-outfit__form-tab--active': form.id === selectedForm?.id }"
        :to="createFormRoute(form.id)"
        :aria-current="form.id === selectedForm?.id ? 'page' : undefined"
      >
        <span>{{ form.label }}</span>
        <small v-if="form.subtitle">{{ form.subtitle }}</small>
      </RouterLink>
    </nav>

    <article v-if="showForms && selectedForm" class="silence-form-outfit__form-card">
      <p class="ns-eyebrow">{{ selectedForm.subtitle ?? t(textKeys.silenceCharacterForms) }}</p>
      <h3>{{ selectedForm.label }}</h3>
      <p v-if="selectedForm.summary">{{ selectedForm.summary }}</p>
      <ul v-if="selectedForm.points.length" class="silence-form-outfit__point-list">
        <li v-for="point in selectedForm.points" :key="point">{{ point }}</li>
      </ul>
    </article>

    <div v-if="showOutfits && visibleOutfits.length" class="silence-form-outfit__outfit-shell">
      <div class="silence-form-outfit__preview" aria-hidden="true">
        <span v-if="selectedOutfit">{{ selectedOutfit.label }}</span>
      </div>

      <div class="silence-form-outfit__outfit-detail">
        <div
          v-if="hasMultipleOutfits"
          class="silence-form-outfit__outfit-tabs"
          :aria-label="outfitLabel"
        >
          <button
            v-for="outfit in visibleOutfits"
            :key="outfit.id"
            type="button"
            :class="{ 'silence-form-outfit__outfit-tab--active': outfit.id === selectedOutfit?.id }"
            :aria-pressed="outfit.id === selectedOutfit?.id"
            @click="selectedOutfitId = outfit.id"
          >
            {{ outfit.label }}
          </button>
        </div>

        <article v-if="selectedOutfit" class="silence-form-outfit__outfit-card">
          <h3>{{ selectedOutfit.label }}</h3>
          <p v-if="selectedOutfit.description">{{ selectedOutfit.description }}</p>
          <ul
            v-if="selectedOutfit.equipment.length"
            class="silence-form-outfit__equipment-list"
          >
            <li v-for="item in selectedOutfit.equipment" :key="item">{{ item }}</li>
          </ul>
        </article>

        <p v-else class="silence-form-outfit__empty"></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { textKeys } from '@/config/site'
import type {
  SilenceCharacterForm,
  SilenceCharacterOutfit
} from '@/data/silence/characters'
import { useLocale } from '@/stores/locale'

const props = withDefaults(
  defineProps<{
    forms: SilenceCharacterForm[]
    outfits: SilenceCharacterOutfit[]
    activeFormId?: string
    outfitLabel: string
    filterOutfitsByForm?: boolean
    showForms?: boolean
    showOutfits?: boolean
  }>(),
  {
    filterOutfitsByForm: true,
    showForms: true,
    showOutfits: true
  }
)

const route = useRoute()
const { t } = useLocale()
const selectedOutfitId = ref('')

const visibleForms = computed(() => props.forms.filter((form) => form.visibility === 'public'))
const hasMultipleForms = computed(() => visibleForms.value.length > 1)
const defaultFormId = computed(() => visibleForms.value[0]?.id ?? '')
const selectedForm = computed(
  () =>
    visibleForms.value.find((form) => form.id === props.activeFormId) ??
    visibleForms.value[0]
)
const outfitFormId = computed(() => (props.filterOutfitsByForm ? selectedForm.value?.id : ''))
const visibleOutfits = computed(() => {
  const formId = outfitFormId.value

  return props.outfits.filter(
    (outfit) =>
      outfit.visibility === 'public' && (!formId || outfit.formIds.includes(formId))
  )
})
const hasMultipleOutfits = computed(() => visibleOutfits.value.length > 1)
const selectedOutfit = computed(
  () =>
    visibleOutfits.value.find((outfit) => outfit.id === selectedOutfitId.value) ??
    visibleOutfits.value[0]
)

watch(
  () => `${outfitFormId.value}:${visibleOutfits.value.map((outfit) => outfit.id).join('|')}`,
  () => {
    selectedOutfitId.value = visibleOutfits.value[0]?.id ?? ''
  },
  { immediate: true }
)

function createFormRoute(formId: string): RouteLocationRaw {
  const query = { ...route.query }

  if (formId === defaultFormId.value) {
    delete query.form
  } else {
    query.form = formId
  }

  return {
    path: route.path,
    query
  }
}
</script>

<style scoped>
.silence-form-outfit {
  display: grid;
  gap: 18px;
}

.silence-form-outfit__form-tabs,
.silence-form-outfit__outfit-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  border-bottom: 1px solid rgba(42, 33, 56, 0.14);
}

.silence-form-outfit__form-tab,
.silence-form-outfit__outfit-tabs button {
  position: relative;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(49, 40, 63, 0.6);
  font-family: var(--ns-font-sans);
  font-size: 13px;
  font-weight: 760;
  text-decoration: none;
  cursor: pointer;
}

.silence-form-outfit__form-tab::after,
.silence-form-outfit__outfit-tabs button::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: color-mix(in srgb, var(--silence-character-color), #2c2338 14%);
  content: '';
  opacity: 0;
  transform: scaleX(0.48);
  transform-origin: center;
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.silence-form-outfit__form-tab {
  display: grid;
  min-width: 120px;
  gap: 2px;
  padding: 8px 0 10px;
}

.silence-form-outfit__form-tab small {
  color: rgba(49, 40, 63, 0.58);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 700;
}

.silence-form-outfit__outfit-tabs button {
  padding: 8px 0 10px;
}

.silence-form-outfit__form-tab:hover,
.silence-form-outfit__form-tab:focus-visible,
.silence-form-outfit__form-tab--active,
.silence-form-outfit__outfit-tabs button:hover,
.silence-form-outfit__outfit-tabs button:focus-visible,
.silence-form-outfit__outfit-tab--active {
  color: #2c2338;
  outline: none;
}

.silence-form-outfit__form-tab:hover::after,
.silence-form-outfit__form-tab:focus-visible::after,
.silence-form-outfit__form-tab--active::after,
.silence-form-outfit__outfit-tabs button:hover::after,
.silence-form-outfit__outfit-tabs button:focus-visible::after,
.silence-form-outfit__outfit-tab--active::after {
  opacity: 1;
  transform: scaleX(1);
}

.silence-form-outfit__form-card,
.silence-form-outfit__outfit-card,
.silence-form-outfit__preview,
.silence-form-outfit__empty {
  border: 1px solid rgba(42, 33, 56, 0.14);
  background: transparent;
}

.silence-form-outfit__form-card,
.silence-form-outfit__outfit-card,
.silence-form-outfit__empty {
  display: grid;
  gap: 12px;
  padding: 18px;
}

.silence-form-outfit__form-card h3,
.silence-form-outfit__outfit-card h3 {
  margin: 0;
  color: #2c2338;
  font-family: var(--ns-font-sans);
  font-size: 22px;
  font-weight: 820;
  line-height: 1.2;
  letter-spacing: 0;
}

.silence-form-outfit__form-card p,
.silence-form-outfit__outfit-card p,
.silence-form-outfit__empty {
  margin: 0;
  color: rgba(49, 40, 63, 0.72);
  line-height: 1.75;
}

.silence-form-outfit__outfit-shell {
  display: grid;
  grid-template-columns: minmax(220px, 0.38fr) minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
}

.silence-form-outfit__preview {
  display: grid;
  min-height: 280px;
  aspect-ratio: 3 / 4;
  place-items: center;
  padding: 18px;
  text-align: center;
}

.silence-form-outfit__preview span {
  color: #2c2338;
  font-family: var(--ns-font-sans);
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 820;
  line-height: 1.12;
}

.silence-form-outfit__preview small {
  color: rgba(49, 40, 63, 0.48);
  font-family: var(--ns-font-sans);
  font-size: 12px;
  font-weight: 760;
}

.silence-form-outfit__outfit-detail {
  display: grid;
  align-content: start;
  gap: 12px;
}

.silence-form-outfit__point-list,
.silence-form-outfit__equipment-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 0;
  color: rgba(49, 40, 63, 0.7);
  list-style: none;
}

.silence-form-outfit__point-list li,
.silence-form-outfit__equipment-list li {
  position: relative;
  padding-left: 18px;
  line-height: 1.65;
}

.silence-form-outfit__point-list li::before,
.silence-form-outfit__equipment-list li::before {
  position: absolute;
  top: 0.72em;
  left: 0;
  width: 7px;
  height: 7px;
  background: color-mix(in srgb, var(--silence-character-color), #2c2338 18%);
  content: '';
}

@media (max-width: 920px) {
  .silence-form-outfit__outfit-shell {
    grid-template-columns: 1fr;
  }
}
</style>
