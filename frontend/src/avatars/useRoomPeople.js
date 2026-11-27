import { useCallback, useEffect, useMemo, useState } from 'react'
import { seededRandom } from '../rooms/core/voxel'
import { randomAvatar, sanitizeAvatar } from './options'

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

// Bir oda kimliğinden sabit tohum: aynı oda her açılışta aynı oda arkadaşlarıyla dolar.
export const roomSeed = (id) => [...String(id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100000, 17)

// Odanın simüle edilmiş oda arkadaşları (koltuk sırası, ad, avatar): tohumdan sabit üretilir, saf.
// useRoomPeople bunları kullanır; lobi kartı da aynı kişileri gösterir (odaya girince aynı yüzler).
export function roomBots(capacity, seed) {
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
}

// Sen girdiğinde odada seninle oturacak kişiler (ilk koltuk senin): lobi kartındaki yüzler.
export const roomMates = (capacity, seed) => roomBots(capacity, seed).slice(1)

/**
 * Bir odadaki kişiler: kendin (me verilirse) ve koltukları dolduran simüle edilmiş oda arkadaşları.
 * Oda arkadaşlarının durumu kendi kendine değişir (odak, mola, uzakta). forced verilirse herkes o
 * durumdadır ve kendi kendine değişmez (ekran görüntüsü, deneme). Dönüş: { occupants, setMyStatus }.
 * setMyStatus(status, spot?): kendi durumunu değiştirir; molada spot verilirse o mola noktasına gider.
 * cheer: kendi avatarının sevinme sayacı (usePomodoro completed); artınca avatar yerinde kollarını
 * kaldırıp sevinir, sonra molaya kalkar.
 * myAvoid: kendi avatarının gitmeyeceği mola yerleri (sunucu dolu dedi); kalabalık başka yer seçer.
 * mySeat: sunucunun sana verdiği koltuk numarası (people ile birlikte; bilinmiyorsa null).
 * myPlace: sunucunun molada sana verdiği yer ({ spot, slot } | null); avatarın oraya geçer.
 */
export default function useRoomPeople({ capacity, seed = 1, me = null, forced = null, cheer = 0, people = null, myAvoid = null, mySeat = null, myPlace = null }) {
  const simulated = useMemo(() => roomBots(capacity, seed), [capacity, seed])
  // people verilirse (sunucudaki gerçek oda arkadaşları: [{ id, name, avatar?, seat?, joinedAt?, presence? }])
  // simüle kişilerin yerine onlar oturur. Koltuk sunucunun verdiği numaradır: n. numara, oda tohumundan
  // karılmış koltuk sırasının n. koltuğu; tohum herkeste aynı olduğu için herkes kişiyi aynı masada görür.
  // Avatar kişinin kaydettiği avatardır; hiç kaydetmediyse kimlikten sabit üretilir. Durumları uydurulmaz,
  // sunucudan gelir (presence: { status: 'idle' | 'focus' | 'break' | 'away', spot, slot, since }); gelmezse masada.
  const bots = useMemo(() => {
    if (!people) return simulated
    const order = simulated.map((b) => b.seat)
    const list = people.slice(0, Math.max(0, capacity - 1))
    // önce sunucunun verdiği koltuklar; numarası olmayan (eski oturum) ya da çakışan boş koltuğa
    const used = new Set()
    const serverSeat = (n) => (Number.isInteger(n) && n < order.length && !used.has(order[n]) ? order[n] : null)
    const mine = serverSeat(mySeat) ?? order.find((s) => !list.some((p) => Number.isInteger(p.seat) && order[p.seat] === s))
    used.add(mine)
    const seatsOf = list.map((p) => {
      const s = serverSeat(p.seat)
      if (s != null) used.add(s)
      return s
    })
    const free = () => {
      const s = order.find((x) => !used.has(x))
      used.add(s)
      return s
    }
    const real = list.map((p, i) => ({
      id: `user-${p.id}`,
      name: p.name,
      avatar: p.avatar ? sanitizeAvatar({ ...p.avatar, name: p.name }) : randomAvatar(seededRandom(roomSeed(p.id)), p.name),
      seat: seatsOf[i] ?? free(),
      rnd: seededRandom(roomSeed(p.id) * 31),
      real: true,
      // odaya giriş zamanı (ms; sunucunun startedAt değeri)
      joinedAt: p.joinedAt ?? null,
      presence: p.presence ?? null,
    }))
    return [{ ...simulated[0], seat: mine ?? simulated[0].seat }, ...real]
  }, [simulated, people, capacity, mySeat])

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
          if (b.real || !cur || now < cur.until) continue
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

  // Kendin bots[0]'ın koltuğunda (sunucunun verdiği ya da ilk koltuk), oda arkadaşları kendi koltuklarında.
  const occupants = useMemo(() => {
    const list = []
    let others = bots
    if (me) {
      const mySeatIndex = bots[0]?.seat ?? 0
      // sunucunun verdiği yer, seçtiğin köşeyle uyuşuyorsa (ya da köşe seçmediysen) geçerli
      const placed = mine.status === 'break' && myPlace && (!mine.spot || mine.spot === myPlace.spot) ? myPlace : null
      list.push({
        id: 'me',
        name: me.name,
        avatar: me,
        seat: mySeatIndex,
        me: true,
        ...mine,
        ...(placed ? { spot: placed.spot, slot: placed.slot } : null),
        status: forced ?? mine.status,
        avoid: myAvoid,
        cheer,
      })
      others = bots.slice(1)
    }
    for (const b of others) {
      if (b.real) {
        // sunucudaki durum: Masada (idle) avatarda odak pozudur, etikette "Masada"
        const p = b.presence ?? { status: 'focus' }
        const idle = p.status === 'idle'
        list.push({
          id: b.id,
          name: b.name,
          avatar: b.avatar,
          seat: b.seat,
          status: forced ?? (idle ? 'focus' : p.status),
          ...(idle && !forced ? { shown: 'idle' } : null),
          spot: p.status === 'break' ? (p.spot ?? null) : null,
          // köşedeki yer (sunucu verdi): herkes kişiyi o köşenin aynı yerinde görür
          slot: p.status === 'break' && p.spot != null && Number.isInteger(p.slot) ? p.slot : null,
          since: p.since ?? null,
          real: true,
          joinedAt: b.joinedAt ?? null,
        })
        continue
      }
      const s = status[b.id] ?? { status: 'focus' }
      list.push({ id: b.id, name: b.name, avatar: b.avatar, seat: b.seat, status: forced ?? s.status, since: s.since, real: false, joinedAt: null })
    }
    return list
  }, [bots, status, me, mine, forced, cheer, myAvoid, myPlace])

  return { occupants, setMyStatus, myStatus: mine.status }
}
