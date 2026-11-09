import { useCallback, useEffect, useRef, useState } from 'react'
import { chime } from './ambient'

// Pomodoro sayacı. Bitiş zamanı (endAt) tutulur; sekme arka planda kalsa da süre kaymaz.
// Durum localStorage'a yazılır: yenileme, sekmenin bellekten atılması ya da başka sekme sayacı silmez.
export const PRESETS = [
  { id: '25-5', label: '25 / 5', focus: 25, break: 5 },
  { id: '50-10', label: '50 / 10', focus: 50, break: 10 },
  { id: '90-15', label: '90 / 15', focus: 90, break: 15 },
]

const STATS_KEY = 'odakhane.focus-stats'
const TIMER_KEY = 'odakhane.pomodoro'
const TIMER_VERSION = 1
// Aşama bu kadar geç fark edildiyse kullanıcı yoktu (sekme kapalı / donmuş): zil çalmaz, avatar
// sevinmez, olan biten görünür bir notla anlatılır.
const LATE_MS = 5000
const UNDO_MS = 8000
const NOTE_MS = 12000

const today = () => new Date().toISOString().slice(0, 10)
const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10)
const presetOf = (id) => PRESETS.find((x) => x.id === id) ?? PRESETS[0]
const phaseSecs = (p, phase) => (phase === 'focus' ? p.focus : p.break) * 60
const emptyStats = () => ({ day: today(), pomodoros: 0, minutes: 0 })
const leftOf = (t, now = Date.now()) => (t.running ? Math.max(0, Math.ceil((t.endAt - now) / 1000)) : t.remaining)

function readStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY) ?? 'null')
    if (s?.day === today() && Number.isFinite(s.pomodoros) && Number.isFinite(s.minutes)) return s
  } catch {
    /* yok say */
  }
  return emptyStats()
}

const idle = (presetId) => ({ preset: presetId, phase: 'focus', remaining: presetOf(presetId).focus * 60, running: false, endAt: 0 })

// Kayıtlı sayacı okur. Bozuk, eski sürüm ya da anlamsız veri (bilinmeyen ön ayar, süreden uzun kalan
// zaman, ileri alınmış saat) gelirse null döner; sayaç temiz başlar.
function parseTimer(raw) {
  try {
    const s = JSON.parse(raw ?? 'null')
    if (!s || s.v !== TIMER_VERSION) return null
    const p = PRESETS.find((x) => x.id === s.preset)
    if (!p || (s.phase !== 'focus' && s.phase !== 'break') || typeof s.running !== 'boolean') return null
    const total = phaseSecs(p, s.phase)
    if (s.running) {
      if (!Number.isFinite(s.endAt) || s.endAt <= 0 || s.endAt - Date.now() > total * 1000 + 60000) return null
      const t = { preset: p.id, phase: s.phase, remaining: 0, running: true, endAt: s.endAt }
      return { ...t, remaining: Math.min(total, leftOf(t)) }
    }
    if (!Number.isInteger(s.remaining) || s.remaining <= 0 || s.remaining > total) return null
    return { preset: p.id, phase: s.phase, remaining: s.remaining, running: false, endAt: 0 }
  } catch {
    return null
  }
}

function readTimer() {
  try {
    return parseTimer(localStorage.getItem(TIMER_KEY))
  } catch {
    return null
  }
}

// Kalan süre her saniye değişir ama kaydedilmez (çalışırken endAt yeter); sekmeler arası gereksiz
// yazma olmasın.
const serialize = (t) =>
  JSON.stringify({ v: TIMER_VERSION, preset: t.preset, phase: t.phase, running: t.running, endAt: t.running ? t.endAt : 0, remaining: t.running ? null : t.remaining })

const sameTimer = (a, b) => a.preset === b.preset && a.phase === b.phase && a.running === b.running && (a.running ? a.endAt === b.endAt : a.remaining === b.remaining)

const PHASE_TEXT = {
  break: (p) => `Odak bloku bitti. ${p.break} dakikalık mola başladı.`,
  focus: (p) => `Mola bitti. ${p.focus} dakikalık odak bloku başladı.`,
}

/**
 * track: true ise sayaç kalıcıdır (localStorage, sekme başlığı, ekran uyanık kalır) ve biten odak
 *   blokları bugünkü istatistiğe yazılır.
 * Dönüş: { phase, remaining, total, running, fresh, preset, presetInfo, setPreset, toggle, reset, skip,
 *   stats, completed, notice, dismissNotice, holdNotice, announcement }.
 *   completed: süresi dolarak biten odak bloklarının sayısı (atlananlar sayılmaz); odadaki avatar bu
 *   artınca sevinir.
 *   notice: { id, text, undo? } görünür kısa not (sıfırlamayı geri alma, sen yokken biten aşamalar).
 *   announcement: { id, text } ekran okuyucuya aşama değişimi duyurusu.
 */
