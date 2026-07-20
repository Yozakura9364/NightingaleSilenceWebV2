<template>
  <main class="ns-page home-page" :aria-label="t(textKeys.homeDesktop)">
    <section
      ref="desktopEl"
      class="home-desktop"
      :class="{
        'home-desktop--background-glitching': isNightBackgroundGlitching,
        'home-desktop--to-night': homeThemeTransition === 'to-night',
        'home-desktop--to-day': homeThemeTransition === 'to-day',
        'home-desktop--dragging': draggedHomeWindowKey !== null
      }"
      aria-labelledby="home-title"
      @pointerdown="handleHomeWindowPointerDown"
      @pointermove="handleHomeDesktopPointerMove"
      @pointerup="finishHomeWindowDrag"
      @pointercancel="finishHomeWindowDrag"
      @pointerleave="resetHomePointer"
    >
      <span class="home-night-ambient home-night-ambient--depth" aria-hidden="true"></span>
      <span class="home-night-ambient home-night-ambient--stardust" aria-hidden="true"></span>

      <div class="home-day-foreground" :style="homeDayArtStyle" aria-hidden="true"></div>
      <div
        class="home-night-foreground"
        :class="{ 'home-night-foreground--glitching': isNightPortraitGlitching }"
        :style="homeNightArtStyle"
        aria-hidden="true"
      ></div>

      <nav class="home-desktop__icons" :aria-label="t(textKeys.primaryNavigation)">
        <RouterLink
          v-for="item in desktopIcons"
          :key="item.id"
          class="home-desktop-icon"
          :to="item.route"
          :class="`home-desktop-icon--${item.tone}`"
        >
          <span class="home-desktop-icon__image" :style="pixelIconStyle(item.icon)" aria-hidden="true"></span>
          <span class="home-desktop-icon__label">{{ t(item.labelKey) }}</span>
        </RouterLink>
      </nav>

      <div class="home-day-windows">
        <article
          v-show="isDayWindowVisible('main')"
          class="home-window home-day-window home-window--main"
          data-home-window="day:main"
          :style="homeWindowStyle('day', 'main')"
          :aria-label="t(siteMeta.zhNameKey)"
        >
          <div class="home-window__bar">
            <span class="home-window__title">
              <span class="home-window__icon" :style="pixelIconStyle(pixelHomeIcon)" aria-hidden="true"></span>
              <span>{{ t(siteMeta.enNameKey) }}</span>
            </span>
            <span class="home-window__controls">
              <span class="home-window__control home-window__control--min" aria-hidden="true"></span>
              <span class="home-window__control home-window__control--max" aria-hidden="true"></span>
              <button
                type="button"
                class="home-window__control home-window__control--close"
                :aria-label="t(textKeys.closeWindow)"
                @click="closeDayWindow('main')"
              ></button>
            </span>
          </div>

          <div class="home-window__body home-window__body--main">
            <div class="home-profile">
              <div class="home-profile__art" :style="homeCharacterArtStyle" aria-hidden="true"></div>
              <div class="home-profile__copy">
                <h1 id="home-title">
                  <span
                    v-if="isHomeCharacterArtPreview"
                    class="home-profile__logo"
                    :style="homeLogoArtStyle"
                    aria-hidden="true"
                  ></span>
                  <span :class="{ 'ns-sr-only': isHomeCharacterArtPreview }">{{ t(siteMeta.zhNameKey) }}</span>
                </h1>
                <p>{{ t(textKeys.placeholder) }}</p>
              </div>
            </div>
          </div>
        </article>

        <aside
          v-show="isDayWindowVisible('links')"
          class="home-window home-day-window home-window--links"
          data-home-window="day:links"
          :style="homeWindowStyle('day', 'links')"
          :aria-label="t(textKeys.ffxivWorkshop)"
        >
          <div class="home-window__bar home-window__bar--blue">
            <span class="home-window__title">
              <span class="home-window__icon" :style="pixelIconStyle(pixelFolderIcon)" aria-hidden="true"></span>
              <span>{{ t(textKeys.ffxivWorkshop) }}</span>
            </span>
            <span class="home-window__controls">
              <span class="home-window__control home-window__control--min" aria-hidden="true"></span>
              <button
                type="button"
                class="home-window__control home-window__control--close"
                :aria-label="t(textKeys.closeWindow)"
                @click="closeDayWindow('links')"
              ></button>
            </span>
          </div>

          <div class="home-window__body home-link-list">
            <RouterLink
              v-for="link in homeWorkshopLinks"
              :key="link.id"
              class="home-link-list__item"
              :to="link.route"
            >
              <span class="home-link-list__icon" :style="pixelIconStyle(link.icon)" aria-hidden="true"></span>
              <span>{{ t(link.labelKey) }}</span>
            </RouterLink>
          </div>
        </aside>

        <aside
          v-show="isDayWindowVisible('portrait')"
          class="home-window home-day-window home-window--portrait"
          data-home-window="day:portrait"
          :style="homeWindowStyle('day', 'portrait')"
          :aria-label="t(textKeys.homeAvatarYoine)"
        >
          <div class="home-window__bar home-window__bar--blue">
            <span class="home-window__title">
              <span class="home-window__icon" :style="pixelIconStyle(pixelImageIcon)" aria-hidden="true"></span>
              <span>{{ t(textKeys.homeAvatarYoine) }}</span>
            </span>
            <span class="home-window__controls">
              <span class="home-window__control home-window__control--min" aria-hidden="true"></span>
              <button
                type="button"
                class="home-window__control home-window__control--close"
                :aria-label="t(textKeys.closeWindow)"
                @click="closeDayWindow('portrait')"
              ></button>
            </span>
          </div>
          <div class="home-day-portrait" :style="homeDayPortraitStyle" aria-hidden="true"></div>
        </aside>
      </div>

      <div class="home-night-windows">
        <aside
          v-show="isNightWindowVisible('status')"
          class="home-window home-night-window home-night-window--status"
          data-home-window="night:status"
          :style="homeWindowStyle('night', 'status')"
          :aria-label="t(textKeys.homeNightStatusWindow)"
        >
          <div class="home-window__bar home-window__bar--violet">
            <span class="home-window__title">
              <span class="home-window__icon" :style="pixelIconStyle(pixelSparklesIcon)" aria-hidden="true"></span>
              <span>{{ t(textKeys.homeNightStatusWindow) }}</span>
            </span>
            <span class="home-window__controls">
              <span class="home-window__control home-window__control--min" aria-hidden="true"></span>
              <button
                type="button"
                class="home-window__control home-window__control--close"
                :aria-label="t(textKeys.closeWindow)"
                @click="closeNightWindow('status')"
              ></button>
            </span>
          </div>
          <div class="home-night-status">
            <div v-for="metric in nightMetrics" :key="metric.id" class="home-night-status__item">
              <span>{{ t(metric.labelKey) }}</span>
              <strong :key="metric.value" :class="`home-night-status__value--${metric.trend}`">{{ metric.value }}</strong>
              <i :style="{ '--home-progress-size': metric.size }"></i>
            </div>
          </div>
        </aside>

        <aside
          v-show="isNightWindowVisible('dialogue')"
          class="home-window home-night-window home-night-window--dialogue"
          data-home-window="night:dialogue"
          :style="homeWindowStyle('night', 'dialogue')"
          :aria-label="t(textKeys.homeNightDialogueWindow)"
        >
          <div class="home-window__bar home-window__bar--violet">
            <span class="home-window__title">
              <span class="home-window__icon" :style="pixelIconStyle(pixelAvatarCircleIcon)" aria-hidden="true"></span>
              <span>{{ t(textKeys.homeNightDialogueWindow) }}</span>
            </span>
            <span class="home-window__controls">
              <span class="home-window__control home-window__control--min" aria-hidden="true"></span>
              <button
                type="button"
                class="home-window__control home-window__control--close"
                :aria-label="t(textKeys.closeWindow)"
                @click="closeNightWindow('dialogue')"
              ></button>
            </span>
          </div>
          <div class="home-night-dialogue">
            <p v-for="message in nightDialogueMessages" :key="message.id">
              <span
                class="home-night-dialogue__avatar"
                :class="{ 'home-night-dialogue__avatar--portrait': isHomeCharacterArtPreview }"
                :style="homeChatAvatarStyle(message.avatar)"
                aria-hidden="true"
              >{{ isHomeCharacterArtPreview ? '' : message.icon }}</span>
              <strong>{{ t(message.nameKey) }}</strong>
              <span class="home-night-dialogue__preview">{{ t(message.previewKey) }}</span>
              <span
                v-if="message.unread"
                class="home-night-dialogue__unread"
                :aria-label="t(textKeys.homeNightDialogueUnread)"
              ></span>
            </p>
          </div>
        </aside>

        <aside
          v-show="isNightWindowVisible('chat')"
          class="home-window home-night-window home-night-window--chat"
          data-home-window="night:chat"
          :style="homeWindowStyle('night', 'chat')"
          :aria-label="t(textKeys.homeNightChatWindow)"
        >
          <div class="home-window__bar home-window__bar--pink">
            <span class="home-window__title">
              <span aria-hidden="true">💬</span>
              <span>{{ t(textKeys.homeNightChatWindow) }}</span>
            </span>
            <span class="home-window__controls">
              <span class="home-window__control home-window__control--min" aria-hidden="true"></span>
              <button
                type="button"
                class="home-window__control home-window__control--close"
                :aria-label="t(textKeys.closeWindow)"
                @click="closeNightWindow('chat')"
              ></button>
            </span>
          </div>
          <div class="home-night-chat">
            <p v-for="message in nightFragmentRecords" :key="message.id" :class="`home-night-chat__message--${message.side}`">
              <span
                class="home-night-chat__avatar"
                :class="{ 'home-night-chat__avatar--portrait': isHomeCharacterArtPreview }"
                :style="homeChatAvatarStyle(message.avatar)"
                aria-hidden="true"
              >{{ isHomeCharacterArtPreview ? '' : message.icon }}</span>
              <strong>{{ t(message.nameKey) }}</strong>
              <span class="home-night-fragment-stability" v-for="meter in message.meters" :key="meter.id">
                <span>{{ t(meter.labelKey) }}</span>
                <i :style="{ '--home-progress-size': meter.size }"></i>
              </span>
            </p>
            <div class="home-night-world-stability">
              <span>{{ t(textKeys.homeNightWorldStability) }}</span>
              <i :style="{ '--home-progress-size': nightWorldStability.size }"></i>
            </div>
          </div>
        </aside>

        <aside
          v-show="isNightWindowVisible('assets')"
          class="home-window home-night-window home-night-window--assets"
          data-home-window="night:assets"
          :style="homeWindowStyle('night', 'assets')"
          :aria-label="t(textKeys.homeArchiveWindow)"
        >
          <div class="home-window__bar home-window__bar--hot">
            <span class="home-window__title">
              <span class="home-window__icon" :style="pixelIconStyle(pixelArchiveIcon)" aria-hidden="true"></span>
              <span>{{ t(textKeys.homeArchiveWindow) }}</span>
            </span>
            <span class="home-window__controls">
              <span class="home-window__control home-window__control--min" aria-hidden="true"></span>
              <button
                type="button"
                class="home-window__control home-window__control--close"
                :aria-label="t(textKeys.closeWindow)"
                @click="closeNightWindow('assets')"
              ></button>
            </span>
          </div>
          <div class="home-avatar-list home-avatar-list--archive">
            <div
              v-for="avatar in nightAvatarCards"
              :key="avatar.id"
              class="home-avatar-card"
              :class="`home-avatar-card--${avatar.tone}`"
            >
              <span class="home-avatar-card__portrait" :style="homeAvatarStyle(avatar.image)" aria-hidden="true"></span>
              <span class="home-avatar-card__name">{{ t(avatar.nameKey) }}</span>
              <span class="home-avatar-card__state">{{ t(avatar.stateKey) }}</span>
            </div>
          </div>
        </aside>

        <aside
          v-show="isNightWindowVisible('control')"
          class="home-window home-night-window home-night-window--control"
          data-home-window="night:control"
          :style="homeWindowStyle('night', 'control')"
          :aria-label="t(textKeys.homeNightControlWindow)"
        >
          <div class="home-window__bar home-window__bar--cyan">
            <span class="home-window__title">
              <span aria-hidden="true">♫</span>
              <span>{{ t(textKeys.homeNightControlWindow) }}</span>
            </span>
            <span class="home-window__controls">
              <span class="home-window__control home-window__control--min" aria-hidden="true"></span>
              <span class="home-window__control home-window__control--max" aria-hidden="true"></span>
              <button
                type="button"
                class="home-window__control home-window__control--close"
                :aria-label="t(textKeys.closeWindow)"
                @click="closeNightWindow('control')"
              ></button>
            </span>
          </div>
          <div class="home-night-player">
            <div class="home-night-player__brand" aria-hidden="true">
              {{ t(textKeys.homeNightPlayerDevice) }}
            </div>
            <div class="home-night-player__pad" aria-hidden="true">
              <span class="home-night-player__pad-button home-night-player__pad-button--up"></span>
              <span class="home-night-player__pad-button home-night-player__pad-button--left"></span>
              <span class="home-night-player__pad-button home-night-player__pad-button--center">Ⅱ</span>
              <span class="home-night-player__pad-button home-night-player__pad-button--right"></span>
              <span class="home-night-player__pad-button home-night-player__pad-button--down"></span>
            </div>
            <div class="home-night-player__screen">
              <div class="home-night-player__meta">
                <strong>{{ t(textKeys.homeNightTrackTitle) }}</strong>
                <span>{{ t(textKeys.homeNightTrackArtist) }}</span>
              </div>
              <div class="home-night-player__equalizer" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </div>
              <div class="home-night-player__progress" aria-hidden="true">
                <i></i>
              </div>
              <div class="home-night-player__time" aria-hidden="true">
                <span>00:29</span>
                <span>03:17</span>
              </div>
            </div>
            <div class="home-night-player__controls" aria-hidden="true">
              <span class="home-night-player__control--rewind"></span>
              <span class="home-night-player__control--fast-forward"></span>
              <span class="home-night-player__control--pause"></span>
              <span class="home-night-player__control--next"></span>
            </div>
          </div>
        </aside>
      </div>

      <nav class="home-taskbar" :aria-label="t(textKeys.menuTitle)">
        <RouterLink class="home-taskbar__start" :to="siteRoutes.home">
          <span class="home-taskbar__start-icon" :style="pixelIconStyle(pixelSparklesIcon)" aria-hidden="true"></span>
          <span>{{ t(textKeys.homeDream) }}</span>
        </RouterLink>

        <span class="home-taskbar__separator home-taskbar__separator--start" aria-hidden="true"></span>

        <div class="home-taskbar__windows home-taskbar__windows--day">
          <a
            v-for="link in homeSocialLinks"
            :key="link.id"
            class="home-taskbar__window home-taskbar__window--social"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="t(link.labelKey)"
            :title="t(link.labelKey)"
          >
            <img class="home-taskbar__social-icon" :src="link.icon" alt="" aria-hidden="true">
            <span>{{ t(link.labelKey) }}</span>
          </a>
        </div>

        <div class="home-taskbar__windows home-taskbar__windows--night">
          <RouterLink
            v-for="item in taskbarItems"
            :key="item.id"
            class="home-taskbar__window"
            :class="{ 'home-taskbar__window--active': item.active }"
            :to="item.route"
          >
            <span class="home-taskbar__dot" aria-hidden="true"></span>
            <span>{{ t(item.labelKey) }}</span>
          </RouterLink>
        </div>

        <span class="home-taskbar__separator home-taskbar__separator--clock" aria-hidden="true"></span>
        <button
          type="button"
          class="home-taskbar__clock"
          :aria-label="t(textKeys.homeDesktopClock)"
          @click="toggleHomeTheme"
        >
          <span class="home-taskbar__mode" aria-hidden="true"></span>
          <span>{{ homeClockLabel }}</span>
        </button>
      </nav>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { RouterLink } from 'vue-router'
