<template>
  <section class="nsarmoire-panel nsarmoire-validation-panel">
    <div class="nsarmoire-panel__header">
      <h2>{{ t(textKeys.nsarmoireValidation) }}</h2>
      <span class="nsarmoire-validation-panel__badge">
        {{ t(textKeys.nsarmoireValidationTechnicalBadge) }}
      </span>
    </div>

    <AppStatus
      v-if="!snapshot"
      tone="info"
      :title="t(textKeys.nsarmoireSnapshotEmpty)"
      :message="t(textKeys.placeholder)"
    />

    <template v-else>
      <p class="nsarmoire-validation-panel__lead">
        {{ t(textKeys.nsarmoireValidationLead) }}
      </p>

      <div class="nsarmoire-validation-panel__grid">
        <article
          v-for="validationCase in validationCases"
          :key="validationCase.key"
          class="nsarmoire-validation-card"
          :class="`nsarmoire-validation-card--${validationCase.tone}`"
        >
          <div class="nsarmoire-validation-card__header">
            <h3>{{ validationCase.title }}</h3>
            <strong>{{ validationCase.status }}</strong>
          </div>

          <p>{{ validationCase.description }}</p>

          <dl class="nsarmoire-validation-card__rows">
            <div v-for="row in validationCase.rows" :key="row.key">
              <dt>{{ row.label }}</dt>
              <dd :class="{ 'nsarmoire-validation-card__code': row.code }">
                {{ row.value }}
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type {
  ArmoireCatalog,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'
import { useArmoireValidationViewModels } from '@/pages/armoire/composables/useArmoireValidationViewModels'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  analysis: ArmoireSnapshotAnalysis | null
  catalog: ArmoireCatalog
  snapshot: ArmoireSnapshot | null
}>()

const { t } = useLocale()
const { validationCases } = useArmoireValidationViewModels(props, t)
</script>

<style scoped>
.nsarmoire-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
  box-shadow: var(--ns-pixel-soft-shadow);
}

.nsarmoire-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nsarmoire-panel h2 {
  margin: 0;
  font-family: var(--ns-font-decorative);
  font-size: 16px;
  font-weight: 950;
}

.nsarmoire-validation-panel__badge {
  flex: 0 0 auto;
  padding: 3px 7px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-validation-panel__lead {
  margin: 0;
  color: var(--ns-color-text-muted);
  line-height: 1.7;
}

.nsarmoire-validation-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}

.nsarmoire-validation-card {
  display: grid;
  align-content: start;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
}

.nsarmoire-validation-card--success {
  border-color: var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
}

.nsarmoire-validation-card--warning {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
}

.nsarmoire-validation-card--danger {
  border-color: var(--ns-status-danger-border);
  background: var(--ns-status-danger-bg);
}

.nsarmoire-validation-card__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.nsarmoire-validation-card h3,
.nsarmoire-validation-card p,
.nsarmoire-validation-card dl,
.nsarmoire-validation-card dt,
.nsarmoire-validation-card dd {
  margin: 0;
  min-width: 0;
}

.nsarmoire-validation-card h3 {
  font-family: var(--ns-font-decorative);
  font-size: 14px;
  font-weight: 950;
  line-height: 1.35;
}

.nsarmoire-validation-card__header strong {
  flex: 0 0 auto;
  padding: 2px 6px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  font-size: 11px;
}

.nsarmoire-validation-card p {
  color: var(--ns-color-text-muted);
  line-height: 1.6;
}

.nsarmoire-validation-card__rows {
  display: grid;
  gap: 7px;
}

.nsarmoire-validation-card__rows div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.nsarmoire-validation-card__rows dt {
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-validation-card__rows dd {
  overflow-wrap: anywhere;
}

.nsarmoire-validation-card__code {
  font-family: var(--ns-font-mono);
  font-size: 12px;
}

@media (max-width: 900px) {
  .nsarmoire-validation-panel__grid {
    grid-template-columns: 1fr;
  }
}
</style>
