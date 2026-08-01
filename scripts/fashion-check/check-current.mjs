// check-current.mjs — 时尚品鉴当前周公开数据完整性强校验。
// 目的：让"手工编辑 JSON 代替数据获取流程"无法通过发布检查。
// 校验 current.json 结构、ID 合法性，以及 current-locales.json 对全部
// itemId / categoryId / dyeId 的名称覆盖。tag-database 只做一致性警告
// （当周新答案允许尚未入库），不作为失败条件。

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../..')
const currentPath = path.join(projectRoot, 'public/data/fashion-check/current.json')
const localesPath = path.join(projectRoot, 'public/data/fashion-check/current-locales.json')
const tagDatabasePath = path.join(projectRoot, 'public/data/fashion-check/tag-database.json')

const KNOWN_SLOT_IDS = new Set(['weapon', 'head', 'body', 'hands', 'legs', 'feet'])
const LOCALES = ['zh-CN', 'en', 'ja', 'ko']

const errors = []
const warnings = []

function fail(message) {
  errors.push(message)
}

function warn(message) {
  warnings.push(message)
}

function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0
}

function isHexColor(value) {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function checkLocaleNames(table, id, kind) {
  const entry = table?.[String(id)]
  if (!entry || typeof entry !== 'object') {
    fail(`${kind} ${id}: 缺少 current-locales 名称条目（疑似未经 build-current-locales 生成）`)
    return
  }
  for (const locale of LOCALES) {
    if (!isNonEmptyString(entry[locale])) {
      fail(`${kind} ${id}: current-locales 缺少 ${locale} 名称`)
    }
  }
}

const current = JSON.parse(await readFile(currentPath, 'utf8'))
const locales = JSON.parse(await readFile(localesPath, 'utf8'))
let tagDatabase = null
try {
  tagDatabase = JSON.parse(await readFile(tagDatabasePath, 'utf8'))
} catch {
  warn('tag-database.json 不可读，跳过金牌入库一致性警告检查')
}

// ---- current.json 结构 ----
if (current.schemaVersion !== 'fashion-check.public-current.v5') {
  fail(`schemaVersion 应为 fashion-check.public-current.v5，实际 ${JSON.stringify(current.schemaVersion)}`)
}
if (locales.schemaVersion !== 'fashion-check.current-locales.v3') {
  fail(`current-locales schemaVersion 应为 fashion-check.current-locales.v3，实际 ${JSON.stringify(locales.schemaVersion)}`)
}
if (!isPositiveInt(current.globalIssue)) fail('globalIssue 必须是正整数')
if (!isPositiveInt(current.cnIssue)) fail('cnIssue 必须是正整数')
if (!isNonEmptyString(current.theme)) fail('theme 不能为空')

const startsAt = Date.parse(current.challengeWindow?.startsAt ?? '')
const endsAt = Date.parse(current.challengeWindow?.endsAt ?? '')
if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt >= endsAt) {
  fail('challengeWindow 起止时间无效')
}

if (!Array.isArray(current.slots) || current.slots.length === 0) {
  fail('slots 必须是非空数组')
}

const seenSlots = new Set()
for (const [index, slot] of (current.slots ?? []).entries()) {
  const where = `slots[${index}]`
  if (!KNOWN_SLOT_IDS.has(slot.slotId)) fail(`${where}: 未知 slotId ${JSON.stringify(slot.slotId)}`)
  if (seenSlots.has(slot.slotId)) fail(`${where}: slotId ${slot.slotId} 重复`)
  seenSlots.add(slot.slotId)
  if (!isNonEmptyString(slot.label)) fail(`${where}: label 不能为空`)
  if (!isNonEmptyString(slot.tag)) fail(`${where}: tag 不能为空`)
  if (!isPositiveInt(slot.categoryId)) {
    fail(`${where}: categoryId 必须是正整数（手填标签无法通过 populate 脚本）`)
  } else {
    checkLocaleNames(locales.tags, slot.categoryId, `categoryId`)
  }
  if (typeof slot.gold?.points !== 'number') fail(`${where}: gold.points 必须是数字`)
  if (!Array.isArray(slot.gold?.items) || slot.gold.items.length === 0) {
    fail(`${where}: gold.items 必须是非空数组`)
  }
  for (const [itemIndex, item] of (slot.gold?.items ?? []).entries()) {
    const itemWhere = `${where}.gold.items[${itemIndex}]`
    if (!isPositiveInt(item.itemId)) fail(`${itemWhere}: itemId 必须是正整数`)
    else checkLocaleNames(locales.items, item.itemId, `itemId`)
    if (!isPositiveInt(item.iconId)) fail(`${itemWhere}: iconId 必须是正整数`)
    if (!Number.isInteger(item.rarity) || item.rarity < 1 || item.rarity > 7) {
      fail(`${itemWhere}: rarity 必须是 1-7 的整数`)
    }
    if (!isNonEmptyString(item.name)) fail(`${itemWhere}: name 不能为空`)
  }
}

