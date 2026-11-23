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

test('shared dye facts refresh from Stain while preserving manual value categories', async (t) => {
  const f = await fixture(t)
  const text = 'key,0,1,2,3\n#,Name,Color,Shade,SubOrder\nint32,str,uint32,byte,byte\n1,New red,16711680,4,2\n2,New blue,255,9,3\n'
  await writeFile(path.join(f.root, 'csv/chs/Stain.csv'), text)
  f.manifest.sources.push({ locale: 'chs', sheet: 'Stain', path: 'csv/chs/Stain.csv', sha256: sha256(text), repository: 'local', revision: '', url: '' })
  f.manifest.batch_id = sha256(canonicalJson(f.manifest.sources))
  await writeFile(f.manifestPath, JSON.stringify(f.manifest))
  const baseline = path.join(f.root, 'baseline.json')
  await writeFile(baseline, JSON.stringify({ schemaVersion: 'ffxiv.dyeCatalog.v1', dyes: {
    1: { dyeId: 1, name: 'Old', color: '#000000', valueCategory: 'extra2' },
    8: { dyeId: 8, name: 'Missing upstream', valueCategory: 'general' }
  } }))
  const output = path.join(f.root, 'dyes.json')
  run(f, 'scripts/build-ffxiv-dye-catalog.mjs', ['--source-batch', f.manifestPath, '--baseline', baseline, '--output', output])
  const result = JSON.parse(await readFile(output, 'utf8'))
  assert.equal(result.dyes[1].name, 'New red')
  assert.equal(result.dyes[1].color, '#FF0000')
  assert.equal(result.dyes[1].valueCategory, 'extra2')
  assert.equal(result.dyes[8].valueCategory, 'general')
  assert.deepEqual(result.source.missing_stain_ids, [8])
  assert.deepEqual(result.source.manual_category_missing, [2])
  assert.equal(result.source.source_batch_id, f.manifest.batch_id)
})