import pixelArchiveIcon from '@/assets/icons/pixelarticons/archive.svg'
import pixelAvatarCircleIcon from '@/assets/icons/pixelarticons/avatar-circle.svg'
import pixelFolderIcon from '@/assets/icons/pixelarticons/folder.svg'
import pixelHomeIcon from '@/assets/icons/pixelarticons/home.svg'
import pixelImageIcon from '@/assets/icons/pixelarticons/image.svg'
import pixelSparklesIcon from '@/assets/icons/pixelarticons/sparkles.svg'
import { isSilenceEnabled } from '@/config/features'
import { ffxivTools, siteMeta, siteRoutes } from '@/config/site'
import { siteSocialLinks } from '@/config/socialLinks'
import { homeTextKeys as textKeys } from '@/locales/keys/home'
import { homeUiMessages } from '@/locales/modules/home'
import { loadMessages, useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'

loadMessages(homeUiMessages)

const { t } = useLocale()
const { current: themeMode, setThemeMode } = useTheme()
const desktopEl = ref<HTMLElement | null>(null)
const isNightPortraitGlitching = ref(false)
const isNightBackgroundGlitching = ref(false)
const nightMetricTick = ref(0)

type NightMetricTrend = 'rise' | 'fall'
type DayWindowId = 'main' | 'links' | 'portrait'
type NightWindowId = 'status' | 'dialogue' | 'chat' | 'assets' | 'control'
type HomeThemeTransition = 'idle' | 'to-night' | 'to-day'
type HomeWindowLayer = 'day' | 'night'
type HomeWindowKey = `day:${DayWindowId}` | `night:${NightWindowId}`

interface HomeWindowPosition {
  x: number
  y: number
  zIndex: number
}

interface HomeWindowDragState {
  key: HomeWindowKey
  pointerId: number
  startClientX: number
  startClientY: number
  originX: number
  originY: number
  windowElement: HTMLElement
  barElement: HTMLElement
}

interface NightStabilityMotion {
  base: number
  amplitude: number
  speed: number
  phase: number
}

interface NightFragmentStabilityConfig {
  id: string
  nameKey: string
  avatar: string
  icon: string
  side: 'left' | 'right'
  dialoguePreviewKey?: string
  dialogueUnread?: boolean
  existence: NightStabilityMotion
  mental: NightStabilityMotion
}

const HOME_THEME_TRANSITION_MS = 1060
const hiddenDayWindowIds = ref<DayWindowId[]>([])
const hiddenNightWindowIds = ref<NightWindowId[]>([])
const homeThemeTransition = ref<HomeThemeTransition>('idle')
const homeWindowPositions = ref<Partial<Record<HomeWindowKey, HomeWindowPosition>>>({})
const draggedHomeWindowKey = ref<HomeWindowKey | null>(null)
const dayWindowRespawnTimers = new Map<DayWindowId, number>()
const nightWindowRespawnTimers = new Map<NightWindowId, number>()

let pointerFrame = 0
let pointerTargetX = 0
let pointerTargetY = 0
let pointerCurrentX = 0
let pointerCurrentY = 0
let nightPortraitGlitchTimer = 0
let nightPortraitGlitchBurstTimer = 0
let nightPortraitGlitchRepeatTimer = 0
let nightBackgroundGlitchTimer = 0
let nightBackgroundGlitchBurstTimer = 0
let nightBackgroundGlitchRepeatTimer = 0
let nightMetricTimer = 0
let homeThemeTransitionTimer = 0
let homeWindowTopZIndex = 20
let activeHomeWindowDrag: HomeWindowDragState | null = null

const isHomeCharacterArtPreview = import.meta.env.DEV
const localAssetBase = import.meta.env.VITE_LOCAL_ASSET_BASE
const homeCharacterArtStyle = computed(
  () =>
    ({
      '--home-character-art-url': isHomeCharacterArtPreview
        ? `url("${localAssetBase}/yoine-1.png")`
        : 'none'
    }) as CSSProperties
)
const homeLogoArtStyle = computed(
  () =>
    ({
      '--home-logo-art-url': isHomeCharacterArtPreview
        ? `url("${localAssetBase}/nightingale-logo-1.webp")`
        : 'none'
    }) as CSSProperties
)
const homeDayArtStyle = computed(
  () =>
    ({
      '--home-day-art-url': isHomeCharacterArtPreview
        ? `url("${localAssetBase}/yoine-6.webp")`
        : 'none'
    }) as CSSProperties
)
const homeDayPortraitStyle = computed(
  () =>
    ({
      '--home-day-portrait-url': isHomeCharacterArtPreview
        ? `url("${localAssetBase}/yoine-8.png")`
        : 'none'
    }) as CSSProperties
)
const homeNightArtStyle = computed(
  () =>
    ({
      '--home-night-art-url': isHomeCharacterArtPreview
        ? `url("${localAssetBase}/yoin-3.webp")`
        : 'none'
    }) as CSSProperties
)
const homeClockLabel = computed(() => (themeMode.value === 'night' ? '00:29' : '06:29'))

const nightAvatarCards = [
  {
    id: 'yoine',
    nameKey: textKeys.homeAvatarYoine,
    stateKey: textKeys.homeArchiveStable,
    image: `${localAssetBase}/yoine-avatar.webp`,
    tone: 'stable'
  },
  {
    id: 'yoin',
    nameKey: textKeys.homeAvatarYoin,
    stateKey: textKeys.homeArchiveCorrupt,
    image: `${localAssetBase}/yoin-avatar.webp`,
    tone: 'corrupt'
  }
] as const

const desktopIcons = [
  ...(isSilenceEnabled
    ? [
        {
          id: 'dream',
          labelKey: textKeys.homeDream,
          route: siteRoutes.silence,
          icon: pixelSparklesIcon,
          tone: 'pink'
        },
        {
          id: 'angel',
          labelKey: textKeys.homeAngel,
          route: siteRoutes.silenceAngel,
          icon: pixelAvatarCircleIcon,
          tone: 'blue'
        },
        {
          id: 'glitch',
          labelKey: textKeys.homeGlitch,
          route: siteRoutes.silenceGlitch,
          icon: pixelArchiveIcon,
          tone: 'violet'
        }
      ]
    : []),
  {
    id: 'network',
    labelKey: textKeys.homeNetworkNeighbor,
    route: siteRoutes.about,
    icon: pixelFolderIcon,
    tone: 'mint'
  }
] as const

const taskbarItems = [
  {
    id: 'profile',
    labelKey: textKeys.siteZhName,
    route: siteRoutes.home,
    active: true
  },
  {
    id: 'ffxiv',
    labelKey: textKeys.ffxivWorkshop,
    route: siteRoutes.ffxiv,
    active: false
  },
  ...(isSilenceEnabled
    ? [
        {
          id: 'silence',
          labelKey: textKeys.silence,
          route: siteRoutes.silence,
          active: false
        }
      ]
    : [])
] as const

const homeWorkshopLinks = [
  ...ffxivTools.map((tool) => ({
    id: tool.id,
    labelKey: tool.titleKey,
    route: tool.route,
    icon: workshopIconFor(tool.id)
  }))
] as const

const nightMetricBases = [
  {
    id: 'heart-rate',
    labelKey: textKeys.homeNightHeartRate,
    baseValue: 72,
    baseSize: 64,
    valueJitter: 3,
    sizeJitter: 12
  },
  {
    id: 'oxygen-saturation',
    labelKey: textKeys.homeNightOxygenSaturation,
    baseValue: 98,
    baseSize: 77,
    valueJitter: 1,
    sizeJitter: 9
  },
  {
    id: 'neural-activity',
    labelKey: textKeys.homeNightNeuralActivity,
    baseValue: 63,
    baseSize: 42,
    valueJitter: 4,
    sizeJitter: 15
  }
] as const

const nightMetrics = computed(() =>
  nightMetricBases.map((metric, index) => {
    const pulse = nightMetricTick.value
    const wave = Math.sin(pulse * 0.86 + index * 1.75)
    const counterWave = Math.cos(pulse * 0.47 + index * 2.35)
    const valueOffset = Math.round(wave * metric.valueJitter + counterWave * metric.valueJitter * 0.36)
    const size = clampNumber(metric.baseSize + wave * metric.sizeJitter + counterWave * 4, 18, 92)
    const trend: NightMetricTrend = valueOffset >= 0 ? 'rise' : 'fall'

    return {
      id: metric.id,
      labelKey: metric.labelKey,
      value: formatNightVitalValue(metric.id, metric.baseValue + valueOffset),
      size: `${Math.round(size)}%`,
      trend
    }
  })
)

const nightFragmentStabilityConfigs: readonly NightFragmentStabilityConfig[] = [
  {
    id: 'geliya',
    nameKey: textKeys.homeNightFragmentGeliya,
    avatar: '歌莉亚-像素小人.png',
    icon: '◇',
    side: 'left',
    dialoguePreviewKey: textKeys.homeNightDialogueGeliya,
    existence: { base: 100, amplitude: 0, speed: 0, phase: 0 },
    mental: { base: 95, amplitude: 5, speed: 0.61, phase: 2.4 }
  },
  {
    id: 'gelin',
    nameKey: textKeys.homeNightFragmentGelin,
    avatar: '歌林-像素小人.png',
    icon: '◈',
    side: 'right',
    existence: { base: 95, amplitude: 5, speed: 0.42, phase: 4.1 },
    mental: { base: 80, amplitude: 10, speed: 0.68, phase: 5.7 }
  },
  {
    id: 'qianzao',
    nameKey: textKeys.homeNightFragmentQianzao,
    avatar: '千早-像素小人.png',
    icon: '🌸',
    side: 'left',
    existence: { base: 90, amplitude: 10, speed: 0.66, phase: 0 },
    mental: { base: 55, amplitude: 15, speed: 0.74, phase: 0 }
  },
  {
    id: 'naiyi',
    nameKey: textKeys.homeNightFragmentNaiyi,
    avatar: '奈伊-像素小人.png',
    icon: '👻',
    side: 'right',
    dialoguePreviewKey: textKeys.homeNightDialogueNaiyi,
    existence: { base: 70, amplitude: 10, speed: 0.84, phase: 2.6 },
    mental: { base: 15, amplitude: 15, speed: 0.57, phase: 3.8 }
  },
  {
    id: 'nightingale',
    nameKey: textKeys.homeNightFragmentNightingale,
    avatar: '南丁格尔-像素小人.png',
    icon: '🧸',
    side: 'left',
    existence: { base: 40, amplitude: 40, speed: 2.4, phase: 1.3 },
    mental: { base: 40, amplitude: 40, speed: 3.1, phase: 1.9 }
  },
  {
    id: 'shalewan',
    nameKey: textKeys.homeNightFragmentShalewan,
    avatar: '沙乐万-像素小人.png',
    icon: '○',
    side: 'right',
    dialoguePreviewKey: textKeys.homeNightDialogueShalewan,
    dialogueUnread: true,
    existence: { base: 40, amplitude: 40, speed: 2.8, phase: 3.2 },
    mental: { base: 100, amplitude: 0, speed: 0, phase: 0 }
  }
] as const

const nightWorldStabilityMotion: NightStabilityMotion = {
  base: 73,
  amplitude: 10,
  speed: 0.42,
  phase: 0
}

const nightFragmentRecords = computed(() =>
  nightFragmentStabilityConfigs.map((message) => {
    return {
      ...message,
      meters: [
        { id: 'existence', labelKey: textKeys.homeNightExistenceStability, size: nightStabilitySize(message.existence) },
        { id: 'mental', labelKey: textKeys.homeNightMentalStability, size: nightStabilitySize(message.mental) }
      ]
    }
  })
)

const nightWorldStability = computed(() => ({ size: nightStabilitySize(nightWorldStabilityMotion) }))

const nightDialogueMessages = computed(() =>
  nightFragmentStabilityConfigs.flatMap((message) =>
    message.dialoguePreviewKey
      ? [{ ...message, previewKey: message.dialoguePreviewKey, unread: message.dialogueUnread === true }]
      : []
  )
)

const homeSocialLinks = siteSocialLinks.map((link) => ({
  ...link,
  labelKey: `home.social.${link.id}`
}))

function workshopIconFor(id: string) {
  if (id === 'itemCard') {
    return pixelImageIcon
  }

  if (id === 'glamour') {
    return pixelSparklesIcon
  }

  if (id === 'armoire') {
    return pixelArchiveIcon
  }

  return pixelHomeIcon
}

function pixelIconStyle(icon: string): CSSProperties {
  return {
    '--home-icon-url': `url("${icon}")`
  } as CSSProperties
}

function homeAvatarStyle(image: string): CSSProperties {
  return {
    '--home-avatar-url': isHomeCharacterArtPreview ? `url("${image}")` : `url("${pixelAvatarCircleIcon}")`
  } as CSSProperties
}

function homeChatAvatarStyle(filename: string): CSSProperties | undefined {
  if (!isHomeCharacterArtPreview) {
    return undefined
  }

  return {
    '--home-chat-avatar-url': `url("${localAssetBase}/${encodeURIComponent(filename)}")`
  } as CSSProperties
}

function toggleHomeTheme() {
  setThemeMode(themeMode.value === 'night' ? 'day' : 'night')
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function nightStabilitySize(motion: NightStabilityMotion) {
  const value = motion.base + Math.sin(nightMetricTick.value * motion.speed + motion.phase) * motion.amplitude
  return `${Math.round(clampNumber(value, 0, 100))}%`
}

function formatHomeMetricValue(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString('en-US')
}

function formatNightVitalValue(id: string, value: number) {
  const formattedValue = formatHomeMetricValue(value)
  return id === 'heart-rate' ? `${formattedValue} BPM` : `${formattedValue}%`
}

function randomHomeDelay(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min))
}

