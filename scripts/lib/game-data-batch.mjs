import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import path from 'node:path'

const SCHEMA = 'nightingale.game-data.v1'
const LOCALES = new Set(['chs', 'en', 'ja', 'ko', 'tc', 'fr', 'de'])
const digest = (value) => createHash('sha256').update(value).digest('hex')

function checkProvenance(record, mode, revisions) {
  if (mode === 'local') {
    if (record.repository !== 'local' || record.revision !== '' || record.url !== '') throw new Error('Local source provenance must not claim a remote repository')
    return
  }
  const [repository, prefix] = record.locale === 'ko' ? ['Ra-Workspace/ffxiv-datamining-ko', 'csv/'] : record.locale === 'tc' ? ['thewakingsands/ffxiv-datamining-tc', ''] : ['InfSein/ffxiv-datamining-mixed', `${record.locale}/`]
  if (!/^[0-9a-f]{40}$/.test(record.revision) || record.repository !== repository || record.url !== `https://raw.githubusercontent.com/${repository}/${record.revision}/${prefix}${record.sheet}.csv`) throw new Error('Remote source provenance must use a pinned official repository')
  if (revisions.has(repository) && revisions.get(repository) !== record.revision) throw new Error('Source provenance mixes revisions of one repository')
  revisions.set(repository, record.revision)
}

// Python's json.dumps(..., ensure_ascii=False, sort_keys=True, separators=(',', ':')).
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function optionValue(name, argv = process.argv.slice(2)) {
  const indexes = argv.flatMap((value, index) => value === name ? [index] : [])
  if (indexes.length > 1) throw new Error(`${name} may only be supplied once`)
  if (!indexes.length) return ''
  const value = argv[indexes[0] + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}

function sheetKey(locale, sheet) {
  if (!LOCALES.has(locale) || typeof sheet !== 'string' || !sheet || sheet.includes('\\') || sheet.includes(':') || sheet.endsWith('.csv') || sheet.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Invalid game-data dependency: ${locale}/${sheet}`)
  }
  return `${locale}/${sheet}`
}

async function containedFile(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\') || relative.includes(':') || relative.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Invalid batch path: ${relative}`)
  }
  let file
  try {
    file = await realpath(path.resolve(root, relative))
  } catch {
    throw new Error(`Missing local game-data file: ${relative}`)
  }
  const resolvedRelative = path.relative(root, file)
  if (resolvedRelative.startsWith(`..${path.sep}`) || resolvedRelative === '..' || path.isAbsolute(resolvedRelative)) {
    throw new Error(`Batch path escapes source root: ${relative}`)
  }
  return file
}

export async function loadGameDataBatch({ sourceBatch = '', sourceRoot = '', requirements = {} } = {}) {
  let manifest = null
  let root
  let batchRoot
  const sources = new Map()
  if (sourceBatch) {
    const manifestPath = await realpath(path.resolve(sourceBatch))
    batchRoot = path.dirname(manifestPath)
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    if (manifest.schema_version !== SCHEMA || !['local', 'remote'].includes(manifest.source_mode) || !/^[0-9a-f]{64}$/.test(manifest.batch_id) || !Array.isArray(manifest.sources) || !manifest.sources.length) {
      throw new Error('Invalid game-data batch manifest')
    }
    if (digest(canonicalJson(manifest.sources)) !== manifest.batch_id) throw new Error('Game-data batch identity hash mismatch')
    root = await realpath(path.join(batchRoot, 'csv'))
    if (sourceRoot && await realpath(path.resolve(sourceRoot)) !== root) throw new Error('Source root does not match the batch CSV root')
    const revisions = new Map()
    for (const record of manifest.sources) {
      const key = sheetKey(record.locale, record.sheet)
      checkProvenance(record, manifest.source_mode, revisions)
      if (sources.has(key)) throw new Error(`Duplicate game-data source: ${key}`)
      if (record.path !== `csv/${key}.csv` || !/^[0-9a-f]{64}$/.test(record.sha256)) throw new Error(`Invalid game-data source: ${key}`)
      const file = await containedFile(batchRoot, record.path)
      if (digest(await readFile(file)) !== record.sha256) throw new Error(`Game-data file hash mismatch: ${key}`)
      sources.set(key, { ...record, file })
    }
  } else {
    if (!sourceRoot) throw new Error('A source root or source batch is required')
    root = await realpath(path.resolve(sourceRoot))
  }
  for (const [locale, sheets] of Object.entries(requirements)) {
    for (const sheet of sheets) {
      const key = sheetKey(locale, sheet)
      if (manifest) {
        if (!sources.has(key)) throw new Error(`Missing game-data dependency: ${key}`)
      } else {
        const file = await containedFile(root, `${key}.csv`)
        sources.set(key, { locale, sheet, path: `csv/${key}.csv`, sha256: digest(await readFile(file)), repository: 'local', revision: '', url: '', file })
      }
    }
  }
  return { batchId: manifest?.batch_id ?? null, sourceMode: manifest?.source_mode ?? 'local', root, sources }
}

export function publicSource(record) {
  return { locale: record.locale, sheet: record.sheet, source: record.url || record.path, sha256: record.sha256, repository: record.repository, revision: record.revision }
}
