// Odalar: backend'de (contracts/openapi.yaml, tag "rooms"). Katılım geçmişi bu tarayıcıda kalır.
//   samedesk.joined.<kullanıcı>  katıldığın odalar: [{ id, at }] en yenisi başta

import { THEMES } from '../rooms/themes'
import { api } from './api'

const JOINED_PREFIX = 'samedesk.joined.'
const MAX_JOINED = 20
const DEFAULT_THEME = 'library'
// Backend'in kişi sınırı (CreateRoomRequest.maxMembers).
export const MIN_MEMBERS = 2
export const MAX_MEMBERS = 10

// Tema backend'de ayrı alan değil. Prototipte odanın açıklamasında "theme:<ad>" olarak taşınır;
// böylece odayı açan herkes aynı temayı görür. Backend'e tema alanı gelince burası değişir.
const THEME_PREFIX = 'theme:'
const themeOf = (description) => {
  const name = description?.startsWith(THEME_PREFIX) ? description.slice(THEME_PREFIX.length).trim() : ''
  return THEMES[name] ? name : DEFAULT_THEME
}

/** Sunucudaki oda (RoomResponse) → sitenin oda biçimi. */
export function fromApi(r) {
  return {
    id: r.id,
    name: r.name,
    theme: themeOf(r.description),
    capacity: r.maxMembers,
    access: r.visibility === 'PRIVATE' ? 'invite' : 'public',
    code: r.inviteCode ?? undefined,
    memberCount: r.memberCount,
    myRole: r.myRole ?? null,
  }
}

/** Herkese açık odalar + üyesi olduğun (gizliler dahil) odalar; en yeni başta, tekrarsız. */
export async function fetchRooms() {
  const [open, mine] = await Promise.all([api('/api/v1/rooms?scope=PUBLIC'), api('/api/v1/rooms?scope=MINE')])
  const byId = new Map()
  for (const r of [...mine, ...open]) if (!byId.has(r.id)) byId.set(r.id, fromApi(r))
  return [...byId.values()]
}

/** Odayı sunucuda oluşturur (oluşturan otomatik üye olur). Dönüş: sitenin oda biçimi. */
export async function createRoom({ name, theme, capacity, access }) {
  const r = await api('/api/v1/rooms', {
    method: 'POST',
    body: {
      name,
      description: THEME_PREFIX + theme,
      visibility: access === 'invite' ? 'PRIVATE' : 'PUBLIC',
      maxMembers: Math.max(MIN_MEMBERS, Math.min(MAX_MEMBERS, capacity)),
    },
  })
  return fromApi(r)
}

/** Odaya üye olur (zaten üyeysen bir şey değişmez). Davetli oda için davet kodu gerekir. */
export async function joinRoom(room, code) {
  const r = await api(`/api/v1/rooms/${room.id}/join`, { method: 'POST', body: code ? { inviteCode: code } : undefined })
  return fromApi(r)
}

/**
 * Yalnızca davet koduyla gizli odaya üye olur: gizli oda üye olmayana görünmediği için oda sunucuda
 * koddan bulunur. Dönüş: sitenin oda biçimi. Hata: ApiError (ROOM_NOT_FOUND, ROOM_FULL, RATE_LIMITED).
 */
export async function joinRoomByCode(code) {
  const r = await api('/api/v1/rooms/join-by-code', { method: 'POST', body: { inviteCode: normalizeCode(code) } })
  return fromApi(r)
}

// Odada bulunma (room_sessions): girince oturum açılır, açıkken düzenli "buradayım" denir,
// çıkınca kapanır. Sunucu 60 sn sinyal almazsa oturumu kendisi kapatır.
export const HEARTBEAT_MS = 20_000

export const enterRoom = (roomId) => api(`/api/v1/rooms/${roomId}/sessions`, { method: 'POST' })
export const heartbeat = (roomId) => api(`/api/v1/rooms/${roomId}/sessions/current/heartbeat`, { method: 'POST' })
export const exitRoom = (roomId) => api(`/api/v1/rooms/${roomId}/sessions/current`, { method: 'DELETE' })
/** Şu an odada olanlar: [{ userId, username, role, startedAt }] */
export const activeMembers = (roomId) => api(`/api/v1/rooms/${roomId}/sessions/active`)

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? 'null')
    return Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* yazılamazsa geçmiş yalnızca bu oturumda kalır */
  }
}

export function loadJoined(user) {
  return read(JOINED_PREFIX + user.username, [])
}

/** Odayı geçmişin başına alır; aynı oda tekrar eklenmez. Yeni listeyi döner. */
export function recordJoin(user, roomId) {
  const next = [{ id: roomId, at: Date.now() }, ...loadJoined(user).filter((j) => j.id !== roomId)].slice(0, MAX_JOINED)
  write(JOINED_PREFIX + user.username, next)
  return next
}

export function forgetJoin(user, roomId) {
  const next = loadJoined(user).filter((j) => j.id !== roomId)
  write(JOINED_PREFIX + user.username, next)
  return next
}

// Kodlar yalnızca A-Z, 0-9 ve tire içerir; Türkçe harfler karşılığına çevrilir (ş → S), böylece
// hangi klavyeyle yazılırsa yazılsın aynı kod eşleşir.
const TR_MAP = { Ç: 'C', Ğ: 'G', İ: 'I', I: 'I', Ö: 'O', Ş: 'S', Ü: 'U' }
export const normalizeCode = (code) =>
  code
    .trim()
    .toLocaleUpperCase('tr')
    .replace(/[ÇĞİIÖŞÜ]/g, (c) => TR_MAP[c])

/** Davet kodu kontrolü: büyük/küçük harf, Türkçe harf ve baştaki/sondaki boşluk önemsenmez. */
export const codeMatches = (room, code) => !!room.code && normalizeCode(room.code) === normalizeCode(code)
