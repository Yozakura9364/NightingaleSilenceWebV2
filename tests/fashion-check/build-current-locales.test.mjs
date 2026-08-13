import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(testDirectory, '../..')

test('preloaded Fashion Check themes have names for every supported locale', async () => {
  const [current, locales] = await Promise.all(
    ['current.json', 'current-locales.json'].map(async (fileName) =>
      JSON.parse(
        await readFile(path.join(projectRoot, 'public/data/fashion-check', fileName), 'utf8')
      )
    )
  )
  const themes = locales.themes ?? {}
  assert.ok(themes[String(current.globalIssue)], `missing current theme ${current.globalIssue}`)

  for (const [issue, theme] of Object.entries(themes)) {
    for (const locale of ['zh-CN', 'en', 'ja', 'ko']) {
      assert.equal(typeof theme[locale], 'string', `issue ${issue} is missing a ${locale} theme name`)
      assert.ok(theme[locale].trim(), `issue ${issue} has an empty ${locale} theme name`)
    }
  }
})
