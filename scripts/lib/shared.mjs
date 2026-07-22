import { readFile } from 'node:fs/promises'

/**
 * Parse CSV text with BOM handling, quoted fields, and line-ending normalization.
 * Filters out trailing blank rows.
 */
export function parseCsv(text) {
  const normalized = text
    .replace(/^﻿/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index]

    if (char === '"') {
      if (inQuotes && normalized[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if (char === '\n' && !inQuotes) {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  if (field || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((csvRow) => csvRow.some((value) => value !== ''))
}

/**
 * Pad or truncate a row to match the expected width.
 */
export function normalizeRow(row, width) {
  if (row.length < width) {
    return [...row, ...Array.from({ length: width - row.length }, () => '')]
  }

  if (row.length > width) {
    return row.slice(0, width)
  }

  return row
}

/**
 * Load SaintCoinach-format CSV rows (header at row index 1, data from row index 3).
 */
export function loadSheetRows(text) {
  const rows = parseCsv(text)

  if (rows.length < 4) {
    throw new Error('CSV content is too short')
  }

  const headers = rows[1].map((value) => value.replace(/^﻿/, '').trim())
  return rows.slice(3).map((row) => {
    const normalized = normalizeRow(row, headers.length)
    return Object.fromEntries(headers.map((header, index) => [header, normalized[index] ?? '']))
  })
}

/**
 * Parse an integer from a value, returning 0 for invalid/missing input.
 */
export function parseInteger(value) {
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    return 0
  }

  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Clean text: strip SoftHyphen/Indent tags and trim whitespace.
 */
export function cleanText(value) {
  return String(value ?? '')
    .replace(/<(?:SoftHyphen|Indent)\s*\/>/gi, '')
    .trim()
}

/**
 * Read a JSON file and parse it.
 */
export async function readJsonFile(path) {
  const text = await readFile(path, 'utf8')
  return JSON.parse(text)
}

/** @deprecated Use readJsonFile instead */
export const readJson = readJsonFile

/**
 * Normalize URL: strip trailing slashes.
 */
export function normalizeBaseUrl(value) {
  return String(value ?? '').trim().replace(/\/+$/, '')
}
