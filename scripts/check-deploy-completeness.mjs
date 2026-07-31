// check-deploy-completeness.mjs — 部署完整性核对。
// 用法：node scripts/check-deploy-completeness.mjs <目标 release 目录>
// 对比本地 dist/ 顶层条目与目标目录：每条目必须存在；目录必须包含完全
// 相同的相对文件列表（防 2026-07-31 vendor 空目录上线事故）。

import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const distRoot = path.join(projectRoot, 'dist')
const targetRoot = process.argv[2] ? path.resolve(process.argv[2]) : null

if (!targetRoot) {
  console.error('用法：node scripts/check-deploy-completeness.mjs <目标 release 目录>')
  process.exit(2)
}
if (!existsSync(distRoot)) {
  console.error(`本地 dist 不存在：${distRoot}（先运行 npm run build）`)
  process.exit(2)
}
if (!existsSync(targetRoot)) {
  console.error(`目标目录不存在：${targetRoot}`)
  process.exit(2)
}

function listFilesRecursive(root) {
  const result = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const fullPath = path.join(dir, entry)
      const stats = statSync(fullPath)
      if (stats.isDirectory()) walk(fullPath)
      else result.push(path.relative(root, fullPath).replace(/\\/g, '/'))
    }
  }
  walk(root)
  return result.sort()
}

const errors = []
const rows = []

for (const entry of readdirSync(distRoot)) {
  const distEntry = path.join(distRoot, entry)
  const targetEntry = path.join(targetRoot, entry)
  const isDir = statSync(distEntry).isDirectory()

  if (!existsSync(targetEntry)) {
    errors.push(`缺失：${entry}${isDir ? '/（整个目录）' : ''}`)
    rows.push([entry, 'MISSING'])
    continue
  }

  if (!isDir) {
    const distSize = statSync(distEntry).size
    const targetSize = statSync(targetEntry).size
    if (distSize !== targetSize) {
      errors.push(`体积不一致：${entry}（dist ${distSize} vs target ${targetSize}）`)
      rows.push([entry, 'SIZE-DIFF'])
    } else {
      rows.push([entry, 'ok'])
    }
    continue
  }

  const distFiles = listFilesRecursive(distEntry)
  const targetFiles = new Set(listFilesRecursive(targetEntry))
  const missing = distFiles.filter((file) => !targetFiles.has(file))
  if (missing.length > 0) {
    errors.push(`目录不完整：${entry}/ 缺 ${missing.length} 个文件（如 ${missing.slice(0, 3).join('、')}${missing.length > 3 ? '…' : ''}）`)
    rows.push([entry, `MISSING ${missing.length}/${distFiles.length}`])
  } else {
    rows.push([entry, `ok (${distFiles.length} files)`])
  }
}

for (const [entry, status] of rows) console.log(`${status.padEnd(24)} ${entry}`)

if (errors.length > 0) {
  console.error('\n部署完整性核对失败：')
  for (const message of errors) console.error(`- ${message}`)
  process.exit(1)
}
console.log('\n部署完整性核对通过：dist 顶层条目在目标目录全部存在且内容一致。')
