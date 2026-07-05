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
  assert(Array.isArray(presets.charcard) && presets.charcard.length > 0, 'presets.charcard is empty')

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
    execFileSync(process.execPath, ['-e', `require('node:fs').accessSync(${JSON.stringify(filePath)})`], {
      stdio: ['ignore', 'ignore', 'ignore']
    })
    return true
  } catch {
    return false
  }
}

function sanitizeSpawnEnv(env) {
  return Object.fromEntries(
    Object.entries(env).filter(
      ([key, value]) =>
        key &&
        !key.startsWith('=') &&
        value !== undefined &&
        !String(value).includes('\u0000')
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

    assert(dataRequests.some((item) => item.includes('/presets.json')), 'presets.json was not requested')
    assert(dataRequests.some((item) => item.includes('/files.json')), 'files.json was not requested')
    assert(legacyCatalogRequests.length === 0, `legacy catalog API was requested: ${legacyCatalogRequests.join(', ')}`)
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
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(browser, url, {
    viewport: { width: 1440, height: 900 },
    draft,
    locale: 'zh-CN',
    theme: 'day'
  })

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
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(browser, url, {
    viewport: { width: 390, height: 844, isMobile: true },
    draft,
    locale: 'en',
    theme: 'night'
  })

  try {
    const canvas = await inspectCanvas(page)
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      theme: document.documentElement.dataset.theme,
      lang: document.documentElement.lang
    }))

    assert(layout.scrollWidth <= layout.clientWidth + 1, `mobile horizontal overflow: ${layout.scrollWidth} > ${layout.clientWidth}`)
    assert(layout.theme === 'night', `theme was ${layout.theme}`)
    assert(layout.lang === 'en', `lang was ${layout.lang}`)
    assert(canvas.nonTransparentSampleCount > 0, 'mobile popout canvas appears blank')
    assertNoBrowserErrors({ consoleErrors, pageErrors, requestFailures })

    return {
      name: 'v2-right-popout-night-mobile',
      detail: `canvas=${canvas.width}x${canvas.height}, viewport=${layout.clientWidth}px`
    }
  } finally {
    await close()
  }
}

async function runLegacyJsonImportCase(browser, url, manifests) {
  const legacyConfig = createLegacyConfig(manifests)
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(browser, url, {
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    theme: 'day'
  })

  try {
    page.on('dialog', (dialog) => dialog.accept())
    await page.locator('input[type="file"][accept*="json"]').setInputFiles({
      name: 'legacy-nsplate-regression.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(legacyConfig), 'utf8')
    })
    await page.waitForFunction((key) => localStorage.getItem(key)?.includes('"portraitSide":"left"'), DRAFT_KEY)

    const stored = await readStoredDraft(page)
    assert(stored?.portraitSide === 'left', 'legacy JSON portraitSide was not imported')
    assert(stored?.customPortrait?.mode === 'standard', 'legacy custom portrait was not imported')
    assert(stored?.infoDraft?.activePresetId === 'china', 'legacy info preset was not imported')
    assert(Object.values(stored?.selectedAssetIdsByCategory ?? {}).filter(Boolean).length >= 4, 'legacy selected assets were not imported')
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
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(browser, url, {
    viewport: { width: 1440, height: 900 },
    legacyConfig,
    locale: 'zh-CN',
    theme: 'day'
  })

  try {
    await page.waitForFunction((key) => Boolean(localStorage.getItem(key)), DRAFT_KEY)
    const stored = await readStoredDraft(page)

    assert(stored?.portraitSide === 'left', 'legacy localStorage portraitSide was not restored')
    assert(stored?.infoDraft?.activePresetId === 'china', 'legacy localStorage info preset was not restored')
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
  const { page, consoleErrors, pageErrors, requestFailures, close } = await openPlatePage(browser, url, {
    viewport: { width: 1440, height: 900 },
    draft,
    locale: 'zh-CN',
    theme: 'day',
    acceptDownloads: true
  })
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
    assert(zipBytes.includes(Buffer.from('composer-config.json')), 'ZIP is missing composer-config.json')
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
    await page.waitForFunction((key) => localStorage.getItem(key)?.includes('"customPortrait"'), DRAFT_KEY)
    const stored = await readStoredDraft(page)
    assert(stored?.customPortrait?.mode === 'popout', 'V2 config roundtrip did not restore popout custom portrait')
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
    ({ draftKey, legacyDraftKey, localeKey, themeKey, draft, legacyConfig, locale, theme }) => {
      localStorage.clear()

      if (draft) {
        localStorage.setItem(draftKey, JSON.stringify(draft))
      }

      if (legacyConfig) {
        localStorage.setItem(legacyDraftKey, JSON.stringify(legacyConfig))
      }

      localStorage.setItem(localeKey, locale)
      localStorage.setItem(themeKey, theme)
    },
    {
      draftKey: DRAFT_KEY,
      legacyDraftKey: LEGACY_DRAFT_KEY,
      localeKey: LOCALE_KEY,
      themeKey: THEME_KEY,
      draft: options.draft ?? null,
      legacyConfig: options.legacyConfig ?? null,
      locale: options.locale ?? 'zh-CN',
      theme: options.theme ?? 'day'
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

  const button = page.locator('.nsplate-workbench-actions__button').filter({ hasText: labelPattern }).first()
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
      { id: 'bar-1', name: '作息选择', type: 'bar48', enabled: true, states: '101010101010101010101010000000000000000000000000' }
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
  const stableIdPart = normalizeText(asset.id) ?? normalizeText(path) ?? normalizeText(file) ?? String(index)
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
    splitY: 360
  }
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
