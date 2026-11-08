import { useEffect, useState } from 'react'
import { chime } from './ambient'

// Pomodoro sayacı. Bitiş zamanı (endAt) tutulur; sekme arka planda kalsa da süre kaymaz.
export const PRESETS = [
  { id: '25-5', label: '25 / 5', focus: 25, break: 5 },
  { id: '50-10', label: '50 / 10', focus: 50, break: 10 },
  { id: '90-15', label: '90 / 15', focus: 90, break: 15 },
]

const STATS_KEY = 'odakhane.focus-stats'
const today = () => new Date().toISOString().slice(0, 10)
const presetOf = (id) => PRESETS.find((x) => x.id === id) ?? PRESETS[0]
const emptyStats = () => ({ day: today(), pomodoros: 0, minutes: 0 })

function readStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY) ?? 'null')
    if (s?.day === today()) return s
  } catch {
    /* yok say */
  }
  return emptyStats()
}

const idle = (presetId) => ({ preset: presetId, phase: 'focus', remaining: presetOf(presetId).focus * 60, running: false, endAt: 0 })

/**
 * track: true ise biten odak blokları bugünkü istatistiğe yazılır (ana sayfadaki deneme sayacı yazmaz).
 * Dönüş: { phase, remaining, total, running, fresh, preset, setPreset, toggle, reset, skip, stats,
 *   completed }. completed: süresi dolarak biten odak bloklarının sayısı (atlananlar sayılmaz); odadaki
 *   avatar bu artınca sevinir.
 */
export default function usePomodoro({ track = true } = {}) {
  const [timer, setTimer] = useState(() => idle(PRESETS[0].id))
  const [stats, setStats] = useState(readStats)
  const [completed, setCompleted] = useState(0)
  const p = presetOf(timer.preset)

  // Aşamayı bitirir: odak bittiyse istatistiğe yazar, zil çalar, sıradaki aşamaya geçer.
  const advance = (t, natural = false) => {
    if (t.phase === 'focus' && natural) setCompleted((n) => n + 1)
    if (t.phase === 'focus' && track) {
      setStats((old) => {
        const base = old.day === today() ? old : emptyStats()
        return { ...base, pomodoros: base.pomodoros + 1, minutes: base.minutes + p.focus }
      })
    }
    chime()
    const phase = t.phase === 'focus' ? 'break' : 'focus'
    const secs = (phase === 'focus' ? p.focus : p.break) * 60
    setTimer({ ...t, phase, remaining: secs, endAt: Date.now() + secs * 1000 })
  }

  useEffect(() => {
    if (!timer.running) return undefined
    let done = false
    const id = setInterval(() => {
      if (done) return
      const left = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000))
      if (left > 0) {
        if (left !== timer.remaining) setTimer((t) => (t.endAt === timer.endAt ? { ...t, remaining: left } : t))
        return
      }
      done = true
      advance(timer, true)
    }, 250)
    return () => clearInterval(id)
  })

  useEffect(() => {
    if (!track) return
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats))
    } catch {
      /* yok say */
    }
  }, [stats, track])

  const total = (timer.phase === 'focus' ? p.focus : p.break) * 60

  const toggle = () =>
    setTimer((t) =>
      t.running
        ? { ...t, running: false, remaining: Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000)) }
        : { ...t, running: true, endAt: Date.now() + t.remaining * 1000 },
    )

  return {
    phase: timer.phase,
    remaining: timer.remaining,
    running: timer.running,
    total,
    fresh: !timer.running && timer.remaining === total,
    preset: timer.preset,
    presetInfo: p,
    setPreset: (id) => setTimer(idle(id)),
    toggle,
    reset: () => setTimer(idle(timer.preset)),
    skip: () => advance(timer),
    stats: stats.day === today() ? stats : emptyStats(),
    completed,
  }
}

export const formatClock = (secs) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

export function formatMinutes(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} dk`
  return m ? `${h} sa ${m} dk` : `${h} sa`
}
