import { createHash, randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs'
import { hostname } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const STATE_OPEN = '<!-- agent-session-state\n'
const STATE_CLOSE = '\n-->'
const DEFAULT_TTL_MINUTES = 60
const ACTIVE_STATUSES = new Set(['in_progress', 'interrupted'])

function fail(message) {
  throw new Error(message)
}

function now() {
  return new Date().toISOString()
}

function parseOptions(tokens) {
  const options = { _: [] }
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (!token.startsWith('--')) {
      options._.push(token)
      continue
    }

    const key = token.slice(2)
    const next = tokens[index + 1]
    const value = next && !next.startsWith('--') ? tokens[++index] : true
    const current = options[key]
    if (current === undefined) {
      options[key] = value
    } else if (Array.isArray(current)) {
      current.push(value)
    } else {
      options[key] = [current, value]
    }
  }
  return options
}

function optionValues(options, key) {
  const value = options[key]
  if (value === undefined || value === true) return []
  return Array.isArray(value) ? value.map(String) : [String(value)]
}

function requiredOption(options, key) {
  const values = optionValues(options, key)
  if (values.length === 0 || values[0].trim() === '') {
    fail(`Missing required option --${key}`)
  }
  return values[0]
}

function findProjectRoot(startDirectory) {
  let current = path.resolve(startDirectory)
  while (true) {
    if (existsSync(path.join(current, '.git'))) return current
    const parent = path.dirname(current)
    if (parent === current) return path.resolve(startDirectory)
    current = parent
  }
}

function projectPaths(root) {
  const codexDir = path.join(root, '.codex')
  return {
    root,
    sessionsDir: path.join(codexDir, 'agent-sessions'),
    locksDir: path.join(codexDir, 'agent-locks'),
  }
}

function ensureDirectories(paths) {
  mkdirSync(paths.sessionsDir, { recursive: true })
  mkdirSync(paths.locksDir, { recursive: true })
}

