<script setup lang="ts">
// ContentDetailPage.vue — public blog detail (T043). :id must be a positive
// integer; unpublished/withdrawn/archived/unknown ids resolve to a generic
// not-found state and never leak content.
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLocale } from '@/stores/locale'
import { publicBlogKeys } from '@/locales/keys/publicBlog'
import ContentRichText from './components/ContentRichText.vue'
import {
  createPublicContentClient,
  describePublicContentError,
  isPositiveIntId,
  toRenderViewModel,
  type PublicContentError,
  type PublicEntry,
} from './services/publicContent'
import type { SafeDocumentViewModel } from '@/lib/content/render/contentViewModel'
import './content.css'

const route = useRoute()
const { t } = useLocale()
const { fetchPublicEntry } = createPublicContentClient()
const loading = ref(true)
const entry = ref<PublicEntry | null>(null)
const viewModel = ref<SafeDocumentViewModel | null>(null)
const error = ref<PublicContentError | null>(null)
const notFound = ref(false)

async function load(): Promise<void> {
  const rawId = typeof route.params.id === 'string' ? route.params.id : ''
  loading.value = true
  error.value = null
  notFound.value = false
  entry.value = null
  viewModel.value = null
  if (!isPositiveIntId(rawId)) {
    notFound.value = true
    loading.value = false
    return
  }
  const publicId = Number(rawId)
  try {
    const data = await fetchPublicEntry(publicId)
    entry.value = data
    viewModel.value = toRenderViewModel(data)
  } catch (e) {
    const classified = describePublicContentError(e)
    if (classified.kind === 'not-found') {
      notFound.value = true
    } else {
      error.value = classified
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(d)
}
</script>

<template>
  <main class="ns-page blog-detail-page">
    <p v-if="loading" class="blog-status">{{ t(publicBlogKeys.loading) }}</p>
    <section v-else-if="notFound" class="blog-not-found">
      <h1 class="blog-not-found-title">{{ t(publicBlogKeys.notFoundTitle) }}</h1>
      <p class="blog-not-found-text">{{ t(publicBlogKeys.notFoundText) }}</p>
      <RouterLink class="blog-back-link" to="/blog">{{ t(publicBlogKeys.backToIndex) }}</RouterLink>
    </section>
    <p v-else-if="error" class="blog-status blog-status-error">
      {{ t(publicBlogKeys.loadFailed) }}
    </p>
    <article v-else-if="entry && viewModel" class="blog-article">
      <header class="blog-article-header">
        <h1 class="blog-article-title">{{ entry.title }}</h1>
        <div class="blog-entry-meta">
          <time class="blog-entry-date" :datetime="entry.publishedAt">{{ formatDate(entry.publishedAt) }}</time>
          <span v-for="tag in entry.tags" :key="tag" class="blog-entry-tag">{{ tag }}</span>
        </div>
      </header>
      <ContentRichText :document="viewModel" />
    </article>
  </main>
</template>