function homeWindowKey(layer: HomeWindowLayer, id: DayWindowId | NightWindowId): HomeWindowKey {
  return `${layer}:${id}` as HomeWindowKey
}

function parseHomeWindowKey(value: string | undefined): HomeWindowKey | null {
  if (!value) {
    return null
  }

  const [layer, id] = value.split(':')
  const isDayWindow = layer === 'day' && ['main', 'links', 'portrait'].includes(id)
  const isNightWindow = layer === 'night' && ['status', 'dialogue', 'chat', 'assets', 'control'].includes(id)

  return isDayWindow || isNightWindow ? (value as HomeWindowKey) : null
}

function homeWindowStyle(layer: HomeWindowLayer, id: DayWindowId | NightWindowId): CSSProperties {
  const position = homeWindowPositions.value[homeWindowKey(layer, id)]

  return {
    '--home-window-offset-x': `${position?.x ?? 0}px`,
    '--home-window-offset-y': `${position?.y ?? 0}px`,
    zIndex: position?.zIndex
  } as CSSProperties
}

function canDragHomeWindows() {
  return window.innerWidth > 720
}

function handleHomeWindowPointerDown(event: PointerEvent) {
  if (event.button !== 0 || !canDragHomeWindows()) {
    return
  }

  const target = event.target
  if (!(target instanceof Element) || target.closest('.home-window__controls')) {
    return
  }

  const barElement = target.closest<HTMLElement>('.home-window__bar')
  const windowElement = barElement?.closest<HTMLElement>('[data-home-window]')
  const key = parseHomeWindowKey(windowElement?.dataset.homeWindow)

  if (!barElement || !windowElement || !key) {
    return
  }

  const position = homeWindowPositions.value[key] ?? { x: 0, y: 0, zIndex: 0 }
  const nextPosition = {
    x: position.x,
    y: position.y,
    zIndex: ++homeWindowTopZIndex
  }

  homeWindowPositions.value = {
    ...homeWindowPositions.value,
    [key]: nextPosition
  }
  activeHomeWindowDrag = {
    key,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    originX: position.x,
    originY: position.y,
    windowElement,
    barElement
  }
  draggedHomeWindowKey.value = key
  barElement.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function handleHomeWindowPointerMove(event: PointerEvent) {
  const drag = activeHomeWindowDrag
  const desktop = desktopEl.value

  if (!drag || drag.pointerId !== event.pointerId || !desktop) {
    return false
  }

  const desktopRect = desktop.getBoundingClientRect()
  const windowRect = drag.windowElement.getBoundingClientRect()
  const taskbarTop = desktop.querySelector<HTMLElement>('.home-taskbar')?.getBoundingClientRect().top ?? desktopRect.bottom
  const edgePadding = 10
  const currentPosition = homeWindowPositions.value[drag.key] ?? {
    x: drag.originX,
    y: drag.originY,
    zIndex: homeWindowTopZIndex
  }
  const minX = currentPosition.x + desktopRect.left + edgePadding - windowRect.left
  const maxX = currentPosition.x + desktopRect.right - edgePadding - windowRect.right
  const minY = currentPosition.y + desktopRect.top + edgePadding - windowRect.top
  const maxY = currentPosition.y + taskbarTop - edgePadding - windowRect.bottom
  const offsetX = clampNumber(drag.originX + event.clientX - drag.startClientX, minX, maxX)

  homeWindowPositions.value = {
    ...homeWindowPositions.value,
    [drag.key]: {
      x: offsetX,
      y: clampNumber(drag.originY + event.clientY - drag.startClientY, minY, maxY),
      zIndex: currentPosition.zIndex
    }
  }

  return true
}

function finishHomeWindowDrag(event?: PointerEvent) {
  const drag = activeHomeWindowDrag

  if (!drag || (event && drag.pointerId !== event.pointerId)) {
    return
  }

  if (drag.barElement.hasPointerCapture(drag.pointerId)) {
    drag.barElement.releasePointerCapture(drag.pointerId)
  }

  activeHomeWindowDrag = null
  draggedHomeWindowKey.value = null
}

function handleHomeDesktopPointerMove(event: PointerEvent) {
  if (!handleHomeWindowPointerMove(event)) {
    handleHomePointerMove(event)
  }
}

function isDayWindowVisible(id: DayWindowId) {
  return !hiddenDayWindowIds.value.includes(id)
}

function isNightWindowVisible(id: NightWindowId) {
  return !hiddenNightWindowIds.value.includes(id)
}

function closeDayWindow(id: DayWindowId) {
  if (hiddenDayWindowIds.value.includes(id)) {
    return
  }

  hiddenDayWindowIds.value = [...hiddenDayWindowIds.value, id]

  const existingTimer = dayWindowRespawnTimers.get(id)
  if (existingTimer) {
    window.clearTimeout(existingTimer)
  }

  const timer = window.setTimeout(() => {
    dayWindowRespawnTimers.delete(id)
    hiddenDayWindowIds.value = hiddenDayWindowIds.value.filter((windowId) => windowId !== id)
  }, randomHomeDelay(5200, 12800))

  dayWindowRespawnTimers.set(id, timer)
}

function closeNightWindow(id: NightWindowId) {
  if (hiddenNightWindowIds.value.includes(id)) {
    return
  }

  hiddenNightWindowIds.value = [...hiddenNightWindowIds.value, id]

  const existingTimer = nightWindowRespawnTimers.get(id)
  if (existingTimer) {
    window.clearTimeout(existingTimer)
  }

  const timer = window.setTimeout(() => {
    nightWindowRespawnTimers.delete(id)
    hiddenNightWindowIds.value = hiddenNightWindowIds.value.filter((windowId) => windowId !== id)
  }, randomHomeDelay(5200, 12800))

  nightWindowRespawnTimers.set(id, timer)
}

function clearDayWindowRespawnTimers() {
  dayWindowRespawnTimers.forEach((timer) => window.clearTimeout(timer))
  dayWindowRespawnTimers.clear()
}

function clearNightWindowRespawnTimers() {
  nightWindowRespawnTimers.forEach((timer) => window.clearTimeout(timer))
  nightWindowRespawnTimers.clear()
}

function clearNightMetricTimer() {
  if (nightMetricTimer) {
    window.clearTimeout(nightMetricTimer)
    nightMetricTimer = 0
  }
}

function scheduleNightMetricPulse() {
  clearNightMetricTimer()

  if (themeMode.value !== 'night' || shouldReduceHomeMotion()) {
    return
  }

  nightMetricTimer = window.setTimeout(() => {
    nightMetricTick.value += 1
    scheduleNightMetricPulse()
  }, randomHomeDelay(820, 1650))
}

function shouldReduceHomeMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function applyHomePointerFrame() {
  pointerCurrentX += (pointerTargetX - pointerCurrentX) * 0.14
  pointerCurrentY += (pointerTargetY - pointerCurrentY) * 0.14

  desktopEl.value?.style.setProperty('--home-pointer-x', pointerCurrentX.toFixed(3))
  desktopEl.value?.style.setProperty('--home-pointer-y', pointerCurrentY.toFixed(3))

  if (Math.abs(pointerTargetX - pointerCurrentX) > 0.002 || Math.abs(pointerTargetY - pointerCurrentY) > 0.002) {
    pointerFrame = window.requestAnimationFrame(applyHomePointerFrame)
    return
  }

  pointerFrame = 0
}

function scheduleHomePointerFrame() {
  if (pointerFrame || shouldReduceHomeMotion()) {
    return
  }

  pointerFrame = window.requestAnimationFrame(applyHomePointerFrame)
}

function handleHomePointerMove(event: PointerEvent) {
  const desktop = desktopEl.value

  if (!desktop || activeHomeWindowDrag || shouldReduceHomeMotion()) {
    return
  }

  const rect = desktop.getBoundingClientRect()
  pointerTargetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
  pointerTargetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
  scheduleHomePointerFrame()
}

function resetHomePointer() {
  if (activeHomeWindowDrag) {
    return
  }

  pointerTargetX = 0
  pointerTargetY = 0
  scheduleHomePointerFrame()
}

function clearNightPortraitGlitchTimers() {
  if (nightPortraitGlitchTimer) {
    window.clearTimeout(nightPortraitGlitchTimer)
    nightPortraitGlitchTimer = 0
  }

  if (nightPortraitGlitchBurstTimer) {
    window.clearTimeout(nightPortraitGlitchBurstTimer)
    nightPortraitGlitchBurstTimer = 0
  }

  if (nightPortraitGlitchRepeatTimer) {
    window.clearTimeout(nightPortraitGlitchRepeatTimer)
    nightPortraitGlitchRepeatTimer = 0
  }
}

function clearNightBackgroundGlitchTimers() {
  if (nightBackgroundGlitchTimer) {
    window.clearTimeout(nightBackgroundGlitchTimer)
    nightBackgroundGlitchTimer = 0
  }

  if (nightBackgroundGlitchBurstTimer) {
    window.clearTimeout(nightBackgroundGlitchBurstTimer)
    nightBackgroundGlitchBurstTimer = 0
  }

  if (nightBackgroundGlitchRepeatTimer) {
    window.clearTimeout(nightBackgroundGlitchRepeatTimer)
    nightBackgroundGlitchRepeatTimer = 0
  }
}

function clearHomeThemeTransitionTimer() {
  if (homeThemeTransitionTimer) {
    window.clearTimeout(homeThemeTransitionTimer)
    homeThemeTransitionTimer = 0
  }
}

function finishHomeThemeTransition() {
  homeThemeTransition.value = 'idle'
  homeThemeTransitionTimer = 0

  if (themeMode.value !== 'night' || shouldReduceHomeMotion()) {
    return
  }

  scheduleNightPortraitGlitch()
  scheduleNightBackgroundGlitch()
}

function startHomeThemeTransition(mode: 'day' | 'night') {
  clearHomeThemeTransitionTimer()
  clearNightPortraitGlitchTimers()
  clearNightBackgroundGlitchTimers()
  isNightPortraitGlitching.value = false
  isNightBackgroundGlitching.value = false
  homeThemeTransition.value = mode === 'night' ? 'to-night' : 'to-day'

  if (shouldReduceHomeMotion()) {
    finishHomeThemeTransition()
    return
  }

  homeThemeTransitionTimer = window.setTimeout(finishHomeThemeTransition, HOME_THEME_TRANSITION_MS)
}

function scheduleNightPortraitGlitch() {
  clearNightPortraitGlitchTimers()
  isNightPortraitGlitching.value = false

  if (themeMode.value !== 'night' || shouldReduceHomeMotion()) {
    return
  }

  runNightPortraitGlitchBurst(2)
}

function queueNightPortraitGlitch() {
  if (nightPortraitGlitchTimer) {
    window.clearTimeout(nightPortraitGlitchTimer)
    nightPortraitGlitchTimer = 0
  }

  if (themeMode.value !== 'night' || shouldReduceHomeMotion()) {
    return
  }

  nightPortraitGlitchTimer = window.setTimeout(() => {
    nightPortraitGlitchTimer = 0
    runNightPortraitGlitchBurst(Math.random() > 0.5 ? 2 : 1)
  }, randomHomeDelay(3600, 9200))
}

function runNightPortraitGlitchBurst(remainingBursts: number) {
  if (themeMode.value !== 'night' || shouldReduceHomeMotion()) {
    isNightPortraitGlitching.value = false
    return
  }

  isNightPortraitGlitching.value = true
  nightPortraitGlitchBurstTimer = window.setTimeout(() => {
    isNightPortraitGlitching.value = false
    nightPortraitGlitchBurstTimer = 0

    if (remainingBursts > 1) {
      nightPortraitGlitchRepeatTimer = window.setTimeout(() => {
        nightPortraitGlitchRepeatTimer = 0
        runNightPortraitGlitchBurst(remainingBursts - 1)
      }, 220 + Math.random() * 260)
      return
    }

    queueNightPortraitGlitch()
  }, 760)
}

function scheduleNightBackgroundGlitch() {
  clearNightBackgroundGlitchTimers()
  isNightBackgroundGlitching.value = false

  if (themeMode.value !== 'night' || shouldReduceHomeMotion()) {
    return
  }

  runNightBackgroundGlitchBurst(2)
}

function queueNightBackgroundGlitch() {
  if (nightBackgroundGlitchTimer) {
    window.clearTimeout(nightBackgroundGlitchTimer)
    nightBackgroundGlitchTimer = 0
  }

  if (themeMode.value !== 'night' || shouldReduceHomeMotion()) {
    return
  }

  nightBackgroundGlitchTimer = window.setTimeout(() => {
    nightBackgroundGlitchTimer = 0
    runNightBackgroundGlitchBurst(Math.random() > 0.55 ? 2 : 1)
  }, randomHomeDelay(3200, 8500))
}

function runNightBackgroundGlitchBurst(remainingBursts: number) {
  if (themeMode.value !== 'night' || shouldReduceHomeMotion()) {
    isNightBackgroundGlitching.value = false
    return
  }

  isNightBackgroundGlitching.value = true
  nightBackgroundGlitchBurstTimer = window.setTimeout(() => {
    isNightBackgroundGlitching.value = false
    nightBackgroundGlitchBurstTimer = 0

    if (remainingBursts > 1) {
      nightBackgroundGlitchRepeatTimer = window.setTimeout(() => {
        nightBackgroundGlitchRepeatTimer = 0
        runNightBackgroundGlitchBurst(remainingBursts - 1)
      }, randomHomeDelay(180, 440))
      return
    }

    queueNightBackgroundGlitch()
  }, 620)
}

onMounted(() => {
  scheduleNightPortraitGlitch()
  scheduleNightBackgroundGlitch()
  scheduleNightMetricPulse()
})

watch(themeMode, (mode) => {
  startHomeThemeTransition(mode)

  if (mode !== 'day') {
    hiddenDayWindowIds.value = []
    clearDayWindowRespawnTimers()
  }

  if (mode !== 'night') {
    hiddenNightWindowIds.value = []
    clearNightWindowRespawnTimers()
  }

  scheduleNightMetricPulse()
})

onBeforeUnmount(() => {
  finishHomeWindowDrag()

  if (pointerFrame) {
    window.cancelAnimationFrame(pointerFrame)
  }

  clearHomeThemeTransitionTimer()
  clearNightPortraitGlitchTimers()
  clearNightBackgroundGlitchTimers()
  clearNightMetricTimer()
  clearDayWindowRespawnTimers()
  clearNightWindowRespawnTimers()
})
</script>

<style scoped>
.home-page {
  min-height: 100svh;
  overflow: hidden;
  background: #fdf6ff;
  color: var(--home-ink);
  --home-theme-duration: 1100ms;
  --home-bg: #fff7fd;
  --home-bg-blue: #e8fbff;
  --home-surface: #ffffff;
  --home-surface-soft: rgba(255, 255, 255, 0.82);
  --home-pink-soft: #ffe4f4;
  --home-blue-soft: #dffbff;
  --home-mint-soft: #e3fff6;
  --home-violet-soft: #eee6ff;
  --home-ink: #2a2138;
  --home-muted: #6f637a;
  --home-pink: #ff7cc2;
  --home-blue: #5edceb;
  --home-border: #2a2138;
  --home-shadow: rgba(42, 33, 56, 0.22);
  --home-window-shadow:
    6px 6px 0 var(--home-shadow),
    0 0 22px rgba(94, 220, 235, 0.08);
  --home-window-bar:
    linear-gradient(90deg, rgba(255, 124, 194, 0.24), rgba(94, 220, 235, 0.22)),
    var(--home-surface);
  --home-wallpaper-day: linear-gradient(135deg, #fff7fd 0%, #e9fbff 52%, #fff1fa 100%);
  --home-wallpaper-night: linear-gradient(135deg, #21172b 0%, #070911 54%, #10252c 100%);
}

:global(:root[data-theme='night'] .home-page) {
  --home-bg: #030407;
  --home-bg-blue: #071014;
  --home-surface: #0d1018;
  --home-surface-soft: rgba(13, 16, 24, 0.88);
  --home-pink-soft: #241324;
  --home-blue-soft: #102630;
  --home-mint-soft: #102821;
  --home-violet-soft: #201832;
  --home-ink: #f5f1fb;
  --home-muted: #cac2d0;
  --home-pink: #ff5fb8;
  --home-blue: #5eeaff;
  --home-border: #cbc2d2;
  --home-shadow: rgba(5, 9, 18, 0.66);
  --home-window-shadow:
    6px 6px 0 rgba(5, 9, 18, 0.78),
    0 0 18px rgba(94, 234, 255, 0.1),
    0 0 28px rgba(255, 95, 184, 0.08);
  --home-window-bar:
    linear-gradient(90deg, rgba(255, 95, 184, 0.18), rgba(94, 234, 255, 0.16)),
    #10131d;
}

:global(:root:not([data-theme='night']) .home-page) {
  --home-y2k-cyan: #63e7f7;
}

.home-desktop {
  position: relative;
  isolation: isolate;
  min-height: 100svh;
  padding: 26px 28px 58px;
  --home-pointer-x: 0;
  --home-pointer-y: 0;
  background: var(--home-wallpaper-day);
}

.home-desktop::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--home-wallpaper-night);
  content: '';
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--home-theme-duration) ease;
}