function gitValue(root, args) {
  try {
    return execFileSync('git', ['-c', `safe.directory=${root}`, ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

function gitSnapshot(root) {
  return {
    branch: gitValue(root, ['branch', '--show-current']) || null,
    base_commit: gitValue(root, ['rev-parse', 'HEAD']) || null,
    dirty_files: gitValue(root, ['status', '--short'])
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.slice(3).trim()),
  }
}

function hasUncommittedChanges(root, projectPath) {
  return (
    gitValue(root, ['status', '--porcelain=v1', '--untracked-files=all', '--', projectPath]) !== ''
  )
}

function slugify(value) {
  const slug = value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return slug.slice(0, 32) || 'task'
}

function createSessionId(task) {
  const timestamp = now().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  return `${timestamp}-${slugify(task)}-${randomBytes(3).toString('hex')}`
}

function renderSession(state) {
  const scope = state.scope.length > 0 ? state.scope.map((item) => `- \`${item}\``).join('\n') : '- (none)'
  const claims =
    state.claimed_files.length > 0
      ? state.claimed_files.map((item) => `- \`${item}\``).join('\n')
      : '- (none)'
  const timeline = state.events
    .map((event) => `- \`${event.at}\` **${event.type}** ${event.message}`)
    .join('\n')

  return `${STATE_OPEN}${JSON.stringify(state, null, 2)}${STATE_CLOSE}
# Agent Session Log

- Session: \`${state.session_id}\`
- Status: \`${state.status}\`
- Task: ${state.task}
- Started: \`${state.started_at}\`
- Updated: \`${state.updated_at}\`
- Branch: \`${state.branch ?? 'unknown'}\`
- Base commit: \`${state.base_commit ?? 'unavailable'}\`

## Scope

${scope}

## Claimed Files

${claims}

## Timeline

${timeline}
`
}

function parseSession(filePath) {
  const content = readFileSync(filePath, 'utf8')
  if (!content.startsWith(STATE_OPEN)) fail(`Invalid session log: ${filePath}`)
  const end = content.indexOf(STATE_CLOSE, STATE_OPEN.length)
  if (end < 0) fail(`Invalid session log state block: ${filePath}`)
  return JSON.parse(content.slice(STATE_OPEN.length, end))
}

function writeSession(filePath, state) {
  const temporary = `${filePath}.${process.pid}.${randomBytes(3).toString('hex')}.tmp`
  writeFileSync(temporary, renderSession(state), 'utf8')
  renameSync(temporary, filePath)
}

function sessionFiles(paths) {
  if (!existsSync(paths.sessionsDir)) return []
  return readdirSync(paths.sessionsDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(paths.sessionsDir, name))
}

function loadSessions(paths) {
  return sessionFiles(paths).map((filePath) => ({ filePath, state: parseSession(filePath) }))
}

function findSession(paths, sessionId) {
  const match = loadSessions(paths).find(({ state }) => state.session_id === sessionId)
  if (!match) fail(`Unknown session: ${sessionId}`)
  return match
}

function appendEvent(record, type, message, changes = {}) {
  const timestamp = now()
  Object.assign(record.state, changes, { updated_at: timestamp })
  record.state.events.push({ at: timestamp, type, message })
  writeSession(record.filePath, record.state)
}

function normalizeProjectPath(root, input) {
  const absolute = path.resolve(root, input)
  const relative = path.relative(root, absolute)
  if (relative === '' || relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
    fail(`Path is outside the project root: ${input}`)
  }
  return relative.split(path.sep).join('/')
}

function lockFilePath(paths, projectPath) {
  const digest = createHash('sha256').update(projectPath).digest('hex').slice(0, 24)
  return path.join(paths.locksDir, `${digest}.json`)
}

function recoveryGuardPath(paths, sessionId) {
  const digest = createHash('sha256').update(sessionId).digest('hex').slice(0, 24)
  return path.join(paths.locksDir, `recovery-${digest}.guard`)
}

function readLock(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (error) {
    fail(`Cannot read lock ${filePath}: ${error.message}`)
  }
}

function writeNewLock(filePath, lock) {
  const descriptor = openSync(filePath, 'wx')
  try {
    writeSync(descriptor, JSON.stringify(lock, null, 2), null, 'utf8')
  } finally {
    closeSync(descriptor)
  }
}

function writeLock(filePath, lock) {
  writeFileSync(filePath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8')
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code === 'EPERM'
  }
}

function acquireRecoveryGuard(paths, sessionId, ttl) {
  const filePath = recoveryGuardPath(paths, sessionId)
  const token = randomBytes(8).toString('hex')
  const guard = {
    source_session: sessionId,
    owner_pid: process.pid,
    owner_host: hostname(),
    acquired_at: now(),
    token,
  }

  const create = () => writeNewLock(filePath, guard)
  try {
    create()
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    const existing = readLock(filePath)
    const sameHost = existing.owner_host === hostname()
    const ownerActive = sameHost
      ? processIsAlive(existing.owner_pid)
      : !isStale(existing.acquired_at, ttl)
    if (ownerActive) {
      fail(`Recovery is already in progress for session ${sessionId}`)
    }

    unlinkSync(filePath)
    try {
      create()
    } catch {
      fail(`Recovery is already in progress for session ${sessionId}`)
    }
  }

  return { filePath, token }
}

function releaseRecoveryGuard(guard) {
  if (!existsSync(guard.filePath)) return
  const current = readLock(guard.filePath)
  if (current.token === guard.token) unlinkSync(guard.filePath)
}

function ttlMinutes(options) {
  const raw = optionValues(options, 'ttl-minutes')[0] ?? process.env.CODEX_AGENT_LOCK_TTL_MINUTES
  if (raw === undefined) return DEFAULT_TTL_MINUTES
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) fail(`Invalid TTL minutes: ${raw}`)
  return parsed
}

function isStale(timestamp, ttl) {
  const value = Date.parse(timestamp)
  return !Number.isFinite(value) || Date.now() - value > ttl * 60_000
}

function listLocks(paths) {
  if (!existsSync(paths.locksDir)) return []
  return readdirSync(paths.locksDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const filePath = path.join(paths.locksDir, name)
      return { filePath, lock: readLock(filePath) }
    })
}

function activeClaims(paths, sessionId) {
  return listLocks(paths).filter(({ lock }) => lock.session_id === sessionId)
}

function claimFiles(paths, record, rawFiles, { allowDirty = false } = {}) {
  if (record.state.status !== 'in_progress') {
    fail(`Session ${record.state.session_id} is not in progress`)
  }

  const projectFiles = [...new Set(rawFiles.map((file) => normalizeProjectPath(paths.root, file)))]
  if (projectFiles.length === 0) fail('At least one --file is required')

  const dirtyFiles = projectFiles.filter((projectPath) =>
    hasUncommittedChanges(paths.root, projectPath),
  )
  if (dirtyFiles.length > 0 && !allowDirty) {
    fail(
      `File already has uncommitted changes; inspect its diff before retrying with --allow-dirty:\n${dirtyFiles
        .map((projectPath) => `- ${projectPath}`)
        .join('\n')}`,
    )
  }

  const timestamp = now()
  const preflight = projectFiles.map((projectPath) => {
    const filePath = lockFilePath(paths, projectPath)
    const lock = existsSync(filePath) ? readLock(filePath) : null
    return { projectPath, filePath, lock }
  })
  const conflicts = preflight.filter(
    ({ lock }) => lock && lock.session_id !== record.state.session_id,
  )
  if (conflicts.length > 0) {
    fail(
      `File claim conflict:\n${conflicts
        .map(({ projectPath, lock }) => `- ${projectPath} (session ${lock.session_id})`)
        .join('\n')}`,
    )
  }

  const created = []
  try {
    for (const item of preflight) {
      const lock = {
        schema_version: 1,
        session_id: record.state.session_id,
        project_path: item.projectPath,
        acquired_at: item.lock?.acquired_at ?? timestamp,
        heartbeat_at: timestamp,
        session_log: path.relative(paths.root, record.filePath).split(path.sep).join('/'),
      }
      if (item.lock) {
        writeLock(item.filePath, lock)
      } else {
        writeNewLock(item.filePath, lock)
        created.push(item.filePath)
      }
    }
  } catch (error) {
    for (const filePath of created) {
      if (existsSync(filePath)) unlinkSync(filePath)
    }
    fail(`Could not claim all files atomically: ${error.message}`)
  }

  const claimedFiles = [...new Set([...record.state.claimed_files, ...projectFiles])].sort()
  const dirtyNote = dirtyFiles.length > 0 ? ' after explicit dirty-file review' : ''
  appendEvent(record, 'claim', `Claimed ${projectFiles.join(', ')}${dirtyNote}`, {
    claimed_files: claimedFiles,
  })
  return projectFiles
}

function releaseClaims(paths, sessionId) {
  const released = []
  for (const { filePath, lock } of activeClaims(paths, sessionId)) {
    if (!existsSync(filePath)) continue
    const current = readLock(filePath)
    if (current.session_id !== sessionId) continue
    unlinkSync(filePath)
    released.push(lock.project_path)
  }
  return released.sort()
}

function createSession(paths, task, scope, extra = {}) {
  ensureDirectories(paths)
  const timestamp = now()
  const git = gitSnapshot(paths.root)
  const sessionId = createSessionId(task)
  const state = {
    schema_version: 1,
    session_id: sessionId,
    status: 'in_progress',
    task,
    scope,
    started_at: timestamp,
    updated_at: timestamp,
    branch: git.branch,
    base_commit: git.base_commit,
    dirty_files_at_start: git.dirty_files,
    claimed_files: [],
    recovered_from: extra.recovered_from ?? null,
    recovered_by: null,
    events: [
      {
        at: timestamp,
        type: extra.recovered_from ? 'recover_start' : 'start',
        message: extra.message ?? 'Session started',
      },
    ],
  }
  const filePath = path.join(paths.sessionsDir, `${sessionId}.md`)
  writeSession(filePath, state)
  return { filePath, state }
}

function printSessionStart(record) {
  process.stdout.write(`SESSION_ID=${record.state.session_id}\n`)
  process.stdout.write(`SESSION_LOG=${record.filePath}\n`)
}

function commandStart(paths, options) {
  const task = requiredOption(options, 'task')
  const scope = optionValues(options, 'scope').map((item) => normalizeProjectPath(paths.root, item))
  const existing = loadSessions(paths).filter(({ state }) => ACTIVE_STATUSES.has(state.status))
  const record = createSession(paths, task, scope)
  printSessionStart(record)
  if (existing.length > 0) {
    process.stdout.write(`NOTICE=${existing.length} unfinished session(s) require status review\n`)
  }
}

function commandStatus(paths, options) {
  const ttl = ttlMinutes(options)
  const locks = listLocks(paths)
  const locksBySession = new Map()
  for (const { lock } of locks) {
    const claims = locksBySession.get(lock.session_id) ?? []
    claims.push(lock.project_path)
    locksBySession.set(lock.session_id, claims)
  }
  const sessions = loadSessions(paths)
    .filter(({ state }) => options.all === true || ACTIVE_STATUSES.has(state.status))
    .map(({ state }) => ({
      session_id: state.session_id,
      status: state.status,
      stale: ACTIVE_STATUSES.has(state.status) ? isStale(state.updated_at, ttl) : false,
      updated_at: state.updated_at,
      task: state.task,
      claimed_files: (locksBySession.get(state.session_id) ?? []).sort(),
      recovered_from: state.recovered_from,
      recovered_by: state.recovered_by,
    }))
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))

  if (options.json) {
    process.stdout.write(`${JSON.stringify(sessions, null, 2)}\n`)
    return
  }

  if (sessions.length === 0) {
    process.stdout.write('No agent sessions found.\n')
    return
  }
  for (const session of sessions) {
    const stale = session.stale ? ' stale' : ''
    process.stdout.write(
      `${session.session_id} ${session.status}${stale} ${session.updated_at} ${session.task}\n`,
    )
    for (const file of session.claimed_files) process.stdout.write(`  - ${file}\n`)
  }
}

