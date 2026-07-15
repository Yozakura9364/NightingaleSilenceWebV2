import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const DEFAULT_MANIFEST_DIR = 'public/data/plate'
const DEFAULT_EXPECTED_IMG_BASE = 'https://img.nightingalesilence.com'
const DEFAULT_EXPECTED_PREVIEW_BASE = 'https://img.nightingalesilence.com/plate-preview-webp/256'
const DEFAULT_EXPECTED_PREVIEW_MAX_EDGE = 256
const DEFAULT_EXPECTED_PREVIEW_FORMAT = 'webp'
const UNRELEASED_MATERIAL_RANGES = [
  [190000, 199999],
  [230000, 239999]
]
const REQUIRED_CATEGORIES = {
  portrait: ['肖像背景', '肖像装饰框', '肖像装饰物'],
  nameplate: ['铭牌背衬', '铭牌底色', '铭牌花纹', '铭牌外框', '肖像外框']
}

function parseArgs(argv) {
  const args = {
    manifestDir: process.env.NSPLATE_MANIFEST_OUTPUT_DIR ?? DEFAULT_MANIFEST_DIR,
    expectedImgBase: process.env.NSPLATE_STATIC_IMG_BASE ?? DEFAULT_EXPECTED_IMG_BASE,
    expectedPreviewImgBase:
      process.env.NSPLATE_STATIC_PREVIEW_IMG_BASE ?? DEFAULT_EXPECTED_PREVIEW_BASE,
    expectedPreviewMaxEdge: parsePositiveInt(
      process.env.NSPLATE_STATIC_PREVIEW_MAX_EDGE,
      DEFAULT_EXPECTED_PREVIEW_MAX_EDGE
    ),
    expectedPreviewFormat: normalizePreviewFormat(
      process.env.NSPLATE_STATIC_PREVIEW_FORMAT,
      DEFAULT_EXPECTED_PREVIEW_FORMAT
    ),
    allowUnreleased: parseBooleanEnv(process.env.NSPLATE_INCLUDE_UNRELEASED, true),
    checkRemote: parseBooleanEnv(process.env.NSPLATE_CHECK_REMOTE),
    checkPreviewRemote: parseBooleanEnv(process.env.NSPLATE_CHECK_PREVIEW_REMOTE),
    expectPreview: parseBooleanEnv(process.env.NSPLATE_EXPECT_PREVIEW),
    remoteSamples: 5
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }

    if (arg === '--manifest-dir') {
      args.manifestDir = argv[index + 1] ?? DEFAULT_MANIFEST_DIR
      index += 1
      continue
    }

    if (arg === '--expected-img-base') {
      args.expectedImgBase = argv[index + 1] ?? DEFAULT_EXPECTED_IMG_BASE
      index += 1
      continue
    }

    if (arg === '--expected-preview-img-base') {
      args.expectedPreviewImgBase = argv[index + 1] ?? DEFAULT_EXPECTED_PREVIEW_BASE
      index += 1
      continue
    }

    if (arg === '--expected-preview-max-edge') {
      args.expectedPreviewMaxEdge = parsePositiveInt(
        argv[index + 1],
        DEFAULT_EXPECTED_PREVIEW_MAX_EDGE
      )
      index += 1
      continue
    }

    if (arg === '--expected-preview-format') {
      args.expectedPreviewFormat = normalizePreviewFormat(
        argv[index + 1],
        DEFAULT_EXPECTED_PREVIEW_FORMAT
      )
      index += 1
      continue
    }

    if (arg === '--allow-unreleased') {
      args.allowUnreleased = true
      continue
    }

    if (arg === '--disallow-unreleased') {
      args.allowUnreleased = false
      continue
    }

    if (arg === '--expect-preview') {
      args.expectPreview = true
      continue
    }

    if (arg === '--check-remote') {
      args.checkRemote = true
      continue
    }

    if (arg === '--check-preview-remote') {
      args.checkPreviewRemote = true
      continue
    }

    if (arg === '--remote-samples') {
      args.remoteSamples = Math.max(0, Number.parseInt(argv[index + 1] ?? '0', 10) || 0)
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  args.manifestDir = resolve(args.manifestDir)
  args.expectedImgBase = normalizeBase(args.expectedImgBase)
  args.expectedPreviewImgBase = normalizeBase(args.expectedPreviewImgBase)
  return args
}

function printHelp() {
  console.log(`Check NSPlate static manifest files.

Usage:
  node scripts/check-nsplate-static-manifest.mjs
  node scripts/check-nsplate-static-manifest.mjs --check-remote

Options:
  --manifest-dir <dir>       Manifest directory. Default: ${DEFAULT_MANIFEST_DIR}
  --expected-img-base <url>  Expected files._meta.imgBase. Default: ${DEFAULT_EXPECTED_IMG_BASE}
  --expected-preview-img-base <url> Expected files._meta.previewImgBase. Default: ${DEFAULT_EXPECTED_PREVIEW_BASE}
  --expected-preview-max-edge <px>  Expected files._meta.previewMaxEdge. Default: ${DEFAULT_EXPECTED_PREVIEW_MAX_EDGE}
  --expected-preview-format <format> Expected files._meta.previewFormat. Default: ${DEFAULT_EXPECTED_PREVIEW_FORMAT}
  --allow-unreleased         Allow assets marked as unreleased. This is the default.
  --disallow-unreleased      Fail if assets marked as unreleased are present.
  --expect-preview           Require previewImgBase and previewMaxEdge.
  --check-remote             Probe a few generated COS URLs.
  --check-preview-remote     Probe a few generated preview COS URLs.
  --remote-samples <count>   Remote URLs to probe. Default: 5

Environment:
  NSPLATE_MANIFEST_OUTPUT_DIR
  NSPLATE_STATIC_IMG_BASE
  NSPLATE_STATIC_PREVIEW_IMG_BASE
  NSPLATE_STATIC_PREVIEW_MAX_EDGE
  NSPLATE_STATIC_PREVIEW_FORMAT
  NSPLATE_INCLUDE_UNRELEASED (defaults to true)
  NSPLATE_CHECK_REMOTE
  NSPLATE_CHECK_PREVIEW_REMOTE
  NSPLATE_EXPECT_PREVIEW
`)
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

function normalizePreviewFormat(value, fallback = DEFAULT_EXPECTED_PREVIEW_FORMAT) {
  const format = String(value ?? '').trim().toLowerCase()
  return ['png', 'webp', 'avif'].includes(format) ? format : fallback
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeBase(value) {
  return String(value ?? '')
    .trim()
    .replace(/\/+$/, '')
}

async function readJson(filePath) {
  const text = await readFile(filePath, 'utf8')
  return JSON.parse(text)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const errors = []
  const warnings = []
  const presetsPath = join(args.manifestDir, 'presets.json')
  const filesPath = join(args.manifestDir, 'files.json')
  const metaPath = join(args.manifestDir, 'manifest-meta.json')
  const [presets, files, manifestMeta] = await Promise.all([
    readJson(presetsPath),
    readJson(filesPath),
    readJson(metaPath)
  ])

  validatePresets(presets, errors)
  const assetStats = validateFiles(files, args, errors, warnings)
  validateManifestMeta(manifestMeta, args, assetStats, errors, warnings)

  if (JSON.stringify(files).includes('/portable')) {
    errors.push('files.json still contains /portable paths; static manifest must not depend on old service paths.')
  }

  if (args.checkRemote) {
    await validateRemoteSamples(files, args, {
      base: files?._meta?.imgBase,
      format: null,
      label: 'asset',
      errors,
      warnings
    })
  }

  if (args.checkPreviewRemote) {
    await validateRemoteSamples(files, args, {
      base: files?._meta?.previewImgBase,
      format: files?._meta?.previewFormat,
      label: 'preview asset',
      errors,
      warnings
    })
  }

  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`)
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`Error: ${error}`)
    }
    process.exitCode = 1
    return
  }

  console.log(
    [
      'NSPlate static manifest check passed.',
      `presets: banner=${Array.isArray(presets.banner) ? presets.banner.length : 0}, charcard=${
        Array.isArray(presets.charcard) ? presets.charcard.length : 0
      }`,
      `assets: ${assetStats.totalAssets}`,
      `imgBase: ${files?._meta?.imgBase ?? '(missing)'}`,
      `previewImgBase: ${files?._meta?.previewImgBase ?? '(missing)'}`,
      `previewFormat: ${files?._meta?.previewFormat ?? '(source)'}`,
      `remote: ${args.checkRemote ? 'checked' : 'skipped'}`,
      `previewRemote: ${args.checkPreviewRemote ? 'checked' : 'skipped'}`
    ].join(' ')
  )
}

function validatePresets(presets, errors) {
  if (!presets || typeof presets !== 'object' || Array.isArray(presets)) {
    errors.push('presets.json must be an object.')
    return
  }

  for (const key of ['banner', 'charcard']) {
    if (!Array.isArray(presets[key]) || presets[key].length === 0) {
      errors.push(`presets.${key} must be a non-empty array.`)
    }
  }
}

function validateFiles(files, args, errors, warnings) {
  const stats = {
    totalAssets: 0,
    unreleasedAssets: 0,
    placeholderAssets: 0,
    byScope: {
      portrait: 0,
      nameplate: 0
    }
  }

  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    errors.push('files.json must be an object.')
    return stats
  }

  if (!files._meta || typeof files._meta !== 'object' || Array.isArray(files._meta)) {
    errors.push('files._meta must be an object.')
  } else {
    const imgBase = normalizeBase(files._meta.imgBase)

    if (imgBase !== args.expectedImgBase) {
      errors.push(`files._meta.imgBase must be ${args.expectedImgBase}, got ${imgBase || '(missing)'}.`)
    }

    if (files._meta.previewImgBase) {
      const previewImgBase = normalizeBase(files._meta.previewImgBase)

      if (previewImgBase !== args.expectedPreviewImgBase) {
        errors.push(
          `files._meta.previewImgBase must be ${args.expectedPreviewImgBase}, got ${previewImgBase}.`
        )
      }

      if (Number(files._meta.previewMaxEdge) !== args.expectedPreviewMaxEdge) {
        errors.push(
          `files._meta.previewMaxEdge must be ${args.expectedPreviewMaxEdge}, got ${files._meta.previewMaxEdge}.`
        )
      }

      if (normalizePreviewFormat(files._meta.previewFormat, '') !== args.expectedPreviewFormat) {
        errors.push(
          `files._meta.previewFormat must be ${args.expectedPreviewFormat}, got ${
            files._meta.previewFormat || '(missing)'
          }.`
        )
      }
    } else if (args.expectPreview) {
      errors.push('files._meta.previewImgBase is required when --expect-preview is used.')
    }
  }

  for (const scope of ['portrait', 'nameplate']) {
    const groups = files[scope]

    if (!groups || typeof groups !== 'object' || Array.isArray(groups)) {
      errors.push(`files.${scope} must be an object of categories.`)
      continue
    }

    for (const category of REQUIRED_CATEGORIES[scope]) {
      if (!Array.isArray(groups[category]) || groups[category].length === 0) {
        errors.push(`files.${scope}.${category} must exist and contain assets.`)
      }
    }

    for (const [category, assets] of Object.entries(groups)) {
      if (!Array.isArray(assets)) {
        errors.push(`files.${scope}.${category} must be an array.`)
        continue
      }

      stats.byScope[scope] += assets.length
      stats.totalAssets += assets.length

      for (const [index, asset] of assets.entries()) {
        validateAsset(asset, `${scope}.${category}[${index}]`, args, stats, errors)
      }
    }
  }

  return stats
}

function validateAsset(asset, location, args, stats, errors) {
  if (!asset || typeof asset !== 'object' || Array.isArray(asset)) {
    errors.push(`${location} must be an object.`)
    return
  }

  if (!asset.path && !asset.file) {
    errors.push(`${location} must include path or file.`)
  }

  if (asset.unreleased) {
    stats.unreleasedAssets += 1

    if (!args.allowUnreleased) {
      errors.push(`${location} is marked unreleased, but this check disallows unreleased assets.`)
    }
  }

  const id = getAssetNumericId(asset)

  if (isPlaceholderMaterialId(id)) {
    stats.placeholderAssets += 1
    errors.push(`${location} uses placeholder material id ${id}.`)
  }
}

function validateManifestMeta(manifestMeta, args, assetStats, errors, warnings) {
  if (!manifestMeta || typeof manifestMeta !== 'object' || Array.isArray(manifestMeta)) {
    errors.push('manifest-meta.json must be an object.')
    return
  }

  if (manifestMeta.schemaVersion !== 1) {
    errors.push(`manifest-meta.schemaVersion must be 1, got ${manifestMeta.schemaVersion}.`)
  }

  if (normalizeBase(manifestMeta.imgBase) !== args.expectedImgBase) {
    errors.push(
      `manifest-meta.imgBase must be ${args.expectedImgBase}, got ${
        normalizeBase(manifestMeta.imgBase) || '(missing)'
      }.`
    )
  }

  if (args.expectPreview) {
    if (normalizeBase(manifestMeta.previewImgBase) !== args.expectedPreviewImgBase) {
      errors.push(
        `manifest-meta.previewImgBase must be ${args.expectedPreviewImgBase}, got ${
          normalizeBase(manifestMeta.previewImgBase) || '(missing)'
        }.`
      )
    }

    if (normalizePreviewFormat(manifestMeta.previewFormat, '') !== args.expectedPreviewFormat) {
      errors.push(
        `manifest-meta.previewFormat must be ${args.expectedPreviewFormat}, got ${
          manifestMeta.previewFormat || '(missing)'
        }.`
      )
    }
  }

  if (manifestMeta.includeUnreleased && !args.allowUnreleased) {
    errors.push('manifest-meta.includeUnreleased is true, but this check disallows unreleased assets.')
  }

  const metaTotalAssets = Number(manifestMeta.files?.totalAssets)

  if (Number.isFinite(metaTotalAssets) && metaTotalAssets !== assetStats.totalAssets) {
    errors.push(
      `manifest-meta.files.totalAssets=${metaTotalAssets} does not match files.json total ${assetStats.totalAssets}.`
    )
  }

  if (Number(manifestMeta.files?.unreleasedAssetsRemoved ?? 0) === 0 && !args.allowUnreleased) {
    warnings.push(
      'manifest-meta reports 0 removed unreleased assets. This is valid if the source API already hid unreleased materials.'
    )
  }
}

async function validateRemoteSamples(files, args, options) {
  const errors = options.errors
  const warnings = options.warnings
  const urls = collectSampleUrls(files, args.remoteSamples, options.base, options.format)

  if (urls.length === 0) {
    errors.push(`No ${options.label} URLs available for remote check.`)
    return
  }

  for (const url of urls) {
    const result = await probeRemoteUrl(url)

    if (!result.ok) {
      errors.push(`Remote ${options.label} check failed: ${url} (${result.message})`)
    }
  }

  if (urls.length < args.remoteSamples) {
    warnings.push(`Only ${urls.length} remote ${options.label} URL(s) were available for sampling.`)
  }
}

function collectSampleUrls(files, limit, rawBase, format) {
  const base = normalizeBase(rawBase)
  const urls = []

  if (!base || limit <= 0) {
    return urls
  }

  for (const scope of ['portrait', 'nameplate']) {
    const groups = files[scope]

    if (!groups || typeof groups !== 'object' || Array.isArray(groups)) {
      continue
    }

    for (const assets of Object.values(groups)) {
      if (!Array.isArray(assets)) {
        continue
      }

      for (const asset of assets) {
        const path = normalizeAssetPath(asset?.path ?? asset?.file)

        if (path) {
          urls.push(`${base}/${replaceAssetExtension(path, format)}`)
        }

        if (urls.length >= limit) {
          return urls
        }
      }
    }
  }

  return urls
}

function replaceAssetExtension(path, format) {
  return format ? path.replace(/\.[^./]+$/, `.${format}`) : path
}

async function probeRemoteUrl(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'NightingaleSilence NSPlate static manifest checker'
      }
    })

    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Range: 'bytes=0-0',
          'User-Agent': 'NightingaleSilence NSPlate static manifest checker'
        }
      })
      await response.body?.cancel()
    }

    return {
      ok: response.ok,
      message: `${response.status} ${response.statusText}`
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error)
    }
  } finally {
    clearTimeout(timeout)
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

function isPlaceholderMaterialId(id) {
  if (!Number.isFinite(id) || !isUnreleasedMaterialScope(id)) {
    return false
  }

  return id === 234400 || id % 1000 === 0 || id % 1000 === 1
}

function isUnreleasedMaterialScope(id) {
  return UNRELEASED_MATERIAL_RANGES.some(([min, max]) => id >= min && id <= max)
}

function normalizeAssetPath(value) {
  return String(value ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
