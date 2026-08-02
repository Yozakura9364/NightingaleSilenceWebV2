// dyeCatalog.ts — 时尚品鉴染剂色块解析。
// 数据契约缺口（444 期骸骨白/泥沼绿）：referenceShowcase 条目的 dye 可能只带 dyeId+name，
// showcase.dyes 的 exact 列表又只覆盖推荐染剂——此时回退到全量染剂目录
//（public/data/ffxiv/dye-catalog.json）取色，任何一期数据都能自愈。
import type { FashionCheckReferenceEntry, FashionCheckReferenceShowcase } from './types'

export interface FfxivDyeCatalog {
  dyes?: Record<string, { dyeId?: number; name?: string; color?: string }>
}

export function buildDyeColorMap(catalog: FfxivDyeCatalog): Map<number, string> {
  const map = new Map<number, string>()
  for (const entry of Object.values(catalog?.dyes ?? {})) {
    const id = Number(entry?.dyeId)
    const color = String(entry?.color ?? '').trim()
    if (Number.isInteger(id) && id > 0 && color) map.set(id, color)
  }
  return map
}

export function resolveEntryDyeColor(
  showcaseDyes: FashionCheckReferenceShowcase['dyes'] | undefined,
  entry: Pick<FashionCheckReferenceEntry, 'slotId' | 'dye'>,
  catalogColors?: ReadonlyMap<number, string>
): string | undefined {
  const exact = showcaseDyes?.find(
    (candidate) => candidate.slotId === entry.slotId && candidate.exact.dyeId === entry.dye?.dyeId
  )?.exact.color
  if (exact) return exact

  const own = (entry.dye as { color?: string } | undefined)?.color
  if (own) return own

  const id = Number(entry.dye?.dyeId)
  if (catalogColors && Number.isInteger(id) && id > 0) {
    return catalogColors.get(id)
  }
  return undefined
}
