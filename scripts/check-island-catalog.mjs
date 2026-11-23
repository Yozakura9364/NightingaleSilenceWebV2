// 无人岛公开数据 checker：校验 public/data/ffxiv/island/ 全部产物的
// 结构、名称回退、id 唯一性与 provenance 边界（无本机路径）。
import { readFile } from 'node:fs/promises'

const DATA_DIR = process.env.ISLAND_DATA_DIR || new URL('../public/data/ffxiv/island/', import.meta.url)

const REQUIRED_FILES = [
  'island-sources.json',
  'materials.json',
  'workshop.json',
  'weekly.json',
  'animals.json',
  'crops.json',
  'buildings.json',
  'ranks.json',
  'shop.json',
  'rewards.json',
  'achievements.json',
  'granary.json'
]

const SCHEMA_VERSIONS = {
  'island-sources.json': 'ffxiv.island.sources.v1',
  'materials.json': 'ffxiv.island.materials.v1',
  'workshop.json': 'ffxiv.island.workshop.v1',
  'weekly.json': 'ffxiv.island.weekly.v1',
  'animals.json': 'ffxiv.island.animals.v1',
  'crops.json': 'ffxiv.island.crops.v1',
  'buildings.json': 'ffxiv.island.buildings.v1',
  'ranks.json': 'ffxiv.island.ranks.v1',
  'shop.json': 'ffxiv.island.shop.v1',
  'rewards.json': 'ffxiv.island.rewards.v1',
  'achievements.json': 'ffxiv.island.achievements.v1',
  'granary.json': 'ffxiv.island.granary.v1'
}

const ALLOWED_LOCALES = new Set(['zh', 'en', 'ja', 'ko', 'tc', 'fr', 'de'])

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function checkEnvelope(name, data) {
  assert(data?.version === 1, `${name}: invalid version`)
  assert(data?.schemaVersion === SCHEMA_VERSIONS[name], `${name}: unexpected schemaVersion`)
  assert(typeof data?.source?.url === 'string' && data.source.url, `${name}: missing source.url`)
  assert(Array.isArray(data.source.locales) && data.source.locales.includes('zh'), `${name}: zh primary locale required`)
  assert(typeof data.generatedAt === 'string' && data.generatedAt, `${name}: missing generatedAt`)
}

function checkNoLocalPaths(name, value, trail = '') {
  if (typeof value === 'string') {
    assert(
      !/(?:[A-Za-z]:\\|\/(?:home|Users|tmp)\/|file:\/\/)/.test(value),
      `${name}: provenance must not contain machine paths (${trail})`
    )
    return
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => checkNoLocalPaths(name, entry, `${trail}[${index}]`))
    return
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      checkNoLocalPaths(name, entry, trail ? `${trail}.${key}` : key)
    }
  }
}

function checkNames(name, names, owner) {
  assert(names && typeof names === 'object' && !Array.isArray(names), `${name}: invalid names on ${owner}`)
  for (const [locale, value] of Object.entries(names)) {
    assert(ALLOWED_LOCALES.has(locale), `${name}: unknown locale ${locale} on ${owner}`)
    assert(typeof value === 'string' && value.trim(), `${name}: empty name for ${locale} on ${owner}`)
  }
}

function checkList(name, field, rows, { requireNames = true, idField = 'id' } = {}) {
  assert(Array.isArray(rows) && rows.length > 0, `${name}: ${field} must be a non-empty array`)
  const seen = new Set()
  for (const row of rows) {
    const id = String(row?.[idField] ?? '').trim()
    assert(id, `${name}: ${field} entry missing ${idField}`)
    assert(!seen.has(id), `${name}: duplicate ${field} id ${id}`)
    seen.add(id)
    if (requireNames) {
      checkNames(name, row.names, `${field} ${id}`)
      assert(typeof row.name === 'string' && row.name, `${name}: ${field} ${id} missing display name`)
    }
  }
  return seen
}

