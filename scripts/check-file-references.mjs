// check-file-references.mjs — 删除文件前的引用扫描。
// 用法：node scripts/check-file-references.mjs <文件名或路径片段>
// 例：node scripts/check-file-references.mjs armoire-dye-catalog.json
// 全仓扫描（排除 node_modules/.git/dist/local-assets/.codex），列出所有引用方。
// 有引用 = 不能删，或必须先迁走引用再删。零引用才可删除。

import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const needle = process.argv[2]

if (!needle) {
  console.error('用法：node scripts/check-file-references.mjs <文件名或路径片段>')
  process.exit(2)
}

const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'local-assets', '.codex', '.codex-tmp', '.code-review-graph'])
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.vue', '.js', '.mjs', '.cjs', '.json', '.md', '.py',
  '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.html', '.css', '.txt'
])
const DOC_EXTENSIONS = new Set(['.md', '.txt'])

const matches = []

async function walk(dirPath) {
  for (const entry of await readdir(dirPath)) {
    if (EXCLUDED_DIRS.has(entry)) continue
    const fullPath = path.join(dirPath, entry)
    const stats = await stat(fullPath)
    if (stats.isDirectory()) {
      await walk(fullPath)
      continue
    }
    if (!TEXT_EXTENSIONS.has(path.extname(entry).toLowerCase())) continue
    let content
    try {
      content = await readFile(fullPath, 'utf8')
    } catch {
      continue
    }
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      if (line.includes(needle)) {
        matches.push({
          location: `${path.relative(projectRoot, fullPath).replace(/\\/g, '/')}:${index + 1}`,
          isDoc: DOC_EXTENSIONS.has(path.extname(entry).toLowerCase())
        })
      }
    })
  }
}

await walk(projectRoot)

const selfPrefix = path.relative(projectRoot, fileURLToPath(import.meta.url)).replace(/\\/g, '/')
const external = matches.filter((match) => !match.location.startsWith(selfPrefix))
const blocking = external.filter((match) => !match.isDoc)
const docOnly = external.filter((match) => match.isDoc)

if (blocking.length > 0) {
  console.log(`"${needle}" 被 ${blocking.length} 处代码/配置引用：`)
  for (const match of blocking) console.log(`- ${match.location}`)
  if (docOnly.length > 0) {
    console.log(`另有 ${docOnly.length} 处文档提及（不阻断，供人工判断）：`)
    for (const match of docOnly) console.log(`- ${match.location}`)
  }
  console.log('\n结论：存在活引用，不能直接删除；先迁改引用方或改用共享层。')
  process.exit(1)
}

if (docOnly.length > 0) {
  console.log(`"${needle}" 无代码/配置引用，仅 ${docOnly.length} 处文档提及（不阻断）：`)
  for (const match of docOnly) console.log(`- ${match.location}`)
}

console.log(`"${needle}" 全仓无活引用（排除 node_modules/.git/dist/local-assets/.codex/.codex-tmp），可以删除。`)
