import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { loadGameDataBatch, canonicalJson } from '../scripts/lib/game-data-batch.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const locales = ['chs', 'en', 'ja', 'ko', 'tc', 'fr', 'de']
const csv = 'key,0,1\n#,Name,Icon\nint32,str,int32\n1,Test,123\n'
const emoteCsv = 'key,0,1,2\n#,Name,Icon,EmoteCategory\nint32,str,int32,int32\n1,Wave,123,2\n'
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'v2-game-batch-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const records = []
  for (const locale of locales) {
    const sheets = ['Emote']
    if (['chs', 'en', 'ja', 'ko'].includes(locale)) {
      sheets.push('Item', 'FashionCheckThemeCategory', 'FashionCheckWeeklyTheme')
    }
    for (const sheet of sheets) {
      const relative = `csv/${locale}/${sheet}.csv`
      const text = sheet === 'Emote' ? emoteCsv.replace('Wave', `Wave-${locale}`) : csv
      await mkdir(path.dirname(path.join(root, relative)), { recursive: true })
      await writeFile(path.join(root, relative), text)
      records.push({ locale, sheet, path: relative, sha256: sha256(text), repository: 'local', revision: '', url: '' })
    }
  }
  records.sort((a, b) => `${a.locale}/${a.sheet}`.localeCompare(`${b.locale}/${b.sheet}`, 'en'))
  const manifest = { schema_version: 'nightingale.game-data.v1', batch_id: sha256(canonicalJson(records)), source_mode: 'local', sources: records }
  const manifestPath = path.join(root, 'manifest.json')
  await writeFile(manifestPath, JSON.stringify(manifest))
  const preload = path.join(root, 'offline.mjs')
  await writeFile(preload, `import { createRequire, syncBuiltinESMExports } from 'node:module';\nconst require = createRequire(import.meta.url);\nglobalThis.fetch = async () => { throw new Error('NETWORK_FORBIDDEN') };\nrequire('node:child_process').execFile = (...args) => { args.at(-1)(new Error('NETWORK_FORBIDDEN')) };\nsyncBuiltinESMExports();\n`)
  return { root, manifest, manifestPath, preload }
}

function run(f, script, args = []) {
  return execFileSync(process.execPath, ['--import', pathToFileURL(f.preload).href, path.join(projectRoot, script), ...args], { encoding: 'utf8', cwd: projectRoot, timeout: 10000, stdio: 'pipe' })
}

test('canonical JSON matches the Python manifest contract', () => {
  assert.equal(canonicalJson({ z: ['中文', { b: 2, a: 1 }], a: true }), '{"a":true,"z":["中文",{"a":1,"b":2}]}')
})

test('local manifests cannot forge remote provenance even with a new identity hash', async (t) => {
  const f = await fixture(t)
  f.manifest.sources[0].repository = 'forged/upstream'
  f.manifest.sources[0].revision = 'a'.repeat(40)
  f.manifest.batch_id = sha256(canonicalJson(f.manifest.sources))
  await writeFile(f.manifestPath, JSON.stringify(f.manifest))
  await assert.rejects(loadGameDataBatch({ sourceBatch: f.manifestPath }), /provenance/)
})

test('batch validates actual bytes, required files, and the explicit root', async (t) => {
  const f = await fixture(t)
  const batch = await loadGameDataBatch({ sourceBatch: f.manifestPath, sourceRoot: path.join(f.root, 'csv'), requirements: { chs: ['Emote'] } })
  assert.equal(batch.batchId, f.manifest.batch_id)
  assert.equal(batch.sources.get('chs/Emote').sha256, sha256(emoteCsv.replace('Wave', 'Wave-chs')))
  await assert.rejects(loadGameDataBatch({ sourceBatch: f.manifestPath, sourceRoot: f.root }), /root/i)
  await writeFile(path.join(f.root, 'csv/en/Emote.csv'), 'bad')
  await assert.rejects(loadGameDataBatch({ sourceBatch: f.manifestPath }), /hash/i)
})

