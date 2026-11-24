import { useMemo } from 'react'
import { roomMates, roomSeed } from '../avatars/useRoomPeople'
import AvatarPortrait from './AvatarPortrait'

// Kartta görünen yüz sayısı; fazlası "+N" ile söylenir.
const SHOWN = 5

// Metinler. Ad listesi ve sayı ayrı değişken; çeviride sıra değişebilir.
const MATES_COPY = {
  // ekran okuyucu: "Seninle çalışacaklar: Selin, Kaan, Ayşe"
  label: (names) => `Seninle çalışacaklar: ${names}`,
  more: (n) => `+${n}`,
  join: ', ',
}

// Oda kartındaki küçük voxel büst sırası: odaya girince masalarda göreceğin kişiler (odanın içindeki
// oda arkadaşlarıyla aynı yüzler, aynı tohumdan). Sayı ya da "şu an çevrimiçi" iddiası taşımaz;
// yalnızca odanın boş olmadığını gösterir. Tek kişilik odada hiçbir şey çizmez.
export default function RoomMates({ room, className = '' }) {
  const mates = useMemo(() => roomMates(room.capacity, roomSeed(room.id)), [room.capacity, room.id])
  if (mates.length === 0) return null
  const shown = mates.slice(0, SHOWN)
  const rest = mates.length - shown.length
  return (
    <p className={`room-mates ${className}`}>
      <span className="sr-only">{MATES_COPY.label(mates.map((m) => m.name).join(MATES_COPY.join))}</span>
      <span className="room-mates__faces" aria-hidden="true">
        {shown.map((m) => (
          <span key={m.id} className="room-mates__face" title={m.name}>
            <AvatarPortrait avatar={m.avatar} size={24} />
          </span>
        ))}
        {rest > 0 && <span className="room-mates__more">{MATES_COPY.more(rest)}</span>}
      </span>
    </p>
  )
}
