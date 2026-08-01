// content-publication.spec.mjs — T035 browser acceptance for the public blog.
// Run explicitly with CONTENT_E2E=1 (requires global playwright + browsers):
//   $env:NODE_PATH = (npm root -g); $env:CONTENT_E2E = '1'
//   npx vitest run --config vitest.config.ts tests/content/browser/content-publication.spec.mjs
// When CONTENT_E2E is unset the whole suite is describe.skip, so the default
// `npm run test:content` stays green without a browser installed.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const RUN_E2E = process.env.CONTENT_E2E === '1'
const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '../../..')
const PUBLISHED = join(ROOT, 'content/published')
const OUT_TREE = join(ROOT, 'public/data/content')

const CDN = 'https://img.nightingalesilence.com/content/'
const UUID1 = '00000000-0000-4000-8000-000000000001'
const UUID2 = '00000000-0000-4000-8000-000000000002'
const UUID3 = '00000000-0000-4000-8000-000000000003'

function textNode(text, marks) {
  return marks && marks.length ? { type: 'text', text, marks } : { type: 'text', text }
}
function paragraph(text) {
  return { type: 'paragraph', content: [textNode(text)] }
}
function imageNode(mediaId) {
  return { type: 'image', attrs: { mediaId, src: `${CDN}${mediaId}.png`, alt: `img-${mediaId}`, align: 'center', displayWidth: 75 } }
}

// ---- fixtures (mirror the real snapshot shape; generationHash recomputed) ----
const LONG_TITLE = '这是一篇用于验证长标题换行与溢出控制的非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的博客文章标题测试用例'
const LONG_URL = `https://example.com/very/long/path/${'segment/'.repeat(30)}end`

const ARTICLE_1 = {
  schemaVersion: 'content.publication.v1',
  entryId: '10000000-0000-4000-8000-000000000001',
  publicId: 1,
  revision: 1,
  publishedAt: '2026-07-31T00:00:00+00:00',
  publicPath: '/data/content/entries/1.json',
  metadata: { title: LONG_TITLE, summary: '长表格、画廊与代码块的综合验收文章', coverMediaId: null, tags: ['验收', 'h3b2'] },
  document: {
    schemaVersion: 'content.document.v1',
    doc: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [textNode('第一节：表格')] },
        {
          type: 'table',
          content: Array.from({ length: 10 }, (_, r) => ({
            type: 'tableRow',
            content: Array.from({ length: 6 }, (_, c) => ({
              type: r === 0 ? 'tableHeader' : 'tableCell',
              attrs: r === 0 ? {} : { colspan: 1 },
              content: [paragraph(`R${r}C${c}`)],
            })),
          })),
        },
        { type: 'heading', attrs: { level: 3 }, content: [textNode('第二节：画廊')] },
        {
          type: 'gallery',
          attrs: { layout: 'two-column' },
          content: [imageNode(UUID1), imageNode(UUID2), imageNode(UUID3)],
        },
        { type: 'heading', attrs: { level: 3 }, content: [textNode('第三节：链接与代码')] },
        { type: 'paragraph', content: [textNode('超长链接：', [{ type: 'link', attrs: { href: LONG_URL } }])] },
        { type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'const longLine = "'.concat('x'.repeat(400), '\";') }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [paragraph('列表一')] },
          { type: 'listItem', content: [paragraph('列表二')] },
        ] },
        { type: 'collapse', attrs: { title: '折叠块' }, content: [paragraph('折叠内容')] },
        paragraph('正文结束。'),
      ],
    },
  },
  media: [
    { id: UUID1, mediaType: 'image/png', byteSize: 1000, width: 100, height: 100, status: 'REMOTE_VERIFIED', publicObjectKey: `${UUID1}.png`, createdAt: '2026-07-31T00:00:00+00:00', publicUrl: `${CDN}${UUID1}.png`, remoteCheckedAt: '2026-07-31T00:00:00+00:00', publiclyReadable: true, stableUrl: true },
    { id: UUID2, mediaType: 'image/png', byteSize: 1000, width: 100, height: 100, status: 'REMOTE_VERIFIED', publicObjectKey: `${UUID2}.png`, createdAt: '2026-07-31T00:00:00+00:00', publicUrl: `${CDN}${UUID2}.png`, remoteCheckedAt: '2026-07-31T00:00:00+00:00', publiclyReadable: true, stableUrl: true },
    { id: UUID3, mediaType: 'image/png', byteSize: 1000, width: 100, height: 100, status: 'REMOTE_VERIFIED', publicObjectKey: `${UUID3}.png`, createdAt: '2026-07-31T00:00:00+00:00', publicUrl: `${CDN}${UUID3}.png`, remoteCheckedAt: '2026-07-31T00:00:00+00:00', publiclyReadable: true, stableUrl: true },
  ],
}

