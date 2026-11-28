// Siteden çıkınca pomodoro ve kronometre durur. Açık her sekme sitenin en son açık olduğu anı birkaç
// saniyede bir ve sayfadan çıkarken yazar. Sayfa açılırken kayıt AWAY_MS'ten eskiyse arada sitenin hiçbir
// sekmesi açık değildi: çalışan sayaçlar o andan itibaren duraklatılmış sayılır. Yenileme ya da başka
// sekmeye geçmek sayacı durdurmaz.
const KEY = 'samedesk.alive-at'
const BEAT_MS = 5000
// Tarayıcı arka plandaki sekmenin zamanlayıcısını dakikada bire kadar seyreltebilir; o sekme açıkken
// yeni açılan sayfa siteyi "kapalıydı" sanmasın diye eşik bir dakikanın üstündedir.
export const AWAY_MS = 90_000

/** Site en son lastSeen anında açıktıysa ve now'a kadar AWAY_MS'ten uzun süre geçtiyse lastSeen, değilse null. */
export function awayFrom(lastSeen, now) {
  return Number.isFinite(lastSeen) && lastSeen > 0 && lastSeen <= now && now - lastSeen > AWAY_MS ? lastSeen : null
}

let leftAt
/** Bu sayfa açılmadan önce site kapalıysa kapandığı an (ms), değilse null. Sayfa başına bir kez okunur. */
export function siteLeftAt() {
  if (leftAt === undefined) {
    let lastSeen = NaN
    try {
      lastSeen = Number(localStorage.getItem(KEY))
    } catch {
      /* depo kapalı: bilinmiyor, duraklatılmaz */
    }
    leftAt = awayFrom(lastSeen, Date.now())
  }
  return leftAt
}

/** Sitenin açık olduğunu düzenli yazar. Dönüş: durduran fonksiyon. */
export function startAliveBeat() {
  siteLeftAt() // ilk yazmadan önce önceki kaydı oku
  const beat = () => {
    try {
      localStorage.setItem(KEY, String(Date.now()))
    } catch {
      /* yok say */
    }
  }
  beat()
  const id = setInterval(beat, BEAT_MS)
  window.addEventListener('pagehide', beat)
  document.addEventListener('visibilitychange', beat)
  return () => {
    clearInterval(id)
    window.removeEventListener('pagehide', beat)
    document.removeEventListener('visibilitychange', beat)
  }
}

/**
 * Çalışan pomodoronun `at` anında duraklatılmış hâli (total: aşamanın saniyesi). Aşama o anda zaten
 * bittiyse (sekme arka plandayken) dokunulmaz; sayacın kendi bitiş kuralı işler.
 */
export function pausePomodoroAt(t, at, total) {
  if (!t.running || t.endAt <= at) return t
  return { ...t, running: false, endAt: 0, remaining: Math.min(total, Math.max(1, Math.ceil((t.endAt - at) / 1000))) }
}

/** Çalışan kronometrenin `at` anında duraklatılmış hâli; sonrası sayılmaz. */
export function pauseStopwatchAt(s, at) {
  if (!s.running) return s
  return { ...s, running: false, startedAt: 0, base: s.base + Math.max(0, at - s.startedAt) }
}
