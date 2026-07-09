<template>
  <div class="silence-gate">
    <section class="silence-gate__intro" aria-labelledby="silence-title">
      <h1 id="silence-title" class="silence-gate__title">{{ t(textKeys.silence) }}</h1>
    </section>

    <div class="silence-poster" :aria-label="t(textKeys.silence)">
      <div
        v-for="group in silenceGroups"
        :key="group.id"
        class="silence-poster__entry"
        :class="`silence-poster__entry--${group.id}`"
        :aria-label="t(group.titleKey)"
      >
        <div class="silence-poster__art" aria-hidden="true">
          <template v-if="group.id === 'angel'">
            <span
              v-for="character in angelPreviewCharacters"
              :key="character.id"
              class="silence-poster__figure"
              :style="{ '--silence-poster-character-color': character.color }"
            >
              <img
                v-if="character.portraitSrc"
                :src="character.portraitSrc"
                alt=""
                decoding="async"
              />
            </span>
            <span class="silence-poster__stage-line"></span>
          </template>
          <template v-else>
            <span v-for="slot in glitchGhostSlots" :key="slot" class="silence-poster__ghost">
              <span class="silence-poster__ghost-bar"></span>
            </span>
            <span class="silence-poster__window silence-poster__window--main"></span>
            <span class="silence-poster__window silence-poster__window--echo"></span>
            <span class="silence-poster__scanline"></span>
          </template>
        </div>

        <span class="silence-poster__label">{{ t(group.titleKey) }}</span>
      </div>
      <span class="silence-poster__rift" aria-hidden="true"></span>
    </div>

    <SilenceTurnHint
      :label="t(textKeys.silenceCharacterNavigation)"
      :left-to="siteRoutes.silenceAngel"
      :left-label="t(textKeys.silenceAngel)"
      :right-to="siteRoutes.silenceGlitch"
      :right-label="t(textKeys.silenceGlitch)"
    />
  </div>
</template>

<script setup lang="ts">
import { silenceGroups, siteRoutes, textKeys } from '@/config/site'
import { getSilenceCharactersByGroup } from '@/data/silence/characters'
import SilenceTurnHint from '@/pages/silence/components/SilenceTurnHint.vue'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
const glitchGhostSlots = 2
const angelPreviewCharacters = getSilenceCharactersByGroup('angel')
</script>

<style scoped>
.silence-gate {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: calc(100vh - 56px);
}

.silence-gate__intro {
  position: absolute;
  top: clamp(78px, 13vh, 132px);
  left: clamp(24px, 8vw, 128px);
  z-index: 8;
  max-width: 760px;
  pointer-events: none;
}

.silence-gate__title {
  margin: 0;
  color: #2c2338;
  font-family: var(--ns-font-display);
  font-size: 76px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  overflow-wrap: anywhere;
  text-shadow:
    3px 3px 0 rgba(99, 217, 220, 0.28),
    -2px -2px 0 rgba(239, 111, 178, 0.18);
}

.silence-gate__intro .ns-lead {
  color: rgba(49, 40, 63, 0.62);
}

.silence-poster {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  min-height: 100%;
  grid-template-columns: minmax(0, 2.15fr) minmax(300px, 0.85fr);
  background:
    linear-gradient(90deg, rgba(255, 248, 253, 0.82), rgba(220, 248, 250, 0.22) 62%),
    var(--ns-color-surface);
  overflow: hidden;
}

.silence-poster__entry {
  position: relative;
  display: grid;
  min-width: 0;
  align-content: end;
  padding: clamp(28px, 5vw, 72px);
  color: var(--ns-color-text);
  overflow: hidden;
  transition:
    color var(--ns-transition-fast),
    filter var(--ns-transition),
    transform var(--ns-transition);
}

.silence-poster__entry::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: '';
  pointer-events: none;
  transition: opacity var(--ns-transition);
}

.silence-poster__entry--angel {
  background:
    linear-gradient(90deg, rgba(255, 250, 253, 0.94), rgba(255, 240, 249, 0.8) 72%, transparent),
    repeating-linear-gradient(90deg, rgba(239, 111, 178, 0.08) 0 1px, transparent 1px 26px),
    repeating-linear-gradient(0deg, rgba(99, 217, 220, 0.08) 0 1px, transparent 1px 26px);
}

