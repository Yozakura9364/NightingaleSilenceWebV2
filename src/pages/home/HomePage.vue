<template>
  <main class="ns-page home-page">
    <section class="home-stage" aria-labelledby="home-title">
      <div class="home-stage__grid" aria-hidden="true" />
      <div class="home-stage__glow home-stage__glow--pink" aria-hidden="true" />
      <div class="home-stage__glow home-stage__glow--blue" aria-hidden="true" />

      <nav class="home-top-bar home-window" :aria-label="t(textKeys.primaryNavigation)">
        <div class="home-window__bar">
          <span class="home-window__title">
            <span class="home-window__icon" aria-hidden="true"></span>
            {{ t(siteMeta.enNameKey) }}
          </span>
          <span class="home-window__controls" aria-hidden="true">
            <span class="home-window__control home-window__control--min"></span>
            <span class="home-window__control home-window__control--max"></span>
            <span class="home-window__control home-window__control--close"></span>
          </span>
        </div>

        <div class="home-top-bar__items">
          <AppButton
            v-for="item in homeNavItems"
            :key="item.id"
            :to="item.route"
            :variant="item.variant"
          >
            <span>{{ t(item.labelKey) }}</span>
            <span v-if="item.commandKey" class="home-top-bar__command" aria-hidden="true">
              {{ t(item.commandKey) }}
            </span>
          </AppButton>
        </div>
      </nav>

      <div class="home-content">
        <p class="home-kicker">{{ t(siteMeta.enNameKey) }}</p>
        <h1 id="home-title" class="home-title">{{ t(siteMeta.zhNameKey) }}</h1>
        <p class="home-lead">
          {{ t(textKeys.placeholder) }}
        </p>
        <div class="home-actions">
          <AppButton :to="siteRoutes.ffxiv" variant="primary">{{ t(textKeys.ffxivWorkshop) }}</AppButton>
          <AppButton :to="siteRoutes.silence">{{ t(textKeys.silence) }}</AppButton>
        </div>
      </div>

      <div class="home-visual" aria-hidden="true">
        <aside class="home-window home-character-window">
          <div class="home-window__bar">
            <span class="home-window__title">
              <span class="home-window__icon" aria-hidden="true"></span>
              {{ t(siteMeta.enNameKey) }}
            </span>
            <span class="home-window__controls" aria-hidden="true">
              <span class="home-window__control home-window__control--min"></span>
              <span class="home-window__control home-window__control--max"></span>
              <span class="home-window__control home-window__control--close"></span>
            </span>
          </div>

          <div class="home-character-placeholder">
            <div class="home-character-placeholder__screen">
              <span>{{ t(textKeys.placeholder) }}</span>
            </div>
          </div>
        </aside>

        <div class="home-floating-icon home-floating-icon--heart">♡</div>
        <div class="home-floating-icon home-floating-icon--folder">□</div>
        <div class="home-floating-icon home-floating-icon--cursor">↖</div>
      </div>

      <aside class="home-window home-menu-card">
        <div class="home-window__bar">
          <span class="home-window__title">
            <span class="home-window__icon" aria-hidden="true"></span>
            {{ t(siteMeta.enNameKey) }}
          </span>
          <span class="home-window__controls" aria-hidden="true">
            <span class="home-window__control home-window__control--min"></span>
            <span class="home-window__control home-window__control--max"></span>
            <span class="home-window__control home-window__control--close"></span>
          </span>
        </div>

        <div class="home-menu-card__body">
          <AppButton
            v-for="item in homeNavItems"
            :key="item.id"
            :to="item.route"
            :variant="item.variant"
          >
            <span>{{ t(item.labelKey) }}</span>
            <span v-if="item.commandKey" class="home-menu-card__command" aria-hidden="true">
              {{ t(item.commandKey) }}
            </span>
          </AppButton>
          <div class="home-status-line">
            <span>{{ t(textKeys.statusWip) }}</span>
            <strong>{{ t(textKeys.placeholder) }}</strong>
          </div>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import { homeNavItems, siteMeta, siteRoutes, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

const { t } = useLocale()
</script>

<style scoped>
.home-page {
  position: relative;
  min-height: 100svh;
  overflow-x: hidden;
  --home-pixel-bg: #fff7fd;
  --home-pixel-bg-blue: #e8fbff;
  --home-pixel-surface: #ffffff;
  --home-pixel-surface-pink: #ffe9f6;
  --home-pixel-surface-blue: #d9fbff;
  --home-pixel-ink: #2a2138;
  --home-pixel-muted: #6f637a;
  --home-pixel-pink: #ff7cc2;
  --home-pixel-blue: #5edceb;
  --home-pixel-border: #2a2138;
  --home-pixel-shadow: rgba(42, 33, 56, 0.24);
  --home-pixel-soft-shadow: rgba(255, 124, 194, 0.2);
  --home-pixel-window-bar: linear-gradient(
    90deg,
    var(--home-pixel-surface-pink),
    var(--home-pixel-surface-blue)
  );
  --home-pixel-stage-bg:
    linear-gradient(90deg, rgba(255, 124, 194, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(94, 220, 235, 0.08) 1px, transparent 1px),
    linear-gradient(135deg, var(--home-pixel-bg) 0%, #ffffff 48%, var(--home-pixel-bg-blue) 100%);
  --home-pixel-stage-bg-size:
    16px 16px,
    16px 16px,
    auto;
  --home-pixel-title-shadow:
    3px 3px 0 var(--home-pixel-surface-blue),
    6px 6px 0 var(--home-pixel-soft-shadow);
  --home-pixel-window-shadow:
    4px 4px 0 var(--home-pixel-shadow),
    0 0 20px rgba(94, 220, 235, 0.08);
  --home-pixel-control-bg: transparent;
  --home-pixel-control-color: var(--home-pixel-ink);
  background: var(--home-pixel-stage-bg);
  background-size: var(--home-pixel-stage-bg-size);
  color: var(--home-pixel-ink);
}

:global(:root[data-theme='night'] .home-page) {
  --home-pixel-bg: #030407;
  --home-pixel-bg-blue: #071014;
  --home-pixel-surface: #0d1018;
  --home-pixel-surface-pink: #150d16;
  --home-pixel-surface-blue: #0b171c;
  --home-pixel-ink: #f5f1fb;
  --home-pixel-muted: #cac2d0;
  --home-pixel-pink: #ff5fb8;
  --home-pixel-blue: #5eeaff;
  --home-pixel-border: #cbc2d2;
  --home-pixel-shadow: rgba(5, 9, 18, 0.62);
  --home-pixel-soft-shadow: rgba(255, 95, 184, 0.16);
  --home-pixel-window-bar:
    linear-gradient(90deg, rgba(255, 95, 184, 0.24), rgba(94, 234, 255, 0.2)),
    #10131d;
  --home-pixel-stage-bg:
    radial-gradient(circle at 14% 12%, rgba(255, 95, 184, 0.16), transparent 28%),
    radial-gradient(circle at 84% 8%, rgba(94, 234, 255, 0.18), transparent 30%),
    linear-gradient(
      115deg,
      rgba(30, 20, 34, 0.5) 0%,
      rgba(3, 4, 7, 0.99) 48%,
      rgba(12, 34, 39, 0.4) 100%
    ),
    linear-gradient(135deg, var(--home-pixel-bg) 0%, var(--home-pixel-bg-blue) 100%);
  --home-pixel-stage-bg-size:
    auto,
    auto,
    auto,
    auto;
  --home-pixel-title-shadow:
    2px 2px 0 rgba(94, 234, 255, 0.52),
    -2px 0 0 rgba(255, 95, 184, 0.38),
    0 0 10px rgba(94, 234, 255, 0.22),
    0 0 22px rgba(255, 95, 184, 0.16);
  --home-pixel-window-shadow:
    4px 4px 0 var(--home-pixel-shadow),
    0 0 18px rgba(94, 234, 255, 0.08),
    0 0 26px rgba(255, 95, 184, 0.06);
  --home-pixel-control-bg: rgba(94, 234, 255, 0.08);
  --home-pixel-control-color: #fff6ff;
}

.home-top-bar {
  position: absolute;
  top: 28px;
  right: 0;
  z-index: 4;
  width: min(520px, 100%);
  padding: 0;
}

.home-top-bar :deep(.ns-button) {
  min-height: 34px;
  padding: 0 13px;
  gap: 7px;
  border-color: var(--home-pixel-border);
  background: var(--home-pixel-surface);
  color: var(--home-pixel-ink);
  font-size: 12px;
  box-shadow: 2px 2px 0 var(--home-pixel-shadow);
}

.home-top-bar :deep(.ns-button--primary) {
  background: var(--home-pixel-pink);
  color: #ffffff;
}

:global(:root[data-theme='night'] .home-top-bar) :deep(.ns-button--primary) {
  color: #fff8fd;
}

.home-top-bar__items {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px;
}

.home-top-bar__command {
  padding-left: 6px;
  border-left: 1px solid color-mix(in srgb, var(--home-pixel-border) 45%, transparent);
  color: var(--home-pixel-muted);
  font-size: 10px;
  font-weight: 950;
  letter-spacing: 0.02em;
}

.home-stage {
  position: relative;
  display: grid;
  min-height: 100svh;
  grid-template-columns: minmax(0, 0.96fr) minmax(320px, 0.86fr);
  align-items: center;
  gap: min(6vw, 72px);
  width: min(1180px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 132px 0 92px;
}

.home-stage__grid,
.home-stage__glow {
  position: absolute;
  pointer-events: none;
}

.home-stage__grid {
  inset: 116px auto auto -52px;
  width: 340px;
  height: 240px;
  opacity: 0.2;
  background-image: radial-gradient(circle, var(--home-pixel-pink) 1px, transparent 1px);
  background-size: 12px 12px;
}

.home-stage__glow {
  width: 240px;
  height: 240px;
  opacity: 0.38;
  filter: blur(2px);
}

.home-stage__glow--pink {
  top: 12%;
  left: -8%;
  background: radial-gradient(circle, var(--home-pixel-pink), transparent 68%);
}

.home-stage__glow--blue {
  right: -10%;
  bottom: 12%;
  background: radial-gradient(circle, var(--home-pixel-blue), transparent 68%);
}

.home-content {
  position: relative;
  z-index: 2;
  max-width: 640px;
}

.home-kicker {
  margin: 0 0 12px;
  color: var(--home-pixel-pink);
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 950;
  letter-spacing: 0;
  text-transform: uppercase;
  text-shadow: 2px 2px 0 var(--home-pixel-surface-blue);
}

.home-title {
  margin: 0;
  color: var(--home-pixel-ink);
  font-family: var(--ns-font-display);
  font-size: clamp(58px, 8vw, 112px);
  font-weight: 950;
  line-height: 0.96;
  letter-spacing: 0;
  text-shadow: var(--home-pixel-title-shadow);
  overflow-wrap: anywhere;
}

.home-lead {
  max-width: 560px;
  margin: 24px 0 0;
  color: var(--home-pixel-muted);
  font-size: 17px;
  line-height: 1.78;
}

.home-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}

.home-actions :deep(.ns-button) {
  min-height: 44px;
  border-color: var(--home-pixel-border);
  background: var(--home-pixel-surface);
  color: var(--home-pixel-ink);
  box-shadow: 3px 3px 0 var(--home-pixel-shadow);
}

.home-actions :deep(.ns-button--primary) {
  background: var(--home-pixel-pink);
  color: #ffffff;
}

:global(:root[data-theme='night'] .home-actions) :deep(.ns-button--primary) {
  color: #fff8fd;
}

.home-visual {
  position: relative;
  z-index: 2;
  min-height: min(62vh, 620px);
}

.home-window {
  min-width: 0;
  border: 2px solid var(--home-pixel-border);
  background: var(--home-pixel-surface);
  box-shadow: var(--home-pixel-window-shadow);
}

.home-window__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 42px;
  padding: 8px 12px;
  border-bottom: 2px solid var(--home-pixel-border);
  background: var(--home-pixel-window-bar);
  color: var(--home-pixel-ink);
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 950;
}

.home-window__title {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-window__icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border: 2px solid var(--home-pixel-border);
  background:
    linear-gradient(135deg, var(--home-pixel-pink), var(--home-pixel-blue)),
    var(--home-pixel-surface);
}

.home-window__controls {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
}

.home-window__control {
  position: relative;
  width: 22px;
  height: 22px;
  border: 2px solid var(--home-pixel-border);
  background: var(--home-pixel-control-bg);
  color: var(--home-pixel-control-color);
}

.home-window__control--min::before,
.home-window__control--close::before,
.home-window__control--close::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 11px;
  height: 2px;
  background: currentColor;
  content: '';
  transform: translate(-50%, -50%);
}

.home-window__control--max::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9px;
  height: 9px;
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

.home-character-window {
  position: absolute;
  inset: 5% 4% 2% 7%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  animation: home-float 7s ease-in-out infinite;
}

.home-character-placeholder {
  display: grid;
  min-height: 0;
  padding: 18px;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--home-pixel-border) 6%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, var(--home-pixel-border) 6%, transparent) 1px, transparent 1px);
  background-size: 18px 18px;
}