function checkMaterialRef(name, entry, owner) {
  assert(typeof entry.amount === 'number' && entry.amount > 0, `${name}: invalid material amount on ${owner}`)
  checkNames(name, entry.names, `${owner} material`)
}

const files = {}
for (const name of REQUIRED_FILES) {
  files[name] = JSON.parse(await readFile(new URL(name, DATA_DIR), 'utf8'))
  checkEnvelope(name, files[name])
  checkNoLocalPaths(name, files[name].source)
}

const sources = files['island-sources.json']
assert(
  sources.files && Object.keys(sources.files).length >= 1,
  'island-sources.json: missing per-locale file provenance'
)
for (const [locale, sheets] of Object.entries(sources.files)) {
  assert(ALLOWED_LOCALES.has(locale), `island-sources.json: unknown locale ${locale}`)
  assert(Object.keys(sheets).length >= 20, `island-sources.json: ${locale} provenance looks incomplete`)
  checkNoLocalPaths('island-sources.json', sheets, `files.${locale}`)
}

const materials = files['materials.json']
checkList('materials.json', 'materials', materials.materials)
checkList('materials.json', 'tools', materials.tools)
checkList('materials.json', 'categories', materials.categories)
checkList('materials.json', 'manualRecipes', materials.manualRecipes, { requireNames: false })
for (const recipe of materials.manualRecipes) {
  assert(
    recipe.product || (Array.isArray(recipe.materials) && recipe.materials.length),
    `materials.json: manual recipe ${recipe.id} has neither product nor materials`
  )
  if (recipe.product) {
    checkNames('materials.json', recipe.product.names, `manualRecipe ${recipe.id} product`)
  }
  for (const material of recipe.materials ?? []) {
    checkMaterialRef('materials.json', material, `manualRecipe ${recipe.id}`)
  }
}

const workshop = files['workshop.json']
const productIds = checkList('workshop.json', 'products', workshop.products)
for (const product of workshop.products) {
  assert(Number.isFinite(product.hours) && product.hours > 0, `workshop.json: invalid hours on ${product.id}`)
  assert(Number.isFinite(product.value) && product.value > 0, `workshop.json: invalid value on ${product.id}`)
  assert(Array.isArray(product.themeIds) && product.themeIds.length > 0, `workshop.json: missing themes on ${product.id}`)
  for (const material of product.materials ?? []) {
    checkMaterialRef('workshop.json', material, `product ${product.id}`)
  }
}
checkList('workshop.json', 'themes', workshop.themes)
checkList('workshop.json', 'popularityTypes', workshop.popularityTypes, { requireNames: false })
checkList('workshop.json', 'supplyDefines', workshop.supplyDefines, { requireNames: false })
checkList('workshop.json', 'rankRatios', workshop.rankRatios, { requireNames: false })
assert(workshop.popularityTypes.length === 4, 'workshop.json: expected 4 popularity levels')
for (const level of workshop.popularityTypes) {
  assert(Number.isFinite(level.ratio) && level.ratio > 0, `workshop.json: invalid popularity ratio ${level.id}`)
}

const weekly = files['weekly.json']
assert(Array.isArray(weekly.rotation) && weekly.rotation.length === 100, 'weekly.json: rotation must have 100 rows')
const rotationIds = new Set()
for (const row of weekly.rotation) {
  assert(String(row.id).trim(), 'weekly.json: rotation row missing id')
  assert(!rotationIds.has(row.id), `weekly.json: duplicate rotation row ${row.id}`)
  rotationIds.add(row.id)
  for (const [productId, value] of Object.entries(row.values)) {
    assert(productIds.has(productId), `weekly.json: rotation row ${row.id} references unknown product ${productId}`)
    assert(value >= 1 && value <= 4, `weekly.json: invalid popularity value on row ${row.id} product ${productId}`)
  }
}

