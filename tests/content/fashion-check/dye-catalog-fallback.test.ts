// dye-catalog-fallback.test.ts — 染剂色块回退链：showcase 精确染剂 → entry 自带 color → 全量染剂目录。
// 数据契约缺口：referenceShowcase 条目的 dye 可能只带 dyeId+name（如 444 期的骸骨白/泥沼绿），
// 此时色块必须能从 public/data/ffxiv/dye-catalog.json 解析出来。
import { describe, it, expect } from 'vitest'
import { buildDyeColorMap, resolveEntryDyeColor } from '@/lib/fashion-check/dyeCatalog'

const SHOWCASE_DYES = [
  { slotId: 'head', exact: { dyeId: 6, name: '煤烟黑', color: '#2B2923', points: 2 } },
]

describe('fashion-check dye catalog fallback', () => {
  it('showcase 精确染剂命中时优先用 showcase 的颜色', () => {
    const color = resolveEntryDyeColor(
      SHOWCASE_DYES,
      { slotId: 'head', dye: { dyeId: 6, name: '煤烟黑' } },
      buildDyeColorMap({ dyes: { '6': { dyeId: 6, color: '#000000' } } })
    )
    expect(color).toBe('#2B2923')
  })

  it('showcase 未命中时回退到染剂目录（骸骨白/泥沼绿场景）', () => {
    const catalog = buildDyeColorMap({
      dyes: {
        '34': { dyeId: 34, name: '骸骨白', color: '#EBD3A0' },
        '43': { dyeId: 43, name: '泥沼绿', color: '#585230' },
      },
    })
    expect(
      resolveEntryDyeColor(SHOWCASE_DYES, { slotId: 'legs', dye: { dyeId: 34, name: '骸骨白' } }, catalog)
    ).toBe('#EBD3A0')
    expect(
      resolveEntryDyeColor(SHOWCASE_DYES, { slotId: 'feet', dye: { dyeId: 43, name: '泥沼绿' } }, catalog)
    ).toBe('#585230')
  })

  it('entry 自带 color 时在 showcase 未命中后直接使用', () => {
    const color = resolveEntryDyeColor(
      SHOWCASE_DYES,
      { slotId: 'body', dye: { dyeId: 6, name: '煤烟黑', color: '#111111' } },
      buildDyeColorMap({ dyes: {} })
    )
    expect(color).toBe('#111111')
  })

  it('三层都没有时返回 undefined（不编造颜色）', () => {
    expect(
      resolveEntryDyeColor(SHOWCASE_DYES, { slotId: 'weapon', dye: { dyeId: 999, name: '未知' } }, new Map())
    ).toBeUndefined()
    expect(resolveEntryDyeColor(undefined, { slotId: 'weapon' }, new Map())).toBeUndefined()
  })

  it('buildDyeColorMap 跳过缺颜色/坏 dyeId 的条目', () => {
    const map = buildDyeColorMap({
      dyes: {
        '34': { dyeId: 34, color: '#EBD3A0' },
        bad1: { dyeId: 0, color: '#123456' },
        bad2: { name: '无颜色' },
      },
    })
    expect(map.size).toBe(1)
    expect(map.get(34)).toBe('#EBD3A0')
  })
})
