// check-prod-sync.mjs — 时尚品鉴生产与仓库对齐检查（唯一客观对齐判据）。
// 用法：
//   node scripts/fashion-check/check-prod-sync.mjs --target <生产 data/fashion-check 目录>
//   node scripts/fashion-check/check-prod-sync.mjs --url <https://host/data/fashion-check>
// 逐文件比对 SHA-256：仓库 public/data/fashion-check vs 生产（目录或公网 URL）。

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../..')
const FILES = ['current.json', 'current-locales.json', 'sources.json', 'tag-database.json']

function argValue(flag) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : null
}

const targetDir = argValue('--target') ? path.resolve(argValue('--target')) : null
const targetUrl = argValue('--url')?.replace(/\/$/, '')
if (!targetDir && !targetUrl) {
  console.error('用法：node scripts/fashion-check/check-prod-sync.mjs --target <目录> | --url <base>')
  process.exit(2)
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

async function readTarget(file) {
  if (targetDir) {
    const filePath = path.join(targetDir, file)
    return existsSync(filePath) ? readFile(filePath) : null
  }
  const response = await fetch(`${targetUrl}/${file}?t=${Date.now()}`, {
    headers: { 'cache-control': 'no-store' }
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`${file}: 公网返回 ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

let mismatches = 0
for (const file of FILES) {
  const repoPath = path.join(projectRoot, 'public/data/fashion-check', file)
  if (!existsSync(repoPath)) continue
  const repoHash = sha256(await readFile(repoPath))
  const targetContent = await readTarget(file)
  if (!targetContent) {
    console.log(`MISMATCH ${file}: 生产缺失（仓库 ${repoHash}）`)
    mismatches += 1
    continue
  }
  const targetHash = sha256(targetContent)
  if (targetHash === repoHash) {
    console.log(`OK       ${file}: ${repoHash.slice(0, 12)}… 对齐`)
  } else {
    console.log(`MISMATCH ${file}: 仓库 ${repoHash.slice(0, 12)}… != 生产 ${targetHash.slice(0, 12)}…`)
    mismatches += 1
  }
}

if (mismatches > 0) {
  console.error(`\n不对齐：${mismatches} 个文件。以仓库为准重新发布：node scripts/fashion-check/publish-current.mjs --target <目录>`)
  process.exit(1)
}
console.log('\n全对齐：生产与仓库 SHA-256 逐文件一致。')
