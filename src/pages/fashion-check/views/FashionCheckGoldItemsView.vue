<template>
  <section class="fashion-check-gold-items" :aria-label="t(keys.goldItems)">
    <article
      v-for="slot in week.slots"
      :key="slot.slotId"
      class="fashion-check-gold-items__slot ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact"
    >
      <header class="ns-workbench-panel__header">
        <h2 class="ns-workbench-panel__title">{{ slotLabel(slot.slotId) }} | {{ slot.tag }}</h2>
        <strong>{{ t(keys.gold) }} +{{ slot.gold.points }}</strong>
      </header>
      <div class="fashion-check-gold-items__list">
        <div
          v-for="item in slot.gold.items"
          :key="item.itemId"
          class="fashion-check-gold-items__item"
        >
          <FashionCheckItemLine :item="item" :display-name="itemName(item.itemId, item.name)" />
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import FashionCheckItemLine from '@/pages/fashion-check/components/FashionCheckItemLine.vue'
import { fashionCheckTextKeys as keys } from '@/locales/keys/fashionCheck'
import { resolveFashionCheckName } from '@/lib/fashion-check/localization'
import { useLocale } from '@/stores/locale'
import type { FashionCheckLocaleCatalog, FashionCheckWeek } from '@/lib/fashion-check/types'

const props = defineProps<{ week: FashionCheckWeek; localeCatalog: FashionCheckLocaleCatalog }>()
const { current, t } = useLocale()

function itemName(itemId: number, fallback: string) {
  return resolveFashionCheckName(props.localeCatalog.items[String(itemId)], current.value, fallback)
}

const slotLabelKeys = {
  weapon: keys.dyeWeapon,
  head: keys.dyeHead,
  body: keys.dyeBody,
  hands: keys.dyeHands,
  legs: keys.dyeLegs,
  feet: keys.dyeFeet
} as const

function slotLabel(slotId: string) {
  return t(slotLabelKeys[slotId as keyof typeof slotLabelKeys] ?? keys.dyeWeapon)
}
</script>

<style scoped>
.fashion-check-gold-items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.fashion-check-gold-items__slot header {
  align-items: baseline;
  flex-wrap: wrap;
}
.fashion-check-gold-items__slot h2 {
  font-size: 16px;
  overflow-wrap: anywhere;
}
.fashion-check-gold-items__slot strong {
  color: var(--ns-color-text-muted);
  font-size: 13px;
  white-space: nowrap;
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
