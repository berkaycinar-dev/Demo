import { DEFAULT_AVATAR, sanitizeAvatar } from '../avatars/options'
import { api, readSession, writeSession } from './api'

// Kullanıcının avatarı bu tarayıcıda saklanır; giriş yapılmışsa sunucuya da yazılır (PUT
// /api/v1/users/me/avatar), böylece odadaki herkes aynı avatarı görür.
const KEY = 'samedesk.avatar'

export function loadAvatar() {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? sanitizeAvatar(JSON.parse(raw)) : { ...DEFAULT_AVATAR }
  } catch {
    return { ...DEFAULT_AVATAR }
  }
}

// Yazılabildiyse true; depolama kapalı ya da doluysa false (avatar yalnızca bu oturumda kalır).
export function saveAvatar(avatar) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(avatar))
    return true
  } catch {
    return false
  }
}

// ---------- sunucu ----------
// Ad sunucuya gitmez: odada kullanıcı adı görünür, görünen ad bu tarayıcıda kalır.
const forServer = (avatar) => {
  const look = { ...avatar }
  delete look.name
  return look
}

/** İki avatar aynı görünüyor mu (ad sayılmaz). b null ise (sunucuda hiç yok) false. */
export function sameLook(a, b) {
  if (!a || !b) return false
  return JSON.stringify(forServer(sanitizeAvatar(a))) === JSON.stringify(forServer(sanitizeAvatar(b)))
}

/**
 * Avatar sayfasındaki Kaydet: avatarı sunucuya yazar; odadakiler bu görünümü görür.
 * Dönüş: sunucuda artık kayıtlı görünüm. Hata: ApiError.
 */
export async function saveAvatarToServer(avatar) {
  const user = await api('/api/v1/users/me/avatar', { method: 'PUT', body: forServer(avatar) })
  const session = readSession()
  if (session && session.user.id === user.id) writeSession({ ...session, user })
  return sanitizeAvatar({ ...user.avatar, name: avatar.name })
}

/**
 * Girişte bir kez: sunucudaki avatarı döner (bu tarayıcıya da yazılır). Hesabın sunucuda hiç avatarı
 * yoksa (yeni hesap) bu tarayıcıdaki görünüm (ilk kez gelende varsayılan kostüm) ilk kayıt olarak
 * sunucuya yazılır ve o döner: odadakiler baştan aynı avatarı görür, sayfada "kaydedilmemiş" görünmez.
 */
export async function syncAvatar(local) {
  const me = await api('/api/v1/auth/me')
  if (!me.avatar) return saveAvatarToServer(local)
  const next = sanitizeAvatar({ ...me.avatar, name: local.name })
  saveAvatar(next)
  return next
}

// Kombin slotları (gardırop): üç kayıtlı görünüm; boş slot null. Ad kaydedilmez (yüklenince mevcut
// ad kalır). Kayıtlar avatarla aynı biçimde okunur ve eski biçimler sanitizeAvatar'da çevrilir.
const PRESETS_KEY = 'samedesk.avatar.presets'
export const PRESET_SLOTS = 3

export function loadPresets() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(PRESETS_KEY) ?? '[]')
    return Array.from({ length: PRESET_SLOTS }, (_, i) => (raw?.[i] ? sanitizeAvatar(raw[i]) : null))
  } catch {
    return Array(PRESET_SLOTS).fill(null)
  }
}

// Yazılabildiyse true; depolama kapalı ya da doluysa false (kombinler yalnızca bu oturumda kalır).
export function savePresets(presets) {
  try {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.map((p) => (p ? { ...p, name: undefined } : null))))
    return true
  } catch {
    return false
  }
}
