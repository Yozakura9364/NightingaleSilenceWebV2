import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../..')
const currentPath = path.join(projectRoot, 'public/data/fashion-check/current.json')
const tagDatabasePath = path.join(projectRoot, 'public/data/fashion-check/tag-database.json')

function invariant(condition, message) {
  if (!condition) throw new Error(message)
}

function getGoldSlot(database, tag, slotId) {
  const matches = database.categories.flatMap((category) => {
    if (String(category.names?.['zh-CN'] ?? '').trim() !== tag) return []

    return category.slots
      .filter((slot) => slot.slotId === slotId)
      .map((slot) => ({ category, slot }))
  })

  invariant(
    matches.length === 1,
    `Expected exactly one category for ${slotId} / ${tag}, found ${matches.length}`
  )
  return matches[0]
}

function getGoldItem(database, itemId, slotId, tag) {
  const item = database.items?.[String(itemId)]
  invariant(item, `Missing Item ${itemId} for ${slotId} / ${tag}`)

  const name = String(item.names?.['zh-CN'] ?? '').trim()
  invariant(name, `Missing zh-CN name for Item ${itemId}`)
  invariant(Number.isInteger(item.iconId) && item.iconId > 0, `Invalid icon for Item ${itemId}`)
  invariant(Number.isInteger(item.rarity) && item.rarity >= 1, `Invalid rarity for Item ${itemId}`)

  return {
    itemId,
    name,
    iconId: item.iconId,
    rarity: item.rarity
  }
}

async function main() {
  const [current, database] = await Promise.all([
    readFile(currentPath, 'utf8').then(JSON.parse),
    readFile(tagDatabasePath, 'utf8').then(JSON.parse)
  ])

  invariant(Array.isArray(current.slots) && current.slots.length > 0, 'Current week has no slots')
  invariant(Array.isArray(database.categories), 'Tag database has no categories')

  let itemCount = 0
  current.slots = current.slots.map((currentSlot) => {
    const slotId = String(currentSlot.slotId ?? '').trim()
    const tag = String(currentSlot.tag ?? '').trim()
    invariant(slotId && tag, 'Current week contains an incomplete tagged slot')

    const { category, slot } = getGoldSlot(database, tag, slotId)
    invariant(
      Array.isArray(slot.itemIds) && slot.itemIds.length > 0,
      `No gold items for ${slotId} / ${tag}`
    )

    const items = slot.itemIds.map((itemId) => getGoldItem(database, itemId, slotId, tag))
    itemCount += items.length
    return {
      ...currentSlot,
      categoryId: category.categoryId,
      gold: {
        points: slot.goldPoints,
        items
      }
    }
  })

  await writeFile(currentPath, `${JSON.stringify(current, null, 2)}\n`, 'utf8')
  console.log(`Fashion Check current gold items: ${current.slots.length} slots, ${itemCount} items`)
}

await main()
