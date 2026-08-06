import { readFile } from 'node:fs/promises'

const fileUrl = new URL('../public/data/ffxiv/item-card-emotes.json', import.meta.url)
const data = JSON.parse(await readFile(fileUrl, 'utf8'))

if (data?.version !== 1 || !data?.source?.url || !Array.isArray(data.items)) {
  throw new Error('Invalid item-card emote data envelope')
}

const sourceLocales = Array.isArray(data.source.locales) ? data.source.locales : []
if (!sourceLocales.includes('zh')) {
  throw new Error('Emote data requires a zh primary locale')
}

const ids = new Set()
for (const item of data.items) {
  if (!item || !String(item.id || '').trim() || !String(item.name || '').trim()) {
    throw new Error('Emote records require id and name')
  }
  if (!Number.isFinite(Number(item.icon)) || Number(item.icon) <= 0) {
    throw new Error(`Invalid emote icon: ${item.id}`)
  }
  if (ids.has(String(item.id))) {
    throw new Error(`Duplicate emote id: ${item.id}`)
  }
  ids.add(String(item.id))
  if (item.names !== undefined) {
    if (!item.names || typeof item.names !== 'object' || Array.isArray(item.names)) {
      throw new Error(`Invalid localized emote names: ${item.id}`)
    }
    for (const [locale, name] of Object.entries(item.names)) {
      if (!String(locale).trim() || typeof name !== 'string' || !name.trim()) {
        throw new Error(`Invalid localized emote name: ${item.id}`)
      }
    }
  }
}

console.log(`Checked ${data.items.length} item-card emotes`)
