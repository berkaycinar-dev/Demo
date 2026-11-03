import { DEFAULT_AVATAR, sanitizeAvatar } from '../avatars/options'

// Kullanıcının avatarı bu tarayıcıda saklanır (yalnızca kolaylık; erişilemezse varsayılan kullanılır).
const KEY = 'odakhane.avatar'

export function loadAvatar() {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? sanitizeAvatar(JSON.parse(raw)) : { ...DEFAULT_AVATAR }
  } catch {
    return { ...DEFAULT_AVATAR }
  }
}

export function saveAvatar(avatar) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(avatar))
  } catch {
    // depolama kapalıysa avatar yalnızca bu oturumda kalır
  }
}

// Kombin slotları (gardırop): üç kayıtlı görünüm; boş slot null. Ad kaydedilmez (yüklenince mevcut
// ad kalır). Kayıtlar avatarla aynı biçimde okunur ve eski biçimler sanitizeAvatar'da çevrilir.
const PRESETS_KEY = 'odakhane.avatar.presets'
export const PRESET_SLOTS = 3

export function loadPresets() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(PRESETS_KEY) ?? '[]')
    return Array.from({ length: PRESET_SLOTS }, (_, i) => (raw?.[i] ? sanitizeAvatar(raw[i]) : null))
  } catch {
    return Array(PRESET_SLOTS).fill(null)
  }
}

export function savePresets(presets) {
  try {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.map((p) => (p ? { ...p, name: undefined } : null))))
  } catch {
    // depolama kapalıysa kombinler yalnızca bu oturumda kalır
  }
}
