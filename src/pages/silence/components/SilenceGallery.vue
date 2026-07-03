<template>
  <div class="silence-character-gallery">
    <article
      v-for="item in items"
      :key="item.id"
      class="silence-character-gallery__item"
    >
      <div class="silence-character-gallery__image">
        <span>{{ t(item.titleKey) }}</span>
      </div>
      <p>{{ t(item.captionKey) }}</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { SilenceCharacterGalleryItem } from '@/data/silence/characters'
import { useLocale } from '@/stores/locale'

defineProps<{
  items: SilenceCharacterGalleryItem[]
}>()

const { t } = useLocale()
</script>

<style scoped>
.silence-character-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.silence-character-gallery__item {
  display: grid;
  min-width: 0;
  gap: 10px;
  padding: 10px;
  border: 2px solid rgba(42, 33, 56, 0.36);
  background: rgba(255, 252, 255, 0.72);
  box-shadow: 6px 6px 0 rgba(42, 33, 56, 0.07);
}

.silence-character-gallery__image {
  display: grid;
  min-height: 210px;
  place-items: center;
  border: 2px solid rgba(42, 33, 56, 0.28);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.64), transparent),
    color-mix(in srgb, var(--silence-character-color), transparent 78%);
}

.silence-character-gallery__image span {
  padding: 6px 8px;
  border: 2px solid rgba(42, 33, 56, 0.36);
  background: rgba(255, 252, 255, 0.72);
  color: #2c2338;
  font-family: var(--ns-font-decorative);
  font-size: 12px;
  font-weight: 900;
}

.silence-character-gallery__item p {
  margin: 0;
  color: rgba(49, 40, 63, 0.68);
}

@media (max-width: 1040px) {
  .silence-character-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .silence-character-gallery {
    grid-template-columns: 1fr;
  }
}
</style>
