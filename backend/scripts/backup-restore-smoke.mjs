import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { closeSync, openSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

// No external database/archive arguments: both databases and all data belong to this test.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const target = join(root, 'backend/target')
const suffix = randomUUID().slice(0, 8)
const name = `samedesk-backup-${suffix}`
const folder = join(target, name)
const archive = join(folder, 'database.dump')
const reportPath = join(target, 'backup-restore-report.json')
const report = { passed: false, revision: process.env.GITHUB_SHA ?? null, checks: [] }
const run = promisify(execFile)
const delay = (ms) => new Promise((done) => setTimeout(done, ms))
let running = null
let containerCreated = false
let base
let java
let jar
let dbPort
const password = randomBytes(24).toString('hex')
const jwtSecret = randomBytes(32).toString('hex')

async function docker(args) {
  try { return (await run('docker', args, { timeout: 60_000, windowsHide: true })).stdout.trim() }
  catch { throw new Error(`Docker ${args[0]} failed; inspect the disposable fixture` ) }
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
    if (running && (running.error || running.child.exitCode !== null)) throw new Error('Fixture backend exited during startup')
    try { if (await action()) return } catch { /* wait for the isolated database/application */ }
    assert.ok(Date.now() < deadline, `Timed out: ${label}`)
    await delay(500)
  }
}
async function stopApp() {
  const current = running
  running = null
  if (current?.child.pid && current.child.exitCode === null) {
    current.child.kill('SIGTERM')
    await Promise.race([current.exited, new Promise((done) => { const timer = setTimeout(done, 5000); timer.unref() })])
    if (current.child.exitCode === null) { current.child.kill('SIGKILL'); await current.exited }
  }
}
async function startApp(database, label) {
  const port = await freePort()
  base = new URL(`http://127.0.0.1:${port}`)
  const output = openSync(join(folder, `${label}.log`), 'w')
  const current = { error: false }
  current.child = spawn(java, ['-jar', jar, '--spring.profiles.active=prod'], {
    cwd: root, windowsHide: true, stdio: ['ignore', output, output],
    env: { ...process.env, DB_URL: `jdbc:postgresql://127.0.0.1:${dbPort}/${database}`, DB_USER: 'samedesk',
      DB_PASSWORD: password, PORT: String(port), JWT_SECRET: jwtSecret,
      CORS_ORIGINS: 'https://backup.example.test', ROOM_SESSION_TIMEOUT_SECONDS: '600' },
  })
  closeSync(output)
  current.exited = new Promise((done) => { current.child.once('exit', done); current.child.once('error', () => { current.error = true; done() }) })
  running = current
  await waitFor(async () => {
    const response = await fetch(new URL('/actuator/health', base), { signal: AbortSignal.timeout(3000) })
    return response.ok && (await response.json()).status === 'UP'
  }, `${label} backend`)
}
async function api(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(new URL(`/api/v1${path}`, base), {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10_000),
  })
  assert.ok(response.ok, `Fixture API ${method} ${path}: ${response.status}`)
  return response.status === 204 ? null : response.json()
}
async function rows(database) {
  const tables = ['users', 'rooms', 'room_sessions', 'timer_states', 'flyway_schema_history']
  const sql = 'SELECT ' + tables.map((table) => `(SELECT count(*) FROM ${table})`).join(',')
  const values = (await docker(['exec', name, 'psql', '-U', 'samedesk', '-d', database, '-At', '-F', ',', '-c', sql])).split(',').map(Number)
  return Object.fromEntries(tables.map((table, index) => [table, values[index]]))
}

