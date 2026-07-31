// dev-content-studio.mjs — Authoring-only Vite + content-studio Flask helper.
// Generates a startup token and injects it into the frontend via env variable.

import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '..')
const helperPort = process.env.CONTENT_STUDIO_PORT || '8770'

const token = process.env.CONTENT_STUDIO_TOKEN || randomBytes(32).toString('hex')

const env = {
  ...process.env,
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

// Start Vite
const vite = spawn('npx', ['vite', '--host', '127.0.0.1'], {
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
