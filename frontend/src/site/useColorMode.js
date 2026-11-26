import { useEffect, useRef, useState } from 'react'

// Tercih yalnızca bu tarayıcıda tutulur; sunucuya gitmez.
const KEY = 'samedesk-mode'
const PREFS = ['light', 'dark', 'system']
let fadeTimer = 0

// Açık / koyu / sistem. Kayıt yoksa (yeni kullanıcı) sistem; eski 'light' / 'dark' kayıtları aynen geçerli.
// Uygulanan (resolved) mod tek yerde yazılır: <html data-mode="dark"> (açıkta öznitelik yok). Sahne,
// küçük resimler ve CSS bunu okur; seçilen tercihi değil. İlk boyama index.html'deki satır içi betikle
// aynı kuralı izler, React gelmeden doğru mod görünür.
function initialPref() {
  try {
    const saved = localStorage.getItem(KEY)
    if (PREFS.includes(saved)) return saved
  } catch {
    /* depolama kapalı olabilir */
  }
  return 'system'
}

const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)')

// Renk geçişi 200 ms'de döner (yer değiştirme yok; "hareketi azalt"ta da kalır).
function fade() {
  const root = document.documentElement
  root.dataset.modeFade = ''
  clearTimeout(fadeTimer)
  fadeTimer = setTimeout(() => delete root.dataset.modeFade, 260)
}

export default function useColorMode() {
  const [pref, setPrefState] = useState(initialPref)
  const [systemDark, setSystemDark] = useState(() => Boolean(darkQuery()?.matches))

  const prefRef = useRef(pref)
  useEffect(() => {
    prefRef.current = pref
  }, [pref])

  // Sistem teması site açıkken değişirse yenilemeden izle.
  useEffect(() => {
    const mq = darkQuery()
    if (!mq) return undefined
    const onChange = (e) => {
      if (prefRef.current === 'system') fade()
      setSystemDark(e.matches)
    }
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const mode = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'dark') root.dataset.mode = 'dark'
    else delete root.dataset.mode
  }, [mode])

  const setPref = (next) => {
    if (!PREFS.includes(next) || next === pref) return
    fade()
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* yok say */
    }
    setPrefState(next)
  }

  return { pref, mode, isDark: mode === 'dark', setPref }
}
