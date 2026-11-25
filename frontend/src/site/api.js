// Backend ile konuşan tek yer: adres, token saklama, yenileme ve hata biçimi.
// Sözleşme: contracts/openapi.yaml. Adres VITE_API_URL ile değişir (yerelde .env.local:
// VITE_API_URL=http://localhost:8080); verilmezse canlı demo backend'i kullanılır.

export const API_URL = (import.meta.env.VITE_API_URL || 'https://demo-backend-bcns.onrender.com').replace(/\/$/, '')

const SESSION_KEY = 'odakhane.api-session'
// Oturum düşünce (yenileme başarısız) Site bunu dinleyip girişe döner.
export const SIGNED_OUT_EVENT = 'odakhane:signed-out'

/** Sunucu hatası: status 0 = sunucuya ulaşılamadı. code: sözleşmedeki makine kodu (ROOM_FULL...). */
export class ApiError extends Error {
  constructor(status, code, message, fieldErrors = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

// Oturum: { accessToken, refreshToken, user }. "Beni hatırla" işaretliyse localStorage'da, değilse
// sessionStorage'da (tarayıcı kapanınca biter).
function storages() {
  try {
    return [localStorage, sessionStorage]
  } catch {
    return []
  }
}

export function readSession() {
  for (const s of storages()) {
    try {
      const v = JSON.parse(s.getItem(SESSION_KEY) ?? 'null')
      if (v?.accessToken && v?.refreshToken && v?.user) return v
    } catch {
      /* bozuk kayıt: yok say */
    }
  }
  return null
}

function sessionRemembered() {
  try {
    return localStorage.getItem(SESSION_KEY) !== null
  } catch {
    return false
  }
}

export function writeSession(auth, remember = sessionRemembered()) {
  const value = JSON.stringify({ accessToken: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user })
  clearSession()
  try {
    ;(remember ? localStorage : sessionStorage).setItem(SESSION_KEY, value)
  } catch {
    /* depolama kapalı: oturum yalnızca bu sayfa açıkken sürer */
  }
}

export function clearSession() {
  for (const s of storages()) {
    try {
      s.removeItem(SESSION_KEY)
    } catch {
      /* yok say */
    }
  }
}

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

async function send(path, { method = 'GET', body, token } = {}) {
  let res
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Sunucuya ulaşılamadı. İnternetini kontrol et; sunucu uyuyorsa uyanması 1-2 dakika sürebilir.')
  }
  if (res.status === 204) return null
  const data = parseJson(await res.text())
  if (!res.ok) {
    throw new ApiError(res.status, data?.code ?? `HTTP_${res.status}`, data?.detail ?? `İstek başarısız (${res.status}).`, data?.fieldErrors ?? {})
  }
  return data
}

// Aynı anda birden çok istek 401 alırsa tek yenileme yapılır (refresh token bir kez kullanılabilir).
let refreshing = null

async function refresh() {
  const session = readSession()
  if (!session) return null
  if (!refreshing) {
    refreshing = send('/api/v1/auth/refresh', { method: 'POST', body: { refreshToken: session.refreshToken } })
      .then((auth) => {
        writeSession(auth)
        return auth.accessToken
      })
      .catch((e) => {
        // Yalnızca sunucu reddederse oturum biter; ağ hatasında oturum kalır.
        if (e.status === 401) {
          clearSession()
          window.dispatchEvent(new Event(SIGNED_OUT_EVENT))
        }
        throw e
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

/**
 * API çağrısı. auth: true ise access token eklenir; süresi dolmuşsa bir kez yenilenip tekrar denenir.
 * Hata: ApiError fırlatır.
 */
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const token = auth ? readSession()?.accessToken : undefined
  try {
    return await send(path, { method, body, token })
  } catch (e) {
    if (!(auth && e instanceof ApiError && e.status === 401 && readSession())) throw e
    const fresh = await refresh()
    return send(path, { method, body, token: fresh })
  }
}

/** Ortak hata metni: sınır aşımı ve ağ hatası için anlaşılır mesaj. */
export function errorText(e, fallback = 'Bir şeyler ters gitti. Tekrar dene.') {
  if (!(e instanceof ApiError)) return fallback
  if (e.code === 'RATE_LIMITED') return 'Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.'
  if (e.status === 0) return e.message
  return e.message || fallback
}
