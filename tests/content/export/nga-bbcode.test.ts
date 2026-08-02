// T048 — NGA BBCode dialect golden tests.
// Loads tests/fixtures/content/nga/golden-cases.json and asserts the exact
// { text, losses } output of serializeNgaBbcode. These fixtures are the dialect
// contract; they were authored from NGA editor knowledge and are verified in
// the real NGA preview during T055.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serializeNgaBbcode } from '@/lib/content/export/nga/serializeNgaBbcode'

const cases = JSON.parse(
  readFileSync(join(process.cwd(), 'tests/fixtures/content/nga/golden-cases.json'), 'utf8')
)

describe('NGA BBCode dialect golden fixtures (T048)', () => {
  it('fixtures define a mapping version', () => {
    expect(cases.mappingVersion).toBe('nga-v1')
  })

  for (const tc of cases.cases) {
    it(tc.name, () => {
      const result = serializeNgaBbcode(tc.document)
      expect(result.text).toBe(tc.expectedText)
      // compare severity/nodePath/nodeType/code (fixtures omit messageKey/fallback
      // which the serializer must always fill in)
      const actual = result.losses.map((l) => ({
        severity: l.severity,
        nodePath: l.nodePath,
        nodeType: l.nodeType,
        code: l.code,
      }))
      expect(actual).toEqual(tc.expectedLosses)
      for (const l of result.losses) {
        expect(typeof l.messageKey).toBe('string')
        expect(l.messageKey.length).toBeGreaterThan(0)
      }
    })
  }
})