const islandSheets = (locale) => ({
  MJIRank: `key,0\n#,ExpToNext\nint32,uint32\n1,900\n2,1300\n3,1700\n`,
  MJIProgress: `key,0,1,2\n#,Vision,Objective,PreviousObjective\nint32,str,str,str\n1,Vision-${locale},Objective-${locale},\n2,Vision2-${locale},Objective2-${locale},\n`,
  MJIItemPouch: `key,0,1,2,3\n#,Item,Category,Crop,Sort\nint32,Item,MJIItemCategory,MJICropSeed,byte\n0,37551,1,0,0\n2,37585,2,1,2\n`,
  MJIItemCategory: `key,0,1\n#,Singular,Plural\nint32,str,str\n1,Materials-${locale},Materials-${locale}\n2,Produce-${locale},Produce-${locale}\n`,
  MJIGatheringItem: `key,0,1,2,3,4,5,6\n#,Item,Sort,Tool,X,Y,Radius,Map\nint32,Item,byte,MJIGatheringTool,int16,int16,uint16,byte\n1,37551,0,1,20,0,100,0\n`,
  MJIGatheringTool: `key,0\n#,Item\nint32,MJIKeyItem\n1,1\n`,
  MJIRecipe: `key,0,1,2,3\n#,KeyItem,ItemPouch,Material[0],Amount[0]\nint32,MJIKeyItem,MJIItemPouch,MJIRecipeMaterial,byte\n1,1,0,1,2\n`,
  MJIRecipeMaterial: `key,0\n#,ItemPouch\nint32,MJIItemPouch\n1,0\n`,
  MJIKeyItem: `key,0,1\n#,Item,Sort\nint32,Item,byte\n1,37679,1\n`,
  MJICraftworksObject: `key,0,1,2,3,4,5,6,7\n#,Item,Theme[0],Theme[1],Material[0],Amount[0],LevelReq,CraftingTime,Value\nint32,Item,MJICraftworksObjectTheme,MJICraftworksObjectTheme,MJIItemPouch,uint16,uint16,uint16,uint16\n1,37628,1,0,0,2,1,4,28\n`,
  MJICraftworksObjectTheme: `key,0\n#,Name\nint32,str\n1,Theme-${locale}\n`,
  MJICraftworksPopularity: Array.from({ length: 101 }, (_, row) => row === 0 ? 'key,0,1\n#,Popularity[0],Popularity[1]\nint32,int32,int32' : `${row - 1},${(row % 4) + 1},${((row + 1) % 4) + 1}`).join('\n') + '\n',
  MJICraftworksPopularityType: `key,0\n#,Ratio\nint32,uint16\n1,140\n2,120\n3,100\n4,80\n`,
  MJICraftworksSupplyDefine: `key,0,1\n#,Supply,Ratio\nint32,int16,uint16\n1,10,130\n2,2,100\n`,
  MJICraftworksRankRatio: `key,0\n#,Ratio\nint32,uint16\n1,100\n2,110\n`,
  MJICraftworksTension: `key,0\n#,Bonus\nint32,byte\n1,15\n2,20\n`,
  MJIAnimals: `key,0,1,2,3,4,5,6\n#,BNpcBase,Size,Rarity,Sort,Reward[0],Reward[1],Icon\nint32,BNpcBase,byte,byte,byte,Item,Item,Image\n1,14906,1,1,1,37603,0,0\n`,
  MJIBuilding: `key,0,1,2\n#,Material[0],Amount[0],Name\nint32,MJIItemPouch,byte,MJIText\n0.1,0,10,2\n`,
  MJILandmark: `key,0,1,2\n#,Material[0],Amount[0],Name\nint32,MJIItemPouch,byte,MJIText\n1,0,10,3\n`,
  MJICropSeed: `key,0,1,2\n#,Item,SGB,Name\nint32,Item,ExportedSG,EObjName\n1,37595,0,50\n`,
  MJIDisposalShopItem: `key,0,1,2,3,4\n#,Item,Currency,Count,Category,Sort\nint32,MJIItemPouch,byte,uint16,MJIDisposalShopUICategory,byte\n0,0,0,3,0,0\n`,
  MJIDisposalShopUICategory: `key,0\n#,Category\nint32,str\n0,ShopCategory-${locale}\n`,
  MJIText: `key,0\n#,Text\nint32,str\n2,Cabin-${locale}\n3,Landmark-${locale}\n39,草原-${locale}\n40,溪流-${locale}\n41,森林-${locale}\n42,沙滩-${locale}\n43,山-${locale}\n71,洞窟-${locale}\n`,
  MJIStockyardManagementArea: `key,0,1,2\n#,Rare Material,,Area\nint32,MJIItemPouch,byte,MJIText\n0,0,0,1\n`,
  MJIStockyardManagementTable: `key,0\n#,Material\nint32,MJIItemPouch\n0.0,0\n`,
  EObjName: `key,0\n#,Singular\nint32,str\n50,CropField-${locale}\n`,
  BNpcName: `key,0\n#,Singular\nint32,str\n392,Lamb-${locale}\n`,
  Weather: `key,0\n#,Name\nint32,str\n2,FairWeather-${locale}\n8,Showers-${locale}\n`,
  SpecialShop: `key,0,1,2,3,4,5\n#,Name,Item{Receive}[0][0],Item{Cost}[0][0],Count{Cost}[0][0],AchievementUnlock[0],PatchNumber[0]\nint32,str,Item,Item,uint32,uint32,uint32\n1770601,"",37628,37549,24000,3089,620\n1770604,"",37585,37549,2,0,620\n`,
  Achievement: `key,0,1,2,3,4,5,6,7\n#,AchievementCategory,Name,Description,Unknown0,Unknown1,Points,Title,Unknown3\nint32,int32,str,str,byte,byte,uint16,uint16,uint32\n3089,12,无人岛的资深开拓者,在开拓无人岛的开拓等级升到10级。,0,0,10,645,0\n`,
  Title: `key,0,1,2,3\n#,Masculine,Feminine,IsPrefix,Order\nint32,str,str,bit&01,uint16\n645,无人岛开拓者,无人岛开拓者,False,0\n`,
  Item: `key,0,1\n#,Singular,Name\nint32,str,str\n37551,PalmLeaf,棕榈叶-${locale}\n37585,Seed,种子-${locale}\n37595,Produce,作物-${locale}\n37603,Milk,乳汁-${locale}\n37628,Potion,药水-${locale}\n37679,Axe,斧头-${locale}\n`
})

async function islandFixture(t) {
  const f = await fixture(t)
  const existing = new Map(f.manifest.sources.map((record) => [`${record.locale}/${record.sheet}`, record]))
  for (const locale of locales) {
    for (const [sheet, text] of Object.entries(islandSheets(locale))) {
      const relative = `csv/${locale}/${sheet}.csv`
      await mkdir(path.dirname(path.join(f.root, relative)), { recursive: true })
      await writeFile(path.join(f.root, relative), text)
      const key = `${locale}/${sheet}`
      if (existing.has(key)) {
        existing.get(key).sha256 = sha256(text)
      } else {
        const record = { locale, sheet, path: relative, sha256: sha256(text), repository: 'local', revision: '', url: '' }
        f.manifest.sources.push(record)
        existing.set(key, record)
      }
    }
  }
  f.manifest.sources.sort((a, b) => `${a.locale}/${a.sheet}`.localeCompare(`${b.locale}/${b.sheet}`, 'en'))
  f.manifest.batch_id = sha256(canonicalJson(f.manifest.sources))
  await writeFile(f.manifestPath, JSON.stringify(f.manifest))
  return f
}

