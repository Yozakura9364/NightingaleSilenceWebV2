import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const DEFAULT_STORE_CATALOG = 'public/data/armoire-store-catalog.json'
const VALID_REGIONS = new Set(['global', 'tw'])
const require = createRequire(import.meta.url)

function parseArgs(argv) {
  const args = {
    storeCatalog: DEFAULT_STORE_CATALOG,
    regions: ['global', 'tw'],
    dryRun: false,
    overwrite: false,
    limit: 0,
    help: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }

    if (arg === '--store-catalog') {
      args.storeCatalog = argv[index + 1] ?? DEFAULT_STORE_CATALOG
      index += 1
      continue
    }

    if (arg === '--regions') {
      args.regions = String(argv[index + 1] ?? '')
        .split(',')
        .map((region) => region.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--limit') {
      args.limit = Number.parseInt(argv[index + 1] ?? '0', 10)
      index += 1
      continue
    }

    if (arg === '--dry-run') {
      args.dryRun = true
      continue
    }

    if (arg === '--overwrite') {
      args.overwrite = true
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  const unknownRegions = args.regions.filter((region) => !VALID_REGIONS.has(region))
  if (unknownRegions.length > 0) {
    throw new Error(`Unsupported regions: ${unknownRegions.join(', ')}`)
  }

  return args
}

function printHelp() {
  console.log(`Scrape NSArmoire store prices from regional store pages.

Usage:
  node scripts/scrape-armoire-store-prices.mjs

Options:
  --store-catalog <file>  Store catalog to update. Default: ${DEFAULT_STORE_CATALOG}
  --regions <list>        Comma-separated regions: global,tw. Default: global,tw
  --limit <number>        Limit number of URLs per region. Default: no limit
  --dry-run               Print summary without writing
  --overwrite             Replace existing different values. Default: report conflicts only

Notes:
  Global store prices are stored as crysta one-to-one from the displayed yen value.
  Example: "550 円 (税込)" -> "550 crysta".
`)
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeGlobalPriceLabel(priceLabel) {
  const match = cleanText(priceLabel).match(/^([\d,]+)\s*円(?:\s*\(税込\))?$/)
  return match ? `${match[1].replace(/,/g, '')} crysta` : cleanText(priceLabel)
}

function normalizeRegionalPrice(region, priceLabel) {
  if (region === 'global') {
    return normalizeGlobalPriceLabel(priceLabel)
  }

  if (region === 'tw') {
    const match = cleanText(priceLabel).match(/^([\d,]+)\s*(?:水晶|點|点)?$/)
    return match ? `${match[1].replace(/,/g, '')}水晶` : cleanText(priceLabel)
  }

  return cleanText(priceLabel)
}

function getUniqueRegionalUrls(outfits, region, limit) {
  const urls = []
  const seen = new Set()

  for (const outfit of outfits) {
    const url = outfit.regionalStoreUrls?.[region]
    if (typeof url !== 'string' || !url || seen.has(url) || !isSupportedRegionalUrl(region, url)) {
      continue
    }

    seen.add(url)
    urls.push(url)

    if (limit > 0 && urls.length >= limit) {
      break
    }
  }

  return urls
}

function isSupportedRegionalUrl(region, url) {
  if (region === 'global') {
    return /^https:\/\/store\.finalfantasyxiv\.com\/ffxivstore\/[a-z]{2}-[a-z]{2}\/product\/\d+(?:[/?#].*)?$/i.test(
      url
    )
  }

  if (region === 'tw') {
    return /^https:\/\/www\.ffxiv\.com\.tw\/web\/store\/product_detail\.aspx\?id=[A-Za-z0-9_]+(?:[&#].*)?$/i.test(
      url
    )
  }

  return false
}

async function loadPlaywright() {
  try {
    return require('playwright')
  } catch (error) {
    try {
      const globalRoot =
        process.platform === 'win32' && process.env.APPDATA
          ? join(process.env.APPDATA, 'npm', 'node_modules')
          : ''
      if (!globalRoot || !existsSync(join(globalRoot, 'playwright'))) {
        throw new Error('Global Playwright module was not found')
      }
      const globalRequire = createRequire(pathToFileURL(join(globalRoot, 'noop.js')))
      return globalRequire('playwright')
    } catch {
      throw new Error(
        `Playwright is required for scraping dynamic store pages. Install it locally or globally. ${error.message}`
      )
    }
  }
}

async function scrapeGlobalPrice(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(1200)
  const body = await page.evaluate(() => document.body?.innerText ?? '')
  const match = body.match(/([\d,]+)\s*円\s*\(税込\)/)

  return match ? `${match[1].replace(/,/g, '')} crysta` : ''
}

async function scrapeTwPrice(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(1200)
  const lines = await page.evaluate(() =>
    (document.body?.innerText ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  )
  const totalIndex = lines.findIndex((line) => line === '總金額')
  const amount =
    totalIndex >= 0
      ? lines.slice(totalIndex + 1, totalIndex + 5).find((line) => /^[\d,]+$/.test(line))
      : ''

  if (amount) {
    return `${amount.replace(/,/g, '')}水晶`
  }

  const firstPrice = lines.find((line, index) => /^[\d,]+$/.test(line) && lines[index + 1] === '1')
  return firstPrice ? `${firstPrice.replace(/,/g, '')}水晶` : ''
}

async function scrapePrice(page, region, url) {
  if (region === 'global') {
    return scrapeGlobalPrice(page, url)
  }

  if (region === 'tw') {
    return scrapeTwPrice(page, url)
  }

  return ''
}

function applyPrice(outfit, region, priceLabel, args, conflicts) {
  const normalizedPriceLabel = normalizeRegionalPrice(region, priceLabel)
  if (!normalizedPriceLabel) {
    return false
  }

  const regionalPriceLabels = outfit.regionalPriceLabels ?? {}
  const current = regionalPriceLabels[region]
  const normalizedCurrent = current ? normalizeRegionalPrice(region, current) : ''

  if (!current || normalizedCurrent === normalizedPriceLabel || args.overwrite) {
    let changed = current !== normalizedPriceLabel
    outfit.regionalPriceLabels = {
      ...regionalPriceLabels,
      [region]: normalizedPriceLabel
    }

    if (!outfit.priceLabel || outfit.region === region || outfit.priceLabel === current) {
      changed = changed || outfit.priceLabel !== normalizedPriceLabel
      outfit.priceLabel = normalizedPriceLabel
    }

    return changed
  }

  conflicts.push({
    id: outfit.id,
    name: outfit.name,
    region,
    current,
    scraped: normalizedPriceLabel,
    url: outfit.regionalStoreUrls?.[region]
  })
  return false
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const storeCatalogPath = resolve(args.storeCatalog)
  const storeCatalog = JSON.parse(await readFile(storeCatalogPath, 'utf8'))
  const outfits = Array.isArray(storeCatalog.outfits) ? storeCatalog.outfits : []
  const { chromium } = await loadPlaywright()
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage()
  const scraped = {}
  const failures = []
  const conflicts = []

  for (const region of args.regions) {
    const urls = getUniqueRegionalUrls(outfits, region, args.limit)
    scraped[region] = {}

    for (let index = 0; index < urls.length; index += 1) {
      const url = urls[index]

      try {
        const priceLabel = await scrapePrice(page, region, url)
        scraped[region][url] = priceLabel
        console.log(
          `[${region} ${index + 1}/${urls.length}] ${priceLabel || '(no price)'} | ${url}`
        )
      } catch (error) {
        failures.push({ region, url, error: error.message })
        console.log(`[${region} ${index + 1}/${urls.length}] FAIL | ${url} | ${error.message}`)
      }
    }
  }

  await browser.close()

  let updatedCount = 0
  for (const outfit of outfits) {
    for (const region of args.regions) {
      const url = outfit.regionalStoreUrls?.[region]
      const priceLabel = url ? scraped[region]?.[url] : ''
      if (applyPrice(outfit, region, priceLabel, args, conflicts)) {
        updatedCount += 1
      }
    }
  }

  const summary = {
    storeCatalog: storeCatalogPath,
    dryRun: args.dryRun,
    regions: args.regions,
    updatedCount,
    conflictCount: conflicts.length,
    failureCount: failures.length,
    conflicts,
    failures
  }

  console.log(JSON.stringify(summary, null, 2))

  if (!args.dryRun) {
    await writeFile(storeCatalogPath, `${JSON.stringify(storeCatalog, null, 2)}\n`, 'utf8')
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
