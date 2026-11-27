import { localDay } from './usePomodoro'

// Pazartesiden pazara bu hafta: her gün { key, short, long, minutes, today, future } ve geçen haftanın
// bugüne kadarki aynı günlerinin toplamı (karşılaştırma bu haftanın tamamı yerine bugüne kadarına yapılır).
// history: usePomodoro'nun gün gün geçmişi.
export function weekOf(history, now = new Date()) {
  const todayIndex = (now.getDay() + 6) % 7
  const dayAt = (offset) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayIndex + offset)
  const minutesOf = (d) => history[localDay(d)]?.minutes ?? 0
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = dayAt(i)
    return {
      key: localDay(d),
      short: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
      long: d.toLocaleDateString('tr-TR', { weekday: 'long' }),
      minutes: minutesOf(d),
      today: i === todayIndex,
      future: i > todayIndex,
    }
  })
  let lastSpan = 0
  for (let i = 0; i <= todayIndex; i++) lastSpan += minutesOf(dayAt(i - 7))
  const start = dayAt(0)
  const end = dayAt(6)
  const sameMonth = start.getMonth() === end.getMonth()
  const range = `${start.toLocaleDateString('tr-TR', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`
  const pomodoros = days.reduce((n, d) => n + (history[d.key]?.pomodoros ?? 0), 0)
  return { days, total: days.reduce((n, d) => n + d.minutes, 0), pomodoros, lastSpan, range }
}
