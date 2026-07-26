import { createRequire } from 'node:module'
import { execFileSync, spawn } from 'node:child_process'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const manifestDir = join(rootDir, 'public/data/plate')
const PLATE_ROUTE = '#/ffxiv/plate'
const DRAFT_KEY = 'nsplate.draft.v1'
const LEGACY_DRAFT_KEY = 'iconComposer.ui.config.v1'
const LOCALE_KEY = 'ns-locale'
const THEME_KEY = 'ns-theme-mode'
const PORTRAIT_CATEGORIES = ['肖像背景', '肖像装饰框', '肖像装饰物']
const NAMEPLATE_CATEGORIES = [
  '铭牌背衬',
  '铭牌底色',
  '铭牌花纹',
  '铭牌外框',
  '铭牌顶部装饰',
  '铭牌底部装饰',
  '铭牌装饰物'
]
const PORTRAIT_FRAME_CATEGORY = '肖像外框'

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const manifests = await readManifests()
  const { chromium } = loadPlaywright()
  const tmpDir = join(tmpdir(), `nsplate-regression-${Date.now()}`)
  const results = []
  let server = null
  let browser = null

  await mkdir(tmpDir, { recursive: true })

  try {
    server = args.url ? null : await startViteServer()
    const url = normalizePlateUrl(args.url || server.url)
    browser = await launchBrowser(chromium)

    results.push(await runStaticDefaultCase(browser, url))
    results.push(await runV2DraftCase(browser, url, manifests))
    results.push(await runPairedUploadValidationCase(browser, url))
    results.push(await runCropRotationControlsCase(browser, url, tmpDir))
    results.push(await runPairedPopoutCase(browser, url, manifests, tmpDir))
    results.push(await runLegacyPairedDraftDiscardCase(browser, url, manifests))
    results.push(await runMobileNightPopoutCase(browser, url, manifests))
    results.push(await runLegacyJsonImportCase(browser, url, manifests))
    results.push(await runLegacyLocalStorageCase(browser, url, manifests))
    results.push(await runExportCase(browser, url, manifests, tmpDir))
  } finally {
    await browser?.close()
    await rm(tmpDir, { recursive: true, force: true })
    await server?.stop()
  }

  console.log('NSPlate regression check passed.')
  for (const result of results) {
    console.log(`- ${result.name}: ${result.detail}`)
  }
}

function parseArgs(argv) {
  const args = {
    help: false,
    url: ''
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }

    if (arg === '--url') {
      args.url = argv[index + 1] ?? ''
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return args
}

function printHelp() {
  console.log(`Run NSPlate browser regression checks.

Usage:
  node scripts/check-nsplate-regression.mjs
  node scripts/check-nsplate-regression.mjs --url http://127.0.0.1:5173/#/ffxiv/plate

The script uses the global Playwright package and system Chrome when available.
It starts Vite in static manifest mode when --url is not provided.
`)
}

async function readManifests() {
  const [presets, files] = await Promise.all([
    readJson(join(manifestDir, 'presets.json')),
    readJson(join(manifestDir, 'files.json'))
  ])

  assert(Array.isArray(presets.banner) && presets.banner.length > 0, 'presets.banner is empty')
  assert(
    Array.isArray(presets.charcard) && presets.charcard.length > 0,
    'presets.charcard is empty'
  )

  return { presets, files }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

function loadPlaywright() {
  const require = createRequire(import.meta.url)
  const candidates = ['playwright']
  const globalRoot = getGlobalNodeModules()

  if (globalRoot) {
    candidates.push(join(globalRoot, 'playwright'))
  }

  if (process.env.APPDATA) {
    candidates.push(join(process.env.APPDATA, 'npm/node_modules/playwright'))
  }

  const errors = []

  for (const candidate of candidates) {
    try {
      return require(candidate)
    } catch (error) {
      errors.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  throw new Error(`Unable to load Playwright. Tried:\n${errors.join('\n')}`)
}

function getGlobalNodeModules() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

  try {
    return execFileSync(npmCommand, ['root', '-g'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch {
    return ''
  }
}

async function startViteServer() {
  const viteBin = join(rootDir, 'node_modules/vite/bin/vite.js')

  assert(existsFile(viteBin), `Missing Vite binary: ${viteBin}. Run npm install first.`)

  const child = spawn(process.execPath, [viteBin, '--host', '127.0.0.1'], {
    cwd: rootDir,
    env: {
      ...sanitizeSpawnEnv(process.env),
      VITE_NSPLATE_DATA_SOURCE: 'static-manifest',
      VITE_NSPLATE_MANIFEST_BASE: '/data/plate'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let output = ''

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      stopChildProcess(child)
      reject(new Error(`Timed out waiting for Vite dev server.\n${output}`))
    }, 45_000)

    const handleData = (chunk) => {
      output += stripAnsi(String(chunk))
      const match = output.match(/Local:\s+(http:\/\/127\.0\.0\.1:\d+\/)/)

      if (!match) {
        return
      }

      clearTimeout(timer)
      resolve({
        url: `${match[1]}${PLATE_ROUTE}`,
        stop: async () => stopChildProcess(child)
      })
    }

    child.stdout.on('data', handleData)
    child.stderr.on('data', handleData)
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('exit', (code) => {
      if (!output.match(/Local:\s+http:\/\/127\.0\.0\.1:\d+\//)) {
        clearTimeout(timer)
        reject(new Error(`Vite dev server exited before ready. code=${code}\n${output}`))
      }
    })
  })
}

function existsFile(filePath) {
  try {
    execFileSync(
      process.execPath,
      ['-e', `require('node:fs').accessSync(${JSON.stringify(filePath)})`],
      {
        stdio: ['ignore', 'ignore', 'ignore']
      }
    )
    return true
  } catch {
    return false
  }
}

function sanitizeSpawnEnv(env) {
  return Object.fromEntries(
    Object.entries(env).filter(
      ([key, value]) =>
        key && !key.startsWith('=') && value !== undefined && !String(value).includes('\u0000')
    )
  )
}

function stopChildProcess(child) {
  if (child.killed || child.exitCode !== null) {
    return
  }

  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
        stdio: ['ignore', 'ignore', 'ignore']
      })
      return
    } catch {
      // Fall through to child.kill.
    }
  }

  child.kill()
}

function stripAnsi(value) {
  return value.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '')
}

function normalizePlateUrl(value) {
  const text = String(value ?? '').trim()

  if (!text) {
    throw new Error('Missing NSPlate URL.')
  }

  if (text.includes('#/ffxiv/plate')) {
    return text
  }

  return `${text.replace(/\/+$/, '/')}${PLATE_ROUTE}`
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true })
  } catch {
    return chromium.launch({ headless: true })
  }
}

