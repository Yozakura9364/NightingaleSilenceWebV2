<template>
  <section class="island-view">
    <div class="island-guide__list">
      <article
        v-for="guide in guides"
        :key="guide.id"
        class="ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact island-guide__card"
      >
        <div class="island-guide__head">
          <h2>{{ guide.title[locale] }}</h2>
          <span class="island-guide__badge">{{ t(islandTextKeys.guideDraftBadge) }}</span>
        </div>
        <p class="island-guide__goal">{{ guide.goal[locale] }}</p>
        <ol class="island-guide__steps">
          <li v-for="(step, index) in guide.steps" :key="index">{{ step[locale] }}</li>
        </ol>
        <div class="island-guide__links">
          <RouterLink
            v-for="link in guide.links"
            :key="link.route"
            :to="link.route"
            class="island-guide__link"
          >
            {{ link.label[locale] }} →
          </RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ISLAND_GUIDES } from '@/lib/island/guide'
import { islandTextKeys } from '@/locales/keys/island'
import { useLocale } from '@/stores/locale'

const { t, current } = useLocale()
const guides = ISLAND_GUIDES
const locale = computed(() => (current.value === 'zh-CN' ? 'zh' : 'en'))
</script>

<style scoped>
.island-guide__list {
  display: grid;
  gap: 16px;
}
.island-guide__card {
  display: grid;
  gap: 10px;
}
.island-guide__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.island-guide__head h2 {
  margin: 0;
  font-size: 17px;
}
.island-guide__badge {
  padding: 2px 8px;
  border: 1px dashed var(--ns-color-accent-strong);
  border-radius: 6px;
  color: var(--ns-color-accent-strong);
  font-size: 12px;
  white-space: nowrap;
}
.island-guide__goal {
  margin: 0;
  color: var(--ns-color-text-muted);
  font-size: 14px;
}
.island-guide__steps {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 6px;
  font-size: 14px;
  line-height: 1.65;
}
.island-guide__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.island-guide__link {
  color: var(--ns-color-accent-strong);
  font-size: 13px;
  text-decoration: underline;
}
</style>