.home-character-placeholder__screen {
  display: grid;
  width: 100%;
  min-height: min(48vh, 500px);
  place-items: center;
  border: 2px solid var(--home-pixel-border);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--home-pixel-pink) 18%, transparent), transparent 42%),
    linear-gradient(315deg, color-mix(in srgb, var(--home-pixel-blue) 24%, transparent), transparent 48%),
    var(--home-pixel-surface);
  color: var(--home-pixel-muted);
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 900;
  text-align: center;
}

.home-menu-card {
  position: absolute;
  right: 7%;
  bottom: 7%;
  z-index: 3;
  width: min(360px, 42vw);
}

.home-menu-card__body {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.home-menu-card :deep(.ns-button) {
  justify-content: space-between;
  min-height: 38px;
  border-color: var(--home-pixel-border);
  background: var(--home-pixel-surface);
  color: var(--home-pixel-ink);
  font-size: 12px;
  box-shadow: 2px 2px 0 var(--home-pixel-shadow);
}

.home-menu-card :deep(.ns-button--primary) {
  background: var(--home-pixel-surface-blue);
}

:global(:root[data-theme='night'] .home-menu-card) :deep(.ns-button--primary) {
  background: color-mix(in srgb, var(--home-pixel-blue) 16%, var(--home-pixel-surface));
}

.home-menu-card__command {
  color: var(--home-pixel-muted);
  font-size: 10px;
  font-weight: 950;
}

.home-status-line {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
  padding: 0 10px;
  border: 2px solid var(--home-pixel-border);
  background: var(--home-pixel-surface-pink);
  color: var(--home-pixel-ink);
  font-family: var(--ns-font-decorative);
  font-size: 11px;
  font-weight: 900;
}

.home-status-line strong {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-floating-icon {
  position: absolute;
  display: grid;
  width: 62px;
  height: 62px;
  place-items: center;
  border: 2px solid var(--home-pixel-border);
  background: var(--home-pixel-surface);
  color: var(--home-pixel-pink);
  font-family: var(--ns-font-decorative);
  font-size: 32px;
  font-weight: 900;
  box-shadow: 3px 3px 0 var(--home-pixel-shadow);
  animation: home-icon-float 5s ease-in-out infinite;
}

.home-floating-icon--heart {
  top: 10%;
  left: 2%;
}

.home-floating-icon--folder {
  right: 0;
  top: 30%;
  animation-delay: -1.8s;
}

.home-floating-icon--cursor {
  left: 18%;
  bottom: 3%;
  animation-delay: -3.1s;
}

@keyframes home-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

@keyframes home-icon-float {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }

  50% {
    transform: translateY(-14px) rotate(3deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-character-window,
  .home-floating-icon {
    animation: none;
  }
}

@media (max-width: 1120px) {
  .home-stage {
    grid-template-columns: minmax(360px, 0.9fr) minmax(300px, 1fr);
  }

  .home-menu-card {
    right: 3%;
  }
}

@media (max-width: 960px) {
  .home-top-bar {
    position: relative;
    top: auto;
    right: auto;
    width: 100%;
    grid-column: 1;
    order: -2;
  }

  .home-stage {
    grid-template-columns: 1fr;
    width: min(680px, calc(100vw - 28px));
    gap: 34px;
    padding: 18px 0 58px;
  }

  .home-visual {
    min-height: 420px;
    order: 0;
  }

  .home-content {
    order: -1;
    text-align: center;
  }

  .home-lead {
    font-size: 16px;
  }

  .home-actions {
    justify-content: center;
  }

  .home-menu-card {
    position: relative;
    right: auto;
    bottom: auto;
    width: 100%;
  }
}

@media (max-width: 520px) {
  .home-top-bar__items,
  .home-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .home-top-bar :deep(.ns-button),
  .home-actions :deep(.ns-button) {
    width: 100%;
  }

  .home-title {
    font-size: 52px;
  }

  .home-visual {
    min-height: 360px;
  }

  .home-character-window {
    inset: 0;
  }

  .home-floating-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
}
</style>
