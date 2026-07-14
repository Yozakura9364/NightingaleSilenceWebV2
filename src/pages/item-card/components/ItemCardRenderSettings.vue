<template>
  <section class="card-settings">
    <h2>{{ t(textKeys.settingsTitle) }}</h2>

    <fieldset class="card-settings__group">
      <legend>{{ t(textKeys.outputLanguages) }}</legend>
      <div class="card-settings__checks">
        <label v-for="locale in availableLocales" :key="locale">
          <input
            type="checkbox"
            :checked="settings.outputLocales.includes(locale)"
            :disabled="settings.outputLocales.length === 1 && settings.outputLocales[0] === locale"
            @change="emit('toggle-locale', locale)"
          />
          <span>{{ localeLabel(locale) }}</span>
        </label>
      </div>
    </fieldset>

    <div class="card-settings__font-row">
      <label class="card-settings__field">
        <span>{{ t(textKeys.fontFamily) }}</span>
        <select
          :value="activeStyle.fontFamily"
          @change="updateStyle('fontFamily', inputValue($event))"
        >
          <option v-for="font in fontOptions" :key="font.value" :value="font.value">
            {{ font.label }}
          </option>
        </select>
      </label>
      <button type="button" class="card-settings__secondary" @click="loadLocalFonts">
        {{ t(textKeys.loadLocalFonts) }}
      </button>
    </div>
    <p v-if="fontStatus" class="card-settings__status">{{ fontStatus }}</p>

    <div class="card-settings__grid card-settings__text-grid">
      <label class="card-settings__field">
        <span>{{ t(textKeys.titleSize) }}</span>
        <input
          type="number"
          min="8"
          max="64"
          :value="activeStyle.titleSize"
          @change="updateStyle('titleSize', numberValue($event))"
        />
      </label>
      <label class="card-settings__field">
        <span>{{ t(textKeys.titleWeight) }}</span>
        <input
          type="number"
          min="100"
          max="900"
          step="100"
          :value="activeStyle.titleWeight"
          @change="updateStyle('titleWeight', numberValue($event))"
        />
      </label>
      <label class="card-settings__field">
        <span>{{ t(textKeys.dyeSize) }}</span>
        <input
          type="number"
          min="8"
          max="48"
          :value="activeStyle.dyeSize"
          @change="updateStyle('dyeSize', numberValue($event))"
        />
      </label>
    </div>

    <div class="card-settings__grid">
      <label class="card-settings__field">
        <span>{{ t(textKeys.titleOffsetX) }}</span>
        <input
          type="number"
          :value="settings.titleOffsetX"
          @change="updateNumber('titleOffsetX', $event)"
        />
      </label>
      <label class="card-settings__field">
        <span>{{ t(textKeys.titleOffsetY) }}</span>
        <input
          type="number"
          :value="settings.titleOffsetY"
          @change="updateNumber('titleOffsetY', $event)"
        />
      </label>
      <label class="card-settings__field">
        <span>{{ t(textKeys.dyeOffsetX) }}</span>
        <input
          type="number"
          :value="settings.dyeOffsetX"
          @change="updateNumber('dyeOffsetX', $event)"
        />
      </label>
      <label class="card-settings__field">
        <span>{{ t(textKeys.dyeOffsetY) }}</span>
        <input
          type="number"
          :value="settings.dyeOffsetY"
          @change="updateNumber('dyeOffsetY', $event)"
        />
      </label>
    </div>

    <div class="card-settings__color-row">
      <label class="card-settings__field card-settings__color">
        <span>{{ t(textKeys.fontColor) }}</span>
        <input
          type="color"
          :value="settings.fontColor"
          @input="emit('update', { fontColor: inputValue($event) })"
        />
      </label>
      <label class="card-settings__toggle">
        <input
          type="checkbox"
          :checked="settings.rarityColorEnabled"
          @change="emit('update', { rarityColorEnabled: checkedValue($event) })"
        />
        <span>{{ t(textKeys.rarityColorEnabled) }}</span>
      </label>
      <label class="card-settings__toggle">
        <input
          type="checkbox"
          :checked="settings.strokeEnabled"
          @change="emit('update', { strokeEnabled: checkedValue($event) })"
        />
        <span>{{ t(textKeys.strokeEnabled) }}</span>
      </label>
    </div>

    <div class="card-settings__grid">
      <label class="card-settings__field">
        <span>{{ t(textKeys.strokeRatio) }}</span>
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          :value="settings.strokeRatio"
          @change="updateNumber('strokeRatio', $event)"
        />
      </label>
      <label class="card-settings__field card-settings__color">
        <span>{{ t(textKeys.strokeColor) }}</span>
        <input
          type="color"
          :value="settings.strokeColor"
          @input="emit('update', { strokeColor: inputValue($event) })"
        />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getItemCardLocaleStyle } from '@/pages/item-card/lib/cardSettings'
