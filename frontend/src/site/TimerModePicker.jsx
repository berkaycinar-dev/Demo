import TimerCard from './TimerCard'
import StopwatchCard from './StopwatchCard'

// Sayaç türü seçimi (iki kutu) ve seçili türün kartı: Odam ve çok kişili odalar aynı parçayı kullanır.
const MODE_COPY = {
  group: 'Sayaç türü',
  pomodoro: 'Pomodoro',
  stopwatch: 'Kronometre',
}

const PomodoroIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
    <path d="M12 8v4l2.5 2.5" />
  </svg>
)

const StopwatchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="14" r="8" />
    <path d="M12 14V10M10 2h4M12 2v4M19 7l1.5-1.5" />
  </svg>
)

/** Yan yana iki kutu: Pomodoro / Kronometre. */
export function TimerModePicker({ mode, onPick }) {
  return (
    <div className="timer-mode" role="group" aria-label={MODE_COPY.group}>
      <button type="button" className="timer-mode__opt" aria-pressed={mode === 'pomodoro'} onClick={() => onPick('pomodoro')}>
        <PomodoroIcon />
        <span className="timer-mode__text">
          <span className="timer-mode__name">{MODE_COPY.pomodoro}</span>
        </span>
      </button>
      <button type="button" className="timer-mode__opt" aria-pressed={mode === 'stopwatch'} onClick={() => onPick('stopwatch')}>
        <StopwatchIcon />
        <span className="timer-mode__text">
          <span className="timer-mode__name">{MODE_COPY.stopwatch}</span>
        </span>
      </button>
    </div>
  )
}

/** Seçili türün kartı: pomodoro sayacı ya da kronometre. compact: odak modunda yalnızca halka ve tek eylem. */
export function TimerArea({ mode, timer, stopwatch, compact = false, hints = false }) {
  return mode === 'stopwatch' ? (
    <StopwatchCard stopwatch={stopwatch} stats={timer.stats} compact={compact} />
  ) : (
    <TimerCard timer={timer} title="Odak sayacı" compact={compact} hints={hints} />
  )
}
