// sync-weekly-intake.mjs — 把 OpsBot 私有 staging 中已采集的周答案对齐到本地 intake 文件。
// 用法：
//   node scripts/fashion-check/sync-weekly-intake.mjs [--host opencloudos]
//
// 数据源（私有、不直接对外）：
//   <host>:/opt/nightingale/NightingaleOpsBot/.local/fashion-check/snapshots/qq-cn-history/*.json
//   <host>:/opt/nightingale/NightingaleOpsBot/.local/fashion-check/current.json
//
// 输出：data/fashion-check/weekly-intake.json（tracked，作为周答案补充输入）。
// 该文件由本脚本机械生成；人工确认 = 提交前审查 diff。
// 历史底座（国际服 16–441 期）由 qq-fashion-check-history.json 冻结覆盖，
// intake 只收录 >441 期的记录。

import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { GLOBAL_ISSUE_MAX, SLOT_IDS, patchRegistryRetrievedAt, writeJson, invariant } from './lib/validation.mjs'

const execFileAsync = promisify(execFile)
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../..')
const intakePath = path.join(projectRoot, 'data/fashion-check/weekly-intake.json')
const sourcesPath = path.join(projectRoot, 'data/fashion-check/sources.json')

const REMOTE_BASE = '/opt/nightingale/NightingaleOpsBot/.local/fashion-check'
const REMOTE_SNAPSHOT_DIR = `${REMOTE_BASE}/snapshots/qq-cn-history`
const REMOTE_CURRENT = `${REMOTE_BASE}/current.json`

const hostArgIndex = process.argv.indexOf('--host')
const sshHost =
  hostArgIndex !== -1
    ? process.argv[hostArgIndex + 1]
    : (process.env.FASHION_CHECK_STAGING_HOST ?? 'opencloudos')
invariant(sshHost, '--host 或 FASHION_CHECK_STAGING_HOST 必须非空')

async function sshStdout(remoteCommand) {
  const { stdout } = await execFileAsync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', sshHost, remoteCommand],
    { maxBuffer: 64 * 1024 * 1024 }
  )
  return stdout
}

async function fetchStagingFiles() {
  const stdout = await sshStdout(
    `for f in ${REMOTE_SNAPSHOT_DIR}/*.json ${REMOTE_CURRENT}; do ` +
      `echo "===FILE=== $f"; echo "===MTIME=== $(stat -c %Y "$f")"; cat "$f"; done`
  )
  const files = []
  const fileMarker = '===FILE=== '
  const mtimeMarker = '===MTIME=== '
  let cursor = 0
  while (true) {
    const start = stdout.indexOf(fileMarker, cursor)
    if (start === -1) break
    const nameEnd = stdout.indexOf('\n', start)
    const name = stdout.slice(start + fileMarker.length, nameEnd).trim()
    const mtimeEnd = stdout.indexOf('\n', nameEnd + 1)
    const mtimeLine = stdout.slice(nameEnd + 1, mtimeEnd)
    const mtimeSeconds = mtimeLine.startsWith(mtimeMarker)
      ? Number(mtimeLine.slice(mtimeMarker.length).trim())
      : NaN
    const mtime = Number.isFinite(mtimeSeconds) ? new Date(mtimeSeconds * 1000).toISOString() : ''
    const next = stdout.indexOf(fileMarker, mtimeEnd)
    const body = stdout.slice(mtimeEnd + 1, next === -1 ? stdout.length : next)
    files.push({ name, mtime, body })
    cursor = next === -1 ? stdout.length : next
  }
  return files
}

function slotIdFromRecord(slot) {
  const slotId = String(slot?.slotId ?? '').trim()
  return SLOT_IDS.includes(slotId) ? slotId : null
}

