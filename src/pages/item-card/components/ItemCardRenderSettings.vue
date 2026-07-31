<template>
  <section class="card-settings">
    <h2 class="ns-heading-bloom">{{ t(textKeys.settingsTitle) }}</h2>

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
      <AppField
        class="card-settings__field"
        :label="t(textKeys.fontFamily)"
        for-id="item-card-font-family"
        density="compact"
      >
        <select
          id="item-card-font-family"
          :value="activeStyle.fontFamily"
          @change="updateStyle('fontFamily', inputValue($event))"
        >
          <option v-for="font in fontOptions" :key="font.value" :value="font.value">
            {{ font.label }}
          </option>
        </select>
      </AppField>
      <button type="button" class="ns-button ns-button--compact" @click="loadLocalFonts">
        {{ t(textKeys.loadLocalFonts) }}
      </button>
    </div>
    <p v-if="fontStatus" class="card-settings__status">{{ fontStatus }}</p>

    <div class="card-settings__grid card-settings__text-grid">
      <AppField
        class="card-settings__field"
        :label="t(textKeys.titleSize)"
        for-id="item-card-title-size"
        density="compact"
      >
        <input
          id="item-card-title-size"
          type="number"
          min="8"
          max="64"
          :value="activeStyle.titleSize"
          @change="updateStyle('titleSize', numberValue($event))"
        />
      </AppField>
      <AppField
        class="card-settings__field"
        :label="t(textKeys.titleWeight)"
        for-id="item-card-title-weight"
        density="compact"
      >
        <input
          id="item-card-title-weight"
          type="number"
          min="100"
          max="900"
          step="100"
          :value="activeStyle.titleWeight"
          @change="updateStyle('titleWeight', numberValue($event))"
        />
      </AppField>
      <AppField
        class="card-settings__field"
        :label="t(textKeys.dyeSize)"
        for-id="item-card-dye-size"
        density="compact"
      >
        <input
          id="item-card-dye-size"
          type="number"
          min="8"
          max="48"
          :value="activeStyle.dyeSize"
          @change="updateStyle('dyeSize', numberValue($event))"
        />
      </AppField>
    </div>

    <div class="card-settings__grid">
      <AppField
        class="card-settings__field"
        :label="t(textKeys.titleOffsetX)"
        for-id="item-card-title-offset-x"
        density="compact"
      >
        <input
          id="item-card-title-offset-x"
          type="number"
          :value="settings.titleOffsetX"
          @change="updateNumber('titleOffsetX', $event)"
        />
      </AppField>
      <AppField
        class="card-settings__field"
        :label="t(textKeys.titleOffsetY)"
        for-id="item-card-title-offset-y"
        density="compact"
      >
        <input
          id="item-card-title-offset-y"
          type="number"
          :value="settings.titleOffsetY"
          @change="updateNumber('titleOffsetY', $event)"
        />
      </AppField>
      <AppField
        class="card-settings__field"
        :label="t(textKeys.dyeOffsetX)"
        for-id="item-card-dye-offset-x"
        density="compact"
      >
        <input
          id="item-card-dye-offset-x"
          type="number"
          :value="settings.dyeOffsetX"
          @change="updateNumber('dyeOffsetX', $event)"
        />
      </AppField>
      <AppField
        class="card-settings__field"
        :label="t(textKeys.dyeOffsetY)"
        for-id="item-card-dye-offset-y"
        density="compact"
      >
        <input
          id="item-card-dye-offset-y"
          type="number"
          :value="settings.dyeOffsetY"
          @change="updateNumber('dyeOffsetY', $event)"
        />
      </AppField>
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
      <AppField
        class="card-settings__field"
        :label="t(textKeys.strokeRatio)"
        for-id="item-card-stroke-ratio"
        density="compact"
      >
        <input
          id="item-card-stroke-ratio"
          type="number"
          min="0"
          max="1"
          step="0.05"
          :value="settings.strokeRatio"
          @change="updateNumber('strokeRatio', $event)"
        />
      </AppField>
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
import AppField from '@/components/AppField.vue'
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
  font-family: var(--ns-font-pixel);
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
.card-settings__color > span {
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

.card-settings__font-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 8px;
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
  border-radius: 0;
  background: var(--ns-color-surface-solid);
}
</style>
