import { createServer } from 'node:http'
import { randomInt } from 'node:crypto'
import { listJobs, getJob, paths, runJob } from './jobs.mjs'

const HOST = process.env.NS_OPS_HOST || '127.0.0.1'
const PORT = Number.parseInt(process.env.NS_OPS_PORT || '18766', 10)
const TOKEN = process.env.NS_OPS_TOKEN || 'dev-local-token'
const CONFIRM_TTL_MS = Number.parseInt(process.env.NS_OPS_CONFIRM_TTL_MS || '120000', 10)
const MAX_BODY_BYTES = 1024 * 1024

const pendingConfirmations = new Map()
let latestResult = null

function sendJson(response, statusCode, payload) {
  const body = `${JSON.stringify(payload, null, 2)}\n`
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  })
  response.end(body)
}

function isAuthorized(request) {
  const auth = request.headers.authorization || ''
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  const headerToken = request.headers['x-ns-ops-token'] || ''
  return bearer === TOKEN || headerToken === TOKEN
}

function requireAuth(request, response) {
  if (isAuthorized(request)) {
    return true
  }
  sendJson(response, 401, { ok: false, error: 'unauthorized' })
  return false
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk.toString('utf8')
      if (body.length > MAX_BODY_BYTES) {
        reject(new Error('request body too large'))
        request.destroy()
      }
    })
    request.on('end', () => {
      if (!body.trim()) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
    request.on('error', reject)
  })
}

function jobIdFromPath(pathname) {
  return pathname.replace(/^\/jobs\/?/, '').replace(/\//g, '.').replace(/^\.+|\.+$/g, '')
}

function cleanupConfirmations() {
  const now = Date.now()
  for (const [token, pending] of pendingConfirmations.entries()) {
    if (pending.expiresAt <= now) {
      pendingConfirmations.delete(token)
    }
  }
}

function createConfirmation(jobId) {
  cleanupConfirmations()
  const token = String(randomInt(100000, 999999))
  const now = Date.now()
  pendingConfirmations.set(token, {
    jobId,
    createdAt: now,
    expiresAt: now + CONFIRM_TTL_MS
  })
  return {
    token,
    expiresAt: new Date(now + CONFIRM_TTL_MS).toISOString(),
    ttlSeconds: Math.round(CONFIRM_TTL_MS / 1000)
  }
}

async function executeJob(jobId) {
  const result = await runJob(jobId)
  latestResult = result
  return result
}

async function handleRequest(request, response) {
  const url = new URL(request.url || '/', `http://${request.headers.host || `${HOST}:${PORT}`}`)
  const pathname = url.pathname

  if (request.method === 'GET' && pathname === '/health') {
    sendJson(response, 200, {
      ok: true,
      service: 'ns-ops-runner',
      version: '0.1.0',
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      paths,
      authRequiredForJobs: true
    })
    return
  }

  if (!requireAuth(request, response)) {
    return
  }

  try {
    if (request.method === 'GET' && pathname === '/jobs') {
      sendJson(response, 200, { ok: true, jobs: listJobs() })
      return
    }

    if (request.method === 'GET' && pathname === '/jobs/latest') {
      sendJson(response, 200, { ok: true, latest: latestResult })
      return
    }

    if (request.method === 'POST' && pathname.startsWith('/jobs/')) {
      await readBody(request)
      const jobId = jobIdFromPath(pathname)
      const job = getJob(jobId)
      if (!job) {
        sendJson(response, 404, { ok: false, error: `unknown job: ${jobId}` })
        return
      }

      if (job.requiresConfirmation) {
        const confirmation = createConfirmation(jobId)
        sendJson(response, 202, {
          ok: false,
          confirmationRequired: true,
          jobId,
          title: job.title,
          message: `Reply with /ns confirm ${confirmation.token} within ${confirmation.ttlSeconds}s.`,
          confirmation
        })
        return
      }

      sendJson(response, 200, { ok: true, result: await executeJob(jobId) })
      return
    }

    if (request.method === 'POST' && pathname === '/confirm') {
      const payload = await readBody(request)
      const token = String(payload.token || '').trim()
      cleanupConfirmations()
      const pending = pendingConfirmations.get(token)
      if (!pending) {
        sendJson(response, 404, { ok: false, error: 'confirmation not found or expired' })
        return
      }

      pendingConfirmations.delete(token)
      sendJson(response, 200, { ok: true, result: await executeJob(pending.jobId) })
      return
    }

    sendJson(response, 404, { ok: false, error: 'not found' })
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

const server = createServer((request, response) => {
  void handleRequest(request, response)
})

server.listen(PORT, HOST, () => {
  console.log(`[ns-ops-runner] listening on http://${HOST}:${PORT}`)
  if (!process.env.NS_OPS_TOKEN) {
    console.warn('[ns-ops-runner] NS_OPS_TOKEN is not set; using dev-local-token for local use.')
  }
})
