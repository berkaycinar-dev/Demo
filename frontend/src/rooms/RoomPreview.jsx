import { useState } from 'react'
import { CABIN_MAX_CAPACITY, CabinRoom } from './cabin'
import { TIME_MODES } from './core/timeOfDay'
import { LIBRARY_MAX_CAPACITY, LibraryRoom } from './library'
import './RoomPreview.css'

const THEMES = {
  library: { label: 'Kütüphane', Room: LibraryRoom, max: LIBRARY_MAX_CAPACITY },
  cabin: { label: 'Dağ Evi', Room: CabinRoom, max: CABIN_MAX_CAPACITY },
}

// Geliştirme önizlemesi. URL ile başlangıç ayarı: ?theme=cabin&c=4&t=night
function readParams() {
  const params = new URLSearchParams(window.location.search)
  const theme = THEMES[params.get('theme')] ? params.get('theme') : 'library'
  const capacity = Number(params.get('c'))
  const time = params.get('t')
  return {
    theme,
    capacity: capacity >= 1 && capacity <= THEMES[theme].max ? capacity : 4,
    time: TIME_MODES.includes(time) ? time : 'auto',
  }
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
      />

      <section className="room-preview__panel" aria-label="Önizleme">
        <h2>Önizleme · Tema</h2>
        <div className="room-preview__segmented" role="group" aria-label="Tema">
          {Object.entries(THEMES).map(([key, t]) => (
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
