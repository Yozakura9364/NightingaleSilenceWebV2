<template>
  <main class="ns-page silence-page">
    <div class="silence-gate">
      <RouterLink class="silence-back" :to="siteRoutes.home">← {{ t(textKeys.back) }}</RouterLink>

      <section class="silence-gate__intro" aria-labelledby="silence-title">
        <p class="ns-eyebrow">{{ t(textKeys.placeholder) }}</p>
        <h1 id="silence-title" class="silence-gate__title">{{ t(textKeys.silence) }}</h1>
        <p class="ns-lead">
          {{ t(textKeys.placeholder) }}
        </p>
      </section>

      <div class="silence-poster" :aria-label="t(textKeys.silence)">
        <RouterLink
          v-for="group in silenceGroups"
          :key="group.id"
          class="silence-poster__entry"
          :class="`silence-poster__entry--${group.id}`"
          :to="group.route"
        >
          <div class="silence-poster__art" aria-hidden="true">
            <template v-if="group.id === 'angel'">
              <span v-for="slot in angelFigureSlots" :key="slot" class="silence-poster__figure">
                <span class="silence-poster__figure-head"></span>
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

          <div class="silence-poster__body">
            <span class="ns-status">{{ t(group.statusLabelKey) }}</span>
            <h2 class="silence-poster__title">{{ t(group.titleKey) }}</h2>
            <p class="silence-poster__text">{{ t(group.summaryKey) }}</p>
            <span class="silence-poster__action">{{ t(textKeys.enter) }}</span>
          </div>
        </RouterLink>
        <span class="silence-poster__rift" aria-hidden="true"></span>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { silenceGroups, siteRoutes, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
const angelFigureSlots = 6
const glitchGhostSlots = 2
</script>

<style scoped>
.silence-page {
  position: relative;
  min-height: calc(100vh - 56px);
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 240, 249, 0.72), transparent 42%),
    linear-gradient(90deg, transparent 48%, rgba(199, 246, 250, 0.72)),
    repeating-linear-gradient(
      90deg,
      rgba(99, 217, 220, 0.1) 0 1px,
      transparent 1px 28px
    ),
    repeating-linear-gradient(0deg, rgba(239, 111, 178, 0.09) 0 1px, transparent 1px 28px),
    var(--ns-body-background);
}

.silence-page::before {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    radial-gradient(circle at 24% 22%, rgba(255, 255, 255, 0.74), transparent 30%),
    radial-gradient(circle at 82% 62%, rgba(99, 217, 220, 0.2), transparent 32%);
  content: '';
  pointer-events: none;
}

.silence-gate {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: calc(100vh - 56px);
}

.silence-back {
  position: absolute;
  top: 36px;
  left: clamp(24px, 8vw, 128px);
  z-index: 8;
  color: rgba(49, 40, 63, 0.68);
  font-size: 14px;
  font-weight: 800;
}

.silence-back:hover {
  color: var(--ns-color-accent-strong);
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
  text-decoration: none;
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

.silence-poster__entry:hover,
.silence-poster__entry:focus-visible {
  transform: translateY(-2px);
}

.silence-poster__entry:hover::before,
.silence-poster__entry:focus-visible::before {
  opacity: 0.86;
}

.silence-poster__entry:focus-visible {
  outline: 3px solid var(--ns-color-accent);
  outline-offset: -6px;
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

.silence-poster__art {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.silence-poster__figure {
  position: absolute;
  bottom: 35%;
  width: clamp(58px, 8.4vw, 126px);
  border: 2px solid rgba(42, 33, 56, 0.5);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(239, 111, 178, 0.2)),
    var(--ns-color-cyan-soft);
  box-shadow:
    5px 5px 0 rgba(99, 217, 220, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.42);
}

.silence-poster__figure::after {
  position: absolute;
  right: 18%;
  bottom: -18px;
  left: 18%;
  height: 18px;
  border: 2px solid rgba(42, 33, 56, 0.34);
  border-top: 0;
  background: rgba(255, 255, 255, 0.38);
  content: '';
}

.silence-poster__figure-head {
  position: absolute;
  top: clamp(-52px, -4vw, -34px);
  left: 50%;
  width: 46%;
  aspect-ratio: 1;
  border: 2px solid rgba(42, 33, 56, 0.48);
  background: rgba(255, 250, 253, 0.86);
  box-shadow: 4px 4px 0 rgba(239, 111, 178, 0.18);
  transform: translateX(-50%);
}

.silence-poster__figure:nth-child(1) {
  left: 8%;
  height: 30%;
}

.silence-poster__figure:nth-child(2) {
  left: 22%;
  height: 41%;
}

.silence-poster__figure:nth-child(3) {
  left: 35%;
  height: 35%;
}

.silence-poster__figure:nth-child(4) {
  left: 48%;
  height: 45%;
}

.silence-poster__figure:nth-child(5) {
  left: 61%;
  height: 34%;
}

.silence-poster__figure:nth-child(6) {
  left: 74%;
  height: 39%;
}

.silence-poster__figure:nth-child(even) {
  transform: translateY(20px);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(99, 217, 220, 0.2)),
    var(--ns-color-accent-soft);
}

.silence-poster__figure:nth-child(2),
.silence-poster__figure:nth-child(4) {
  z-index: 2;
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

.silence-poster__body {
  position: relative;
  z-index: 3;
  display: grid;
  width: min(100%, 640px);
  gap: 12px;
  padding: 18px 22px 20px;
  border: 2px solid currentColor;
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(14px);
}

.silence-poster__entry--angel .silence-poster__body {
  color: #241b2f;
  background: rgba(255, 252, 255, 0.82);
  box-shadow: 6px 6px 0 rgba(42, 33, 56, 0.09);
}

.silence-poster__entry--glitch .silence-poster__body {
  color: #f8f1ff;
  background: rgba(12, 16, 28, 0.76);
  box-shadow: 6px 6px 0 rgba(127, 217, 227, 0.12);
}

.silence-poster__entry--angel .ns-status {
  border-color: rgba(42, 33, 56, 0.34);
  background: #d9fbfb;
  color: #237579;
}

.silence-poster__entry--glitch .ns-status {
  border-color: rgba(127, 217, 227, 0.42);
  background: rgba(127, 217, 227, 0.16);
  color: #8ee7ef;
}

.silence-poster__title {
  margin: 0;
  font-family: var(--ns-font-display);
  font-size: 32px;
  font-weight: 950;
  line-height: 1.05;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.silence-poster__text {
  min-height: 48px;
  margin: 0;
  color: var(--ns-color-text-muted);
}

.silence-poster__entry--angel .silence-poster__text {
  color: #766a83;
}

.silence-poster__entry--glitch .silence-poster__text {
  color: rgba(248, 241, 255, 0.72);
}

.silence-poster__action {
  display: inline-flex;
  justify-self: start;
  min-height: 34px;
  align-items: center;
  padding: 0 12px;
  border: 2px solid currentColor;
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 900;
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
  .silence-page {
    overflow: visible;
  }

  .silence-gate {
    min-height: auto;
  }

  .silence-back {
    top: 28px;
    left: 24px;
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
  .silence-back {
    left: 14px;
  }

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

  .silence-poster__body {
    padding: 16px;
  }

  .silence-poster__title {
    font-size: 26px;
  }

  .silence-poster__figure {
    bottom: 39%;
    width: clamp(36px, 11vw, 58px);
  }

  .silence-poster__figure-head {
    top: -30px;
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
