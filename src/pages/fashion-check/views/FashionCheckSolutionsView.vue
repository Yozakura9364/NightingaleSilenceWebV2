<template>
  <section v-if="showcase" class="fashion-check-showcase" :aria-label="t(keys.solutions)">
    <div class="fashion-check-showcase__overview">
      <article
        v-for="solution in showcase.solutions"
        :key="solution.id"
        class="fashion-check-showcase__solution ns-workbench-panel ns-workbench-panel--solid"
      >
        <h2 class="ns-workbench-panel__title">
          {{ solution.id === '80' ? t(keys.solution80Title) : t(keys.solution100Title) }}
        </h2>
        <div class="fashion-check-showcase__entries">
          <div
            v-for="entry in solution.entries"
            :key="`${solution.id}:${entry.slotId}`"
            class="fashion-check-showcase__entry"
          >
            <FashionCheckItemLine
              v-if="entry.item || entry.iconId"
              :item="entry.item"
              :display-name="entry.item ? itemName(entry.item.itemId, entry.item.name) : undefined"
              :icon-id="entry.iconId"
              :slot-label="slotLabel(entry.slotId)"
              :label="entryLabel(entry)"
              :secondary-text="entry.dye ? dyeName(entry.dye.dyeId, entry.dye.name) : undefined"
            />
            <p v-else>
              <b>{{ slotLabel(entry.slotId) }}</b
              ><span>{{ entryLabel(entry) }}</span>
            </p>
            <small v-if="entry.dye && !entry.item && !entry.iconId">
              {{ dyeName(entry.dye.dyeId, entry.dye.name) }}
            </small>
          </div>
        </div>
      </article>
      <section
        class="fashion-check-showcase__dyes ns-workbench-panel ns-workbench-panel--solid"
        :aria-label="t(keys.dyeGuide)"
      >
        <h2 class="ns-workbench-panel__title">{{ t(keys.dyeGuide) }}</h2>
        <article v-for="dye in showcase.dyes" :key="dye.slotId">
          <b class="fashion-check-showcase__dye-slot">{{ slotLabel(dye.slotId) }}</b>
          <div class="fashion-check-showcase__dye-row">
            <span
              class="fashion-check-showcase__swatch"
              :style="{ backgroundColor: dye.family.color }"
              aria-hidden="true"
            />
            <span>{{ familyName(dye.family.id, dye.family.name) }} +{{ dye.family.points }}</span>
          </div>
          <div class="fashion-check-showcase__dye-row">
            <span
              class="fashion-check-showcase__swatch"
              :style="{ backgroundColor: dye.exact.color }"
              aria-hidden="true"
            />
            <strong>{{ dyeName(dye.exact.dyeId, dye.exact.name) }} +{{ dye.exact.points }}</strong>
            <small>{{ declarationName(dye.exact.declarationKey, dye.exact.declaration) }}</small>
          </div>
        </article>
      </section>
    </div>
    <section
      class="fashion-check-showcase__faq ns-workbench-panel ns-workbench-panel--soft ns-workbench-panel--compact"
      :aria-label="t(keys.faq)"
    >
      <h2 class="ns-workbench-panel__title">{{ t(keys.faq) }}</h2>
      <p>{{ t(keys.faqPlaceholder) }}</p>
    </section>
  </section>

  <section
    v-else-if="week.solutions.length > 0"
    class="fashion-check-solutions"
    :aria-label="t(keys.solutions)"
  >
    <article
      v-for="solution in week.solutions"
      :key="solution.id"
      class="fashion-check-solution ns-workbench-panel ns-workbench-panel--soft"
    >
      <div class="fashion-check-solution__body">
        <p>{{ solution.id === '80' ? t(keys.target80) : t(keys.target100) }}</p>
        <h2 class="ns-workbench-panel__title">
          {{ solution.id === '80' ? t(keys.goldWithDye) : t(keys.allGold) }}
        </h2>
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

  <section v-else class="fashion-check-solutions" :aria-label="t(keys.solutions)">
    <p
      class="fashion-check-solutions__pending ns-workbench-panel ns-workbench-panel--solid ns-workbench-panel--compact"
    >
      {{ t(keys.awaitingData) }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FashionCheckItemLine from '@/pages/fashion-check/components/FashionCheckItemLine.vue'
import { resolveFashionCheckName } from '@/lib/fashion-check/localization'
import type {
  FashionCheckItem,
  FashionCheckLocaleCatalog,
  FashionCheckReferenceEntry,
  FashionCheckReferenceShowcase,
  FashionCheckWeek
} from '@/lib/fashion-check/types'
import { fashionCheckTextKeys as keys } from '@/locales/keys/fashionCheck'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  week: FashionCheckWeek
  showcase?: FashionCheckReferenceShowcase
  localeCatalog: FashionCheckLocaleCatalog
}>()
const { current, t } = useLocale()
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
function itemName(itemId: number, fallback: string) {
  return resolveFashionCheckName(props.localeCatalog.items[String(itemId)], current.value, fallback)
}
function dyeName(dyeId: number | undefined, fallback: string) {
  return resolveFashionCheckName(
    dyeId === undefined ? undefined : props.localeCatalog.dyes[String(dyeId)],
    current.value,
    fallback
  )
}
function entryLabel(entry: FashionCheckReferenceEntry) {
  return entry.labelKey ? t(entry.labelKey) : entry.label
}
function familyName(familyId: 'black' | 'red' | undefined, fallback: string) {
  if (familyId === 'black') return t(keys.dyeFamilyBlack)
  if (familyId === 'red') return t(keys.dyeFamilyRed)
  return fallback
}
function declarationName(declarationKey: string | undefined, fallback: string) {
  return declarationKey ? t(declarationKey) : fallback
}
</script>

<style scoped>
.fashion-check-showcase {
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
  align-content: start;
  gap: 12px;
}
.fashion-check-showcase__solution p {
  margin: 0;
}
.fashion-check-showcase__solution h2,
.fashion-check-showcase__dyes h2 {
  font-size: 16px;
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
  min-width: 0;
  flex-wrap: wrap;
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
.fashion-check-showcase__faq p {
  margin: 0;
}
.fashion-check-showcase__faq h2 {
  font-size: 16px;
}
.fashion-check-showcase__faq p {
  font-size: 14px;
  overflow-wrap: anywhere;
}
.fashion-check-solutions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.fashion-check-solutions__pending {
  margin: 0;
}
.fashion-check-solution {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}
.fashion-check-solution__body {
  display: grid;
  gap: 7px;
  min-width: 0;
}
.fashion-check-solution p {
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
  overflow-wrap: anywhere;
}
.fashion-check-solution__items {
  display: grid;
  gap: 5px;
}
.fashion-check-solution__items p {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
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
