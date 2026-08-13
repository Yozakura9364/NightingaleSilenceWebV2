<template>
  <main class="ns-page ffxiv-page">
    <div class="ns-page-shell">
      <FfxivClockPanel />
    </div>
  </main>
</template>

<script setup lang="ts">
import FfxivClockPanel from '@/pages/ffxiv/components/FfxivClockPanel.vue'
</script>

<style scoped>
.ffxiv-page {
  --ffxiv-page-bg: #f3f5f7;
  --ffxiv-card-bg: #ffffff;
  --ffxiv-ink: #2d3142;
  --ffxiv-muted: #737b8c;
  --ffxiv-line: #d8dce3;
  --ffxiv-accent: var(--ns-color-accent-strong);
  min-height: 100%;
  background: var(--ffxiv-page-bg);
  color: var(--ffxiv-ink);
}

.ffxiv-page :deep(.ns-page-shell) {
  width: min(1280px, calc(100vw - 32px));
  padding-top: 28px;
  padding-bottom: 48px;
}

.ffxiv-page :deep(.ffxiv-clock-panel) {
  gap: 24px;
  margin-top: 0;
  color: var(--ffxiv-ink);
}

.ffxiv-page :deep(.ffxiv-clock-section),
.ffxiv-page :deep(.ffxiv-calendar-section) {
  gap: 12px;
}

.ffxiv-page :deep(.ffxiv-clock-section__title),
.ffxiv-page :deep(.ffxiv-calendar-section__title) {
  color: var(--ffxiv-ink);
  font-family: var(--ns-font-ui);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0;
}

.ffxiv-page :deep(.ffxiv-mechanism-grid) {
  gap: 16px;
}

.ffxiv-page :deep(.ffxiv-clock-card) {
  gap: 14px;
  padding: 20px;
  border: var(--ns-line-width) solid var(--ffxiv-line);
  border-radius: 8px;
  background: var(--ffxiv-card-bg);
  box-shadow: 0 2px 8px rgba(45, 49, 66, 0.04);
}

.ffxiv-page :deep(.ffxiv-clock-card__header h3),
.ffxiv-page :deep(.ffxiv-clock-card__primary-value),
.ffxiv-page :deep(.ffxiv-clock-card__facts dd) {
  color: var(--ffxiv-ink);
}

.ffxiv-page :deep(.ffxiv-clock-card__header h3) {
  font-family: var(--ns-font-ui);
  font-size: 16px;
  font-weight: 800;
}

.ffxiv-page :deep(.ffxiv-clock-card__primary-value) {
  font-family: var(--ns-font-ui);
  font-size: 24px;
  font-weight: 800;
}

.ffxiv-page :deep(.ffxiv-clock-card__countdown > span),
.ffxiv-page :deep(.ffxiv-clock-card__facts dt),
.ffxiv-page :deep(.ffxiv-calendar-section__range) {
  color: var(--ffxiv-muted);
}

.ffxiv-page :deep(.ffxiv-clock-card__facts dd) {
  font-family: var(--ns-font-ui);
  font-size: 13px;
  font-weight: 700;
}

.ffxiv-page :deep(.ffxiv-region-switch) {
  border: var(--ns-line-width) solid var(--ffxiv-line);
  border-radius: 6px;
  overflow: hidden;
}

.ffxiv-page :deep(.ffxiv-region-switch button) {
  min-height: 30px;
  border-left: var(--ns-line-width) solid var(--ffxiv-line);
  color: var(--ffxiv-muted);
  font-family: var(--ns-font-ui);
  font-weight: 700;
}

.ffxiv-page :deep(.ffxiv-region-switch button[aria-pressed='true']) {
  background: var(--ns-color-accent-soft);
  color: var(--ffxiv-accent);
}

.ffxiv-page :deep(.ffxiv-clock-card__banner) {
  border-radius: 6px;
  background: #eef0f3;
}

.ffxiv-page :deep(.ffxiv-calendar-section__header) {
  align-items: baseline;
}

.ffxiv-page
  :deep(
    .ffxiv-calendar-section
      :is(.vis-panel.vis-center, .vis-panel.vis-background, .vis-panel.vis-top)
  ) {
  background: var(--ffxiv-card-bg);
}

.ffxiv-page :deep(.ffxiv-calendar-section .vis-panel.vis-left) {
  background: #f7f8fa;
}

.ffxiv-page :deep(.ffxiv-calendar-section .vis-item.timeline-item--common) {
  background: var(--ns-color-accent-soft);
  border-color: color-mix(in srgb, var(--ns-color-accent) 42%, var(--ffxiv-line));
  border-radius: 6px;
}

.ffxiv-page :deep(.ffxiv-calendar-section .vis-item.timeline-item--cn) {
  background: var(--ns-color-cyan-soft);
  border-color: color-mix(in srgb, var(--ns-color-cyan) 42%, var(--ffxiv-line));
  border-radius: 6px;
}

.ffxiv-page :deep(.ffxiv-calendar-section .vis-item.timeline-item--global) {
  background: #edf0f5;
  border-color: #cbd1dc;
  border-radius: 6px;
}

.ffxiv-page :deep(.ffxiv-calendar-section .vis-current-time),
.ffxiv-page :deep(.ffxiv-calendar-section .vis-current-time::before) {
  background: var(--ffxiv-accent);
}

.ffxiv-page :deep(.ffxiv-calendar-section .timeline-event-copy__title),
.ffxiv-page :deep(.ffxiv-calendar-section .timeline-event-copy__end),
.ffxiv-page :deep(.ffxiv-calendar-section .vis-time-axis .vis-text),
.ffxiv-page :deep(.ffxiv-calendar-section .vis-labelset .vis-label .vis-inner) {
  color: var(--ffxiv-ink);
}

:global(:root[data-theme='night'] .ffxiv-page) {
  --ffxiv-page-bg: #1e232b;
  --ffxiv-card-bg: #282f39;
  --ffxiv-ink: #eef1f5;
  --ffxiv-muted: #aeb7c4;
  --ffxiv-line: #48515e;
  --ffxiv-accent: var(--ns-color-accent-strong);
}

@media (max-width: 680px) {
  .ffxiv-page :deep(.ns-page-shell) {
    width: min(100%, calc(100vw - 24px));
    padding-top: 20px;
  }
}
</style>
