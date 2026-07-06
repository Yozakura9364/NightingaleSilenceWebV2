import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { TextEncoder } from 'node:util'

const DEFAULT_BASE_URL = 'http://127.0.0.1:8765/api'
const DEFAULT_TIMEOUT_MS = 15000
const REQUIRED_STAIN_COUNT = 100
const BODY_SLOT = 'Body'

const args = parseArgs(process.argv.slice(2))
const encoder = new TextEncoder()
const results = []
const warnings = []
const errors = []
const searchSamples = []

if (args.help) {
  printHelp()
} else {
  await main()
}

async function main() {
  await check('GET /health', checkHealth)
  await check('GET /stains?locale=zh', () => checkStains('zh'))
  await check('GET /stains?locale=en', () => checkStains('en'))
  await check('GET /ui-localization', checkUiLocalization)
  await check('GET /search-items Chinese body query', () =>
    checkBodySearch(['\u957f\u888d', '\u5916\u5957'], 'zh')
  )
  await check('GET /search-items English fallback query', () =>
    checkBodySearch(['robe', 'coat'], 'zh')
  )
  await check('POST /equipinfo/parse-text valid sample', checkEquipinfoParseText)
  await check('POST /equipinfo/parse-text empty text error', checkEquipinfoEmptyText)
  await check('POST /parse-chara optional fixture', checkOptionalParseChara)

  for (const result of results) {
    console.log(`[${result.status}] ${result.name}${result.detail ? ` - ${result.detail}` : ''}`)
  }

  for (const warning of warnings) {
    console.warn(`[warn] ${warning}`)
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[error] ${error}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`NSGlamour contract check passed. baseUrl=${normalizeBaseUrl(args.baseUrl)}`)
}

async function check(name, fn) {
  try {
    const detail = await fn()
    results.push({ name, status: 'ok', detail })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errors.push(`${name}: ${message}`)
    results.push({ name, status: 'fail', detail: message })
  }
}

async function checkHealth() {
  const response = await requestJson('/health')
  expectStatus(response, [200])
  assertPlainObject(response.data, 'health response must be an object')
  assert(response.data.ok === true, 'health.ok must be true')
  return `status=${response.status} bytes=${response.bytes}`
}