async function runStaticDefaultCase(browser, url) {
  const { page, requests, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(
    browser,
    url,
    {
      viewport: { width: 1440, height: 900 },
      locale: 'zh-CN',
      theme: 'day'
    }
  )

  try {
    const canvas = await inspectCanvas(page)
    const dataRequests = requests.filter((item) => item.includes('/data/plate/'))
    const legacyCatalogRequests = requests.filter(
      (item) => item.includes('/api/plate/presets') || item.includes('/api/plate/files')
    )

    assert(
      dataRequests.some((item) => item.includes('/presets.json')),
      'presets.json was not requested'
    )
    assert(
      dataRequests.some((item) => item.includes('/files.json')),
      'files.json was not requested'
    )
    assert(
      legacyCatalogRequests.length === 0,
      `legacy catalog API was requested: ${legacyCatalogRequests.join(', ')}`
    )
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'static-default',
      detail: `canvas=${canvas.width}x${canvas.height}, staticRequests=${dataRequests.length}`
    }
  } finally {
    await close()
  }
}

async function runV2DraftCase(browser, url, manifests) {
  const draft = createStoredDraft(manifests, {
    portraitSide: 'left',
    presetIndexes: { banner: 0, charcard: 0 },
    customPortrait: createStandardCustomPortrait('v2-standard'),
    infoPresetId: 'china'
  })
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(
    browser,
    url,
    {
      viewport: { width: 1440, height: 900 },
      draft,
      locale: 'zh-CN',
      theme: 'day'
    }
  )

  try {
    const canvas = await inspectCanvas(page)
    const stored = await readStoredDraft(page)

    assert(stored?.portraitSide === 'left', 'V2 draft portraitSide was not restored')
    assert(stored?.customPortrait?.mode === 'standard', 'standard custom portrait was not restored')
    assert(stored?.infoDraft?.activePresetId === 'china', 'china info preset was not restored')
    assert(canvas.nonTransparentSampleCount > 0, 'canvas appears blank')
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'v2-left-standard',
      detail: `canvas=${canvas.width}x${canvas.height}, alphaSamples=${canvas.nonTransparentSampleCount}`
    }
  } finally {
    await close()
  }
}

async function runMobileNightPopoutCase(browser, url, manifests) {
  const draft = createStoredDraft(manifests, {
    portraitSide: 'right',
    presetIndexes: { banner: 1, charcard: 1 },
    customPortrait: createPopoutCustomPortrait('v2-popout', 'aboveInfoText'),
    infoPresetId: 'international'
  })
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(
    browser,
    url,
    {
      viewport: { width: 390, height: 844, isMobile: true },
      draft,
      locale: 'en',
      theme: 'night'
    }
  )

  try {
    const canvas = await inspectCanvas(page)
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      theme: document.documentElement.dataset.theme,
      lang: document.documentElement.lang
    }))

    assert(
      layout.scrollWidth <= layout.clientWidth + 1,
      `mobile horizontal overflow: ${layout.scrollWidth} > ${layout.clientWidth}`
    )
    assert(layout.theme === 'night', `theme was ${layout.theme}`)
    assert(layout.lang === 'en', `lang was ${layout.lang}`)
    assert(canvas.nonTransparentSampleCount > 0, 'mobile popout canvas appears blank')

    await page.locator('.nsplate-portrait-upload__pick').click()
    const cropDialog = page.locator('.nsplate-crop-dialog')
    await cropDialog.waitFor({ state: 'visible' })
    const mobileControlLayout = await cropDialog
      .locator('.nsplate-crop-dialog__controls')
      .evaluate((controls) => {
        const tops = Array.from(controls.children, (element) =>
          Math.round(element.getBoundingClientRect().top)
        )
        return {
          rows: new Set(tops).size,
          scrollWidth: controls.scrollWidth,
          clientWidth: controls.clientWidth
        }
      })
    assert(mobileControlLayout.rows <= 2, 'mobile crop controls exceeded two rows')
    assert(
      mobileControlLayout.scrollWidth <= mobileControlLayout.clientWidth + 1,
      `mobile crop controls overflow horizontally: ${mobileControlLayout.scrollWidth} > ${mobileControlLayout.clientWidth}`
    )
    await cropDialog.locator('.nsplate-crop-dialog__actions button').first().click()
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'v2-right-popout-night-mobile',
      detail: `canvas=${canvas.width}x${canvas.height}, viewport=${layout.clientWidth}px`
    }
  } finally {
    await close()
  }
}

