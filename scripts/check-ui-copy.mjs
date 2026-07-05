import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const srcDir = join(rootDir, 'src')
const visibleTextPattern = /[\p{L}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
const staticAttributePattern = /\s(aria-label|title|placeholder|alt)="([^"]+)"/g
const directTextPattern = />([^<]+)</g
const staticDialogPattern = /\bwindow\.(alert|confirm)\(\s*(['"`])([\s\S]*?)\2\s*\)/g
const deprecatedConfigPattern = /\b(placeholderCopy|siteLabels)\b/g
const issues = []

for (const filePath of walk(srcDir)) {
  const relativePath = toRelativePath(filePath)

  if (filePath.endsWith('.vue')) {
    checkVueTemplate(filePath)
  }

  if ((filePath.endsWith('.vue') || filePath.endsWith('.ts')) && relativePath !== 'src/config/site.ts') {
    checkStaticDialogCopy(filePath)
    checkDeprecatedConfigUsage(filePath)
  }
}

if (issues.length > 0) {
  console.error('Hard-coded visible UI copy found. Use src/locales/ keys and useLocale().t(key).')
  for (const issue of issues) {
    console.error(`- ${issue.file}:${issue.line} ${issue.kind}: ${issue.value}`)
  }
  process.exit(1)
}

console.log('UI copy check passed.')

function walk(dirPath) {
  return readdirSync(dirPath).flatMap((name) => {
    const filePath = join(dirPath, name)
    const stats = statSync(filePath)

    if (stats.isDirectory()) {
      return walk(filePath)
    }

    return [filePath]
  })
}

function checkVueTemplate(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/)
  const template = templateMatch?.[1]

  if (!template) {
    return
  }

  const templateOffset = (templateMatch?.index ?? 0) + '<template>'.length
  checkDirectText(filePath, source, template, templateOffset)
  checkStaticAttributes(filePath, source, template, templateOffset)
}

function checkDirectText(filePath, source, template, templateOffset) {
  for (const match of template.matchAll(directTextPattern)) {
    const raw = match[1]
    const value = raw
      .replace(/\{\{[\s\S]*?\}\}/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!value || !visibleTextPattern.test(value)) {
      continue
    }

    addIssue(filePath, source, templateOffset + (match.index ?? 0), 'text', value)
  }
}

function checkStaticAttributes(filePath, source, template, templateOffset) {
  for (const match of template.matchAll(staticAttributePattern)) {
    const [, name, value] = match

    if (!visibleTextPattern.test(value)) {
      continue
    }

    addIssue(filePath, source, templateOffset + (match.index ?? 0), name, value)
  }
}

function checkStaticDialogCopy(filePath) {
  const source = readFileSync(filePath, 'utf8')

  for (const match of source.matchAll(staticDialogPattern)) {
    const [, name, quote, rawValue] = match

    if (quote === '`' && rawValue.includes('${')) {
      continue
    }

    const value = rawValue.replace(/\s+/g, ' ').trim()

    if (!value || !visibleTextPattern.test(value)) {
      continue
    }

    addIssue(filePath, source, match.index ?? 0, `window.${name}`, value)
  }
}

function checkDeprecatedConfigUsage(filePath) {
  const source = readFileSync(filePath, 'utf8')

  for (const match of source.matchAll(deprecatedConfigPattern)) {
    addIssue(filePath, source, match.index ?? 0, 'deprecated-config-copy', match[1])
  }
}

function addIssue(filePath, source, index, kind, value) {
  issues.push({
    file: relative(rootDir, filePath).replace(/\\/g, '/'),
    line: lineNumber(source, index),
    kind,
    value
  })
}

function toRelativePath(filePath) {
  return relative(rootDir, filePath).replace(/\\/g, '/')
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length
}
