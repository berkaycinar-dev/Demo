import { useCallback, useEffect, useRef, useState } from 'react'

// Kronometre: süre sınırı olmadan ileri sayar. Başlangıç zamanı (startedAt) ve duraklamaya kadar biriken
// süre (base) tutulur; sekme arka planda kalsa da süre kaymaz. Durum localStorage'a yazılır: yenileme ve
// başka sekme kronometreyi silmez. Her tam dakika bir kez onMinutes ile bugünkü odak sayımına eklenir
// (credited: sayılmış dakika); sıfırlayınca sayılanlar sayımda kalır, yarım dakika düşer.
const KEY = 'samedesk.stopwatch'
const EMPTY = { running: false, startedAt: 0, base: 0, credited: 0 }
const TICK_MS = 250

function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (s && typeof s.running === 'boolean' && [s.startedAt, s.base, s.credited].every(Number.isFinite)) return s
  } catch {
    /* yok say */
  }
  return EMPTY
}

const elapsedOf = (s, now = Date.now()) => s.base + (s.running ? Math.max(0, now - s.startedAt) : 0)
const sameRun = (a, b) => a.running === b.running && a.startedAt === b.startedAt && a.base === b.base

/** Geçen süre: "12:05", bir saati geçince "1:12:05". */
export function formatElapsed(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/**
 * onMinutes(n): yeni dolan n tam dakika (bugünkü odak sayımına eklenir).
 * onStart(): kronometre başlamadan hemen önce (ör. çalışan pomodoroyu duraklatmak için).
 * Dönüş: { running, fresh, elapsed (saniye), toggle, pause, reset }.
 */
export default function useStopwatch({ onMinutes, onStart } = {}) {
  const [sw, setSw] = useState(read)
  const [now, setNow] = useState(Date.now)
  const swRef = useRef(sw)
  const cb = useRef({ onMinutes, onStart })
  useEffect(() => {
    cb.current = { onMinutes, onStart }
  })

  const commit = useCallback((next) => {
    swRef.current = next
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* depolama kapalıysa yalnızca bu oturumda */
    }
    setSw(next)
  }, [])

  // Dolan tam dakikaları bir kez sayar ve sayılmış hâli döndürür. Aynı dakikaları başka sekme saydıysa
  // (depodaki aynı koşu daha çok saymışsa) tekrar sayılmaz.
  const settle = useCallback((s, t) => {
    const whole = Math.floor(elapsedOf(s, t) / 60000)
    if (whole <= s.credited) return s
    const stored = read()
    if (sameRun(stored, s) && stored.credited >= whole) return stored
    cb.current.onMinutes?.(whole - s.credited)
    return { ...s, credited: whole }
  }, [])

  // Çalışırken saniyede birkaç kez: görünen süre yenilenir, dolan dakikalar sayılır (açılışta, sekme
  // kapalıyken geçen süre de ilk vuruşta sayılır).
  useEffect(() => {
    if (!sw.running) return undefined
    const tick = () => {
      const t = Date.now()
      setNow(t)
      const s = swRef.current
      const next = settle(s, t)
      if (next !== s) commit(next)
    }
    const id = setInterval(tick, TICK_MS)
    return () => clearInterval(id)
  }, [sw.running, settle, commit])

  // başka sekme başlattı / durdurduysa onunkini al
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== KEY) return
      const s = read()
      swRef.current = s
      setSw(s)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const pause = useCallback(() => {
    const s = swRef.current
    if (!s.running) return
    const t = Date.now()
    const settled = settle(s, t)
    setNow(t)
    commit({ ...settled, running: false, startedAt: 0, base: elapsedOf(s, t) })
  }, [settle, commit])

  const toggle = useCallback(() => {
    const s = swRef.current
    if (s.running) return pause()
    cb.current.onStart?.()
    const t = Date.now()
    setNow(t)
    commit({ ...s, running: true, startedAt: t })
  }, [pause, commit])

  const reset = useCallback(() => commit(EMPTY), [commit])

  return {
    running: sw.running,
    fresh: !sw.running && sw.base === 0,
    elapsed: Math.floor(elapsedOf(sw, now) / 1000),
    toggle,
    pause,
    reset,
  }
}