// ---- referenceShowcase ----
const showcase = current.referenceShowcase
if (showcase && typeof showcase === 'object') {
  if (isPositiveInt(showcase.globalIssue) && showcase.globalIssue !== current.globalIssue) {
    fail(`referenceShowcase.globalIssue (${showcase.globalIssue}) 与顶层 globalIssue (${current.globalIssue}) 不一致`)
  }
  for (const [solIndex, solution] of (showcase.solutions ?? []).entries()) {
    const where = `referenceShowcase.solutions[${solIndex}]`
    if (solution.score !== 80 && solution.score !== 100) fail(`${where}: score 必须是 80 或 100`)
    const entries = solution.entries ?? solution.variants?.flatMap((variant) => variant.entries ?? []) ?? []
    if (!Array.isArray(entries) || entries.length === 0) fail(`${where}: entries 必须是非空数组`)
    for (const [entryIndex, entry] of entries.entries()) {
      const entryWhere = `${where}.entries[${entryIndex}]`
      if (!KNOWN_SLOT_IDS.has(entry.slotId)) fail(`${entryWhere}: 未知 slotId ${JSON.stringify(entry.slotId)}`)
      if (entry.item && typeof entry.item === 'object') {
        if (!isPositiveInt(entry.item.itemId)) fail(`${entryWhere}: item.itemId 必须是正整数`)
        else checkLocaleNames(locales.items, entry.item.itemId, `itemId`)
        if (!isPositiveInt(entry.item.iconId)) fail(`${entryWhere}: item.iconId 必须是正整数`)
        if (!Number.isInteger(entry.item.rarity) || entry.item.rarity < 1 || entry.item.rarity > 7) {
          fail(`${entryWhere}: item.rarity 必须是 1-7 的整数`)
        }
        if (!isNonEmptyString(entry.item.name)) fail(`${entryWhere}: item.name 不能为空`)
      } else if (!isPositiveInt(entry.iconId)) {
        fail(`${entryWhere}: 泛用装备条目必须携带 iconId，或提供 item 对象`)
      }
      if (entry.dye) {
        if (!isPositiveInt(entry.dye.dyeId)) {
          fail(`${entryWhere}: 染色条目必须携带 dyeId`)
        } else {
          checkLocaleNames(locales.dyes, entry.dye.dyeId, `dyeId`)
        }
      }
    }
  }
  for (const [dyeIndex, dye] of (showcase.dyes ?? []).entries()) {
    const where = `referenceShowcase.dyes[${dyeIndex}]`
    if (!KNOWN_SLOT_IDS.has(dye.slotId)) fail(`${where}: 未知 slotId ${JSON.stringify(dye.slotId)}`)
    if (!isNonEmptyString(dye.family?.id)) fail(`${where}: family.id 不能为空`)
    if (!isHexColor(dye.family?.color)) fail(`${where}: family.color 必须是 #RRGGBB`)
    if (dye.exact) {
      if (!isPositiveInt(dye.exact.dyeId)) {
        fail(`${where}: 精确染剂必须携带 dyeId（缺失时生成器必须失败，不允许手填名称绕过）`)
      } else {
        checkLocaleNames(locales.dyes, dye.exact.dyeId, `dyeId`)
        const dyeItem = locales.dyeItems?.[String(dye.exact.dyeId)]
        if (!dyeItem || !isPositiveInt(dyeItem.itemId) || !isPositiveInt(dyeItem.iconId)) {
          fail(`dyeId ${dye.exact.dyeId}: 缺少 dyeItems 消耗物品解析（应由生成器写入）`)
        }
      }
      if (!isHexColor(dye.exact.color)) fail(`${where}: exact.color 必须是 #RRGGBB`)
    }
  }
}

// ---- tag-database 一致性（分档）----
// tag-database 已有标签：金牌 itemId 必须命中同 categoryId+slotId 的金牌列表，
// 否则 FAIL（2026-08-01 wronggold 事故：风化系列非金牌装备被写入）。
// tag-database 未收录的标签（本周新标签）：WARN，需人工确认证据。
if (tagDatabase?.categories && tagDatabase?.items) {
  for (const slot of current.slots ?? []) {
    if (!isPositiveInt(slot.categoryId)) continue
    const category = tagDatabase.categories.find((entry) => entry.categoryId === slot.categoryId)
    if (!category) {
      warn(`categoryId ${slot.categoryId} 不在 tag-database（当周新标签可接受，发布前需人工确认证据）`)
      continue
    }
    const dbSlot = category.slots?.find((entry) => entry.slotId === slot.slotId)
    for (const item of slot.gold?.items ?? []) {
      if (!tagDatabase.items[String(item.itemId)]) {
        warn(`itemId ${item.itemId}（${slot.slotId}）不在 tag-database items 索引（新答案可接受，需人工确认）`)
      } else if (dbSlot && !(dbSlot.itemIds ?? []).includes(item.itemId)) {
        fail(`itemId ${item.itemId} 在 tag-database 中不属于 categoryId ${slot.categoryId}/${slot.slotId} 的金牌列表（wronggold 类错误，禁止发布）`)
      }
    }
  }
}

for (const message of warnings) console.warn(`[warn] ${message}`)
if (errors.length > 0) {
  console.error('current.json 完整性检查失败：')
  for (const message of errors) console.error(`- ${message}`)
  process.exit(1)
}
console.log(
  `current.json 完整性检查通过：${current.slots?.length ?? 0} 个部位、` +
    `${(showcase?.dyes ?? []).length} 个染色槽、名称索引覆盖完整（警告 ${warnings.length} 项）。`
)
