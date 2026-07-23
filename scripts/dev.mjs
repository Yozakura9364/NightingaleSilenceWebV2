import { spawn } from 'node:child_process'

const pythonCommand = process.env.PYTHON ?? 'python'
const children = []
const childStdio = process.env.NS_DEV_STDIO === 'ignore' ? 'ignore' : 'inherit'
let stopping = false

function start(command, args, label, env = process.env) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env,
    stdio: childStdio,
    windowsHide: true
  })

  child.on('error', (error) => {
    console.error(`[dev:${label}] ${error.message}`)
    stop(1)
  })
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(`[dev:${label}] exited (${signal ?? code ?? 'unknown'})`)
      stop(code || 1)
    }
  })
  children.push(child)
}

function stop(exitCode = 0) {
  if (stopping) return
  stopping = true

  for (const child of children) {
    if (!child.killed) child.kill()
  }

  setTimeout(() => process.exit(exitCode), 250)
}

process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))

start(pythonCommand, ['server/glamour/app.py'], 'glamour-api', {
  ...process.env,
  NSGLAMOUR_PORT: process.env.NSGLAMOUR_PORT ?? '8766',
  PYTHONUTF8: process.env.PYTHONUTF8 ?? '1'
})
start(process.execPath, ['node_modules/vite/bin/vite.js'], 'web')
