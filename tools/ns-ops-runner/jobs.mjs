import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const V2_ROOT = resolve(process.env.NS_OPS_V2_ROOT || resolve(__dirname, '..', '..'))
const ASTRBOT_ROOT = resolve(
  process.env.NS_OPS_ASTRBOT_ROOT || resolve(V2_ROOT, '..', 'astrbot')
)
const LOG_DIR = resolve(process.env.NS_OPS_LOG_DIR || resolve(__dirname, 'logs'))

const isWindows = process.platform === 'win32'
const commandShell = isWindows ? process.env.ComSpec || 'cmd.exe' : ''

const DEFAULT_TIMEOUT_MS = 120000
const LONG_TIMEOUT_MS = 600000
const MAX_CAPTURE_CHARS = 120000

function redact(text) {
  return String(text ?? '')
    .replace(/(Authorization:\s*Bearer\s+)[^\s]+/gi, '$1[redacted]')
    .replace(/(access[_-]?token["']?\s*[:=]\s*["']?)[^"',\s]+/gi, '$1[redacted]')
    .replace(/(api[_-]?key["']?\s*[:=]\s*["']?)[^"',\s]+/gi, '$1[redacted]')
    .replace(/(secret["']?\s*[:=]\s*["']?)[^"',\s]+/gi, '$1[redacted]')
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, 'sk-[redacted]')
}

function trimCapture(value) {
  const text = redact(value)
  if (text.length <= MAX_CAPTURE_CHARS) {
    return text
  }
  return `${text.slice(0, MAX_CAPTURE_CHARS)}\n...[output truncated by ns-ops-runner]`
}

function normalizeNewlines(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function compactSummary(output) {
  const lines = normalizeNewlines(output)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length <= 12) {
    return lines.join('\n')
  }
  return lines.slice(-12).join('\n')
}

function createStep(command, args, options = {}) {
  return {
    command,
    args,
    cwd: options.cwd,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    label: options.label ?? [command, ...args].join(' ')
  }
}

function createNpmStep(args, options = {}) {
  if (isWindows) {
    return createStep(commandShell, ['/d', '/s', '/c', 'npm.cmd', ...args], {
      ...options,
      label: options.label ?? ['npm', ...args].join(' ')
    })
  }
  return createStep('npm', args, options)
}

export const jobs = new Map(
  Object.entries({
    'system.status': {
      title: 'NS Ops runner 状态',
      description: '查看 runner、V2 和 AstrBot 路径。',
      readOnly: true,
      run: async () => {
        return {
          ok: true,
          output: [
            `runner: ok`,
            `node: ${process.version}`,
            `platform: ${process.platform}`,
            `v2Root: ${V2_ROOT}`,
            `astrbotRoot: ${ASTRBOT_ROOT}`,
            `pid: ${process.pid}`
          ].join('\n')
        }
      }
    },
    'astrbot.logs': {
      title: 'AstrBot 最近日志',
      description: '读取 astrbot 容器最近日志。',
      readOnly: true,
      steps: [createStep('docker', ['logs', '--tail', '120', 'astrbot'], { timeoutMs: 30000 })]
    },
    'v2.status': {
      title: 'V2 工作区状态',
      description: '查看当前分支、最近提交和 git status。',
      readOnly: true,
      steps: [
        createStep('git', ['branch', '--show-current'], { cwd: V2_ROOT, label: 'git branch' }),
        createStep('git', ['log', '-1', '--pretty=format:%h %s'], {
          cwd: V2_ROOT,
          label: 'git log -1'
        }),
        createStep('git', ['status', '--short'], { cwd: V2_ROOT, label: 'git status --short' })
      ]
    },
    'v2.check': {
      title: 'V2 项目检查',
      description: '运行 npm run check。',
      readOnly: true,
      steps: [createNpmStep(['run', 'check'], { cwd: V2_ROOT, timeoutMs: LONG_TIMEOUT_MS })]
    },
    'armoire.check-store': {
      title: 'NSArmoire 商城目录校验',
      description: '运行商城目录结构和映射校验。',
      readOnly: true,
      steps: [
        createNpmStep(['run', 'check:armoire-store-catalog:quiet'], {
          cwd: V2_ROOT,
          timeoutMs: LONG_TIMEOUT_MS
        })
      ]
    },
    'armoire.audit-store': {
      title: 'NSArmoire 商城覆盖审计',
      description: '审计国际服商城覆盖情况。',
      readOnly: true,
      steps: [
        createNpmStep(['run', 'audit:armoire-store-coverage'], {
          cwd: V2_ROOT,
          timeoutMs: LONG_TIMEOUT_MS
        })
      ]
    },
    'restart.astrbot': {
      title: '重启 AstrBot 容器',
      description: '通过 docker compose restart astrbot 重启 AstrBot。',
      readOnly: false,
      requiresConfirmation: true,
      steps: [
        createStep('docker', ['compose', 'restart', 'astrbot'], {
          cwd: ASTRBOT_ROOT,
          timeoutMs: 120000
        })
      ]
    }
  })
)

function runProcess(step) {
  return new Promise((resolveStep) => {
    const startedAt = new Date()
    const child = spawn(step.command, step.args, {
      cwd: step.cwd,
      windowsHide: true,
      shell: false,
      env: {
        ...process.env,
        CI: process.env.CI || '1'
      }
    })

    let stdout = ''
    let stderr = ''
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL')
        }
      }, 2500).unref()
    }, step.timeoutMs)

    child.stdout?.on('data', (chunk) => {
      stdout = trimCapture(stdout + chunk.toString('utf8'))
    })
    child.stderr?.on('data', (chunk) => {
      stderr = trimCapture(stderr + chunk.toString('utf8'))
    })

    child.on('error', (error) => {
      clearTimeout(timer)
      resolveStep({
        label: step.label,
        command: step.command,
        args: step.args,
        cwd: step.cwd,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        ok: false,
        exitCode: null,
        timedOut,
        stdout,
        stderr: trimCapture(`${stderr}\n${error.message}`)
      })
    })

    child.on('close', (exitCode) => {
      clearTimeout(timer)
      resolveStep({
        label: step.label,
        command: step.command,
        args: step.args,
        cwd: step.cwd,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        ok: exitCode === 0 && !timedOut,
        exitCode,
        timedOut,
        stdout,
        stderr
      })
    })
  })
}

