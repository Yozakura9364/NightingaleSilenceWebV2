// Both projects use the same coordinator and frozen game-data batch.
import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argumentsToForward = process.argv.slice(2)
const rootFlag = argumentsToForward.indexOf('--pipeline-root')
let pipelineRoot = path.resolve(projectRoot, '../ff14android')
if (rootFlag !== -1) {
  const value = argumentsToForward[rootFlag + 1]
  if (!value || value.startsWith('--')) throw new Error('--pipeline-root requires a directory')
  pipelineRoot = path.resolve(value)
  argumentsToForward.splice(rootFlag, 2)
}
const script = path.join(pipelineRoot, 'scripts/update_game_data.py')
await access(script)
const explicitPython = process.env.GAME_DATA_PYTHON
const python = explicitPython || (process.platform === 'win32' ? 'py' : 'python3')
const prefix = !explicitPython && process.platform === 'win32' ? ['-3'] : []
const child = spawn(python, [...prefix, '-X', 'utf8', '-B', script,
  '--v2-root', projectRoot, ...argumentsToForward], {
  cwd: pipelineRoot, stdio: 'inherit', shell: false, windowsHide: true
})
child.on('error', (error) => {
  console.error(`Cannot start the shared game-data coordinator: ${error.message}`)
  process.exitCode = 1
})
child.on('exit', (code, signal) => { process.exitCode = signal ? 1 : (code ?? 1) })
