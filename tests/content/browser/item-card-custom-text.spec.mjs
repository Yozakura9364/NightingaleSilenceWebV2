// Run explicitly against a Vite dev server with global Playwright available:
//   $env:NODE_PATH = (npm root -g); $env:ITEM_CARD_E2E = '1'
//   npx vitest run --config vitest.config.ts tests/content/browser/item-card-custom-text.spec.mjs
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const RUN_E2E = process.env.ITEM_CARD_E2E === '1'
const BASE_URL = process.env.ITEM_CARD_E2E_URL || 'http://127.0.0.1:5173'
const require = createRequire(import.meta.url)

let browser

const suite = RUN_E2E ? describe : describe.skip

suite('item card custom text browser workflow', () => {
  beforeAll(async () => {
    const { chromium } = require('playwright')
    browser = await chromium.launch({ channel: 'chrome', headless: true })
  })

  afterAll(async () => {
    await browser?.close()
  })

  it(
    'drags custom text into the canvas and keeps its download in Card PNG',
    async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
      const consoleProblems = []
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') {
          consoleProblems.push(`${message.type()}: ${message.text()}`)
        }
      })
      page.on('pageerror', (error) => consoleProblems.push(`pageerror: ${error.message}`))

      try {
        await page.goto(`${BASE_URL}/#/ffxiv/item-card`, { waitUntil: 'networkidle' })
        await page.locator('.item-card-workspace__tabs [role="tab"]').nth(2).click()
        await page.locator('#item-card-custom-text-input').fill('拖拽测试文字')
        await page.locator('.custom-text-editor__add button').click()

        expect(
          await page
            .locator('.custom-text-editor .custom-text-item__actions button', {
              hasText: '下载'
            })
            .count()
        ).toBe(0)

        await page.locator('.card-preview__view-tabs [role="tab"]').nth(1).click()
        await page.locator('input[type="file"][accept*="image/png"]').setInputFiles({
          name: 'background.png',
          mimeType: 'image/png',
          buffer: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNkYGD4z8DAwMgABYwMDAAAGgAB9HFkpgAAAABJRU5ErkJggg==',
            'base64'
          )
        })
        await page.locator('.canvas-board__viewport--ready').waitFor()
        await page
          .locator('.custom-text-item__drag-handle')
          .first()
          .dragTo(page.locator('.canvas-board__viewport'))
        await page.locator('.canvas-board__layer').waitFor()
        expect(await page.locator('.canvas-board__layer').count()).toBe(1)

        const cardPngTab = page.locator('.card-preview__view-tabs [role="tab"]').nth(0)
        await cardPngTab.click()
        expect(await cardPngTab.getAttribute('aria-selected')).toBe('true')
        expect(
          await page.locator('.card-preview__custom-text button', { hasText: '下载' }).count()
        ).toBe(1)
        expect(consoleProblems).toEqual([])
      } finally {
        await page.close()
      }
    },
    30000
  )
})

if (!RUN_E2E) {
  describe.skip('item card custom text E2E (set ITEM_CARD_E2E=1)', () => {
    it('is skipped by default', () => {})
  })
}
