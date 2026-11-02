import { useCallback, useEffect, useMemo, useState } from 'react'
import { seededRandom } from '../rooms/core/voxel'
import { randomAvatar } from './options'

const NAMES = ['Zeynep', 'Mert', 'Deniz', 'Elif', 'Can', 'Ece', 'Kaan', 'Ayşe', 'Emre', 'Selin', 'Burak', 'İrem', 'Arda', 'Defne']
const STATUSES = ['focus', 'break', 'away']
// Durum olasılıkları ve süreleri (saniye): odak uzun, mola kısa.
const WEIGHTS = { focus: 0.6, break: 0.25, away: 0.15 }
const DURATION = { focus: [25, 60], break: [12, 25], away: [20, 45] }

function pickStatus(rnd, not) {
  let r = rnd() * (1 - (not ? WEIGHTS[not] : 0))
  for (const s of STATUSES) {
    if (s === not) continue
    r -= WEIGHTS[s]
    if (r <= 0) return s
  }
  return 'focus'
}

/**
 * Bir odadaki kişiler: kendin (me verilirse) ve koltukları dolduran simüle edilmiş oda arkadaşları.
 * Oda arkadaşlarının durumu kendi kendine değişir (odak, mola, uzakta). forced verilirse herkes o
 * durumdadır ve kendi kendine değişmez (ekran görüntüsü, deneme). Dönüş: { occupants, setMyStatus }.
 * setMyStatus(status, spot?): kendi durumunu değiştirir; molada spot verilirse o mola noktasına gider.
 */
export default function useRoomPeople({ capacity, seed = 1, me = null, forced = null }) {
  const bots = useMemo(() => {
    const rnd = seededRandom(seed)
    const seats = Array.from({ length: capacity }, (_, i) => i)
    for (let i = seats.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[seats[i], seats[j]] = [seats[j], seats[i]]
    }
    const names = [...NAMES].sort(() => rnd() - 0.5)
    return seats.map((seat, i) => ({
      id: `bot-${seed}-${i}`,
      name: names[i % names.length],
      avatar: randomAvatar(rnd, names[i % names.length]),
      seat,
      rnd: seededRandom(seed * 31 + i),
    }))
  }, [capacity, seed])

  const [status, setStatus] = useState(() => {
    const now = Date.now()
    return Object.fromEntries(
      bots.map((b) => {
        const s = forced ?? pickStatus(b.rnd)
        return [b.id, { status: s, until: now + (2 + b.rnd() * 10) * 1000, since: s === 'away' ? now - b.rnd() * 20 * 60000 : null }]
      }),
    )
  })
  const [mine, setMine] = useState({ status: forced ?? 'focus', spot: null, since: null })

  useEffect(() => {
    if (forced) return undefined
    const id = setInterval(() => {
      const now = Date.now()
      setStatus((prev) => {
        let next = prev
        for (const b of bots) {
          const cur = prev[b.id]
          if (!cur || now < cur.until) continue
          const s = pickStatus(b.rnd, cur.status)
          const [lo, hi] = DURATION[s]
          next = next === prev ? { ...prev } : next
          next[b.id] = { status: s, until: now + (lo + b.rnd() * (hi - lo)) * 1000, since: s === 'away' ? now : null }
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [bots, forced])

  const setMyStatus = useCallback((s, spot = null) => {
    setMine({ status: s, spot: s === 'break' ? spot : null, since: s === 'away' ? Date.now() : null })
  }, [])

  // Kendin ilk koltukta, oda arkadaşları kalan koltuklarda.
  const occupants = useMemo(() => {
    const list = []
    let others = bots
    if (me) {
      const mySeat = bots[0]?.seat ?? 0
      list.push({ id: 'me', name: me.name, avatar: me, seat: mySeat, me: true, ...mine, status: forced ?? mine.status })
      others = bots.slice(1)
    }
    for (const b of others) {
      const s = status[b.id] ?? { status: 'focus' }
      list.push({ id: b.id, name: b.name, avatar: b.avatar, seat: b.seat, status: forced ?? s.status, since: s.since })
    }
    return list
  }, [bots, status, me, mine, forced])

  return { occupants, setMyStatus, myStatus: mine.status }
}
