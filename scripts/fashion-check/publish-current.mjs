// publish-current.mjs — 时尚品鉴公开双文件生产发布器（唯一发布入口）。
// 用法：
//   node scripts/fashion-check/publish-current.mjs --target <生产 data/fashion-check 目录>
//   node scripts/fashion-check/publish-current.mjs --target <dir> --source <dir> --verify-url <https://host/data/fashion-check>
//
// 契约：docs/ai/FASHION_CHECK_PUBLISH_CONTRACT.md
// 行为：fail-closed。校验不过不写任何文件；原子写（tmp+fsync+rename）；
// 先 locales 后 current；混合态报告回滚命令；幂等（已对齐则不动）。

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, open, readFile, rename, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../..')
const PUBLISH_FILES = ['current-locales.json', 'current.json']

function argValue(flag) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : null
}

const sourceDir = path.resolve(projectRoot, argValue('--source') ?? 'public/data/fashion-check')
const targetDir = argValue('--target') ? path.resolve(argValue('--target')) : null
const verifyUrl = argValue('--verify-url')?.replace(/\/$/, '')
const isRepoSource = sourceDir === path.join(projectRoot, 'public/data/fashion-check')

if (!targetDir) {
  console.error('用法：node scripts/fashion-check/publish-current.mjs --target <目录> [--source <目录>] [--verify-url <base>]')
  process.exit(2)
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function timestamp() {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
}

async function atomicWrite(filePath, content) {
  const tmpPath = `${filePath}.tmp-${randomBytes(4).toString('hex')}`
  const handle = await open(tmpPath, 'wx')
  try {
    await handle.writeFile(content)
    await handle.sync()
  } finally {
    await handle.close()
  }
  await rename(tmpPath, filePath)
}

const report = []
function log(message) {
  report.push(message)
  console.log(message)
}

function fail(message, rollback) {
  console.error(`BLOCKED: ${message}`)
  if (rollback) console.error(`回滚命令: ${rollback}`)
  process.exit(1)
}

// ---- 1. 源校验 ----
if (!existsSync(sourceDir)) fail(`源目录不存在: ${sourceDir}`)
const source = {}
for (const file of PUBLISH_FILES) {
  const filePath = path.join(sourceDir, file)
  if (!existsSync(filePath)) fail(`源文件缺失: ${filePath}`)
  const content = await readFile(filePath)
  try {
    const parsed = JSON.parse(content.toString('utf8'))
    if (typeof parsed.schemaVersion !== 'string' || parsed.schemaVersion.length === 0) {
      fail(`源文件 ${file} 缺少 schemaVersion`)
    }
  } catch (error) {
    fail(`源文件 ${file} JSON 非法: ${error.message}`)
  }
  source[file] = { content, hash: sha256(content) }
}

if (isRepoSource) {
  try {
    execFileSync('node', [path.join(scriptDirectory, 'check-current.mjs')], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    log('[check] check:fashion-check-current 通过')
  } catch (error) {
    fail(`check:fashion-check-current 未通过，禁止发布：\n${error.stderr?.toString() || error.stdout?.toString() || error.message}`)
  }
} else {
  log('[check] 非仓库源，跳过 check-current（仅已做 JSON/schemaVersion 校验）')
}

// ---- 2. 目标现状与幂等 ----
if (!existsSync(targetDir)) fail(`目标目录不存在: ${targetDir}`)
const before = {}
for (const file of PUBLISH_FILES) {
  const filePath = path.join(targetDir, file)
  before[file] = existsSync(filePath) ? sha256(await readFile(filePath)) : null
}

const needPublish = PUBLISH_FILES.filter((file) => before[file] !== source[file].hash)
if (needPublish.length === 0) {
  log('已对齐：目标与源 SHA-256 一致，无需发布。')
  process.exit(0)
}

// ---- 3. 备份 ----
const backupTag = timestamp()
const backups = []
for (const file of PUBLISH_FILES) {
  const filePath = path.join(targetDir, file)
  if (!existsSync(filePath)) continue
  const backupPath = `${filePath}.bak-${backupTag}`
  await copyFile(filePath, backupPath)
  backups.push(backupPath)
  log(`[backup] ${file} -> ${path.basename(backupPath)}`)
}

// ---- 4. 原子发布：先 locales 后 current ----
const published = []
for (const file of PUBLISH_FILES) {
  if (before[file] === source[file].hash) {
    log(`[skip] ${file} 已一致`)
    continue
  }
  const filePath = path.join(targetDir, file)
  await atomicWrite(filePath, source[file].content)
  const afterHash = sha256(await readFile(filePath))
  if (afterHash !== source[file].hash) {
    const rollback = backups.length > 0
      ? `mv ${backups.find((b) => b.includes(file))} ${filePath}`
      : '无备份可用，立即人工处理'
    fail(`${file} 写入后 SHA 校验失败（期望 ${source[file].hash}，实际 ${afterHash}）`, rollback)
  }
  published.push(file)
  log(`[publish] ${file}: ${before[file] ?? '(无)'} -> ${afterHash}`)
}

// ---- 5. 公网复核 ----
if (verifyUrl) {
  for (const file of PUBLISH_FILES) {
    const response = await fetch(`${verifyUrl}/${file}?t=${Date.now()}`, {
      headers: { 'cache-control': 'no-store' }
    })
    if (!response.ok) fail(`公网复核 ${file} 返回 ${response.status}`)
    const remoteHash = sha256(Buffer.from(await response.arrayBuffer()))
    if (remoteHash !== source[file].hash) {
      fail(`公网复核 ${file} SHA 不一致（期望 ${source[file].hash}，实际 ${remoteHash}）`)
    }
    log(`[verify] ${file} 公网 hash 一致`)
  }
}

log(`DONE: 发布完成（${published.join(', ') || '无变更'}）。备份：${backups.join(', ') || '无'}`)
