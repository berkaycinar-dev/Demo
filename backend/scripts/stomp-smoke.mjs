import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { on, once } from 'node:events'

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8080')
assert.ok(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname),
  'Run this smoke test against a disposable local backend')

const endpoint = new URL('/ws', base)
endpoint.protocol = 'ws:'
const suffix = randomUUID().slice(0, 8)
const clients = []

async function post(path, body, token, method = 'POST') {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(new URL(`/api/v1${path}`, base), {
    method, headers, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000),
  })
  assert.ok(response.ok, `${method} ${path} returned ${response.status}`)
  return response.status === 204 ? null : response.json()
}

function register(role) {
  const username = `ws_${role}_${suffix}`
  return post('/auth/register', { username, email: `${username}@example.test`, password: randomUUID() })
}

async function connect(token, expected = 'CONNECTED', heartbeat = '0,0') {
  const socket = new WebSocket(endpoint, 'v12.stomp')
  const frames = on(socket, 'message', { signal: AbortSignal.timeout(120_000) })
  clients.push({ socket, frames })
  await once(socket, 'open', { signal: AbortSignal.timeout(10_000) })

  const client = {
    get isOpen() { return socket.readyState === WebSocket.OPEN },
    sendHeartbeat() {
      if (socket.readyState === WebSocket.OPEN) socket.send('\n')
    },
    async waitForClose(timeoutMs) {
      if (socket.readyState !== WebSocket.CLOSED) {
        await once(socket, 'close', { signal: AbortSignal.timeout(timeoutMs) })
      }
    },
    async disconnect() {
      const closed = once(socket, 'close', { signal: AbortSignal.timeout(5_000) })
      socket.close()
      await closed
      await frames.return()
    },
    send(command, headers, body = '') {
      socket.send([command, ...headers, '', `${body}\0`].join('\n'))
    },
    async receive() {
      const { value: [message] } = await frames.next()
      const text = typeof message.data === 'string' ? message.data : await message.data.text()
      if (/^[\r\n]+$/.test(text)) return { command: 'HEARTBEAT', headers: [], body: '' }
      const separator = text.indexOf('\n\n')
      const [command, ...headers] = text.slice(0, separator).split('\n')
      return { command, headers, body: text.slice(separator + 2, -1) }
    },
  }

  const headers = ['accept-version:1.2', `host:${base.host}`, `heart-beat:${heartbeat}`]
  if (token) headers.push(`Authorization:Bearer ${token}`)
  client.send('CONNECT', headers)
  const reply = await client.receive()
  assert.equal(reply.command, expected)
  if (expected === 'ERROR') assert.ok(reply.headers.includes('message:UNAUTHENTICATED'))
  else client.serverHeartbeat = reply.headers.find((header) => header.startsWith('heart-beat:'))
  return client
}

async function verifyHeartbeats(token) {
  const silent = await connect(token, 'CONNECTED', '100,100')
  assert.match(silent.serverHeartbeat ?? '', /^heart-beat:[1-9]\d*,[1-9]\d*$/)
  const [serverSend, serverReceive] = silent.serverHeartbeat.slice('heart-beat:'.length).split(',').map(Number)
  assert.ok(serverSend >= 100 && serverReceive >= 100)
  // Spring allows a margin for scheduling delay before disconnecting a silent peer.
  const staleClosed = silent.waitForClose(serverReceive * 6 + 5000)
  staleClosed.catch(() => {})
  const live = await connect(token, 'CONNECTED', '100,100')
  let beat = setInterval(() => live.sendHeartbeat(), Math.max(50, Math.floor(serverReceive / 2)))
  try {
    assert.equal((await live.receive()).command, 'HEARTBEAT')
    await staleClosed
    assert.equal(live.isOpen, true, 'A peer sending heartbeats must stay connected')
    assert.equal((await live.receive()).command, 'HEARTBEAT')
    clearInterval(beat)
    await live.disconnect()

    const reconnected = await connect(token, 'CONNECTED', '100,100')
    beat = setInterval(() => reconnected.sendHeartbeat(), Math.max(50, Math.floor(serverReceive / 2)))
    assert.equal((await reconnected.receive()).command, 'HEARTBEAT')
    assert.equal(reconnected.isOpen, true)
    await reconnected.disconnect()
  } finally {
    clearInterval(beat)
    // Attach a rejection handler even if another assertion failed before the stale close.
    await staleClosed.catch(() => {})
  }
  console.log('STOMP heartbeat negotiation, live peer, stale peer cleanup and reconnect passed.')
}

async function expectForbidden(client, command, headers, body) {
  client.send(command, headers, body)
  const reply = await client.receive()
  assert.equal(reply.command, 'ERROR')
  assert.ok(reply.headers.includes('message:FORBIDDEN'))
}

