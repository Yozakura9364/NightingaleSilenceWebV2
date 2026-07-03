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

      <div class="silence-gate__entries">
        <RouterLink
          v-for="group in silenceGroups"
          :key="group.id"
          class="silence-entry"
          :class="`silence-entry--${group.id}`"
          :to="group.route"
        >
          <div class="silence-entry__visual" aria-hidden="true">
            <template v-if="group.id === 'angel'">
              <span
                v-for="slot in 6"
                :key="slot"
                class="silence-entry__figure"
              ></span>
            </template>
            <template v-else>
              <span class="silence-entry__window silence-entry__window--main"></span>
              <span class="silence-entry__window silence-entry__window--ghost"></span>
              <span class="silence-entry__scanline"></span>
            </template>
          </div>

          <div class="silence-entry__body">
            <span class="ns-status">{{ t(group.statusLabelKey) }}</span>
            <h2 class="silence-entry__title">{{ t(group.titleKey) }}</h2>
            <p class="silence-entry__text">{{ t(group.summaryKey) }}</p>
            <span class="silence-entry__action">{{ t(textKeys.enter) }}</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { silenceGroups, siteRoutes, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
</script>

<style scoped>
.silence-page {
  position: relative;
  overflow: hidden;
  background:
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
  background:
    linear-gradient(112deg, rgba(255, 240, 249, 0.72), transparent 45%),
    linear-gradient(248deg, rgba(18, 23, 42, 0.12), transparent 48%);
  content: '';
  pointer-events: none;
}

.silence-gate {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(1180px, calc(100vw - 32px));
  min-height: calc(100vh - 56px);
  align-content: center;
  gap: 34px;
  margin: 0 auto;
  padding: 44px 0 72px;
}

.silence-back {
  justify-self: start;
  color: var(--ns-color-text-muted);
  font-size: 14px;
  font-weight: 800;
}

.silence-back:hover {
  color: var(--ns-color-accent-strong);
}

.silence-gate__intro {
  max-width: 760px;
}

.silence-gate__title {
  margin: 0;
  color: var(--ns-color-text);
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

.silence-gate__entries {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.82fr);
  gap: 18px;
}

.silence-entry {
  position: relative;
  display: grid;
  min-height: 430px;
  grid-template-rows: minmax(220px, 1fr) auto;
  border: 2px solid var(--ns-pixel-border);
  color: var(--ns-color-text);
  box-shadow: var(--ns-shadow-panel);
  overflow: hidden;
  transition:
    transform var(--ns-transition),
    box-shadow var(--ns-transition);
}

.silence-entry:hover {
  transform: translateY(-3px);
  box-shadow: var(--ns-shadow-soft);
}

.silence-entry--angel {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 232, 246, 0.72)),
    linear-gradient(90deg, rgba(239, 111, 178, 0.16), rgba(99, 217, 220, 0.14));
}

.silence-entry--glitch {
  background:
    repeating-linear-gradient(0deg, rgba(127, 217, 227, 0.1) 0 1px, transparent 1px 9px),
    linear-gradient(135deg, #17182a, #101625 52%, #182d32);
  color: #f8f1ff;
}

.silence-entry__visual {
  position: relative;
  min-height: 220px;
}

.silence-entry__figure {
  position: absolute;
  bottom: 0;
  width: 13%;
  min-width: 42px;
  border: 2px solid rgba(42, 33, 56, 0.48);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(239, 111, 178, 0.24)),
    var(--ns-color-cyan-soft);
  box-shadow: 5px 5px 0 rgba(99, 217, 220, 0.22);
}

.silence-entry__figure:nth-child(1) {
  left: 8%;
  height: 52%;
}

.silence-entry__figure:nth-child(2) {
  left: 21%;
  height: 66%;
}

.silence-entry__figure:nth-child(3) {
  left: 34%;
  height: 58%;
}

.silence-entry__figure:nth-child(4) {
  left: 47%;
  height: 70%;
}

.silence-entry__figure:nth-child(5) {
  left: 60%;
  height: 56%;
}

.silence-entry__figure:nth-child(6) {
  left: 73%;
  height: 62%;
}

.silence-entry__figure:nth-child(even) {
  transform: translateY(18px);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(99, 217, 220, 0.22)),
    var(--ns-color-accent-soft);
}

.silence-entry__window {
  position: absolute;
  border: 2px solid rgba(248, 241, 255, 0.76);
  background: rgba(20, 28, 46, 0.9);
  box-shadow: 6px 6px 0 rgba(127, 217, 227, 0.24);
}

.silence-entry__window::before {
  position: absolute;
  inset: 0 0 auto;
  height: 28px;
  border-bottom: 2px solid rgba(248, 241, 255, 0.56);
  background: linear-gradient(90deg, rgba(240, 128, 189, 0.44), rgba(127, 217, 227, 0.36));
  content: '';
}

.silence-entry__window--main {
  inset: 16% 12% 24% 18%;
}

.silence-entry__window--ghost {
  inset: 30% 28% 12% 8%;
  opacity: 0.62;
  transform: translate(16px, 10px);
}

.silence-entry__scanline {
  position: absolute;
  right: 8%;
  bottom: 12%;
  width: 42%;
  height: 2px;
  background: #7fd9e3;
  box-shadow:
    0 10px 0 rgba(240, 128, 189, 0.8),
    0 20px 0 rgba(127, 217, 227, 0.72);
}

.silence-entry__body {
  display: grid;
  gap: 12px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(14px);
}

.silence-entry--angel .silence-entry__body {
  color: #241b2f;
}

.silence-entry--glitch .silence-entry__body {
  background: rgba(12, 16, 28, 0.78);
}

.silence-entry--angel .ns-status {
  border-color: rgba(42, 33, 56, 0.34);
  background: #d9fbfb;
  color: #237579;
}

.silence-entry--glitch .ns-status {
  border-color: rgba(127, 217, 227, 0.42);
  background: rgba(127, 217, 227, 0.16);
  color: #8ee7ef;
}

.silence-entry__title {
  margin: 0;
  font-family: var(--ns-font-display);
  font-size: 32px;
  font-weight: 950;
  line-height: 1.05;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.silence-entry__text {
  min-height: 48px;
  margin: 0;
  color: var(--ns-color-text-muted);
}

.silence-entry--angel .silence-entry__text {
  color: #766a83;
}

.silence-entry--glitch .silence-entry__text {
  color: rgba(248, 241, 255, 0.72);
}

.silence-entry__action {
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

@media (max-width: 880px) {
  .silence-gate__entries {
    grid-template-columns: 1fr;
  }

  .silence-entry {
    min-height: 360px;
  }
}

@media (max-width: 640px) {
  .silence-gate {
    width: min(100vw - 24px, 680px);
    padding: 32px 0 48px;
  }

  .silence-gate__title {
    font-size: 48px;
  }

  .silence-entry__title {
    font-size: 26px;
  }
}
</style>
