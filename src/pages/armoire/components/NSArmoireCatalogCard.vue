<template>
  <article class="nsarmoire-catalog-card">
    <div class="nsarmoire-catalog-card__icon" aria-hidden="true">
      <img
        v-if="item.iconUrl && !imageFailed"
        :src="item.iconUrl"
        :alt="item.iconAlt"
        loading="lazy"
        @error="imageFailed = true"
      />
      <span v-else>{{ item.iconFallbackLabel }}</span>
    </div>

    <div class="nsarmoire-catalog-card__body">
      <h3>{{ item.name }}</h3>

      <dl class="nsarmoire-catalog-card__meta">
        <div>
          <dt>{{ item.containerLabel }}</dt>
          <dd>{{ item.quantityLabel }}</dd>
        </div>
        <div>
          <dt>{{ item.dyeLabel }}</dt>
        </div>
      </dl>

      <ul v-if="item.tags.length" class="nsarmoire-catalog-card__tags">
        <li
          v-for="tag in item.tags"
          :key="tag.key"
          :class="`nsarmoire-catalog-card__tag--${tag.tone}`"
        >
          {{ tag.label }}
        </li>
      </ul>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ArmoireCatalogCardView } from '@/pages/armoire/composables/useArmoireCatalogGrid'

const props = defineProps<{
  item: ArmoireCatalogCardView
}>()

const imageFailed = ref(false)

watch(
  () => props.item.iconUrl,
  () => {
    imageFailed.value = false
  }
)
</script>

<style scoped>
.nsarmoire-catalog-card {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  min-height: 112px;
  padding: 10px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-surface);
  contain: layout paint style;
  content-visibility: auto;
  contain-intrinsic-size: auto 112px;
}

.nsarmoire-catalog-card__icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border: 2px solid var(--ns-pixel-border-soft);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-mono);
  font-size: 11px;
  font-weight: 850;
  overflow: hidden;
}

.nsarmoire-catalog-card__icon img {
  width: 48px;
  height: 48px;
  image-rendering: auto;
  object-fit: contain;
}

.nsarmoire-catalog-card__body {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.nsarmoire-catalog-card h3,
.nsarmoire-catalog-card p {
  margin: 0;
  min-width: 0;
}

.nsarmoire-catalog-card h3 {
  font-family: var(--ns-font-decorative);
  font-size: 13px;
  font-weight: 950;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.nsarmoire-catalog-card p {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-mono);
  font-size: 11px;
}

.nsarmoire-catalog-card__meta {
  display: grid;
  gap: 4px;
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 11px;
}

.nsarmoire-catalog-card__meta div {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  min-width: 0;
}

.nsarmoire-catalog-card__meta dt,
.nsarmoire-catalog-card__meta dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

.nsarmoire-catalog-card__meta dt {
  font-weight: 850;
}

.nsarmoire-catalog-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nsarmoire-catalog-card__tags li {
  padding: 2px 5px;
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-bg-soft);
  color: var(--ns-color-text-muted);
  font-size: 11px;
  font-weight: 850;
}

.nsarmoire-catalog-card__tag--success {
  border-color: var(--ns-status-success-border);
  background: var(--ns-status-success-bg);
}

.nsarmoire-catalog-card__tag--warning {
  border-color: var(--ns-status-warning-border);
  background: var(--ns-status-warning-bg);
}

.nsarmoire-catalog-card__tag--danger {
  border-color: var(--ns-status-danger-border);
  background: var(--ns-status-danger-bg);
}
</style>