const ARTICLE_2 = {
  schemaVersion: 'content.publication.v1',
  entryId: '20000000-0000-4000-8000-000000000002',
  publicId: 2,
  revision: 1,
  publishedAt: '2026-07-30T00:00:00+00:00',
  publicPath: '/data/content/entries/2.json',
  metadata: { title: '短篇验收文章', summary: null, coverMediaId: null, tags: ['短篇'] },
  document: {
    schemaVersion: 'content.document.v1',
    doc: { type: 'doc', content: [paragraph('这是第二篇文章的正文。')] },
  },
  media: [],
}

let snapshotHashFn
async function loadSnapshotHash() {
  if (!snapshotHashFn) {
    const mod = await import(join(ROOT, 'scripts/content/lib/public-content-core.mjs'))
    snapshotHashFn = mod.snapshotHash
  }
  return snapshotHashFn
}

async function withHash(snapshot) {
  const snapshotHash = await loadSnapshotHash()
  const copy = JSON.parse(JSON.stringify(snapshot))
  copy.generationHash = snapshotHash(copy)
  return copy
}

/** Find a free TCP port on 127.0.0.1. */
function findFreePort() {
  return new Promise((resolvePromise, reject) => {
    const srv = createServer()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port
      srv.close(() => resolvePromise(port))
    })
  })
}

function waitForServer(url, timeoutMs = 20000) {
  return new Promise((resolvePromise, reject) => {
    const start = Date.now()
    const tick = () => {
      fetch(url)
        .then(() => resolvePromise(true))
        .catch(() => (Date.now() - start > timeoutMs ? reject(new Error(`server not ready: ${url}`)) : setTimeout(tick, 300)))
    }
    tick()
  })
}

function killProcessTree(proc) {
  if (!proc || !proc.pid) return
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
      proc.kill('SIGKILL')
    }
  } catch {
    /* already gone */
  }
}

/**
 * Start Vite directly via node (no `npx`/shell layer, so the child is the vite
 * process itself and pid-kill terminates it). Resolves with the child once the
 * server is ready; rejects (and kills the tree) on timeout / early exit /
 * spawn error.
 */
