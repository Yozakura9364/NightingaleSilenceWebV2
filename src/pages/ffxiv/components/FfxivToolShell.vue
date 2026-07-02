<template>
  <main class="ns-page ffxiv-tool-page">
    <div class="ns-page-shell">
      <RouterLink class="ffxiv-tool-back" :to="siteRoutes.ffxiv">← {{ placeholderCopy }}</RouterLink>

      <section class="ns-panel ffxiv-tool-hero">
        <p class="ns-eyebrow">{{ tool.projectName }}</p>
        <h1 class="ns-title">{{ tool.title }}</h1>
        <p class="ns-lead">{{ placeholderCopy }}</p>
      </section>

      <div class="ffxiv-tool-layout">
        <section class="ns-panel ffxiv-tool-panel">
          <h2>{{ placeholderCopy }}</h2>
          <ToolApiStatus :boundary="boundary" />
          <dl class="ffxiv-tool-meta">
            <div>
              <dt>{{ placeholderCopy }}</dt>
              <dd>{{ boundary.sourcePath }}</dd>
            </div>
          </dl>
        </section>

        <section class="ns-panel ffxiv-tool-panel ffxiv-tool-workspace">
          <h2>{{ placeholderCopy }}</h2>
          <slot>
            <div class="ffxiv-tool-placeholder" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </slot>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { placeholderCopy, siteRoutes, type ToolEntry } from '@/config/site'
import type { ApiBoundary } from '@/services/apiBoundaries'
import ToolApiStatus from '@/pages/ffxiv/components/ToolApiStatus.vue'

defineProps<{
  tool: ToolEntry
  boundary: ApiBoundary
}>()
</script>

<style scoped>
.ffxiv-tool-page {
  background:
    linear-gradient(125deg, rgba(217, 251, 251, 0.5), rgba(255, 244, 251, 0.58) 58%, rgba(255, 255, 255, 0.7)),
    var(--ns-color-bg);
}

.ffxiv-tool-back {
  display: inline-flex;
  margin-bottom: 24px;
  color: var(--ns-color-text-muted);
  font-size: 14px;
  font-weight: 800;
}

.ffxiv-tool-back:hover {
  color: var(--ns-color-accent-strong);
}

.ffxiv-tool-hero {
  padding: clamp(28px, 5vw, 56px);
}

.ffxiv-tool-layout {
  display: grid;
  grid-template-columns: minmax(260px, 0.74fr) minmax(0, 1.26fr);
  gap: 18px;
  margin-top: 18px;
}

.ffxiv-tool-panel {
  padding: 22px;
}

.ffxiv-tool-panel h2 {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 900;
}

.ffxiv-tool-meta {
  display: grid;
  gap: 14px;
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 14px;
}

.ffxiv-tool-meta div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.ffxiv-tool-meta dt,
.ffxiv-tool-meta dd {
  margin: 0;
}

.ffxiv-tool-meta dt {
  color: var(--ns-color-text);
  font-weight: 900;
}

.ffxiv-tool-meta dd {
  overflow-wrap: anywhere;
}

.ffxiv-tool-workspace {
  min-height: 260px;
}

.ffxiv-tool-placeholder {
  display: grid;
  gap: 12px;
}

.ffxiv-tool-placeholder span {
  display: block;
  height: 42px;
  border: 1px dashed var(--ns-color-border-strong);
  border-radius: var(--ns-radius-sm);
  background: rgba(255, 255, 255, 0.46);
}

@media (max-width: 860px) {
  .ffxiv-tool-layout {
    grid-template-columns: 1fr;
  }
}
</style>