async function checkStains(locale) {
  const response = await requestJson('/stains', { query: { locale } })
  expectStatus(response, [200])
  assertPlainObject(response.data, 'stains response must be an object')
  assert(response.data.locale === locale, `stains.locale must be ${locale}`)
  assert(Array.isArray(response.data.results), 'stains.results must be an array')
  assert(
    response.data.results.length >= REQUIRED_STAIN_COUNT,
    `stains.results must contain at least ${REQUIRED_STAIN_COUNT} entries`
  )

  const noDye = response.data.results.find((entry) => Number(entry?.id) === 0)
  assertPlainObject(noDye, 'stains.results must include id=0')
  assert(typeof noDye.name === 'string' && noDye.name.length > 0, 'stain id=0 must include name')
  assertPlainObject(noDye.names, 'stain id=0 must include localized names')
  assert(typeof noDye.hex === 'string' && /^#[0-9a-f]{6}$/i.test(noDye.hex), 'stain id=0 hex must be #rrggbb')

  const cache = response.headers.get('cache-control') ?? ''
  assert(/max-age=3600/.test(cache), 'stains response must keep the 1 hour cache contract')
  return `results=${response.data.results.length} bytes=${response.bytes} cache=${cache}`
}

async function checkUiLocalization() {
  const response = await requestJson('/ui-localization')
  expectStatus(response, [200])
  assertPlainObject(response.data, 'ui-localization response must be an object')
  assert(Number.isFinite(Number(response.data.version)), 'ui-localization.version must be numeric')
  assertPlainObject(response.data.strings, 'ui-localization.strings must be an object')
  assert(Array.isArray(response.data.scope), 'ui-localization.scope must be an array')

  const cache = response.headers.get('cache-control') ?? ''
  assert(/no-store/.test(cache), 'ui-localization response must stay no-store')
  return `version=${response.data.version} strings=${Object.keys(response.data.strings).length} bytes=${response.bytes}`
}

async function checkBodySearch(queries, locale) {
  const attempts = []

  for (const query of queries) {
    const response = await requestJson('/search-items', {
      query: {
        slot: BODY_SLOT,
        q: query,
        locale,
        limit: 5
      }
    })
    expectStatus(response, [200])
    assertPlainObject(response.data, 'search response must be an object')
    assert(response.data.slot === BODY_SLOT, `search.slot must be ${BODY_SLOT}`)
    assert(Array.isArray(response.data.results), 'search.results must be an array')
    attempts.push(`${query}:${response.data.results.length}`)

    if (response.data.results.length === 0) {
      continue
    }

    const first = response.data.results[0]
    validateSearchResult(first)
    searchSamples.push(first)
    return `query=${query} results=${response.data.results.length} first=${first.name ?? first.key}`
  }

  throw new Error(`no search results for ${attempts.join(', ')}`)
}

async function checkEquipinfoParseText() {
  const names = [...new Set(searchSamples.map((sample) => sample?.name).filter(Boolean))]
  assert(names.length > 0, 'a successful search result is required before parse-text can be checked')

  const failures = []

  for (const name of names) {
    const response = await requestJson('/equipinfo/parse-text', {
      method: 'POST',
      json: {
        text: `\u8eab\u4f53\uff1a${name}`,
        source_locale: 'zh'
      }
    })

    if (response.status !== 200) {
      failures.push(`${name}: status ${response.status}`)
      continue
    }

    try {
      validateEquipinfoPayload(response.data)
      const first = response.data.resolved_equipment[0]
      return `entries=${response.data.resolved_equipment.length} slot=${first.slot} item=${name}`
    } catch (error) {
      failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  throw new Error(`no valid parse-text sample succeeded (${failures.join('; ')})`)
}

async function checkEquipinfoEmptyText() {
  const response = await requestJson('/equipinfo/parse-text', {
    method: 'POST',
    json: { text: '', source_locale: 'zh' }
  })
  expectStatus(response, [400])
  assertPlainObject(response.data, 'empty text error response must be an object')
  assert(typeof response.data.error === 'string' && response.data.error.length > 0, 'empty text response must include error')
  return `status=${response.status} error=${response.data.error}`
}

async function checkOptionalParseChara() {
  if (!args.charaFile) {
    warnings.push('POST /parse-chara skipped; set NSGLAMOUR_CONTRACT_CHARA_FILE or --chara-file when a real .chara fixture is available.')
    return 'skipped'
  }

  const filePath = resolve(args.charaFile)
  const bytes = await readFile(filePath)
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'application/json' }), basename(filePath))

  const response = await requestJson('/parse-chara', {
    method: 'POST',
    body: form
  })
  expectStatus(response, [200])
  assertPlainObject(response.data, 'parse-chara response must be an object')
  assert(Array.isArray(response.data.resolved_equipment), 'parse-chara resolved_equipment must be an array')
  assert(response.data.resolved_equipment.length > 0, 'parse-chara must resolve at least one equipment entry')
  return `entries=${response.data.resolved_equipment.length} fixture=${filePath}`
}

function validateSearchResult(result) {
  assertPlainObject(result, 'search result must be an object')
  assert(result.key !== undefined && result.key !== null, 'search result must include key')
  assert(typeof result.name === 'string' && result.name.length > 0, 'search result must include name')
  assertPlainObject(result.names, 'search result must include names')
  assertPlainObject(result.model_main, 'search result must include model_main')
  assert(Array.isArray(result.dye_entries), 'search result must include dye_entries array')
}