const animals = files['animals.json']
checkList('animals.json', 'animals', animals.animals, { requireNames: false })
let namedAnimals = 0
let spawnedAnimals = 0
for (const animal of animals.animals) {
  assert(Number.isFinite(animal.size) && animal.size >= 1, `animals.json: invalid size on ${animal.id}`)
  if (animal.name) {
    namedAnimals += 1
    checkNames('animals.json', animal.names, `animal ${animal.id}`)
  }
  for (const reward of animal.rewards ?? []) {
    checkNames('animals.json', reward.names, `animal ${animal.id} reward`)
  }
  if (animal.spawn) {
    spawnedAnimals += 1
    assert(Number.isFinite(animal.spawn.x) && Number.isFinite(animal.spawn.y), `animals.json: invalid spawn coords on ${animal.id}`)
    if (animal.spawn.weather) {
      assert(Number.isFinite(animal.spawn.weather.id) && animal.spawn.weather.id >= 1, `animals.json: invalid weather id on ${animal.id}`)
      checkNames('animals.json', animal.spawn.weather.names, `animal ${animal.id} weather`)
    }
    if (animal.spawn.spawnHour !== undefined) {
      assert(Number.isFinite(animal.spawn.spawnHour) && animal.spawn.spawnHour >= 0 && animal.spawn.spawnHour <= 23, `animals.json: invalid spawn hour on ${animal.id}`)
      assert(Number.isFinite(animal.spawn.durationHours) && animal.spawn.durationHours >= 1, `animals.json: invalid spawn duration on ${animal.id}`)
    }
  }
}
assert(namedAnimals >= 1, `animals.json: no named animals (name bridge broken?)`)
assert(
  spawnedAnimals === animals.animals.length,
  `animals.json: only ${spawnedAnimals}/${animals.animals.length} animals have spawn coords (spawn bridge broken?)`
)

const crops = files['crops.json']
assert(Array.isArray(crops.crops) && crops.crops.length > 0, 'crops.json: crops must be a non-empty array')
{
  const seen = new Set()
  for (const crop of crops.crops) {
    const id = String(crop?.id ?? '').trim()
    assert(id && !seen.has(id), `crops.json: invalid or duplicate crop id ${id}`)
    seen.add(id)
    assert(String(crop.seedItemId ?? '').trim(), `crops.json: crop ${id} missing seed item id`)
    assert(typeof crop.seedName === 'string' && crop.seedName, `crops.json: crop ${id} missing seed name`)
    checkNames('crops.json', crop.seedNames, `crop ${id} seed`)
    assert(crop.crop && String(crop.crop.itemId ?? '').trim(), `crops.json: crop ${id} missing produce item`)
    assert(crop.crop.itemId !== crop.seedItemId, `crops.json: crop ${id} seed and produce ids must differ`)
    checkNames('crops.json', crop.crop.names, `crop ${id} produce`)
  }
}
const buildings = files['buildings.json']
checkList('buildings.json', 'buildings', buildings.buildings)
checkList('buildings.json', 'landmarks', buildings.landmarks)
for (const structure of [...buildings.buildings, ...buildings.landmarks]) {
  assert(Array.isArray(structure.materials) && structure.materials.length > 0, `buildings.json: ${structure.id} has no materials`)
  for (const material of structure.materials) {
    checkMaterialRef('buildings.json', material, `structure ${structure.id}`)
  }
}

const ranks = files['ranks.json']
checkList('ranks.json', 'ranks', ranks.ranks, { idField: 'rank', requireNames: false })
for (const rank of ranks.ranks) {
  assert(Number.isFinite(rank.rank) && rank.rank >= 1, 'ranks.json: invalid rank number')
}
checkList('ranks.json', 'progress', ranks.progress, { requireNames: false })
for (const step of ranks.progress) {
  assert(typeof step.objective === 'string' && step.objective, `ranks.json: progress ${step.id} missing objective`)
  checkNames('ranks.json', step.names.objective, `progress ${step.id}`)
}
for (const [rank, entries] of Object.entries(ranks.unlocks ?? {})) {
  for (const entry of entries) {
    if (entry.kind === 'feature') {
      continue
    }
    assert(typeof entry.name === 'string' && entry.name, `ranks.json: rank ${rank} ${entry.kind} unlock missing name`)
    checkNames('ranks.json', entry.names, `rank ${rank} ${entry.kind} unlock`)
  }
}

