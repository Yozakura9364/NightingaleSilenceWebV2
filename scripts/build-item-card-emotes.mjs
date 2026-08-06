import { readFile, writeFile } from 'node:fs/promises'

const DEFAULT_SOURCES = {
  zh: 'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/Emote.csv',
  en: 'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/en/Emote.csv',
  ja: 'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/ja/Emote.csv',
  ko: 'https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master/csv/Emote.csv',
  tc: 'https://raw.githubusercontent.com/thewakingsands/ffxiv-datamining-tc/master/Emote.csv',
  fr: 'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/fr/Emote.csv',
  de: 'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/de/Emote.csv'
}
const LOCALES = Object.keys(DEFAULT_SOURCES)
const OUTPUT_PATH = new URL('../public/data/ffxiv/item-card-emotes.json', import.meta.url)

function argumentValues(name) {
  const values = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) {
      values.push(process.argv[index + 1])
      index += 1
    }
  }
  return values
}

function parseLocaleSpec(value, fallbackLocale) {
  const separator = value.indexOf('=')
  if (separator <= 0) {
    return { locale: fallbackLocale, value }
  }
  const locale = value.slice(0, separator).trim().toLowerCase()
  if (!LOCALES.includes(locale)) {
    return { locale: fallbackLocale, value }
  }
  return { locale, value: value.slice(separator + 1) }
}

function parseCsv(csv) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(cell.trim())
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && csv[index + 1] === '\n') {
        index += 1
      }
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (cell || row.length) {
    row.push(cell.trim())
    rows.push(row)
  }
  return rows
}

function valueAt(row, header, name) {
  const index = header.indexOf(name)
  return index >= 0 ? String(row[index] || '').trim() : ''
}

function parseRows(csv) {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ''))
  const headerIndex = rows.findIndex((row) => row.includes('Name'))
  if (headerIndex < 0) {
    throw new Error('Emote.csv header not found')
  }
  // datamining CSVs keep the key field name in the first metadata row and
  // use `#` as its marker in the display-name row. Align that field before
  // looking up values by name.
  const header = ['key', ...rows[headerIndex].slice(1)]
  const items = []
  for (const row of rows.slice(headerIndex + 1)) {
    if (!row.length || String(row[0] || '').startsWith('#')) {
      continue
    }
    const id = valueAt(row, header, 'key')
    const name = valueAt(row, header, 'Name')
    const icon = Number(valueAt(row, header, 'Icon'))
    if (!/^\d+$/.test(id) || !name || !Number.isFinite(icon) || icon <= 0) {
      continue
    }
    items.push({
      id,
      name,
      icon,
      category: valueAt(row, header, 'EmoteCategory'),
      textCommand: valueAt(row, header, 'TextCommand'),
      unlockLink: valueAt(row, header, 'UnlockLink')
    })
  }
  return items
}

const sourceFiles = argumentValues('--source-file')
const sourceUrlOverrides = argumentValues('--source-url')
const sourceUrls = { ...DEFAULT_SOURCES }
for (const value of sourceUrlOverrides) {
  const spec = parseLocaleSpec(value, 'zh')
  sourceUrls[spec.locale] = spec.value
}

const sourceRecords = {}
if (sourceFiles.length) {
  for (const value of sourceFiles) {
    const spec = parseLocaleSpec(value, 'zh')
    sourceRecords[spec.locale] = {
      source: spec.value,
      items: parseRows(await readFile(spec.value, 'utf8'))
    }
  }
} else {
  for (const locale of LOCALES) {
    const sourceUrl = sourceUrls[locale]
    const response = await fetch(sourceUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${locale} Emote.csv: ${response.status}`)
    }
    sourceRecords[locale] = {
      source: sourceUrl,
      items: parseRows(await response.text())
    }
  }
}

if (!sourceRecords.zh) {
  throw new Error('Chinese Emote.csv source is required as the primary record set')
}

const itemsByLocale = Object.fromEntries(
  Object.entries(sourceRecords).map(([locale, record]) => [
    locale,
    new Map(record.items.map((item) => [item.id, item]))
  ])
)
const items = sourceRecords.zh.items.map((item) => {
  const names = {}
  for (const locale of Object.keys(sourceRecords)) {
    const localizedItem = itemsByLocale[locale].get(item.id)
    if (localizedItem?.name) {
      names[locale] = localizedItem.name
    }
  }
  return { ...item, names }
})

const output = {
  version: 1,
  source: {
    url: sourceUrls.zh,
    locale: 'zh',
    locales: Object.keys(sourceRecords),
    urls: Object.fromEntries(
      Object.keys(sourceRecords).map((locale) => [locale, sourceUrls[locale]])
    )
  },
  generatedAt: new Date().toISOString(),
  items
}

await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`Wrote ${output.items.length} emotes to ${OUTPUT_PATH.pathname}`)
