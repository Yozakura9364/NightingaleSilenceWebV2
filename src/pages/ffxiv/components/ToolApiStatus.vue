<template>
  <section class="tool-api-status" aria-live="polite">
    <div class="tool-api-status__header">
      <div class="tool-api-status__title-block">
        <p class="tool-api-status__label">API</p>
        <p class="tool-api-status__endpoint">{{ boundary.apiBase }}</p>
      </div>
      <button
        class="ns-button tool-api-status__button"
        type="button"
        :disabled="isChecking"
        @click="checkHealth"
      >
        {{ placeholderCopy }}
      </button>
    </div>

    <dl class="tool-api-status__meta">
      <div>
        <dt>{{ placeholderCopy }}</dt>
        <dd>{{ boundary.projectName }}</dd>
      </div>
      <div>
        <dt>{{ placeholderCopy }}</dt>
        <dd>{{ boundary.devPort }}</dd>
      </div>
      <div>
        <dt>health</dt>
        <dd>{{ healthPath }}</dd>
      </div>
    </dl>

    <p class="tool-api-status__state" :data-state="status">
      <span class="tool-api-status__dot" aria-hidden="true" />
      <span>{{ statusText }}</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { placeholderCopy } from '@/config/site'
import type { ApiBoundary } from '@/services/apiBoundaries'
import { ApiError, useFetch } from '@/composables/useFetch'

type ApiStatus = 'idle' | 'checking' | 'ready' | 'error'

const props = defineProps<{
  boundary: ApiBoundary
}>()

const { createClient } = useFetch()
const status = ref<ApiStatus>('idle')
const detail = ref(placeholderCopy)
const isChecking = computed(() => status.value === 'checking')
const healthPath = computed(() => `${props.boundary.apiBase}${props.boundary.healthPath}`)
const statusText = computed(() => {
  if (status.value === 'ready') {
    return 'HTTP 200'
  }

  if (status.value === 'error') {
    return detail.value
  }

  return placeholderCopy
})

async function checkHealth() {
  status.value = 'checking'
  detail.value = placeholderCopy

  try {
    const client = createClient(props.boundary.apiBase)
    await client.api<unknown>(props.boundary.healthPath, { cache: 'no-store' })
    status.value = 'ready'
    detail.value = 'HTTP 200'
  } catch (error) {
    status.value = 'error'
    detail.value = error instanceof ApiError ? `HTTP ${error.status}` : placeholderCopy
  }
}

onMounted(() => {
  void checkHealth()
})
</script>

<style scoped>
.tool-api-status {
  display: grid;
  gap: 16px;
}

.tool-api-status__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.tool-api-status__title-block {
  min-width: 0;
}

.tool-api-status__label {
  margin: 0 0 4px;
  color: var(--ns-color-text);
  font-size: 13px;
  font-weight: 900;
}

.tool-api-status__endpoint {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-mono);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.tool-api-status__button {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 12px;
  font-size: 12px;
}

.tool-api-status__button:disabled {
  cursor: wait;
  opacity: 0.7;
  transform: none;
}

.tool-api-status__meta {
  display: grid;
  gap: 12px;
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 14px;
}

.tool-api-status__meta div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.tool-api-status__meta dt,
.tool-api-status__meta dd {
  margin: 0;
}

.tool-api-status__meta dt {
  color: var(--ns-color-text);
  font-weight: 900;
}

.tool-api-status__meta dd {
  overflow-wrap: anywhere;
}

.tool-api-status__state {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 13px;
  font-weight: 850;
}

.tool-api-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--ns-color-border-strong);
}

.tool-api-status__state[data-state="checking"] .tool-api-status__dot {
  background: var(--ns-color-accent);
}

.tool-api-status__state[data-state="ready"] .tool-api-status__dot {
  background: var(--ns-color-cyan);
}

.tool-api-status__state[data-state="error"] .tool-api-status__dot {
  background: #c7793d;
}

@media (max-width: 520px) {
  .tool-api-status__header {
    display: grid;
  }

  .tool-api-status__button {
    justify-self: start;
  }
}
</style>
