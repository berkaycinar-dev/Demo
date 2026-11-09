import { useEffect, useRef } from 'react'
import { PRESETS, formatClock, formatMinutes } from './usePomodoro'

const R = 104
const CIRC = 2 * Math.PI * R

// Boşluk tuşu metin alanlarında yazar, düğme ve bağlantılarda kendi işini yapar; orada kısayol yok.
const OWNS_SPACE = 'input, textarea, select, button, a[href], summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="textbox"], [role="combobox"]'

// Odadayken Boşluk sayacı duraklatır / sürdürür.
function useSpaceToggle(toggle) {
  const ref = useRef(toggle)
  useEffect(() => {
    ref.current = toggle
  })
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' && e.key !== ' ') return
      if (e.repeat || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (e.target instanceof Element && e.target.closest(OWNS_SPACE)) return
      e.preventDefault()
      ref.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

// Halkalı pomodoro sayacı. timer: usePomodoro() dönüşü. compact: odak modunda süre seçimi ve
// istatistik gizlenir. title / note: kartın üst satırı.
export default function TimerCard({ timer, title = 'Sayaç', note, compact = false, showStats = true, children }) {
  const isFocus = timer.phase === 'focus'
  const color = isFocus ? 'var(--timer)' : 'var(--break)'
  const offset = CIRC * (1 - timer.remaining / timer.total)
  const locked = !timer.fresh
  const { notice } = timer
  useSpaceToggle(timer.toggle)

  const hold = {
    onPointerEnter: () => timer.holdNotice(true),
    onPointerLeave: () => timer.holdNotice(false),
    onFocus: () => timer.holdNotice(true),
    onBlur: () => timer.holdNotice(false),
  }

  return (
    <div className="timer-card">
      <div className="timer-card__head">
        <span className="timer-card__title">{title}</span>
        <span className="site-muted">{note ?? (timer.running ? 'Sayaç çalışıyor' : `${timer.presetInfo.focus} dk odak · ${timer.presetInfo.break} dk mola`)}</span>
      </div>

      <div className="timer-ring">
        <svg viewBox="0 0 240 240" aria-hidden="true">
          <circle cx="120" cy="120" r={R} fill="none" strokeWidth="12" stroke="var(--surface-2)" />
          <circle
            cx="120"
            cy="120"
            r={R}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            stroke={color}
            style={{ transition: 'stroke-dashoffset 0.3s linear' }}
          />
        </svg>
        <div className="timer-ring__inner">
          <span className="timer-ring__phase" style={{ color }}>
            {isFocus ? 'ODAK' : 'MOLA'}
          </span>
          <span className="timer-ring__clock" role="timer" aria-live="off">
            {formatClock(timer.remaining)}
          </span>
        </div>
      </div>

      {/* Saniyeler duyurulmaz; yalnızca aşama değişimi ve sıfırlama. */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {timer.announcement?.text}
      </span>

      <div className="timer-card__actions">
        <button type="button" className="site-btn site-btn--primary timer-card__main" onClick={timer.toggle} aria-keyshortcuts="Space">
          {timer.running ? 'Duraklat' : timer.fresh ? 'Başlat' : 'Devam et'}
        </button>
        <button type="button" className="site-btn" onClick={timer.reset}>
          Sıfırla
        </button>
        <button type="button" className="site-btn" onClick={timer.skip} title={isFocus ? 'Molaya geç' : 'Odağa geç'}>
          Atla
        </button>
      </div>

      {notice && (
        <div className="timer-toast" key={notice.id} {...hold}>
          <span>{notice.text}</span>
          {notice.undo ? (
            <button type="button" className="link-btn timer-toast__btn" onClick={notice.undo}>
              Geri al
            </button>
          ) : (
            <button type="button" className="link-btn timer-toast__btn" onClick={timer.dismissNotice}>
              Tamam
            </button>
          )}
        </div>
      )}

      {!compact && (
        <div className="timer-card__presets-wrap">
          <div className="choice-row timer-card__presets" role="group" aria-label="Süre" aria-describedby={locked ? 'timerPresetLock' : undefined}>
            {PRESETS.map((p) => (
              <button key={p.id} type="button" aria-pressed={timer.preset === p.id} disabled={locked && timer.preset !== p.id} onClick={() => timer.setPreset(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          {locked && (
            <p id="timerPresetLock" className="timer-card__lock">
              Seans sürerken süre değişmez. Değiştirmek için önce sıfırla.
            </p>
          )}
        </div>
      )}

      {!compact && showStats && (
        <p className="timer-card__stats">
          Bugün <strong>{timer.stats.pomodoros}</strong> pomodoro · <strong>{formatMinutes(timer.stats.minutes)}</strong> odak
        </p>
      )}
      {children}
    </div>
  )
}
