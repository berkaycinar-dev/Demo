// Hesaplar: backend'de (contracts/openapi.yaml, tag "auth"). Kayıt, giriş, çıkış ve oturum API'den;
// token'lar api.js'te saklanır. Backend'de henüz olmayanlar: görünen ad bu tarayıcıda kalır; e-posta,
// şifre ve hesap silme Hesap sayfasında form değil, durum notu olarak görünür.

import { ApiError, api, clearSession, errorText, readSession, writeSession } from './api'

// Backend kuralı: harf, rakam, alt çizgi (nokta yok). Site küçük harf ister.
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/
export const USERNAME_HINT = 'Küçük harf, rakam ve alt çizgi.'
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const MIN_PASSWORD = 8

// Şifre koşulları: kayıt ve şifre değiştirmede aynı kurallar. Türkçe harfler de sayılır (Ş, ğ...).
export const PASSWORD_RULES = [
  { id: 'length', label: `En az ${MIN_PASSWORD} karakter`, test: (p) => [...p].length >= MIN_PASSWORD },
  { id: 'upper', label: 'Büyük harf', test: (p) => /\p{Lu}/u.test(p) },
  { id: 'lower', label: 'Küçük harf', test: (p) => /\p{Ll}/u.test(p) },
  { id: 'digit', label: 'Rakam', test: (p) => /\p{Nd}/u.test(p) },
  { id: 'symbol', label: 'Sembol (!, ?, * gibi)', test: (p) => /[^\p{L}\p{N}\s]/u.test(p) },
]

/** Sağlanmayan koşullar için tek satırlık hata; hepsi sağlanıyorsa null. */
export function passwordProblem(password) {
  const missing = PASSWORD_RULES.filter((r) => !r.test(password))
  if (!missing.length) return null
  return `Şifre şu koşulları sağlamalı: ${missing.map((r) => r.label.toLocaleLowerCase('tr')).join(', ')}.`
}

// Görünen ad backend'de yok: kullanıcı kimliğine bağlı olarak bu tarayıcıda tutulur. Başka
// tarayıcıda ilk girişte kullanıcı adı görünür.
const NAMES_KEY = 'samedesk.display-names'
const LAST_LOGIN_KEY = 'samedesk.last-login'

function readNames() {
  try {
    const v = JSON.parse(localStorage.getItem(NAMES_KEY) ?? '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

function saveName(userId, displayName) {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify({ ...readNames(), [userId]: displayName }))
  } catch {
    /* yok say: ad yalnızca bu oturumda */
  }
}

// Sayfaların kullandığı kullanıcı: { id, displayName, username, email }
const toUser = (u) => ({ id: u.id, username: u.username, email: u.email, displayName: readNames()[u.id] || u.username })

/** Son hatırlanan giriş e-postası; yoksa boş. */
export function lastLoginId() {
  try {
    return localStorage.getItem(LAST_LOGIN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function currentUser() {
  const session = readSession()
  return session ? toUser(session.user) : null
}

/** Alan hatalarını döner ({ alan: mesaj }); boşsa form geçerli. */
export function validateRegistration({ displayName, username, email, password, password2, terms }) {
  const errors = {}
  if (!displayName.trim()) errors.displayName = 'Görünen adını yaz.'
  else if (displayName.trim().length > 40) errors.displayName = 'En fazla 40 karakter olabilir.'
  if (!USERNAME_RE.test(username)) errors.username = `3-20 karakter; ${USERNAME_HINT.toLocaleLowerCase('tr')}`
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Geçerli bir e-posta adresi yaz.'
  const weak = passwordProblem(password)
  if (weak) errors.password = weak
  if (password2 !== password) errors.password2 = 'Şifreler aynı değil.'
  if (!terms) errors.terms = 'Devam etmek için koşulları kabul etmelisin.'
  return errors
}

// Sunucunun kayıt hatalarını form alanlarına çevirir.
const REGISTER_CODES = {
  EMAIL_TAKEN: { email: 'Bu e-postayla zaten bir hesap var.' },
  USERNAME_TAKEN: { username: 'Bu kullanıcı adı alınmış.' },
  PASSWORD_TOO_LONG: { password: 'Şifre çok uzun (en fazla 72 bayt).' },
}

export async function register({ displayName, username, email, password }) {
  // Form atlansa da kural geçerli: zayıf şifreyle hesap açılmaz.
  const weak = passwordProblem(password)
  if (weak) return { error: { password: weak } }
  try {
    const auth = await api('/api/v1/auth/register', {
      method: 'POST',
      auth: false,
      body: { email: email.trim().toLowerCase(), username, password },
    })
    saveName(auth.user.id, displayName.trim())
    writeSession(auth, true)
    return { user: toUser(auth.user) }
  } catch (e) {
    if (e instanceof ApiError && REGISTER_CODES[e.code]) return { error: REGISTER_CODES[e.code] }
    if (e instanceof ApiError && e.code === 'VALIDATION_ERROR' && Object.keys(e.fieldErrors).length) {
      return { error: e.fieldErrors }
    }
    return { error: { form: errorText(e, 'Hesap oluşturulamadı. Tekrar dene.') } }
  }
}

/** login: e-posta + şifre (backend e-postayla giriş yapar). remember: oturum kalıcı mı. */
export async function login(identifier, password, remember = true) {
  const email = identifier.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return { error: 'Giriş için e-posta adresini yaz.' }
  try {
    const auth = await api('/api/v1/auth/login', { method: 'POST', auth: false, body: { email, password } })
    writeSession(auth, remember)
    try {
      if (remember) localStorage.setItem(LAST_LOGIN_KEY, identifier.trim())
      else localStorage.removeItem(LAST_LOGIN_KEY)
    } catch {
      /* yok say */
    }
    return { user: toUser(auth.user) }
  } catch (e) {
    // Hesap yoksa da aynı mesaj: hangi hesapların var olduğu sızmasın (sunucu da aynısını yapar).
    if (e instanceof ApiError && e.status === 401) return { error: 'E-posta ya da şifre hatalı.' }
    return { error: errorText(e, 'Giriş yapılamadı. Tekrar dene.') }
  }
}

/** Çıkış: refresh token sunucuda iptal edilir (cevap beklenmez), oturum hemen silinir. */
export function logout() {
  const session = readSession()
  clearSession()
  if (session) {
    api('/api/v1/auth/logout', { method: 'POST', auth: false, body: { refreshToken: session.refreshToken } }).catch(() => {})
  }
}

// ---------- hesap ayarları ----------
// Backend'de profil ucu henüz yok: görünen ad bu tarayıcıda değişir. Kullanıcı adı değişmez.

/** Görünen ad (bu tarayıcıda). Dönüş: { user } ya da { error } */
export function updateProfile({ displayName }) {
  const session = readSession()
  if (!session) return { error: { form: 'Oturum bulunamadı; yeniden giriş yap.' } }
  const errors = {}
  if (!displayName.trim()) errors.displayName = 'Görünen adını yaz.'
  else if (displayName.trim().length > 40) errors.displayName = 'En fazla 40 karakter olabilir.'
  if (Object.keys(errors).length) return { error: errors }
  saveName(session.user.id, displayName.trim())
  return { user: toUser(session.user) }
}
