import { textKeys } from '@/config/site'
import { getArmoireIconUrl } from '@/lib/armoire/catalog'
import type {
  ArmoireCatalog,
  ArmoireCatalogItem,
  ArmoireContainerKind,
  ArmoireDyeResetReason,
  ArmoireDyeRiskItem,
  ArmoireOwnedItem
} from '@/lib/armoire/types'
import { useLocale, type Locale } from '@/stores/locale'

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

function getRetainerContainerLabel(containerName: string, t: Translate): string {
  const retainerSeparator = ' - '
  const separatorIndex = containerName.indexOf(retainerSeparator)
  const retainerPagePattern = /^Retainer Page \d+$/u

  if (separatorIndex > 0) {
    const retainerName = containerName.slice(0, separatorIndex)
    const retainerContainer = containerName.slice(separatorIndex + retainerSeparator.length)

    if (retainerPagePattern.test(retainerContainer)) {
      return `${retainerName} - ${t(textKeys.nsarmoireContainerRetainerInventory)}`
    }
  }

  return retainerPagePattern.test(containerName)
    ? t(textKeys.nsarmoireContainerRetainerInventory)
    : containerName
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
  return (
    getLocalizedArmoireItemName(catalog.items[itemId], useLocale().current.value) ??
    t(textKeys.nsarmoireUnknownItem)
  )
}

export function getLocalizedArmoireItemName(
  item: Pick<ArmoireCatalogItem, 'name' | 'localizedNames'> | undefined,
  locale: Locale
): string | undefined {
  if (!item) {
    return undefined
  }

  const localeName =
    locale === 'zh-CN' || locale === 'en' || locale === 'ja' || locale === 'ko'
      ? item.localizedNames?.[locale]
      : undefined

  return (
    localeName ??
    (locale === 'fr' || locale === 'de' ? item.localizedNames?.en : undefined) ??
    item.localizedNames?.['zh-CN'] ??
    item.localizedNames?.en ??
    item.name
  )
}

export function getArmoireItemIconUrl(catalog: ArmoireCatalog, itemId: number): string {
  return getArmoireIconUrl(catalog.items[itemId]?.iconId)
}

export function canShowArmoireBindState(
  catalog: ArmoireCatalog,
  item: Pick<ArmoireOwnedItem, 'itemId' | 'spiritbond'>
): item is Pick<ArmoireOwnedItem, 'itemId'> & { spiritbond: number } {
  return typeof item.spiritbond === 'number' && catalog.items[item.itemId]?.isTradable === true
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
  const displayContainerName =
    item.container === 'retainer' && containerName
      ? getRetainerContainerLabel(containerName, t)
      : containerName

  return displayContainerName && displayContainerName !== baseLabel ? displayContainerName : baseLabel
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