.silence-poster__entry--angel::before {
  background: linear-gradient(135deg, rgba(239, 111, 178, 0.08), rgba(99, 217, 220, 0.18));
  opacity: 0;
}

.silence-poster__entry--glitch {
  background:
    repeating-linear-gradient(0deg, rgba(127, 217, 227, 0.1) 0 1px, transparent 1px 8px),
    repeating-linear-gradient(90deg, rgba(240, 128, 189, 0.08) 0 1px, transparent 1px 22px),
    linear-gradient(135deg, #16182a, #0c1322 52%, #152f35);
  color: #f8f1ff;
}

.silence-poster__entry--glitch::before {
  background:
    radial-gradient(circle at 66% 24%, rgba(127, 217, 227, 0.22), transparent 28%),
    linear-gradient(90deg, rgba(8, 14, 25, 0.1), rgba(127, 217, 227, 0.16));
  opacity: 0.44;
}

.silence-poster__label {
  position: relative;
  z-index: 3;
  justify-self: start;
  color: currentColor;
  font-family: var(--ns-font-display);
  font-size: clamp(30px, 4vw, 54px);
  font-weight: 950;
  line-height: 1;
  opacity: 0.9;
  pointer-events: none;
  text-shadow: 3px 3px 0 rgba(99, 217, 220, 0.18);
}

.silence-poster__art {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.silence-poster__figure {
  position: absolute;
  bottom: 17%;
  width: clamp(128px, 13.5vw, 244px);
  height: clamp(300px, 58vh, 660px);
  filter:
    drop-shadow(0 24px 28px rgba(42, 33, 56, 0.18))
    drop-shadow(0 0 22px color-mix(in srgb, var(--silence-poster-character-color), transparent 72%));
}

.silence-poster__figure:nth-child(1) {
  left: 3%;
  z-index: 1;
  transform: translateY(18px) scale(0.92);
}

.silence-poster__figure:nth-child(2) {
  left: 15%;
  z-index: 3;
  transform: translateY(2px) scale(1.02);
}

.silence-poster__figure:nth-child(3) {
  left: 29%;
  z-index: 2;
  transform: translateY(22px) scale(0.94);
}

.silence-poster__figure:nth-child(4) {
  left: 42%;
  z-index: 4;
  transform: translateY(-8px) scale(1.06);
}

.silence-poster__figure:nth-child(5) {
  left: 56%;
  z-index: 2;
  transform: translateY(24px) scale(0.96);
}

.silence-poster__figure:nth-child(6) {
  left: 70%;
  z-index: 3;
  transform: translateY(10px) scale(1);
}

.silence-poster__figure img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom center;
  transform: translateY(7%) scale(1.72);
  transform-origin: bottom center;
}

.silence-poster__stage-line {
  position: absolute;
  right: 5%;
  bottom: 32%;
  left: 7%;
  height: 2px;
  background: rgba(42, 33, 56, 0.28);
  box-shadow:
    0 18px 0 rgba(99, 217, 220, 0.18),
    0 36px 0 rgba(239, 111, 178, 0.16);
}

.silence-poster__ghost {
  position: absolute;
  bottom: 35%;
  width: clamp(84px, 9vw, 136px);
  height: 39%;
  border: 2px solid rgba(248, 241, 255, 0.74);
  background:
    linear-gradient(180deg, rgba(127, 217, 227, 0.18), rgba(8, 14, 25, 0.72)),
    rgba(15, 23, 40, 0.9);
  box-shadow:
    7px 7px 0 rgba(127, 217, 227, 0.22),
    -5px -5px 0 rgba(240, 128, 189, 0.12);
}

.silence-poster__ghost:nth-child(1) {
  left: 18%;
}

.silence-poster__ghost:nth-child(2) {
  right: 14%;
  height: 46%;
  transform: translateY(-18px);
}

.silence-poster__ghost-bar {
  position: absolute;
  right: 12px;
  bottom: 22px;
  left: 12px;
  height: 2px;
  background: rgba(127, 217, 227, 0.9);
  box-shadow:
    0 10px 0 rgba(240, 128, 189, 0.82),
    0 20px 0 rgba(127, 217, 227, 0.65);
}

.silence-poster__window {
  position: absolute;
  border: 2px solid rgba(248, 241, 255, 0.76);
  background: rgba(20, 28, 46, 0.9);
  box-shadow: 6px 6px 0 rgba(127, 217, 227, 0.22);
}

.silence-poster__window::before {
  position: absolute;
  inset: 0 0 auto;
  height: 24px;
  border-bottom: 2px solid rgba(248, 241, 255, 0.56);
  background: linear-gradient(90deg, rgba(240, 128, 189, 0.44), rgba(127, 217, 227, 0.36));
  content: '';
}

.silence-poster__window--main {
  inset: 11% 11% auto 20%;
  height: 26%;
}

.silence-poster__window--echo {
  inset: 20% 27% auto 8%;
  height: 24%;
  opacity: 0.62;
  transform: translate(14px, 10px);
}

.silence-poster__scanline {
  position: absolute;
  right: 8%;
  bottom: 34%;
  width: 42%;
  height: 2px;
  background: #7fd9e3;
  box-shadow:
    0 10px 0 rgba(240, 128, 189, 0.8),
    0 20px 0 rgba(127, 217, 227, 0.72);
}

.silence-poster__rift {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(100% * 2.15 / 3);
  z-index: 4;
  width: clamp(88px, 12vw, 170px);
  background:
    linear-gradient(90deg, transparent, rgba(220, 248, 250, 0.58) 42%, rgba(9, 15, 28, 0.52)),
    repeating-linear-gradient(0deg, transparent 0 24px, rgba(127, 217, 227, 0.18) 24px 26px);
  pointer-events: none;
  transform: translateX(-50%);
}

.silence-poster__rift::before,
.silence-poster__rift::after {
  position: absolute;
  content: '';
  pointer-events: none;
}

.silence-poster__rift::before {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: rgba(42, 33, 56, 0.34);
  box-shadow:
    -18px 0 0 rgba(239, 111, 178, 0.14),
    18px 0 0 rgba(127, 217, 227, 0.24);
}

.silence-poster__rift::after {
  inset: 16% 28% 18%;
  background:
    linear-gradient(90deg, rgba(239, 111, 178, 0.28), rgba(127, 217, 227, 0.34)),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.2) 0 2px, transparent 2px 10px);
  opacity: 0.68;
}

