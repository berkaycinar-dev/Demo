import { useEffect, useState } from 'react'

// Tercih yalnızca bu tarayıcıda tutulur; sunucuya gitmez.
const KEY = 'samedesk-mode'
const PREFS = ['light', 'dark']
let fadeTimer = 0

// Yalnızca açık / koyu; "sistem" seçeneği yok. Kayıt yoksa (yeni kullanıcı ya da eski 'system' kaydı)
// başlangıç modu bir kez cihazın ayarından alınır, sonra cihaz değişse de izlenmez: kullanıcı düğmeye
// basınca seçtiği mod kaydedilir. Uygulanan mod tek yerde yazılır: <html data-mode="dark"> (açıkta
// öznitelik yok). İlk boyama index.html'deki satır içi betikle aynı kuralı izler, React gelmeden doğru
// mod görünür.
function initialPref() {
  try {
    const saved = localStorage.getItem(KEY)
    if (PREFS.includes(saved)) return saved
  } catch {
    /* depolama kapalı olabilir */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Renk geçişi 200 ms'de döner (yer değiştirme yok; "hareketi azalt"ta da kalır).
function fade() {
  const root = document.documentElement
  root.dataset.modeFade = ''
  clearTimeout(fadeTimer)
  fadeTimer = setTimeout(() => delete root.dataset.modeFade, 260)
}

export default function useColorMode() {
  const [pref, setPrefState] = useState(initialPref)

  useEffect(() => {
    const root = document.documentElement
    if (pref === 'dark') root.dataset.mode = 'dark'
    else delete root.dataset.mode
  }, [pref])

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

  return { pref, mode: pref, isDark: pref === 'dark', setPref }
}
