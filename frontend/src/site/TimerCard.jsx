import { useEffect, useId, useRef, useState } from 'react'
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

// Sayacın metinleri. Sayılar ayrı değişken; çeviride sıra değişebilir.
const TIMER_COPY = {
  focus: 'ODAK',
  break: 'MOLA',
  start: 'Başlat',
  pause: 'Duraklat',
  resume: 'Devam et',
  reset: 'Sıfırla',
  skip: 'Atla',
  presets: 'Süre',
  ok: 'Tamam',
  undo: 'Geri al',
  // seans sürerken kilitli bir süreye basınca kartın üstünde kısa not olarak çıkar
  lock: 'Süreyi değiştirmek için önce sıfırla.',
  // bugünkü sayıma eklenen dakikaların kısa yankısı (duyuru aşama metninden gelir)
  gain: (min) => `+${min} dk`,
}

// Atla'nın açıklaması: aşamaya göre ne olacağını söyler. İlk ziyarette görünür (hints), sonra yalnızca
// ekran okuyucuya (aria-describedby) ve fareyle üstüne gelene (title) kalır.
const SKIP_COPY = {
  focus: 'Atla: molaya geç. Geçen dakikalar sayılır.',
  break: 'Atla: molayı bitir, odağa dön.',
}

const LOCK_MS = 3200

// Halkalı pomodoro sayacı. timer: usePomodoro() dönüşü. compact: odak modunda yalnızca halka ve tek
// eylem kalır. hints: ilk ziyarette yardım satırları görünür. title / note: kartın üst satırı (oda
// panelinde gizli).
//
// Kısa notlar (sıfırlamayı / atlamayı geri alma, kilitli süre) kartın içinde yer açmaz; kartın altına
// yüzen bir şerit olarak biner, altındaki satırlar kaymaz.
export default function TimerCard({ timer, title = 'Sayaç', note, compact = false, showStats = true, hints = false, children }) {
  const isFocus = timer.phase === 'focus'
  const color = isFocus ? 'var(--timer)' : 'var(--break)'
  const offset = CIRC * (1 - timer.remaining / timer.total)
  const locked = !timer.fresh
  const { notice } = timer
  useSpaceToggle(timer.toggle)
  const skipNoteId = useId()
  const lockNoteId = useId()

  // Kilitli süreye basılınca görünen not; kendiliğinden kalkar.
  const [lockShown, setLockShown] = useState(0) // sayaç: her basışta yeni not (key)
  const lockTimer = useRef(0)
  useEffect(() => () => clearTimeout(lockTimer.current), [])
  const showLock = () => {
    clearTimeout(lockTimer.current)
    setLockShown((n) => n + 1)
    lockTimer.current = setTimeout(() => setLockShown(0), LOCK_MS)
  }
  const pickPreset = (p) => {
    if (timer.preset === p.id) return
    if (locked) return showLock()
    timer.setPreset(p.id)
  }

  const hold = {
    onPointerEnter: () => timer.holdNotice(true),
    onPointerLeave: () => timer.holdNotice(false),
    onFocus: () => timer.holdNotice(true),
    onBlur: () => timer.holdNotice(false),
  }
  const skipNote = isFocus ? SKIP_COPY.focus : SKIP_COPY.break

  return (
    <div className="timer-card">
      <div className="timer-card__head">
        <span className="timer-card__title">{title}</span>
        <span className="site-muted">{note ?? (timer.running ? 'Sayaç çalışıyor' : `${timer.presetInfo.focus} dk odak · ${timer.presetInfo.break} dk mola`)}</span>
      </div>

      {/* data-state: run (çalışıyor; başlarken bir kez nabız), paused (halka söner), idle */}
      <div className="timer-ring" data-state={timer.running ? 'run' : timer.fresh ? 'idle' : 'paused'}>
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
          <span className="timer-ring__phase" style={{ color: isFocus ? 'var(--timer-ink, var(--timer))' : color }}>
            {isFocus ? TIMER_COPY.focus : TIMER_COPY.break}
          </span>
          <span className="timer-ring__clock" role="timer" aria-live="off">
            {formatClock(timer.remaining)}
          </span>
        </div>
      </div>

      {/* Saniyeler duyurulmaz; yalnızca aşama değişimi, sıfırlama ve kilit notu. */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {lockShown ? TIMER_COPY.lock : timer.announcement?.text}
      </span>

      <button type="button" className="site-btn site-btn--primary site-btn--wide timer-card__main" onClick={timer.toggle} aria-keyshortcuts="Space">
        {timer.running ? TIMER_COPY.pause : timer.fresh ? TIMER_COPY.start : TIMER_COPY.resume}
      </button>

      {!compact && (
        <div className="timer-card__quiet">
          <span className="timer-card__ctl">
            <button type="button" className="quiet-btn" onClick={timer.reset}>
              {TIMER_COPY.reset}
            </button>
            <button type="button" className="quiet-btn" onClick={timer.skip} aria-describedby={skipNoteId} title={hints ? undefined : skipNote}>
              {TIMER_COPY.skip}
            </button>
          </span>
          {/* Seans sürerken diğer süreler kilitli: basılabilir kalır, basınca nedeni kartın üstünde yazar. */}
          <span className="segmented timer-card__presets" role="group" aria-label={TIMER_COPY.presets} aria-describedby={locked ? lockNoteId : undefined}>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={timer.preset === p.id}
                aria-disabled={locked && timer.preset !== p.id ? true : undefined}
                onClick={() => pickPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </span>
        </div>
      )}
      {!compact && (
        <p id={skipNoteId} className={hints ? 'timer-card__note' : 'sr-only'}>
          {skipNote}
        </p>
      )}
      <p id={lockNoteId} className="sr-only">
        {TIMER_COPY.lock}
      </p>

      {!compact && showStats && (
        <p className="timer-card__stats">
          Bugün <strong>{timer.stats.pomodoros}</strong> pomodoro · <strong>{formatMinutes(timer.stats.minutes)}</strong> odak
          {timer.gain && (
            <span key={timer.gain.id} className="timer-card__gain" aria-hidden="true">
              {TIMER_COPY.gain(timer.gain.minutes)}
            </span>
          )}
        </p>
      )}

      {/* yüzen not: geri alma önce gelir; kilit notu ancak başka not yokken */}
      {notice ? (
        <div className="timer-toast" key={notice.id} {...hold}>
          <span>{notice.text}</span>
          {notice.undo ? (
            <button type="button" className="link-btn timer-toast__btn" onClick={notice.undo}>
              {TIMER_COPY.undo}
            </button>
          ) : (
            <button type="button" className="link-btn timer-toast__btn" onClick={timer.dismissNotice}>
              {TIMER_COPY.ok}
            </button>
          )}
        </div>
      ) : (
        lockShown > 0 && (
          <div className="timer-toast" key={lockShown} aria-hidden="true">
            <span>{TIMER_COPY.lock}</span>
          </div>
        )
      )}
      {children}
    </div>
  )
}
