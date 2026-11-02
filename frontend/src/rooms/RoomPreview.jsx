import { useEffect, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople from '../avatars/useRoomPeople'
import { TIME_MODES } from './core/timeOfDay'
import { LISTED_THEMES, THEMES } from './themes'
import './RoomPreview.css'

// Geliştirme önizlemesi. URL ile başlangıç ayarı: ?theme=cabin&c=4&t=night
// people: koltukları dolduran avatarlar (mix: durumlar kendi değişir; focus | break | away: herkes o
// durumda sabit; wave: herkes 12 saniyede bir birlikte molaya kalkıp geri oturur, kalabalık testi).
// names=1: herkesin adı görünür. Örnek: ?theme=library&c=8&people=mix
function readParams() {
  const params = new URLSearchParams(window.location.search)
  const theme = THEMES[params.get('theme')] ? params.get('theme') : 'library'
  const capacity = Number(params.get('c'))
  const time = params.get('t')
  return {
    theme,
    capacity: capacity >= 1 && capacity <= THEMES[theme].max ? capacity : 4,
    time: TIME_MODES.includes(time) ? time : 'auto',
    people: ['mix', 'focus', 'break', 'away', 'wave'].includes(params.get('people')) ? params.get('people') : null,
    names: params.get('names') === '1',
  }
}

// Önizlemedeki simüle edilmiş oda arkadaşları.
function PreviewPeople({ capacity, theme, mode, names }) {
  const [wave, setWave] = useState('focus')
  useEffect(() => {
    if (mode !== 'wave') return undefined
    const id = setInterval(() => setWave((w) => (w === 'focus' ? 'break' : 'focus')), 12000)
    return () => clearInterval(id)
  }, [mode])
  const forced = mode === 'mix' ? null : mode === 'wave' ? wave : mode
  const { occupants } = useRoomPeople({ capacity, seed: capacity, forced })
  return <AvatarCrowd occupants={occupants} theme={theme} showNames={names} />
}

export default function RoomPreview() {
  const [initial] = useState(readParams)
  const [theme, setTheme] = useState(initial.theme)
  const [capacity, setCapacity] = useState(initial.capacity)
  const [spot, setSpot] = useState(null)
  const { label, Room, max } = THEMES[theme]
  const capacities = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <main className="room-preview">
      <Room
        key={`${theme}-${capacity}`}
        capacity={capacity}
        defaultTimeOfDay={initial.time}
        onSpotClick={setSpot}
      >
        {initial.people && <PreviewPeople key={`${theme}-${capacity}`} capacity={capacity} theme={theme} mode={initial.people} names={initial.names} />}
      </Room>

      <section className="room-preview__panel" aria-label="Önizleme">
        <h2>Önizleme · Tema</h2>
        <div className="room-preview__segmented" role="group" aria-label="Tema">
          {LISTED_THEMES.map(([key, t]) => (
            <button
              key={key}
              type="button"
              aria-pressed={theme === key}
              onClick={() => {
                setTheme(key)
                setCapacity((c) => Math.min(c, t.max))
                setSpot(null)
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <h2 className="room-preview__heading">Kapasite</h2>
        <div className="room-preview__segmented" role="group" aria-label="Kapasite">
          {capacities.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={capacity === n}
              onClick={() => {
                setCapacity(n)
                setSpot(null)
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="room-preview__note">
          {label} · {capacity} kişilik oda
          {spot && <> · Seçilen nokta: {spot.label}</>}
        </p>
      </section>
    </main>
  )
}
