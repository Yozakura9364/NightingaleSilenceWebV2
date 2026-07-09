import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, posix, relative, sep } from 'node:path'
import { gzipSync } from 'node:zlib'

const ROOT = process.cwd()
const DIST_DIR = join(ROOT, 'dist')
const DIST_ASSET_DIR = join(DIST_DIR, 'assets')
const PUBLIC_GLAMOUR_DIR = join(ROOT, 'public', 'data', 'glamour')
const DIST_GLAMOUR_DIR = join(DIST_DIR, 'data', 'glamour')

const NSGLAMOUR_BUNDLE_BUDGETS = {
  jsRawBytes: 260 * 1024,
  jsGzipBytes: 80 * 1024,
  cssRawBytes: 80 * 1024,
  cssGzipBytes: 16 * 1024,
  publicAssetBytes: 5 * 1024 * 1024
}

const REQUIRED_DIST_PATHS = [
  'index.html',
  'assets',
  'data/plate',
  'data/glamour/template-preview',
  'data/glamour/templates'
]

const REQUIRED_GLAMOUR_ASSETS = [
  'template-preview/1-Eorzea Magazine/1-Preview.webp',
  'template-preview/2-Double Pic/2-Preview.webp',
  'template-preview/3-Eorzea Collection/3-preview.webp',
  'template-preview/4-Horizontal Eorzea Magazine/4-Preview.webp',
  'template-preview/5-Risingstones/5-preview.webp',
  'template-preview/6-Silence Fashion/6-preview.webp',
  'templates/double-pic-left-mask.png',
  'templates/eorzea-horizontal-magazine-bg.png',
  'templates/eorzea-magazine.png',
  'templates/silence-fashion-background.png',
  'templates/com_icon_clear.svg'
]

const FORBIDDEN_GLAMOUR_EXTENSIONS = new Set([
  '.ai',
  '.fig',
  '.psb',
  '.psd',
  '.sketch',
  '.svg'
])

const FORBIDDEN_GLAMOUR_PATH_PARTS = [
  'fixture',
  'fixtures',
  'local',
  'private',
  'source',
  'sources',
  'raw'
]

const FORBIDDEN_DIST_FILE_PATTERNS = [
  /item_model_mapping/i,
  /(^|[\\/])font([\\/]|$)/i,
  /cropper/i,
  /\.(?:ai|fig|psb|psd|sketch)$/i
]

const TEXT_DIST_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.svg',
  '.txt',
  '.xml'
])

const FORBIDDEN_DIST_TEXT_PATTERNS = [
  {
    pattern: /(?:^|[^a-zA-Z])(?:[A-Z]:[\\/])/,
    label: 'Windows absolute path',
    severity: 'fail'
  },
  {
    pattern: /(?:^|["'(\s])\/(?:Users|home|opt|root)\//i,
    label: 'local absolute path',
    severity: 'fail'
  },
  {
    pattern: /(?:http:\/\/)?(?:localhost|127\.0\.0\.1):(?:8765|5175|5173|3456|8015)\b/i,
    label: 'local development endpoint',
    severity: 'warn'
  },
  {
    pattern: /tests[\\/]fixtures/i,
    label: 'local fixture path',
    severity: 'fail'
  },
  {
    pattern: /NSGLAMOUR_CONTRACT_/i,
    label: 'contract-check environment variable',
    severity: 'fail'
  }
]

const PLACEHOLDER_SOURCE_DIRS = [
  'src/pages/silence',
  'src/data/silence'
]

const errors = []
const warnings = []

function fail(message) {
  errors.push(message)
}

function warn(message) {
  warnings.push(message)
}

function toPosixPath(path) {
  return path.split(sep).join(posix.sep)
}

function pathExists(path) {
  return existsSync(join(ROOT, path))
}

function walkFiles(dir) {
  if (!existsSync(dir)) {
    return []
  }

  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const nextPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...walkFiles(nextPath))
    } else if (entry.isFile()) {
      files.push(nextPath)
    }
  }

  return files
}