import { buildItemCardFontOptions } from '@/pages/item-card/lib/fontNames'
import type {
  GlamourLocale,
  ItemCardLocaleStyle,
  ItemCardRenderSettings
} from '@/pages/item-card/lib/types'
import type { ItemCardSettingsPatch } from '@/pages/item-card/composables/useItemCardSettings'
import { itemCardTextKeys as textKeys } from '@/pages/item-card/locales/keys'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  settings: ItemCardRenderSettings
  locales: GlamourLocale[]
}>()

const emit = defineEmits<{
  update: [patch: ItemCardSettingsPatch]
  'update-locale-style': [locale: GlamourLocale, patch: Partial<ItemCardLocaleStyle>]
  'toggle-locale': [locale: GlamourLocale]
}>()

const { t } = useLocale()
const localFonts = ref<string[]>([])
const fontStatus = ref('')
const availableLocales = computed(() =>
  Array.from(new Set([...props.locales, ...props.settings.outputLocales])).filter(Boolean)
)
const activeStyle = computed(() =>
  getItemCardLocaleStyle(props.settings, props.settings.outputLocales[0] || 'zh')
)
const fontOptions = computed(() =>
  buildItemCardFontOptions([activeStyle.value.fontFamily, ...localFonts.value])
)

function localeLabel(locale: string): string {
  const key =
    {
      zh: textKeys.localeZh,
      en: textKeys.localeEn,
      ja: textKeys.localeJa,
      ko: textKeys.localeKo,
      tc: textKeys.localeTc,
      fr: textKeys.localeFr,
      de: textKeys.localeDe
    }[locale] || ''
  return key ? t(key) : locale
}

function inputValue(event: Event): string {
  return (event.currentTarget as HTMLInputElement).value
}

function numberValue(event: Event): number {
  return Number(inputValue(event))
}

function checkedValue(event: Event): boolean {
  return (event.currentTarget as HTMLInputElement).checked
}

function updateNumber(
  key: 'titleOffsetX' | 'titleOffsetY' | 'dyeOffsetX' | 'dyeOffsetY' | 'strokeRatio',
  event: Event
) {
  emit('update', { [key]: numberValue(event) })
}

function updateStyle(key: keyof ItemCardLocaleStyle, value: string | number) {
  props.settings.outputLocales.forEach((locale) => {
    emit('update-locale-style', locale, { [key]: value })
  })
}

async function loadLocalFonts() {
  const queryLocalFonts = (
    window as unknown as {
      queryLocalFonts?: () => Promise<Array<{ family?: string }>>
    }
  ).queryLocalFonts

  if (!queryLocalFonts) {
    fontStatus.value = t(textKeys.localFontsUnsupported)
    return
  }
  try {
    const fonts = await queryLocalFonts()
    localFonts.value = Array.from(
      new Set(fonts.map((font) => String(font.family || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b))
    fontStatus.value = t(textKeys.localFontsLoaded)
  } catch {
    fontStatus.value = t(textKeys.localFontsError)
  }
}
</script>

<style scoped>
.card-settings {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.card-settings h2 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 15px;
}

.card-settings__group {
  display: grid;
  gap: 7px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.card-settings__group legend,
.card-settings__field > span {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.card-settings__checks,
.card-settings__color-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.card-settings__checks label,
.card-settings__toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}

.card-settings__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.card-settings__text-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.card-settings__field {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.card-settings input[type='text'],
.card-settings input[type='number'],
.card-settings select {
  width: 100%;
  min-width: 0;
  height: 30px;
  padding: 4px 7px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font: 12px var(--ns-font-sans);
}

.card-settings__font-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 8px;
}

.card-settings__secondary {
  min-height: 30px;
  padding: 4px 8px;
  border: 1px solid var(--ns-color-border);
  border-radius: 3px;
  background: var(--ns-color-surface);
  color: var(--ns-color-text);
  font: 700 11px var(--ns-font-sans);
  cursor: pointer;
}

.card-settings__status {
  margin: -5px 0 0;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.card-settings__color-row {
  justify-content: space-between;
}

.card-settings__color {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.card-settings input[type='color'] {
  width: 34px;
  height: 28px;
  padding: 2px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
}
</style>
