<template>
  <section class="fashion-check-gold-items" :aria-label="t(keys.goldItems)">
    <article v-for="slot in week.slots" :key="slot.slotId" class="fashion-check-gold-items__slot">
      <header>
        <h2>{{ slot.label }} | {{ slot.tag }}</h2>
        <strong>{{ t(keys.gold) }} +{{ slot.gold.points }}</strong>
      </header>
      <div class="fashion-check-gold-items__list">
        <div
          v-for="item in slot.gold.items"
          :key="item.itemId"
          class="fashion-check-gold-items__item"
        >
          <FashionCheckItemLine :item="item" />
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import FashionCheckItemLine from '@/pages/fashion-check/components/FashionCheckItemLine.vue'
import { fashionCheckTextKeys as keys } from '@/locales/keys/fashionCheck'
import { useLocale } from '@/stores/locale'
import type { FashionCheckWeek } from '@/lib/fashion-check/types'

defineProps<{ week: FashionCheckWeek }>()
const { t } = useLocale()
</script>

<style scoped>
.fashion-check-gold-items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.fashion-check-gold-items__slot {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
}
.fashion-check-gold-items__slot header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}
.fashion-check-gold-items__slot h2 {
  margin: 0;
  font-size: 16px;
}
.fashion-check-gold-items__slot strong {
  color: var(--ns-color-text-muted);
  font-size: 13px;
}
.fashion-check-gold-items__list {
  display: grid;
  gap: 8px;
}
.fashion-check-gold-items__item {
  padding: 8px;
  border: 1px solid var(--ns-pixel-border);
}
@media (max-width: 760px) {
  .fashion-check-gold-items {
    grid-template-columns: 1fr;
  }
}
</style>
