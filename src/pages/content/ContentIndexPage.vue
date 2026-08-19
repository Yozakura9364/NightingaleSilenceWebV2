<script setup lang="ts">
// ContentIndexPage.vue — public blog index (T043). Reads only the static
// /data/content/index.json; never talks to /api/content-studio.
import { onMounted, ref } from 'vue'
import { useLocale } from '@/stores/locale'
import { publicBlogKeys } from '@/locales/keys/publicBlog'
import {
  createPublicContentClient,
  describePublicContentError,
  type PublicContentError,
  type PublicIndex
} from '@/services/content/publicContent'
import './content.css'

const { t } = useLocale()
const { fetchPublicIndex } = createPublicContentClient()
const loading = ref(true)
const index = ref<PublicIndex | null>(null)
const error = ref<PublicContentError | null>(null)

onMounted(async () => {
  try {
    index.value = await fetchPublicIndex()
  } catch (e) {
    error.value = describePublicContentError(e)
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
}
</script>

<template>
  <main class="ns-page blog-index-page">
    <div
      class="ns-page-shell blog-index-page__shell ns-animate ns-animate--fade-in-up ns-animate-visible"
    >
      <header class="blog-index-header">
        <h1 class="blog-index-title">{{ t(publicBlogKeys.pageTitle) }}</h1>
        <p class="blog-index-subtitle">{{ t(publicBlogKeys.indexSubtitle) }}</p>
      </header>

      <p v-if="loading" class="blog-status">{{ t(publicBlogKeys.loading) }}</p>
      <p v-else-if="error?.kind === 'network'" class="blog-status blog-status-error">
        {{ t(publicBlogKeys.loadFailed) }}
      </p>
      <p v-else-if="index && index.entries.length === 0" class="blog-status">
        {{ t(publicBlogKeys.empty) }}
      </p>
      <ul v-else-if="index" class="blog-entry-list">
        <li v-for="entry in index.entries" :key="entry.publicId" class="blog-entry-card">
          <RouterLink class="blog-entry-link" :to="`/blog/${entry.publicId}`">
            <h2 class="blog-entry-title">{{ entry.title }}</h2>
            <p v-if="entry.summary" class="blog-entry-summary">{{ entry.summary }}</p>
            <div class="blog-entry-meta">
              <time class="blog-entry-date" :datetime="entry.publishedAt">{{
                formatDate(entry.publishedAt)
              }}</time>
              <span v-for="tag in entry.tags" :key="tag" class="blog-entry-tag">{{ tag }}</span>
            </div>
          </RouterLink>
        </li>
      </ul>
    </div>
  </main>
</template>
