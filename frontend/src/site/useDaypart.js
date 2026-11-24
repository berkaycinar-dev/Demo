import { useEffect } from 'react'
import { timeOfDayForHour } from '../rooms/core/timeOfDay'

// Sitenin zemin ışığı gerçek saati izler: odalardaki "Otomatik" gün zamanıyla aynı kaynak
// (timeOfDayForHour), yani site odayla aynı saatte yaşar. <html data-daypart="day|evening|night">
// yalnızca sayfa zeminini ve üstteki ışık lekesini değiştirir (theme.css); kartlar ve yazı sabit kalır.
// Dakikada bir ve sekmeye dönünce yeniden bakılır; değer değişmedikçe DOM'a dokunulmaz.
export default function useDaypart() {
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const part = timeOfDayForHour(new Date().getHours())
      if (root.dataset.daypart !== part) root.dataset.daypart = part
    }
    apply()
    const id = setInterval(apply, 60_000)
    const onVisible = () => document.visibilityState === 'visible' && apply()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      delete root.dataset.daypart
    }
  }, [])
}
