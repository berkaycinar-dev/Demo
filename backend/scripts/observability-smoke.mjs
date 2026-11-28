import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8080')
const logFile = process.argv[3]
assert.ok(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname),
  'Use a disposable local backend in the prod profile')
assert.ok(logFile, 'Pass the redirected production application stdout log as the second argument')
const origin = 'https://observability.example.test'
const suffix = randomUUID().slice(0, 8)
const secrets = [`query-secret-${suffix}`, `cookie-secret-${suffix}`, `body-secret-${suffix}`, `bearer-secret-${suffix}`]
const requests = []
const incomingId = 'caller-supplied-id'

async function request(path, status, { body, token, method = 'GET', route = 'unmapped' } = {}) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Request-ID': incomingId,
      Cookie: `probe=${secrets[1]}`, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10_000),
  })
  assert.equal(response.status, status, `${method} ${path}: unexpected response status`)
  const id = response.headers.get('X-Request-ID')
  assert.match(id ?? '', /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
  assert.notEqual(id, incomingId)
  assert.ok(response.headers.get('Access-Control-Expose-Headers')?.toLowerCase().includes('x-request-id'))
  requests.push({ id, status, method, route })
  return response.json()
}

await request(`/api/v1/ping?probe=${secrets[0]}`, 200, { route: '/api/v1/ping' })
const auth = await request('/api/v1/auth/register', 201, {
  method: 'POST', route: '/api/v1/auth/register',
  body: { username: `obs_${suffix}`, email: `obs_${suffix}@example.test`, password: secrets[2] },
})
secrets.push(auth.accessToken, auth.refreshToken)
await request(`/api/v1/rooms/${randomUUID()}?probe=${secrets[0]}`, 404, {
  token: auth.accessToken, route: '/api/v1/rooms/{roomId}',
})
await request('/api/v1/users/me', 401, { token: secrets[3] })
await request('/api/v1/auth/login', 401, {
  method: 'POST', route: '/api/v1/auth/login', body: { email: `unknown_${suffix}@example.test`, password: secrets[2] },
})
assert.equal(new Set(requests.map((request) => request.id)).size, requests.length)
const health = await fetch(new URL('/actuator/health', base), { signal: AbortSignal.timeout(10_000) })
assert.equal(health.status, 200)
assert.equal(health.headers.get('X-Request-ID'), null)

let entries
let text
const deadline = Date.now() + 5000
while (true) {
  text = await readFile(logFile, 'utf8')
  entries = text.split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    try { return JSON.parse(line) } catch { assert.fail('Production application emitted a non-JSON stdout line') }
  })
  if (requests.every((request) => entries.some((entry) => entry.requestId === request.id && entry.event === 'http.request.completed'))) break
  assert.ok(Date.now() < deadline, 'Completion logs did not appear')
  await new Promise((resolve) => setTimeout(resolve, 50))
}
for (const secret of secrets) assert.equal(text.includes(secret), false, 'Request secret appeared in application stdout')
for (const request of requests) {
  const matches = entries.filter((entry) => entry.requestId === request.id && entry.event === 'http.request.completed')
  assert.equal(matches.length, 1)
  const entry = matches[0]
  assert.equal(entry.http_status, request.status)
  assert.equal(entry.http_method, request.method)
  assert.equal(entry.http_route, request.route)
  assert.ok(Number.isFinite(entry.duration_ms) && entry.duration_ms >= 0)
  assert.equal(entry.completion, 'completed')
  assert.equal(entry.level, request.status >= 400 ? 'WARN' : 'INFO')
}
console.log('Observability smoke passed: prod JSON, request IDs, CORS, 200/201/401/404, metadata and secret exclusion.')