async function runPairedPopoutCase(browser, url, manifests, tmpDir) {
  const draft = createStoredDraft(manifests, {
    portraitSide: 'right',
    presetIndexes: { banner: 0, charcard: 0 },
    customPortrait: createPairedCustomPortrait('v2-paired'),
    infoPresetId: 'china'
  })
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(
    browser,
    url,
    {
      viewport: { width: 1440, height: 900 },
      draft,
      locale: 'zh-CN',
      theme: 'day',
      acceptDownloads: true,
      initializeOnce: true
    }
  )

  try {
    await page.getByRole('button', { name: '左侧' }).click()
    await page.waitForFunction((key) => {
      const raw = localStorage.getItem(key)
      return Boolean(raw?.includes('"mode":"paired"') && raw.includes('"storageKey"'))
    }, DRAFT_KEY)
    await page.reload({ waitUntil: 'networkidle' })
    await waitForPlateReady(page)
    const hydratedImage = page.locator(
      '.nsplate-portrait-upload__thumb img[alt="v2-paired-base.svg"]'
    )
    await hydratedImage.waitFor({ state: 'visible' })
    const hydratedSource = await hydratedImage.getAttribute('src')

    assert(
      hydratedSource?.startsWith('data:image/svg+xml;base64,'),
      'paired base image was not hydrated from IndexedDB'
    )

    await page.locator('.nsplate-portrait-upload__pick').click()
    const cropDialog = page.locator('.nsplate-crop-dialog')
    await cropDialog.waitFor({ state: 'visible' })
    const pairedScaleBefore = await cropDialog.locator('input[type="range"]').first().inputValue()
    await cropDialog.getByRole('button', { name: '普通图片' }).click()
    await cropDialog.locator('canvas[data-mode="standard"]').waitFor({ state: 'visible' })
    const standardModeSamples = await cropDialog.locator('canvas').evaluate((canvas) => {
      const context = canvas.getContext('2d')
      if (!context) return []
      const portraitOrigin = { x: 604, y: 300 }
      return [portraitOrigin.x + 24, portraitOrigin.x + 256, portraitOrigin.x + 512 - 24].map((x) =>
        Array.from(context.getImageData(x, portraitOrigin.y + 420, 1, 1).data)
      )
    })
    assert(
      standardModeSamples[0]?.[0] > 200 && standardModeSamples[2]?.[2] > 200,
      'paired-to-standard mode switch reused free-transform scale instead of fitting the portrait crop'
    )
    await cropDialog.getByRole('button', { name: '全出框图片' }).click()
    await cropDialog.locator('canvas[data-mode="paired"]').waitFor({ state: 'visible' })
    const pairedScaleAfter = await cropDialog.locator('input[type="range"]').first().inputValue()
    assert(
      pairedScaleAfter === pairedScaleBefore,
      'paired free-transform scale was lost after switching to standard and back'
    )
    await cropDialog
      .getByText('v2-paired-popout.svg', { exact: true })
      .waitFor({ state: 'visible' })
    await cropDialog
      .locator('.nsplate-crop-dialog__actions')
      .getByRole('button', { name: '取消' })
      .click()

    const layerNote = page.locator('.nsplate-selection-note')
    await layerNote.locator('.nsplate-selection-note__summary').click()
    const pairedBaseRow = layerNote
      .locator('.nsplate-selection-note__row')
      .filter({ hasText: 'v2-paired-base.svg' })
    const pairedPopoutRow = layerNote
      .locator('.nsplate-selection-note__row')
      .filter({ hasText: 'v2-paired-popout.svg' })
    assert(
      (await pairedBaseRow.locator('.nsplate-selection-note__moves').count()) === 0,
      'paired base image unexpectedly exposed layer movement controls'
    )
    const movePopoutDown = pairedPopoutRow.locator('.nsplate-selection-note__moves button').nth(1)
    for (let index = 0; index < 3; index += 1) {
      await movePopoutDown.click()
    }
    assert(
      await movePopoutDown.isDisabled(),
      'paired popout image could move below its dedicated anchor range'
    )

    const configDownload = await downloadFromActionMenu(page, /导出配置|Export config/i)
    const configPath = await saveDownload(configDownload, tmpDir)
    const configJson = JSON.parse(await readFile(configPath, 'utf8'))
    const portrait = configJson?.draft?.customPortrait

    assert(portrait?.mode === 'paired', 'paired mode was lost from config export')
    assert(
      portrait?.pairedPopoutLayerAnchor === 'aboveCustomPortrait',
      'paired popout image did not use its dedicated anchor'
    )
    assert(
      portrait?.popoutLayerAnchor === undefined && portrait?.freeLayerAnchor === undefined,
      'paired images leaked into the single-image anchor fields'
    )
    assert(
      String(portrait?.dataUrl ?? '').startsWith('data:image/svg+xml;base64,'),
      'paired base image was not embedded in config'
    )
    assert(
      String(portrait?.overlayDataUrl ?? '').startsWith('data:image/svg+xml;base64,'),
      'paired popout image was not embedded in config'
    )

    const zipDownload = await downloadFromActionMenu(page, /导出分层 ZIP|Export layered ZIP/i)
    const zipPath = await saveDownload(zipDownload, tmpDir)
    const zipBytes = await readFile(zipPath)

    assert(
      zipBytes.includes(Buffer.from('自定义图片（底图）')),
      'paired base layer is missing from layered ZIP'
    )
    assert(
      zipBytes.includes(Buffer.from('自定义图片（出框）')),
      'paired popout layer is missing from layered ZIP'
    )
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'v2-paired-popout',
      detail:
        'same-size pair, paired/standard mode roundtrip, IndexedDB restore, config and layered ZIP'
    }
  } finally {
    await close()
  }
}

