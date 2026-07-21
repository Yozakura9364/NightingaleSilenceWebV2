import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const srcDir = join(rootDir, 'src')
const visibleTextPattern =
  /[\p{L}\p{Script=Han}\p{Script=Hiragana}\p{Script=Hangul}]/u
const staticAttributePattern = /\s(aria-label|title|placeholder|alt)="([^"]+)"/g
const staticDialogPattern = /\bwindow\.(alert|confirm)\(\s*(['"`])([\s\S]*?)\2\s*\)/g
const deprecatedConfigPattern = /\b(placeholderCopy|siteLabels)\b/g
const issues = []

const allFiles = await walk(srcDir)

for (const filePath of allFiles) {
  const relativePath = toRelativePath(filePath)

  if (filePath.endsWith('.vue')) {
    await checkVueTemplate(filePath)
  }

  if (
    (filePath.endsWith('.vue') || filePath.endsWith('.ts')) &&
    relativePath !== 'src/config/site.ts'
  ) {
    await checkStaticDialogCopy(filePath)
    await checkDeprecatedConfigUsage(filePath)
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

async function walk(dirPath) {
  const entries = await readdir(dirPath)
  const results = []

  for (const name of entries) {
    const filePath = join(dirPath, name)
    const stats = await stat(filePath)

    if (stats.isDirectory()) {
      results.push(...await walk(filePath))
    } else {
      results.push(filePath)
    }
  }

  return results
}

async function checkVueTemplate(filePath) {
  const source = await readFile(filePath, 'utf8')
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
  for (const textNode of findTemplateTextNodes(template)) {
    const value = textNode.value
      .replace(/\{\{[\s\S]*?\}\}/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (value && visibleTextPattern.test(value)) {
      addIssue(filePath, source, templateOffset + textNode.index, 'text', value)
    }
  }
}

function findTemplateTextNodes(template) {
  const nodes = []
  let textStart = 0
  let inTag = false
  let inComment = false
  let inMustache = false
  let quote = ''

  for (let index = 0; index < template.length; index += 1) {
    if (inComment) {
      if (template.startsWith('-->', index)) {
        inComment = false
        inTag = false
        index += 2
        textStart = index + 1
      }
      continue
    }

    if (!inTag) {
      if (inMustache) {
        if (template.startsWith('}}', index)) {
          inMustache = false
          index += 1
        }
        continue
      }

      if (template.startsWith('{{', index)) {
        inMustache = true
        index += 1
        continue
      }

      if (template[index] === '<') {
        pushTemplateTextNode(nodes, template, textStart, index)
        inTag = true
        inComment = template.startsWith('<!--', index)
      }
      continue
    }

    if (quote) {
      if (template[index] === quote && template[index - 1] !== '\\') {
        quote = ''
      }
      continue
    }

    if (template[index] === '"' || template[index] === "'") {
      quote = template[index]
      continue
    }

    if (template[index] === '>') {
      inTag = false
      textStart = index + 1
    }
  }

  if (!inTag && !inComment) {
    pushTemplateTextNode(nodes, template, textStart, template.length)
  }

  return nodes
}

function pushTemplateTextNode(nodes, template, start, end) {
  const value = template.slice(start, end)

  if (value.trim()) {
    nodes.push({ index: start, value })
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

async function checkStaticDialogCopy(filePath) {
  const source = await readFile(filePath, 'utf8')

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

async function checkDeprecatedConfigUsage(filePath) {
  const source = await readFile(filePath, 'utf8')

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
