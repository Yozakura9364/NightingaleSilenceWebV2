<template>
  <section v-if="showcase" class="fashion-check-showcase" :aria-label="t(keys.solutions)">
    <div class="fashion-check-showcase__overview">
      <article
        v-for="solution in showcase.solutions"
        :key="solution.id"
        class="fashion-check-showcase__solution"
      >
        <h2>{{ solution.id === '80' ? t(keys.solution80Title) : t(keys.solution100Title) }}</h2>
        <div class="fashion-check-showcase__entries">
          <div
            v-for="entry in solution.entries"
            :key="`${solution.id}:${entry.slotId}`"
            class="fashion-check-showcase__entry"
          >
            <FashionCheckItemLine
              v-if="entry.item || entry.iconId"
              :item="entry.item"
              :icon-id="entry.iconId"
              :slot-label="slotLabel(entry.slotId)"
              :label="entry.label"
              :secondary-text="entry.dye?.name"
            />
            <p v-else>
              <b>{{ slotLabel(entry.slotId) }}</b
              ><span>{{ entry.label }}</span>
            </p>
            <small v-if="entry.dye && !entry.item && !entry.iconId">
              {{ entry.dye.name }}
            </small>
          </div>
        </div>
      </article>
      <section class="fashion-check-showcase__dyes" :aria-label="t(keys.dyeGuide)">
        <h2>{{ t(keys.dyeGuide) }}</h2>
        <article v-for="dye in showcase.dyes" :key="dye.slotId">
          <b class="fashion-check-showcase__dye-slot">{{ slotLabel(dye.slotId) }}</b>
          <div class="fashion-check-showcase__dye-row">
            <span
              class="fashion-check-showcase__swatch"
              :style="{ backgroundColor: dye.family.color }"
              aria-hidden="true"
            />
            <span>{{ dye.family.name }} +{{ dye.family.points }}</span>
          </div>
          <div class="fashion-check-showcase__dye-row">
            <span
              class="fashion-check-showcase__swatch"
              :style="{ backgroundColor: dye.exact.color }"
              aria-hidden="true"
            />
            <strong>{{ dye.exact.name }} +{{ dye.exact.points }}</strong>
            <small>{{ dye.exact.declaration }}</small>
          </div>
        </article>
      </section>
    </div>
    <section class="fashion-check-showcase__faq" :aria-label="t(keys.faq)">
      <h2>{{ t(keys.faq) }}</h2>
      <p>{{ t(keys.faqPlaceholder) }}</p>
    </section>
  </section>

  <section v-else class="fashion-check-solutions" :aria-label="t(keys.solutions)">
    <article v-for="solution in week.solutions" :key="solution.id" class="fashion-check-solution">
      <div class="fashion-check-solution__body">
        <p>{{ solution.id === '80' ? t(keys.target80) : t(keys.target100) }}</p>
        <h2>{{ solution.id === '80' ? t(keys.goldWithDye) : t(keys.allGold) }}</h2>
        <div class="fashion-check-solution__items">
          <FashionCheckItemLine
            v-for="entry in solution.items"
            :key="`${solution.id}:${entry.slotId}`"
            :item="findItem(entry.itemId)"
            :points="entry.points"
          />
          <p v-for="dye in solution.dyes ?? []" :key="`${solution.id}:${dye.slotId}`">
            <b>{{ slotLabel(dye.slotId) }}</b
            ><span>{{ t(keys.exactDye) }} +{{ dye.points }}</span>
          </p>
        </div>
      </div>
      <strong>{{ solution.score }}</strong>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FashionCheckItemLine from '@/pages/fashion-check/components/FashionCheckItemLine.vue'
import type {
  FashionCheckItem,
  FashionCheckReferenceShowcase,
  FashionCheckWeek
} from '@/lib/fashion-check/types'
import { fashionCheckTextKeys as keys } from '@/locales/keys/fashionCheck'
import { useLocale } from '@/stores/locale'

