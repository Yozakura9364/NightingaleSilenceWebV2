// check-scope.mjs — 时尚品鉴任务操作边界校验。
// 本任务只允许修改数据文件；改动落到允许清单之外即失败。
// 用法：
//   node scripts/fashion-check/check-scope.mjs                # 检查工作树+暂存区相对 HEAD 的改动
//   node scripts/fashion-check/check-scope.mjs --staged       # 只检查暂存区
//   node scripts/fashion-check/check-scope.mjs --ref HEAD~1   # 检查指定 ref 范围的改动
//   node scripts/fashion-check/check-scope.mjs --files list.txt  # 检查文件清单（每行一个路径）

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../..')

// 允许修改的路径前缀（时尚品鉴每周任务的操作边界）。
// 生成器、测试、文档允许阅读和运行，但不属于候选改动的合法范围。
const ALLOWED_PREFIXES = ['public/data/fashion-check/', 'data/fashion-check/']

const args = process.argv.slice(2)

function normalize(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '')
}

function collectFiles() {
  const filesIndex = args.indexOf('--files')
  if (filesIndex >= 0) {
    const listPath = args[filesIndex + 1]
    if (!listPath) {
      console.error('--files 需要提供清单文件路径')
      process.exit(2)
    }
    return readFileSync(path.resolve(projectRoot, listPath), 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  }

  let gitArgs
  if (args.includes('--staged')) {
    gitArgs = ['diff', '--cached', '--name-only']
  } else {
    const refIndex = args.indexOf('--ref')
    const ref = refIndex >= 0 ? args[refIndex + 1] : null
    gitArgs = ref ? ['diff', '--name-only', ref] : ['diff', '--name-only', 'HEAD']
  }

  const output = execFileSync('git', gitArgs, { cwd: projectRoot, encoding: 'utf8' })
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

const files = collectFiles().map(normalize)
const violations = files.filter(
  (file) => !ALLOWED_PREFIXES.some((prefix) => file.startsWith(prefix))
)

console.log(`边界检查：${files.length} 个改动文件，允许范围 ${ALLOWED_PREFIXES.join('、')}`)

if (files.length === 0) {
  console.log('没有检测到改动。')
  process.exit(0)
}

if (violations.length > 0) {
  console.error('操作边界校验失败，以下文件超出允许范围：')
  for (const file of violations) console.error(`- ${file}`)
  console.error('时尚品鉴任务只允许修改数据文件；页面、样式、文案、脚本问题必须报告，不得自行修改。')
  process.exit(1)
}

console.log('操作边界校验通过：全部改动都在数据文件范围内。')
