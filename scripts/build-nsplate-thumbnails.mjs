import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const DEFAULT_MANIFEST_DIR = 'public/data/plate'
const DEFAULT_OUTPUT_ROOT = '../.cache/nsplate-thumbnails'
const DEFAULT_MAX_EDGE = 256
const DEFAULT_CONCURRENCY = 4
const DEFAULT_FORMAT = 'png'
const DEFAULT_WEBP_QUALITY = 82

function parseArgs(argv) {
  const maxEdge = parsePositiveInt(
    process.env.NSPLATE_THUMBNAIL_MAX_EDGE,
    DEFAULT_MAX_EDGE
  )
  const args = {
    manifestDir: process.env.NSPLATE_MANIFEST_OUTPUT_DIR ?? DEFAULT_MANIFEST_DIR,
    sourceDir: process.env.NSPLATE_THUMBNAIL_SOURCE_DIR,
    outputDir:
      process.env.NSPLATE_THUMBNAIL_OUTPUT_DIR ??
      join(DEFAULT_OUTPUT_ROOT, String(maxEdge)),
    maxEdge,
    concurrency: parsePositiveInt(
      process.env.NSPLATE_THUMBNAIL_CONCURRENCY,
      DEFAULT_CONCURRENCY
    ),
    limit: 0,
    force: parseBooleanEnv(process.env.NSPLATE_THUMBNAIL_FORCE),
    dryRun: false,
    format: normalizeOutputFormat(process.env.NSPLATE_THUMBNAIL_FORMAT, DEFAULT_FORMAT),
    quality: parsePositiveInt(
      process.env.NSPLATE_THUMBNAIL_QUALITY,
      DEFAULT_WEBP_QUALITY
    ),
    magickBin: process.env.MAGICK_PATH || process.env.NSPLATE_MAGICK_PATH || 'magick'
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

    if (arg === '--source-dir') {
      args.sourceDir = argv[index + 1] ?? ''
      index += 1
      continue
    }

    if (arg === '--output-dir') {
      args.outputDir = argv[index + 1] ?? join(DEFAULT_OUTPUT_ROOT, String(args.maxEdge))
      index += 1
      continue
    }

    if (arg === '--max-edge') {
      args.maxEdge = parsePositiveInt(argv[index + 1], DEFAULT_MAX_EDGE)
      index += 1
      continue
    }

    if (arg === '--concurrency') {
      args.concurrency = parsePositiveInt(argv[index + 1], DEFAULT_CONCURRENCY)
      index += 1
      continue
    }

    if (arg === '--limit') {
      args.limit = Math.max(0, Number.parseInt(argv[index + 1] ?? '0', 10) || 0)
      index += 1
      continue
    }

    if (arg === '--force') {
      args.force = true
      continue
    }

    if (arg === '--dry-run') {
      args.dryRun = true
      continue
    }

    if (arg === '--format') {
      args.format = normalizeOutputFormat(argv[index + 1], DEFAULT_FORMAT)
      index += 1
      continue
    }

    if (arg === '--quality') {
      args.quality = parsePositiveInt(argv[index + 1], DEFAULT_WEBP_QUALITY)
      index += 1
      continue
    }

    if (arg === '--magick-bin') {
      args.magickBin = argv[index + 1] ?? 'magick'
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  args.manifestDir = resolve(args.manifestDir)
  args.sourceDir = args.sourceDir ? resolve(args.sourceDir) : ''
  args.outputDir = resolve(args.outputDir)
  return args
}

function printHelp() {
  console.log(`Build NSPlate static thumbnails from files.json.

Usage:
  npm run build:plate-thumbnails -- --source-dir "H:\\解包\\nine-1326554799"
  node scripts/build-nsplate-thumbnails.mjs --source-dir /path/to/extracted/root --max-edge 256

Options:
  --manifest-dir <dir>  Manifest directory. Default: ${DEFAULT_MANIFEST_DIR}
  --source-dir <dir>    Local source root containing ui/icon. Required.
  --output-dir <dir>    Output root. Default: ${DEFAULT_OUTPUT_ROOT}/<max-edge>
  --max-edge <px>       Thumbnail max edge. Default: ${DEFAULT_MAX_EDGE}
  --concurrency <n>     Concurrent ImageMagick processes. Default: ${DEFAULT_CONCURRENCY}
  --limit <n>           Process only the first n unique images, useful for smoke checks.
  --force               Rebuild existing thumbnails.
  --dry-run             Only report source/output paths.
  --format <format>     Output format: png or webp. Default: ${DEFAULT_FORMAT}
  --quality <n>         WebP quality. Default: ${DEFAULT_WEBP_QUALITY}
  --magick-bin <path>   ImageMagick executable. Default: magick

Environment:
  NSPLATE_MANIFEST_OUTPUT_DIR
  NSPLATE_THUMBNAIL_SOURCE_DIR
  NSPLATE_THUMBNAIL_OUTPUT_DIR
  NSPLATE_THUMBNAIL_MAX_EDGE
  NSPLATE_THUMBNAIL_CONCURRENCY
  NSPLATE_THUMBNAIL_FORCE
  NSPLATE_THUMBNAIL_FORMAT
  NSPLATE_THUMBNAIL_QUALITY
  MAGICK_PATH / NSPLATE_MAGICK_PATH
`)
}

function parseBooleanEnv(value) {
  return /^(1|true|yes|on)$/i.test(String(value ?? '').trim())
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeOutputFormat(value, fallback = DEFAULT_FORMAT) {
  const format = String(value ?? '').trim().toLowerCase()
  return ['png', 'webp'].includes(format) ? format : fallback
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

  if (!args.sourceDir) {
    throw new Error('Missing --source-dir. Provide the extracted material root that contains ui/icon.')
  }

  await ensureReadableDirectory(args.sourceDir, 'source directory')
  await ensureMagickAvailable(args.magickBin)

  const files = await readJson(join(args.manifestDir, 'files.json'))
  const paths = collectUniquePngPaths(files)
  const selectedPaths = args.limit > 0 ? paths.slice(0, args.limit) : paths

  if (selectedPaths.length === 0) {
    throw new Error('No PNG assets found in files.json.')
  }

  console.log(
    `NSPlate thumbnails: ${selectedPaths.length}/${paths.length} image(s), maxEdge=${args.maxEdge}, format=${args.format}, output=${args.outputDir}`
  )

  const jobs = []
  const missingPaths = []
  let missing = 0

  for (const relativePath of selectedPaths) {
    const sourcePath = await resolveLocalSourcePath(args.sourceDir, relativePath)

    if (!sourcePath) {
      missing += 1
      missingPaths.push(relativePath)
      jobs.push({
        relativePath,
        missing: true
      })
      continue
    }

    jobs.push({
      relativePath,
      sourcePath,
      outputPath: resolveOutputPath(args.outputDir, relativePath, args.format)
    })
  }

  if (args.dryRun) {
    const preview = jobs.slice(0, 10).map((job) => ({
      path: job.relativePath,
      source: job.sourcePath ?? null,
      output: job.outputPath ?? null,
      missing: Boolean(job.missing)
    }))
    console.log(JSON.stringify({ total: jobs.length, missing, preview }, null, 2))
    return
  }

  const stats = {
    generated: 0,
    skipped: 0,
    missing,
    failed: 0,
    completed: 0
  }

  await runQueue(jobs, Math.max(1, args.concurrency), async (job) => {
    try {
      if (!job.missing) {
        if (!args.force && (await fileExists(job.outputPath))) {
          stats.skipped += 1
        } else {
          await createThumbnail(
            job.sourcePath,
            job.outputPath,
            args.maxEdge,
            args.format,
            args.quality,
            args.magickBin
          )
          stats.generated += 1
        }
      }
    } catch (error) {
      stats.failed += 1
      console.error(
        `Failed ${job.relativePath}: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    stats.completed += 1

    if (stats.completed % 100 === 0 || stats.completed === jobs.length) {
      console.log(
        `Progress ${stats.completed}/${jobs.length}: generated=${stats.generated}, skipped=${stats.skipped}, missing=${stats.missing}, failed=${stats.failed}`
      )
    }
  })

  console.log(
    `NSPlate thumbnails done: generated=${stats.generated}, skipped=${stats.skipped}, missing=${stats.missing}, failed=${stats.failed}`
  )

  if (missingPaths.length > 0) {
    await mkdir(args.outputDir, { recursive: true })
    const missingFilePath = join(args.outputDir, 'missing-thumbnails.json')
    await writeFile(missingFilePath, `${JSON.stringify(missingPaths, null, 2)}\n`, 'utf8')
    console.log(`Missing thumbnail source list: ${missingFilePath}`)
  }

  if (stats.missing > 0 || stats.failed > 0) {
    process.exitCode = 1
  }
}

function collectUniquePngPaths(files) {
  const seen = new Set()
  const paths = []

  for (const scope of ['portrait', 'nameplate']) {
    const groups = files?.[scope]

    if (!groups || typeof groups !== 'object' || Array.isArray(groups)) {
      continue
    }

    for (const assets of Object.values(groups)) {
      if (!Array.isArray(assets)) {
        continue
      }

      for (const asset of assets) {
        const relativePath = normalizeAssetPath(asset?.path ?? asset?.file)

        if (!relativePath || !/\.png$/i.test(relativePath) || seen.has(relativePath)) {
          continue
        }

        seen.add(relativePath)
        paths.push(relativePath)
      }
    }
  }

  return paths
}

function normalizeAssetPath(value) {
  return String(value ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

async function resolveLocalSourcePath(sourceDir, relativePath) {
  const normalized = normalizeAssetPath(relativePath)
  const decoded = decodeAssetPathForFileSystem(normalized)
  const candidates = [
    join(sourceDir, ...normalized.split('/')),
    join(sourceDir, ...decoded.split('/'))
  ]

  for (const prefix of ['ui/icon/', 'ui/']) {
    for (const candidatePath of [normalized, decoded]) {
      if (candidatePath.toLowerCase().startsWith(prefix)) {
        candidates.push(join(sourceDir, ...candidatePath.slice(prefix.length).split('/')))
      }
    }
  }

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate
    }
  }

  return undefined
}

function resolveOutputPath(outputDir, relativePath, format) {
  const decoded = decodeAssetPathForFileSystem(relativePath)
  const outputPath = format === 'webp' ? decoded.replace(/\.[^./]+$/, '.webp') : decoded
  return join(outputDir, ...outputPath.split('/'))
}

function decodeAssetPathForFileSystem(relativePath) {
  return normalizeAssetPath(relativePath)
    .split('/')
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })
    .join('/')
}

async function createThumbnail(sourcePath, outputPath, maxEdge, format, quality, magickBin) {
  await mkdir(dirname(outputPath), { recursive: true })
  const formatArgs =
    format === 'webp'
      ? [
          '-define',
          'webp:method=6',
          '-define',
          'webp:alpha-quality=100',
          '-quality',
          String(quality)
        ]
      : []
  await execFileAsync(
    magickBin,
    [
      sourcePath,
      '-filter',
      'point',
      '-resize',
      `${maxEdge}x${maxEdge}>`,
      '-strip',
      ...formatArgs,
      outputPath
    ],
    {
      windowsHide: true,
      maxBuffer: 1024 * 1024
    }
  )
}

async function runQueue(items, concurrency, worker) {
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      await worker(items[index], index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
  )
}

async function ensureReadableDirectory(dir, label) {
  const info = await stat(dir).catch(() => null)

  if (!info || !info.isDirectory()) {
    throw new Error(`${label} is not a directory: ${dir}`)
  }

  await access(dir, fsConstants.R_OK)
}

async function ensureMagickAvailable(magickBin) {
  try {
    await execFileAsync(magickBin, ['-version'], {
      windowsHide: true,
      maxBuffer: 1024 * 1024
    })
  } catch (error) {
    throw new Error(
      `ImageMagick executable is not available (${magickBin}). Install ImageMagick or pass --magick-bin.`
    )
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