function checkDistShape() {
  if (!existsSync(DIST_DIR)) {
    fail('dist/ does not exist. Run npm run build before npm run check:release.')
    return
  }

  for (const requiredPath of REQUIRED_DIST_PATHS) {
    const absolutePath = join(DIST_DIR, ...requiredPath.split('/'))

    if (!existsSync(absolutePath)) {
      fail(`Missing dist/${requiredPath}.`)
    }
  }

  const indexPath = join(DIST_DIR, 'index.html')

  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, 'utf8')

    if (!html.includes('type="module"')) {
      fail('dist/index.html does not contain a module script.')
    }

    if (!html.includes('/assets/')) {
      fail('dist/index.html does not reference built assets.')
    }
  }
}

function checkGlamourAssets(baseDir, label) {
  if (!existsSync(baseDir)) {
    fail(`${label} does not exist.`)
    return
  }

  for (const requiredAsset of REQUIRED_GLAMOUR_ASSETS) {
    const assetPath = join(baseDir, ...requiredAsset.split('/'))

    if (!existsSync(assetPath)) {
      fail(`Missing ${label}/${requiredAsset}.`)
    }
  }

  const files = walkFiles(baseDir)
  let totalBytes = 0

  for (const file of files) {
    const relativePath = toPosixPath(relative(baseDir, file))
    const lowerPath = relativePath.toLowerCase()
    const extension = lowerPath.slice(lowerPath.lastIndexOf('.'))

    totalBytes += statSync(file).size

    if (
      FORBIDDEN_GLAMOUR_EXTENSIONS.has(extension) &&
      !REQUIRED_GLAMOUR_ASSETS.includes(relativePath)
    ) {
      fail(`${label}/${relativePath} looks like a source/reference asset and must not ship.`)
    }

    if (FORBIDDEN_GLAMOUR_PATH_PARTS.some((part) => lowerPath.split('/').includes(part))) {
      fail(`${label}/${relativePath} is under a private/source-like path and must not ship.`)
    }
  }

  const totalMiB = totalBytes / 1024 / 1024

  if (label === 'dist/data/glamour' && totalBytes > NSGLAMOUR_BUNDLE_BUDGETS.publicAssetBytes) {
    fail(
      `${label} is ${totalMiB.toFixed(2)} MiB; NSGlamour public runtime assets must stay below ${formatBytes(NSGLAMOUR_BUNDLE_BUDGETS.publicAssetBytes)}.`
    )
  }

  if (totalMiB > 8) {
    warn(`${label} is ${totalMiB.toFixed(2)} MiB; confirm no extra template assets were copied.`)
  }
}

function checkDistForbiddenFiles() {
  if (!existsSync(DIST_DIR)) {
    return
  }

  for (const file of walkFiles(DIST_DIR)) {
    const relativePath = toPosixPath(relative(DIST_DIR, file))

    if (FORBIDDEN_DIST_FILE_PATTERNS.some((pattern) => pattern.test(relativePath))) {
      fail(`dist/${relativePath} must not ship with NSGlamour runtime assets.`)
    }
  }
}

function checkDistTextLeaks() {
  if (!existsSync(DIST_DIR)) {
    return
  }

  for (const file of walkFiles(DIST_DIR)) {
    const relativePath = toPosixPath(relative(DIST_DIR, file))
    const lowerPath = relativePath.toLowerCase()
    const extension = lowerPath.slice(lowerPath.lastIndexOf('.'))

    if (!TEXT_DIST_EXTENSIONS.has(extension)) {
      continue
    }

    const text = readFileSync(file, 'utf8')

    for (const { pattern, label, severity } of FORBIDDEN_DIST_TEXT_PATTERNS) {
      if (pattern.test(text)) {
        const message = `dist/${relativePath} contains ${label}; public build should not expose local-only details.`

        if (severity === 'fail' || isNsglamourPublicRuntimePath(relativePath)) {
          fail(message)
        } else {
          warn(message)
        }
      }
    }
  }
}

