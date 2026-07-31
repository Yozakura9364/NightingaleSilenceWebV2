// build-public-content.mjs — T038 [US2]
// Generates public/data/content/index.json and entries/<publicId>.json from
// the tracked content/published/ snapshot directory.
//
// Guarantees:
// - only content.publication.v1 snapshots are read; drafts/archives cannot leak
// - stable ascending publicId ordering, deterministic JSON output
// - media URL / base64 / local-path validation before anything is published
// - atomic directory swap with last-known-good: on any failure the previous
//   output tree stays untouched and no .tmp staging dir is left behind
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  loadSnapshots,
  deriveEntryView,
  deriveIndexView,
  DEFAULT_MEDIA_HOST,
} from './lib/public-content-core.mjs'

export function buildPublicContent({ publishedDir, outDir, mediaHost = DEFAULT_MEDIA_HOST, log = () => {} }) {
  let snapshots
  try {
    snapshots = loadSnapshots(publishedDir)
  } catch (e) {
    return { ok: false, error: `cannot read snapshots: ${e.message}` }
  }

  // reject duplicate publicId early (route uniqueness)
  const seen = new Set()
  for (const s of snapshots) {
    if (seen.has(s.publicId)) {
      return { ok: false, error: `duplicate publicId ${s.publicId} in published/` }
    }
    seen.add(s.publicId)
  }
  snapshots.sort((a, b) => a.publicId - b.publicId)

  // derive + validate every entry before touching the output tree
  const entries = []
  for (const s of snapshots) {
    try {
      entries.push(deriveEntryView(s, mediaHost))
    } catch (e) {
      return { ok: false, error: `snapshot ${s.publicId}.json invalid: ${e.message}` }
    }
  }
  const index = deriveIndexView(snapshots)

  // stage into a sibling temp dir, then atomically swap
  const parent = join(outDir, '..')
  const tmpDir = join(parent, `content.tmp-${process.pid}-${randomBytes(4).toString('hex')}`)
  const backupDir = join(parent, `content.bak-${process.pid}-${randomBytes(4).toString('hex')}`)
  try {
    mkdirSync(join(tmpDir, 'entries'), { recursive: true })
    for (const e of entries) {
      writeFileSync(join(tmpDir, 'entries', `${e.publicId}.json`), JSON.stringify(e, null, 2) + '\n', 'utf8')
    }
    writeFileSync(join(tmpDir, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8')

    // last-known-good swap: keep the old tree recoverable until the new one is live
    if (existsSync(outDir)) {
      renameSync(outDir, backupDir)
    }
    try {
      renameSync(tmpDir, outDir)
    } catch (e) {
      // restore previous output, drop staging
      if (existsSync(backupDir)) renameSync(backupDir, outDir)
      rmSync(tmpDir, { recursive: true, force: true })
      return { ok: false, error: `cannot activate output tree: ${e.message}` }
    }
    try {
      rmSync(backupDir, { recursive: true, force: true })
    } catch (e) {
      // new tree is already live; a leftover backup is a checker-detected
      // residual, not a build failure
      log(`[WARN] could not remove previous output backup: ${e.message}`)
    }
    log(`[OK] generated ${entries.length} public entr${entries.length === 1 ? 'y' : 'ies'} -> ${outDir}`)
    return { ok: true, publicIds: entries.map((e) => e.publicId) }
  } catch (e) {
    rmSync(tmpDir, { recursive: true, force: true })
    return { ok: false, error: `build failed: ${e.message}` }
  }
}

// CLI entry
const isMain = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/')
if (isMain) {
  const { resolve } = await import('node:path')
  const root = resolve(import.meta.dirname, '..', '..')
  const r = buildPublicContent({
    publishedDir: join(root, 'content', 'published'),
    outDir: join(root, 'public', 'data', 'content'),
    log: (m) => console.log(m),
  })
  if (!r.ok) {
    console.error(`[FAIL] ${r.error}`)
    process.exit(1)
  }
}
