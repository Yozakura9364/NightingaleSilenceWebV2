import { readdir, readFile, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const srcDir = join(rootDir, 'src')
const localeDir = join(srcDir, 'locales')
const moduleNames = ['core', 'home', 'plate', 'glamour', 'armoire', 'silence', 'styleLab']
const require = createRequire(import.meta.url)
const errors = []
const messageOwners = new Map()
let messageCount = 0
let textKeyCount = 0

for (const moduleName of moduleNames) {
  const messageFile = join(localeDir, 'modules', `${moduleName}.ts`)
  const keyFile = join(localeDir, 'keys', `${moduleName}.ts`)
  const messageVariable = `${moduleName}UiMessages`
  const keyVariable = `${moduleName}TextKeys`
  const messageKeys = await readObjectPropertyNames(messageFile, messageVariable)
  const textKeys = await readTextKeyValues(keyFile, keyVariable)
  const messageSet = new Set(messageKeys)

  messageCount += messageKeys.length
  textKeyCount += textKeys.length

  for (const key of messageKeys) {
    const existingOwner = messageOwners.get(key)

    if (existingOwner) {
      errors.push(`Duplicate UI message key "${key}" in ${existingOwner} and ${moduleName}.`)
    } else {
      messageOwners.set(key, moduleName)
    }
  }

  for (const key of textKeys) {
    if (!messageSet.has(key)) {
      errors.push(`${moduleName} text key "${key}" has no message in its module.`)
    }
  }
}

const allFiles = await walk(srcDir)

for (const file of allFiles) {
  if (!file.endsWith('.ts') && !file.endsWith('.vue')) {
    continue
  }

  const relativePath = toRelativePath(file)
  const source = await readFile(file, 'utf8')

  if (relativePath !== 'src/locales/ui.ts' && source.includes('@/locales/ui')) {
    errors.push(`${relativePath} imports the all-module locale aggregate.`)
  }

  if (relativePath !== 'src/config/site.ts' && importsTextKeysFromSite(file, source)) {
    errors.push(`${relativePath} imports the deprecated global textKeys registry.`)
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`- ${error}`)
  }

  process.exit(1)
}

console.log(
  `UI locale modules passed: ${messageCount} messages, ${textKeyCount} registered text keys.`
)

async function readObjectPropertyNames(filePath, variableName) {
  const object = await findObjectVariable(filePath, variableName)

  return object.properties.flatMap((property) => {
    if (!ts.isPropertyAssignment(property)) {
      return []
    }

    return getPropertyName(property.name)
  })
}

async function readTextKeyValues(filePath, variableName) {
  const object = await findObjectVariable(filePath, variableName)

  return object.properties.flatMap((property) => {
    if (!ts.isPropertyAssignment(property) || !ts.isStringLiteralLike(property.initializer)) {
      return []
    }

    return property.initializer.text
  })
}

async function findObjectVariable(filePath, variableName) {
  const source = await readFile(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)
  let result

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName
    ) {
      result = unwrapObject(node.initializer)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  if (!result) {
    throw new Error(`Could not find ${variableName} in ${toRelativePath(filePath)}.`)
  }

  return result
}

function unwrapObject(node) {
  let current = node

  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression
  }

  return current && ts.isObjectLiteralExpression(current) ? current : undefined
}

function readFileSyncShim(filePath) {
  return require('fs').readFileSync(filePath, 'utf8')
}
  let current = node

  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression
  }

  return current && ts.isObjectLiteralExpression(current) ? current : undefined
}

function getPropertyName(name) {
  if (ts.isStringLiteralLike(name) || ts.isIdentifier(name)) {
    return [name.text]
  }

  return []
}

function importsTextKeysFromSite(filePath, source) {
  const scriptSource = filePath.endsWith('.vue')
    ? source.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)?.[1]
    : source

  if (!scriptSource) {
    return false
  }

  const sourceFile = ts.createSourceFile(filePath, scriptSource, ts.ScriptTarget.Latest, true)

  return sourceFile.statements.some((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== '@/config/site'
    ) {
      return false
    }

    const bindings = statement.importClause?.namedBindings
    return (
      Boolean(bindings && ts.isNamedImports(bindings)) &&
      bindings.elements.some((element) => element.name.text === 'textKeys')
    )
  })
}

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

function toRelativePath(filePath) {
  return relative(rootDir, filePath).replace(/\\/g, '/')
}
