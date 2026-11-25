import { API_URL, getRealtimeSession, readSession, SIGNED_OUT_EVENT } from '../site/api.js'
import { createRealtimeConnection, websocketUrl } from './connection.js'

export function bindRealtimeLifecycle(connection, { windowTarget, documentTarget, isCurrentUser }) {
  const stop = () => { void connection.stop() }
  const wake = () => { if (isCurrentUser()) connection.wake(); else stop() }
  const visible = () => { if (documentTarget.visibilityState === 'visible') wake() }
  const storage = () => { if (!isCurrentUser()) stop() }
  windowTarget.addEventListener('online', wake)
  windowTarget.addEventListener('storage', storage)
  windowTarget.addEventListener(SIGNED_OUT_EVENT, stop)
  documentTarget.addEventListener('visibilitychange', visible)
  return () => {
    windowTarget.removeEventListener('online', wake)
    windowTarget.removeEventListener('storage', storage)
    windowTarget.removeEventListener(SIGNED_OUT_EVENT, stop)
    documentTarget.removeEventListener('visibilitychange', visible)
  }
}

/** One instance per signed-in user. A owns the screen state and calls stop on cleanup. */
export function createSiteRealtimeConnection(options = {}) {
  const userId = readSession()?.user.id
  if (!userId) throw new Error('Sign in before creating a realtime connection')
  const connection = createRealtimeConnection({
    ...options, url: websocketUrl(API_URL), userId, getSession: getRealtimeSession,
  })
  let unbind = null
  const managed = {
    get state() { return connection.state },
    subscribe: connection.subscribe,
    wake: connection.wake,
    start() {
      if (!unbind) unbind = bindRealtimeLifecycle(managed, {
        windowTarget: window, documentTarget: document,
        isCurrentUser: () => readSession()?.user.id === userId,
      })
      connection.start()
    },
    stop() {
      unbind?.()
      unbind = null
      return connection.stop()
    },
  }
  return managed
}
