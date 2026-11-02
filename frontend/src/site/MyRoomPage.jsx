import { useEffect, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople from '../avatars/useRoomPeople'
import { THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'

const MY_STATUSES = [
  { id: 'focus', label: 'Odakta' },
  { id: 'break', label: 'Molada' },
  { id: 'away', label: 'Uzakta' },
]

const STATUS_LABELS = Object.fromEntries(MY_STATUSES.map((s) => [s.id, s.label]))

// Şimdiki zaman; every ms'de bir yenilenir (listede uzaktaki dakikası).
function useClock(every) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(id)
  }, [every])
  return now
}

const seedOf = (id) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100000, 17)

// Odam: girilen oda tam boyutta; senin avatarın ve koltukları dolduran oda arkadaşları. Oda yoksa
// lobiye yönlendirir.
export default function MyRoomPage({ room, avatar, onLeave, onBrowse }) {
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
  return <RoomView key={room.id} room={room} avatar={avatar} onLeave={onLeave} />
}

// Durum düğmeleri: Molada'ya basınca en yakın boş mola yerine yürürsün; zemindeki bir halkaya
// tıklayınca o mola yerine gidersin (doluysa sıradakine). Avatarların üstünde yalnızca durum
// noktası durur (kalabalıkta isimler üst üste binmesin); isimler odanın altındaki listede. Listede
// bir kişinin üstüne gelince odadaki avatarının adı açılır; "İsimler" herkesinkini açar.
function RoomView({ room, avatar, onLeave }) {
  const [spot, setSpot] = useState(null)
  const [names, setNames] = useState(false)
  const [picked, setPicked] = useState(null)
  const now = useClock(30000)
  const { label, Room } = THEMES[room.theme]
  const { occupants, setMyStatus, myStatus } = useRoomPeople({ capacity: room.capacity, seed: seedOf(room.id), me: avatar })

  return (
    <section>
      <div className="myroom__header">
        <div>
          <h1>{room.name}</h1>
          <p className="site-muted">
            {label} · {room.capacity} kişilik · {ACCESS_LABELS[room.access]}
            {spot && <> · Mola yeri: {spot.label}</>}
          </p>
        </div>
        <div className="site-actions">
          <div className="choice-row" role="group" aria-label="Durumun">
            {MY_STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={myStatus === s.id}
                onClick={() => {
                  setMyStatus(s.id)
                  if (s.id !== 'break') setSpot(null)
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="choice-row">
            <button type="button" aria-pressed={names} onClick={() => setNames((v) => !v)}>
              İsimler
            </button>
          </div>
          <button type="button" className="site-btn" onClick={onLeave}>
            Odadan çık
          </button>
        </div>
      </div>
      <div className="room-frame myroom__room">
        <Room
          capacity={room.capacity}
          onSpotClick={(s) => {
            setSpot(s)
            setMyStatus('break', s.id)
          }}
        >
          <AvatarCrowd occupants={occupants} theme={room.theme} showNames={names} highlight={picked} />
        </Room>
      </div>
      <ul className="roster" aria-label="Odadakiler">
        {occupants.map((o) => (
          <li
            key={o.id}
            className={`roster__item roster__item--${o.status}`}
            onPointerEnter={() => setPicked(o.id)}
            onPointerLeave={() => setPicked(null)}
          >
            <span className="roster__dot" aria-hidden="true" />
            {o.me ? 'Sen' : o.name}
            <span className="site-muted">
              {STATUS_LABELS[o.status]}
              {o.status === 'away' && o.since && now - o.since >= 60000 ? ` · ${Math.floor((now - o.since) / 60000)} dk` : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
