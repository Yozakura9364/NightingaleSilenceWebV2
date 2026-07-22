<template>
  <main class="ns-page ffxiv-tool-page" :class="`ffxiv-tool-page--${variant}`">
    <div class="ns-page-shell">
      <template v-if="variant === 'workspace'">
        <section class="ffxiv-tool-workspace ffxiv-tool-workspace--wide ns-animate ns-animate--fade-in-up ns-animate-visible">
          <slot>
            <div class="ffxiv-tool-placeholder" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </slot>
        </section>
      </template>

      <template v-else>
        <AppBackLink :to="siteRoutes.ffxiv" />

        <section class="ns-panel ffxiv-tool-hero">
          <p class="ns-eyebrow">{{ tool.projectName }}</p>
          <h1 class="ns-title">{{ t(tool.titleKey) }}</h1>
          <p class="ns-lead">{{ t(textKeys.placeholder) }}</p>
        </section>

        <div class="ffxiv-tool-layout">
          <section class="ns-panel ffxiv-tool-panel">
            <h2 class="ns-heading-bloom">{{ t(textKeys.placeholder) }}</h2>
            <ToolApiStatus v-if="boundary" :boundary="boundary" />
            <dl class="ffxiv-tool-meta">
              <div>
                <dt>{{ t(textKeys.placeholder) }}</dt>
                <dd>{{ boundary?.sourcePath ?? tool.sourcePath }}</dd>
              </div>
            </dl>
          </section>

          <section class="ns-panel ffxiv-tool-panel ffxiv-tool-workspace">
            <h2 class="ns-heading-bloom">{{ t(textKeys.placeholder) }}</h2>
            <slot>
              <div class="ffxiv-tool-placeholder" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </slot>
          </section>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { siteRoutes, type ToolEntry } from '@/config/site'
import AppBackLink from '@/components/AppBackLink.vue'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'
import type { ApiBoundary } from '@/services/apiBoundaries'
import ToolApiStatus from '@/pages/ffxiv/components/ToolApiStatus.vue'

const { t } = useLocale()

withDefaults(
  defineProps<{
    tool: ToolEntry
    boundary?: ApiBoundary
    variant?: 'default' | 'workspace'
  }>(),
  {
    variant: 'default'
  }
)
</script>

<style scoped>
.ffxiv-tool-page {
  background: var(--ns-body-background);
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
  font-family: var(--ns-font-decorative);
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
  font-family: var(--ns-font-decorative);
  font-weight: 900;
}

.ffxiv-tool-meta dd {
  font-family: var(--ns-font-mono);
  overflow-wrap: anywhere;
}

.ffxiv-tool-workspace {
  min-height: 260px;
}

.ffxiv-tool-page--workspace {
  min-height: calc(100vh - 58px);
}

.ffxiv-tool-page--workspace .ns-page-shell {
  width: 100%;
  padding: 0;
}

.ffxiv-tool-workspace--wide {
  display: flex;
  height: calc(100vh - 58px);
  min-height: 500px;
  flex-direction: column;
  overflow: hidden;
}

.ffxiv-tool-placeholder {
  display: grid;
  gap: 12px;
  flex: 1;
  padding: 16px;
}

.ffxiv-tool-placeholder span {
  display: block;
  height: 42px;
  border: 1px dashed var(--ns-color-border-strong);
  border-radius: var(--ns-radius-sm);
  background: var(--ns-pixel-surface);
}

@media (max-width: 860px) {
  .ffxiv-tool-layout {
    grid-template-columns: 1fr;
  }

  .ffxiv-tool-workspace--wide {
    height: auto;
    min-height: 0;
    overflow: visible;
  }
}
</style>
