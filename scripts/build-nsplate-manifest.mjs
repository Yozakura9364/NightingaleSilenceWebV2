import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

const DEFAULT_SOURCE_API_BASE = 'http://127.0.0.1:3456/api'
const DEFAULT_OUTPUT_DIR = 'public/data/plate'
const DEFAULT_STATIC_IMG_BASE = 'https://img.nightingalesilence.com'
const DEFAULT_PREVIEW_MAX_EDGE = 256
const UNRELEASED_MATERIAL_RANGES = [
  [190000, 199999],
  [230000, 239999]
]

function parseArgs(argv) {
  const args = {
    sourceApiBase: process.env.NSPLATE_SOURCE_API_BASE ?? DEFAULT_SOURCE_API_BASE,
    outputDir: process.env.NSPLATE_MANIFEST_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR,
    imgBase: process.env.NSPLATE_STATIC_IMG_BASE ?? DEFAULT_STATIC_IMG_BASE,
    previewImgBase: process.env.NSPLATE_STATIC_PREVIEW_IMG_BASE,
    previewImgBaseExplicit: process.env.NSPLATE_STATIC_PREVIEW_IMG_BASE !== undefined,
    previewMaxEdge: parsePositiveInt(
      process.env.NSPLATE_STATIC_PREVIEW_MAX_EDGE,
      DEFAULT_PREVIEW_MAX_EDGE
    ),
    includeUnreleased: parseBooleanEnv(process.env.NSPLATE_INCLUDE_UNRELEASED, true)
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
      args.previewImgBaseExplicit = true
      index += 1
      continue
    }

    if (arg === '--preview-max-edge') {
      args.previewMaxEdge = parsePositiveInt(argv[index + 1], DEFAULT_PREVIEW_MAX_EDGE)
      index += 1
      continue
    }

    if (arg === '--include-unreleased') {
      args.includeUnreleased = true
      continue
    }

    if (arg === '--exclude-unreleased') {
      args.includeUnreleased = false
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  args.sourceApiBase = normalizeBaseUrl(args.sourceApiBase)
  args.imgBase = String(args.imgBase ?? '').trim().replace(/\/+$/, '')
  args.previewImgBase = args.previewImgBaseExplicit
    ? String(args.previewImgBase ?? '')
        .trim()
        .replace(/\/+$/, '')
    : undefined
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
  --img-base <url>        Override files._meta.imgBase. Default: ${DEFAULT_STATIC_IMG_BASE}
  --preview-img-base <url> Override files._meta.previewImgBase. Omitted by default.
  --preview-max-edge <px> Set files._meta.previewMaxEdge when preview base is provided. Default: ${DEFAULT_PREVIEW_MAX_EDGE}
  --include-unreleased    Keep materials marked as unreleased by the source API. This is the default.
  --exclude-unreleased    Remove materials marked as unreleased by the source API.

Environment:
  NSPLATE_SOURCE_API_BASE
  NSPLATE_MANIFEST_OUTPUT_DIR
  NSPLATE_STATIC_IMG_BASE
  NSPLATE_STATIC_PREVIEW_IMG_BASE
  NSPLATE_STATIC_PREVIEW_MAX_EDGE
  NSPLATE_INCLUDE_UNRELEASED (defaults to true; set to 0 only for a separate non-public manifest)
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

function parseBooleanEnv(value, fallback = false) {
  const text = String(value ?? '').trim()

  if (!text) {
    return fallback
  }

  if (/^(1|true|yes|on)$/i.test(text)) {
    return true
  }

  if (/^(0|false|no|off)$/i.test(text)) {
    return false
  }

  return fallback
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function applyStaticManifestRules(files, args) {
  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    return {
      files,
      stats: createEmptyFileStats()
    }
  }

  const nextFiles = {
    ...files,
    _meta: {
      ...(files._meta && typeof files._meta === 'object' && !Array.isArray(files._meta)
        ? files._meta
        : {})
    }
  }

  nextFiles._meta.imgBase = args.imgBase || DEFAULT_STATIC_IMG_BASE

  if (args.previewImgBaseExplicit && args.previewImgBase) {
    nextFiles._meta.previewImgBase = args.previewImgBase
    nextFiles._meta.previewMaxEdge = args.previewMaxEdge
  } else {
    delete nextFiles._meta.previewImgBase
    delete nextFiles._meta.previewMaxEdge
  }

  const stats = createEmptyFileStats()

  for (const scope of ['portrait', 'nameplate']) {
    const sourceGroups = files[scope]

    if (!sourceGroups || typeof sourceGroups !== 'object' || Array.isArray(sourceGroups)) {
      continue
    }

    const nextGroups = {}

    for (const [category, assets] of Object.entries(sourceGroups)) {
      const sourceAssets = Array.isArray(assets) ? assets : []
      const nextAssets = []
      const categoryStats = {
        totalSourceAssets: sourceAssets.length,
        totalAssets: 0,
        unreleasedAssetsIncluded: 0,
        unreleasedAssetsRemoved: 0,
        placeholderAssetsRemoved: 0
      }

      for (const asset of sourceAssets) {
        const assetId = getAssetNumericId(asset)
        const unreleased = isUnreleasedAsset(asset)
        const placeholder = isPlaceholderMaterialId(assetId)

        if (placeholder) {
          categoryStats.placeholderAssetsRemoved += 1
          stats.placeholderAssetsRemoved += 1
          continue
        }

        if (unreleased && !args.includeUnreleased) {
          categoryStats.unreleasedAssetsRemoved += 1
          stats.unreleasedAssetsRemoved += 1
          continue
        }

        if (unreleased) {
          categoryStats.unreleasedAssetsIncluded += 1
          stats.unreleasedAssetsIncluded += 1
        }

        nextAssets.push(asset)
      }

      categoryStats.totalAssets = nextAssets.length
      nextGroups[category] = nextAssets
      stats.byScope[scope].categories[category] = categoryStats
      stats.byScope[scope].categoryCount += 1
      stats.byScope[scope].totalSourceAssets += categoryStats.totalSourceAssets
      stats.byScope[scope].totalAssets += categoryStats.totalAssets
      stats.byScope[scope].unreleasedAssetsIncluded += categoryStats.unreleasedAssetsIncluded
      stats.byScope[scope].unreleasedAssetsRemoved += categoryStats.unreleasedAssetsRemoved
      stats.byScope[scope].placeholderAssetsRemoved += categoryStats.placeholderAssetsRemoved
    }

    nextFiles[scope] = nextGroups
    stats.totalSourceAssets += stats.byScope[scope].totalSourceAssets
    stats.totalAssets += stats.byScope[scope].totalAssets
  }

  return {
    files: nextFiles,
    stats
  }
}

function createEmptyFileStats() {
  return {
    totalSourceAssets: 0,
    totalAssets: 0,
    unreleasedAssetsIncluded: 0,
    unreleasedAssetsRemoved: 0,
    placeholderAssetsRemoved: 0,
    byScope: {
      portrait: createScopeStats(),
      nameplate: createScopeStats()
    }
  }
}

function createScopeStats() {
  return {
    categoryCount: 0,
    totalSourceAssets: 0,
    totalAssets: 0,
    unreleasedAssetsIncluded: 0,
    unreleasedAssetsRemoved: 0,
    placeholderAssetsRemoved: 0,
    categories: {}
  }
}

function getAssetNumericId(asset) {
  if (!asset || typeof asset !== 'object') {
    return undefined
  }

  for (const value of [asset.id, asset.file, asset.path, asset.name]) {
    const id = parseMaterialId(value)

    if (id !== undefined) {
      return id
    }
  }

  return undefined
}

function parseMaterialId(value) {
  const text = String(value ?? '').trim()

  if (!text) {
    return undefined
  }

  const exact = Number.parseInt(text, 10)

  if (Number.isFinite(exact) && String(exact) === text.replace(/^0+/, '') && exact > 0) {
    return exact
  }

  const match = text.match(/(?:^|[^\d])(\d{5,6})(?:[^\d]|$)/)

  if (!match) {
    return undefined
  }

  const id = Number.parseInt(match[1], 10)
  return Number.isFinite(id) && id > 0 ? id : undefined
}

function isUnreleasedAsset(asset) {
  return Boolean(asset && typeof asset === 'object' && asset.unreleased)
}

function isPlaceholderMaterialId(id) {
  if (!Number.isFinite(id) || !isUnreleasedMaterialScope(id)) {
    return false
  }

  return id === 234400 || id % 1000 === 0 || id % 1000 === 1
}

function isUnreleasedMaterialScope(id) {
  return UNRELEASED_MATERIAL_RANGES.some(([min, max]) => id >= min && id <= max)
}

function createManifestMeta({ args, presets, files, fileStats }) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    imgBase: files?._meta?.imgBase ?? null,
    previewImgBase: files?._meta?.previewImgBase ?? null,
    includeUnreleased: args.includeUnreleased,
    presets: {
      banner: Array.isArray(presets?.banner) ? presets.banner.length : 0,
      charcard: Array.isArray(presets?.charcard) ? presets.charcard.length : 0
    },
    files: fileStats
  }
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
  const { files: staticFiles, stats: fileStats } = applyStaticManifestRules(files, args)
  const manifestMeta = createManifestMeta({
    args,
    presets,
    files: staticFiles,
    fileStats
  })
  const written = await Promise.all([
    writeJson(join(outputDir, 'presets.json'), presets),
    writeJson(join(outputDir, 'files.json'), staticFiles),
    writeJson(join(outputDir, 'manifest-meta.json'), manifestMeta)
  ])

  for (const filePath of written) {
    console.log(`Wrote ${filePath}`)
  }

  console.log(
    [
      `NSPlate manifest assets: ${fileStats.totalAssets}/${fileStats.totalSourceAssets}`,
      `unreleased removed: ${fileStats.unreleasedAssetsRemoved}`,
      `unreleased included: ${fileStats.unreleasedAssetsIncluded}`,
      `placeholders removed: ${fileStats.placeholderAssetsRemoved}`
    ].join(', ')
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