const shop = files['shop.json']
checkList('shop.json', 'items', shop.items)
const categoryIds = new Set(shop.categories.map((category) => category.id))
for (const item of shop.items) {
  assert(Number.isFinite(item.price) && item.price > 0, `shop.json: invalid price on ${item.id}`)
  assert(categoryIds.has(item.categoryId), `shop.json: unknown category ${item.categoryId} on ${item.id}`)
}

const rewards = files['rewards.json']
assert(Array.isArray(rewards.shops) && rewards.shops.length > 0, 'rewards.json: shops must be a non-empty array')
{
  const shopIds = new Set()
  for (const group of rewards.shops) {
    assert(String(group.shopId).trim(), 'rewards.json: shop missing shopId')
    assert(!shopIds.has(group.shopId), `rewards.json: duplicate shopId ${group.shopId}`)
    shopIds.add(group.shopId)
    checkList('rewards.json', `shop ${group.shopId} items`, group.items)
    for (const item of group.items) {
      assert(Number.isFinite(item.price) && item.price > 0, `rewards.json: invalid price on ${item.id}`)
      if (item.currency) {
        checkNames('rewards.json', item.currency.names, `${item.id} currency`)
      }
    }
  }
}

const cropSeedItemIds = new Set(crops.crops.map((crop) => crop.seedItemId))
const seedShopIds = new Set(['1770604', '1770643', '1770662', '1770709'])
for (const group of rewards.shops.filter((entry) => seedShopIds.has(entry.shopId))) {
  for (const item of group.items) {
    assert(cropSeedItemIds.has(item.itemId), `rewards.json: seed ${item.itemId} has no crop unlock mapping`)
  }
}

const achievements = files['achievements.json']
checkList('achievements.json', 'achievements', achievements.achievements, { requireNames: false })
for (const achievement of achievements.achievements) {
  checkNames('achievements.json', achievement.names, `achievement ${achievement.id}`)
  checkNames('achievements.json', achievement.descriptions, `achievement ${achievement.id} description`)
  if (achievement.title) {
    checkNames('achievements.json', achievement.title.names, `achievement ${achievement.id} title`)
  }
  for (const link of achievement.unlockedItems ?? []) {
    assert(String(link.shopId).trim() && String(link.itemId).trim(), `achievements.json: invalid unlock link on ${achievement.id}`)
  }
}

const granary = files['granary.json']
assert(Array.isArray(granary.destinations) && granary.destinations.length > 0, 'granary.json: destinations must be a non-empty array')
{
  const areas = new Set()
  for (const destination of granary.destinations) {
    assert(Number.isFinite(destination.area) && destination.area >= 1, 'granary.json: invalid area')
    assert(!areas.has(destination.area), `granary.json: duplicate area ${destination.area}`)
    areas.add(destination.area)
    checkNames('granary.json', destination.areaNames, `granary area ${destination.area}`)
    assert(Array.isArray(destination.rareMaterials) && destination.rareMaterials.length > 0, `granary.json: area ${destination.area} has no rare materials`)
    for (const ref of [...destination.rareMaterials, ...destination.materials]) {
      checkNames('granary.json', ref.names, `granary area ${destination.area} material`)
    }
  }
}

console.log(
  `Checked island catalog: ${materials.materials.length} materials, ${workshop.products.length} products, ` +
    `${weekly.rotation.length} rotation rows, ${animals.animals.length} animals, ${crops.crops.length} crops, ` +
    `${buildings.buildings.length} buildings, ${buildings.landmarks.length} landmarks, ${ranks.ranks.length} ranks, ` +
    `${shop.items.length} shop items, ${files['rewards.json'].shops.length} reward shops, ` +
    `${files['achievements.json'].achievements.length} achievements, ${files['granary.json'].destinations.length} granary areas`
)
