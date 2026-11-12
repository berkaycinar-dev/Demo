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

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(new URL(`/api/v1${path}`, base), {
    method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000),
  })
  assert.ok(response.ok, `POST ${path} returned ${response.status}`)
  return response.json()
}

function register(role) {
  const username = `ws_${role}_${suffix}`
  return post('/auth/register', { username, email: `${username}@example.test`, password: randomUUID() })
}

async function connect(token, expected = 'CONNECTED') {
  const socket = new WebSocket(endpoint, 'v12.stomp')
  const frames = on(socket, 'message', { signal: AbortSignal.timeout(20_000) })
  clients.push({ socket, frames })
  await once(socket, 'open', { signal: AbortSignal.timeout(10_000) })

  const client = {
    send(command, headers, body = '') {
      socket.send([command, ...headers, '', `${body}\0`].join('\n'))
    },
    async receive() {
      const { value: [message] } = await frames.next()
      const text = typeof message.data === 'string' ? message.data : await message.data.text()
      const separator = text.indexOf('\n\n')
      const [command, ...headers] = text.slice(0, separator).split('\n')
      return { command, headers, body: text.slice(separator + 2, -1) }
    },
  }

  const headers = ['accept-version:1.2', `host:${base.host}`, 'heart-beat:0,0']
  if (token) headers.push(`Authorization:Bearer ${token}`)
  client.send('CONNECT', headers)
  const reply = await client.receive()
  assert.equal(reply.command, expected)
  if (expected === 'ERROR') assert.ok(reply.headers.includes('message:UNAUTHENTICATED'))
  return client
}

async function expectForbidden(client, command, headers, body) {
  client.send(command, headers, body)
  const reply = await client.receive()
  assert.equal(reply.command, 'ERROR')
  assert.ok(reply.headers.includes('message:FORBIDDEN'))
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
  console.log('STOMP smoke passed: JWT, subscription permissions, and the same room event for two members.')
} finally {
  for (const { socket, frames } of clients) {
    socket.close()
    await frames.return()
  }
}
