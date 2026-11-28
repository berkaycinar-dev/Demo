import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { closeSync, openSync } from 'node:fs'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

// Own the entire fixture; no existing database name or external target URL is accepted.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const target = join(root, 'backend/target')
const name = `samedesk-health-${randomUUID().slice(0, 8)}`
const logs = join(target, name)
const reportPath = join(target, 'health-probes-report.json')
const report = { passed: false, revision: process.env.GITHUB_SHA ?? null, stages: [] }
const run = promisify(execFile)
const delay = (ms) => new Promise((done) => setTimeout(done, ms))
let app
let appExited
let appError = false
let containerCreated = false

async function docker(args) {
  try { return (await run('docker', args, { timeout: 30_000, windowsHide: true })).stdout.trim() }
  catch { throw new Error(`Docker ${args[0]} failed; ensure Docker is running`) }
}
async function freePort() {
  const server = createServer()
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done) })
  const port = server.address().port
  await new Promise((done) => server.close(done))
  return port
}
async function waitFor(action, label) {
  const deadline = Date.now() + 90_000
  while (true) {
    if (appError || (app && app.exitCode !== null)) throw new Error('Backend exited before verification completed')
    try { if (await action()) return } catch { /* retry while the fixture starts or recovers */ }
    assert.ok(Date.now() < deadline, `Timed out: ${label}`)
    await delay(500)
  }
}
async function health(base, group, expectedStatus, expectedState, timeoutMs = 45_000) {
  const started = performance.now()
  const response = await fetch(new URL(`/actuator/health/${group}`, base), { signal: AbortSignal.timeout(timeoutMs) })
  assert.equal(response.status, expectedStatus, `${group} HTTP status`)
  const body = await response.json()
  assert.deepEqual(body, { status: expectedState }, `${group} must expose only its status`)
  return { group, status: body.status, httpStatus: response.status, durationMs: Math.round(performance.now() - started) }
}
async function api(base, path, method, body, token) {
  const response = await fetch(new URL(`/api/v1${path}`, base), {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10_000),
  })
  assert.ok(response.ok, `Fixture API ${method} ${path}: ${response.status}`)
  return response.json()
}

try {
  await mkdir(logs, { recursive: true })
  const jars = (await readdir(target)).filter((file) => /^backend-.*\.jar$/.test(file))
  assert.equal(jars.length, 1, 'Package the backend first with mvnw verify')
  const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java'
  await run(java, ['--version'], { timeout: 10_000, windowsHide: true })
  const password = randomBytes(24).toString('hex')
  // Docker may choose a different host port on restart if the host port is omitted.
  const dbPort = await freePort()
  await docker(['run', '-d', '--name', name, '-p', `127.0.0.1:${dbPort}:5432`,
    '-e', 'POSTGRES_DB=samedesk', '-e', 'POSTGRES_USER=samedesk', '-e', `POSTGRES_PASSWORD=${password}`, 'postgres:16.15-bookworm'])
  containerCreated = true
  await waitFor(async () => { await docker(['exec', name, 'pg_isready', '-U', 'samedesk', '-d', 'samedesk']); return true }, 'temporary PostgreSQL')
  const port = await freePort()
  const base = new URL(`http://127.0.0.1:${port}`)
  const output = openSync(join(logs, 'app.log'), 'w')
  app = spawn(java, ['-jar', join(target, jars[0]), '--spring.profiles.active=prod'], {
    cwd: root, windowsHide: true, stdio: ['ignore', output, output],
    env: { ...process.env, DB_URL: `jdbc:postgresql://127.0.0.1:${dbPort}/samedesk`, DB_USER: 'samedesk',
      DB_PASSWORD: password, PORT: String(port), JWT_SECRET: randomBytes(32).toString('hex'), CORS_ORIGINS: 'https://health.example.test' },
  })
  closeSync(output)
  appExited = new Promise((done) => { app.once('exit', done); app.once('error', () => { appError = true; done() }) })
  await waitFor(async () => {
    await health(base, 'readiness', 200, 'UP', 3000)
    return true
  }, 'production backend readiness')
  report.stages.push({ name: 'ready', checks: [await health(base, 'readiness', 200, 'UP'), await health(base, 'liveness', 200, 'UP', 5000)] })

  const suffix = randomUUID().slice(0, 8)
  const auth = await api(base, '/auth/register', 'POST', {
    username: `health_${suffix}`, email: `health_${suffix}@example.test`, password: randomBytes(16).toString('hex'),
  })
  const room = await api(base, '/rooms', 'POST', { name: `Health ${suffix}`, visibility: 'PRIVATE' }, auth.accessToken)
  console.log('Healthy: liveness=UP and readiness=UP. Stopping only the temporary database...')
  await docker(['stop', '--time', '3', name])
  const [alive, unready] = await Promise.all([
    health(base, 'liveness', 200, 'UP', 5000), health(base, 'readiness', 503, 'DOWN'),
  ])
  report.stages.push({ name: 'database_down', checks: [alive, unready] })
  assert.equal(app.exitCode, null, 'Application process stopped with its database')
  console.log('Database down: liveness=UP, readiness=DOWN/503. Restarting the same temporary database...')
  await docker(['start', name])
  await waitFor(async () => { await docker(['exec', name, 'pg_isready', '-U', 'samedesk', '-d', 'samedesk']); return true }, 'database restart')
  await waitFor(async () => { await health(base, 'readiness', 200, 'UP'); return true }, 'readiness recovery')
  const recovered = await api(base, `/rooms/${room.id}`, 'GET', undefined, auth.accessToken)
  assert.equal(recovered.id, room.id, 'Database fixture did not survive restart')
  report.stages.push({ name: 'recovered', checks: [await health(base, 'readiness', 200, 'UP'), await health(base, 'liveness', 200, 'UP', 5000)] })
  report.passed = true
  console.log('Health probes passed: database loss/recovery, independent liveness, hidden details and retained fixture.')
} catch (error) {
  report.failure = error.message
  process.exitCode = 1
  console.error(`Health probes failed: ${error.message}`)
} finally {
  if (app?.pid && app.exitCode === null) {
    app.kill('SIGTERM')
    await Promise.race([appExited, new Promise((done) => { const timer = setTimeout(done, 5000); timer.unref() })])
    if (app.exitCode === null) { app.kill('SIGKILL'); await appExited }
  }
  if (containerCreated) {
    try { await docker(['rm', '-f', '-v', name]) }
    catch { report.passed = false; report.failure = 'Temporary database cleanup failed'; process.exitCode = 1 }
  }
  await mkdir(target, { recursive: true })
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')
  console.log(`Health report: ${reportPath}; application log: ${join(logs, 'app.log')}`)
}
