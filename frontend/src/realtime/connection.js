import { Client } from '@stomp/stompjs'

const ROOM_CHANNEL = /^\/topic\/rooms\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/(events|presence)$/

export function websocketUrl(apiUrl) {
  const url = new URL(apiUrl)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Invalid realtime API URL')
  }
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws'
  return url.toString()
}

/** Transport only. Consumers read REST state again in onResync and own the UI/state. */
export function createRealtimeConnection({
  url, userId, getSession, onResync = () => {}, onStateChange = () => {}, onError = () => {},
  clientFactory = (config) => new Client(config), random = Math.random,
  clock = { now: () => Date.now(), setTimeout: (...args) => setTimeout(...args), clearTimeout: (id) => clearTimeout(id) },
}) {
  if (!userId || typeof getSession !== 'function') throw new Error('Realtime session provider required')
  const subscriptions = new Set()
  let wanted = false
  let attempting = false
  let generation = 0
  let client = null
  let retryTimer = null
  let expiryTimer = null
  let failures = 0
  let authFailures = 0
  let forceRefresh = false
  let connectedAt = 0
  let sessionExpiresAt = 0
  let state = 'idle'

  const report = (code) => { try { onError({ code }) } catch { /* consumer owns error presentation */ } }
  function notify(callback, value, code) {
    try { Promise.resolve(callback(value)).catch(() => report(code)) } catch { report(code) }
  }
  function setState(next) {
    state = next
    notify(onStateChange, next, 'CALLBACK_FAILED')
  }
  const isCurrent = (id) => wanted && generation === id

  function cancelTimers() {
    clock.clearTimeout(retryTimer)
    clock.clearTimeout(expiryTimer)
    retryTimer = expiryTimer = null
  }
  function retire() {
    generation++
    attempting = false
    cancelTimers()
    const previous = client
    client = null
    for (const subscription of subscriptions) subscription.wire = null
    return previous ? previous.deactivate({ force: true }).catch(() => {}) : Promise.resolve()
  }
  function stop(next = 'stopped') {
    wanted = false
    const done = retire()
    subscriptions.clear()
    setState(next)
    return done
  }
  function retry(immediate = false) {
    if (!wanted || retryTimer !== null) return
    const ceiling = Math.min(30_000, 1000 * 2 ** Math.min(failures++, 5))
    const delay = immediate ? 0 : Math.round(ceiling * (0.8 + random() * 0.2))
    setState('reconnecting')
    if (!wanted) return
    retryTimer = clock.setTimeout(() => { retryTimer = null; void connect() }, delay)
  }
  function reconnect(immediate = false) {
    const done = retire()
    const id = generation
    if (wanted) setState('reconnecting')
    void done.then(() => { if (isCurrent(id)) retry(immediate) })
  }
  function resync(id, reason) {
    notify(onResync, { reason, isCurrent: () => isCurrent(id) }, 'RESYNC_FAILED')
  }
  function install(subscription, id) {
    subscription.wire = client.subscribe(subscription.destination, (message) => {
      if (!isCurrent(id) || !subscriptions.has(subscription)) return
      let event
      try { event = JSON.parse(message.body) } catch { report('INVALID_MESSAGE'); return }
      if (event?.schemaVersion !== 1 || typeof event.eventId !== 'string' || typeof event.type !== 'string') {
        report('INVALID_MESSAGE')
        return
      }
      notify(subscription.handler, event, 'CALLBACK_FAILED')
    })
  }
  async function connect() {
    if (!wanted || attempting || client) return
    attempting = true
    const id = ++generation
    setState('connecting')
    try {
      if (!isCurrent(id)) return
      const credentials = await getSession({ forceRefresh })
      if (!isCurrent(id)) return
      forceRefresh = false
      if (!credentials || credentials.userId !== userId || !credentials.accessToken
          || !Number.isFinite(credentials.expiresAt) || credentials.expiresAt <= clock.now()) {
        report('UNAUTHENTICATED')
        void stop('unauthenticated')
        return
      }
      sessionExpiresAt = credentials.expiresAt
      client = clientFactory({
        brokerURL: url,
        connectHeaders: { Authorization: `Bearer ${credentials.accessToken}` },
        reconnectDelay: 0, // This module owns the single retry loop, including token acquisition failures.
        connectionTimeout: 10_000,
        heartbeatIncoming: 10_000,
        heartbeatOutgoing: 10_000,
        discardWebsocketOnCommFailure: true,
        debug: () => {},
        logRawCommunication: false,
        onConnect: () => {
          if (!isCurrent(id)) return
          attempting = false
          authFailures = 0
          connectedAt = clock.now()
          for (const subscription of subscriptions) install(subscription, id)
          setState('connected')
          if (!isCurrent(id)) return
          resync(id, 'connected')
          if (!isCurrent(id)) return
          // Delivery stops when JWT expires even if the WebSocket remains open. Reconnect before then.
          expiryTimer = clock.setTimeout(() => {
            if (!isCurrent(id)) return
            reconnect(true)
          }, Math.max(1, credentials.expiresAt - clock.now() - 15_000))
        },
        onWebSocketClose: () => {
          if (!isCurrent(id)) return
          if (state === 'connected' && clock.now() - connectedAt >= 30_000) failures = 0
          reconnect()
        },
        onWebSocketError: () => { if (isCurrent(id)) report('NETWORK') },
        onStompError: (frame) => {
          if (!isCurrent(id)) return
          const code = frame.headers.message
          if (code === 'UNAUTHENTICATED' && authFailures++ === 0) {
            forceRefresh = true
            reconnect()
          } else {
            const known = ['FORBIDDEN', 'UNAUTHENTICATED'].includes(code)
            report(known ? code : 'PROTOCOL_ERROR')
            const next = { FORBIDDEN: 'forbidden', UNAUTHENTICATED: 'unauthenticated' }[code] ?? 'error'
            void stop(next)
          }
        },
      })
      client.activate()
    } catch (error) {
      if (!isCurrent(id)) return
      if (error?.status === 401 || error?.status === 403) {
        report('UNAUTHENTICATED')
        void stop('unauthenticated')
      } else {
        report('NETWORK')
        reconnect()
      }
    }
  }

  return {
    get state() { return state },
    start() {
      if (wanted) return
      wanted = true
      failures = authFailures = 0
      forceRefresh = false
      void connect()
    },
    stop: () => stop(),
    wake() {
      if (!wanted || attempting) return
      if (state === 'connected' && sessionExpiresAt - clock.now() <= 15_000) reconnect(true)
      else if (state === 'connected') resync(generation, 'visible')
      else {
        clock.clearTimeout(retryTimer)
        retryTimer = null
        void connect()
      }
    },
    subscribe(destination, handler) {
      if (typeof handler !== 'function') throw new Error('Realtime subscription handler required')
      if (destination !== '/user/queue/timers' && !ROOM_CHANNEL.test(destination)) {
        throw new Error('Unsupported realtime subscription')
      }
      const subscription = { destination, handler, wire: null }
      subscriptions.add(subscription)
      if (state === 'connected' && client) install(subscription, generation)
      return () => {
        if (!subscriptions.delete(subscription)) return
        subscription.wire?.unsubscribe()
        subscription.wire = null
      }
    },
  }
}
