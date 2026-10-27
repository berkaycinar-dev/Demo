import { useState } from 'react'
import { TIME_MODES } from './core/timeOfDay'
import { LIBRARY_MAX_CAPACITY, LibraryRoom } from './library'
import './RoomPreview.css'

// Geliştirme önizlemesi. URL ile başlangıç ayarı: ?c=4&t=night
function readParams() {
  const params = new URLSearchParams(window.location.search)
  const capacity = Number(params.get('c'))
  const time = params.get('t')
  return {
    capacity: capacity >= 1 && capacity <= LIBRARY_MAX_CAPACITY ? capacity : 4,
    time: TIME_MODES.includes(time) ? time : 'auto',
  }
}

const CAPACITIES = Array.from({ length: LIBRARY_MAX_CAPACITY }, (_, i) => i + 1)

export default function RoomPreview() {
  const [initial] = useState(readParams)
  const [capacity, setCapacity] = useState(initial.capacity)
  const [spot, setSpot] = useState(null)

  return (
    <main className="room-preview">
      <LibraryRoom
        key={capacity}
        capacity={capacity}
        defaultTimeOfDay={initial.time}
        onSpotClick={setSpot}
      />

      <section className="room-preview__panel" aria-label="Önizleme">
        <h2>Önizleme · Kapasite</h2>
        <div className="room-preview__segmented" role="group" aria-label="Kapasite">
          {CAPACITIES.map((n) => (
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
          Kütüphane · {capacity} kişilik oda
          {spot && <> · Seçilen nokta: {spot.label}</>}
        </p>
      </section>
    </main>
  )
}
