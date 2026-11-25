import assert from 'node:assert/strict'
import { test } from 'node:test'
import { api, clearSession, getRealtimeSession, readSession, writeSession } from '../src/site/api.js'

function setup(t) {
  const storage = () => {
    const values = new Map()
    return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }
  }
  for (const [key, value] of Object.entries({ localStorage: storage(), sessionStorage: storage(), window: new EventTarget() })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
    t.after(() => { if (previous) Object.defineProperty(globalThis, key, previous); else delete globalThis[key] })
  }
}
function auth(user = 'me', seconds = 900, refreshToken = 'refresh') {
  const payload = Buffer.from(JSON.stringify({ sub: user, exp: Math.floor(Date.now() / 1000) + seconds })).toString('base64url')
  return { accessToken: `e30.${payload}.signature`, refreshToken, user: { id: user } }
}

test('uses a valid token without refresh and refreshes a near-expiry token only once for REST and STOMP', async (t) => {
  setup(t)
  writeSession(auth())
  let calls = 0
  let resolveRefresh
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.endsWith('/api/v1/auth/refresh')) {
      calls++
      return new Promise((resolve) => { resolveRefresh = () => resolve(new Response(JSON.stringify(auth('me', 900, 'rotated')))) })
    }
    const token = readSession()?.refreshToken
    return token === 'rotated' ? new Response('{}') : new Response('{}', { status: 401 })
  })
  assert.equal((await getRealtimeSession()).userId, 'me')
  assert.equal(calls, 0)
  writeSession(auth('me', 5))
  const first = getRealtimeSession()
  const second = getRealtimeSession()
  const rest = api('/api/v1/timer')
  await new Promise(setImmediate)
  assert.equal(calls, 1)
  resolveRefresh()
  const [one, two] = await Promise.all([first, second, rest])
  assert.deepEqual(one, two)
  assert.equal(readSession().refreshToken, 'rotated')
})

test('a pending refresh cannot restore a logged-out session or overwrite a new account', async (t) => {
  setup(t)
  for (const switchAccount of [false, true]) {
    writeSession(auth('me', 5))
    let resolveRefresh
    t.mock.method(globalThis, 'fetch', async () => new Promise((resolve) => {
      resolveRefresh = () => resolve(new Response(JSON.stringify(auth('me', 900, 'rotated'))))
    }))
    const pending = getRealtimeSession()
    clearSession()
    if (switchAccount) writeSession(auth('other', 900, 'other-refresh'))
    resolveRefresh()
    assert.equal(await pending, null)
    assert.equal(readSession()?.user.id ?? null, switchAccount ? 'other' : null)
  }
})

test('a rejected refresh signs out the current session and produces no credentials', async (t) => {
  setup(t)
  writeSession(auth('me', 5))
  let signedOut = 0
  globalThis.window.addEventListener('samedesk:signed-out', () => signedOut++)
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 401 }))
  await assert.rejects(getRealtimeSession(), { status: 401 })
  assert.equal(readSession(), null)
  assert.equal(signedOut, 1)
})

test('STOMP authentication rejection can force renewal of a token that has not expired yet', async (t) => {
  setup(t)
  writeSession(auth())
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Response(JSON.stringify(auth('me', 900, 'forced-rotation')))
  })
  assert.equal((await getRealtimeSession({ forceRefresh: true })).userId, 'me')
  assert.equal(calls, 1)
  assert.equal(readSession().refreshToken, 'forced-rotation')
})

test('a late rejection of the old account does not sign out a new account', async (t) => {
  setup(t)
  writeSession(auth('me', 5))
  let resolveRefresh
  t.mock.method(globalThis, 'fetch', async () => new Promise((resolve) => {
    resolveRefresh = () => resolve(new Response('{}', { status: 401 }))
  }))
  let signedOut = 0
  globalThis.window.addEventListener('samedesk:signed-out', () => signedOut++)
  const pending = getRealtimeSession()
  writeSession(auth('other', 900, 'other-refresh'))
  resolveRefresh()
  await assert.rejects(pending, { status: 401 })
  assert.equal(readSession().user.id, 'other')
  assert.equal(signedOut, 0)
})