// 从 staging 记录提取 intake 所需字段。快照结构为 {current: {...}}；
// current.json 的当期记录在 sources['qq-cn-history'].current。
function extractRecord(json, fileName, fileMtime) {
  const qqSource = json?.sources?.['qq-cn-history']
  const current = json?.current ?? qqSource?.current
  if (!current || !Number.isInteger(current.globalIssue)) return null
  const slots = []
  for (const slot of current.slots ?? []) {
    const slotId = slotIdFromRecord(slot)
    const tag = String(slot?.tag ?? '').trim()
    const answerText = String(slot?.answerText ?? '').trim()
    if (!slotId || (!tag && !answerText)) continue
    slots.push({ slotId, tag, answerText })
  }
  return {
    globalIssue: current.globalIssue,
    cnIssue: Number.isInteger(current.cnIssue) ? current.cnIssue : null,
    startDate: String(current.startDate ?? ''),
    theme: String(current.theme ?? ''),
    sourceFile: path.posix.basename(fileName),
    retrievedAt: String(json?.meta?.retrievedAt ?? qqSource?.retrievedAt ?? fileMtime ?? ''),
    slots
  }
}

function mergeIssueRecords(records) {
  const byIssue = new Map()
  for (const record of records.sort((left, right) => left.retrievedAt.localeCompare(right.retrievedAt))) {
    const existing = byIssue.get(record.globalIssue)
    if (!existing) {
      byIssue.set(record.globalIssue, {
        ...record,
        sourceFiles: [record.sourceFile]
      })
      continue
    }
    existing.sourceFiles.push(record.sourceFile)
    existing.retrievedAt = record.retrievedAt
    existing.cnIssue = record.cnIssue ?? existing.cnIssue
    existing.startDate = record.startDate || existing.startDate
    existing.theme = record.theme || existing.theme
    // 每个槽位取最新一份非空数据（快照是渐进补充的）
    for (const slot of record.slots) {
      const index = existing.slots.findIndex((entry) => entry.slotId === slot.slotId)
      if (index === -1) {
        existing.slots.push(slot)
      } else if (slot.tag || slot.answerText) {
        existing.slots[index] = slot
      }
    }
  }
  return [...byIssue.values()].sort((left, right) => left.globalIssue - right.globalIssue)
}

async function main() {
  const files = await fetchStagingFiles()
  invariant(files.length > 0, `staging 无文件（host=${sshHost}）`)

  const records = []
  for (const file of files) {
    let json
    try {
      json = JSON.parse(file.body)
    } catch (error) {
      throw new Error(`staging 文件解析失败 ${file.name}: ${error.message}`)
    }
    const record = extractRecord(json, file.name, file.mtime)
    if (record) records.push(record)
  }

  const merged = mergeIssueRecords(records)
  const intake = merged.filter((record) => record.globalIssue > GLOBAL_ISSUE_MAX)
  const skipped = merged.length - intake.length
  for (const record of intake) {
    delete record.sourceFile
    invariant(record.slots.length > 0, `intake issue ${record.globalIssue} 无任何槽位数据`)
    invariant(
      record.slots.every((slot) => slot.tag),
      `intake issue ${record.globalIssue} 存在缺 tag 的槽位`
    )
  }

  await writeJson(intakePath, {
    schemaVersion: 'fashion-check.weekly-intake.v1',
    syncedAt: new Date().toISOString(),
    source: {
      host: sshHost,
      snapshotDir: REMOTE_SNAPSHOT_DIR,
      currentFile: REMOTE_CURRENT
    },
    records: intake.map(({ sourceFiles, ...record }) => ({ ...record, sourceFiles }))
  })

  // 同步 qq-cn-history 的 retrievedAt 到最新快照时间，保证 generatedAt 随 intake 推进
  const latestRetrievedAt = intake.map((record) => record.retrievedAt).filter(Boolean).sort().at(-1)
  if (latestRetrievedAt) {
    await patchRegistryRetrievedAt(sourcesPath, 'qq-cn-history', latestRetrievedAt)
  }

  console.log(`staging 文件 ${files.length} 个，合并出 ${merged.length} 期记录`)
  console.log(`intake 收录 ${intake.length} 期（${intake.map((r) => r.globalIssue).join(', ') || '无'}），跳过历史期 ${skipped} 期`)
  for (const record of intake) {
    console.log(
      `  ${record.globalIssue} 期（国服 ${record.cnIssue ?? '?'}，${record.startDate}，${record.theme}）：` +
        record.slots.map((slot) => `${slot.slotId}=${slot.tag}`).join(' ')
    )
  }
}

await main()
