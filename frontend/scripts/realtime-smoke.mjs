import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { Client } from '@stomp/stompjs'
import { createRealtimeConnection, websocketUrl } from '../src/realtime/connection.js'

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8080')
assert.ok(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname),
  'Use a disposable local backend for the realtime client smoke test')

async function request(path, { token, body, method = 'GET' } = {}) {
  const response = await fetch(new URL('/api/v1' + path, base), {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10_000),
  })
  assert.ok(response.ok, `${method} ${path}: ${response.status}`)
  return response.status === 204 ? null : response.json()
}
async function until(predicate, label) {
  const deadline = Date.now() + 20_000
  while (!predicate()) {
    assert.ok(Date.now() < deadline, `Timed out: ${label}`)
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

const suffix = randomUUID().slice(0, 8)
let auth = await request('/auth/register', {
  method: 'POST', body: { username: `rt_${suffix}`, email: `rt_${suffix}@example.test`, password: randomUUID() },
})
const room = await request('/rooms', { method: 'POST', token: auth.accessToken, body: { name: `Realtime ${suffix}`, visibility: 'PRIVATE' } })
let transport
let resyncs = 0
let snapshot = null
const events = []
const errors = []
let members = []
const connection = createRealtimeConnection({
  url: websocketUrl(base.toString()), userId: auth.user.id,
  getSession: async ({ forceRefresh }) => {
    if (forceRefresh) auth = await request('/auth/refresh', { method: 'POST', body: { refreshToken: auth.refreshToken } })
    const payload = JSON.parse(Buffer.from(auth.accessToken.split('.')[1], 'base64url').toString())
    return { accessToken: auth.accessToken, userId: auth.user.id, expiresAt: payload.exp * 1000 }
  },
  clientFactory: (config) => { transport = new Client(config); return transport },
  onError: ({ code }) => errors.push(code),
  onResync: async ({ isCurrent }) => {
    const state = await request('/timer', { token: auth.accessToken })
    if (isCurrent()) { snapshot = state; resyncs++ }
  },
})

try {
  connection.subscribe('/user/queue/timers', (event) => events.push(event))
  connection.subscribe(`/topic/rooms/${room.id}/presence`, (event) => { members = event.payload.members })
  connection.start()
  await until(() => resyncs === 1, 'initial REST synchronization')
  await request(`/rooms/${room.id}/sessions`, { method: 'POST', token: auth.accessToken })
  await until(() => members.some((member) => member.userId === auth.user.id && member.online), 'initial presence subscription')
  await request('/timer/commands', {
    method: 'POST', token: auth.accessToken,
    body: { commandId: randomUUID(), expectedVersion: snapshot.version, type: 'START' },
  })
  await until(() => events.some((event) => event.type === 'TIMER_STARTED'), 'initial timer subscription')

  transport.forceDisconnect()
  await until(() => connection.state === 'reconnecting', 'connection loss')
  // This change occurs during the reconnect delay and is recovered by REST on reconnect.
  const paused = await request('/timer/commands', {
    method: 'POST', token: auth.accessToken,
    body: { commandId: randomUUID(), expectedVersion: 1, type: 'PAUSE' },
  })
  members = []
  await until(() => resyncs === 2 && members.some((member) => member.userId === auth.user.id && member.online), 'restored subscriptions')
  assert.equal(snapshot.version, paused.version)
  assert.equal(snapshot.status, 'PAUSED')
  await request('/timer/commands', {
    method: 'POST', token: auth.accessToken,
    body: { commandId: randomUUID(), expectedVersion: snapshot.version, type: 'RESUME' },
  })
  await until(() => events.some((event) => event.type === 'TIMER_STARTED' && event.payload.version === 3), 'restored timer subscription')
  assert.equal(events.filter((event) => event.payload.version === 3).length, 1)
  assert.ok(errors.every((code) => code === 'NETWORK'), `Unexpected realtime errors: ${errors.join(', ')}`)
  console.log('Realtime client smoke passed: real STOMP, forced disconnect, automatic reconnect, subscriptions and REST recovery.')
} finally {
  await connection.stop()
}