function commandShow(paths, options) {
  const record = findSession(paths, requiredOption(options, 'session'))
  process.stdout.write(`${JSON.stringify(record.state, null, 2)}\n`)
}

function commandClaim(paths, options) {
  const record = findSession(paths, requiredOption(options, 'session'))
  const claimed = claimFiles(paths, record, optionValues(options, 'file'), {
    allowDirty: options['allow-dirty'] === true,
  })
  for (const file of claimed) process.stdout.write(`CLAIMED=${file}\n`)
}

function commandLog(paths, options) {
  const record = findSession(paths, requiredOption(options, 'session'))
  if (!ACTIVE_STATUSES.has(record.state.status)) fail(`Session ${record.state.session_id} is closed`)
  const type = optionValues(options, 'type')[0] ?? 'progress'
  appendEvent(record, type, requiredOption(options, 'message'))
}

function commandTouch(paths, options) {
  const record = findSession(paths, requiredOption(options, 'session'))
  if (!ACTIVE_STATUSES.has(record.state.status)) fail(`Session ${record.state.session_id} is closed`)
  const timestamp = now()
  for (const { filePath, lock } of activeClaims(paths, record.state.session_id)) {
    writeLock(filePath, { ...lock, heartbeat_at: timestamp })
  }
  appendEvent(record, 'heartbeat', 'Session heartbeat')
}

