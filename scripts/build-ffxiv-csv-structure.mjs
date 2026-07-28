import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import { parseCsv } from './fashion-check/lib/csv.mjs'

const DEFAULT_OUTPUT = 'docs/ai/data/ffxiv/generated/csv-structure.chs.json'
const SOURCE_REPOSITORY = 'InfSein/ffxiv-datamining-mixed'
const SOURCE_URL = 'https://github.com/InfSein/ffxiv-datamining-mixed/tree/master/chs'

function parseArgs(argv) {
  const args = {
    sourceDir: '',
    sourceCommit: '',
    output: DEFAULT_OUTPUT
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--source-dir') {
      args.sourceDir = resolve(argv[index + 1] ?? '')
      index += 1
      continue
    }

    if (arg === '--source-commit') {
      args.sourceCommit = String(argv[index + 1] ?? '').trim()
      index += 1
      continue
    }

    if (arg === '--output') {
      args.output = argv[index + 1] ?? DEFAULT_OUTPUT
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!args.sourceDir) {
    throw new Error('Missing --source-dir pointing to the mixed repository chs directory')
  }

  if (!/^[0-9a-f]{40}$/i.test(args.sourceCommit)) {
    throw new Error('Missing or invalid --source-commit')
  }

  return args
}

function normalizeHeaderRow(row, width) {
  return Array.from({ length: width }, (_, index) => String(row[index] ?? '').trim())
}

function buildTable(fileName, rows, previousTable) {
  if (rows.length < 3) {
    throw new Error(`${fileName} does not contain the three SaintCoinach header rows`)
  }

  const columnCount = Math.max(rows[0].length, rows[1].length, rows[2].length)
  const rawKeys = normalizeHeaderRow(rows[0], columnCount)
  const fields = normalizeHeaderRow(rows[1], columnCount)
  const types = normalizeHeaderRow(rows[2], columnCount)
  const dataRowCount = rows.slice(3).filter((row) => row.some((value) => value !== '')).length

  return {
    fileName,
    tableName: fileName.replace(/\.csv$/i, ''),
    sourcePath: `chs/${fileName}`,
    columnCount,
    dataRowCount,
    priority: previousTable?.priority ?? '',
    tools: previousTable?.tools ?? '',
    note: previousTable?.note ?? '',
    headerRows: {
      rawKeys,
      fields,
      types
    },
    columns: rawKeys.map((rawKey, index) => ({
      index,
      rawKey,
      field: fields[index],
      type: types[index],
      label: fields[index] || rawKey
    }))
  }
}

async function readPreviousTables(outputPath) {
  try {
    const previous = JSON.parse(await readFile(outputPath, 'utf8'))
    return new Map((previous.tables ?? []).map((table) => [table.fileName, table]))
  } catch (error) {
    if (error?.code === 'ENOENT') return new Map()
    throw error
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const outputPath = resolve(args.output)
  const previousTables = await readPreviousTables(outputPath)
  const fileNames = (await readdir(args.sourceDir))
    .filter((fileName) => fileName.toLowerCase().endsWith('.csv'))
    .sort((left, right) => left.localeCompare(right, 'en'))
  const tables = []

  for (const fileName of fileNames) {
    const text = await readFile(join(args.sourceDir, fileName), 'utf8')
    const rows = parseCsv(text)
    tables.push(buildTable(fileName, rows, previousTables.get(fileName)))
  }

  const document = {
    generatedAt: new Date().toISOString(),
    source: {
      repository: SOURCE_REPOSITORY,
      locale: 'chs',
      url: SOURCE_URL,
      commit: args.sourceCommit
    },
    tableCount: tables.length,
    tables
  }

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')

  console.log(
    JSON.stringify(
      {
        output: outputPath,
        commit: args.sourceCommit,
        tableCount: tables.length,
        dataRowCount: tables.reduce((sum, table) => sum + table.dataRowCount, 0),
        columnCount: tables.reduce((sum, table) => sum + table.columnCount, 0)
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
