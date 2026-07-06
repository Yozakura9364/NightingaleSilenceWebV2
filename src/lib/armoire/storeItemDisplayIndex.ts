import { getArmoireIconUrl } from '@/lib/armoire/catalog'
import {
  ARMOIRE_STORE_ITEM_DISPLAY_INDEX_SCHEMA_VERSION,
  type ArmoireStoreItemDisplay,
  type ArmoireStoreItemDisplayIndex
} from '@/lib/armoire/types'

export const EMPTY_ARMOIRE_STORE_ITEM_DISPLAY_INDEX: ArmoireStoreItemDisplayIndex = {
  schemaVersion: ARMOIRE_STORE_ITEM_DISPLAY_INDEX_SCHEMA_VERSION,
  generatedAt: '',
  items: {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStoreItemDisplay(value: unknown): value is ArmoireStoreItemDisplay {
  return (
    isRecord(value) &&
    typeof value.itemId === 'number' &&
    Number.isInteger(value.itemId) &&
    value.itemId > 0 &&
    (value.name === undefined || typeof value.name === 'string') &&
    (value.iconId === undefined ||
      (typeof value.iconId === 'number' && Number.isInteger(value.iconId) && value.iconId > 0))
  )
}

function isMissingItemIds(value: unknown): value is number[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((itemId) => Number.isInteger(itemId) && itemId > 0))
  )
}

export function isArmoireStoreItemDisplayIndex(
  value: unknown
): value is ArmoireStoreItemDisplayIndex {
  return (
    isRecord(value) &&
    value.schemaVersion === ARMOIRE_STORE_ITEM_DISPLAY_INDEX_SCHEMA_VERSION &&
    typeof value.generatedAt === 'string' &&
    isRecord(value.items) &&
    Object.values(value.items).every(isStoreItemDisplay) &&
    isMissingItemIds(value.missingItemIds)
  )
}

export function getArmoireStoreItemDisplay(
  index: ArmoireStoreItemDisplayIndex,
  itemId: number
): ArmoireStoreItemDisplay | undefined {
  return index.items[itemId]
}

export function getArmoireStoreItemIconUrl(
  index: ArmoireStoreItemDisplayIndex,
  itemId: number
): string {
  return getArmoireIconUrl(getArmoireStoreItemDisplay(index, itemId)?.iconId)
}
