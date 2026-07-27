<template>
  <section class="ffxiv-clock-section" :aria-labelledby="sectionTitleId">
    <h2 :id="sectionTitleId" class="ffxiv-clock-section__title ns-heading-bloom">
      {{ t(textKeys.clocksMechanisms) }}
    </h2>

    <div class="ffxiv-mechanism-grid">
      <article class="ffxiv-clock-card">
        <header class="ffxiv-clock-card__header">
          <div>
            <h3>{{ t(textKeys.housingTitle) }}</h3>
          </div>

          <div class="ffxiv-region-switch" role="group" :aria-label="t(textKeys.clocksRegion)">
            <button
              v-for="option in regionOptions"
              :key="option.value"
              type="button"
              :aria-pressed="region === option.value"
              @click="setRegion(option.value)"
            >
              {{ t(option.labelKey) }}
            </button>
          </div>
        </header>

        <div class="ffxiv-clock-card__banner ffxiv-clock-card__banner--panorama" aria-hidden="true">
          <img :src="housingBannerUrl" alt="" />
        </div>

        <p class="ffxiv-clock-card__primary-value">
          {{
            t(
              housingStatus.phase === 'entry'
                ? textKeys.housingEntryCallout
                : textKeys.housingResultsCallout
            )
          }}
        </p>

        <div class="ffxiv-clock-card__timing-row">
          <div class="ffxiv-clock-card__countdown">
            <span>
              {{
                t(
                  housingStatus.phase === 'entry'
                    ? textKeys.housingEntryClosesIn
                    : textKeys.housingEntryAvailableIn
                )
              }}
            </span>
            <FfxivCountdown :target-at="housingStatus.nextTransitionAt" :now="now" />
          </div>

          <dl class="ffxiv-clock-card__facts">
            <div>
              <dt>
                {{
                  t(
                    housingStatus.phase === 'entry'
                      ? textKeys.housingEntryClosesAt
                      : textKeys.housingNextEntryOpens
                  )
                }}
              </dt>
              <dd>
                <time :datetime="isoTime(housingStatus.nextTransitionAt)">
                  {{ formatTime(housingStatus.nextTransitionAt) }}
                </time>
              </dd>
            </div>
          </dl>
        </div>
      </article>

      <article class="ffxiv-clock-card">
        <header class="ffxiv-clock-card__header">
          <div>
            <h3>{{ t(textKeys.frontlineTitle) }}</h3>
          </div>
        </header>

        <div class="ffxiv-clock-card__banner ffxiv-clock-card__banner--panorama" aria-hidden="true">
          <img :src="frontlineBannerUrls[frontlineStatus.currentMap]" alt="" />
        </div>

        <p class="ffxiv-clock-card__primary-value">
          {{ t(frontlineMapKeys[frontlineStatus.currentMap]) }}
        </p>

        <div class="ffxiv-clock-card__timing-row">
          <div class="ffxiv-clock-card__countdown">
            <span>{{ t(textKeys.frontlineRotatesIn) }}</span>
            <FfxivCountdown :target-at="frontlineStatus.nextRotationAt" :now="now" />
          </div>

          <dl class="ffxiv-clock-card__facts">
            <div>
              <dt>{{ t(textKeys.frontlineNext) }}</dt>
              <dd>{{ t(frontlineMapKeys[frontlineStatus.nextMap]) }}</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import frontlineBorderlandRuinsBannerUrl from '@/assets/ffxiv/frontline-borderland-ruins.webp'
import frontlineFieldsOfGloryBannerUrl from '@/assets/ffxiv/frontline-fields-of-glory.webp'
import frontlineOnsalHakairBannerUrl from '@/assets/ffxiv/frontline-onsal-hakair.webp'
import frontlineSealRockBannerUrl from '@/assets/ffxiv/frontline-seal-rock.webp'
import frontlineWorqorChirtehBannerUrl from '@/assets/ffxiv/frontline-worqor-chirteh.webp'
import housingBannerUrl from '@/assets/ffxiv/housing-banner.webp'
import { getFrontlineRotation, type FrontlineMap } from '@/lib/ffxiv/time/frontlineRotation'
import {
  getHousingCycleStatus,
  housingCycleProfiles,
  type HousingRegion
} from '@/lib/ffxiv/time/housingCycle'
import { ffxivTextKeys as textKeys } from '@/locales/keys/ffxiv'
import { useLocale } from '@/stores/locale'
import FfxivCountdown from './FfxivCountdown.vue'

const props = defineProps<{
  now: number
}>()