async function runPairedUploadValidationCase(browser, url) {
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(
    browser,
    url,
    {
      viewport: { width: 1440, height: 900 },
      locale: 'zh-CN',
      theme: 'day'
    }
  )

  try {
    await page.locator('.nsplate-portrait-upload__pick').click()
    const dialog = page.locator('.nsplate-crop-dialog')
    await dialog.waitFor({ state: 'visible' })
    await dialog.getByRole('button', { name: '全出框图片' }).click()
    const uploadCards = dialog.locator('.nsplate-crop-dialog__file')
    await uploadCards
      .nth(0)
      .locator('input[type="file"]')
      .setInputFiles({
        name: 'paired-upload-base.svg',
        mimeType: 'image/svg+xml',
        buffer: createUploadSvgBuffer(512, 840, '#8bd3e6')
      })
    const overlayInput = uploadCards.nth(1).locator('input[type="file"]')

    await overlayInput.setInputFiles({
      name: 'paired-upload-mismatch.svg',
      mimeType: 'image/svg+xml',
      buffer: createUploadSvgBuffer(256, 840, '#ff66b3')
    })
    await dialog.getByRole('alert').filter({ hasText: '尺寸必须与底图完全相同' }).waitFor()

    await overlayInput.setInputFiles({
      name: 'paired-upload-popout.svg',
      mimeType: 'image/svg+xml',
      buffer: createUploadSvgBuffer(512, 840, '#ff66b3', true)
    })
    await dialog.getByText('paired-upload-popout.svg', { exact: true }).waitFor()
    const applyButton = dialog.getByRole('button', { name: '应用' })
    assert(
      !(await applyButton.isDisabled()),
      'paired apply button stayed disabled after valid upload'
    )
    await applyButton.click()
    await page.waitForFunction(
      (key) => localStorage.getItem(key)?.includes('"mode":"paired"'),
      DRAFT_KEY
    )
    await page
      .locator('.nsplate-portrait-upload__thumb img[alt="paired-upload-base.svg"]')
      .waitFor()
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'v2-paired-upload-validation',
      detail: 'dimension mismatch rejected and same-size pair applied'
    }
  } finally {
    await close()
  }
}

async function runLegacyPairedDraftDiscardCase(browser, url, manifests) {
  const legacyPairedPortrait = createPairedCustomPortrait('legacy-paired')
  legacyPairedPortrait.popoutLayerAnchor = legacyPairedPortrait.pairedPopoutLayerAnchor
  delete legacyPairedPortrait.pairedPopoutLayerAnchor
  const draft = createStoredDraft(manifests, {
    portraitSide: 'right',
    presetIndexes: { banner: 0, charcard: 0 },
    customPortrait: legacyPairedPortrait,
    infoPresetId: 'china'
  })
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(
    browser,
    url,
    {
      viewport: { width: 1440, height: 900 },
      draft,
      locale: 'zh-CN',
      theme: 'day'
    }
  )

  try {
    await waitForPlateReady(page)
    assert(
      (await page.locator('.nsplate-portrait-upload__thumb img').count()) === 0,
      'legacy paired draft was unexpectedly retained'
    )
    const storedPortrait = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw)?.customPortrait : undefined
    }, DRAFT_KEY)
    assert(storedPortrait === null, 'legacy paired draft was not cleared from persisted state')
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'legacy-paired-draft-discard',
      detail: 'old shared-anchor paired draft cleared'
    }
  } finally {
    await close()
  }
}

