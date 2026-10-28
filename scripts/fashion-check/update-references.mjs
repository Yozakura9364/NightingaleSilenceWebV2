// update-references.mjs — 刷新时尚品鉴生成链的上游参考数据。
// 用法：
//   node scripts/fashion-check/update-references.mjs
//
// 下载内容：
//   1. 官方 SaintCoinach CSV（chs/en/ja 来自 InfSein/ffxiv-datamining-mixed，ko 来自
//      Ra-Workspace/ffxiv-datamining-ko 的 csv/ 目录）：Item.csv、
//      FashionCheckThemeCategory.csv、FashionCheckWeeklyTheme.csv。
//   2. AvantGarde tracker（Google Sheet 导出）：物品 → 主题标签映射。
// 落点：local-assets/fashion-check/references/（gitignored 输入层）。
// 同时把 data/fashion-check/sources.json 中对应来源的 retrievedAt 更新为本次抓取时间，
// 使 generatedAt 随数据真实刷新。

import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { loadGameDataBatch, optionValue, publicSource } from '../lib/game-data-batch.mjs'
import { parseCsv } from './lib/csv.mjs'
import { patchRegistryRetrievedAt } from './lib/validation.mjs'

const execFileAsync = promisify(execFile)

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../..')
const referenceRoot = path.resolve(
  projectRoot,
  optionValue('--output-dir') || process.env.FASHION_CHECK_REFERENCE_DIR || 'local-assets/fashion-check/references'
)
const sourceRoot = optionValue('--source-root')
const sourceBatch = optionValue('--source-batch')
const localMode = Boolean(sourceRoot || sourceBatch)
const sourcesPath = optionValue('--sources-path') || (localMode ? '' : path.join(projectRoot, 'data/fashion-check/sources.json'))

const OFFICIAL_TABLES = ['Item.csv', 'FashionCheckThemeCategory.csv', 'FashionCheckWeeklyTheme.csv']
const MIXED_REPO = 'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master'
const KO_REPO = 'https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master'
const TRACKER_URL =
  'https://docs.google.com/spreadsheets/d/1b9NwL-Ba4tS0ROSy1_4HPfi7QSMQWuhXKqFSSY9Ovp4/export?format=csv'

const downloads = []
for (const locale of ['chs', 'en', 'ja']) {
  for (const table of OFFICIAL_TABLES) {
    downloads.push({
      label: `official/${locale}/${table}`,
      url: `${MIXED_REPO}/${locale}/${table}`,
      target: path.join(referenceRoot, 'official', locale, table),
      saintCoinach: true
    })
  }
}
for (const table of OFFICIAL_TABLES) {
  downloads.push({
    label: `official/ko/${table}`,
    url: `${KO_REPO}/csv/${table}`,
    target: path.join(referenceRoot, 'official', 'ko', table),
    saintCoinach: true
  })
}
downloads.push({
  label: 'community/avantgarde-tracker.csv',
  url: TRACKER_URL,
  target: path.join(referenceRoot, 'community', 'avantgarde-tracker.csv'),
  saintCoinach: false
})

// 用 curl 下载：自动尊重 HTTP(S)_PROXY 环境变量，且 Windows/Linux 均自带。
async function fetchText(url, label) {
  let stdout
  try {
    const result = await execFileAsync(
      'curl',
      ['-fsSL', '--max-time', '120', '-o', '-', url],
      { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' }
    )
    stdout = result.stdout
  } catch (error) {
    throw new Error(`${label}: 下载失败（${error.message}）`)
  }
  if (!stdout.trim()) {
    throw new Error(`${label}: 下载内容为空`)
  }
  return stdout
}

function countDataRows(text, saintCoinach) {
  const rows = parseCsv(text)
  return saintCoinach
    ? rows.slice(3).filter((row) => row.some(Boolean)).length
    : rows.slice(1).filter((row) => row.some(Boolean)).length
}

async function main() {
  const retrievedAt = new Date().toISOString()
  const report = []
  const batch = localMode ? await loadGameDataBatch({
    sourceRoot,
    sourceBatch,
    requirements: Object.fromEntries(['chs', 'en', 'ja', 'ko'].map((locale) => [locale, OFFICIAL_TABLES.map((table) => table.slice(0, -4))]))
  }) : null
  const selected = downloads.filter((item) => !batch || item.saintCoinach || process.argv.includes('--refresh-community'))
  const prepared = []

  // Validate every official input before replacing any existing reference.
  for (const item of selected) {
    const [, locale, table] = item.label.split('/')
    const record = batch && item.saintCoinach ? batch.sources.get(`${locale}/${table.slice(0, -4)}`) : null
    const bytes = record ? await readFile(record.file) : Buffer.from(await fetchText(item.url, item.label), 'utf8')
    const text = bytes.toString('utf8')
    if (item.saintCoinach) {
      const rows = parseCsv(text)
      if (rows.length < 3 || !String(rows[1]?.[1] ?? '').trim()) {
        throw new Error(`${item.label}: 不是有效的 SaintCoinach CSV`)
      }
    }
    prepared.push({ item, bytes, text, record, rowCount: countDataRows(text, item.saintCoinach) })
  }

  for (const { item, bytes, text, rowCount } of prepared) {
    await mkdir(path.dirname(item.target), { recursive: true })
    const previous = await readFile(item.target, 'utf8').catch(() => null)
    await writeFile(item.target, bytes)
    report.push(
      `${item.label}: ${rowCount} 行数据（${previous === null ? '新增' : previous === text ? '内容未变' : '已更新'}）`
    )
  }

  if (batch) {
    await mkdir(referenceRoot, { recursive: true })
    await writeFile(path.join(referenceRoot, 'game-data-batch.json'), `${JSON.stringify({
      source_batch_id: batch.batchId,
      source_mode: batch.sourceMode,
      retrievedAt,
      community_refreshed: process.argv.includes('--refresh-community'),
      sources: prepared.filter(({ record }) => record).map(({ record }) => publicSource(record))
    }, null, 2)}\n`, 'utf8')
  }
  if (sourcesPath) {
    await patchRegistryRetrievedAt(sourcesPath, 'ffxiv-datamining-mixed', retrievedAt)
    if (!batch || process.argv.includes('--refresh-community')) {
      await patchRegistryRetrievedAt(sourcesPath, 'avantgarde-tracker', retrievedAt)
    }
  }

  for (const line of report) console.log(line)
  console.log(`参考数据已刷新（retrievedAt=${retrievedAt}）`)
}

await main()
