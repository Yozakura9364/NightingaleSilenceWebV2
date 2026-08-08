import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const itemLinePath = new URL(
  '../../src/pages/fashion-check/components/FashionCheckItemLine.vue',
  import.meta.url
)
const solutionsPath = new URL(
  '../../src/pages/fashion-check/views/FashionCheckSolutionsView.vue',
  import.meta.url
)

function readStyleBlock(source, selector) {
  const start = source.lastIndexOf(selector)
  assert.notEqual(start, -1, `missing style selector: ${selector}`)

  const end = source.indexOf('}', start)
  assert.notEqual(end, -1, `unterminated style block: ${selector}`)
  return source.slice(start, end)
}

test('fashion-check item icons have no outer frame', () => {
  const itemLine = fs.readFileSync(itemLinePath, 'utf8')
  const solutions = fs.readFileSync(solutionsPath, 'utf8')
  const itemIcon = readStyleBlock(itemLine, '.fashion-check-item-line__icon {')
  const dyeIcon = readStyleBlock(solutions, '.fashion-check-showcase__dye-item-icon {')

  for (const [name, block] of [
    ['item icon', itemIcon],
    ['dye icon', dyeIcon]
  ]) {
    assert.match(block, /width:\s*32px/)
    assert.match(block, /height:\s*32px/)
    assert.doesNotMatch(block, /\bborder\s*:/, `${name} must not draw an outer border`)
    assert.doesNotMatch(block, /\bbackground\s*:/, `${name} must not add a backdrop frame`)
  }
})
