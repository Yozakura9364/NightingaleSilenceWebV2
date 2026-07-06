import { textKeys } from '@/config/site'
import { getArmoireIconUrl } from '@/lib/armoire/catalog'
import type {
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireDyeResetReason,
  ArmoireDyeRiskItem,
  ArmoireOwnedItem
} from '@/lib/armoire/types'

type Translate = (key: string) => string

export interface ArmoireDyeSlotView {
  key: string
  name: string
  color?: string
}

const containerLabelKeys: Record<ArmoireContainerKind, string> = {
  inventory: textKeys.nsarmoireContainerInventory,
  saddlebag: textKeys.nsarmoireContainerSaddlebag,
  retainer: textKeys.nsarmoireContainerRetainer,
  armoury: textKeys.nsarmoireContainerArmoury,
  glamourDresser: textKeys.nsarmoireContainerGlamourDresser,
  armoire: textKeys.nsarmoireContainerArmoire,
  manual: textKeys.nsarmoireContainerManual
}

export function formatArmoireText(
  t: Translate,
  key: string,
  values: Record<string, string | number>
): string {
  return t(key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''))
}

export function formatArmoireItemId(itemId: number, t: Translate): string {
  return `${t(textKeys.nsarmoireItemId)} ${itemId}`
}

export function getArmoireItemName(catalog: ArmoireCatalog, itemId: number, t: Translate): string {
  return catalog.items[itemId]?.name ?? t(textKeys.nsarmoireUnknownItem)
}

export function getArmoireItemIconUrl(catalog: ArmoireCatalog, itemId: number): string {
  return getArmoireIconUrl(catalog.items[itemId]?.iconId)
}

export function getArmoireContainerLabel(
  item: Pick<ArmoireDyeRiskItem | ArmoireOwnedItem, 'container' | 'containerName'> & {
    retainerName?: string
  },
  t: Translate
): string {
  const baseLabel = t(containerLabelKeys[item.container])
  const containerName =
    item.containerName?.trim() ||
    (item.container === 'retainer' ? item.retainerName?.trim() : undefined)

  return containerName && containerName !== baseLabel ? containerName : baseLabel
}

export function formatArmoireDyeNames(
  catalog: ArmoireCatalog,
  dyeIds: [number, number] | undefined,
  t: Translate
): string {
  const names = (dyeIds ?? [0, 0])
    .filter((dyeId) => dyeId > 0)
    .map((dyeId) => catalog.dyes[dyeId]?.name ?? String(dyeId))

  return names.length > 0 ? names.join(' / ') : t(textKeys.nsarmoireCatalogDyeNone)
}

export function formatArmoireDyeSlotNames(
  catalog: ArmoireCatalog,
  dyeIds: [number, number] | undefined,
  t: Translate,
  dyeSlotCount?: number
): string {
  const dyes = getArmoireDyeSlotViews(catalog, dyeIds, dyeSlotCount, t)
  return dyes.length > 0 ? dyes.map((dye) => dye.name).join(' / ') : ''
}

export function getArmoireDyeSlotViews(
  catalog: ArmoireCatalog,
  dyeIds: [number, number] | undefined,
  dyeSlotCount: number | undefined,
  t: Translate
): ArmoireDyeSlotView[] {
  const visibleSlotCount = getVisibleDyeSlotCount(dyeIds, dyeSlotCount)

  return (dyeIds ?? [0, 0])
    .slice(0, visibleSlotCount)
    .map((dyeId, index) => {
      if (dyeId <= 0) {
        return {
          key: `${index}-0`,
          name: t(textKeys.nsarmoireCatalogDyeNone)
        }
      }

      const dye = catalog.dyes[dyeId]
      return {
        key: `${index}-${dyeId}`,
        name: dye?.name ?? String(dyeId),
        color: normalizeDyeColor(dye?.color) ?? undefined
      }
    })
}

function normalizeDyeColor(color: string | undefined): string | null {
  if (!color || !/^#[0-9a-f]{6}$/i.test(color)) {
    return null
  }

  return color
}

function getVisibleDyeSlotCount(
  dyeIds: [number, number] | undefined,
  dyeSlotCount: number | undefined
): number {
  if (typeof dyeSlotCount === 'number' && dyeSlotCount > 0) {
    return Math.min(Math.trunc(dyeSlotCount), 2)
  }

  const dyes = dyeIds ?? [0, 0]
  const lastDyedSlotIndex = dyes.reduce((lastIndex, dyeId, index) => (dyeId > 0 ? index : lastIndex), -1)
  return lastDyedSlotIndex + 1
}

const dyeResetReasonLabelKeys: Record<ArmoireDyeResetReason, string> = {
  cabinetStorage: '',
  glamourSetBasket: '',
  preservedStorage: textKeys.nsarmoireDyeResetPreservedStorage
}

export function formatArmoireDyeResetReasons(
  reasons: ArmoireDyeResetReason[],
  t: Translate
): string {
  return reasons
    .map((reason) => dyeResetReasonLabelKeys[reason])
    .filter(Boolean)
    .map((key) => t(key))
    .join(' / ')
}