async function runCropRotationControlsCase(browser, url, tmpDir) {
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(
    browser,
    url,
    {
      viewport: { width: 1440, height: 900 },
      locale: 'zh-CN',
      theme: 'day',
      acceptDownloads: true
    }
  )

  try {
    await page.locator('.nsplate-portrait-upload__pick').click()
    const dialog = page.locator('.nsplate-crop-dialog')
    await dialog.waitFor({ state: 'visible' })
    await dialog
      .locator('.nsplate-crop-dialog__file input[type="file"]')
      .first()
      .setInputFiles({
        name: 'rotation-controls.svg',
        mimeType: 'image/svg+xml',
        buffer: createUploadSvgBuffer(512, 840, '#8bd3e6', true)
      })
    const rotationNumber = dialog.locator('input[type="number"][aria-label="旋转"]')
    const zoomRange = dialog
      .locator('.nsplate-crop-dialog__control')
      .first()
      .locator('input[type="range"]')
    await zoomRange.fill('1.4')
    await rotationNumber.fill('18')
    const zoomBeforeRotationReset = await zoomRange.inputValue()
    const zoomLabelBeforeRotationReset = await dialog
      .locator('.nsplate-crop-dialog__control')
      .first()
      .locator('output')
      .textContent()
    await dialog
      .locator('.nsplate-crop-dialog__control--editable')
      .first()
      .getByRole('button')
      .click()
    assert(Number(await rotationNumber.inputValue()) === 0, 'rotation reset did not clear rotation')
    const zoomAfterRotationReset = await zoomRange.inputValue()
    const zoomLabelAfterRotationReset = await dialog
      .locator('.nsplate-crop-dialog__control')
      .first()
      .locator('output')
      .textContent()
    assert(
      Math.abs(Number(zoomAfterRotationReset) - Number(zoomBeforeRotationReset)) <= 0.02,
      `rotation reset changed image zoom: ${zoomBeforeRotationReset} -> ${zoomAfterRotationReset}`
    )
    assert(
      zoomLabelAfterRotationReset === zoomLabelBeforeRotationReset,
      `rotation reset changed displayed zoom: ${zoomLabelBeforeRotationReset} -> ${zoomLabelAfterRotationReset}`
    )
    await rotationNumber.fill('18')
    await dialog
      .locator('.nsplate-crop-dialog__actions')
      .getByRole('button', { name: '应用' })
      .click()
    await page.waitForFunction(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}')?.customPortrait?.rotation === 18,
      DRAFT_KEY
    )
    let stored = await readStoredDraft(page)
    assert(stored?.customPortrait?.mode === 'standard', 'standard rotation changed image mode')
    assert(stored?.customPortrait?.rotation === 18, 'standard rotation was not persisted')

    await page.locator('.nsplate-portrait-upload__pick').click()
    await dialog.waitFor({ state: 'visible' })
    await dialog.getByRole('button', { name: '半出框图片' }).click()
    const angleNumber = dialog.locator('input[type="number"][aria-label="倾斜角度"]')
    await angleNumber.fill('13')
    await rotationNumber.fill('-22')
    assert(Number(await angleNumber.inputValue()) === 13, 'image rotation changed the split angle')

    const desktopControlLayout = await dialog
      .locator('.nsplate-crop-dialog__controls')
      .evaluate((controls) => {
        const tops = Array.from(controls.children, (element) =>
          Math.round(element.getBoundingClientRect().top)
        )
        return {
          rows: new Set(tops).size,
          scrollWidth: controls.scrollWidth,
          clientWidth: controls.clientWidth
        }
      })
    assert(desktopControlLayout.rows === 1, 'desktop crop controls wrapped beyond one row')
    assert(
      desktopControlLayout.scrollWidth <= desktopControlLayout.clientWidth + 1,
      'desktop crop controls overflow horizontally'
    )

    await dialog
      .locator('.nsplate-crop-dialog__actions')
      .getByRole('button', { name: '应用' })
      .click()
    await page.waitForFunction((key) => {
      const portrait = JSON.parse(localStorage.getItem(key) ?? '{}')?.customPortrait
      return portrait?.mode === 'popout' && portrait?.rotation === -22
    }, DRAFT_KEY)
    stored = await readStoredDraft(page)
    const portrait = stored?.customPortrait
    const storedAngle =
      (Math.atan2((portrait?.splitRightY ?? 0) - (portrait?.splitLeftY ?? 0), 512) * 180) / Math.PI
    assert(Math.abs(storedAngle - 13) < 0.2, `stored split angle changed to ${storedAngle}`)
    assert(
      String(portrait?.renderDataUrl ?? '').startsWith('data:image/png'),
      'rotated popout render source was not generated'
    )
    const pngDownload = await downloadFromActionMenu(page, /导出 PNG|Export PNG/i)
    const pngPath = await saveDownload(pngDownload, tmpDir)
    await assertFileMinSize(pngPath, 1000, 'rotated PNG export is too small')
    const jpgDownload = await downloadFromActionMenu(page, /导出 JPG|Export JPG/i)
    const jpgPath = await saveDownload(jpgDownload, tmpDir)
    await assertFileMinSize(jpgPath, 1000, 'rotated JPG export is too small')
    const zipDownload = await downloadFromActionMenu(page, /导出分层 ZIP|Export layered ZIP/i)
    const zipPath = await saveDownload(zipDownload, tmpDir)
    const zipBytes = await readFile(zipPath)
    await assertFileMinSize(zipPath, 1000, 'rotated layered ZIP export is too small')
    assert(
      zipBytes.includes(Buffer.from('自定义图片（出框）')),
      'rotated layered ZIP is missing the popout layer'
    )
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'crop-rotation-controls',
      detail: 'standard/popout rotation, independent split angle and one-row desktop controls'
    }
  } finally {
    await close()
  }
}

async function runLegacyJsonImportCase(browser, url, manifests) {
  const legacyConfig = createLegacyConfig(manifests)
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(
    browser,
    url,
    {
      viewport: { width: 1440, height: 900 },
      locale: 'zh-CN',
      theme: 'day'
    }
  )

  try {
    page.on('dialog', (dialog) => dialog.accept())
    await page.locator('input[type="file"][accept*="json"]').setInputFiles({
      name: 'legacy-nsplate-regression.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(legacyConfig), 'utf8')
    })
    await page.waitForFunction(
      (key) => localStorage.getItem(key)?.includes('"portraitSide":"left"'),
      DRAFT_KEY
    )

    const stored = await readStoredDraft(page)
    assert(stored?.portraitSide === 'left', 'legacy JSON portraitSide was not imported')
    assert(stored?.customPortrait?.mode === 'standard', 'legacy custom portrait was not imported')
    assert(stored?.infoDraft?.activePresetId === 'china', 'legacy info preset was not imported')
    assert(
      Object.values(stored?.selectedAssetIdsByCategory ?? {}).filter(Boolean).length >= 4,
      'legacy selected assets were not imported'
    )
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'legacy-json-import',
      detail: `selectedAssets=${Object.values(stored.selectedAssetIdsByCategory).filter(Boolean).length}`
    }
  } finally {
    await close()
  }
}

