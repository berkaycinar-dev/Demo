import { formatMinutes } from './usePomodoro'
import { formatElapsed } from './useStopwatch'
import useSpaceToggle from './useSpaceToggle'

const R = 104
const CIRC = 2 * Math.PI * R

const COPY = {
  ring: 'SÜRE',
  start: 'Başlat',
  pause: 'Duraklat',
  resume: 'Devam et',
  reset: 'Sıfırla',
  running: 'Kronometre çalışıyor',
  idle: 'Süre sınırı yok',
  paused: 'Duraklatıldı',
  note: 'Her tam dakika bugünkü odağına eklenir.',
}

// Kronometre kartı: sayaç kartıyla (TimerCard) aynı halka ve aynı tek birincil eylem. Halka her dakika
// dolar, ortada geçen süre yazar. compact: odak modunda yalnızca halka ve tek eylem kalır.
export default function StopwatchCard({ stopwatch, stats, title = 'Kronometre', compact = false }) {
  useSpaceToggle(stopwatch.toggle)
  const secs = stopwatch.elapsed
  const offset = CIRC * (1 - (secs % 60) / 60)
  const note = stopwatch.running ? COPY.running : stopwatch.fresh ? COPY.idle : COPY.paused

  return (
    <div className="timer-card stopwatch-card">
      <div className="timer-card__head">
        <span className="timer-card__title">{title}</span>
        <span className="site-muted">{note}</span>
      </div>

      <div className="timer-ring" data-state={stopwatch.running ? 'run' : stopwatch.fresh ? 'idle' : 'paused'}>
        <svg viewBox="0 0 240 240" aria-hidden="true">
          <circle cx="120" cy="120" r={R} fill="none" strokeWidth="12" stroke="var(--ring-track, var(--surface-2))" />
          <circle
            cx="120"
            cy="120"
            r={R}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            stroke="var(--timer)"
            style={{ transition: secs % 60 === 0 ? 'none' : 'stroke-dashoffset 0.3s linear' }}
          />
        </svg>
        <div className="timer-ring__inner">
          <span className="timer-ring__phase" style={{ color: 'var(--timer-ink, var(--timer))' }}>
            {COPY.ring}
          </span>
          <span className="timer-ring__clock" role="timer" aria-live="off">
            {formatElapsed(secs)}
          </span>
        </div>
      </div>

      <button type="button" className="site-btn site-btn--primary site-btn--wide timer-card__main" onClick={stopwatch.toggle} aria-keyshortcuts="Space">
        {stopwatch.running ? COPY.pause : stopwatch.fresh ? COPY.start : COPY.resume}
      </button>

      {!compact && (
        <div className="timer-card__quiet">
          {stopwatch.fresh ? (
            <span className="site-muted stopwatch-card__note">{COPY.note}</span>
          ) : (
            <span className="timer-card__ctl">
              <button type="button" className="quiet-btn" onClick={stopwatch.reset}>
                {COPY.reset}
              </button>
            </span>
          )}
        </div>
      )}

      {!compact && (
        <p className="timer-card__stats">
          Bugün <strong>{formatMinutes(stats.minutes)}</strong> odak
        </p>
      )}
    </div>
  )
}