export function listJobs() {
  return Array.from(jobs.entries()).map(([id, job]) => ({
    id,
    title: job.title,
    description: job.description,
    readOnly: job.readOnly,
    requiresConfirmation: Boolean(job.requiresConfirmation)
  }))
}

export function getJob(jobId) {
  return jobs.get(jobId)
}

export async function runJob(jobId) {
  const job = jobs.get(jobId)
  if (!job) {
    const error = new Error(`Unknown job: ${jobId}`)
    error.statusCode = 404
    throw error
  }

  const startedAt = new Date()
  let steps = []
  let ok = true

  if (typeof job.run === 'function') {
    const result = await job.run()
    steps = [
      {
        label: job.title,
        ok: Boolean(result.ok),
        stdout: result.output ?? '',
        stderr: result.error ?? '',
        exitCode: result.ok ? 0 : 1
      }
    ]
    ok = Boolean(result.ok)
  } else {
    for (const step of job.steps ?? []) {
      const result = await runProcess(step)
      steps.push(result)
      if (!result.ok) {
        ok = false
        break
      }
    }
  }

  const finishedAt = new Date()
  const output = steps
    .map((step) => {
      const header = `# ${step.label}`
      const body = [step.stdout, step.stderr ? `[stderr]\n${step.stderr}` : '']
        .filter(Boolean)
        .join('\n')
      return `${header}\n${body}`.trim()
    })
    .join('\n\n')

  const result = {
    jobId,
    title: job.title,
    ok,
    status: ok ? 'success' : 'failed',
    readOnly: job.readOnly,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    summary: compactSummary(output),
    output: trimCapture(output),
    steps
  }

  await writeJobLog(result)
  return result
}

async function writeJobLog(result) {
  await mkdir(LOG_DIR, { recursive: true })
  const safeId = result.jobId.replace(/[^a-z0-9_.-]/gi, '_')
  const timestamp = result.startedAt.replace(/[:.]/g, '-')
  const path = resolve(LOG_DIR, `${timestamp}_${safeId}.json`)
  await writeFile(path, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}

export const paths = {
  V2_ROOT,
  ASTRBOT_ROOT,
  LOG_DIR
}
