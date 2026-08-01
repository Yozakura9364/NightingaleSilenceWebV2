#!/usr/bin/env node
// Run a Python command with a clean PYTHONPATH (strip Hermes-gateway-injected venv paths),
// so the system Python 3.8 imports its own site-packages.
// Usage: node scripts/content/run-clean-python.mjs -- <args...>
import { spawnSync } from 'child_process'

const args = process.argv.slice(2)
const dashIdx = args.indexOf('--')
const pyArgs = dashIdx >= 0 ? args.slice(dashIdx + 1) : args

const env = { ...process.env }
delete env.PYTHONPATH

const r = spawnSync('python', pyArgs, { stdio: 'inherit', env })
process.exit(r.status ?? 1)