function isNsglamourPublicRuntimePath(relativePath) {
  return /^assets\/NSGlamourPage-.*\.(?:js|css)$/i.test(relativePath) ||
    relativePath.startsWith('data/glamour/')
}

function checkNsglamourBundleBudget() {
  if (!existsSync(DIST_ASSET_DIR)) {
    fail('dist/assets does not exist. Run npm run build before npm run check:release.')
    return
  }

  const files = readdirSync(DIST_ASSET_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^NSGlamourPage-.*\.(?:js|css)$/.test(entry.name))
    .map((entry) => join(DIST_ASSET_DIR, entry.name))

  const jsFiles = files.filter((file) => file.endsWith('.js'))
  const cssFiles = files.filter((file) => file.endsWith('.css'))

  if (jsFiles.length !== 1) {
    fail(`Expected exactly one NSGlamour JS chunk, found ${jsFiles.length}.`)
  }

  if (cssFiles.length !== 1) {
    fail(`Expected exactly one NSGlamour CSS chunk, found ${cssFiles.length}.`)
  }

  for (const file of jsFiles) {
    checkFileBudget(file, 'NSGlamour JS chunk', NSGLAMOUR_BUNDLE_BUDGETS.jsRawBytes, NSGLAMOUR_BUNDLE_BUDGETS.jsGzipBytes)
  }

  for (const file of cssFiles) {
    checkFileBudget(file, 'NSGlamour CSS chunk', NSGLAMOUR_BUNDLE_BUDGETS.cssRawBytes, NSGLAMOUR_BUNDLE_BUDGETS.cssGzipBytes)
  }
}

function checkFileBudget(file, label, rawBudget, gzipBudget) {
  const bytes = readFileSync(file)
  const gzipBytes = gzipSync(bytes).length
  const relativePath = toPosixPath(relative(DIST_DIR, file))

  if (bytes.length > rawBudget) {
    fail(`${label} dist/${relativePath} is ${formatBytes(bytes.length)} raw; budget is ${formatBytes(rawBudget)}.`)
  }

  if (gzipBytes > gzipBudget) {
    fail(`${label} dist/${relativePath} is ${formatBytes(gzipBytes)} gzip; budget is ${formatBytes(gzipBudget)}.`)
  }
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
  }

  return `${(bytes / 1024).toFixed(1)} KiB`
}

function checkPublicPlaceholders() {
  for (const sourceDir of PLACEHOLDER_SOURCE_DIRS) {
    const absoluteDir = join(ROOT, ...sourceDir.split('/'))

    if (!existsSync(absoluteDir)) {
      continue
    }

    for (const file of walkFiles(absoluteDir)) {
      const relativePath = toPosixPath(relative(ROOT, file))
      const lowerPath = relativePath.toLowerCase()

      if (!lowerPath.endsWith('.ts') && !lowerPath.endsWith('.vue')) {
        continue
      }

      const text = readFileSync(file, 'utf8')
      const placeholderHits =
        (text.match(/textKeys\.placeholder|占位用，待编辑/gu) || []).length

      if (placeholderHits > 0) {
        fail(
          `${relativePath} still contains placeholder-driven public content (${placeholderHits} hit(s)).`
        )
      }
    }
  }
}

checkDistShape()
checkGlamourAssets(PUBLIC_GLAMOUR_DIR, 'public/data/glamour')
checkGlamourAssets(DIST_GLAMOUR_DIR, 'dist/data/glamour')
checkDistForbiddenFiles()
checkDistTextLeaks()
checkNsglamourBundleBudget()
checkPublicPlaceholders()

for (const message of warnings) {
  console.warn(`[warn] ${message}`)
}

if (errors.length > 0) {
  for (const message of errors) {
    console.error(`[fail] ${message}`)
  }

  process.exit(1)
}

console.log(`Release readiness check passed with ${warnings.length} warning(s).`)
