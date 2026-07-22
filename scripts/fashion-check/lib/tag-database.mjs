const LOCALES = Object.freeze(['zh-CN', 'en', 'ja', 'ko'])
const SLOT_ORDER = Object.freeze([
  'head',
  'body',
  'hands',
  'legs',
  'feet',
  'ears',
  'neck',
  'wrists',
  'ring'
])
const EQUIP_SLOT_CATEGORY_BY_SLOT = Object.freeze({
  head: 3,
  body: 4,
  hands: 5,
  legs: 7,
  feet: 8,
  ears: 9,
  neck: 10,
  wrists: 11,
  ring: 12
})
const FORBIDDEN_PUBLIC_KEYS =
  /^(evidence|evidenceByItemId|locator|source|sourceId|sourceRows|sourceAnswer|retrievedAt|anomalies)$/i

function invariant(condition, message) {
  if (!condition) throw new Error(message)
}

function sortedUniqueNumbers(values) {
  return [...new Set(values.map(Number))].sort((left, right) => left - right)
}

function localizedNames(id, label, valuesByLocale) {
  return Object.fromEntries(
    LOCALES.map((locale) => {
      const name = String(valuesByLocale.get(locale)?.get(id) ?? '').trim()
      invariant(name, `Missing ${locale} ${label} name for ${label} ${id}`)
      return [locale, name]
    })
  )
}

