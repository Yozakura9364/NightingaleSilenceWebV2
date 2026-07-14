import type { GlamourImportPayload } from '@/pages/item-card/lib/types'

const WIKI_ITEM_PATTERN = /\{\{\s*物品\s*[|｜]\s*([^{}|｜]+?)(?:[|｜][^{}]*)?\}\}/giu
const NUMERIC_ITEM_ID_PATTERN = /^[1-9]\d*$/u

export function normalizeItemCardImportText(value: string): string {
  const normalizedBreaks = String(value || '')
    .replace(/<br\s*\/?\s*>/giu, '\n')
    .replace(/\r\n?/gu, '\n')
  const normalizedItems = normalizedBreaks.replace(WIKI_ITEM_PATTERN, (_match, itemName: string) =>
    itemName.trim()
  )

  return normalizedItems
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

export function getNumericItemIdsFromImportText(value: string): string[] {
  return [
    ...new Set(
      String(value || '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => NUMERIC_ITEM_ID_PATTERN.test(line))
    )
  ]
}

export function replaceNumericItemIdsInImportText(
  value: string,
  itemNamesById: ReadonlyMap<string, string>
): string {
  return String(value || '')
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      return NUMERIC_ITEM_ID_PATTERN.test(trimmed) ? itemNamesById.get(trimmed) || trimmed : line
    })
    .join('\n')
}

export function prepareItemCardTextPayload(payload: GlamourImportPayload): GlamourImportPayload {
  const rows = Array.isArray(payload.resolved_equipment) ? payload.resolved_equipment : []

  return {
    ...payload,
    _itemCardRowsVersion: 1,
    _cardRows: rows
  }
}
