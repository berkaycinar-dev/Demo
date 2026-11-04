// Hesaplar: backend hazır olana kadar yalnızca bu tarayıcıda tutulur (demo). Şifre düz metin
// saklanmaz; kullanıcıya özel tuzla PBKDF2-SHA256 özeti saklanır. Backend gelince bu dosyadaki
// register / login / logout aynı imzalarla API çağrılarına çevrilebilir.

const USERS_KEY = 'odakhane.users'
const SESSION_KEY = 'odakhane.session'
const ITERATIONS = 150_000

export const USERNAME_RE = /^[a-z0-9_.]{3,20}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const MIN_PASSWORD = 8

function readUsers() {
  try {
    const list = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeUsers(list) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list))
}

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)))

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: ITERATIONS }, key, 256)
  return toHex(bits)
}

// Oturumdaki kullanıcının herkese açık bilgileri (şifre özeti dışarı çıkmaz).
const publicUser = (u) => ({ displayName: u.displayName, username: u.username, email: u.email })

export function currentUser() {
  try {
    const username = localStorage.getItem(SESSION_KEY)
    const user = username && readUsers().find((u) => u.username === username)
    return user ? publicUser(user) : null
  } catch {
    return null
  }
}

/** Alan hatalarını döner ({ alan: mesaj }); boşsa form geçerli. */
export function validateRegistration({ displayName, username, email, password, password2 }) {
  const errors = {}
  if (!displayName.trim()) errors.displayName = 'Görünen adını yaz.'
  else if (displayName.trim().length > 40) errors.displayName = 'En fazla 40 karakter olabilir.'
  if (!USERNAME_RE.test(username)) errors.username = '3-20 karakter; küçük harf, rakam, nokta ve alt çizgi.'
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Geçerli bir e-posta adresi yaz.'
  if (password.length < MIN_PASSWORD) errors.password = `Şifre en az ${MIN_PASSWORD} karakter olmalı.`
  if (password2 !== password) errors.password2 = 'Şifreler aynı değil.'
  return errors
}

export async function register({ displayName, username, email, password }) {
  const users = readUsers()
  const mail = email.trim().toLowerCase()
  if (users.some((u) => u.username === username)) return { error: { username: 'Bu kullanıcı adı alınmış.' } }
  if (users.some((u) => u.email === mail)) return { error: { email: 'Bu e-postayla zaten bir hesap var.' } }
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const user = { displayName: displayName.trim(), username, email: mail, salt, hash: await hashPassword(password, salt) }
  writeUsers([...users, user])
  localStorage.setItem(SESSION_KEY, username)
  return { user: publicUser(user) }
}

/** login: e-posta ya da kullanıcı adı + şifre. */
export async function login(identifier, password) {
  const id = identifier.trim().toLowerCase()
  const user = readUsers().find((u) => u.username === id || u.email === id)
  // Hesap yoksa da aynı mesaj: hangi hesapların var olduğu sızmasın.
  if (!user || (await hashPassword(password, user.salt)) !== user.hash) {
    return { error: 'E-posta / kullanıcı adı ya da şifre hatalı.' }
  }
  localStorage.setItem(SESSION_KEY, user.username)
  return { user: publicUser(user) }
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* yok say */
  }
}
