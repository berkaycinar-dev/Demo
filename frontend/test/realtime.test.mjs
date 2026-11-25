import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRealtimeConnection, websocketUrl } from '../src/realtime/connection.js'
import { bindRealtimeLifecycle } from '../src/realtime/siteConnection.js'

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }
const ROOM = '/topic/rooms/12345678-1234-1234-1234-123456789abc/presence'

function fixture(provider) {
  let time = 1_000_000
  let sequence = 0
  const timers = new Map()
  const clients = []
  const errors = []
  const resyncs = []
  const sessions = []
  const clock = {
    now: () => time,
    setTimeout(fn, delay) { const id = ++sequence; timers.set(id, { at: time + delay, fn }); return id },
    clearTimeout(id) { timers.delete(id) },
  }
  const session = () => ({ accessToken: 'fresh-token', userId: 'me', expiresAt: time + 300_000 })
  const connection = createRealtimeConnection({
    url: 'ws://localhost:8080/ws', userId: 'me', clock, random: () => 1,
    getSession: async (options) => { sessions.push(options); return provider ? provider(options, session) : session() },
    onError: (error) => errors.push(error.code), onResync: (value) => resyncs.push(value),
    clientFactory(config) {
      const client = {
        config, wires: [], activated: 0, deactivated: 0,
        activate() { this.activated++ },
        async deactivate() { this.deactivated++ },
        subscribe(destination, handler) {
          const wire = { destination, handler, removed: false, unsubscribe() { this.removed = true } }
          this.wires.push(wire)
          return wire
        },
      }
      clients.push(client)
      return client
    },
  })
  async function tick(ms) {
    time += ms
    const due = [...timers].filter(([, timer]) => timer.at <= time)
    for (const [id, timer] of due) { if (timers.delete(id)) timer.fn() }
    await flush()
  }
  return { connection, clients, timers, sessions, errors, resyncs, tick, flush }
}

test('uses WSS for HTTPS and rejects credentials or token-bearing query strings in the URL', () => {
  assert.equal(websocketUrl('https://example.test'), 'wss://example.test/ws')
  assert.equal(websocketUrl('http://localhost:8080'), 'ws://localhost:8080/ws')
  for (const value of ['https://example.test?token=secret', 'https://user:pass@example.test', 'file:///tmp/ws']) {
    assert.throws(() => websocketUrl(value))
  }
})

test('one connection, restored subscriptions, refreshed credentials and fresh REST read after a network loss', async () => {
  const f = fixture()
  const received = []
  f.connection.subscribe(ROOM, (event) => received.push(event))
  f.connection.start()
  f.connection.start()
  await flush()
  assert.equal(f.clients.length, 1)
  const first = f.clients[0]
  assert.equal(first.config.reconnectDelay, 0)
  assert.equal(first.config.connectHeaders.Authorization, 'Bearer fresh-token')
  first.config.onConnect()
  assert.equal(first.wires.length, 1)
  assert.equal(f.resyncs.length, 1)
  assert.equal(f.resyncs[0].isCurrent(), true)
  first.config.onWebSocketClose()
  first.config.onWebSocketClose()
  const removeWhileClosing = f.connection.subscribe('/user/queue/timers', () => {})
  removeWhileClosing()
  await flush()
  assert.equal(f.resyncs[0].isCurrent(), false)
  assert.equal(f.timers.size, 1)
  await f.tick(1000)
  assert.equal(f.clients.length, 2)
  f.clients[1].config.onConnect()
  assert.equal(f.clients[1].wires.length, 1)
  assert.equal(f.sessions.length, 2)
  assert.equal(f.resyncs.length, 2)
  first.wires[0].handler({ body: '{"schemaVersion":1,"eventId":"old","type":"PRESENCE_SNAPSHOT"}' })
  assert.equal(received.length, 0)
  await f.connection.stop()
  assert.equal(f.timers.size, 0)
})

test('removing a subscription prevents it from returning on reconnect', async () => {
  const f = fixture()
  const remove = f.connection.subscribe('/user/queue/timers', () => {})
  f.connection.start(); await flush(); f.clients[0].config.onConnect()
  remove()
  assert.equal(f.clients[0].wires[0].removed, true)
  f.clients[0].config.onWebSocketClose(); await flush(); await f.tick(1000)
  f.clients[1].config.onConnect()
  assert.equal(f.clients[1].wires.length, 0)
  await f.connection.stop()
})

