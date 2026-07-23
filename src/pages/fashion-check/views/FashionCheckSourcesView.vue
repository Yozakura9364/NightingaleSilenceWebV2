<template>
  <section class="fashion-check-sources" :aria-label="t(keys.sources)">
    <AppStatus v-if="loading" tone="info" :message="t(keys.loading)" />
    <AppStatus v-else-if="!sources.length" tone="warning" :message="t(keys.sourcesUnavailable)" />
    <template v-else>
      <a
        v-for="source in sources"
        :key="source.url"
        class="fashion-check-sources__item ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact"
        :href="source.url"
        target="_blank"
        rel="noreferrer"
      >
        <strong>{{ source.author }}</strong>
        <small>{{ source.url }}</small>
      </a>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppStatus from '@/components/AppStatus.vue'
import { useFetch } from '@/composables/useFetch'
import { fashionCheckTextKeys as keys } from '@/locales/keys/fashionCheck'
import { useLocale } from '@/stores/locale'

interface FashionCheckSource {
  author: string
  title: string
  url: string
}

interface FashionCheckSourcesPayload {
  sources: FashionCheckSource[]
}

const { t } = useLocale()
const { api } = useFetch()
const sources = ref<FashionCheckSource[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const payload = await api<FashionCheckSourcesPayload>('/data/fashion-check/sources.json')
    sources.value = payload.sources
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.fashion-check-sources {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}
.fashion-check-sources__item {
  color: inherit;
  text-decoration: none;
  transition:
    transform var(--ns-transition-fast),
    border-color var(--ns-transition-fast),
    background var(--ns-transition-fast),
    box-shadow var(--ns-transition-fast);
}
.fashion-check-sources__item:hover,
.fashion-check-sources__item:focus-visible {
  transform: translate(-1px, -1px);
  border-color: var(--ns-pixel-border-accent);
  background: var(--ns-pixel-hover-surface);
  box-shadow: var(--ns-pixel-button-shadow-hover);
  outline: 0;
}
.fashion-check-sources__item strong {
  font-size: 16px;
  overflow-wrap: anywhere;
}
.fashion-check-sources__item small {
  overflow-wrap: anywhere;
  color: var(--ns-color-text-muted);
}
@media (max-width: 760px) {
  .fashion-check-sources {
    grid-template-columns: 1fr;
  }
}
</style>
