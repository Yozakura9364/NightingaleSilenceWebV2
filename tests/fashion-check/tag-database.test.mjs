import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildTagDatabase,
  checkTagDatabase
} from '../../scripts/fashion-check/lib/tag-database.mjs'

const locales = ['zh-CN', 'en', 'ja', 'ko']

function localizedNames(prefix) {
  return Object.fromEntries(locales.map((locale) => [locale, `${prefix}-${locale}`]))
}

function itemCatalog(entries) {
  return new Map(
    entries.map(([itemId, name, equipSlotCategoryId]) => [
      itemId,
      {
        itemId,
        name,
        iconId: itemId + 40000,
        rarity: 2,
        equipSlotCategoryId
      }
    ])
  )
}

function buildFixture() {
  const categoryNamesByLocale = new Map(
    locales.map((locale) => [
      locale,
      new Map([
        [4, `beast-${locale}`],
        [20, `formal-${locale}`]
      ])
    ])
  )
  const itemCatalogsByLocale = new Map(
    locales.map((locale) => [
      locale,
      itemCatalog([
        [100, `hat-${locale}`, 3],
        [101, `coat-${locale}`, 4]
      ])
    ])
  )

  return {
    answers: {
      schemaVersion: 'fashion-check.answers.v1',
      generatedAt: '2026-07-21T00:00:00.000Z',
      categories: {
        4: {
          categoryId: 4,
          goldItemIdsBySlot: { head: [100] },
          goldPointsBySlot: { head: 8 },
          evidenceByItemId: {
            100: [{ sourceId: 'private-source', locator: 'must not be public' }]
          }
        },
        20: {
          categoryId: 20,
          goldItemIdsBySlot: { body: [101] },
          goldPointsBySlot: { body: 8 },
          evidenceByItemId: {
            101: [{ sourceId: 'private-source', locator: 'must not be public' }]
          }
        }
      }
    },
    categoryNamesByLocale,
    itemCatalogsByLocale
  }
}

test('buildTagDatabase creates a compact localized public index', () => {
  const document = buildTagDatabase(buildFixture())

  assert.equal(document.schemaVersion, 'fashion-check.tag-database.v1')
  assert.deepEqual(document.summary, {
    categories: 2,
    categorySlotPairs: 2,
    items: 2
  })
  assert.deepEqual(document.categories, [
    {
      categoryId: 4,
      names: localizedNames('beast'),
      slots: [{ slotId: 'head', goldPoints: 8, itemIds: [100] }]
    },
    {
      categoryId: 20,
      names: localizedNames('formal'),
      slots: [{ slotId: 'body', goldPoints: 8, itemIds: [101] }]
    }
  ])
  assert.deepEqual(document.items['100'], {
    itemId: 100,
    names: localizedNames('hat'),
    iconId: 40100,
    rarity: 2
  })
  assert.doesNotMatch(JSON.stringify(document), /evidence|locator|private-source/)
  assert.deepEqual(checkTagDatabase(document), document.summary)
})

test('buildTagDatabase rejects missing localized names', () => {
  const fixture = buildFixture()
  fixture.categoryNamesByLocale.get('ko').delete(4)

  assert.throws(() => buildTagDatabase(fixture), /Missing ko category name for category 4/)
})

test('buildTagDatabase preserves regional items without inventing unavailable locale names', () => {
  const fixture = buildFixture()
  fixture.itemCatalogsByLocale.get('en').get(100).name = ''
  fixture.itemCatalogsByLocale.get('ja').get(100).name = ''

  const document = buildTagDatabase(fixture)
  assert.deepEqual(document.items['100'].names, {
    'zh-CN': 'hat-zh-CN',
    ko: 'hat-ko'
  })
  assert.deepEqual(checkTagDatabase(document), document.summary)
})

test('checkTagDatabase rejects unknown item references and private fields', () => {
  const document = buildTagDatabase(buildFixture())
  const unknownItem = structuredClone(document)
  unknownItem.categories[0].slots[0].itemIds.push(999)
  assert.throws(() => checkTagDatabase(unknownItem), /unknown item 999/)

  const privateField = structuredClone(document)
  privateField.categories[0].evidence = []
  assert.throws(() => checkTagDatabase(privateField), /forbidden field evidence/)
})
