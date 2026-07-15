<template>
  <section class="fashion-check-sources" :aria-label="t(keys.sources)">
    <AppStatus v-if="loading" tone="info" :message="t(keys.loading)" />
    <AppStatus v-else-if="!sources.length" tone="warning" :message="t(keys.sourcesUnavailable)" />
    <template v-else>
      <a
        v-for="source in sources"
        :key="source.url"
        class="fashion-check-sources__item"
        :href="source.url"
        target="_blank"
        rel="noreferrer"
      >
        <strong>{{ source.author }}</strong>
        <span>{{ source.title }}</span>
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
}
.fashion-check-sources__item {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 14px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
  color: inherit;
  text-decoration: none;
}
.fashion-check-sources__item:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--ns-pixel-border);
}
.fashion-check-sources__item strong {
  font-size: 16px;
}
.fashion-check-sources__item span,
.fashion-check-sources__item small {
  overflow-wrap: anywhere;
}
.fashion-check-sources__item small {
  color: var(--ns-color-text-muted);
}
@media (max-width: 760px) {
  .fashion-check-sources {
    grid-template-columns: 1fr;
  }
}
</style>