.home-desktop::after {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(90deg, transparent 0 7%, rgba(255, 45, 96, 0.64) 30%, transparent 66%),
    linear-gradient(90deg, transparent 0 19%, rgba(44, 225, 255, 0.58) 52%, transparent 90%);
  content: '';
  mix-blend-mode: screen;
  opacity: 0;
  pointer-events: none;
  transform: translate3d(0, 0, 0);
  will-change: clip-path, opacity, transform;
}

:global(:root[data-theme='night'] .home-desktop::before) {
  opacity: 1;
}

:global(:root[data-theme='night'] .home-desktop.home-desktop--background-glitching::after) {
  animation: home-night-background-glitch 900ms steps(1, end);
}

.home-night-ambient {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--home-theme-duration) ease;
}

.home-night-ambient--depth {
  background:
    radial-gradient(ellipse 58% 54% at 50% 72%, rgba(94, 234, 255, 0.13) 0 14%, transparent 45%),
    radial-gradient(ellipse 46% 74% at 88% 42%, rgba(255, 95, 184, 0.11) 0 8%, transparent 42%),
    radial-gradient(ellipse 36% 68% at 10% 62%, rgba(94, 234, 255, 0.08) 0 10%, transparent 48%),
    linear-gradient(90deg, rgba(255, 95, 184, 0.1), transparent 18%, transparent 78%, rgba(94, 234, 255, 0.1)),
    linear-gradient(180deg, rgba(94, 234, 255, 0.08), transparent 24%, rgba(255, 95, 184, 0.05));
  mix-blend-mode: screen;
}

.home-night-ambient--stardust {
  background:
    radial-gradient(circle at 16px 24px, rgba(94, 234, 255, 0.72) 0 1px, transparent 2px),
    radial-gradient(circle at 128px 76px, rgba(255, 95, 184, 0.46) 0 1px, transparent 2px),
    radial-gradient(circle at 244px 34px, rgba(245, 241, 251, 0.42) 0 1px, transparent 2px),
    radial-gradient(circle at 76px 156px, rgba(94, 234, 255, 0.38) 0 1px, transparent 2px);
  background-position:
    12px 18px,
    46px 32px,
    82px 64px,
    0 0;
  background-size:
    286px 214px,
    342px 268px,
    408px 302px,
    238px 198px;
  mix-blend-mode: screen;
}

:global(:root[data-theme='night'] .home-night-ambient--depth) {
  opacity: 1;
}

:global(:root[data-theme='night'] .home-night-ambient--stardust) {
  opacity: 0.32;
}

@media (prefers-reduced-motion: no-preference) {
  :global(:root[data-theme='night'] .home-night-ambient--stardust) {
    animation: home-night-stardust 7s steps(1, end) infinite;
  }
}

.home-day-foreground,
.home-night-foreground {
  position: fixed;
  left: 50%;
  bottom: -2px;
  z-index: 12;
  display: block;
  height: min(104svh, 940px);
  filter:
    drop-shadow(10px 10px 0 rgba(5, 9, 18, 0.5))
    drop-shadow(-3px 0 0 rgba(255, 95, 184, 0.18))
    drop-shadow(3px 0 0 rgba(94, 234, 255, 0.18));
  pointer-events: none;
  transform: translate(
    calc(-50% + (var(--home-pointer-x) * 10px)),
    calc(var(--home-pointer-y) * 6px)
  );
  transition: opacity var(--home-theme-duration) ease;
  will-change: opacity, transform;
}

.home-day-foreground {
  width: min(68vw, 1040px);
  background: var(--home-day-art-url, none) center bottom / contain no-repeat;
  opacity: 1;
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s;
  visibility: visible;
}

