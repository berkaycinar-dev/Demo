import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@stomp/stompjs'
import { createRealtimeConnection, websocketUrl } from '../src/realtime/connection.js'

const args = process.argv.slice(2)
const base = new URL(args.shift() ?? 'http://127.0.0.1:8080')
assert.ok(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname),
  'Run only against a disposable local backend')
const options = Object.fromEntries(args.map((arg) => {
  assert.match(arg, /^--(users|seconds|p95-ms|out)=.+$/)
  const separator = arg.indexOf('=')
  return [arg.slice(2, separator), arg.slice(separator + 1)]
}))
const count = Number(options.users ?? 20)
const seconds = Number(options.seconds ?? 20)
const threshold = Number(options['p95-ms'] ?? 5000)
assert.ok(Number.isInteger(count) && count >= 2 && count <= 50, 'users must be 2..50')
assert.ok(Number.isInteger(seconds) && seconds >= 5 && seconds <= 300, 'seconds must be 5..300')
assert.ok(Number.isFinite(threshold) && threshold > 0 && threshold <= 30_000, 'p95-ms must be 1..30000')
const output = resolve(options.out ?? fileURLToPath(new URL('../../backend/target/realtime-load-report.json', import.meta.url)))
const actors = []
const groups = []
const desired = new Map()
const issues = []
const report = {
  schemaVersion: 1, startedAt: new Date().toISOString(), revision: process.env.GITHUB_SHA ?? null,
  users: count, steadySeconds: seconds, p95ThresholdMs: threshold, passed: false,
  latencyDefinition: 'Time from starting a batch of REST changes until each subscriber observes the expected complete state; includes REST queuing and snapshot scheduling.',
  phases: [], http: { requests: 0, failed: 0 },
}
let phase = null
let heartbeatTimer
let heartbeatWork = Promise.resolve()
let heartbeatBusy = false

