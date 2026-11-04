// Hesaplar: backend hazır olana kadar yalnızca bu tarayıcıda tutulur (demo). Şifre düz metin
// saklanmaz; kullanıcıya özel tuzla PBKDF2-SHA256 özeti saklanır. Backend gelince bu dosyadaki
// register / login / logout aynı imzalarla API çağrılarına çevrilebilir.

const USERS_KEY = 'odakhane.users'
const SESSION_KEY = 'odakhane.session'
const ITERATIONS = 150_000

export const USERNAME_RE = /^[a-z0-9_.]{3,20}$/
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
export function validateRegistration({ displayName, username, email, password, password2, terms }) {
  const errors = {}
  if (!displayName.trim()) errors.displayName = 'Görünen adını yaz.'
  else if (displayName.trim().length > 40) errors.displayName = 'En fazla 40 karakter olabilir.'
  if (!USERNAME_RE.test(username)) errors.username = '3-20 karakter; küçük harf, rakam, nokta ve alt çizgi.'
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Geçerli bir e-posta adresi yaz.'
  const weak = passwordProblem(password)
  if (weak) errors.password = weak
  if (password2 !== password) errors.password2 = 'Şifreler aynı değil.'
  if (!terms) errors.terms = 'Devam etmek için koşulları kabul etmelisin.'
  return errors
}

export async function register({ displayName, username, email, password }) {
  // Form atlansa da kural geçerli: zayıf şifreyle hesap açılmaz.
  const weak = passwordProblem(password)
  if (weak) return { error: { password: weak } }
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

// ---------- hesap ayarları ----------

// Kullanıcıya bağlı başka kayıtlar (kişisel oda ayarları gibi) kullanıcı adıyla anahtarlanır;
// kullanıcı adı değişince bunlar yeni ada taşınır.
const PER_USER_PREFIXES = ['odakhane.myroom.', 'odakhane.joined.']

function findIndex(users, username) {
  return users.findIndex((u) => u.username === username)
}

/** Görünen ad ve kullanıcı adı. Dönüş: { user } ya da { error: { alan: mesaj } } */
export function updateProfile(currentUsername, { displayName, username }) {
  const errors = {}
  if (!displayName.trim()) errors.displayName = 'Görünen adını yaz.'
  else if (displayName.trim().length > 40) errors.displayName = 'En fazla 40 karakter olabilir.'
  if (!USERNAME_RE.test(username)) errors.username = '3-20 karakter; küçük harf, rakam, nokta ve alt çizgi.'
  const users = readUsers()
  const i = findIndex(users, currentUsername)
  if (i < 0) return { error: { form: 'Oturum bulunamadı; yeniden giriş yap.' } }
  if (!errors.username && username !== currentUsername && users.some((u) => u.username === username)) {
    errors.username = 'Bu kullanıcı adı alınmış.'
  }
  if (Object.keys(errors).length) return { error: errors }

  users[i] = { ...users[i], displayName: displayName.trim(), username }
  writeUsers(users)
  if (username !== currentUsername) {
    for (const prefix of PER_USER_PREFIXES) {
      const old = localStorage.getItem(prefix + currentUsername)
      if (old !== null) {
        localStorage.setItem(prefix + username, old)
        localStorage.removeItem(prefix + currentUsername)
      }
    }
    localStorage.setItem(SESSION_KEY, username)
  }
  return { user: publicUser(users[i]) }
}

async function verify(user, password) {
  return (await hashPassword(password, user.salt)) === user.hash
}

/** E-posta değişikliği: mevcut şifre gerekir. */
export async function changeEmail(username, { email, password }) {
  const mail = email.trim().toLowerCase()
  if (!EMAIL_RE.test(mail)) return { error: { email: 'Geçerli bir e-posta adresi yaz.' } }
  const users = readUsers()
  const i = findIndex(users, username)
  if (i < 0) return { error: { form: 'Oturum bulunamadı; yeniden giriş yap.' } }
  if (mail === users[i].email) return { error: { email: 'Bu zaten şu anki e-postan.' } }
  if (users.some((u, j) => j !== i && u.email === mail)) return { error: { email: 'Bu e-postayla başka bir hesap var.' } }
  if (!(await verify(users[i], password))) return { error: { password: 'Şifre hatalı.' } }
  users[i] = { ...users[i], email: mail }
  writeUsers(users)
  return { user: publicUser(users[i]) }
}

/** Şifre değişikliği: mevcut şifre doğrulanır, yeni şifre yeni tuzla saklanır. */
export async function changePassword(username, { current, next, next2 }) {
  const errors = {}
  const weak = passwordProblem(next)
  if (weak) errors.next = weak
  else if (next === current) errors.next = 'Yeni şifre eskisiyle aynı olamaz.'
  if (next2 !== next) errors.next2 = 'Şifreler aynı değil.'
  const users = readUsers()
  const i = findIndex(users, username)
  if (i < 0) return { error: { form: 'Oturum bulunamadı; yeniden giriş yap.' } }
  if (!(await verify(users[i], current))) errors.current = 'Mevcut şifre hatalı.'
  if (Object.keys(errors).length) return { error: errors }
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  users[i] = { ...users[i], salt, hash: await hashPassword(next, salt) }
  writeUsers(users)
  return { ok: true }
}
