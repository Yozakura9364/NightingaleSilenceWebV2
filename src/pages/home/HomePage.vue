<template>
  <main class="ns-page home-page">
    <nav class="home-top-bar" aria-label="Primary navigation">
      <AppButton
        v-for="item in homeNavItems"
        :key="item.id"
        :to="item.route"
        :variant="item.variant"
      >
        {{ item.label }}
      </AppButton>
    </nav>

    <section class="home-stage" aria-labelledby="home-title">
      <div class="home-pixel-grid" aria-hidden="true" />

      <div class="home-content">
        <p class="home-kicker">{{ siteMeta.enName }}</p>
        <h1 id="home-title" class="home-title">{{ siteMeta.zhName }}</h1>
        <p class="home-lead">
          {{ placeholderCopy }}
        </p>
        <div class="home-actions">
          <AppButton :to="siteRoutes.ffxiv" variant="primary">{{ placeholderCopy }}</AppButton>
          <AppButton :to="siteRoutes.about">{{ placeholderCopy }}</AppButton>
        </div>
      </div>

      <div class="home-visual" aria-hidden="true">
        <div class="home-character-frame">
          <div class="home-character-placeholder">
            <span>{{ placeholderCopy }}</span>
          </div>
        </div>
        <div class="home-floating-icon home-floating-icon--heart">♡</div>
        <div class="home-floating-icon home-floating-icon--folder">□</div>
        <div class="home-floating-icon home-floating-icon--cursor">↖</div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import { homeNavItems, placeholderCopy, siteMeta, siteRoutes } from '@/config/site'
</script>

<style scoped>
.home-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(rgba(255, 255, 255, 0.55) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.55) 1px, transparent 1px),
    linear-gradient(
      120deg,
      rgba(255, 223, 242, 0.92) 0%,
      rgba(255, 248, 253, 0.86) 46%,
      rgba(220, 250, 252, 0.94) 100%
    ),
    linear-gradient(135deg, #fff1f9 0%, #eefcff 100%);
  background-size:
    18px 18px,
    18px 18px,
    auto,
    auto;
}

.home-top-bar {
  position: fixed;
  top: 22px;
  right: 24px;
  z-index: 5;
  display: inline-flex;
  gap: 10px;
  padding: 8px;
  border: 1px solid rgba(239, 111, 178, 0.28);
  border-radius: var(--ns-radius-pill);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 14px 36px rgba(239, 111, 178, 0.14);
  backdrop-filter: blur(16px);
}

.home-stage {
  position: relative;
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(500px, 0.88fr) minmax(360px, 1fr);
  align-items: center;
  gap: min(7vw, 80px);
  width: min(1180px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 112px 0 72px;
}

.home-pixel-grid {
  position: absolute;
  pointer-events: none;
}

.home-pixel-grid {
  inset: 72px -8vw auto auto;
  width: 310px;
  height: 220px;
  opacity: 0.22;
  background-image: radial-gradient(circle, #ef6fb2 1px, transparent 1px);
  background-size: 10px 10px;
}

.home-content {
  position: relative;
  z-index: 2;
}

.home-kicker {
  margin: 0 0 12px;
  color: #d94d9d;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.home-title {
  margin: 0;
  color: #2b1f35;
  font-size: 112px;
  font-weight: 950;
  line-height: 0.92;
  letter-spacing: 0;
  white-space: nowrap;
  text-shadow:
    3px 3px 0 rgba(99, 217, 220, 0.42),
    -2px -2px 0 rgba(255, 255, 255, 0.82);
}

.home-lead {
  max-width: 560px;
  margin: 24px 0 0;
  color: #62566d;
  font-size: 18px;
}

.home-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}

.home-visual {
  position: relative;
  min-height: min(64vh, 640px);
}

.home-character-frame {
  position: absolute;
  inset: 8% 10% 4% 8%;
  display: grid;
  place-items: center;
  animation: home-float 7s ease-in-out infinite;
}

.home-character-placeholder {
  display: grid;
  width: min(420px, 70vw);
  aspect-ratio: 3 / 4;
  place-items: center;
  border: 3px solid rgba(92, 37, 80, 0.85);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(217, 251, 251, 0.72)),
    repeating-linear-gradient(0deg, transparent 0 6px, rgba(239, 111, 178, 0.08) 6px 7px);
  box-shadow:
    10px 10px 0 rgba(99, 217, 220, 0.38),
    0 22px 55px rgba(70, 45, 90, 0.18);
  color: rgba(88, 68, 105, 0.52);
  font-weight: 900;
}

.home-floating-icon {
  position: absolute;
  display: grid;
  width: 62px;
  height: 62px;
  place-items: center;
  border: 2px solid rgba(92, 37, 80, 0.72);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.68);
  color: #d94d9d;
  font-size: 32px;
  font-weight: 900;
  box-shadow: 6px 6px 0 rgba(99, 217, 220, 0.32);
  animation: home-icon-float 5s ease-in-out infinite;
}

.home-floating-icon--heart {
  top: 10%;
  left: 2%;
}

.home-floating-icon--folder {
  right: 0;
  top: 34%;
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
  .home-character-frame,
  .home-floating-icon {
    animation: none;
  }
}

@media (max-width: 1120px) {
  .home-stage {
    grid-template-columns: minmax(420px, 0.9fr) minmax(320px, 1fr);
  }

  .home-title {
    font-size: 92px;
  }
}

@media (max-width: 960px) {
  .home-top-bar {
    right: 12px;
    left: 12px;
    justify-content: center;
  }

  .home-stage {
    grid-template-columns: 1fr;
    width: min(640px, calc(100vw - 28px));
    padding-top: 116px;
  }

  .home-visual {
    min-height: 420px;
    order: -1;
  }

  .home-content {
    text-align: center;
  }

  .home-title {
    font-size: 72px;
  }

  .home-lead {
    font-size: 16px;
  }

  .home-actions {
    justify-content: center;
  }
}

@media (max-width: 520px) {
  .home-title {
    font-size: 56px;
  }
}
</style>