.home-night-foreground {
  width: min(58vw, 820px);
  background: var(--home-night-art-url, none) center bottom / contain no-repeat;
  opacity: 0;
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s linear var(--home-theme-duration);
  transform: translate(
    calc(-50% + (var(--home-pointer-x) * -14px)),
    calc(22px + (var(--home-pointer-y) * 8px))
  );
  visibility: hidden;
}

:global(:root[data-theme='night'] .home-day-foreground) {
  opacity: 0;
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s linear var(--home-theme-duration);
  transform: translate(
    calc(-50% + (var(--home-pointer-x) * 10px)),
    calc(12px + (var(--home-pointer-y) * 6px))
  );
  visibility: hidden;
}

:global(:root[data-theme='night'] .home-night-foreground) {
  --home-night-portrait-light-filter:
    brightness(0.66)
    saturate(0.84)
    contrast(1.14)
    drop-shadow(12px 12px 0 rgba(5, 9, 18, 0.64))
    drop-shadow(5px -2px 0 rgba(94, 234, 255, 0.34))
    drop-shadow(13px -8px 0 rgba(94, 234, 255, 0.16))
    drop-shadow(-5px 4px 0 rgba(255, 95, 184, 0.2))
    drop-shadow(-10px 16px 0 rgba(255, 95, 184, 0.12))
    drop-shadow(0 0 18px rgba(94, 234, 255, 0.16));
  filter: var(--home-night-portrait-light-filter);
  opacity: 0.88;
  transform: translate(
    calc(-50% + (var(--home-pointer-x) * -14px)),
    calc(var(--home-pointer-y) * 8px)
  );
  transition:
    opacity var(--home-theme-duration) ease,
    visibility 0s;
  visibility: visible;
}

:global(:root[data-theme='night'] .home-desktop--to-night .home-day-foreground) {
  transition:
    opacity 320ms steps(5, end),
    transform 320ms steps(5, end),
    visibility 0s linear 320ms;
}

:global(:root[data-theme='night'] .home-desktop--to-night .home-night-foreground) {
  transition:
    opacity 720ms steps(6, end) 220ms,
    transform 720ms steps(6, end) 220ms,
    visibility 0s linear 220ms;
}

:global(:root:not([data-theme='night']) .home-desktop--to-day .home-night-foreground) {
  transition:
    opacity 280ms steps(4, end),
    transform 280ms steps(4, end),
    visibility 0s linear 280ms;
}

:global(:root:not([data-theme='night']) .home-desktop--to-day .home-day-foreground) {
  transition:
    opacity 720ms steps(6, end) 180ms,
    transform 720ms steps(6, end) 180ms,
    visibility 0s linear 180ms;
}

:global(:root[data-theme='night'] .home-night-foreground.home-night-foreground--glitching) {
  animation: home-night-portrait-dropout 900ms steps(1, end);
}

.home-desktop__icons {
  position: relative;
  z-index: 3;
  display: grid;
  width: 92px;
  gap: 12px;
}

.home-desktop-icon {
  display: grid;
  min-width: 0;
  justify-items: center;
  gap: 6px;
  padding: 7px 4px;
  border: 2px solid transparent;
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
}

.home-desktop-icon:hover,
.home-desktop-icon:focus-visible {
  border-color: var(--home-border);
  background: color-mix(in srgb, var(--home-surface) 74%, transparent);
  outline: 0;
}

.home-window__icon,
.home-taskbar__start-icon {
  display: inline-block;
  background: currentColor;
  mask: var(--home-icon-url) center / 100% 100% no-repeat;
  -webkit-mask: var(--home-icon-url) center / 100% 100% no-repeat;
}

.home-desktop-icon__image {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  padding: 9px;
  border: 2px solid var(--home-border);
  background-color: var(--home-ink);
  box-shadow: 3px 3px 0 var(--home-shadow);
}

.home-desktop-icon--pink .home-desktop-icon__image {
  color: var(--home-ink);
  background-color: var(--home-pink-soft);
}

.home-desktop-icon--blue .home-desktop-icon__image {
  background-color: var(--home-blue-soft);
}

.home-desktop-icon--violet .home-desktop-icon__image {
  background-color: var(--home-violet-soft);
}

.home-desktop-icon--mint .home-desktop-icon__image {
  background-color: var(--home-mint-soft);
}

.home-desktop-icon__image::before {
  display: block;
  width: 24px;
  height: 24px;
  background: currentColor;
  content: '';
  mask: var(--home-icon-url) center / 100% 100% no-repeat;
  -webkit-mask: var(--home-icon-url) center / 100% 100% no-repeat;
}

.home-desktop-icon__label {
  display: -webkit-box;
  overflow: hidden;
  max-width: 84px;
  min-height: 28px;
  text-shadow: 1px 1px 0 var(--home-surface);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (prefers-reduced-motion: no-preference) {
  .home-page,
  .home-desktop-icon,
  .home-desktop-icon__image,
  .home-desktop-icon__label,
  .home-window,
  .home-window__bar,
  .home-window__control,
  .home-window__body--main,
  .home-profile__copy,
  .home-profile__command,
  .home-profile__copy h1,
  .home-profile__copy p,
  .home-link-list__item,
  .home-taskbar,
  .home-taskbar__start,
  .home-taskbar__window,
  .home-taskbar__clock,
  .home-taskbar__dot,
  .home-taskbar__mode {
    transition:
      background-color var(--home-theme-duration) ease,
      border-color var(--home-theme-duration) ease,
      box-shadow var(--home-theme-duration) ease,
      color var(--home-theme-duration) ease,
      filter var(--home-theme-duration) ease,
      opacity var(--home-theme-duration) ease,
      text-shadow var(--home-theme-duration) ease;
  }
}

:global(:root[data-theme='night'] .home-desktop-icon__label) {
  text-shadow: 1px 1px 0 #030407;
}

.home-window {
  position: absolute;
  z-index: 4;
  display: grid;
  min-width: 0;
  translate: var(--home-window-offset-x, 0) var(--home-window-offset-y, 0);
  border: 2px solid var(--home-border);
  background: var(--home-surface);
  box-shadow: var(--home-window-shadow);
}

.home-day-window {
  animation: home-window-spawn 160ms steps(2, end) both;
}

.home-day-windows,
.home-night-windows {
  display: contents;
}

.home-night-windows {
  display: none;
}

:global(:root[data-theme='night'] .home-day-windows) {
  display: none;
}

:global(:root[data-theme='night'] .home-night-windows) {
  display: contents;
}

.home-window--main {
  top: 64px;
  right: 28%;
  bottom: 82px;
  left: 150px;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 460px;
}

.home-window--links {
  top: 64px;
  right: 34px;
  width: min(300px, 22vw);
}

.home-window--portrait {
  top: 466px;
  right: 34px;
  bottom: 82px;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(300px, 22vw);
}

.home-day-portrait {
  min-height: 0;
  background:
    var(--home-day-portrait-url, none) left top / auto 130% no-repeat,
    var(--home-surface-soft);
}

.home-night-window {
  border-color: var(--home-border);
  background: var(--home-surface);
  color: var(--home-ink);
  box-shadow: var(--home-window-shadow);
  animation: home-night-window-spawn 180ms steps(2, end) both;
}

.home-night-window .home-window__bar {
  min-height: 30px;
  padding-block: 4px;
  border-color: var(--home-border);
  background: var(--home-window-bar);
  color: var(--home-ink);
}

.home-window__bar--hot {
  background: var(--home-pink-soft);
}

.home-window__bar--violet {
  background: var(--home-violet-soft);
}

.home-window__bar--cyan {
  background: var(--home-blue-soft);
}

.home-night-window--status {
  top: 54px;
  left: 154px;
  z-index: 6;
  width: 292px;
}

.home-night-window--dialogue {
  bottom: 74px;
  left: 146px;
  z-index: 7;
  width: min(380px, 28vw);
}

.home-night-window--chat {
  top: 60px;
  right: 26px;
  z-index: 14;
  width: min(560px, 39vw);
  min-height: 520px;
}

.home-night-window--assets {
  top: 326px;
  left: 470px;
  z-index: 13;
  width: 270px;
}

.home-night-window--control {
  right: 8px;
  bottom: 58px;
  z-index: 6;
  width: min(390px, 30vw);
}

.home-window__bar {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 6px 10px;
  border-bottom: 2px solid var(--home-border);
  background: var(--home-window-bar);
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.home-desktop--dragging .home-window__bar {
  cursor: grabbing;
}

.home-window__bar--blue {
  background: var(--home-blue-soft);
}

.home-window__bar--pink {
  background: var(--home-pink-soft);
}

.home-window__title {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  overflow: hidden;
}

.home-window__title span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-window__icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
}

.home-window__controls {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  margin-left: auto;
}

.home-window__control {
  position: relative;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 2px solid var(--home-border);
  appearance: none;
  background: var(--home-surface);
  border-radius: 0;
  color: inherit;
  font: inherit;
}

button.home-window__control {
  cursor: pointer;
}

button.home-window__control:hover {
  background: var(--home-pink-soft);
  box-shadow: 2px 2px 0 var(--home-border);
}

button.home-window__control:focus-visible {
  outline: 2px solid var(--home-blue);
  outline-offset: 2px;
}

.home-window__control--min::before,
.home-window__control--close::before,
.home-window__control--close::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9px;
  height: 2px;
  background: currentColor;
  content: '';
  transform: translate(-50%, -50%);
}

.home-window__control--max::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border: 2px solid currentColor;
  content: '';
  transform: translate(-50%, -50%);
}

.home-window__control--close::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.home-window__control--close::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.home-window__body {
  min-width: 0;
  padding: 14px;
}

.home-window__body--main {
  position: relative;
  overflow: hidden;
  padding: 0;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--home-pink) 9%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, var(--home-blue) 9%, transparent) 1px, transparent 1px),
    color-mix(in srgb, var(--home-surface) 92%, var(--home-blue-soft));
  background-size:
    16px 16px,
    16px 16px,
    auto;
}

.home-profile {
  position: relative;
  min-height: 100%;
}

.home-profile__art {
  position: absolute;
  display: none;
  right: 0;
  bottom: -18px;
  left: 22%;
  height: calc(100% + 44px);
  background: var(--home-character-art-url, none) center bottom / contain no-repeat;
  filter:
    drop-shadow(8px 8px 0 color-mix(in srgb, var(--home-shadow) 72%, transparent))
    drop-shadow(-3px 0 0 color-mix(in srgb, var(--home-pink) 22%, transparent))
    drop-shadow(3px 0 0 color-mix(in srgb, var(--home-blue) 22%, transparent));
  opacity: 0;
  pointer-events: none;
  transition:
    opacity var(--home-theme-duration) ease,
    transform var(--home-theme-duration) ease,
    filter var(--home-theme-duration) ease;
}

:global(:root[data-theme='night'] .home-night-foreground::before),
:global(:root[data-theme='night'] .home-night-foreground::after) {
  position: absolute;
  inset: 0;
  background: inherit;
  content: '';
  opacity: 0;
  pointer-events: none;
  mix-blend-mode: multiply;
  will-change: clip-path, transform;
}

:global(:root[data-theme='night'] .home-night-foreground::before) {
  filter:
    sepia(100%)
    saturate(245%)
    hue-rotate(285deg)
    brightness(86%)
    contrast(132%)
    drop-shadow(-5px 3px 0 rgba(255, 95, 184, 0.24))
    drop-shadow(4px -2px 0 rgba(94, 234, 255, 0.12));
  transform: translate(calc(var(--home-pointer-x) * 7px - 10px), calc(var(--home-pointer-y) * -3px));
}

:global(:root[data-theme='night'] .home-night-foreground::after) {
  filter:
    sepia(100%)
    saturate(245%)
    hue-rotate(150deg)
    brightness(88%)
    contrast(132%)
    drop-shadow(6px -3px 0 rgba(94, 234, 255, 0.28))
    drop-shadow(-3px 4px 0 rgba(255, 95, 184, 0.1));
  transform: translate(calc(var(--home-pointer-x) * -6px + 10px), calc(var(--home-pointer-y) * 3px));
}

:global(:root[data-theme='night'] .home-night-foreground.home-night-foreground--glitching::before) {
  animation: home-night-image-glitch-pink 720ms linear alternate-reverse;
}

:global(:root[data-theme='night'] .home-night-foreground.home-night-foreground--glitching::after) {
  animation: home-night-image-glitch-cyan 760ms linear alternate-reverse;
}

