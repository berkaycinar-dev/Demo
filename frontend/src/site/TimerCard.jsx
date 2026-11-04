import { PRESETS, formatClock, formatMinutes } from './usePomodoro'

const R = 104
const CIRC = 2 * Math.PI * R

// Halkalı pomodoro sayacı. timer: usePomodoro() dönüşü. compact: odak modunda süre seçimi ve
// istatistik gizlenir. title / note: kartın üst satırı.
export default function TimerCard({ timer, title = 'Sayaç', note, compact = false, showStats = true, children }) {
  const isFocus = timer.phase === 'focus'
  const color = isFocus ? 'var(--timer)' : 'var(--break)'
  const offset = CIRC * (1 - timer.remaining / timer.total)

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

      <div className="timer-card__actions">
        <button type="button" className="site-btn site-btn--primary timer-card__main" onClick={timer.toggle}>
          {timer.running ? 'Duraklat' : timer.fresh ? 'Başlat' : 'Devam et'}
        </button>
        <button type="button" className="site-btn" onClick={timer.reset}>
          Sıfırla
        </button>
        <button type="button" className="site-btn" onClick={timer.skip} title={isFocus ? 'Molaya geç' : 'Odağa geç'}>
          Atla
        </button>
      </div>

      {!compact && (
        <div className="choice-row timer-card__presets" role="group" aria-label="Süre">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" aria-pressed={timer.preset === p.id} onClick={() => timer.setPreset(p.id)}>
              {p.label}
            </button>
          ))}
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
