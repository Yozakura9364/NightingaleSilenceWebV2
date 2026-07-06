import { textKeys } from '@/config/site'
import type { ArmoireStoreDetailTag, ArmoireStoreTag } from '@/lib/armoire/types'

export const ARMOIRE_STORE_TAG_LABEL_KEYS: Record<ArmoireStoreTag, string> = {
  npcCostume: textKeys.nsarmoireStoreTagNpcCostume,
  bonusCostume: textKeys.nsarmoireStoreTagBonusCostume,
  collectorEditionBonus: textKeys.nsarmoireStoreTagCollectorEditionBonus,
  replicaCostume: textKeys.nsarmoireStoreTagReplicaCostume,
  fanFestivalCostume: textKeys.nsarmoireStoreTagFanFestivalCostume,
  crossoverCostume: textKeys.nsarmoireStoreTagCrossoverCostume,
  moonfireFaire: textKeys.nsarmoireStoreTagMoonfireFaire,
  hatchingTide: textKeys.nsarmoireStoreTagHatchingTide,
  theRising: textKeys.nsarmoireStoreTagTheRising,
  starlightCelebration: textKeys.nsarmoireStoreTagStarlightCelebration,
  valentioneDay: textKeys.nsarmoireStoreTagValentioneDay,
  littleLadiesDay: textKeys.nsarmoireStoreTagLittleLadiesDay,
  allSaintsWake: textKeys.nsarmoireStoreTagAllSaintsWake,
  heavensturn: textKeys.nsarmoireStoreTagHeavensturn,
  goldSaucerFestival: textKeys.nsarmoireStoreTagGoldSaucerFestival
}

export const ARMOIRE_STORE_DETAIL_TAG_LABEL_KEYS: Record<ArmoireStoreDetailTag, string> = {
  maleOnly: textKeys.nsarmoireStoreDetailTagMaleOnly,
  femaleOnly: textKeys.nsarmoireStoreDetailTagFemaleOnly
}

export function getArmoireStoreTagLabels(
  t: (key: string) => string,
  tags: readonly ArmoireStoreTag[] | undefined,
  detailTags: readonly ArmoireStoreDetailTag[] | undefined
): string[] {
  return [
    ...(tags ?? []).map((tag) => t(ARMOIRE_STORE_TAG_LABEL_KEYS[tag])),
    ...(detailTags ?? []).map((tag) => t(ARMOIRE_STORE_DETAIL_TAG_LABEL_KEYS[tag]))
  ]
}