test('batch rejects manifest identity, duplicate keys, escaping paths, and missing dependencies', async (t) => {
  const f = await fixture(t)
  for (const kind of ['identity', 'duplicate', 'escape']) {
    const manifest = structuredClone(f.manifest)
    if (kind === 'identity') manifest.batch_id = '0'.repeat(64)
    if (kind === 'duplicate') manifest.sources.push(manifest.sources[0])
    if (kind === 'escape') manifest.sources[0].path = '../secret.csv'
    if (kind !== 'identity') manifest.batch_id = sha256(canonicalJson(manifest.sources))
    await writeFile(f.manifestPath, JSON.stringify(manifest))
    await assert.rejects(loadGameDataBatch({ sourceBatch: f.manifestPath }))
  }
  await writeFile(f.manifestPath, JSON.stringify(f.manifest))
  await assert.rejects(loadGameDataBatch({ sourceBatch: f.manifestPath, requirements: { chs: ['Missing'] } }), /Missing/)
})

test('Emote builds all seven locales from the fixed batch without network', async (t) => {
  const f = await fixture(t)
  const output = path.join(f.root, 'output', 'emotes.json')
  run(f, 'scripts/build-item-card-emotes.mjs', ['--source-batch', f.manifestPath, '--output', output])
  const result = JSON.parse(await readFile(output, 'utf8'))
  assert.equal(result.version, 1)
  assert.equal(result.items.length, 1)
  assert.equal(result.source.source_batch_id, f.manifest.batch_id)
  assert.deepEqual(Object.keys(result.items[0].names).sort(), ['de', 'en', 'fr', 'ja', 'ko', 'tc', 'zh'])
  assert.equal(result.items[0].names.zh, 'Wave-chs')
  assert.equal(result.source.url, 'csv/chs/Emote.csv')
  assert.ok(!JSON.stringify(result).includes(f.root))
})

test('Emote local-root mode rejects missing language or remote overrides before writing', async (t) => {
  const f = await fixture(t)
  const output = path.join(f.root, 'emotes.json')
  await rm(path.join(f.root, 'csv/de/Emote.csv'))
  assert.throws(() => run(f, 'scripts/build-item-card-emotes.mjs', ['--source-root', path.join(f.root, 'csv'), '--output', output]), /Missing/)
  assert.throws(() => run(f, 'scripts/build-item-card-emotes.mjs', ['--source-batch', f.manifestPath, '--source-url', 'zh=https://example.invalid/Emote.csv', '--output', output]))
  await assert.rejects(readFile(output))
})

test('legacy Emote source-file mode records the real local source', async (t) => {
  const f = await fixture(t)
  const output = path.join(f.root, 'emotes.json')
  run(f, 'scripts/build-item-card-emotes.mjs', ['--source-file', `zh=${path.join(f.root, 'csv/chs/Emote.csv')}`, '--output', output])
  const result = JSON.parse(await readFile(output, 'utf8'))
  assert.equal(result.source.url, 'Emote.csv')
  assert.ok(!JSON.stringify(result.source).includes('raw.githubusercontent'))
  assert.ok(!JSON.stringify(result.source).includes(f.root))
})

test('Fashion official inputs copy exact batch bytes and leave the community reference alone', async (t) => {
  const f = await fixture(t)
  const output = path.join(f.root, 'references')
  const tracker = path.join(output, 'community/avantgarde-tracker.csv')
  await mkdir(path.dirname(tracker), { recursive: true })
  await writeFile(tracker, 'keep-community')
  run(f, 'scripts/fashion-check/update-references.mjs', ['--source-batch', f.manifestPath, '--output-dir', output])
  assert.equal(await readFile(path.join(output, 'official/ja/Item.csv'), 'utf8'), csv)
  assert.equal(await readFile(tracker, 'utf8'), 'keep-community')
  const provenance = JSON.parse(await readFile(path.join(output, 'game-data-batch.json'), 'utf8'))
  assert.equal(provenance.source_batch_id, f.manifest.batch_id)
  assert.equal(provenance.sources.length, 12)
  assert.ok(!JSON.stringify(provenance).includes(f.root))
})

test('Fashion validates the whole official set before changing existing output', async (t) => {
  const f = await fixture(t)
  const output = path.join(f.root, 'references')
  const previous = path.join(output, 'official/chs/Item.csv')
  await mkdir(path.dirname(previous), { recursive: true })
  await writeFile(previous, 'keep')
  await writeFile(path.join(f.root, 'csv/ja/FashionCheckWeeklyTheme.csv'), '<html>bad</html>')
  assert.throws(() => run(f, 'scripts/fashion-check/update-references.mjs', ['--source-root', path.join(f.root, 'csv'), '--output-dir', output]), /CSV/)
  assert.equal(await readFile(previous, 'utf8'), 'keep')
})