export default function usePomodoro({ track = true } = {}) {
  const [timer, setTimer] = useState(() => (track && readTimer()) || idle(PRESETS[0].id))
  const [stats, setStats] = useState(readStats)
  const [completed, setCompleted] = useState(0)
  const [notice, setNotice] = useState(null)
  const [hold, setHold] = useState(false)
  const [announcement, setAnnouncement] = useState(null)
  const written = useRef(null)
  const baseTitle = useRef(typeof document === 'undefined' ? 'Odakhane' : document.title)
  const p = presetOf(timer.preset)

  const say = (text) => setAnnouncement({ id: Date.now(), text })
  const note = (text, extra) => {
    setHold(false)
    setNotice({ id: Date.now(), text, ...extra })
  }

  // Odak dakikalarını yazar. Taban her seferinde depodan okunur: başka sekmenin yazdığı ezilmesin.
  const credit = (minutes, pomodoros) => {
    if (!track || (minutes <= 0 && pomodoros <= 0)) return
    const base = readStats()
    const next = { ...base, pomodoros: base.pomodoros + pomodoros, minutes: base.minutes + minutes }
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(next))
    } catch {
      /* yok say: bu oturumda yine görünür */
    }
    setStats(next)
  }

  // Başka sekme sayacı zaten ilerlettiyse onunkini al; aynı blok iki kez sayılmasın.
  const takenOver = (t) => {
    if (!track) return false
    const stored = readTimer()
    if (!stored || sameTimer(stored, t)) return false
    setTimer(stored)
    return true
  }

  // Süresi dolarak biten aşama. Sıradaki aşama bitişten itibaren sayılır (sekme donduysa kaymaz).
  // Sıradaki aşama da çoktan bittiyse sayaç durur ve yeni odak blokuna hazır bekler: kullanıcı
  // yokken yeni blok başlamaz.
  const finish = (t) => {
    if (takenOver(t)) return
    const now = Date.now()
    const late = now - t.endAt > LATE_MS
    const tp = presetOf(t.preset)
    if (t.phase === 'focus') {
      if (dayOf(t.endAt) === today()) credit(tp.focus, 1)
      if (!late) setCompleted((n) => n + 1)
    }
    const phase = t.phase === 'focus' ? 'break' : 'focus'
    const secs = phaseSecs(tp, phase)
    const endAt = t.endAt + secs * 1000
    if (endAt > now) {
      setTimer({ ...t, phase, remaining: leftOf({ running: true, endAt }, now), endAt })
      if (late) note(t.phase === 'focus' ? 'Sen yokken odak bloku bitti; mola sürüyor.' : 'Sen yokken mola bitti; odak bloku sürüyor.')
      else chime()
      say(PHASE_TEXT[phase](tp))
      return
    }
    setTimer(idle(t.preset))
    note(t.phase === 'focus' ? 'Sen yokken odak bloku ve mola bitti. Yeni blok için Başlat.' : 'Sen yokken mola bitti. Yeni blok için Başlat.')
    say('Seans bitti.')
  }

  // Kalıcılık: değişen sayaç yazılır; başka sekmenin yazdığı sayaç ve istatistik buraya alınır.
  useEffect(() => {
    if (!track) return
    const s = serialize(timer)
    if (s === written.current) return
    written.current = s
    try {
      localStorage.setItem(TIMER_KEY, s)
    } catch {
      /* yok say: depo kapalıysa sayaç yalnızca bu sekmede yaşar */
    }
  }, [timer, track])

  useEffect(() => {
    if (!track) return undefined
    const onStorage = (e) => {
      if (e.key === STATS_KEY) setStats(readStats())
      if (e.key !== TIMER_KEY) return
      const t = parseTimer(e.newValue)
      if (!t) return
      written.current = e.newValue
      setTimer((old) => (sameTimer(old, t) ? old : t))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [track])

  // Tik, kalıcılık efektlerinden sonra çalışır: takenOver depoda bu sekmenin son durumunu görsün.
  useEffect(() => {
    if (!timer.running) return undefined
    let done = false
    const tick = () => {
      if (done) return
      const left = leftOf(timer)
      if (left > 0) {
        if (left !== timer.remaining) setTimer((t) => (t.endAt === timer.endAt ? { ...t, remaining: left } : t))
        return
      }
      done = true
      finish(timer)
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  })

  // Sayaç çalışırken ekran kararmasın. Destek yoksa sessizce geçilir; sekme gizlenince tarayıcı kilidi
  // bırakır, geri gelince yeniden alınır.
  useEffect(() => {
    if (!track || !timer.running || typeof navigator === 'undefined' || !navigator.wakeLock) return undefined
    let lock = null
    let gone = false
    const acquire = () => {
      if (gone || document.visibilityState !== 'visible' || (lock && !lock.released)) return
      navigator.wakeLock.request('screen').then(
        (l) => {
          if (gone) l.release().catch(() => {})
          else lock = l
        },
        () => {},
      )
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      gone = true
      document.removeEventListener('visibilitychange', acquire)
      lock?.release().catch(() => {})
    }
  }, [track, timer.running])

  const total = phaseSecs(p, timer.phase)
  const fresh = !timer.running && timer.remaining === total

  // Sekme başlığında geri sayım; seans yokken başlık normale döner.
  useEffect(() => {
    if (!track) return
    document.title = fresh
      ? baseTitle.current
      : `${formatClock(timer.remaining)} · ${timer.running ? (timer.phase === 'focus' ? 'Odak' : 'Mola') : 'Duraklatıldı'} · ${baseTitle.current}`
  }, [track, fresh, timer.remaining, timer.running, timer.phase])
  useEffect(() => {
    const base = baseTitle.current
    return () => {
      if (track) document.title = base
    }
  }, [track])

  // Not kendiliğinden kapanır; üstünde fare ya da odak varken bekler.
  useEffect(() => {
    if (!notice || hold) return undefined
    const t = setTimeout(() => setNotice(null), notice.undo ? UNDO_MS : NOTE_MS)
    return () => clearTimeout(t)
  }, [notice, hold])

  // Bekleyen geri alma, sayaçla yapılan başka bir işlemden sonra geçersizdir.
  const act = (fn) => {
    setNotice((n) => (n?.undo ? null : n))
    fn()
  }

  const toggle = () =>
    act(() =>
      setTimer((t) =>
        t.running ? { ...t, running: false, remaining: Math.max(1, leftOf(t)) } : { ...t, running: true, endAt: Date.now() + t.remaining * 1000 },
      ),
    )

  // Seans sürerken ön ayar değişmez (ilerleme sessizce silinmesin); arayüz de kilitler.
  const setPreset = (id) => {
    if (!fresh || id === timer.preset) return
    act(() => setTimer(idle(id)))
  }

  const reset = () => {
    if (fresh && timer.phase === 'focus') return
    const snapshot = timer
    setTimer(idle(timer.preset))
    note('Sayaç sıfırlandı.', { undo: snapshot })
    say('Sayaç sıfırlandı.')
  }

  // Geri alınan sayaç olduğu gibi döner; çalışıyorsa aradaki saniyeler de geçmiş sayılır.
  const undoReset = () => {
    if (!notice?.undo) return
    setTimer(notice.undo)
    setNotice(null)
    say('Sıfırlama geri alındı.')
  }

  // Atlanan odak blokunda yalnızca geçen dakikalar yazılır; pomodoro sayılmaz, avatar sevinmez.
  const skip = () =>
    act(() => {
      if (takenOver(timer)) return
      const elapsed = total - leftOf(timer)
      if (timer.phase === 'focus') credit(Math.floor(elapsed / 60), 0)
      const phase = timer.phase === 'focus' ? 'break' : 'focus'
      const secs = phaseSecs(p, phase)
      setTimer({ ...timer, phase, remaining: secs, endAt: Date.now() + secs * 1000 })
      say(phase === 'break' ? `Molaya geçildi, ${p.break} dakika.` : `Odağa geçildi, ${p.focus} dakika.`)
    })

  const dismissNotice = useCallback(() => setNotice(null), [])

  return {
    phase: timer.phase,
    remaining: timer.remaining,
    running: timer.running,
    total,
    fresh,
    preset: timer.preset,
    presetInfo: p,
    setPreset,
    toggle,
    reset,
    skip,
    stats: stats.day === today() ? stats : emptyStats(),
    completed,
    notice: notice && { id: notice.id, text: notice.text, undo: notice.undo ? undoReset : null },
    dismissNotice,
    holdNotice: setHold,
    announcement,
  }
}

export const formatClock = (secs) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

export function formatMinutes(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} dk`
  return m ? `${h} sa ${m} dk` : `${h} sa`
}