// userIds: the people inside now. A private room's snapshot lists every member; those not inside come
// with online=false (shown as away), so only online members are compared. Returns the event and the
// online members.
async function expectPresence(client, roomId, userIds) {
  // Full snapshots may already be queued from before the REST change.
  while (true) {
    const message = await client.receive()
    assert.equal(message.command, 'MESSAGE')
    const event = JSON.parse(message.body)
    assert.equal(event.type, 'PRESENCE_SNAPSHOT')
    assert.equal(event.roomId, roomId)
    const inside = event.payload.members.filter((member) => member.online)
    const ids = inside.map((member) => member.userId).sort()
    if (JSON.stringify(ids) === JSON.stringify([...userIds].sort())) return { event, inside }
  }
}

try {
  await connect(undefined, 'ERROR')
  await connect('invalid-token', 'ERROR')

  const [owner, member, outsider] = await Promise.all(['owner', 'member', 'outsider'].map(register))
  const room = await post('/rooms', { name: `STOMP smoke ${suffix}`, visibility: 'PRIVATE' }, owner.accessToken)
  const join = (user) => post(`/rooms/${room.id}/join`, { inviteCode: room.inviteCode }, user.accessToken)
  await join(member)

  const destination = `/topic/rooms/${room.id}/events`
  const subscription = [`destination:${destination}`, 'id:room-events']

  await expectForbidden(await connect(outsider.accessToken), 'SUBSCRIBE', subscription)
  await expectForbidden(await connect(owner.accessToken), 'SUBSCRIBE', ['destination:/topic/rooms/**', 'id:wildcard'])
  await expectForbidden(await connect(owner.accessToken), 'SEND', [`destination:${destination}`], '{}')

  const listeners = await Promise.all([connect(owner.accessToken), connect(member.accessToken)])
  for (const listener of listeners) listener.send('SUBSCRIBE', subscription)

  // The simple broker has no SUBSCRIBE receipt. Register the joining user after sending subscriptions.
  const joiningUser = await register('joiner')
  await join(joiningUser)
  const messages = await Promise.all(listeners.map((listener) => listener.receive()))
  const events = messages.map((message) => {
    assert.equal(message.command, 'MESSAGE')
    assert.ok(message.headers.includes(`destination:${destination}`))
    return JSON.parse(message.body)
  })
  assert.deepEqual(events[0], events[1])
  assert.equal(events[0].schemaVersion, 1)
  assert.equal(events[0].type, 'MEMBER_JOINED')
  assert.equal(events[0].roomId, room.id)
  assert.deepEqual(events[0].payload, {
    roomId: room.id, userId: joiningUser.user.id, username: joiningUser.user.username, role: 'MEMBER',
  })
  console.log('JWT and room channel scenarios passed.')

  // A personal timer is shared by the user's tabs, even without an active room session.
  const timerSubscription = ['destination:/user/queue/timers', 'id:timer']
  for (const denied of ['/queue/timers', `/user/${owner.user.id}/queue/timers`, '/user/queue/**']) {
    await expectForbidden(await connect(outsider.accessToken), 'SUBSCRIBE', [`destination:${denied}`, 'id:denied'])
  }
  const timerTabs = await Promise.all([connect(owner.accessToken), connect(owner.accessToken)])
  const otherTimer = await connect(outsider.accessToken)
  for (const client of [...timerTabs, otherTimer]) client.send('SUBSCRIBE', timerSubscription)
  let timer = await post('/timer', undefined, owner.accessToken, 'GET')
  // Allow the asynchronous broker to install the subscriptions before the first command.
  await new Promise((resolve) => setTimeout(resolve, 200))

  async function command(type, expectedType, preset) {
    const request = { commandId: randomUUID(), expectedVersion: timer.version, type, preset }
    timer = await post('/timer/commands', request, owner.accessToken)
    const delivered = await Promise.all(timerTabs.map((client) => client.receive()))
    const values = delivered.map((message) => {
      assert.equal(message.command, 'MESSAGE')
      assert.ok(message.headers.includes('destination:/user/queue/timers'))
      const event = JSON.parse(message.body)
      assert.equal(event.type, expectedType)
      assert.equal(event.userId, owner.user.id)
      assert.equal(event.payload.version, timer.version)
      assert.equal(event.payload.phase, timer.phase)
      assert.equal(event.payload.endsAt, timer.endsAt)
      assert.equal(event.roomId, undefined)
      return event
    })
    if (values.length === 2) assert.deepEqual(values[0], values[1])
    console.log(`Personal timer ${type} delivered to ${values.length} tab(s).`)
    return request
  }

  const startRequest = await command('START', 'TIMER_STARTED')
  const repeated = await post('/timer/commands', startRequest, owner.accessToken)
  assert.equal(repeated.version, timer.version)
  const stale = await fetch(new URL('/api/v1/timer/commands', base), {
    method: 'POST', headers: { Authorization: `Bearer ${owner.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ commandId: randomUUID(), expectedVersion: 0, type: 'PAUSE' }),
    signal: AbortSignal.timeout(10_000),
  })
  assert.equal(stale.status, 409)
  assert.equal((await stale.json()).code, 'STALE_VERSION')
  // A duplicate or rejected command must not have queued an extra TIMER_STARTED.
  await command('PAUSE', 'TIMER_PAUSED')
  await command('RESUME', 'TIMER_STARTED')
  await command('SKIP', 'TIMER_STARTED')
  assert.equal(timer.phase, 'BREAK')
  await command('RESET', 'TIMER_RESET')
  await command('SET_PRESET', 'TIMER_RESET', '50-10')
  assert.equal(timer.preset, '50-10')

  await timerTabs.pop().disconnect()
  await command('START', 'TIMER_STARTED')
  timerTabs.push(await connect(owner.accessToken))
  timerTabs[1].send('SUBSCRIBE', timerSubscription)
  const restored = await post('/timer', undefined, owner.accessToken, 'GET')
  assert.equal(restored.version, timer.version)
  assert.equal(restored.status, 'RUNNING')
  await new Promise((resolve) => setTimeout(resolve, 200))
  await command('PAUSE', 'TIMER_PAUSED')

  // The other user's first queued event must be their own, never the owner's timer.
  const otherState = await post('/timer', undefined, outsider.accessToken, 'GET')
  await post('/timer/commands', {
    commandId: randomUUID(), expectedVersion: otherState.version, type: 'START',
  }, outsider.accessToken)
  const otherEvent = JSON.parse((await otherTimer.receive()).body)
  assert.equal(otherEvent.userId, outsider.user.id)
  assert.equal(otherEvent.type, 'TIMER_STARTED')
  await command('RESET', 'TIMER_RESET')

  // Room listeners must receive the next membership event, with no personal timers before it.
  await expectForbidden(await connect(outsider.accessToken), 'SUBSCRIBE', [
    `destination:/topic/rooms/${room.id}/presence`, 'id:denied-presence',
  ])
  await join(outsider)
  for (const listener of listeners) {
    assert.equal(JSON.parse((await listener.receive()).body).type, 'MEMBER_JOINED')
  }
  console.log('Personal timer isolation and reconnect scenarios passed.')

  const presenceDestination = `/topic/rooms/${room.id}/presence`
  const presenceSubscription = [`destination:${presenceDestination}`, 'id:presence']
  const presence = await connect(owner.accessToken)
  presence.send('SUBSCRIBE', presenceSubscription)
  // nobody inside: every member is listed, all away (private room)
  const empty = await expectPresence(presence, room.id, [])
  const listed = empty.event.payload.members
  assert.deepEqual(listed.map((m) => m.userId).sort(),
    [owner, member, joiningUser, outsider].map((u) => u.user.id).sort())
  assert.ok(listed.every((m) => m.status === 'AWAY' && m.online === false && m.startedAt === null))
  assert.equal(new Set(listed.map((m) => m.seat)).size, listed.length, 'every member has their own seat')

  await post(`/rooms/${room.id}/sessions`, undefined, member.accessToken)
  const entered = await expectPresence(presence, room.id, [member.user.id])
  assert.equal(entered.inside[0].username, member.user.username)
  assert.equal(entered.inside[0].role, 'MEMBER')
  assert.equal(entered.inside[0].seat, listed.find((m) => m.userId === member.user.id).seat, 'inside at their member seat')
  await post(`/rooms/${room.id}/sessions/current/heartbeat`, undefined, member.accessToken)
  await expectPresence(presence, room.id, [member.user.id])

  await presence.disconnect()
  const reconnected = await connect(owner.accessToken)
  reconnected.send('SUBSCRIBE', presenceSubscription)
  await expectPresence(reconnected, room.id, [member.user.id])

  await post(`/rooms/${room.id}/sessions/current`, undefined, member.accessToken, 'DELETE')
  await expectPresence(reconnected, room.id, [])

  await post(`/rooms/${room.id}/sessions`, undefined, member.accessToken)
  await expectPresence(reconnected, room.id, [member.user.id])
  // Stop sending heartbeats. C's session sweeper must remove the timed-out participant.
  await expectPresence(reconnected, room.id, [])
  await verifyHeartbeats(owner.accessToken)
  console.log('STOMP smoke passed: JWT, room isolation, private timers across tabs, commands, retries, reconnect, presence, exit and timeout.')
} finally {
  for (const { socket, frames } of clients) {
    socket.close()
    await frames.return()
  }
}