function findForbiddenPublicKey(value, currentPath = '$') {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const finding = findForbiddenPublicKey(value[index], `${currentPath}[${index}]`)
      if (finding) return finding
    }
    return null
  }
  if (!value || typeof value !== 'object') return null

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${currentPath}.${key}`
    if (FORBIDDEN_PUBLIC_KEYS.test(key)) return childPath
    const finding = findForbiddenPublicKey(child, childPath)
    if (finding) return finding
  }
  return null
}

export function buildTagDatabase({ answers, categoryNamesByLocale, itemCatalogsByLocale }) {
  invariant(answers?.schemaVersion === 'fashion-check.answers.v1', 'Unsupported answers schema')

  const referencedItemIds = new Set()
  let categorySlotPairs = 0

  const categories = Object.values(answers.categories ?? {})
    .sort((left, right) => left.categoryId - right.categoryId)
    .map((category) => {
      const categoryId = Number(category.categoryId)
      invariant(Number.isInteger(categoryId) && categoryId > 0, 'Invalid category ID')

      const slots = Object.entries(category.goldItemIdsBySlot ?? {})
        .map(([slotId, itemIds]) => {
          invariant(slotId in EQUIP_SLOT_CATEGORY_BY_SLOT, `Unsupported slot ${slotId}`)
          const normalizedItemIds = sortedUniqueNumbers(itemIds)
          invariant(normalizedItemIds.length > 0, `Category ${categoryId}/${slotId} has no items`)
          normalizedItemIds.forEach((itemId) => referencedItemIds.add(itemId))
          categorySlotPairs += 1

          const goldPoints = Number(category.goldPointsBySlot?.[slotId])
          invariant(
            Number.isInteger(goldPoints) && goldPoints > 0,
            `Category ${categoryId}/${slotId} has invalid gold points`
          )
          return { slotId, goldPoints, itemIds: normalizedItemIds }
        })
        .sort((left, right) => SLOT_ORDER.indexOf(left.slotId) - SLOT_ORDER.indexOf(right.slotId))

      return {
        categoryId,
        names: localizedNames(categoryId, 'category', categoryNamesByLocale),
        slots
      }
    })

  const items = {}
  for (const itemId of [...referencedItemIds].sort((left, right) => left - right)) {
    const localizedRows = new Map(
      LOCALES.map((locale) => [locale, itemCatalogsByLocale.get(locale)?.get(itemId)])
    )
    const base = localizedRows.get('zh-CN')
    invariant(base, `Missing zh-CN item row for item ${itemId}`)
    const expectedEquipSlotCategoryId = Object.entries(EQUIP_SLOT_CATEGORY_BY_SLOT).find(
      ([, equipSlotCategoryId]) => equipSlotCategoryId === Number(base.equipSlotCategoryId)
    )?.[0]
    invariant(expectedEquipSlotCategoryId, `Item ${itemId} has unsupported equipment slot`)

    for (const category of categories) {
      for (const slot of category.slots) {
        if (!slot.itemIds.includes(itemId)) continue
        invariant(
          EQUIP_SLOT_CATEGORY_BY_SLOT[slot.slotId] === Number(base.equipSlotCategoryId),
          `Item ${itemId} is incompatible with slot ${slot.slotId}`
        )
      }
    }

    const names = Object.fromEntries(
      LOCALES.flatMap((locale) => {
        const row = localizedRows.get(locale)
        const name = String(row?.name ?? '').trim()
        return name ? [[locale, name]] : []
      })
    )
    invariant(names['zh-CN'], `Missing zh-CN item name for item ${itemId}`)
    const iconId = Number(base.iconId)
    const rarity = Number(base.rarity)
    invariant(Number.isInteger(iconId) && iconId > 0, `Item ${itemId} has invalid icon`)
    invariant(Number.isInteger(rarity) && rarity > 0, `Item ${itemId} has invalid rarity`)
    items[String(itemId)] = { itemId, names, iconId, rarity }
  }

  const document = {
    schemaVersion: 'fashion-check.tag-database.v1',
    generatedAt: answers.generatedAt,
    summary: {
      categories: categories.length,
      categorySlotPairs,
      items: Object.keys(items).length
    },
    categories,
    items
  }
  checkTagDatabase(document)
  return document
}

export function checkTagDatabase(document) {
  invariant(
    document?.schemaVersion === 'fashion-check.tag-database.v1',
    'Unsupported tag database schema'
  )
  const forbiddenPath = findForbiddenPublicKey(document)
  invariant(
    !forbiddenPath,
    `Tag database contains forbidden field ${forbiddenPath?.split('.').at(-1)}`
  )
  invariant(Array.isArray(document.categories), 'Tag database categories must be an array')
  invariant(document.items && typeof document.items === 'object', 'Tag database items are missing')

  const referencedItemIds = new Set()
  const categoryIds = new Set()
  let categorySlotPairs = 0

  for (const category of document.categories) {
    invariant(
      Number.isInteger(category.categoryId) && category.categoryId > 0,
      'Tag database contains an invalid category ID'
    )
    invariant(!categoryIds.has(category.categoryId), `Duplicate category ${category.categoryId}`)
    categoryIds.add(category.categoryId)
    for (const locale of LOCALES) {
      invariant(
        String(category.names?.[locale] ?? '').trim(),
        `Category ${category.categoryId} is missing ${locale}`
      )
    }
    invariant(
      Array.isArray(category.slots) && category.slots.length > 0,
      `Category ${category.categoryId} has no slots`
    )

    const slotIds = new Set()
    for (const slot of category.slots) {
      invariant(slot.slotId in EQUIP_SLOT_CATEGORY_BY_SLOT, `Unsupported slot ${slot.slotId}`)
      invariant(
        !slotIds.has(slot.slotId),
        `Duplicate category slot ${category.categoryId}/${slot.slotId}`
      )
      slotIds.add(slot.slotId)
      invariant(
        Number.isInteger(slot.goldPoints) && slot.goldPoints > 0,
        `Category ${category.categoryId}/${slot.slotId} has invalid gold points`
      )
      invariant(
        Array.isArray(slot.itemIds) && slot.itemIds.length > 0,
        `Category ${category.categoryId}/${slot.slotId} has no items`
      )
      for (const itemId of slot.itemIds) {
        invariant(
          document.items[String(itemId)],
          `Category ${category.categoryId}/${slot.slotId} references unknown item ${itemId}`
        )
        referencedItemIds.add(itemId)
      }
      categorySlotPairs += 1
    }
  }

  for (const [itemKey, item] of Object.entries(document.items)) {
    invariant(String(item.itemId) === itemKey, `Item key ${itemKey} does not match item ID`)
    invariant(
      referencedItemIds.has(item.itemId),
      `Tag database contains unreferenced item ${item.itemId}`
    )
    invariant(
      Number.isInteger(item.iconId) && item.iconId > 0,
      `Item ${item.itemId} has invalid icon`
    )
    invariant(
      Number.isInteger(item.rarity) && item.rarity > 0,
      `Item ${item.itemId} has invalid rarity`
    )
    invariant(String(item.names?.['zh-CN'] ?? '').trim(), `Item ${item.itemId} is missing zh-CN`)
    for (const [locale, name] of Object.entries(item.names ?? {})) {
      invariant(
        LOCALES.includes(locale),
        `Item ${item.itemId} contains unsupported locale ${locale}`
      )
      invariant(String(name).trim(), `Item ${item.itemId} contains an empty ${locale} name`)
    }
  }

  const actualSummary = {
    categories: categoryIds.size,
    categorySlotPairs,
    items: referencedItemIds.size
  }
  invariant(
    document.summary?.categories === actualSummary.categories,
    'Tag database category summary mismatch'
  )
  invariant(
    document.summary?.categorySlotPairs === actualSummary.categorySlotPairs,
    'Tag database slot summary mismatch'
  )
  invariant(document.summary?.items === actualSummary.items, 'Tag database item summary mismatch')
  return actualSummary
}