@media (max-width: 920px) {
  .silence-gate {
    min-height: auto;
  }

  .silence-gate__intro {
    top: 76px;
    left: 24px;
    right: 24px;
  }

  .silence-poster {
    position: relative;
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 260px;
  }

  .silence-poster__entry {
    min-height: 460px;
  }

  .silence-poster__entry--glitch {
    min-height: 380px;
  }

  .silence-poster__rift {
    inset: calc(460px - 48px) 0 auto;
    width: 100%;
    height: 96px;
    background:
      linear-gradient(180deg, transparent, rgba(220, 248, 250, 0.58) 45%, rgba(9, 15, 28, 0.48)),
      repeating-linear-gradient(90deg, transparent 0 24px, rgba(127, 217, 227, 0.16) 24px 26px);
    transform: none;
  }

  .silence-poster__rift::before {
    inset: 50% 0 auto;
    width: auto;
    height: 2px;
    background: rgba(42, 33, 56, 0.34);
    box-shadow:
      0 -18px 0 rgba(239, 111, 178, 0.14),
      0 18px 0 rgba(127, 217, 227, 0.24);
  }

  .silence-poster__rift::after {
    inset: 28% 18% 28%;
  }
}

@media (max-width: 640px) {
  .silence-gate__intro {
    left: 14px;
    right: 14px;
  }

  .silence-gate__title {
    font-size: 48px;
  }

  .silence-poster__entry {
    min-height: 430px;
    padding: 18px 14px;
  }

  .silence-poster__entry--glitch {
    min-height: 340px;
  }

  .silence-poster__figure {
    bottom: 42%;
    width: clamp(58px, 15vw, 92px);
    height: clamp(180px, 36vh, 320px);
  }

  .silence-poster__stage-line,
  .silence-poster__scanline {
    bottom: 38%;
  }

  .silence-poster__ghost {
    bottom: 41%;
    width: clamp(58px, 22vw, 86px);
  }
}
</style>