test('network failures use a single exponential retry capped at 30 seconds', async () => {
  const f = fixture(async () => { throw new Error('offline') })
  f.connection.start(); await flush()
  for (const delay of [1000, 2000, 4000, 8000, 16000, 30000, 30000]) {
    assert.equal(f.timers.size, 1)
    const calls = f.sessions.length
    await f.tick(delay - 1)
    assert.equal(f.sessions.length, calls)
    await f.tick(1)
    assert.equal(f.sessions.length, calls + 1)
  }
  await f.connection.stop()
  await f.tick(60_000)
  assert.equal(f.timers.size, 0)
})

test('logout while credentials are pending never opens a socket', async () => {
  let resolve
  const f = fixture(() => new Promise((done) => { resolve = done }))
  f.connection.start()
  await flush()
  await f.connection.stop()
  resolve({ accessToken: 'old', userId: 'me', expiresAt: 2_000_000 })
  await flush()
  assert.equal(f.clients.length, 0)
  assert.equal(f.timers.size, 0)
})

test('another account and a rejected refresh stop instead of retrying', async () => {
  for (const provider of [
    async (_, session) => ({ ...session(), userId: 'someone-else' }),
    async () => { throw Object.assign(new Error('expired'), { status: 401 }) },
  ]) {
    const f = fixture(provider)
    f.connection.start(); await flush(); await f.tick(60_000)
    assert.equal(f.connection.state, 'unauthenticated')
    assert.equal(f.clients.length, 0)
    assert.equal(f.timers.size, 0)
  }
})

test('STOMP auth failure forces one refresh, but forbidden and repeated rejection do not loop', async () => {
  const f = fixture()
  f.connection.start(); await flush()
  f.clients[0].config.onStompError({ headers: { message: 'UNAUTHENTICATED' } })
  await flush(); await f.tick(1000)
  assert.equal(f.sessions[1].forceRefresh, true)
  f.clients[1].config.onStompError({ headers: { message: 'UNAUTHENTICATED' } })
  await flush()
  assert.equal(f.connection.state, 'unauthenticated')
  assert.equal(f.timers.size, 0)
  const other = fixture()
  other.connection.start(); await flush()
  other.clients[0].config.onStompError({ headers: { message: 'FORBIDDEN' } })
  await flush()
  assert.equal(other.connection.state, 'forbidden')
  assert.equal(other.timers.size, 0)
})

test('renews before JWT expiry and wake does not create a second retry loop', async () => {
  const f = fixture()
  f.connection.start(); await flush(); f.clients[0].config.onConnect()
  await f.tick(285_000); await f.tick(0)
  assert.equal(f.clients.length, 2)
  f.clients[1].config.onConnect()
  f.connection.wake()
  assert.equal(f.clients.length, 2)
  assert.equal(f.resyncs.at(-1).reason, 'visible')
  f.clients[1].config.onWebSocketClose(); await flush()
  f.connection.wake(); f.connection.wake(); await flush()
  assert.equal(f.clients.length, 3)
  await f.connection.stop()
})

test('rejects unsupported channels and isolates malformed messages', async () => {
  const f = fixture()
  for (const destination of ['/queue/timers', '/user/other/queue/timers', '/topic/rooms/**']) {
    assert.throws(() => f.connection.subscribe(destination, () => {}))
  }
  const events = []
  f.connection.subscribe('/user/queue/timers', (event) => events.push(event))
  f.connection.start(); await flush(); f.clients[0].config.onConnect()
  const receive = f.clients[0].wires[0].handler
  receive({ body: 'broken' }); receive({ body: '{}' })
  receive({ body: '{"schemaVersion":1,"eventId":"one","type":"TIMER_STARTED"}' })
  assert.equal(events.length, 1)
  assert.deepEqual(f.errors, ['INVALID_MESSAGE', 'INVALID_MESSAGE'])
  await f.connection.stop()
})

test('browser visibility/online wake the connection; account change stops it; cleanup removes listeners', () => {
  const windowTarget = new EventTarget()
  const documentTarget = new EventTarget()
  documentTarget.visibilityState = 'visible'
  let current = true
  let wakes = 0
  let stops = 0
  const unbind = bindRealtimeLifecycle({ wake: () => wakes++, stop: () => stops++ }, {
    windowTarget, documentTarget, isCurrentUser: () => current,
  })
  windowTarget.dispatchEvent(new Event('online'))
  documentTarget.dispatchEvent(new Event('visibilitychange'))
  assert.equal(wakes, 2)
  current = false
  windowTarget.dispatchEvent(new Event('storage'))
  assert.equal(stops, 1)
  windowTarget.dispatchEvent(new Event('samedesk:signed-out'))
  assert.equal(stops, 2)
  unbind()
  windowTarget.dispatchEvent(new Event('online'))
  documentTarget.dispatchEvent(new Event('visibilitychange'))
  assert.equal(stops, 2)
})
