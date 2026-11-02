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