async function runLegacyLocalStorageCase(browser, url, manifests) {
  const legacyConfig = createLegacyConfig(manifests)
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(
    browser,
    url,
    {
      viewport: { width: 1440, height: 900 },
      legacyConfig,
      locale: 'zh-CN',
      theme: 'day'
    }
  )

  try {
    await page.waitForFunction((key) => Boolean(localStorage.getItem(key)), DRAFT_KEY)
    const stored = await readStoredDraft(page)

    assert(stored?.portraitSide === 'left', 'legacy localStorage portraitSide was not restored')
    assert(
      stored?.infoDraft?.activePresetId === 'china',
      'legacy localStorage info preset was not restored'
    )
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'legacy-local-storage',
      detail: `draftSavedAt=${stored.savedAt || '(missing)'}`
    }
  } finally {
    await close()
  }
}

async function runExportCase(browser, url, manifests, tmpDir) {
  const draft = createStoredDraft(manifests, {
    portraitSide: 'right',
    presetIndexes: { banner: 0, charcard: 0 },
    customPortrait: createPopoutCustomPortrait('export-popout', 'front'),
    infoPresetId: 'phantom-tide'
  })
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(
    browser,
    url,
    {
      viewport: { width: 1440, height: 900 },
      draft,
      locale: 'zh-CN',
      theme: 'day',
      acceptDownloads: true
    }
  )
  const downloaded = []

  try {
    await inspectCanvas(page)
    const configDownload = await downloadFromActionMenu(page, /导出配置|Export config/i)
    const configPath = await saveDownload(configDownload, tmpDir)
    const configJson = JSON.parse(await readFile(configPath, 'utf8'))
    downloaded.push(configDownload.suggestedFilename())
    assert(configJson.app === 'NSPlate', 'config download is not an NSPlate config')
    assertFilename(configDownload.suggestedFilename(), /^plate-config_\d{8}-\d{6}\.json$/)

    await importDownloadedConfig(browser, url, configPath)

    const pngDownload = await downloadFromActionMenu(page, /导出 PNG|Export PNG/i)
    const pngPath = await saveDownload(pngDownload, tmpDir)
    downloaded.push(pngDownload.suggestedFilename())
    assertFilename(pngDownload.suggestedFilename(), /^plate-nameplate_\d{8}-\d{6}\.png$/)
    await assertFileMinSize(pngPath, 1000, 'PNG export is too small')

    const jpgDownload = await downloadFromActionMenu(page, /导出 JPG|Export JPG/i)
    const jpgPath = await saveDownload(jpgDownload, tmpDir)
    downloaded.push(jpgDownload.suggestedFilename())
    assertFilename(jpgDownload.suggestedFilename(), /^plate-nameplate_\d{8}-\d{6}_white-bg\.jpg$/)
    await assertFileMinSize(jpgPath, 1000, 'JPG export is too small')

    const zipDownload = await downloadFromActionMenu(page, /导出分层 ZIP|Export layered ZIP/i)
    const zipPath = await saveDownload(zipDownload, tmpDir)
    const zipBytes = await readFile(zipPath)
    downloaded.push(zipDownload.suggestedFilename())
    assertFilename(zipDownload.suggestedFilename(), /^plate-layers_\d{8}-\d{6}\.zip$/)
    assert(zipBytes.includes(Buffer.from('manifest.json')), 'ZIP is missing manifest.json')
    assert(zipBytes.includes(Buffer.from('layers.json')), 'ZIP is missing layers.json')
    assert(
      zipBytes.includes(Buffer.from('composer-config.json')),
      'ZIP is missing composer-config.json'
    )
    await assertFileMinSize(zipPath, 1000, 'ZIP export is too small')
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'exports',
      detail: downloaded.join(', ')
    }
  } finally {
    await close()
  }
}

async function importDownloadedConfig(browser, url, configPath) {
  const { page, close } = await openPlatePage(browser, url, {
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    theme: 'day'
  })

  try {
    page.on('dialog', (dialog) => dialog.accept())
    await page.locator('input[type="file"][accept*="json"]').setInputFiles(configPath)
    await page.waitForFunction(
      (key) => localStorage.getItem(key)?.includes('"customPortrait"'),
      DRAFT_KEY
    )
    const stored = await readStoredDraft(page)
    assert(
      stored?.customPortrait?.mode === 'popout',
      'V2 config roundtrip did not restore popout custom portrait'
    )
    assert(
      stored?.customPortrait?.splitLeftY === 300,
      'V2 config roundtrip lost left split endpoint'
    )
    assert(
      stored?.customPortrait?.splitRightY === 420,
      'V2 config roundtrip lost right split endpoint'
    )
  } finally {
    await close()
  }
}

