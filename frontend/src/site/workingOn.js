import { useCallback, useSyncExternalStore } from 'react'

// "Ne üzerinde çalışıyorum" satırı: kullanıcının kendi yazdığı kısa metin. Şimdilik yalnızca bu
// tarayıcıda durur (sunucuda alan yok); boş kaydetmek siler. Sekmeler arasında storage olayıyla eşitlenir.
export const WORKING_ON_MAX = 60
const keyOf = (username) => `samedesk.working-on.${username}`
const CHANGED = 'samedesk:working-on'

function read(username) {
  if (!username) return ''
  try {
    return localStorage.getItem(keyOf(username)) ?? ''
  } catch {
    return ''
  }
}

function subscribe(cb) {
  window.addEventListener('storage', cb)
  window.addEventListener(CHANGED, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(CHANGED, cb)
  }
}

/** [metin ('' = yok), kaydet(metin)]; metin kırpılır ve WORKING_ON_MAX karakterde kesilir. */
export default function useWorkingOn(username) {
  const text = useSyncExternalStore(subscribe, () => read(username))
  const save = useCallback(
    (value) => {
      if (!username) return
      const clean = String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, WORKING_ON_MAX)
      try {
        if (clean) localStorage.setItem(keyOf(username), clean)
        else localStorage.removeItem(keyOf(username))
      } catch {
        /* depolama kapalıysa satır bu oturumda da boş kalır */
      }
      window.dispatchEvent(new Event(CHANGED))
    },
    [username],
  )
  return [text, save]
}