const REGION_STORAGE_KEY = 'ns-ffxiv-clock-region'
const sectionTitleId = 'ffxiv-mechanism-clocks-title'
const { current: locale, t } = useLocale()
const region = ref<HousingRegion>(readStoredRegion())
const regionOptions: ReadonlyArray<{ value: HousingRegion; labelKey: string }> = [
  { value: 'cn', labelKey: textKeys.clocksRegionCn },
  { value: 'tw', labelKey: textKeys.clocksRegionTw },
  { value: 'global', labelKey: textKeys.clocksRegionGlobal }
]
const frontlineMapKeys: Record<FrontlineMap, string> = {
  sealRock: textKeys.frontlineMapSealRock,
  borderlandRuins: textKeys.frontlineMapBorderlandRuins,
  onsalHakair: textKeys.frontlineMapOnsalHakair,
  worqorChirteh: textKeys.frontlineMapWorqorChirteh,
  fieldsOfGlory: textKeys.frontlineMapFieldsOfGlory
}
const frontlineBannerUrls: Record<FrontlineMap, string> = {
  sealRock: frontlineSealRockBannerUrl,
  borderlandRuins: frontlineBorderlandRuinsBannerUrl,
  onsalHakair: frontlineOnsalHakairBannerUrl,
  worqorChirteh: frontlineWorqorChirtehBannerUrl,
  fieldsOfGlory: frontlineFieldsOfGloryBannerUrl
}

const housingStatus = computed(() =>
  getHousingCycleStatus(props.now, housingCycleProfiles[region.value])
)
const frontlineStatus = computed(() => getFrontlineRotation(props.now))
const dateFormatter = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    })
)

function readStoredRegion(): HousingRegion {
  const storedRegion = localStorage.getItem(REGION_STORAGE_KEY)
  return storedRegion === 'tw' || storedRegion === 'global' ? storedRegion : 'cn'
}

function setRegion(value: HousingRegion) {
  region.value = value
  localStorage.setItem(REGION_STORAGE_KEY, value)
}

function formatTime(timestamp: number): string {
  return dateFormatter.value.format(timestamp)
}

function isoTime(timestamp: number): string {
  return new Date(timestamp).toISOString()
}
</script>

<style scoped>
.ffxiv-clock-section {
  display: grid;
  gap: 14px;
}

.ffxiv-clock-section__title {
  margin: 0;
  font-family: var(--ns-font-pixel);
  font-size: 22px;
  font-weight: 950;
  line-height: 1.2;
}

.ffxiv-mechanism-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.ffxiv-clock-card {
  display: grid;
  min-width: 0;
  gap: 16px;
  padding: 18px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.ffxiv-clock-card__header {
  display: flex;
  min-width: 0;
  min-height: 34px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.ffxiv-clock-card__header h3 {
  margin: 0;
  color: var(--ns-color-text);
  font-family: var(--ns-font-pixel);
  font-size: 18px;
  font-weight: 950;
  line-height: 1.25;
}

.ffxiv-clock-card__banner {
  width: 100%;
  height: clamp(76px, 9vw, 112px);
  overflow: hidden;
  background: var(--ns-color-surface-muted);
}

.ffxiv-clock-card__banner img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.ffxiv-clock-card__banner--panorama {
  height: auto;
  aspect-ratio: 47 / 15;
}

.ffxiv-region-switch {
  display: inline-grid;
  grid-template-columns: repeat(3, auto);
  flex: 0 0 auto;
  border: 2px solid var(--ns-pixel-border);
}

.ffxiv-region-switch button {
  min-height: 30px;
  padding: 0 9px;
  border: 0;
  border-left: 2px solid var(--ns-pixel-border);
  background: transparent;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-ui);
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
  cursor: pointer;
}

.ffxiv-region-switch button:first-child {
  border-left: 0;
}

.ffxiv-region-switch button[aria-pressed='true'] {
  background: var(--ns-pixel-cyan-surface);
  color: var(--ns-color-text);
}

.ffxiv-region-switch button:focus-visible {
  position: relative;
  outline: 0;
  box-shadow: var(--ns-focus-ring);
}

.ffxiv-clock-card__countdown {
  display: grid;
  gap: 8px;
}

.ffxiv-clock-card__timing-row {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(180px, 0.75fr);
  align-items: end;
  gap: 20px;
}

.ffxiv-clock-card__countdown > span {
  color: var(--ns-color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.ffxiv-clock-card__primary-value {
  margin: 0;
  color: var(--ns-color-text);
  font-family: var(--ns-font-data);
  font-size: 26px;
  font-weight: 950;
  line-height: 1.2;
}

.ffxiv-clock-card__facts {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin: 0;
}

.ffxiv-clock-card__facts > div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.ffxiv-clock-card__facts dt {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.ffxiv-clock-card__facts dd {
  min-width: 0;
  margin: 0;
  color: var(--ns-color-text);
  font-family: var(--ns-font-data);
  font-size: 13px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .ffxiv-mechanism-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .ffxiv-clock-card {
    padding: 14px;
  }

  .ffxiv-clock-card__header {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .ffxiv-region-switch {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
  }

  .ffxiv-region-switch button {
    padding: 0 6px;
  }

  .ffxiv-clock-card__facts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .ffxiv-clock-card__timing-row {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 12px;
  }
}
</style>