async function openPlatePage(browser, url, options) {
  const context = await browser.newContext({
    viewport: options.viewport,
    acceptDownloads: options.acceptDownloads ?? false
  })
  const requests = []
  const consoleErrors = []
  const pageErrors = []
  const requestFailures = []

  await context.addInitScript(
    ({
      draftKey,
      legacyDraftKey,
      localeKey,
      themeKey,
      draft,
      legacyConfig,
      locale,
      theme,
      initializeOnce
    }) => {
      const initializationKey = 'nsplate.regression.initialized'

      if (initializeOnce && sessionStorage.getItem(initializationKey)) {
        return
      }

      localStorage.clear()

      if (draft) {
        localStorage.setItem(draftKey, JSON.stringify(draft))
      }

      if (legacyConfig) {
        localStorage.setItem(legacyDraftKey, JSON.stringify(legacyConfig))
      }

      localStorage.setItem(localeKey, locale)
      localStorage.setItem(themeKey, theme)

      if (initializeOnce) {
        sessionStorage.setItem(initializationKey, '1')
      }
    },
    {
      draftKey: DRAFT_KEY,
      legacyDraftKey: LEGACY_DRAFT_KEY,
      localeKey: LOCALE_KEY,
      themeKey: THEME_KEY,
      draft: options.draft ?? null,
      legacyConfig: options.legacyConfig ?? null,
      locale: options.locale ?? 'zh-CN',
      theme: options.theme ?? 'day',
      initializeOnce: options.initializeOnce ?? false
    }
  )

  const page = await context.newPage()
  page.on('request', (request) => requests.push(request.url()))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) => {
    const url = request.url()

    if (url.startsWith('data:')) {
      return
    }

    requestFailures.push(`${url}: ${request.failure()?.errorText ?? 'failed'}`)
  })

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
  await waitForPlateReady(page)

  return {
    page,
    requests,
    consoleErrors,
    pageErrors,
    requestFailures,
    close: () => context.close()
  }
}

async function waitForPlateReady(page) {
  await page.locator('canvas.nsplate-canvas-frame__canvas').waitFor({
    state: 'visible',
    timeout: 30_000
  })
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas.nsplate-canvas-frame__canvas')
    return canvas instanceof HTMLCanvasElement && canvas.width === 2560 && canvas.height === 1440
  })

  const overlayCount = await page.locator('vite-error-overlay, .vite-error-overlay').count()
  assert(overlayCount === 0, 'Vite error overlay is visible')
}

async function inspectCanvas(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas.nsplate-canvas-frame__canvas')

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found')
    }

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas context not available')
    }

    const points = [
      [canvas.width / 2, canvas.height / 2],
      [canvas.width * 0.25, canvas.height * 0.25],
      [canvas.width * 0.75, canvas.height * 0.25],
      [canvas.width * 0.25, canvas.height * 0.75],
      [canvas.width * 0.75, canvas.height * 0.75]
    ]
    let nonTransparentSampleCount = 0

    for (const [x, y] of points) {
      const data = context.getImageData(Math.floor(x), Math.floor(y), 1, 1).data

      if (data[3] > 0) {
        nonTransparentSampleCount += 1
      }
    }

    return {
      width: canvas.width,
      height: canvas.height,
      nonTransparentSampleCount
    }
  })
}

async function readStoredDraft(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  }, DRAFT_KEY)
}

async function downloadFromActionMenu(page, labelPattern) {
  await page.locator('.nsplate-workbench-actions__trigger').click()
  await page.locator('.nsplate-workbench-actions__menu').waitFor({ state: 'visible' })

  const button = page
    .locator('.nsplate-workbench-actions__button')
    .filter({ hasText: labelPattern })
    .first()
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
  const failure = await download.failure()

  assert(!failure, `download failed: ${failure}`)
  return download
}

async function saveDownload(download, tmpDir) {
  const target = join(tmpDir, download.suggestedFilename())
  await download.saveAs(target)
  return target
}

async function assertFileMinSize(filePath, minBytes, message) {
  const bytes = await readFile(filePath)
  assert(bytes.length >= minBytes, `${message}: ${basename(filePath)} has ${bytes.length} bytes`)
}

function assertFilename(filename, pattern) {
  assert(pattern.test(filename), `unexpected filename: ${filename}`)
}

function assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures }) {
  assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(' | ')}`)
  assert(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`)
  assert(requestFailures.length === 0, `request failures: ${requestFailures.join(' | ')}`)
}

function createStoredDraft(manifests, options) {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    portraitSide: options.portraitSide,
    selectedPresetIdsByKind: {
      banner: presetId('banner', manifests.presets.banner, options.presetIndexes.banner),
      charcard: presetId('charcard', manifests.presets.charcard, options.presetIndexes.charcard)
    },
    selectedAssetIdsByCategory: createAssetSelection(manifests.files),
    customPortrait: options.customPortrait,
    infoDraft: {
      activePresetId: options.infoPresetId,
      layersByPresetId: {}
    }
  }
}

function createAssetSelection(files) {
  const selection = {}

  for (const category of PORTRAIT_CATEGORIES) {
    setFirstAsset(selection, files, 'portrait', category)
  }

  for (const category of NAMEPLATE_CATEGORIES) {
    setFirstAsset(selection, files, 'nameplate', category)
  }

  setFirstAsset(selection, files, 'nameplate', PORTRAIT_FRAME_CATEGORY)
  return selection
}

function setFirstAsset(selection, files, scope, category) {
  const assets = files?.[scope]?.[category]

  if (!Array.isArray(assets) || assets.length === 0) {
    return
  }

  selection[sectionKey(scope, category)] = assetSummaryId(scope, category, assets[0], 0)
}

