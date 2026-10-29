import { useState } from 'react'
import { THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'

// Odam: girilen oda tam boyutta. Oda yoksa lobiye yönlendirir.
export default function MyRoomPage({ room, onLeave, onBrowse }) {
  const [spot, setSpot] = useState(null)

  if (!room) {
    return (
      <section>
        <h1>Odam</h1>
        <p className="site-muted">Henüz bir odaya girmedin.</p>
        <button type="button" className="site-btn" onClick={onBrowse}>
          Odalara göz at
        </button>
      </section>
    )
  }

  const { label, Room } = THEMES[room.theme]
  return (
    <section>
      <div className="myroom__header">
        <div>
          <h1>{room.name}</h1>
          <p className="site-muted">
            {label} · {room.capacity} kişilik · {ACCESS_LABELS[room.access]}
            {spot && <> · Seçilen nokta: {spot.label}</>}
          </p>
        </div>
        <button type="button" className="site-btn" onClick={onLeave}>
          Odadan çık
        </button>
      </div>
      <div className="room-frame myroom__room">
        <Room key={room.id} capacity={room.capacity} onSpotClick={setSpot} />
      </div>
    </section>
  )
}
