// Odalar ve katılım geçmişi: backend gelene kadar bu tarayıcıda saklanır.
//   odakhane.rooms               oluşturulan odalar (örnek odalar kodda sabit)
//   odakhane.joined.<kullanıcı>  katıldığın odalar: [{ id, at }] en yenisi başta

const ROOMS_KEY = 'odakhane.rooms'
const JOINED_PREFIX = 'odakhane.joined.'
const MAX_JOINED = 20

// Örnek odalar: listeler boş görünmesin diye. Gizli odalara davet koduyla girilir.
export const SAMPLE_ROOMS = [
  { id: 'sample-1', name: 'Merkez Kütüphane · Okuma Salonu', theme: 'library', capacity: 7, access: 'public' },
  { id: 'sample-2', name: 'Kod Lab · Açık Ofis', theme: 'office', capacity: 7, access: 'public' },
  { id: 'sample-4', name: 'Şömine Başında Uzun Bloklar', theme: 'cabin', capacity: 5, access: 'public' },
  { id: 'sample-3', name: 'Ormanda Sessizlik', theme: 'treehouse', capacity: 4, access: 'invite', code: 'ORMAN-2741' },
  { id: 'sample-5', name: 'Gece Vardiyası · Uzay', theme: 'space', capacity: 6, access: 'invite', code: 'UZAY-5308' },
]

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? 'null')
    return Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

// Yazıldıysa null; yazılamadıysa neden: 'full' (kota doldu) ya da 'blocked' (depolama kapalı / erişilemez).
// Çağıran yok sayarsa veri yalnızca bu oturumda kalır.
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return null
  } catch (e) {
    const full = e?.name === 'QuotaExceededError' || e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e?.code === 22 || e?.code === 1014
    return full ? 'full' : 'blocked'
  }
}

/** Oluşturulan odalar + örnek odalar (en yeni oluşturulan başta). */
export function loadRooms() {
  return [...read(ROOMS_KEY, []), ...SAMPLE_ROOMS]
}

/** Odayı kaydeder; yazılamazsa nedeni döner ('full' | 'blocked'), yazıldıysa null. */
export function saveCreatedRoom(room) {
  return write(ROOMS_KEY, [room, ...read(ROOMS_KEY, []).filter((r) => r.id !== room.id)])
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
