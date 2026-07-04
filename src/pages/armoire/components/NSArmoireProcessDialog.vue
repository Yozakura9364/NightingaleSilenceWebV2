<template>
  <Teleport to="body">
    <div
      class="nsarmoire-process-dialog"
      role="presentation"
      @click.self="$emit('close')"
      @keydown.esc="$emit('close')"
    >
      <AppPixelWindow
        class="nsarmoire-process-dialog__window"
        :title="t(textKeys.nsarmoireProcessDialogTitle)"
        :close-label="t('common.close.window')"
        role="dialog"
        aria-modal="true"
        @close="$emit('close')"
      >
        <AppStatus
          compact
          tone="warning"
          :title="t(textKeys.nsarmoireHelperMultipleProcesses)"
          :message="t(textKeys.nsarmoireProcessDialogMessage)"
        >
          <template #actions>
            <AppButton :disabled="busy" @click="$emit('refresh')">
              {{ t(textKeys.nsarmoireProcessRefresh) }}
            </AppButton>
          </template>
        </AppStatus>

        <AppStatus
          v-if="error"
          compact
          tone="danger"
          :title="t(textKeys.nsarmoireProcessError)"
          :message="error"
        />

        <AppStatus
          v-if="!processes.length"
          compact
          tone="info"
          :title="t(textKeys.nsarmoireProcessNoProcesses)"
        />

        <div v-else class="nsarmoire-process-dialog__list">
          <article
            v-for="process in processes"
            :key="process.pid"
            class="nsarmoire-process-dialog__item"
            :class="{ 'is-selected': process.isSelected, 'is-unreadable': !process.isReadable }"
          >
            <div class="nsarmoire-process-dialog__item-header">
              <strong>{{ process.displayName }}</strong>
              <span v-if="process.isSelected" class="nsarmoire-process-dialog__badge">
                {{ t(textKeys.nsarmoireProcessSelected) }}
              </span>
            </div>

            <dl class="nsarmoire-process-dialog__meta">
              <div>
                <dt>{{ t(textKeys.nsarmoireProcessPid) }}</dt>
                <dd>{{ process.pid }}</dd>
              </div>
              <div>
                <dt>{{ t(textKeys.nsarmoireProcessName) }}</dt>
                <dd>{{ process.processName }}</dd>
              </div>
              <div>
                <dt>{{ t(textKeys.nsarmoireProcessWindowTitle) }}</dt>
                <dd>{{ process.windowTitle || t(textKeys.nsarmoireProcessNoWindowTitle) }}</dd>
              </div>
              <div>
                <dt>{{ t(textKeys.nsarmoireProcessStartedAt) }}</dt>
                <dd>{{ formatStartedAt(process.startedAt) }}</dd>
              </div>
              <div>
                <dt>{{ t(textKeys.nsarmoireProcessStatus) }}</dt>
                <dd>
                  {{
                    process.isReadable
                      ? t(textKeys.nsarmoireProcessReadable)
                      : t(textKeys.nsarmoireProcessUnreadable)
                  }}
                </dd>
              </div>
            </dl>

            <div class="nsarmoire-process-dialog__actions">
              <AppButton
                :disabled="busy || !process.isReadable"
                variant="primary"
                @click="$emit('select', process.pid)"
              >
                {{ t(textKeys.nsarmoireProcessSelect) }}
              </AppButton>
            </div>
          </article>
        </div>
      </AppPixelWindow>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import AppStatus from '@/components/AppStatus.vue'
import { textKeys } from '@/config/site'
import type { ArmoireHelperProcess } from '@/pages/armoire/services/nsarmoireHelperApi'
import { useLocale } from '@/stores/locale'

defineProps<{
  processes: ArmoireHelperProcess[]
  busy: boolean
  error: string | null
}>()

defineEmits<{
  close: []
  refresh: []
  select: [pid: number]
}>()

const { t } = useLocale()

function formatStartedAt(value?: string | null): string {
  if (!value) {
    return t(textKeys.nsarmoireProcessNoStartedAt)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return t(textKeys.nsarmoireProcessNoStartedAt)
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.nsarmoire-process-dialog {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(16, 18, 30, 0.42);
}

.nsarmoire-process-dialog__window {
  width: min(720px, 100%);
  max-height: min(720px, calc(100vh - 40px));
  overflow: auto;
}

.nsarmoire-process-dialog__list {
  display: grid;
  gap: 10px;
}

.nsarmoire-process-dialog__item {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--ns-pixel-border);
  background: var(--ns-pixel-surface);
}

.nsarmoire-process-dialog__item.is-selected {
  outline: 2px solid var(--ns-color-accent);
  outline-offset: -2px;
}

.nsarmoire-process-dialog__item.is-unreadable {
  opacity: 0.72;
}

.nsarmoire-process-dialog__item-header {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.nsarmoire-process-dialog__item-header strong {
  min-width: 0;
  overflow-wrap: anywhere;
}

.nsarmoire-process-dialog__badge {
  flex: 0 0 auto;
  padding: 2px 6px;
  border: 1px solid var(--ns-pixel-border);
  background: var(--ns-status-success-bg);
  color: var(--ns-color-text);
  font-size: 12px;
  font-weight: 850;
}

.nsarmoire-process-dialog__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin: 0;
  font-size: 12px;
}

.nsarmoire-process-dialog__meta div {
  display: grid;
  gap: 2px;
}

.nsarmoire-process-dialog__meta dt,
.nsarmoire-process-dialog__meta dd {
  margin: 0;
  min-width: 0;
}

.nsarmoire-process-dialog__meta dt {
  color: var(--ns-color-text-muted);
  font-weight: 850;
}

.nsarmoire-process-dialog__meta dd {
  overflow-wrap: anywhere;
}

.nsarmoire-process-dialog__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 560px) {
  .nsarmoire-process-dialog {
    align-items: stretch;
    padding: 10px;
  }

  .nsarmoire-process-dialog__window {
    max-height: calc(100vh - 20px);
  }

  .nsarmoire-process-dialog__item-header,
  .nsarmoire-process-dialog__actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