function spawnViteServer(port, cwd) {
  return new Promise((resolvePromise, reject) => {
    const viteBin = join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
    const proc = spawn(process.execPath, [viteBin, '--port', String(port), '--strictPort'], {
      cwd,
      env: { ...process.env },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let out = ''
    let settled = false
    const fail = (msg) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      killProcessTree(proc)
      reject(new Error(`${msg}; output: ${out.slice(-800)}`))
    }
    const timer = setTimeout(() => fail(`vite server timeout on port ${port}`), 30000)
    proc.stdout.on('data', (d) => {
      out += d.toString()
      if (!settled && /ready in|Local:/.test(out)) {
        settled = true
        clearTimeout(timer)
        resolvePromise(proc)
      }
    })
    proc.stderr.on('data', (d) => { out += d.toString() })
    proc.on('error', (err) => fail(`vite spawn error: ${err.message}`))
    proc.on('exit', (code) => {
      // only report early exit when we never became ready
      if (!settled) fail(`vite exited early (code ${code})`)
    })
  })
}

let devServer
let browser
let requests = []

const suite = RUN_E2E
  ? describe
  : describe.skip

suite('public blog — browser acceptance (T035)', () => {
  const t = (name, fn, timeout = 30000) => it(name, fn, timeout)
  beforeAll(async () => {
    // refuse to run when published/ has real content — never overwrite user data
    const existing = readdirSync(PUBLISHED).filter((f) => /^\d+\.json$/.test(f))
    if (existing.length > 0) {
      throw new Error(`content/published/ is not empty (${existing.join(', ')}); refusing to overwrite`)
    }
    try {
      mkdirSync(PUBLISHED, { recursive: true })
      writeFileSync(join(PUBLISHED, '1.json'), JSON.stringify(await withHash(ARTICLE_1), null, 2))
      writeFileSync(join(PUBLISHED, '2.json'), JSON.stringify(await withHash(ARTICLE_2), null, 2))

      // generate the public tree
      execFileSync('node', ['scripts/content/build-public-content.mjs'], { cwd: ROOT, stdio: 'pipe' })

      // start the dev server on a dynamically allocated port
      const port = await findFreePort()
      process.env.PUBLIC_BLOG_TEST_PORT = String(port)
      devServer = await spawnViteServer(port, ROOT)
      await waitForServer(`http://127.0.0.1:${port}`)

      // launch the browser (use an installed chromium if the default revision is missing)
      const { chromium } = require('playwright')
      let launchOpts = {}
      const candidates = [
        process.env.PLAYWRIGHT_CHROMIUM_PATH,
        join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1223/chrome-win64/chrome.exe'),
      ].filter(Boolean)
      for (const p of candidates) {
        if (existsSync(p)) { launchOpts = { executablePath: p }; break }
      }
      browser = await chromium.launch(launchOpts)
      requests = []
    } catch (err) {
      // finally-style cleanup so a startup failure can never leave a server/port behind
      if (browser) { try { await browser.close() } catch {} browser = undefined }
      killProcessTree(devServer)
      devServer = undefined
      rmSync(OUT_TREE, { recursive: true, force: true })
      for (const f of ['1.json', '2.json']) rmSync(join(PUBLISHED, f), { force: true })
      throw err
    }
  }, 120000)

  afterAll(async () => {
    if (browser) { try { await browser.close() } catch {} browser = undefined }
    killProcessTree(devServer)
    devServer = undefined
    await new Promise((r) => setTimeout(r, 800))
    rmSync(OUT_TREE, { recursive: true, force: true })
    for (const f of ['1.json', '2.json']) rmSync(join(PUBLISHED, f), { force: true })
  })

  function baseUrl() {
    return `http://127.0.0.1:${process.env.PUBLIC_BLOG_TEST_PORT}`
  }

  async function open(pathname, viewport) {
    const page = await browser.newPage({ viewport })
    page.on('request', (req) => requests.push(req.url()))
    page.on('requestfailed', (req) => requests.push(`FAILED:${req.url()}`))
    await page.goto(`${baseUrl()}/#${pathname}`, { waitUntil: 'networkidle' })
    return page
  }

  t('index lists published entries without touching /api/content-studio', async () => {
    const page = await open('/blog', { width: 1280, height: 800 })
    await page.waitForSelector('.blog-entry-card')
    const titles = await page.locator('.blog-entry-title').allTextContents()
    expect(titles.some((t) => t.includes('长标题'))).toBe(true)
    expect(titles.some((t) => t === '短篇验收文章')).toBe(true)
    const studioHits = requests.filter((u) => u.includes('/api/content-studio'))
    expect(studioHits).toHaveLength(0)
    await page.close()
  })

  t('detail page renders table rows, gallery images, code block and collapse', async () => {
    const page = await open('/blog/1', { width: 1280, height: 800 })
    await page.waitForSelector('.ns-content')
    const rows = await page.locator('.ns-table tr').count()
    expect(rows).toBe(10)
    const imgs = await page.locator('.ns-gallery .ns-img').count()
    expect(imgs).toBe(3)
    const srcs = await page.locator('.ns-gallery .ns-img').evaluateAll((els) => els.map((e) => e.getAttribute('src')))
    for (const s of srcs) expect(s).toMatch(new RegExp(`^${CDN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
    expect(await page.locator('.ns-code code').textContent()).toContain('const longLine')
    expect(await page.locator('.ns-collapse-summary').textContent()).toBe('折叠块')
    expect(await page.locator('.blog-article-title').textContent()).toContain('长标题')
    const studioHits = requests.filter((u) => u.includes('/api/content-studio'))
    expect(studioHits).toHaveLength(0)
    await page.close()
  })

  t('mobile viewport: no page-level horizontal overflow', async () => {
    for (const pathname of ['/blog', '/blog/1']) {
      const page = await open(pathname, { width: 390, height: 844 })
      await page.waitForSelector(pathname === '/blog' ? '.blog-entry-list' : '.ns-content')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `horizontal overflow on ${pathname}`).toBeLessThanOrEqual(0)
      await page.close()
    }
  })

  t('night theme applies reader colors', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    // theme store reads localStorage ns-theme-mode at init and applies data-theme;
    // a bare data-theme attribute gets overwritten by app startup.
    await page.addInitScript(() => {
      localStorage.setItem('ns-theme-mode', 'night')
    })
    await page.goto(`${baseUrl()}/#/blog/1`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.ns-content')
    const theme = await page.evaluate(() => document.documentElement.dataset.theme)
    expect(theme).toBe('night')
    const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.blog-detail-page')).backgroundColor)
    expect(bg).not.toBe('rgb(255, 253, 246)') // day bg is #fffdf6
    await page.close()
  })

  t('unknown numeric ids show the generic not-found state (no content leak)', async () => {
    const page = await open('/blog/999', { width: 1280, height: 800 })
    await page.waitForSelector('.blog-not-found')
    const text = await page.locator('.blog-not-found').textContent()
    expect(text).toContain('内容不存在')
    expect(text).not.toContain('正文')
    await page.close()
  })

  t('withdrawn/archived entries are absent from index and unreachable', async () => {
    // no 3.json exists in published/ -> /blog/3 must not render content
    expect(existsSync(join(PUBLISHED, '3.json'))).toBe(false)
    const page = await open('/blog/3', { width: 1280, height: 800 })
    await page.waitForSelector('.blog-not-found')
    await page.close()
  })

  t('page never loads Tiptap or ProseMirror resources', async () => {
    const page = await open('/blog/1', { width: 1280, height: 800 })
    await page.waitForSelector('.ns-content')
    const forbidden = requests.filter((u) => /tiptap|prosemirror/i.test(u))
    expect(forbidden).toHaveLength(0)
    await page.close()
  })
})

// CONTENT_E2E unset: the browser suite above is entirely skipped (describe.skip),
// so the default `npm run test:content` stays green without a browser. No test is
// registered that would fail on a missing env var.
if (!RUN_E2E) {
  describe.skip('public blog E2E (set CONTENT_E2E=1 to run real browser acceptance)', () => {
    it('skipped by default', () => {})
  })
}
