#!/usr/bin/env node
// check-local-boundary: production build must not leak author-only assets or secrets.
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve } from 'path'

const root = resolve(import.meta.dirname, '..', '..')
const dist = resolve(root, 'dist')
const assets = resolve(dist, 'assets')

function fail(label, detail) {
  console.error(`[FAIL] ${label}: ${detail}`)
  process.exitCode = 1
}

// ---- 1. Gitignore coverage ----
const gi = readFileSync(resolve(root, '.gitignore'), 'utf-8')
const requiredLines = [
  'local-assets/',
  'local-assets/content-studio/',
  'content-studio',
]
for (const line of requiredLines) {
  if (!gi.includes(line)) {
    fail('gitignore', `missing entry: ${line}`)
  }
}

// ---- 2. Hardcoded addresses ----
function scanDir(dir, patterns) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return
  for (const entry of readdirSync(dir, { recursive: true })) {
    const p = resolve(dir, entry)
    if (!statSync(p).isFile()) continue
    if (!/\\.(js|css|html|json)$/i.test(entry)) continue
    const text = readFileSync(p, 'utf-8')
    for (const [label, re] of patterns) {
      if (re.test(text)) {
        fail(`production leak: ${label}`, p)
      }
    }
  }
}

const PROD_LEAK_PATTERNS = [
  ['content-studio', /content[-.]?studio/i],
  ['tiptap', /@tiptap\//],
  ['prosemirror', /prosemirror/i],
  ['localhost:8770', /localhost:8770/],
  ['CONTENT_STUDIO_TOKEN', /CONTENT_STUDIO_TOKEN/i],
]
scanDir(resolve(root, 'dist'), PROD_LEAK_PATTERNS)

// ---- 3. Source hardcoded paths ----
const SRC_SCAN = [
  ['localhost:8770', /localhost:8770/],
]
scanDir(resolve(root, 'src'), SRC_SCAN)

if (!process.exitCode) {
  console.log('[OK] local boundary check passed')
}
