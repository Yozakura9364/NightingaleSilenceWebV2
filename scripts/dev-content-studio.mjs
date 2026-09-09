// dev-content-studio.mjs — Authoring-only Vite + content-studio Flask helper.
// Generates a startup token and injects it into the frontend via env variable.

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '..')
const helperPort = process.env.CONTENT_STUDIO_PORT || '8770'

// Load local untracked .env.local (COS credentials, media public base URL).
// It is gitignored; values here never reach the committed tree or logs.
function loadLocalEnv() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return {}
  const vars = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (key) vars[key] = value
  }
  return vars
}

const localEnv = loadLocalEnv()

const token = process.env.CONTENT_STUDIO_TOKEN || randomBytes(32).toString('hex')

const env = {
  ...process.env,
  ...localEnv,
  VITE_ENABLE_CONTENT_STUDIO: 'true',
  CONTENT_STUDIO_PORT: helperPort,
  CONTENT_STUDIO_TOKEN: token,
  VITE_CONTENT_STUDIO_TOKEN: token
}

// Start Flask helper
const flaskHelper = spawn('python', ['-m', 'server.content.app'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: true
})

// Start Vite (fixed port 5175 matches the helper's allowed origins in config.py)
const vite = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5175'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: true
})

function cleanup() {
  flaskHelper.kill('SIGTERM')
  vite.kill('SIGTERM')
  process.exit(0)
}
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
