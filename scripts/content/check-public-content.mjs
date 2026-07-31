// check-public-content.mjs — T039 [US2]
// Validates the generated public/data/content tree against content/published/:
// - index <-> entry consistency (both directions, no orphans)
// - duplicate / missing publicId detection, stable ordering
// - residual .bak/.retired/.tmp or any non-snapshot file in published/
// - media reference and stable-URL rules, base64 / local-path leakage
// - generationHash binding between snapshot and generated entry
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  loadSnapshots,
  deriveEntryView,
  deriveIndexView,
  findLeaks,
  isStableMediaUrl,
  DEFAULT_MEDIA_HOST,
} from './lib/public-content-core.mjs'

export function checkPublicContent({ publishedDir, outDir, mediaHost = DEFAULT_MEDIA_HOST, log = () => {} }) {
  const errors = []

  // 0. leftover build staging/backup dirs next to the output tree
  for (const f of readdirSync(join(outDir, '..'))) {
    if (/^content\.(bak|tmp)-/.test(f)) {
      errors.push(`leftover build directory next to output: ${f}`)
    }
  }

  // 1. residual files in published/ (evidence of failed recovery or manual edits)
  if (existsSync(publishedDir)) {
    for (const f of readdirSync(publishedDir)) {
      if (!/^\d+\.json$/.test(f)) {
        errors.push(`residual file in published/: ${f}`)
      }
    }
  }

  // 2. snapshots
  let snapshots
  try {
    snapshots = loadSnapshots(publishedDir)
  } catch (e) {
    errors.push(`cannot load snapshots: ${e.message}`)
    snapshots = []
  }
  const seen = new Set()
  for (const s of snapshots) {
    if (seen.has(s.publicId)) errors.push(`duplicate publicId ${s.publicId} in published/`)
    seen.add(s.publicId)
    const errs = validateSnapshotPublic(s, mediaHost)
    for (const e of errs) errors.push(`snapshot ${s.publicId}.json: ${e}`)
  }
  snapshots.sort((a, b) => a.publicId - b.publicId)

  // 3. output tree presence
  const indexPath = join(outDir, 'index.json')
  if (snapshots.length === 0) {
    // empty state: valid only when the output tree is absent or completely empty
    const leftovers = listFilesRecursive(outDir)
    if (leftovers.length === 0) {
      log('[OK] no published content, nothing to check')
      return { ok: true, errors: [] }
    }
    for (const f of leftovers) errors.push(`stale output remains with no published snapshots: ${f}`)
    return { ok: false, errors }
  }
  if (!existsSync(indexPath)) {
    errors.push('index.json missing in output')
    return { ok: errors.length === 0, errors }
  }
  let index
  try {
    index = JSON.parse(readFileSync(indexPath, 'utf8'))
  } catch (e) {
    errors.push(`index.json unparseable: ${e.message}`)
    return { ok: false, errors }
  }
  if (index.schemaVersion !== 'content.index.v1') errors.push(`index schemaVersion invalid: ${JSON.stringify(index.schemaVersion)}`)
  if (!Array.isArray(index.entries)) errors.push('index.entries must be an array')

  // 4. expected views (single source of truth from snapshots)
  let expectedEntries = []
  let expectedIndex = null
  if (snapshots.length > 0) {
    try {
      expectedEntries = snapshots.map((s) => deriveEntryView(s, mediaHost))
      expectedIndex = deriveIndexView(snapshots)
    } catch (e) {
      errors.push(`cannot derive expected output: ${e.message}`)
    }
  }

  // 5. index content vs snapshots
  if (expectedIndex && JSON.stringify(index) !== JSON.stringify(expectedIndex)) {
    errors.push('index.json content does not match published snapshots')
  }

  // 6. per-entry files: existence, content, hash binding, reverse orphans
  const entriesDir = join(outDir, 'entries')
  const onDiskFiles = existsSync(entriesDir) ? readdirSync(entriesDir) : []
  const expectedFiles = new Set(snapshots.map((s) => `${s.publicId}.json`))
  for (const f of onDiskFiles) {
    if (!expectedFiles.has(f)) errors.push(`orphan entry file in output: entries/${f}`)
  }
  const indexIds = new Set((index.entries || []).map((e) => e.publicId))
  for (const e of expectedEntries) {
    const fp = join(entriesDir, `${e.publicId}.json`)
    if (!existsSync(fp)) {
      errors.push(`missing entry file: entries/${e.publicId}.json`)
      continue
    }
    let disk
    try {
      disk = JSON.parse(readFileSync(fp, 'utf8'))
    } catch (err) {
      errors.push(`entries/${e.publicId}.json unparseable: ${err.message}`)
      continue
    }
    if (JSON.stringify(disk) !== JSON.stringify(e)) {
      errors.push(`entries/${e.publicId}.json content inconsistent with snapshot (tampered or stale)`)
    }
    if (disk.generationHash !== e.generationHash) {
      errors.push(`entries/${e.publicId}.json generationHash mismatch`)
    }
    // independent scan of the on-disk file, so tampered media/leaks are
    // reported even when the consistency check already failed
    for (const l of findLeaks(disk)) errors.push(`entries/${e.publicId}.json: leak ${l.label} at ${l.path}`)
    for (const m of disk.media || []) {
      if (!isStableMediaUrl(m.publicUrl, mediaHost)) {
        errors.push(`entries/${e.publicId}.json: unstable media URL ${JSON.stringify(m.publicUrl)}`)
      }
    }
    if (!indexIds.has(e.publicId)) {
      errors.push(`index.json missing publicId ${e.publicId} listed in published snapshots`)
    }
  }
  for (const id of indexIds) {
    if (!seen.has(id)) errors.push(`index.json lists publicId ${id} with no published snapshot`)
  }

  // 7. leakage scan on the output tree
  const scanTargets = []
  try {
    scanTargets.push({ name: 'index.json', data: index })
    for (const e of expectedEntries) {
      scanTargets.push({ name: `entries/${e.publicId}.json`, data: e })
    }
  } catch { /* ignore */ }
  for (const { name, data } of scanTargets) {
    for (const l of findLeaks(data)) errors.push(`${name}: leak ${l.label} at ${l.path}`)
  }

  if (errors.length === 0) log(`[OK] public content check passed (${snapshots.length} entries)`)
  else for (const e of errors) log(`[FAIL] ${e}`)
  return { ok: errors.length === 0, errors }
}

// local wrapper so the checker validates snapshots without throwing on first error
function validateSnapshotPublic(snapshot, mediaHost) {
  try {
    deriveEntryView(snapshot, mediaHost)
    return []
  } catch (e) {
    return [e.message]
  }
}

/** Recursively collect relative file paths under a directory ([] if absent). */
function listFilesRecursive(dir) {
  if (!existsSync(dir)) return []
  const out = []
  const walk = (d, prefix) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${f.name}` : f.name
      if (f.isDirectory()) walk(join(d, f.name), rel)
      else out.push(rel)
    }
  }
  walk(dir, '')
  return out.sort()
}

// CLI entry
const isMain = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/')
if (isMain) {
  const { resolve } = await import('node:path')
  const root = resolve(import.meta.dirname, '..', '..')
  const r = checkPublicContent({
    publishedDir: join(root, 'content', 'published'),
    outDir: join(root, 'public', 'data', 'content'),
    log: (m) => console.log(m),
  })
  if (!r.ok) process.exit(1)
}
