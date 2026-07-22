import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkTagDatabase } from './lib/tag-database.mjs'
import { readJson } from './lib/validation.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../..')
const tagDatabasePath = path.join(projectRoot, 'public/data/fashion-check/tag-database.json')

const document = await readJson(tagDatabasePath)
const summary = checkTagDatabase(document)
console.log(
  `Fashion Check tag database passed: ${summary.categories} categories, ${summary.categorySlotPairs} category-slot pairs, ${summary.items} items`
)