test('Island catalog builds all slices from the fixed batch and passes the checker', async (t) => {
  const f = await islandFixture(t)
  const output = path.join(f.root, 'island-out')
  run(f, 'scripts/build-island-catalog.mjs', ['--source-batch', f.manifestPath, '--output', output])
  const materials = JSON.parse(await readFile(path.join(output, 'materials.json'), 'utf8'))
  assert.equal(materials.materials.length, 2)
  assert.equal(materials.materials[0].names.zh, '棕榈叶-chs')
  assert.equal(materials.materials[0].names.ko, '棕榈叶-ko')
  assert.equal(materials.materials[0].tool.name, '斧头-chs')
  assert.equal(materials.tools[0].itemId, '37679')
  const workshop = JSON.parse(await readFile(path.join(output, 'workshop.json'), 'utf8'))
  assert.equal(workshop.products.length, 1)
  assert.equal(workshop.products[0].names.zh, '药水-chs')
  assert.equal(workshop.themes[0].names.zh, 'Theme-chs')
  assert.deepEqual(workshop.popularityTypes.map((level) => level.ratio), [140, 120, 100, 80])
  const weekly = JSON.parse(await readFile(path.join(output, 'weekly.json'), 'utf8'))
  assert.equal(weekly.rotation.length, 100)
  assert.equal(weekly.rotation[0].values['1'], 3)
  const animals = JSON.parse(await readFile(path.join(output, 'animals.json'), 'utf8'))
  assert.equal(animals.animals.length, 1)
  assert.equal(animals.animals[0].names.zh, 'Lamb-chs')
  assert.equal(animals.animals[0].rewards[0].names.zh, '乳汁-chs')
  const buildings = JSON.parse(await readFile(path.join(output, 'buildings.json'), 'utf8'))
  assert.equal(buildings.buildings[0].names.zh, 'Cabin-chs')
  assert.equal(buildings.landmarks[0].names.en, 'Landmark-en')
  const crops = JSON.parse(await readFile(path.join(output, 'crops.json'), 'utf8'))
  assert.equal(crops.crops[0].seedItemId, '37585')
  assert.equal(crops.crops[0].seedNames.zh, '种子-chs')
  assert.equal(crops.crops[0].seedUnlockRank, 7)
  assert.equal(crops.crops[0].crop.itemId, '37595')
  assert.equal(crops.crops[0].crop.names.zh, '作物-chs')
  assert.equal(crops.crops[0].fieldNames.zh, 'CropField-chs')
  const ranks = JSON.parse(await readFile(path.join(output, 'ranks.json'), 'utf8'))
  assert.equal(ranks.ranks.length, 3)
  assert.equal(ranks.progress[0].names.objective.ja, 'Objective-ja')
  const rank7Seed = ranks.unlocks['7'].find((entry) => entry.kind === 'seed' && entry.name === '种子-chs')
  assert.equal(rank7Seed.names.ko, '种子-ko')
  const shop = JSON.parse(await readFile(path.join(output, 'shop.json'), 'utf8'))
  assert.equal(shop.items[0].names.zh, '棕榈叶-chs')
  assert.equal(shop.categories[0].names.zh, 'ShopCategory-chs')
  const rewards = JSON.parse(await readFile(path.join(output, 'rewards.json'), 'utf8'))
  assert.equal(rewards.shops.length, 2)
  assert.equal(rewards.shops[0].items[0].price, 24000)
  assert.equal(rewards.shops[0].items[0].achievementUnlock, '3089')
  const achievements = JSON.parse(await readFile(path.join(output, 'achievements.json'), 'utf8'))
  assert.equal(achievements.achievements.length, 1)
  assert.equal(achievements.achievements[0].title.name, '无人岛开拓者')
  assert.deepEqual(achievements.achievements[0].unlockedItems, [{ shopId: '1770601', itemId: '37628' }])
  const granary = JSON.parse(await readFile(path.join(output, 'granary.json'), 'utf8'))
  assert.equal(granary.destinations.length, 1)
  assert.equal(granary.destinations[0].rareMaterials[0].names.zh, '棕榈叶-chs')
  assert.equal(granary.destinations[0].materials.length, 1)
  for (const name of ['materials', 'workshop', 'weekly', 'animals', 'crops', 'buildings', 'ranks', 'shop', 'rewards', 'achievements', 'granary', 'island-sources']) {
    const payload = JSON.stringify(JSON.parse(await readFile(path.join(output, `${name}.json`), 'utf8')))
    assert.ok(!payload.includes(f.root), `${name}.json leaked machine paths`)
  }
  const sources = JSON.parse(await readFile(path.join(output, 'island-sources.json'), 'utf8'))
  assert.equal(sources.source.source_batch_id, f.manifest.batch_id)
  execFileSync(process.execPath, ['--import', pathToFileURL(f.preload).href, path.join(projectRoot, 'scripts/check-island-catalog.mjs')], {
    encoding: 'utf8',
    cwd: projectRoot,
    timeout: 10000,
    stdio: 'pipe',
    env: { ...process.env, ISLAND_DATA_DIR: pathToFileURL(`${output}${path.sep}`).href }
  })
})

test('Island catalog fails before writing when a dependency sheet is missing', async (t) => {
  const f = await islandFixture(t)
  await rm(path.join(f.root, 'csv/ko/MJICraftworksPopularity.csv'))
  const output = path.join(f.root, 'island-out')
  assert.throws(() => run(f, 'scripts/build-island-catalog.mjs', ['--source-batch', f.manifestPath, '--output', output]), /Missing/)
  await assert.rejects(readFile(path.join(output, 'materials.json')))
})
