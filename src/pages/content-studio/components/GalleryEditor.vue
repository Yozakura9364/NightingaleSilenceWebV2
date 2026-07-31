<template>
  <div class="gallery-editor">
    <div class="gallery-toolbar">
      <button @click="$emit('update:layout', 'two-column')" :class="{ active: layout === 'two-column' }" :aria-label="t(keys.twoCol)" :title="t(keys.twoCol)">☷☷</button>
      <button @click="$emit('update:layout', 'three-column')" :class="{ active: layout === 'three-column' }" :aria-label="t(keys.threeCol)" :title="t(keys.threeCol)">☷☷☷</button>
      <button @click="$emit('update:layout', 'grid')" :class="{ active: layout === 'grid' }" :aria-label="t(keys.grid)" :title="t(keys.grid)">⊞</button>
      <span class="sep" />
      <button @click="$emit('addImages')" :aria-label="t(keys.addImages)" :title="t(keys.addImages)">+</button>
    </div>
    <div v-if="items.length === 0" class="empty">{{ t(keys.empty) }}</div>
    <div v-for="(item, i) in items" :key="item.mediaId || i" class="gallery-item">
      <span class="item-alt">{{ item.alt || item.mediaId?.slice(0, 8) || `#${i + 1}` }}</span>
      <div class="item-actions">
        <button v-if="i > 0" @click="$emit('moveUp', i)" :aria-label="t(keys.moveUp)" :title="t(keys.moveUp)">▲</button>
        <button v-if="i < items.length - 1" @click="$emit('moveDown', i)" :aria-label="t(keys.moveDown)" :title="t(keys.moveDown)">▼</button>
        <button @click="$emit('removeImage', i)" :aria-label="t(keys.remove)" :title="t(keys.remove)">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'

const { t } = useLocale()
const keys = {
  addImages: contentStudioKeys.addToGallery,
  empty: contentStudioKeys.galleryEmpty,
  remove: contentStudioKeys.galleryRemove,
  moveUp: contentStudioKeys.galleryMoveUp,
  moveDown: contentStudioKeys.galleryMoveDown,
  twoCol: contentStudioKeys.galleryTwoCol,
  threeCol: contentStudioKeys.galleryThreeCol,
  grid: contentStudioKeys.galleryGrid,
}

defineProps<{
  items: Array<{ mediaId: string; alt: string }>
  layout?: string
}>()

defineEmits<{
  (e: 'removeImage', index: number): void
  (e: 'moveUp', index: number): void
  (e: 'moveDown', index: number): void
  (e: 'addImages'): void
  (e: 'update:layout', layout: string): void
}>()
</script>

<style scoped>
.gallery-editor { padding: 8px; }
.gallery-toolbar { display: flex; gap: 2px; margin-bottom: 8px; }
.gallery-toolbar button { padding: 4px 8px; border: 1px solid #ccc; border-radius: 3px; background: #fff; cursor: pointer; }
.gallery-toolbar button.active { background: #e0e0e0; }
.sep { width: 1px; background: #ccc; margin: 0 4px; }
.empty { color: #999; font-size: 13px; }
.gallery-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
.item-actions { display: flex; gap: 2px; }
.item-alt { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
button { padding: 2px 8px; }
</style>
