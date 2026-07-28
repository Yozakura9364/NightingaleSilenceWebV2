import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { hostname } from 'node:os'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'agent-session.mjs')

function createWorkspace() {
  const workspace = mkdtempSync(path.join(tmpdir(), 'agent-session-'))
  execFileSync('git', ['init', '--quiet'], { cwd: workspace })
  return workspace
}

function run(workspace, args, options = {}) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspace,
    encoding: 'utf8',
  })

  if (options.expectFailure) {
    assert.notEqual(result.status, 0, `expected failure, got stdout: ${result.stdout}`)
  } else {
    assert.equal(result.status, 0, result.stderr || result.stdout)
  }

  return result
}

function sessionId(output) {
  const match = output.match(/^SESSION_ID=(.+)$/m)
  assert.ok(match, `missing session id in output: ${output}`)
  return match[1].trim()
}

function sessionState(workspace, id) {
  const status = run(workspace, ['show', '--session', id]).stdout
  return JSON.parse(status)
}

test('starts an isolated session and records progress', () => {
  const workspace = createWorkspace()
  try {
    const id = sessionId(
      run(workspace, ['start', '--task', 'test task', '--scope', 'scripts/example.mjs']).stdout,
    )

    run(workspace, ['log', '--session', id, '--message', 'first checkpoint'])
    const state = sessionState(workspace, id)

    assert.equal(state.status, 'in_progress')
    assert.equal(state.task, 'test task')
    assert.deepEqual(state.scope, ['scripts/example.mjs'])
    assert.equal(state.events.at(-1).message, 'first checkpoint')
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})

test('claims files atomically and blocks another active session', () => {
  const workspace = createWorkspace()
  try {
    const first = sessionId(run(workspace, ['start', '--task', 'first']).stdout)
    const second = sessionId(run(workspace, ['start', '--task', 'second']).stdout)

    run(workspace, [
      'claim',
      '--session',
      first,
      '--file',
      'src/shared.ts',
      '--file',
      'src/owned.ts',
    ])
    const conflict = run(
      workspace,
      ['claim', '--session', second, '--file', 'src/free.ts', '--file', 'src/shared.ts'],
      { expectFailure: true },
    )

    assert.match(conflict.stderr, /src\/shared\.ts/)
    assert.deepEqual(sessionState(workspace, second).claimed_files, [])

    run(workspace, ['release', '--session', first])
    run(workspace, ['claim', '--session', second, '--file', 'src/shared.ts'])
    assert.deepEqual(sessionState(workspace, second).claimed_files, ['src/shared.ts'])
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})

test('finishing a completed session releases its file claims', () => {
  const workspace = createWorkspace()
  try {
    const first = sessionId(run(workspace, ['start', '--task', 'first']).stdout)
    const second = sessionId(run(workspace, ['start', '--task', 'second']).stdout)

    run(workspace, ['claim', '--session', first, '--file', 'src/shared.ts'])
    run(workspace, [
      'finish',
      '--session',
      first,
      '--status',
      'completed',
      '--summary',
      'done',
    ])
    run(workspace, ['claim', '--session', second, '--file', 'src/shared.ts'])

    assert.equal(sessionState(workspace, first).status, 'completed')
    assert.deepEqual(sessionState(workspace, second).claimed_files, ['src/shared.ts'])
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})

test('recovers an interrupted session and transfers its claims', () => {
  const workspace = createWorkspace()
  try {
    const interrupted = sessionId(run(workspace, ['start', '--task', 'interrupted']).stdout)
    run(workspace, ['claim', '--session', interrupted, '--file', 'src/shared.ts'])
    run(workspace, [
      'finish',
      '--session',
      interrupted,
      '--status',
      'interrupted',
      '--summary',
      'conversation ended',
    ])

    const recovered = sessionId(
      run(workspace, ['recover', '--from', interrupted, '--task', 'continue interrupted']).stdout,
    )

    assert.equal(sessionState(workspace, interrupted).status, 'recovered')
    assert.equal(sessionState(workspace, interrupted).recovered_by, recovered)
    assert.equal(sessionState(workspace, recovered).recovered_from, interrupted)
    assert.deepEqual(sessionState(workspace, recovered).claimed_files, ['src/shared.ts'])
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})

test('rejects claims outside the project root', () => {
  const workspace = createWorkspace()
  try {
    const id = sessionId(run(workspace, ['start', '--task', 'test']).stdout)
    const result = run(
      workspace,
      ['claim', '--session', id, '--file', '..\\outside.txt'],
      { expectFailure: true },
    )

    assert.match(result.stderr, /outside the project root/i)
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})

test('requires an explicit override before claiming an already dirty file', () => {
  const workspace = createWorkspace()
  try {
    writeFileSync(path.join(workspace, 'existing.txt'), 'existing changes\n', 'utf8')
    const id = sessionId(run(workspace, ['start', '--task', 'test']).stdout)

    const blocked = run(
      workspace,
      ['claim', '--session', id, '--file', 'existing.txt'],
      { expectFailure: true },
    )
    assert.match(blocked.stderr, /already has uncommitted changes/i)

    run(workspace, [
      'claim',
      '--session',
      id,
      '--file',
      'existing.txt',
      '--allow-dirty',
    ])
    assert.deepEqual(sessionState(workspace, id).claimed_files, ['existing.txt'])
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})

test('treats stale in-progress sessions as recoverable but requires confirmation for fresh ones', () => {
  const workspace = createWorkspace()
  try {
    const active = sessionId(run(workspace, ['start', '--task', 'active']).stdout)
    run(workspace, ['claim', '--session', active, '--file', 'src/shared.ts'])

    run(workspace, ['recover', '--from', active, '--task', 'unsafe takeover'], {
      expectFailure: true,
    })

    const recovered = sessionId(
      run(workspace, [
        'recover',
        '--from',
        active,
        '--task',
        'confirmed takeover',
        '--confirm-interrupted',
      ]).stdout,
    )
    assert.equal(sessionState(workspace, active).status, 'recovered')
    assert.deepEqual(sessionState(workspace, recovered).claimed_files, ['src/shared.ts'])
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})

test('blocks concurrent recovery while another live process owns the recovery guard', () => {
  const workspace = createWorkspace()
  try {
    const interrupted = sessionId(run(workspace, ['start', '--task', 'interrupted']).stdout)
    run(workspace, [
      'finish',
      '--session',
      interrupted,
      '--status',
      'interrupted',
      '--summary',
      'conversation ended',
    ])

    const digest = createHash('sha256').update(interrupted).digest('hex').slice(0, 24)
    const guardPath = path.join(
      workspace,
      '.codex',
      'agent-locks',
      `recovery-${digest}.guard`,
    )
    writeFileSync(
      guardPath,
      JSON.stringify({
        source_session: interrupted,
        owner_pid: process.pid,
        owner_host: hostname(),
        acquired_at: new Date().toISOString(),
        token: 'test-owner',
      }),
      'utf8',
    )

    const blocked = run(
      workspace,
      ['recover', '--from', interrupted, '--task', 'second recovery'],
      { expectFailure: true },
    )
    assert.match(blocked.stderr, /recovery is already in progress/i)
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
})
