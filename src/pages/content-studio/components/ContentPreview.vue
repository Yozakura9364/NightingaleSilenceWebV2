<template>
  <div class="content-preview-backdrop" @click.self="$emit('close')">
    <section
      class="content-preview"
      role="dialog"
      aria-modal="true"
      :aria-label="t(keys.previewDialogTitle)"
    >
      <header class="content-preview__bar">
        <span class="content-preview__title">{{ t(keys.previewDialogTitle) }}</span>
        <button
          class="content-preview__close"
          type="button"
          :aria-label="t(keys.close)"
          @click="$emit('close')"
        >
          ×
        </button>
      </header>
      <div class="content-preview__body">
        <p v-if="!viewModel" class="content-preview__invalid">{{ t(keys.previewInvalid) }}</p>
        <article v-else class="blog-article">
          <header class="blog-article-header">
            <h1 class="blog-article-title">{{ title || t(keys.untitled) }}</h1>
            <div class="blog-entry-meta">
              <time>{{ todayLabel }}</time>
              <span v-for="tag in tags" :key="tag" class="blog-entry-tag">{{ tag }}</span>
            </div>
            <p v-if="summary" class="content-preview__summary">{{ summary }}</p>
          </header>
          <ContentRichText :document="viewModel" />
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// ContentPreview.vue — T046 [US2] 发布前预览。
// 复用公开阅读组件 ContentRichText 与 content.css（与 /blog/:id 同一语义），
// 媒体 URL 通过编辑器预览缓存（blob URL）解析。
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'
import ContentRichText from '@/pages/content/components/ContentRichText.vue'
import type { SafeDocumentViewModel } from '@/lib/content/render/contentViewModel'
import '@/pages/content/content.css'

const { t } = useLocale()
const keys = {
  previewDialogTitle: contentStudioKeys.previewDialogTitle,
  previewInvalid: contentStudioKeys.publicationPreviewInvalid,
  close: contentStudioKeys.cancel,
  untitled: contentStudioKeys.untitled
}

defineProps<{
  viewModel: SafeDocumentViewModel | null
  title: string
  summary: string | null
  tags: string[]
}>()

defineEmits<{
  (e: 'close'): void
}>()

const todayLabel = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}).format(new Date())
</script>

<style scoped>
.content-preview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--ns-color-bg) 62%, transparent);
  backdrop-filter: blur(4px);
}
.content-preview {
  display: flex;
  flex-direction: column;
  width: min(900px, 94vw);
  max-height: 88vh;
  overflow: hidden;
  border: var(--ns-line-width) solid var(--ns-color-border);
  border-radius: var(--ns-radius-md);
  background: var(--ns-color-surface-solid);
  box-shadow: var(--ns-shadow-panel);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
}
.content-preview__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 0 14px;
  border-bottom: var(--ns-line-width) solid var(--ns-color-border);
  background: var(--ns-color-surface);
}
.content-preview__title {
  font-size: 13px;
  font-weight: 950;
}
.content-preview__close {
  border: none;
  background: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: var(--ns-color-text-muted);
}
.content-preview__close:hover {
  color: var(--ns-color-text);
}
.content-preview__body {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
}
.content-preview__invalid {
  margin: 0;
  padding: 24px;
  color: var(--ns-status-danger-text);
  font-size: 13px;
  text-align: center;
}
.content-preview__summary {
  margin: 8px 0 0;
  color: var(--ns-color-text-muted);
  font-size: 14px;
}
</style>
