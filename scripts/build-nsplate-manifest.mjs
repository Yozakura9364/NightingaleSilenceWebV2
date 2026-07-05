import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

const DEFAULT_SOURCE_API_BASE = 'http://127.0.0.1:3456/api'
const DEFAULT_OUTPUT_DIR = 'public/data/plate'

function parseArgs(argv) {
  const args = {
    sourceApiBase: process.env.NSPLATE_SOURCE_API_BASE ?? DEFAULT_SOURCE_API_BASE,
    outputDir: process.env.NSPLATE_MANIFEST_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR,
    imgBase: process.env.NSPLATE_STATIC_IMG_BASE,
    previewImgBase: process.env.NSPLATE_STATIC_PREVIEW_IMG_BASE
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }

    if (arg === '--source-api-base') {
      args.sourceApiBase = argv[index + 1] ?? DEFAULT_SOURCE_API_BASE
      index += 1
      continue
    }

    if (arg === '--output-dir') {
      args.outputDir = argv[index + 1] ?? DEFAULT_OUTPUT_DIR
      index += 1
      continue
    }

    if (arg === '--img-base') {
      args.imgBase = argv[index + 1] ?? ''
      index += 1
      continue
    }

    if (arg === '--preview-img-base') {
      args.previewImgBase = argv[index + 1] ?? ''
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  args.sourceApiBase = normalizeBaseUrl(args.sourceApiBase)
  return args
}

function printHelp() {
  console.log(`Build NSPlate static manifest from the current legacy-compatible API.

Usage:
  node scripts/build-nsplate-manifest.mjs
  node scripts/build-nsplate-manifest.mjs --source-api-base http://127.0.0.1:3456/api

Options:
  --source-api-base <url>  Source API base. Default: ${DEFAULT_SOURCE_API_BASE}
  --output-dir <dir>      Output directory. Default: ${DEFAULT_OUTPUT_DIR}
  --img-base <url>        Override files._meta.imgBase in the generated manifest.
  --preview-img-base <url> Override files._meta.previewImgBase in the generated manifest.

Environment:
  NSPLATE_SOURCE_API_BASE
  NSPLATE_MANIFEST_OUTPUT_DIR
  NSPLATE_STATIC_IMG_BASE
  NSPLATE_STATIC_PREVIEW_IMG_BASE
`)
}

async function fetchJson(baseUrl, path) {
  const url = `${baseUrl}${path}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'NightingaleSilence NSPlate manifest builder'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

function normalizeBaseUrl(value) {
  return String(value ?? DEFAULT_SOURCE_API_BASE).trim().replace(/\/+$/, '')
}

function applyStaticBaseOverrides(files, args) {
  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    return files
  }

  const nextFiles = {
    ...files,
    _meta: {
      ...(files._meta && typeof files._meta === 'object' && !Array.isArray(files._meta)
        ? files._meta
        : {})
    }
  }

  if (typeof args.imgBase === 'string') {
    nextFiles._meta.imgBase = args.imgBase
  }

  if (typeof args.previewImgBase === 'string') {
    nextFiles._meta.previewImgBase = args.previewImgBase
  }

  return nextFiles
}

async function writeJson(filePath, value) {
  const target = resolve(filePath)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return target
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const [presets, files] = await Promise.all([
    fetchJson(args.sourceApiBase, '/presets'),
    fetchJson(args.sourceApiBase, '/files')
  ])
  const outputDir = resolve(args.outputDir)
  const written = await Promise.all([
    writeJson(join(outputDir, 'presets.json'), presets),
    writeJson(join(outputDir, 'files.json'), applyStaticBaseOverrides(files, args))
  ])

  for (const filePath of written) {
    console.log(`Wrote ${filePath}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