@keyframes home-night-image-glitch-pink {
  0% {
    opacity: 0.56;
    clip-path: inset(72% 0 18% 0);
  }

  6% {
    clip-path: inset(8% 0 84% 0);
  }

  12% {
    clip-path: inset(42% 0 43% 0);
  }

  18% {
    clip-path: inset(92% 0 2% 0);
  }

  24% {
    clip-path: inset(18% 0 70% 0);
  }

  30% {
    opacity: 0.68;
    clip-path: inset(55% 0 28% 0);
  }

  36% {
    clip-path: inset(2% 0 91% 0);
  }

  42% {
    clip-path: inset(77% 0 12% 0);
  }

  48% {
    clip-path: inset(32% 0 61% 0);
  }

  54% {
    clip-path: inset(63% 0 25% 0);
  }

  60% {
    opacity: 0.52;
    clip-path: inset(13% 0 79% 0);
  }

  66% {
    clip-path: inset(47% 0 39% 0);
  }

  72% {
    clip-path: inset(86% 0 6% 0);
  }

  78% {
    clip-path: inset(25% 0 68% 0);
  }

  84% {
    clip-path: inset(67% 0 20% 0);
  }

  90% {
    opacity: 0.72;
    clip-path: inset(38% 0 50% 0);
  }

  96% {
    clip-path: inset(5% 0 88% 0);
  }

  100% {
    opacity: 0.58;
    clip-path: inset(80% 0 10% 0);
  }
}

@keyframes home-night-image-glitch-cyan {
  0% {
    opacity: 0.52;
    clip-path: inset(5% 0 88% 0);
  }

  5% {
    clip-path: inset(64% 0 23% 0);
  }

  10% {
    clip-path: inset(30% 0 62% 0);
  }

  15% {
    clip-path: inset(82% 0 9% 0);
  }

  20% {
    clip-path: inset(11% 0 78% 0);
  }

  25% {
    clip-path: inset(49% 0 37% 0);
  }

  30% {
    opacity: 0.66;
    clip-path: inset(74% 0 15% 0);
  }

  35% {
    clip-path: inset(2% 0 93% 0);
  }

  40% {
    clip-path: inset(57% 0 30% 0);
  }

  45% {
    clip-path: inset(21% 0 71% 0);
  }

  50% {
    clip-path: inset(90% 0 3% 0);
  }

  55% {
    opacity: 0.56;
    clip-path: inset(36% 0 52% 0);
  }

  60% {
    clip-path: inset(69% 0 18% 0);
  }

  65% {
    clip-path: inset(14% 0 80% 0);
  }

  70% {
    clip-path: inset(44% 0 44% 0);
  }

  75% {
    clip-path: inset(79% 0 13% 0);
  }

  80% {
    clip-path: inset(27% 0 66% 0);
  }

  85% {
    opacity: 0.7;
    clip-path: inset(53% 0 33% 0);
  }

  90% {
    clip-path: inset(7% 0 86% 0);
  }

  95% {
    clip-path: inset(61% 0 26% 0);
  }

  100% {
    opacity: 0.54;
    clip-path: inset(18% 0 73% 0);
  }
}

@keyframes home-night-portrait-dropout {
  0%,
  10%,
  18%,
  26%,
  38%,
  46%,
  54%,
  68%,
  76%,
  84%,
  100% {
    opacity: 1;
    filter: var(--home-night-portrait-light-filter);
  }

  12%,
  14% {
    opacity: 0;
    filter:
      brightness(0.62)
      saturate(0.84)
      contrast(1.18)
      drop-shadow(16px 10px 0 rgba(94, 234, 255, 0.36))
      drop-shadow(-12px 0 0 rgba(255, 95, 184, 0.34));
  }

  16% {
    opacity: 0.12;
    filter:
      brightness(0.64)
      saturate(0.86)
      contrast(1.18)
      drop-shadow(-14px 8px 0 rgba(255, 95, 184, 0.34))
      drop-shadow(12px 0 0 rgba(94, 234, 255, 0.32));
  }

  40%,
  42%,
  70% {
    opacity: 0;
    filter:
      brightness(0.62)
      saturate(0.84)
      contrast(1.18)
      drop-shadow(18px 6px 0 rgba(94, 234, 255, 0.34))
      drop-shadow(-16px 0 0 rgba(255, 95, 184, 0.3));
  }

  44%,
  72% {
    opacity: 0.2;
    filter:
      brightness(0.64)
      saturate(0.86)
      contrast(1.18)
      drop-shadow(12px 12px 0 rgba(5, 9, 18, 0.64))
      drop-shadow(-10px 0 0 rgba(255, 95, 184, 0.36))
      drop-shadow(10px 0 0 rgba(94, 234, 255, 0.38));
  }

  74% {
    opacity: 0.08;
    filter:
      brightness(0.62)
      saturate(0.84)
      contrast(1.18)
      drop-shadow(-18px 8px 0 rgba(255, 95, 184, 0.34))
      drop-shadow(18px 0 0 rgba(94, 234, 255, 0.34));
  }
}

@keyframes home-night-background-glitch {
  0%,
  100% {
    opacity: 0;
    transform: translate3d(0, 0, 0);
    clip-path: inset(0 0 0 0);
  }

  8% {
    opacity: 0.72;
    transform: translate3d(-18px, 0, 0);
    clip-path: inset(8% 0 82% 0);
  }

  16% {
    opacity: 0.48;
    transform: translate3d(16px, 0, 0);
    clip-path: inset(34% 0 55% 0);
  }

  27% {
    opacity: 0.82;
    transform: translate3d(-26px, 0, 0);
    clip-path: inset(61% 0 27% 0);
  }

  39% {
    opacity: 0.32;
    transform: translate3d(10px, 0, 0);
    clip-path: inset(18% 0 74% 0);
  }

  52% {
    opacity: 0.76;
    transform: translate3d(-14px, 0, 0);
    clip-path: inset(78% 0 12% 0);
  }

  68% {
    opacity: 0.46;
    transform: translate3d(22px, 0, 0);
    clip-path: inset(45% 0 43% 0);
  }
}

@keyframes home-night-stardust {
  0%,
  100% {
    opacity: 0.24;
    transform: translate3d(0, 0, 0);
  }

  28% {
    opacity: 0.34;
    transform: translate3d(2px, -1px, 0);
  }

  54% {
    opacity: 0.18;
    transform: translate3d(-1px, 1px, 0);
  }

  78% {
    opacity: 0.3;
    transform: translate3d(1px, 0, 0);
  }
}

.home-profile__copy {
  position: absolute;
  top: 28px;
  left: 28px;
  z-index: 2;
  display: grid;
  width: min(330px, 48%);
  max-width: none;
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.home-profile__command {
  margin: 0;
  color: var(--home-pink);
  font-family: var(--ns-font-decorative);
  font-size: 11px;
  font-weight: 950;
}

.home-profile__copy h1 {
  margin: 0;
  color: var(--home-ink);
  font-family: var(--ns-font-display);
  font-size: clamp(40px, 6vw, 74px);
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  text-shadow:
    2px 2px 0 var(--home-blue-soft),
    4px 4px 0 color-mix(in srgb, var(--home-pink) 22%, transparent);
}

.home-profile__logo {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 1;
  background: var(--home-logo-art-url, none) center / contain no-repeat;
  image-rendering: pixelated;
}

:global(:root[data-theme='night'] .home-profile__copy h1) {
  text-shadow:
    2px 2px 0 rgba(94, 234, 255, 0.42),
    -2px 0 0 rgba(255, 95, 184, 0.32),
    0 0 12px rgba(94, 234, 255, 0.18);
}

.home-profile__copy p:last-child {
  margin: 0;
  color: var(--home-muted);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.7;
}

.home-link-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-rows: 46px;
  gap: 8px;
}

.home-link-list__item {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  min-width: 0;
  align-items: center;
  gap: 9px;
  height: 46px;
  padding: 0 9px;
  border: 2px solid var(--home-border);
  background: var(--home-surface);
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  text-decoration: none;
  box-shadow: 2px 2px 0 color-mix(in srgb, var(--home-shadow) 70%, transparent);
}

.home-link-list__item:hover,
.home-link-list__item:focus-visible {
  background: var(--home-blue-soft);
  outline: 0;
  transform: translate(-1px, -1px);
}

