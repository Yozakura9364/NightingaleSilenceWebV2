<template>
  <main class="ns-page silence-group-page" :class="`silence-group-page--${currentGroup.id}`">
    <div class="ns-page-shell silence-group-shell">
      <RouterLink class="silence-back" :to="siteRoutes.silence">
        ← {{ t(textKeys.back) }}
      </RouterLink>

      <section class="silence-group-stage" :aria-labelledby="`${currentGroup.id}-title`">
        <div class="silence-group-stage__visual" aria-hidden="true">
          <span
            v-for="slot in visualSlotCount"
            :key="slot"
            class="silence-group-stage__slot"
          ></span>
        </div>

        <div class="silence-group-stage__copy">
          <p class="ns-eyebrow">{{ t(textKeys.silence) }}</p>
          <h1 :id="`${currentGroup.id}-title`" class="ns-title">
            {{ t(currentGroup.titleKey) }}
          </h1>
          <p class="ns-lead">
            {{ t(currentGroup.summaryKey) }}
          </p>
        </div>
      </section>

      <section class="ns-panel silence-group-placeholder">
        <p>{{ t(textKeys.placeholder) }}</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { silenceGroups, siteRoutes, textKeys } from '@/config/site'
import { useLocale } from '@/stores/locale'

const route = useRoute()
const { t } = useLocale()

const currentGroup = computed(
  () => silenceGroups.find((group) => group.route === route.path) ?? silenceGroups[0]
)
const visualSlotCount = computed(() => (currentGroup.value.id === 'angel' ? 6 : 2))
</script>

<style scoped>
.silence-group-page {
  background:
    repeating-linear-gradient(
      90deg,
      rgba(99, 217, 220, 0.08) 0 1px,
      transparent 1px 32px
    ),
    var(--ns-body-background);
}

.silence-group-page--glitch {
  background:
    repeating-linear-gradient(0deg, rgba(127, 217, 227, 0.1) 0 1px, transparent 1px 10px),
    linear-gradient(135deg, #121426, #101827 48%, #173138);
}

.silence-group-shell {
  display: grid;
  gap: 24px;
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

.silence-group-page--glitch .silence-back,
.silence-group-page--glitch .ns-title,
.silence-group-page--glitch .ns-lead {
  color: #f8f1ff;
}

.silence-group-page--glitch .ns-lead {
  color: rgba(248, 241, 255, 0.72);
}

.silence-group-stage {
  display: grid;
  grid-template-columns: minmax(420px, 1.05fr) minmax(320px, 0.95fr);
  gap: 28px;
  align-items: stretch;
}

.silence-group-stage__visual {
  position: relative;
  min-height: 520px;
  border: 2px solid var(--ns-pixel-border);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 232, 246, 0.66)),
    linear-gradient(90deg, rgba(239, 111, 178, 0.12), rgba(99, 217, 220, 0.18));
  box-shadow: var(--ns-shadow-panel);
  overflow: hidden;
}

.silence-group-page--glitch .silence-group-stage__visual {
  border-color: rgba(248, 241, 255, 0.74);
  background:
    repeating-linear-gradient(90deg, rgba(240, 128, 189, 0.12) 0 1px, transparent 1px 18px),
    linear-gradient(135deg, rgba(28, 31, 56, 0.94), rgba(15, 24, 39, 0.98));
  box-shadow: 6px 6px 0 rgba(127, 217, 227, 0.22);
}

.silence-group-stage__slot {
  position: absolute;
  bottom: 0;
  width: 12%;
  min-width: 44px;
  border: 2px solid rgba(42, 33, 56, 0.5);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(239, 111, 178, 0.2)),
    var(--ns-color-cyan-soft);
  box-shadow: 5px 5px 0 rgba(99, 217, 220, 0.22);
}

.silence-group-stage__slot:nth-child(1) {
  left: 7%;
  height: 54%;
}

.silence-group-stage__slot:nth-child(2) {
  left: 20%;
  height: 68%;
}

.silence-group-stage__slot:nth-child(3) {
  left: 33%;
  height: 59%;
}

.silence-group-stage__slot:nth-child(4) {
  left: 46%;
  height: 72%;
}

.silence-group-stage__slot:nth-child(5) {
  left: 59%;
  height: 57%;
}

.silence-group-stage__slot:nth-child(6) {
  left: 72%;
  height: 64%;
}

.silence-group-stage__slot:nth-child(even) {
  transform: translateY(18px);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(99, 217, 220, 0.2)),
    var(--ns-color-accent-soft);
}

.silence-group-page--glitch .silence-group-stage__slot {
  width: 42%;
  min-width: 0;
  height: 44%;
  border-color: rgba(248, 241, 255, 0.72);
  background: rgba(13, 19, 32, 0.9);
  box-shadow: 7px 7px 0 rgba(127, 217, 227, 0.2);
  transform: none;
}

.silence-group-page--glitch .silence-group-stage__slot::before {
  position: absolute;
  inset: 0 0 auto;
  height: 30px;
  border-bottom: 2px solid rgba(248, 241, 255, 0.54);
  background: linear-gradient(90deg, rgba(240, 128, 189, 0.46), rgba(127, 217, 227, 0.36));
  content: '';
}

.silence-group-page--glitch .silence-group-stage__slot:nth-child(1) {
  inset: 18% auto auto 12%;
}

.silence-group-page--glitch .silence-group-stage__slot:nth-child(2) {
  inset: auto 12% 16% auto;
}

.silence-group-stage__copy {
  display: grid;
  align-content: end;
  min-height: 520px;
  padding: 28px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  box-shadow: var(--ns-shadow-panel);
  backdrop-filter: blur(14px);
}

.silence-group-page--glitch .silence-group-stage__copy {
  border-color: rgba(248, 241, 255, 0.28);
  background: rgba(15, 19, 34, 0.74);
}

.silence-group-placeholder {
  padding: 22px;
}

.silence-group-placeholder p {
  margin: 0;
  color: var(--ns-color-text-muted);
}

.silence-group-page--glitch .silence-group-placeholder {
  border-color: rgba(248, 241, 255, 0.28);
  background: rgba(15, 19, 34, 0.74);
}

.silence-group-page--glitch .silence-group-placeholder p {
  color: rgba(248, 241, 255, 0.72);
}

@media (max-width: 920px) {
  .silence-group-stage {
    grid-template-columns: 1fr;
  }

  .silence-group-stage__copy {
    min-height: auto;
  }
}

@media (max-width: 640px) {
  .silence-group-stage__visual {
    min-height: 360px;
  }
}
</style>
