import { useCallback, useState } from 'react'
import { formatElapsed } from './useStopwatch'

// Sayaç türü (Pomodoro / Kronometre): bütün odalarda ortak, bu tarayıcıda saklanır. Odam'da ve çok kişili
// odalarda aynı seçim geçerli; bir odada değiştirince ötekinde de o tür açılır.
const KEY = 'samedesk.timer-mode'
const MODES = ['pomodoro', 'stopwatch']

function read() {
  try {
    const v = localStorage.getItem(KEY)
    if (MODES.includes(v)) return v
  } catch {
    /* yok say */
  }
  return 'pomodoro'
}

/** [mode, setMode]: setMode çalışan sayacı duraklatıp türü değiştirir (ikisi aynı anda saymaz). */
export function useTimerMode(timer, stopwatch) {
  const [mode, setModeState] = useState(read)
  const setMode = useCallback(
    (next) => {
      if (!MODES.includes(next) || next === mode) return
      // tür değişince çalışan sayaç duraklar (sıfırlanmaz): geri dönünce kaldığı yerden sürer
      if (mode === 'pomodoro' && timer.running) timer.toggle()
      if (mode === 'stopwatch' && stopwatch.running) stopwatch.pause()
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* yok say */
      }
      setModeState(next)
    },
    [mode, timer, stopwatch],
  )
  return [mode, setMode]
}

/** Seçili türe göre odak durumu: avatarın masada oturup oturmadığı, lamba, kişi kartındaki odak dakikası. */
export function focusStateOf(mode, timer, stopwatch) {
  if (mode === 'stopwatch') {
    return { phase: 'focus', running: stopwatch.running, idle: !stopwatch.running, focusing: stopwatch.running, focusMin: Math.floor(stopwatch.elapsed / 60) }
  }
  return {
    phase: timer.phase,
    running: timer.running,
    idle: timer.phase === 'focus' && !timer.running,
    focusing: timer.running && timer.phase === 'focus',
    focusMin: Math.floor((timer.total - timer.remaining) / 60),
  }
}

/** Telefondaki alt sayaç çubuğu için sayaç nesnesi: kronometrede geçen süre ve kronometrenin Başlat'ı. */
export function stageTimerOf(mode, timer, stopwatch) {
  if (mode !== 'stopwatch') return timer
  return { phase: 'focus', running: stopwatch.running, fresh: stopwatch.fresh, toggle: stopwatch.toggle, label: 'Kronometre', clock: formatElapsed(stopwatch.elapsed) }
}