const delay = (ms) => new Promise((done) => setTimeout(done, ms))
const rounded = (number) => Math.round(number * 100) / 100
function stats(values) {
  const sorted = [...values].sort((a, b) => a - b)
  assert.ok(sorted.length > 0, 'No measurements collected')
  return { samples: sorted.length, p50Ms: rounded(sorted[Math.ceil(sorted.length * 0.5) - 1]),
    p95Ms: rounded(sorted[Math.ceil(sorted.length * 0.95) - 1]), maxMs: rounded(sorted.at(-1)) }
}
async function pool(items, action) {
  let next = 0
  const results = await Promise.allSettled(Array.from({ length: Math.min(4, items.length) }, async () => {
    while (next < items.length) { const index = next++; await action(items[index], index) }
  }))
  const failure = results.find((result) => result.status === 'rejected')
  if (failure) throw failure.reason
}
async function request(path, { actor, body, method = 'GET' } = {}) {
  report.http.requests++
  try {
    const response = await fetch(new URL('/api/v1' + path, base), {
      method, headers: { 'Content-Type': 'application/json', ...(actor ? { Authorization: `Bearer ${actor.auth.accessToken}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw Object.assign(new Error(`${method} ${path}: HTTP ${response.status}`), { status: response.status, code: data.code })
    }
    return response.status === 204 ? null : response.json()
  } catch (error) {
    report.http.failed++
    throw error
  }
}
async function until(predicate, name) {
  const deadline = performance.now() + 30_000
  while (!predicate()) {
    assert.equal(issues.length, 0, `Unexpected client issue: ${issues[0]?.code}`)
    assert.ok(performance.now() < deadline, `Timed out: ${name}`)
    await delay(25)
  }
}
function matches(actor) {
  if (!actor.presence) return false
  const expected = actor.group.people.filter((person) => actor.group.room.visibility === 'PRIVATE' || desired.get(person.id).online)
  if (actor.presence.length !== expected.length) return false
  return expected.every((person) => {
    const member = actor.presence.find((value) => value.userId === person.id)
    const state = desired.get(person.id)
    return member && member.online === state.online && member.status === state.status
      && member.spot === state.spot && member.slot === state.slot
  })
}
function observe(actor) {
  if (phase?.participants.has(actor) && !phase.seen.has(actor) && phase.predicate(actor)) {
    phase.seen.set(actor, performance.now() - phase.started)
  }
}
async function measure(name, participants, mutate, predicate = matches) {
  phase = { name, participants: new Set(participants), seen: new Map(), predicate, started: performance.now() }
  await mutate()
  await until(() => phase.seen.size === participants.length, name)
  const result = { name, ...stats([...phase.seen.values()]) }
  report.phases.push(result)
  phase = null
  console.log(`${name}: ${result.samples} clients, p95=${result.p95Ms} ms, max=${result.maxMs} ms`)
  assert.ok(result.p95Ms <= threshold, `${name} exceeded p95 threshold ${threshold} ms`)
}
function presence(actor, event) {
  try {
    assert.equal(event.roomId, actor.group.room.id)
    assert.equal(event.type, 'PRESENCE_SNAPSHOT')
    const members = event.payload.members
    assert.equal(new Set(members.map((member) => member.userId)).size, members.length)
    assert.equal(new Set(members.map((member) => member.seat)).size, members.length)
    for (const member of members) {
      assert.ok(actor.group.people.some((person) => person.id === member.userId), 'Room data crossed groups')
      assert.ok(Number.isInteger(member.seat) && member.seat >= 0 && member.seat < 10)
      assert.ok(Number.isFinite(Date.parse(member.statusSince)))
      assert.equal(member.online, member.startedAt !== null)
      if (!member.online) assert.equal(member.status, 'AWAY')
      if (member.status !== 'BREAK') { assert.equal(member.spot, null); assert.equal(member.slot, null) }
    }
    const me = members.find((member) => member.userId === actor.id)
    if (me) {
      if (actor.seat !== undefined) assert.equal(me.seat, actor.seat, 'Seat changed between snapshots/reentry')
      actor.seat = me.seat
    }
    actor.presence = members
    actor.snapshots++
    observe(actor)
  } catch (error) { issues.push({ code: 'INVALID_PRESENCE', actor: actor.index, message: error.message }) }
}

try {
  const suffix = randomUUID().slice(0, 8)
  console.log(`Preparing ${count} local virtual users; report: ${output}`)
  await pool(Array.from({ length: count }, (_, index) => index), async (index) => {
    const username = `load_${suffix}_${index}`
    const auth = await request('/auth/register', { method: 'POST', body: { username, email: `${username}@example.test`, password: randomUUID() } })
    actors[index] = { index, id: auth.user.id, auth, snapshots: 0, resyncs: 0, timerEvents: [], presence: null }
  })
  for (let start = 0; start < actors.length; start += 10) {
    const people = actors.slice(start, start + 10)
    const owner = people[0]
    const visibility = groups.length % 2 === 0 ? 'PRIVATE' : 'PUBLIC'
    const room = await request('/rooms', { actor: owner, method: 'POST', body: { name: `Load ${suffix} ${groups.length}`, visibility, maxMembers: 10 } })
    const group = { room, people }
    groups.push(group)
    for (const actor of people) actor.group = group
    if (visibility === 'PRIVATE') await pool(people.slice(1), (actor) => request(`/rooms/${room.id}/join`, {
      actor, method: 'POST', body: { inviteCode: room.inviteCode },
    }))
  }
  report.rooms = groups.map((group) => ({ visibility: group.room.visibility, users: group.people.length }))
  await pool(actors, async (actor) => {
    await request(`/rooms/${actor.group.room.id}/sessions`, { actor, method: 'POST' })
    desired.set(actor.id, { online: true, status: 'IDLE', spot: null, slot: null })
    actor.connection = createRealtimeConnection({
      url: websocketUrl(base.toString()), userId: actor.id,
      getSession: async ({ forceRefresh }) => {
        if (forceRefresh) actor.auth = await request('/auth/refresh', { method: 'POST', body: { refreshToken: actor.auth.refreshToken } })
        const jwt = JSON.parse(Buffer.from(actor.auth.accessToken.split('.')[1], 'base64url').toString())
        return { accessToken: actor.auth.accessToken, userId: actor.id, expiresAt: jwt.exp * 1000 }
      },
      clientFactory: (config) => { actor.transport = new Client(config); return actor.transport },
      onError: ({ code }) => {
        if (code !== 'NETWORK' || !actor.plannedDisconnect) issues.push({ code, actor: actor.index })
      },
      onResync: async ({ isCurrent }) => {
        const timer = await request('/timer', { actor })
        if (isCurrent()) { actor.timer = timer; actor.resyncs++; observe(actor) }
      },
    })
    actor.connection.subscribe(`/topic/rooms/${actor.group.room.id}/presence`, (event) => presence(actor, event))
    actor.connection.subscribe('/user/queue/timers', (event) => {
      if (event.userId !== actor.id || event.payload.userId !== actor.id) issues.push({ code: 'TIMER_LEAK', actor: actor.index })
      actor.timerEvents.push(event)
      if (event.type === 'TIMER_STARTED' && event.payload.version === 1) actor.timerLatency = performance.now() - actor.timerSentAt
    })
  })
  heartbeatTimer = setInterval(() => {
    if (heartbeatBusy) return
    heartbeatBusy = true
    heartbeatWork = pool(actors.filter((actor) => desired.get(actor.id).online), async (actor) => {
      try { await request(`/rooms/${actor.group.room.id}/sessions/current/heartbeat`, { actor, method: 'POST' }) }
      catch (error) { if (desired.get(actor.id).online || error.code !== 'SESSION_NOT_FOUND') issues.push({ code: 'HEARTBEAT_FAILED', actor: actor.index }) }
    }).finally(() => { heartbeatBusy = false })
  }, 20_000)

  await measure('initial_presence', actors, async () => { for (const actor of actors) actor.connection.start() },
    (actor) => actor.resyncs > 0 && matches(actor))
  for (const actor of actors) desired.set(actor.id, { online: true, status: 'FOCUS', spot: null, slot: null })
  await measure('focus_status', actors, () => pool(actors, (actor) => request(`/rooms/${actor.group.room.id}/sessions/current/status`, {
    actor, method: 'PUT', body: { status: 'FOCUS' },
  })))
  await pool(actors, async (actor) => {
    actor.timerSentAt = performance.now()
    await request('/timer/commands', { actor, method: 'POST', body: { commandId: randomUUID(), expectedVersion: actor.timer.version, type: 'START' } })
  })
  await until(() => actors.every((actor) => actor.timerLatency !== undefined), 'personal timer events')
  const timers = { name: 'personal_timer', ...stats(actors.map((actor) => actor.timerLatency)) }
  report.phases.push(timers)
  assert.ok(timers.p95Ms <= threshold, 'Personal timer p95 threshold exceeded')
  assert.ok(actors.every((actor) => actor.timerEvents.length === 1), 'Duplicate timer event')

  const owners = groups.map((group) => group.people[0])
  for (const owner of owners) desired.set(owner.id, { online: true, status: 'BREAK', spot: 'load-tea', slot: 0 })
  await measure('break_spot', actors, () => pool(owners, (actor) => request(`/rooms/${actor.group.room.id}/sessions/current/status`, {
    actor, method: 'PUT', body: { status: 'BREAK', spot: 'load-tea', spotCapacity: 2, slot: 0 },
  })))
  const reconnecting = actors.filter((actor) => actor.index % 5 === 0)
  for (const actor of reconnecting) { actor.beforeReconnect = actor.resyncs; actor.plannedDisconnect = true; actor.presence = null }
  await measure('reconnect', reconnecting, async () => { for (const actor of reconnecting) actor.transport.forceDisconnect() },
    (actor) => actor.resyncs > actor.beforeReconnect && matches(actor))
  for (const actor of reconnecting) actor.plannedDisconnect = false

  for (const owner of owners) desired.set(owner.id, { online: false, status: 'AWAY', spot: null, slot: null })
  await measure('exit', actors, () => pool(owners, (actor) => request(`/rooms/${actor.group.room.id}/sessions/current`, { actor, method: 'DELETE' })))
  for (const owner of owners) desired.set(owner.id, { online: true, status: 'IDLE', spot: null, slot: null })
  await measure('reenter', actors, () => pool(owners, (actor) => request(`/rooms/${actor.group.room.id}/sessions`, { actor, method: 'POST' })))

  const before = actors.map((actor) => actor.snapshots)
  console.log(`Holding ${count} connections for ${seconds} seconds with REST session heartbeats...`)
  await delay(seconds * 1000)
  assert.equal(issues.length, 0, `Unexpected client issue: ${issues[0]?.code}`)
  assert.ok(actors.every((actor) => actor.connection.state === 'connected' && matches(actor)), 'Steady state diverged')
  const delivered = actors.map((actor, index) => actor.snapshots - before[index])
  assert.ok(delivered.every((value) => value >= 2), 'A subscriber stopped receiving snapshots')
  report.steady = { minSnapshotsPerClient: Math.min(...delivered), maxSnapshotsPerClient: Math.max(...delivered) }
  report.passed = true
} catch (error) {
  report.failure = error.message
  process.exitCode = 1
  console.error(`Realtime load failed: ${error.message}`)
} finally {
  clearInterval(heartbeatTimer)
  await heartbeatWork
  if (report.passed && (issues.length || report.http.failed)) {
    report.passed = false
    report.failure = 'Client or HTTP errors occurred during the run'
    process.exitCode = 1
  }
  await Promise.allSettled(actors.map((actor) => actor.connection?.stop()))
  report.issues = issues
  report.finishedAt = new Date().toISOString()
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, JSON.stringify(report, null, 2) + '\n')
  console.log(`Realtime load ${report.passed ? 'passed' : 'failed'}; JSON report: ${output}`)
}