function commandRelease(paths, options) {
  const record = findSession(paths, requiredOption(options, 'session'))
  const released = releaseClaims(paths, record.state.session_id)
  appendEvent(record, 'release', released.length > 0 ? `Released ${released.join(', ')}` : 'No active claims')
  for (const file of released) process.stdout.write(`RELEASED=${file}\n`)
}

function commandFinish(paths, options) {
  const record = findSession(paths, requiredOption(options, 'session'))
  const status = optionValues(options, 'status')[0] ?? 'completed'
  if (!['completed', 'interrupted'].includes(status)) fail(`Invalid finish status: ${status}`)
  const summary = requiredOption(options, 'summary')
  appendEvent(record, 'finish', summary, { status })
  if (status === 'completed') releaseClaims(paths, record.state.session_id)
}

function commandRecover(paths, options) {
  const sourceId = requiredOption(options, 'from')
  const ttl = ttlMinutes(options)
  const guard = acquireRecoveryGuard(paths, sourceId, ttl)
  try {
    performRecovery(paths, options, sourceId, ttl)
  } finally {
    releaseRecoveryGuard(guard)
  }
}

function performRecovery(paths, options, sourceId, ttl) {
  const source = findSession(paths, sourceId)
  if (!ACTIVE_STATUSES.has(source.state.status)) {
    fail(`Session ${source.state.session_id} cannot be recovered from status ${source.state.status}`)
  }

  const confirmed = options['confirm-interrupted'] === true
  if (
    source.state.status === 'in_progress' &&
    !confirmed &&
    !isStale(source.state.updated_at, ttl)
  ) {
    fail(
      `Session ${source.state.session_id} is still fresh; use --confirm-interrupted only after the user confirms it ended`,
    )
  }

  const task = requiredOption(options, 'task')
  const transferFiles = [...new Set(source.state.claimed_files)]
  const preflight = transferFiles.map((projectPath) => {
    const filePath = lockFilePath(paths, projectPath)
    const lock = existsSync(filePath) ? readLock(filePath) : null
    return { projectPath, filePath, lock }
  })
  const conflicts = preflight.filter(
    ({ lock }) => lock && lock.session_id !== source.state.session_id,
  )
  if (conflicts.length > 0) {
    fail(
      `Recovery claim conflict:\n${conflicts
        .map(({ projectPath, lock }) => `- ${projectPath} (session ${lock.session_id})`)
        .join('\n')}`,
    )
  }

  const recovered = createSession(paths, task, source.state.scope, {
    recovered_from: source.state.session_id,
    message: `Recovered from ${source.state.session_id}`,
  })
  const changedLocks = []
  try {
    const timestamp = now()
    for (const item of preflight) {
      const transferred = {
        schema_version: 1,
        session_id: recovered.state.session_id,
        project_path: item.projectPath,
        acquired_at: item.lock?.acquired_at ?? timestamp,
        heartbeat_at: timestamp,
        session_log: path.relative(paths.root, recovered.filePath).split(path.sep).join('/'),
      }
      if (item.lock) {
        changedLocks.push({ filePath: item.filePath, previous: item.lock })
        writeLock(item.filePath, transferred)
      } else {
        writeNewLock(item.filePath, transferred)
        changedLocks.push({ filePath: item.filePath, previous: null })
      }
    }
    appendEvent(recovered, 'claim_transfer', `Transferred ${transferFiles.join(', ')}`, {
      claimed_files: transferFiles.sort(),
    })
  } catch (error) {
    for (const item of changedLocks.reverse()) {
      if (item.previous) writeLock(item.filePath, item.previous)
      else if (existsSync(item.filePath)) unlinkSync(item.filePath)
    }
    appendEvent(recovered, 'recovery_failed', error.message, { status: 'interrupted' })
    throw error
  }

  appendEvent(source, 'recovered', `Recovered by ${recovered.state.session_id}`, {
    status: 'recovered',
    recovered_by: recovered.state.session_id,
  })
  printSessionStart(recovered)
}

function printHelp() {
  process.stdout.write(`Usage: node agent-session.mjs <command> [options]

Commands:
  start   --task <text> [--scope <path> ...]
  status  [--json] [--all] [--ttl-minutes <number>]
  show    --session <id>
  claim   --session <id> --file <path> [--file <path> ...] [--allow-dirty]
  log     --session <id> --message <text> [--type <name>]
  touch   --session <id>
  recover --from <id> --task <text> [--confirm-interrupted] [--ttl-minutes <number>]
  finish  --session <id> --status <completed|interrupted> --summary <text>
  release --session <id>
`)
}

function main() {
  const [command = 'help', ...tokens] = process.argv.slice(2)
  const options = parseOptions(tokens)
  const root = findProjectRoot(process.cwd())
  const paths = projectPaths(root)
  if (command !== 'help') ensureDirectories(paths)

  const commands = {
    start: commandStart,
    status: commandStatus,
    show: commandShow,
    claim: commandClaim,
    log: commandLog,
    touch: commandTouch,
    recover: commandRecover,
    finish: commandFinish,
    release: commandRelease,
    help: () => printHelp(),
  }
  const handler = commands[command]
  if (!handler) fail(`Unknown command: ${command}`)
  handler(paths, options)
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectRun) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