try {
  await mkdir(folder, { recursive: true })
  const jars = (await readdir(target)).filter((file) => /^backend-.*\.jar$/.test(file))
  assert.equal(jars.length, 1, 'Build the backend first with mvnw verify')
  jar = join(target, jars[0])
  java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java'
  await run(java, ['--version'], { timeout: 10_000, windowsHide: true })
  dbPort = await freePort()
  await docker(['run', '-d', '--name', name, '-p', `127.0.0.1:${dbPort}:5432`, '-e', 'POSTGRES_DB=source',
    '-e', 'POSTGRES_USER=samedesk', '-e', `POSTGRES_PASSWORD=${password}`, 'postgres:16.15-bookworm'])
  containerCreated = true
  await waitFor(async () => { await docker(['exec', name, 'pg_isready', '-U', 'samedesk', '-d', 'source']); return true }, 'PostgreSQL')
  await startApp('source', 'source')
  const auth = await api('/auth/register', { method: 'POST', body: {
    username: `backup_${suffix}`, email: `backup_${suffix}@example.test`, password: randomBytes(16).toString('hex'),
  } })
  const token = auth.accessToken
  const room = await api('/rooms', { method: 'POST', token, body: { name: `Backup ${suffix}`, visibility: 'PRIVATE' } })
  await api(`/rooms/${room.id}/sessions`, { method: 'POST', token })
  await api(`/rooms/${room.id}/sessions/current/status`, { method: 'PUT', token,
    body: { status: 'BREAK', spot: 'backup-tea', spotCapacity: 2, slot: 0 } })
  const started = await api('/timer/commands', { method: 'POST', token,
    body: { commandId: randomUUID(), expectedVersion: 0, type: 'START' } })
  const paused = await api('/timer/commands', { method: 'POST', token,
    body: { commandId: randomUUID(), expectedVersion: started.version, type: 'PAUSE' } })
  await stopApp()
  report.sourceRows = await rows('source')
  assert.ok(Object.values(report.sourceRows).every((value) => value > 0))

  console.log('Fixture created through real APIs. Taking a PostgreSQL custom-format backup...')
  report.pgDumpVersion = await docker(['exec', name, 'pg_dump', '--version'])
  const dumpedAt = performance.now()
  await docker(['exec', name, 'pg_dump', '-U', 'samedesk', '-d', 'source', '--format=custom', '--no-acl', '--file=/tmp/source.dump'])
  await docker(['cp', `${name}:/tmp/source.dump`, archive])
  report.dumpMs = Math.round(performance.now() - dumpedAt)
  const data = await readFile(archive)
  assert.equal(data.subarray(0, 5).toString(), 'PGDMP', 'Invalid custom archive header')
  report.archive = { bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') }
  // Restore the file copied onto the host, rather than reading the original database again.
  await docker(['cp', archive, `${name}:/tmp/restore.dump`])
  const contents = await docker(['exec', name, 'pg_restore', '--list', '/tmp/restore.dump'])
  assert.ok(contents.includes('TABLE DATA public users') && contents.includes('TABLE DATA public flyway_schema_history'))
  report.checks.push('custom_archive_readable')
  // Only this test's source database is mutated, to distinguish a restored snapshot from the source.
  await docker(['exec', name, 'psql', '-U', 'samedesk', '-d', 'source', '-v', 'ON_ERROR_STOP=1',
    '-c', "UPDATE rooms SET name = 'Changed after backup'"])
  await docker(['exec', name, 'createdb', '-U', 'samedesk', 'restored'])
  const restoredAt = performance.now()
  await docker(['exec', name, 'pg_restore', '-U', 'samedesk', '-d', 'restored', '--exit-on-error', '--single-transaction',
    '--no-owner', '--no-acl', '/tmp/restore.dump'])
  report.restoreMs = Math.round(performance.now() - restoredAt)
  report.restoredRows = await rows('restored')
  assert.deepEqual(report.restoredRows, report.sourceRows)
  report.checks.push('row_counts_and_migrations_match')

  console.log('Archive restored into a new database. Starting the application against the restored data...')
  await startApp('restored', 'restored')
  const restoredRoom = await api(`/rooms/${room.id}`, { token })
  assert.equal(restoredRoom.name, room.name)
  const restoredTimer = await api('/timer', { token })
  for (const key of ['preset', 'phase', 'status', 'remainingSeconds', 'version']) assert.equal(restoredTimer[key], paused[key], `Restored timer ${key}`)
  const members = await api(`/rooms/${room.id}/sessions/active`, { token })
  const person = members.find((member) => member.userId === auth.user.id)
  assert.ok(person?.online)
  assert.equal(person.status, 'BREAK')
  assert.equal(person.spot, 'backup-tea')
  assert.equal(person.slot, 0)
  const refreshed = await api('/auth/refresh', { method: 'POST', body: { refreshToken: auth.refreshToken } })
  assert.equal(refreshed.user.id, auth.user.id)
  assert.equal((await api(`/rooms/${room.id}`, { token: refreshed.accessToken })).id, room.id)
  report.checks.push('room_snapshot_preserved', 'timer_preserved', 'session_preserved', 'authentication_refresh_preserved')
  report.passed = true
  console.log('Backup/restore passed: archive, migrations, room, paused timer, room session and refresh token records.')
} catch (error) {
  report.failure = error.message
  process.exitCode = 1
  console.error(`Backup/restore failed: ${error.message}`)
} finally {
  await stopApp()
  if (containerCreated) {
    try { await docker(['rm', '-f', '-v', name]) }
    catch { report.passed = false; report.failure = 'Temporary PostgreSQL cleanup failed'; process.exitCode = 1 }
  }
  await mkdir(target, { recursive: true })
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')
  console.log(`Backup/restore report: ${reportPath}; synthetic test archive and logs: ${folder}`)
}
