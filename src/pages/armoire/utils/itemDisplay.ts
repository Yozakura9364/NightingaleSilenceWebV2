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

export function getArmoireItemName(
  catalog: ArmoireCatalog,
  itemId: number,
  t: Translate
): string {
  return catalog.items[itemId]?.name ?? formatArmoireItemId(itemId, t)
}

export function getArmoireItemIconUrl(catalog: ArmoireCatalog, itemId: number): string {
  return getArmoireIconUrl(catalog.items[itemId]?.iconId)
}

export function getArmoireContainerLabel(
  item: Pick<ArmoireDyeRiskItem | ArmoireOwnedItem, 'container' | 'containerName'>,
  t: Translate
): string {
  const baseLabel = t(containerLabelKeys[item.container])
  return item.containerName ? `${baseLabel} / ${item.containerName}` : baseLabel
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

const dyeResetReasonLabelKeys: Record<ArmoireDyeResetReason, string> = {
  cabinetStorage: textKeys.nsarmoireDyeResetCabinet,
  glamourSetBasket: textKeys.nsarmoireDyeResetGlamourSetBasket,
  preservedStorage: textKeys.nsarmoireDyeResetPreservedStorage
}

export function formatArmoireDyeResetReasons(
  reasons: ArmoireDyeResetReason[],
  t: Translate
): string {
  return reasons.map((reason) => t(dyeResetReasonLabelKeys[reason])).join(' / ')
}