.home-link-list__item img {
  display: block;
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.home-link-list__icon {
  display: block;
  width: 20px;
  height: 20px;
  background: currentColor;
  mask: var(--home-icon-url) center / 100% 100% no-repeat;
  -webkit-mask: var(--home-icon-url) center / 100% 100% no-repeat;
}

.home-avatar-list {
  display: grid;
  gap: 10px;
  padding: 12px;
}

.home-avatar-card {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 4px 10px;
  align-items: center;
  min-width: 0;
  padding: 8px;
  border: 2px solid var(--home-border);
  background: var(--home-surface-soft);
  box-shadow: 2px 2px 0 color-mix(in srgb, var(--home-shadow) 64%, transparent);
}

.home-avatar-card__portrait {
  grid-row: 1 / span 2;
  display: block;
  width: 58px;
  height: 58px;
  border: 2px solid var(--home-border);
  background:
    var(--home-avatar-url, none) center / contain no-repeat,
    linear-gradient(135deg, var(--home-pink-soft), var(--home-blue-soft));
  image-rendering: auto;
  box-shadow: inset 2px 2px 0 color-mix(in srgb, #ffffff 72%, transparent);
}

.home-avatar-card__name,
.home-avatar-card__state {
  min-width: 0;
  overflow: hidden;
  font-family: var(--ns-font-decorative);
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-avatar-card__name {
  align-self: end;
  color: var(--home-ink);
  font-family: var(--ns-font-sans);
  font-size: 13px;
  line-height: 1;
}

.home-avatar-card__state {
  color: var(--home-muted);
  font-size: 11px;
}

.home-avatar-list--archive .home-avatar-card {
  background: color-mix(in srgb, var(--home-surface-soft) 92%, var(--home-violet-soft));
}

.home-avatar-list--archive .home-avatar-card__portrait {
  background:
    var(--home-avatar-url, none) center / contain no-repeat,
    linear-gradient(135deg, var(--home-violet-soft), var(--home-blue-soft));
  box-shadow:
    inset 2px 2px 0 color-mix(in srgb, #ffffff 18%, transparent),
    2px 0 0 color-mix(in srgb, var(--home-blue) 28%, transparent);
}

.home-avatar-card--corrupt .home-avatar-card__portrait {
  position: relative;
  isolation: isolate;
  background:
    var(--home-avatar-url, none) center / contain no-repeat,
    linear-gradient(135deg, var(--home-pink-soft), var(--home-violet-soft));
  filter:
    drop-shadow(2px 0 0 color-mix(in srgb, var(--home-pink) 44%, transparent))
    drop-shadow(-2px 0 0 color-mix(in srgb, var(--home-blue) 34%, transparent));
}

.home-avatar-card--corrupt .home-avatar-card__portrait::before {
  position: absolute;
  top: 17px;
  right: -5px;
  z-index: 1;
  width: 35px;
  height: 22px;
  background:
    repeating-conic-gradient(
        from 18deg,
        #f8fbff 0 12.5%,
        #8cf3ff 12.5% 25%,
        #202438 25% 37.5%,
        #ff82bd 37.5% 50%
      )
      0 0 / 5px 5px,
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.92) 0 1px, transparent 1px 4px);
  box-shadow:
    2px 0 0 rgba(119, 246, 255, 0.64),
    -1px 0 0 rgba(255, 112, 189, 0.46);
  clip-path: polygon(
    0 18%,
    12% 18%,
    12% 8%,
    34% 8%,
    34% 0,
    64% 0,
    64% 8%,
    86% 8%,
    86% 18%,
    100% 18%,
    100% 38%,
    88% 38%,
    88% 52%,
    100% 52%,
    100% 72%,
    82% 72%,
    82% 90%,
    60% 90%,
    60% 100%,
    28% 100%,
    28% 92%,
    10% 92%,
    10% 76%,
    0 76%
  );
  content: '';
  image-rendering: pixelated;
  opacity: 0.9;
  pointer-events: none;
  transform: translateX(-1px);
  animation: homeYoinEyeStatic 820ms steps(2, end) infinite;
}

.home-avatar-card--corrupt .home-avatar-card__portrait::after {
  position: absolute;
  top: 22px;
  right: -7px;
  z-index: 2;
  width: 42px;
  height: 2px;
  background: #f7fbff;
  box-shadow:
    0 7px 0 rgba(124, 244, 255, 0.92),
    0 14px 0 rgba(255, 126, 190, 0.86);
  content: '';
  opacity: 0.76;
  pointer-events: none;
  animation: homeYoinEyeTear 820ms steps(2, end) infinite;
}

@keyframes homeYoinEyeStatic {
  0%,
  18% {
    opacity: 0.88;
    transform: translateX(-2px) translateY(0);
  }

  19%,
  41% {
    opacity: 1;
    transform: translateX(2px) translateY(-1px);
  }

  42%,
  69% {
    opacity: 0.76;
    transform: translateX(-1px) translateY(1px);
  }

  70%,
  100% {
    opacity: 0.96;
    transform: translateX(1px) translateY(0);
  }
}

@keyframes homeYoinEyeTear {
  0%,
  31% {
    transform: translateX(-3px);
  }

  32%,
  61% {
    transform: translateX(2px);
  }

  62%,
  100% {
    transform: translateX(-1px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-avatar-card--corrupt .home-avatar-card__portrait::before,
  .home-avatar-card--corrupt .home-avatar-card__portrait::after {
    animation: none;
  }
}

.home-night-status {
  display: grid;
  gap: 10px;
  padding: 13px;
}

.home-night-status__item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 7px;
  padding: 10px;
  border: 2px solid var(--home-border);
  background: var(--home-surface-soft);
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  box-shadow: 2px 2px 0 color-mix(in srgb, var(--home-shadow) 64%, transparent);
}

.home-night-status__item strong {
  display: inline-block;
  min-width: 64px;
  text-align: right;
  animation: home-night-metric-float 620ms steps(4, end) both;
}

.home-night-status__value--rise {
  color: var(--home-blue);
  text-shadow: 1px 1px 0 color-mix(in srgb, var(--home-pink) 72%, transparent);
}

.home-night-status__value--fall {
  color: var(--home-pink);
  text-shadow: 1px 1px 0 color-mix(in srgb, var(--home-blue) 62%, transparent);
}

.home-night-status__item i {
  position: relative;
  grid-column: 1 / -1;
  inline-size: 100%;
  height: 11px;
  border: 2px solid color-mix(in srgb, var(--home-border) 72%, transparent);
  overflow: hidden;
  background:
    repeating-linear-gradient(
      90deg,
      color-mix(in srgb, var(--home-muted) 20%, transparent) 0 8px,
      transparent 8px 10px
    ),
    color-mix(in srgb, var(--home-muted) 18%, transparent);
}

.home-night-status__item i::before {
  position: absolute;
  inset: 2px auto 2px 2px;
  inline-size: min(var(--home-progress-size, 50%), calc(100% - 4px));
  background:
    repeating-linear-gradient(
      90deg,
      var(--home-pink) 0 8px,
      color-mix(in srgb, var(--home-pink) 54%, transparent) 8px 10px
    );
  content: '';
  transform: scaleX(1);
  transform-origin: left center;
  animation: home-progress-fill 960ms steps(10, end) both;
  transition:
    inline-size 280ms steps(5, end),
    filter 280ms steps(2, end);
}

.home-night-chat {
  display: grid;
  gap: 5px;
  padding: 12px;
}

.home-night-dialogue {
  display: grid;
  gap: 7px;
  padding: 10px;
}

.home-night-dialogue p {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 3px 8px;
  margin: 0;
  padding: 5px;
  border: 2px solid var(--home-border);
  background: var(--home-surface-soft);
}

.home-night-dialogue__avatar {
  grid-row: 1 / span 2;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 2px solid var(--home-border);
  background: var(--home-violet-soft);
  overflow: hidden;
}

.home-night-dialogue__avatar--portrait {
  background-image: var(--home-chat-avatar-url);
  background-position: center center;
  background-repeat: no-repeat;
  background-size: 100% auto;
}

.home-night-dialogue p strong {
  grid-column: 2;
  grid-row: 1;
  align-self: end;
  color: var(--home-pink);
  font-family: var(--ns-font-sans);
  font-size: 13px;
  line-height: 1;
}

.home-night-dialogue__preview {
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
  overflow: hidden;
  color: var(--home-muted);
  font-size: 10px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-night-dialogue__unread {
  grid-column: 3;
  grid-row: 1 / span 2;
  align-self: center;
  width: 14px;
  height: 14px;
  border: 2px solid var(--home-border);
  background: var(--home-pink);
  box-shadow: 2px 2px 0 color-mix(in srgb, var(--home-shadow) 72%, transparent);
}

.home-night-chat p {
  display: grid;
  grid-template-columns: 52px repeat(2, minmax(0, 1fr));
  gap: 3px 10px;
  margin: 0;
  padding: 5px 7px;
  border: 2px solid var(--home-border);
  background: var(--home-surface-soft);
}

.home-night-chat__avatar {
  grid-row: span 2;
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border: 2px solid var(--home-border);
  background: var(--home-violet-soft);
  overflow: hidden;
}

.home-night-chat__avatar--portrait {
  background-image: var(--home-chat-avatar-url);
  background-position: center center;
  background-repeat: no-repeat;
  background-size: 100% auto;
}

.home-night-chat p strong {
  grid-column: 2 / -1;
  align-self: end;
  color: var(--home-pink);
  font-family: var(--ns-font-sans);
  font-size: 13px;
  line-height: 1;
}

.home-night-chat__message--right {
  margin-left: 44px;
}

.home-night-fragment-stability,
.home-night-world-stability {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 4px;
  align-items: center;
  min-width: 0;
  color: var(--home-muted);
  font-family: var(--ns-font-decorative);
  font-size: 9px;
  font-weight: 950;
}

.home-night-fragment-stability i,
.home-night-world-stability i {
  position: relative;
  display: block;
  height: 10px;
  border: 2px solid var(--home-border);
  overflow: hidden;
  background:
    repeating-linear-gradient(
      90deg,
      color-mix(in srgb, var(--home-muted) 20%, transparent) 0 8px,
      transparent 8px 10px
    ),
    color-mix(in srgb, var(--home-muted) 18%, transparent);
}

.home-night-fragment-stability i::before,
.home-night-world-stability i::before {
  position: absolute;
  inset: 2px auto 2px 2px;
  inline-size: min(var(--home-progress-size, 50%), calc(100% - 4px));
  background:
    repeating-linear-gradient(
      90deg,
      var(--home-pink) 0 8px,
      color-mix(in srgb, var(--home-pink) 54%, transparent) 8px 10px
    );
  content: '';
  transition: inline-size 280ms steps(5, end);
}

.home-night-world-stability {
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 10px;
  margin-top: 4px;
  padding: 10px;
  border: 2px solid var(--home-border);
  background: var(--home-pink-soft);
  color: var(--home-ink);
  font-size: 11px;
  box-shadow: 2px 2px 0 var(--home-shadow);
}

.home-night-player {
  position: relative;
  display: grid;
  grid-template-columns: 94px minmax(0, 1fr);
  gap: 8px 12px;
  padding: 16px 14px 13px;
  border-top: 2px solid color-mix(in srgb, var(--home-border) 72%, transparent);
  background:
    linear-gradient(135deg, rgba(94, 234, 255, 0.16), transparent 28%),
    linear-gradient(180deg, #1d1730 0%, #121827 48%, #090d18 100%);
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  box-shadow:
    inset 3px 3px 0 rgba(255, 255, 255, 0.08),
    inset -3px -3px 0 rgba(2, 4, 9, 0.72),
    0 0 16px rgba(94, 234, 255, 0.08);
}

.home-night-player__brand {
  position: absolute;
  top: 5px;
  left: 14px;
  color: color-mix(in srgb, var(--home-muted) 82%, transparent);
  font-size: 9px;
  font-weight: 950;
  letter-spacing: 0;
}

.home-night-player__pad {
  position: relative;
  display: grid;
  grid-row: 1 / span 2;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  align-self: center;
  width: 94px;
  height: 94px;
  place-items: center;
  border: 2px solid color-mix(in srgb, var(--home-border) 82%, #050711);
  background:
    linear-gradient(135deg, rgba(94, 234, 255, 0.16), transparent 40%),
    linear-gradient(180deg, #29213a, #151b2d 58%, #070b15);
  box-shadow:
    inset 3px 3px 0 rgba(255, 255, 255, 0.08),
    inset -3px -3px 0 rgba(0, 0, 0, 0.62),
    3px 3px 0 rgba(0, 0, 0, 0.54);
}

.home-night-player__pad::before {
  position: absolute;
  inset: 25px;
  border: 2px solid color-mix(in srgb, var(--home-border) 74%, #050711);
  background:
    linear-gradient(135deg, rgba(255, 95, 184, 0.12), transparent 45%),
    #14182a;
  content: '';
}

.home-night-player__pad-button {
  position: relative;
  z-index: 1;
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 2px solid color-mix(in srgb, var(--home-border) 78%, #050711);
  background:
    linear-gradient(135deg, rgba(94, 234, 255, 0.14), transparent 42%),
    #20283a;
  color: var(--home-blue);
  font-size: 12px;
  font-weight: 950;
  box-shadow:
    inset 2px 2px 0 rgba(255, 255, 255, 0.08),
    inset -2px -2px 0 rgba(0, 0, 0, 0.58);
}

.home-night-player__pad-button--up {
  grid-column: 2;
  grid-row: 1;
}

.home-night-player__pad-button--left {
  grid-column: 1;
  grid-row: 2;
}

.home-night-player__pad-button--center {
  grid-column: 2;
  grid-row: 2;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.24), transparent 42%),
    var(--home-pink);
  color: #12071d;
}

.home-night-player__pad-button--right {
  grid-column: 3;
  grid-row: 2;
}

.home-night-player__pad-button--down {
  grid-column: 2;
  grid-row: 3;
}

.home-night-player__pad-button--up::before,
.home-night-player__pad-button--left::before,
.home-night-player__pad-button--right::before,
.home-night-player__pad-button--down::before {
  width: 0;
  height: 0;
  border-style: solid;
  content: '';
}

.home-night-player__pad-button--up::before {
  border-width: 0 5px 7px;
  border-color: transparent transparent var(--home-blue);
}

.home-night-player__pad-button--left::before {
  border-width: 5px 7px 5px 0;
  border-color: transparent var(--home-blue) transparent transparent;
}

.home-night-player__pad-button--right::before {
  border-width: 5px 0 5px 7px;
  border-color: transparent transparent transparent var(--home-blue);
}

.home-night-player__pad-button--down::before {
  border-width: 7px 5px 0;
  border-color: var(--home-blue) transparent transparent;
}

.home-night-player__screen {
  display: grid;
  min-width: 0;
  gap: 6px;
  padding: 10px;
  border: 2px solid color-mix(in srgb, var(--home-border) 84%, #050711);
  background:
    linear-gradient(90deg, rgba(92, 234, 255, 0.08) 0 2px, transparent 2px 100%),
    linear-gradient(0deg, rgba(92, 234, 255, 0.08) 0 2px, transparent 2px 100%),
    linear-gradient(180deg, #102a3d, #071321);
  background-size:
    10px 100%,
    100% 10px,
    auto;
  box-shadow:
    inset 2px 2px 0 rgba(255, 255, 255, 0.1),
    inset -2px -2px 0 rgba(0, 0, 0, 0.54);
}

.home-night-player__meta {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.home-night-player__meta strong,
.home-night-player__meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-night-player__meta strong {
  color: #88f8ff;
  font-size: 12px;
  font-weight: 950;
  text-shadow: 0 0 6px rgba(94, 234, 255, 0.34);
}

.home-night-player__meta span,
.home-night-player__time {
  color: #ff8bd4;
  font-size: 10px;
  font-weight: 950;
}

.home-night-player__equalizer {
  display: flex;
  align-items: end;
  gap: 4px;
  height: 22px;
}

.home-night-player__equalizer i {
  display: block;
  width: 8px;
  background:
    repeating-linear-gradient(
      0deg,
      #ff5abf 0 3px,
      transparent 3px 5px
    );
  animation: home-player-eq 900ms steps(3, end) infinite;
}

.home-night-player__equalizer i:nth-child(1) {
  height: 12px;
}

.home-night-player__equalizer i:nth-child(2) {
  height: 20px;
  animation-delay: 120ms;
}

.home-night-player__equalizer i:nth-child(3) {
  height: 15px;
  animation-delay: 240ms;
}

.home-night-player__equalizer i:nth-child(4) {
  height: 22px;
  animation-delay: 360ms;
}

.home-night-player__equalizer i:nth-child(5) {
  height: 10px;
  animation-delay: 480ms;
}

.home-night-player__progress {
  position: relative;
  height: 10px;
  border: 2px solid rgba(136, 248, 255, 0.32);
  overflow: hidden;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(136, 248, 255, 0.2) 0 8px,
      transparent 8px 10px
    ),
    rgba(136, 248, 255, 0.1);
}

.home-night-player__progress i {
  position: absolute;
  inset: 2px auto 2px 2px;
  inline-size: min(48%, calc(100% - 4px));
  background:
    repeating-linear-gradient(
      90deg,
      #88f8ff 0 8px,
      rgba(136, 248, 255, 0.42) 8px 10px
    );
  animation: home-player-progress 3.2s steps(12, end) infinite;
}

.home-night-player__time {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.home-night-player__controls {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.home-night-player__controls span {
  display: grid;
  min-height: 26px;
  place-items: center;
  border: 2px solid color-mix(in srgb, var(--home-border) 78%, #050711);
  background:
    linear-gradient(135deg, rgba(94, 234, 255, 0.14), transparent 45%),
    #1b2233;
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  font-size: 11px;
  font-weight: 950;
  box-shadow:
    inset 2px 2px 0 rgba(255, 255, 255, 0.08),
    inset -2px -2px 0 rgba(0, 0, 0, 0.58);
}

.home-night-player__control--rewind,
.home-night-player__control--fast-forward,
.home-night-player__control--pause,
.home-night-player__control--next {
  position: relative;
}

.home-night-player__control--rewind::before,
.home-night-player__control--rewind::after,
.home-night-player__control--fast-forward::before,
.home-night-player__control--fast-forward::after,
.home-night-player__control--next::before {
  position: absolute;
  top: 50%;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  content: '';
  transform: translateY(-50%);
}

.home-night-player__control--rewind::before,
.home-night-player__control--rewind::after {
  border-right: 7px solid currentColor;
}

.home-night-player__control--rewind::before {
  left: calc(50% - 8px);
}

.home-night-player__control--rewind::after {
  left: calc(50% - 1px);
}

.home-night-player__control--fast-forward::before,
.home-night-player__control--fast-forward::after {
  border-left: 7px solid currentColor;
}

.home-night-player__control--fast-forward::before {
  left: calc(50% - 6px);
}

.home-night-player__control--fast-forward::after {
  left: calc(50% + 1px);
}

.home-night-player__control--pause::before {
  position: absolute;
  top: 50%;
  left: calc(50% - 5px);
  width: 3px;
  height: 12px;
  background: currentColor;
  box-shadow: 7px 0 0 currentColor;
  content: '';
  transform: translateY(-50%);
}

.home-night-player__control--next::before {
  left: calc(50% - 7px);
  border-left: 8px solid currentColor;
}

.home-night-player__control--next::after {
  position: absolute;
  top: 50%;
  left: calc(50% + 5px);
  width: 3px;
  height: 12px;
  background: currentColor;
  content: '';
  transform: translateY(-50%);
}

.home-taskbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 8;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  padding: 5px 7px;
  border-top: 2px solid var(--home-border);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--home-surface) 88%, transparent), var(--home-pink-soft)),
    var(--home-surface);
}

:global(:root:not([data-theme='night']) .home-taskbar) {
  right: 0;
  left: 0;
  width: auto;
  max-width: none;
  border-top-color: color-mix(in srgb, var(--home-border) 82%, var(--home-y2k-cyan));
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(201, 214, 231, 0.8) 46%, rgba(255, 228, 244, 0.92)),
    var(--home-surface);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.78),
    0 -3px 0 rgba(99, 231, 247, 0.16);
}

.home-taskbar__start,
.home-taskbar__window,
.home-taskbar__clock {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  padding: 0 9px;
  border: 2px solid var(--home-border);
  background: var(--home-surface);
  color: var(--home-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
  text-decoration: none;
  box-shadow:
    inset -2px -2px 0 color-mix(in srgb, var(--home-shadow) 42%, transparent),
    inset 2px 2px 0 color-mix(in srgb, #ffffff 88%, transparent);
}

.home-taskbar__start {
  flex: 0 0 auto;
  min-width: 104px;
  background: var(--home-pink-soft);
}

:global(:root:not([data-theme='night']) .home-taskbar__start),
:global(:root:not([data-theme='night']) .home-taskbar__window),
:global(:root:not([data-theme='night']) .home-taskbar__clock) {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.86), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(223, 232, 242, 0.78)),
    var(--home-surface);
  box-shadow:
    inset 2px 2px 0 rgba(255, 255, 255, 0.82),
    inset -2px -2px 0 rgba(143, 160, 180, 0.34),
    2px 2px 0 rgba(83, 71, 106, 0.16);
}

:global(:root:not([data-theme='night']) .home-taskbar__window--active) {
  background:
    linear-gradient(180deg, rgba(255, 228, 244, 0.92), rgba(223, 251, 255, 0.78)),
    var(--home-surface-soft);
}

.home-taskbar__start-icon {
  width: 18px;
  height: 18px;
  color: var(--home-pink);
}

.home-taskbar__separator {
  flex: 0 0 auto;
  width: 2px;
  height: 30px;
  border-left: 2px solid color-mix(in srgb, var(--home-border) 48%, transparent);
  border-right: 2px solid color-mix(in srgb, #ffffff 70%, transparent);
}

.home-taskbar__windows {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.home-taskbar__windows--day {
  display: none;
}

:global(:root:not([data-theme='night']) .home-taskbar__windows--day) {
  display: flex;
  flex: 1 1 auto;
}

:global(:root:not([data-theme='night']) .home-taskbar__windows--night) {
  display: none;
}

.home-taskbar__window {
  flex: 1 1 0;
  max-width: 230px;
  justify-content: flex-start;
}

.home-taskbar__window--social {
  flex: 0 0 auto;
  max-width: none;
}

:global(:root:not([data-theme='night']) .home-taskbar__window--social) {
  justify-content: center;
  width: 42px;
  padding-inline: 0;
}

:global(:root:not([data-theme='night']) .home-taskbar__window--social span:last-child) {
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  overflow: hidden;
  white-space: nowrap;
}

.home-taskbar__social-icon {
  display: block;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.home-taskbar__start:hover,
.home-taskbar__start:focus-visible,
.home-taskbar__window:hover,
.home-taskbar__window:focus-visible {
  background: var(--home-blue-soft);
  outline: 0;
}

.home-taskbar__window--active {
  background: var(--home-surface-soft);
  box-shadow:
    inset 2px 2px 0 color-mix(in srgb, var(--home-shadow) 54%, transparent),
    inset -2px -2px 0 color-mix(in srgb, #ffffff 70%, transparent);
}

.home-taskbar__dot {
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  border: 2px solid var(--home-border);
  background: var(--home-pink);
}

.home-taskbar__window:nth-child(even) .home-taskbar__dot {
  background: var(--home-blue);
}

.home-taskbar__window span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-taskbar__clock {
  flex: 0 0 auto;
  justify-content: flex-start;
  min-width: 96px;
  background: var(--home-blue-soft);
  cursor: pointer;
}

.home-taskbar__mode {
  display: inline-grid;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  place-items: center;
  color: #ffcf4a;
  font-family: var(--ns-font-decorative);
  font-size: 17px;
  line-height: 1;
  text-shadow:
    1px 0 0 var(--home-border),
    -1px 0 0 var(--home-border),
    0 1px 0 var(--home-border),
    0 -1px 0 var(--home-border);
}

.home-taskbar__mode::before {
  content: '☀';
}

:global(:root[data-theme='night'] .home-taskbar__mode) {
  color: #ffd36a;
  text-shadow:
    1px 0 0 #12071d,
    -1px 0 0 #12071d,
    0 1px 0 #12071d,
    0 -1px 0 #12071d,
    0 0 8px rgba(255, 211, 106, 0.28);
}

:global(:root[data-theme='night'] .home-taskbar__mode::before) {
  content: '☾';
}

@media (max-width: 1080px) {
  .home-window--main {
    right: 24px;
    left: 132px;
  }

  .home-night-window--status {
    left: 132px;
    width: 252px;
  }

  .home-night-window--dialogue {
    left: 132px;
    width: min(320px, 34vw);
  }

  .home-night-window--chat {
    top: 58px;
    right: 18px;
    width: min(450px, 42vw);
  }

  .home-night-window--assets {
    top: 338px;
    left: 386px;
    width: 240px;
  }

  .home-night-window--control {
    right: 8px;
    width: min(330px, 32vw);
  }

  .home-window--links,
  .home-window--portrait {
    display: none;
  }

  .home-profile__copy {
    width: min(330px, 52%);
  }
}

@media (max-width: 720px) {
  .home-page {
    overflow-y: auto;
  }

  .home-desktop {
    display: grid;
    gap: 14px;
    min-height: 100svh;
    padding: 14px 14px 58px;
  }

  .home-desktop__icons {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
    gap: 8px;
  }

  .home-desktop-icon {
    font-size: 11px;
  }

  .home-desktop-icon__image {
    width: 44px;
    height: 44px;
    padding: 8px;
  }

  .home-window {
    position: relative;
    inset: auto;
    z-index: 1 !important;
    width: 100%;
    translate: none;
  }

  .home-window__bar {
    cursor: default;
    touch-action: auto;
  }

  .home-window--main {
    min-height: min(62svh, 520px);
  }

  .home-window--links {
    display: grid;
  }

  .home-window--portrait {
    display: grid;
    min-height: 260px;
  }

  .home-night-window {
    min-height: 0;
  }

  .home-night-chat p {
    grid-template-columns: 52px minmax(0, 1fr);
  }

  .home-night-chat__avatar {
    grid-row: span 3;
  }

  .home-night-fragment-stability {
    grid-column: 2;
  }

  .home-night-window--status,
  .home-night-window--dialogue,
  .home-night-window--chat,
  .home-night-window--assets,
  .home-night-window--control {
    width: 100%;
  }

  .home-avatar-list {
    grid-template-columns: 1fr;
  }

  .home-night-player {
    grid-template-columns: 76px minmax(0, 1fr);
  }

  .home-night-player__pad {
    width: 76px;
    height: 76px;
  }

  .home-night-player__pad::before {
    inset: 20px;
  }

  .home-night-player__controls span {
    min-height: 32px;
  }

  .home-night-chat__message--right {
    margin-left: 0;
  }

  .home-day-foreground,
  .home-night-foreground {
    display: none;
  }

  .home-profile__art {
    display: block;
    left: 8%;
    opacity: 0.92;
  }

  :global(:root[data-theme='night'] .home-profile__art) {
    display: block;
    opacity: 0.92;
  }

  .home-profile__copy {
    top: 16px;
    left: 16px;
    width: min(220px, calc(100% - 32px));
  }

  .home-taskbar {
    z-index: 30;
  }

  .home-taskbar__windows {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    touch-action: pan-x;
    -webkit-overflow-scrolling: touch;
  }

  .home-taskbar__windows::-webkit-scrollbar {
    display: none;
  }

  :global(:root:not([data-theme='night']) .home-taskbar__windows--day),
  :global(:root[data-theme='night'] .home-taskbar__windows--night) {
    display: flex;
  }

  :global(:root:not([data-theme='night']) .home-taskbar__windows--night),
  :global(:root[data-theme='night'] .home-taskbar__windows--day) {
    display: none;
  }

  .home-taskbar__window {
    flex: 0 0 auto;
    scroll-snap-align: start;
  }

  .home-taskbar__windows--night .home-taskbar__window {
    width: auto;
    min-width: 112px;
    max-width: 150px;
  }

  .home-taskbar__clock {
    min-width: 94px;
    font-size: 11px;
  }
}

@media (max-width: 440px) {
  .home-desktop__icons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-profile__copy h1 {
    font-size: 42px;
  }

  .home-taskbar__start {
    min-width: 88px;
  }
}

@keyframes home-night-window-spawn {
  0% {
    opacity: 0;
    transform: translate(6px, -4px);
  }

  60% {
    opacity: 1;
    transform: translate(-2px, 2px);
  }

  100% {
    opacity: 1;
    transform: translate(0);
  }
}

@keyframes home-night-metric-float {
  0% {
    transform: translateY(2px);
    filter: brightness(0.82);
  }

  42% {
    transform: translateY(-2px);
    filter: brightness(1.45);
  }

  100% {
    transform: translateY(0);
    filter: brightness(1);
  }
}

@keyframes home-progress-fill {
  0% {
    transform: scaleX(0);
  }

  100% {
    transform: scaleX(1);
  }
}

@keyframes home-player-disc {
  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  50% {
    transform: translateX(0);
  }

  75% {
    transform: translateX(5px);
  }
}

@keyframes home-player-progress {
  0% {
    inline-size: 22%;
  }

  50% {
    inline-size: 64%;
  }

  100% {
    inline-size: 22%;
  }
}

@keyframes home-player-eq {
  0%,
  100% {
    transform: scaleY(0.42);
  }

  50% {
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page *,
  .home-page *::before,
  .home-page *::after {
    animation: none !important;
    transition: none !important;
  }

  .home-night-foreground,
  .home-day-foreground,
  .home-profile__art {
    transform: none !important;
  }
}
</style>