function validateEquipinfoPayload(data) {
  assertPlainObject(data, 'parse-text response must be an object')
  assert(data.source_locale === 'zh', 'parse-text source_locale must be zh')
  assert(Array.isArray(data.resolved_equipment), 'parse-text resolved_equipment must be an array')
  assert(data.resolved_equipment.length > 0, 'parse-text must resolve at least one equipment entry')

  const first = data.resolved_equipment[0]
  assertPlainObject(first, 'parse-text first equipment entry must be an object')
  assert(first.slot === BODY_SLOT, `parse-text first equipment slot must be ${BODY_SLOT}`)
  assert(Array.isArray(first.candidates), 'parse-text equipment entry must include candidates')
  assert(first.candidates.length > 0, 'parse-text equipment entry must include at least one candidate')
  validateSearchResult(first.candidates[0])
}

async function requestJson(path, options = {}) {
  const url = buildUrl(path, options.query)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs)
  const headers = new Headers(options.headers ?? {})

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', 'zh')
  }

  const init = {
    method: options.method ?? (options.json === undefined ? 'GET' : 'POST'),
    headers,
    signal: controller.signal
  }

  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json; charset=utf-8')
    init.body = JSON.stringify(options.json)
  } else if (options.body !== undefined) {
    init.body = options.body
  }

  try {
    const response = await fetch(url, init)
    const text = await response.text()
    const data = parseJson(text, url)
    return {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      bytes: encoder.encode(text).length,
      data
    }
  } finally {
    clearTimeout(timeout)
  }
}

function parseJson(text, url) {
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Expected JSON from ${url}, got ${text.slice(0, 120)}`)
  }
}

function expectStatus(response, statuses) {
  if (!statuses.includes(response.status)) {
    throw new Error(
      `expected status ${statuses.join(' or ')}, got ${response.status} ${response.statusText} from ${response.url}`
    )
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertPlainObject(value, message) {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value), message)
}

function buildUrl(path, query = {}) {
  const normalizedPath = String(path ?? '').replace(/^\/+/, '')
  const url = new URL(normalizedPath, normalizeBaseUrl(args.baseUrl))

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  return url
}

function normalizeBaseUrl(value) {
  const text = String(value ?? DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL
  return text.endsWith('/') ? text : `${text}/`
}

function parseArgs(argv) {
  const parsed = {
    baseUrl: process.env.NSGLAMOUR_CONTRACT_BASE_URL || DEFAULT_BASE_URL,
    charaFile: process.env.NSGLAMOUR_CONTRACT_CHARA_FILE || '',
    timeoutMs: parsePositiveInt(process.env.NSGLAMOUR_CONTRACT_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    help: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      parsed.help = true
      continue
    }

    if (arg === '--base-url') {
      parsed.baseUrl = argv[index + 1] || DEFAULT_BASE_URL
      index += 1
      continue
    }

    if (arg === '--chara-file') {
      parsed.charaFile = argv[index + 1] || ''
      index += 1
      continue
    }

    if (arg === '--timeout-ms') {
      parsed.timeoutMs = parsePositiveInt(argv[index + 1], DEFAULT_TIMEOUT_MS)
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return parsed
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function printHelp() {
  console.log(`Check the NSGlamour legacy backend contract used by V2.

Usage:
  node scripts/check-nsglamour-contract.mjs
  node scripts/check-nsglamour-contract.mjs --base-url http://127.0.0.1:5173/api/glamour

Options:
  --base-url <url>     API base URL. Default: ${DEFAULT_BASE_URL}
  --chara-file <path>  Optional real .chara fixture for POST /parse-chara.
  --timeout-ms <ms>    Per-request timeout. Default: ${DEFAULT_TIMEOUT_MS}
  --help, -h           Show this help.

Environment:
  NSGLAMOUR_CONTRACT_BASE_URL
  NSGLAMOUR_CONTRACT_CHARA_FILE
  NSGLAMOUR_CONTRACT_TIMEOUT_MS
`)
}
