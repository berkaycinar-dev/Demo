import { THEMES } from '../rooms/themes'

// Kişisel odanın (Odam) ayarları: kullanıcı başına bu tarayıcıda saklanır.
const DEFAULTS = { theme: 'library', sound: null, volume: 0.5 }
const keyOf = (user) => `odakhane.myroom.${user.username}`

export function loadMyRoom(user) {
  try {
    const s = JSON.parse(localStorage.getItem(keyOf(user)) ?? 'null')
    return { ...DEFAULTS, ...s, theme: THEMES[s?.theme] ? s.theme : DEFAULTS.theme }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveMyRoom(user, settings) {
  try {
    localStorage.setItem(keyOf(user), JSON.stringify(settings))
  } catch {
    /* depolama kapalıysa ayarlar yalnızca bu oturumda kalır */
  }
}