function createLegacyConfig(manifests) {
  const selected = {}

  for (const category of PORTRAIT_CATEGORIES) {
    setLegacySelected(selected, manifests.files, 'portrait', category)
  }

  for (const category of [...NAMEPLATE_CATEGORIES, PORTRAIT_FRAME_CATEGORY]) {
    setLegacySelected(selected, manifests.files, 'nameplate', category)
  }

  return {
    version: 1,
    portraitSide: 'left',
    presetBanner: String(manifests.presets.banner[0]?.name ?? ''),
    presetChar: String(manifests.presets.charcard[0]?.name ?? ''),
    selected,
    customPortrait: {
      dataUrl: createCustomPortraitDataUrl('legacy'),
      fileName: 'legacy-regression.svg',
      scale: 1
    },
    infoPresetName: '国服',
    activePanel: 'info',
    infoLayers: [
      { id: 'text-1', name: '称号', type: 'text', enabled: true, text: '回归称号' },
      { id: 'text-2', name: '角色名', type: 'text', enabled: true, text: '回归角色' },
      {
        id: 'bar-1',
        name: '作息选择',
        type: 'bar48',
        enabled: true,
        states: '101010101010101010101010000000000000000000000000'
      }
    ]
  }
}

function setLegacySelected(selected, files, scope, category) {
  const asset = files?.[scope]?.[category]?.[0]

  if (!asset) {
    return
  }

  selected[category] = {
    id: String(asset.id ?? ''),
    file: String(asset.file ?? ''),
    path: String(asset.path ?? asset.file ?? '')
  }
}

function presetId(kind, presets, index) {
  const safeIndex = Math.min(Math.max(0, index), presets.length - 1)
  return `${kind}:${safeIndex}`
}

function sectionKey(scope, category) {
  return `${scope}:${category}`
}

function assetSummaryId(scope, category, asset, index) {
  const file = normalizeText(asset.file) ?? ''
  const path = normalizeResourcePath(asset.path ?? file)
  const stableIdPart =
    normalizeText(asset.id) ?? normalizeText(path) ?? normalizeText(file) ?? String(index)
  return `${scope}:${category}:${stableIdPart}`
}

function normalizeResourcePath(path) {
  return String(path ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

function normalizeText(value) {
  const text = String(value ?? '').trim()
  return text || undefined
}

function createStandardCustomPortrait(id) {
  return {
    id,
    mode: 'standard',
    fileName: `${id}.svg`,
    dataUrl: createCustomPortraitDataUrl(id),
    width: 512,
    height: 840,
    scale: 1
  }
}

function createPopoutCustomPortrait(id, anchor) {
  const dataUrl = createCustomPortraitDataUrl(id)

  return {
    id,
    mode: 'popout',
    popoutLayerAnchor: anchor,
    fileName: `${id}.svg`,
    dataUrl,
    width: 512,
    height: 840,
    scale: 1,
    sourceDataUrl: dataUrl,
    sourceWidth: 512,
    sourceHeight: 840,
    baseScale: 1,
    scaleMultiplier: 1,
    offsetX: 0,
    offsetY: 0,
    splitY: 360,
    splitLeftY: 300,
    splitRightY: 420
  }
}

function createPairedCustomPortrait(id) {
  return {
    id,
    mode: 'paired',
    pairedPopoutLayerAnchor: 'abovePortraitFrame',
    fileName: `${id}-base.svg`,
    dataUrl: createPairedBaseDataUrl(id),
    overlayFileName: `${id}-popout.svg`,
    overlayDataUrl: createPairedOverlayDataUrl(id),
    overlayWidth: 1080,
    overlayHeight: 1920,
    width: 1080,
    height: 1920,
    scale: 1,
    sourceWidth: 1080,
    sourceHeight: 1920,
    freeX: 1700,
    freeY: 720,
    freeScale: 0.48,
    freeRotation: 0
  }
}

function createPairedBaseDataUrl(label) {
  const safeLabel = escapeXml(label)
  return createBase64SvgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<rect width="216" height="1920" fill="#ff0000"/>
<rect x="216" width="648" height="1920" fill="#00ff00"/>
<rect x="864" width="216" height="1920" fill="#0000ff"/>
<text x="540" y="1680" text-anchor="middle" font-family="Arial, sans-serif" font-size="84" fill="#2f2a44">${safeLabel}</text>
</svg>`)
}

function createPairedOverlayDataUrl(label) {
  const safeLabel = escapeXml(label)
  return createBase64SvgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<path d="M180 640 C240 80 840 80 900 640 L780 820 L300 820 Z" fill="#ff66b3"/>
<text x="540" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" fill="#2f2a44">${safeLabel}</text>
</svg>`)
}

function createBase64SvgDataUrl(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
}

function createUploadSvgBuffer(width, height, color, transparent = false) {
  const content = transparent
    ? `<circle cx="${width / 2}" cy="${height * 0.2}" r="${Math.min(width, height) * 0.18}" fill="${color}"/>`
    : `<rect width="${width}" height="${height}" fill="${color}"/>`
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`,
    'utf8'
  )
}

function createCustomPortraitDataUrl(label) {
  const safeLabel = escapeXml(label)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="840" viewBox="0 0 512 840">
<rect width="512" height="840" fill="#f6d7e8"/>
<rect x="72" y="88" width="368" height="664" fill="#8bd3e6" opacity="0.82"/>
<circle cx="256" cy="250" r="130" fill="#fff6fb"/>
<path d="M128 710 C192 560 320 560 384 710" fill="#2f2a44" opacity="0.9"/>
<path d="M126 402 C182 470 330 470 386 402" fill="none" stroke="#ff66b3" stroke-width="22"/>
<text x="256" y="810" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#2f2a44">${safeLabel}</text>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