const props = defineProps<{ week: FashionCheckWeek; showcase?: FashionCheckReferenceShowcase }>()
const { t } = useLocale()
const itemById = computed(
  () =>
    new Map(props.week.slots.flatMap((slot) => slot.gold.items).map((item) => [item.itemId, item]))
)
const dyeLabelKeys = {
  weapon: keys.dyeWeapon,
  head: keys.dyeHead,
  body: keys.dyeBody,
  hands: keys.dyeHands,
  legs: keys.dyeLegs,
  feet: keys.dyeFeet
} as const
function findItem(itemId: number): FashionCheckItem {
  return itemById.value.get(itemId) ?? { itemId, name: String(itemId), iconId: 0, rarity: 1 }
}
function slotLabel(slotId: string) {
  return t(dyeLabelKeys[slotId as keyof typeof dyeLabelKeys] ?? keys.dyeWeapon)
}
</script>

<style scoped>
.fashion-check-showcase,
.fashion-check-showcase__dyes {
  display: grid;
}
.fashion-check-showcase {
  gap: 16px;
}
.fashion-check-showcase__overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.fashion-check-showcase__solution {
  display: grid;
  align-content: start;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
}
.fashion-check-showcase__solution h2,
.fashion-check-showcase__solution p {
  margin: 0;
}
.fashion-check-showcase__solution h2,
.fashion-check-showcase__dyes h2 {
  font-size: 16px;
  font-weight: 800;
}
.fashion-check-showcase__entries {
  display: grid;
  gap: 12px;
}
.fashion-check-showcase__entry {
  display: grid;
  gap: 2px;
  padding: 8px;
  border: 1px solid var(--ns-pixel-border);
}
.fashion-check-showcase__entry > p {
  display: flex;
  gap: 6px;
}
.fashion-check-showcase__entry > p b {
  color: var(--ns-color-text);
}
.fashion-check-showcase__entry small {
  padding-left: 42px;
  color: var(--ns-color-text-muted);
}
.fashion-check-showcase__dyes {
  grid-template-columns: 1fr;
  gap: 8px;
  min-width: 0;
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-color-surface-solid);
}
.fashion-check-showcase__dyes h2 {
  margin: 0;
}
.fashion-check-showcase__dyes article {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--ns-pixel-border);
}
.fashion-check-showcase__dye-slot {
  font-size: 12px;
}
.fashion-check-showcase__dye-row {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding-left: 3px;
}
.fashion-check-showcase__swatch {
  width: 10px;
  height: 10px;
  justify-self: center;
  border: 1px solid var(--ns-pixel-border);
}
.fashion-check-showcase__dyes small {
  color: var(--ns-color-text-muted);
  font-size: 11px;
}
.fashion-check-showcase__faq h2,
.fashion-check-showcase__faq p {
  margin: 0;
}
.fashion-check-showcase__faq h2 {
  font-size: 16px;
}
.fashion-check-showcase__faq p {
  font-size: 14px;
}
.fashion-check-solutions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.fashion-check-solution {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  padding: 16px;
  border: 2px solid var(--ns-pixel-border);
  background: var(--ns-pixel-cyan-surface);
}
.fashion-check-solution__body {
  display: grid;
  gap: 7px;
  min-width: 0;
}
.fashion-check-solution p,
.fashion-check-solution h2 {
  margin: 0;
}
.fashion-check-solution > strong {
  align-self: center;
  font-size: 40px;
  line-height: 1;
}
.fashion-check-solution p {
  font-size: 12px;
  color: var(--ns-color-text-muted);
}
.fashion-check-solution h2 {
  font-size: 18px;
}
.fashion-check-solution__items {
  display: grid;
  gap: 5px;
}
.fashion-check-solution__items p {
  display: flex;
  gap: 6px;
}
.fashion-check-solution__items p b {
  color: var(--ns-color-text);
}
@media (max-width: 760px) {
  .fashion-check-showcase__overview,
  .fashion-check-solutions {
    grid-template-columns: 1fr;
  }
}
</style>
