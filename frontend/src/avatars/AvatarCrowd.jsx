import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, Color, Euler, Matrix4, Quaternion, Sphere, Vector3 } from 'three'
import { FLAT_PLANE, getGlowTexture } from '../rooms/core/glow'
import { useRoom } from '../rooms/core/roomContext'
import { roomProps, seatBehavior, spotActivity, styleOf } from './activities'
import { buildAvatarParts } from './model'
import { BODY, RADIUS, buildNav, deskHeight, deskInfo, findPath, findRefuge, floorAt, nearestWalkable, seatExit, seatFront, spotSlots, walkableAt } from './nav'
import {
  GESTURES,
  STAND_POSES,
  blendPose,
  deskReadPose,
  gesturePose,
  liePose,
  loungePose,
  readPose,
  runPose,
  sitPose,
  sleepDeskPose,
  sleepLeanPose,
  smooth,
  standPose,
  tapPose,
  thinkPose,
  typePose,
  vrPose,
  walkPose,
  writePose,
} from './poses'
import { computeBones, createBoneMatrices, headTop, hideParts, transformBones, writeParts } from './render'
import './AvatarCrowd.css'

const BOX = new BoxGeometry()
const WALK_SPEED = 0.95
const TURN_SPEED = 9
const STAND_UP_TIME = 0.7
const TENT_TIME = 0.9
// Yürüyüş adımı: metre başına bacak salınımı (radyan).
const STRIDE = 8.2
// Yürürken kare hızı; boştaki hareketleri temanın kendi zamanlayıcısı (12 fps) çizer.
const MOVE_FPS = 30
// Yürüyen iki avatarın merkezleri arasında bırakılan en küçük mesafe.
const MIN_GAP = 0.5
// Duran birinin yanından geçerken bırakılan mesafe; yol bulucunun bıraktığıyla aynı (biraz pay).
const PASS_GAP = BODY + RADIUS - 0.02
// Kenara çekilen, karşıdan gelenin yolundan bu kadar uzakta durur.
const YIELD_CLEAR = BODY + RADIUS + 0.08
// Yol veren bu kadar bekledikten sonra öncelikli olan da kenara çekilmeyi dener.
const HEAD_ON_PATIENCE = 1.2
// Molada bu kadar ilerleyemeyen başka bir mola yeri seçer; bundan da uzun kalırsa (çok nadir)
// diğerlerini yok sayarak yürür ki hiçbir zaman sonsuza dek kilitlenmesin.
const SWITCH_AFTER = 6
const FORCE_AFTER = 15
const TENT_CAPACITY = 3
const ZZZ_PER_AVATAR = 3
const STATUS_LABELS = { focus: 'Odakta', break: 'Molada', away: 'Uzakta' }

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
const angleTo = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from))
const lerp = (a, b, k) => a + (b - a) * k
const frac = (v) => v - Math.floor(v)
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

const matrix = new Matrix4()
const swingM = new Matrix4()
const tmpM = new Matrix4()
const quat = new Quaternion()
const euler = new Euler()
const pos = new Vector3()
const scl = new Vector3()
const head = new Vector3()
const axis = new Vector3()
const zm = new Matrix4()

// Z harfi: üst çubuk, çapraz, alt çubuk (harfin kendi düzleminde).
const Z_PARTS = [
  new Matrix4().compose(new Vector3(0, 0.05, 0), new Quaternion(), new Vector3(0.12, 0.024, 0.02)),
  new Matrix4().compose(new Vector3(0, 0, 0), new Quaternion().setFromEuler(new Euler(0, 0, 0.72)), new Vector3(0.15, 0.022, 0.02)),
  new Matrix4().compose(new Vector3(0, -0.05, 0), new Quaternion(), new Vector3(0.12, 0.024, 0.02)),
]
const HIDDEN = new Matrix4().makeScale(0, 0, 0)

/**
 * Odadaki avatarlar. Oda bileşeninin çocuğu olarak kullanılır; koltukları, mola noktalarını ve
 * yürünebilir alanı odanın kendisinden (useRoom) okur.
 *
 * occupants: [{ id, name, avatar, status: 'focus' | 'break' | 'away', seat, spot?, me?, since? }]
 *   seat: koltuk indeksi (her kişiye ayrı), spot: molada gidilmek istenen mola noktası kimliği,
 *   since: uzakta olunan zamanın başlangıcı (ms; açık etikette dakika olarak görünür).
 * theme: tema anahtarı (rooms/themes.js); çalışma, uyuma ve mola hareketleri buna ve oturulan
 *   yere göre seçilir (activities.js).
 * showNames: true iken herkesin adı görünür; değilse yalnızca durum noktası, kendi adın ve
 *   üstüne gelinen ya da highlight verilen kişinin adı.
 * reducedMotion: true iken yürümez, kalkıp oturmaz; yerine ışınlanır, hareketler durur.
 *
 * Odakta ve uzakta olanlar koltuklarında oturur (kampta uzaktakiler çadıra girip uyur). Molada olan
 * kalkar, en yakın boş mola yerine yürür ve oradaki eşyaya göre davranır (koltuğa oturur, kahve
 * içer, bilardo oynar...). Her mola yerinde en fazla iki kişi olur, dolu yerin yerine sıradakine
 * gidilir. Yürürken kimseye 0.5 m'den fazla yaklaşılmaz: önü kesilen bekler, karşı karşıya gelinirse
 * sırası sonra olan kenara çekilip yol verir, duran birinin etrafından dolaşılır.
 */
export default function AvatarCrowd({ occupants, theme, showNames = false, highlight = null, reducedMotion }) {
  const room = useRoom()
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)
  const animated = !(reducedMotion ?? prefersReducedMotion())

  const world = useMemo(() => {
    const nav = buildNav(room)
    const exits = []
    const seats = room.seats.map((s) => {
      const exit = seatExit(nav, s, exits)
      if (exit) exits.push(exit)
      const top = deskHeight(nav, s)
      const shape = top == null ? null : deskInfo(nav, s)
      return { ...s, exit, home: true, behavior: seatBehavior(theme, s, top == null ? null : top - s.position[1], shape, seatFront(nav, s)) }
    })
    const spots = room.spots.map((s) => {
      const activity = spotActivity(theme, s.id)
      // oturulan kullanım noktalarına oturak tabanının ön kenarı (baldırlar tabana girmesin)
      const slots = spotSlots(nav, s, { near: activity.near, face: activity.face }).map((sl) =>
        sl.station?.kind === 'sit' ? { ...sl, station: { ...sl.station, front: seatFront(nav, sl.station) } } : sl,
      )
      return { ...s, activity, slots }
    })
    const beds = (room.beds ?? [])
      .map((b) => {
        const door = walkableAt(nav, b.door[0], b.door[2]) ? [b.door[0], b.door[2]] : nearestWalkable(nav, b.door[0], b.door[2], 5)
        return door && { door, inside: [b.inside[0], b.inside[2]], top: b.top }
      })
      .filter(Boolean)
    return { nav, seats, spots, beds, style: styleOf(theme), props: roomProps(theme, seats, spots) }
  }, [room, theme])

  // Görünüş yalnızca kişiler ya da kıyafetleri değişince yeniden kurulur; durum değişimi kurmaz.
  const looksKey = JSON.stringify(occupants.map((o) => [o.id, o.avatar]))
  const looks = useMemo(() => {
    const list = JSON.parse(looksKey).map(([id, avatar]) => ({ id, parts: buildAvatarParts(avatar, { props: world.props, seed: seedOf(id) }), start: 0 }))
    for (let i = 1; i < list.length; i++) list[i].start = list[i - 1].start + list[i - 1].parts.length
    return list
  }, [looksKey, world])
  const partCount = looks.reduce((s, l) => s + l.parts.length, 0)

  const meshRef = useRef(null)
  const zzzRef = useRef(null)
  const shadowRef = useRef(null)
  const latest = useRef({ occupants, showNames, highlight })
  const sim = useRef({ agents: new Map(), slots: new Map(), beds: new Map(), moving: false, labels: null, hoverMesh: null, hoverLabel: null })

  useEffect(() => {
    latest.current = { occupants, showNames, highlight }
    invalidate()
  }, [occupants, showNames, highlight, invalidate])

  // Geliştirmede simülasyon durumu denetim betikleri için açılır.
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    window.__avatarSim = sim.current
    window.__avatarWorld = world
    return () => {
      delete window.__avatarSim
      delete window.__avatarWorld
    }
  }, [world])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const color = new Color()
    for (const look of looks) look.parts.forEach((p, i) => mesh.setColorAt(look.start + i, color.set(p.color)))
    mesh.instanceColor.needsUpdate = true
    // üstüne gelme testi için sınır küresi bütün odayı kapsar (avatarlar yürüdükçe eskimesin)
    const [x0, y0, z0] = room.bounds.min
    const [x1, y1, z1] = room.bounds.max
    const min = new Vector3(x0, y0, z0)
    const max = new Vector3(x1, y1, z1)
    mesh.boundingSphere = new Sphere(min.clone().add(max).multiplyScalar(0.5), min.distanceTo(max) / 2)
    invalidate()
  }, [looks, room, invalidate])

  // Etiketler: tuvalin üstünde DOM katmanı; konumları her karede güncellenir. Üstüne gelinen
  // etiket adını gösterir.
  useEffect(() => {
    const host = gl.domElement.parentElement
    const layer = document.createElement('div')
    layer.className = 'avatar-labels'
    host.appendChild(layer)
    const state = sim.current
    state.labels = { layer, items: new Map() }
    // etiketten çıkarken girilen öğe (relatedTarget) başka bir etiketse onunki açılır
    const hover = (e) => {
      const el = e.type === 'pointerout' ? e.relatedTarget : e.target
      const id = el?.closest?.('.avatar-label')?.dataset.id ?? null
      if (state.hoverLabel !== id) {
        state.hoverLabel = id
        invalidate()
      }
    }
    layer.addEventListener('pointerover', hover)
    layer.addEventListener('pointerout', hover)
    return () => {
      layer.remove()
      state.labels = null
    }
  }, [gl, invalidate])

  // Yürüyen varken saniyede 30 kare iste.
  useEffect(() => {
    if (!animated) return undefined
    const id = setInterval(() => sim.current.moving && invalidate(), 1000 / MOVE_FPS)
    return () => clearInterval(id)
  }, [animated, invalidate])

  useFrame(({ clock, camera, size }, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const state = sim.current
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.1)
    state.t = t
    const { occupants: people, showNames: names, highlight: picked } = latest.current
    const agents = state.agents

    // kişileri eşitle: yeni gelen oturur ya da doğrudan yerinde başlar, ayrılanın yeri boşalır
    const ids = new Set(people.map((o) => o.id))
    for (const [id, a] of agents) {
      if (!ids.has(id)) {
        release(state, a)
        agents.delete(id)
        state.labels?.items.get(id)?.remove()
        state.labels?.items.delete(id)
      }
    }
    people.forEach((o, order) => {
      let a = agents.get(o.id)
      if (!a) {
        a = createAgent(o, world, order)
        agents.set(o.id, a)
        snap(state, world, a)
        a.lastStatus = o.status
      }
      a.order = order
      a.occ = o
      // sevinç sayacı arttıysa (odak bloku bitti): yerinde sevinir, kalkışı sevinç bitene dek bekler
      if (a.cheerKey !== o.cheer) {
        if (a.cheerKey !== undefined && o.cheer && animated) {
          a.cheer = { start: t }
          a.holdUntil = t + GESTURES.cheer
        }
        a.cheerKey = o.cheer
      }
    })

    let moving = false
    for (const a of agents.values()) {
      if (animated) step(state, world, a, t, dt)
      else snap(state, world, a)
      if (!RESTING.has(a.mode) || a.cheer) moving = true
    }
    state.moving = moving

    // çizim; etiketler bu karenin kamerasıyla izdüşülür (kamera bu karede döndüyse matrisi henüz eski)
    camera.updateMatrixWorld()
    const camYaw = Math.atan2(camera.position.x - room.bounds.max[0] / 2, camera.position.z - room.bounds.max[2] / 2)
    let z = 0
    let s = 0
    for (const look of looks) {
      const a = agents.get(look.id)
      if (!a) continue
      const hidden = a.mode === 'inside'
      let target = targetPose(a, t)
      if (a.cheer) {
        const e = t - a.cheer.start
        if (e >= GESTURES.cheer) a.cheer = null
        else target = gesturePose(target, 'cheer', e)
      }
      a.pose = a.pose ? blendPose(a.pose, target, animated ? 1 - Math.exp(-dt * 12) : 1) : target
      if (a.trans) a.pose = blendPose(a.trans.fromPose, target, smooth(a.trans.k))
      computeBones(a.bones, a.pose, a.x, a.z, a.yaw, a.y, a.scale)
      const swing = a.mode === 'seated' ? a.on?.swing : null
      if (swing && animated) {
        const angle = swing.amp * Math.sin(Math.PI * 2 * (t / swing.period + swing.phase))
        const [px, py, pz] = swing.pivot
        swingM.makeTranslation(px, py, pz).multiply(tmpM.makeRotationAxis(axis.fromArray(swing.axis).normalize(), angle)).multiply(matrix.makeTranslation(-px, -py, -pz))
        transformBones(a.bones, swingM)
      }
      if (hidden) hideParts(mesh, look.start, look.parts.length)
      else writeParts(mesh, look.start, look.parts, a.bones, a.pose.show)
      if (hidden) head.set(a.bed.top[0], a.bed.top[1] - 0.25, a.bed.top[2])
      else headTop(a.bones, head, look.parts.crown)

      // zZz: uyuyanın (ya da çadırın) üstünde yükselip kaybolan üç Z
      const sleeping = hidden || (a.mode === 'seated' && a.on?.home && a.occ.status === 'away')
      for (let k = 0; k < ZZZ_PER_AVATAR; k++) {
        if (!sleeping) {
          for (let p = 0; p < 3; p++) zzzRef.current.setMatrixAt(z++, HIDDEN)
          continue
        }
        const life = animated ? (t * 0.32 + k / ZZZ_PER_AVATAR + a.seed) % 1 : (k + 0.5) / ZZZ_PER_AVATAR
        const fade = Math.min(1, life / 0.15, (1 - life) / 0.25)
        const size = (0.6 + 0.45 * life) * Math.max(fade, 0.001)
        pos.set(head.x + 0.1 + 0.16 * life, head.y + 0.05 + 0.5 * life, head.z + 0.05 * Math.sin(life * 6))
        quat.setFromEuler(euler.set(0, camYaw, 0))
        const base = matrix.compose(pos, quat, scl.setScalar(size))
        for (const part of Z_PARTS) zzzRef.current.setMatrixAt(z++, zm.multiplyMatrices(base, part))
      }
      // gölge zeminin (halı, kilim) 5 mm üstünde: yüzeyle aynı düzleme düşmesin
      const shadow = hidden ? 0 : 0.7 * a.scale
      const ground = a.y > 0 ? a.y : floorAt(world.nav, a.x, a.z)
      shadowRef.current.setMatrixAt(s++, matrix.compose(pos.set(a.x, ground + 0.005, a.z), quat.identity(), scl.set(shadow, 1, shadow)))
      const open = names || a.occ.me || state.hoverMesh === a.id || state.hoverLabel === a.id || picked === a.id
      updateLabel(state, a, head, camera, size, open)
    }
    spreadLabels(state)
    mesh.instanceMatrix.needsUpdate = true
    zzzRef.current.instanceMatrix.needsUpdate = true
    shadowRef.current.instanceMatrix.needsUpdate = true
  })

  if (!looks.length) return null
  // Avatarın üstüne gelince adı görünür.
  const hoverMesh = (id) => {
    if (sim.current.hoverMesh !== id) {
      sim.current.hoverMesh = id
      invalidate()
    }
  }
  const pointAt = (e) => hoverMesh(looks.find((l) => e.instanceId >= l.start && e.instanceId < l.start + l.parts.length)?.id ?? null)
  return (
    <>
      <instancedMesh ref={meshRef} args={[BOX, undefined, partCount]} frustumCulled={false} onPointerMove={pointAt} onPointerOut={() => hoverMesh(null)}>
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={zzzRef} args={[BOX, undefined, looks.length * ZZZ_PER_AVATAR * 3]} frustumCulled={false} raycast={() => null}>
        <meshBasicMaterial color="#e6eeff" />
      </instancedMesh>
      <instancedMesh ref={shadowRef} args={[FLAT_PLANE, undefined, looks.length]} frustumCulled={false} renderOrder={1} raycast={() => null}>
        <meshBasicMaterial map={getGlowTexture()} color="#000000" transparent opacity={0.3} depthWrite={false} />
      </instancedMesh>
    </>
  )
}

// ---------------------------------------------------------------- simülasyon
//
// Modlar: seated (koltukta ya da mola yerindeki oturakta: a.on), rising / sitting (kalkma ve
// oturma geçişi), walking, waiting, idle (mola yerinde ayakta), entering / inside / leaving
// (çadıra girme, içinde uyuma, çıkma). Hedef (a.target): { kind: 'seat' } kendi koltuğu,
// { kind: 'slot', ... } mola yeri, { kind: 'bed', ... } çadır.

const RESTING = new Set(['seated', 'idle', 'inside'])
const seedOf = (id) => ([...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) / 97) % 10

function createAgent(o, world, order) {
  const seat = world.seats[o.seat] ?? world.seats[0]
  return {
    id: o.id,
    order,
    occ: o,
    seat,
    on: seat,
    x: seat.position[0],
    z: seat.position[2],
    y: 0,
    yaw: seat.yaw,
    scale: 1,
    mode: 'seated',
    target: { kind: 'seat' },
    bed: null,
    path: null,
    pathI: 0,
    detour: false,
    dirX: 0,
    dirZ: 0,
    phase: 0,
    trans: null,
    pose: null,
    seed: seedOf(o.id),
    nextTry: 0,
    lastStatus: null,
    departAt: 0,
    nextReplan: 0,
    waitUntil: 0,
    waitedSince: 0,
    waitX: 0,
    waitZ: 0,
    headOnSince: 0,
    switched: false,
    bones: createBoneMatrices(),
  }
}

const slotKey = (spot, slot) => `${spot}:${slot}`

function release(state, a) {
  if (a.target?.kind === 'slot' && state.slots.get(a.target.key) === a.id) state.slots.delete(a.target.key)
  if (a.target?.kind === 'bed') state.beds.get(a.target.bed)?.delete(a.id)
}

// Durumun istediği yer: 'seat' | 'slot' | 'bed'.
function desired(world, a) {
  const status = a.occ.status
  if (status === 'break') return 'slot'
  if (status === 'away' && world.style.away === 'tent' && world.beds.length) return 'bed'
  return 'seat'
}

function slotTarget(spot, si, k) {
  const slot = spot.slots[k]
  return { kind: 'slot', key: slotKey(si, k), spot: spot.id, x: slot.x, z: slot.z, yaw: slot.yaw, station: slot.station ?? null, activity: spot.activity }
}

// İstenen mola noktasında boş yer varsa onu, yoksa from'a en yakın boş yeri ayırır (exclude
// verilen mola noktası hariç). Aynı mola noktasının öbür yerine yürüyen biri varsa ve yer
// değiştirmek ikisinin yolunu kısaltıyorsa (birbirinin önünden geçmesinler) yerler değişir.
function chooseSlot(state, world, a, wantedId, from, exclude = null) {
  let best = null
  world.spots.forEach((spot, si) => {
    if (spot.id === exclude) return
    spot.slots.forEach((slot, k) => {
      const owner = state.slots.get(slotKey(si, k))
      if (owner && owner !== a.id) return
      // oturulacak / yatılacak / binilecek yerler (kanepe, hamak, bant) önce dolar
      const seat = slot.station && slot.station.kind !== 'stand' ? 1.5 : 0
      const d = Math.hypot(slot.x - from[0], slot.z - from[1]) - (spot.id === wantedId ? 100 : 0) - seat
      if (!best || d < best.d) best = { d, si, k, spot }
    })
  })
  if (!best) return null
  release(state, a)
  const { si, spot } = best
  let k = best.k
  state.slots.set(slotKey(si, k), a.id)
  spot.slots.forEach((other, j) => {
    if (j === k) return
    const b = state.agents.get(state.slots.get(slotKey(si, j)))
    if (!b || b.target?.kind !== 'slot' || b.target.key !== slotKey(si, j) || (b.mode !== 'walking' && b.mode !== 'waiting')) return
    const mine = [spot.slots[k].x, spot.slots[k].z]
    const theirs = [other.x, other.z]
    const keep = dist(from, mine) + dist([b.x, b.z], theirs)
    const swap = dist(from, theirs) + dist([b.x, b.z], mine)
    if (swap < keep - 0.2) {
      state.slots.set(slotKey(si, j), a.id)
      state.slots.set(slotKey(si, k), b.id)
      b.target = slotTarget(spot, si, k)
      b.mode = 'waiting'
      b.waitUntil = 0
      k = j
    }
  })
  return slotTarget(spot, si, k)
}

// En yakın, dolmamış çadır.
function chooseBed(state, world, a) {
  let best = -1
  let bestD = Infinity
  world.beds.forEach((bed, i) => {
    const used = state.beds.get(i)
    if (used && used.size >= TENT_CAPACITY && !used.has(a.id)) return
    const d = dist([a.x, a.z], bed.door)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  if (best < 0) return null
  release(state, a)
  if (!state.beds.has(best)) state.beds.set(best, new Set())
  state.beds.get(best).add(a.id)
  const bed = world.beds[best]
  return { kind: 'bed', bed: best, x: bed.door[0], z: bed.door[1], door: bed.door, inside: bed.inside, top: bed.top }
}

// Hedefi duruma göre günceller; değiştiyse true.
function retarget(state, world, a) {
  const want = desired(world, a)
  if (want === 'slot') {
    const wanted = a.occ.spot ?? null
    if (a.target.kind === 'slot' && (!wanted || a.target.spot === wanted)) return false
    const slot = chooseSlot(state, world, a, wanted, [a.x, a.z])
    if (slot) {
      a.target = slot
      return true
    }
  } else if (want === 'bed') {
    if (a.target.kind === 'bed') return false
    const bed = chooseBed(state, world, a)
    if (bed) {
      a.target = bed
      return true
    }
  }
  if (a.target.kind === 'seat') return false
  release(state, a)
  a.target = { kind: 'seat' }
  return true
}

// Mola yerindeki oturak / yatak / bant (kendi koltuğu gibi kullanılır).
function stationSeat(target) {
  const st = target.station
  return { position: st.position, yaw: st.yaw, kind: st.kind, swing: st.swing, front: st.front, exit: [target.x, target.z], key: target.key, home: false }
}

function sitOn(a, seat) {
  a.on = seat
  a.x = seat.position[0]
  a.z = seat.position[2]
  a.y = seat.kind === 'mount' ? seat.position[1] : 0
  a.yaw = seat.yaw
  a.scale = 1
  a.mode = 'seated'
  a.trans = null
  a.path = null
}

function placeAtTarget(state, a) {
  const tg = a.target
  a.trans = null
  a.path = null
  if (tg.kind === 'seat') return sitOn(a, a.seat)
  if (tg.kind === 'bed') {
    a.bed = tg
    a.on = null
    a.x = a.bed.door[0]
    a.z = a.bed.door[1]
    a.mode = 'inside'
    return
  }
  if (tg.station && tg.station.kind !== 'stand') return sitOn(a, stationSeat(tg))
  a.on = null
  a.x = tg.x
  a.z = tg.z
  a.y = 0
  a.yaw = tg.yaw
  a.scale = 1
  a.mode = 'idle'
}

// Hareketi azalt açıkken (ve ilk karede): yürümeden hedefe geçer.
function snap(state, world, a) {
  retarget(state, world, a)
  const tg = a.target
  const there =
    tg.kind === 'seat'
      ? a.mode === 'seated' && a.on?.home
      : tg.kind === 'bed'
        ? a.mode === 'inside'
        : (a.mode === 'idle' && a.x === tg.x && a.z === tg.z) || (a.mode === 'seated' && a.on?.key === tg.key)
  if (!there) placeAtTarget(state, a)
}

// Ayakta duran ve yolu kapatan avatarlar (yol ararken engel). Sırası sonra olan bekleyenler engel
// sayılmaz: yola çıkarlarsa kenara çekilirler (birbirini bekleyen küme kilitlenmesin).
function blockersFor(state, a) {
  const out = []
  for (const b of state.agents.values()) {
    if (b === a || b.mode === 'seated' || b.mode === 'walking' || b.mode === 'inside') continue
    if (b.mode === 'waiting' && b.order > a.order) continue
    out.push({ x: b.x, z: b.z })
  }
  return out
}

// Yürüyenler: yakınlarından geçmek pahalı.
function walkersFor(state, a) {
  const out = []
  for (const b of state.agents.values()) if (b !== a && b.mode === 'walking') out.push({ x: b.x, z: b.z })
  return out
}

function goalOf(a) {
  if (a.target.kind === 'seat') return a.seat.exit
  return [a.target.x, a.target.z]
}

function plan(state, world, a, t) {
  const goal = goalOf(a)
  if (!goal) {
    placeAtTarget(state, a)
    return
  }
  const stuck = a.waitedSince ? t - a.waitedSince : 0
  // uzun süre ilerleyemeyen mola hedefini değiştirir
  if (stuck > SWITCH_AFTER && a.target.kind === 'slot' && !a.switched) {
    a.switched = true
    const other = chooseSlot(state, world, a, null, [a.x, a.z], a.target.spot)
    if (other) {
      a.target = other
      return plan(state, world, a, t)
    }
  }
  const force = stuck > FORCE_AFTER
  const blockers = force ? [] : blockersFor(state, a)
  const path = findPath(world.nav, [a.x, a.z], goal, blockers, force ? [] : walkersFor(state, a))
  if (!path) {
    if (stuck > 1 && shiftOver(state, world, a)) wait(a, t, 0.6)
    else wait(a, t, 0.5)
    return
  }
  a.detour = false
  if (path.length < 2) arrive(a)
  else {
    a.path = path
    a.pathI = 1
    a.mode = 'walking'
  }
}

const sameSpot = (a, b) => a.target.kind === 'slot' && b.target.kind === 'slot' && a.target.key.split(':')[0] === b.target.key.split(':')[0]

// Mola yerinde öbür yerde duran, gelenin yolunu kapatıyorsa içerideki boş yere kayar, gelen onun
// yerini alır (sıranın arkasında kalan yere duran kişi ulaşabiliyorsa).
function shiftOver(state, world, a) {
  const tg = a.target
  if (tg.kind !== 'slot') return false
  const [si] = tg.key.split(':')
  for (const b of state.agents.values()) {
    if (b === a || b.mode !== 'idle' || b.target.kind !== 'slot' || !b.target.key.startsWith(`${si}:`)) continue
    const others = blockersFor(state, b).filter((p) => p.x !== a.x || p.z !== a.z)
    if (!findPath(world.nav, [b.x, b.z], [tg.x, tg.z], others)) continue
    const spot = world.spots[Number(si)]
    const mine = Number(tg.key.split(':')[1])
    const theirs = Number(b.target.key.split(':')[1])
    state.slots.set(tg.key, b.id)
    state.slots.set(b.target.key, a.id)
    a.target = slotTarget(spot, Number(si), theirs)
    b.target = slotTarget(spot, Number(si), mine)
    b.mode = 'waiting'
    b.waitUntil = 0
    return true
  }
  return false
}

// Bekle. waitedSince ilk takılma anıdır; avatar oradan 0.4 m uzaklaşınca (ilerleyince) sıfırlanır.
function wait(a, t, seconds) {
  a.mode = 'waiting'
  a.waitUntil = t + seconds
  if (!a.waitedSince) {
    a.waitedSince = t
    a.waitX = a.x
    a.waitZ = a.z
  }
}

function beginTransition(a, mode, to, extra = {}) {
  a.mode = mode
  a.trans = { k: 0, dur: STAND_UP_TIME, fromPose: a.pose ?? standPose(), fromX: a.x, fromZ: a.z, fromY: a.y, fromYaw: a.yaw, fromScale: a.scale, toY: 0, toScale: 1, ...to, ...extra }
}

// Hedefe varış: koltuğa ya da mola yerindeki oturağa oturur, mola yerinde durur ya da çadıra girer.
function arrive(a) {
  a.path = null
  a.waitedSince = 0
  a.switched = false
  const tg = a.target
  if (tg.kind === 'seat') {
    const [sx, , sz] = a.seat.position
    beginTransition(a, 'sitting', { toX: sx, toZ: sz, toYaw: a.seat.yaw, onto: a.seat })
  } else if (tg.kind === 'bed') {
    a.bed = tg
    beginTransition(a, 'entering', { toX: tg.inside[0], toZ: tg.inside[1], toYaw: Math.atan2(tg.inside[0] - a.x, tg.inside[1] - a.z), toScale: 0.35, dur: TENT_TIME })
  } else if (tg.station && tg.station.kind !== 'stand') {
    const seat = stationSeat(tg)
    const [sx, sy, sz] = seat.position
    beginTransition(a, 'sitting', { toX: sx, toZ: sz, toY: seat.kind === 'mount' ? sy : 0, toYaw: seat.yaw, onto: seat, dur: seat.kind === 'lie' ? 1.0 : STAND_UP_TIME })
  } else {
    a.mode = 'idle'
  }
}

function step(state, world, a, t, dt) {
  const o = a.occ
  // durum değişince herkes aynı anda kalkmasın: kişiye göre 0.2-1.8 sn gecikme
  if (o.status !== a.lastStatus) {
    if (a.lastStatus) a.departAt = t + 0.2 + 1.6 * frac(a.seed * 7.31)
    a.lastStatus = o.status
  }
  if ((t < a.departAt || t < (a.holdUntil ?? 0)) && RESTING.has(a.mode)) return

  switch (a.mode) {
    case 'seated': {
      if (t < a.nextTry) break
      retarget(state, world, a)
      const here = a.on
      const stay = here.home ? a.target.kind === 'seat' : a.target.kind === 'slot' && a.target.key === here.key
      if (stay) break
      if (!here.exit) {
        // kalkış noktası yok: oturduğu yerde mola verir
        release(state, a)
        a.target = { kind: 'seat' }
        a.nextTry = t + 5
        break
      }
      // kalkış noktasında ayakta biri varsa biraz bekle
      const [ex, ez] = here.exit
      const busy = [...state.agents.values()].some((b) => b !== a && b.mode !== 'seated' && b.mode !== 'inside' && Math.hypot(b.x - ex, b.z - ez) < MIN_GAP)
      if (busy) {
        a.nextTry = t + 0.4
        break
      }
      beginTransition(a, 'rising', { toX: ex, toZ: ez, toYaw: Math.atan2(ex - a.x, ez - a.z) })
      break
    }
    case 'rising':
    case 'sitting':
    case 'entering':
    case 'leaving': {
      const tr = a.trans
      tr.k = Math.min(1, tr.k + dt / tr.dur)
      const k = smooth(tr.k)
      a.x = lerp(tr.fromX, tr.toX, k)
      a.z = lerp(tr.fromZ, tr.toZ, k)
      a.y = lerp(tr.fromY, tr.toY, k)
      a.scale = lerp(tr.fromScale, tr.toScale, k)
      a.yaw = tr.fromYaw + angleTo(tr.fromYaw, tr.toYaw) * k
      if (tr.k < 1) break
      const mode = a.mode
      a.trans = null
      if (mode === 'sitting') {
        a.on = tr.onto
        a.mode = 'seated'
      } else if (mode === 'entering') {
        a.mode = 'inside'
      } else {
        a.on = null
        a.y = 0
        a.scale = 1
        retarget(state, world, a)
        plan(state, world, a, t)
      }
      break
    }
    case 'inside':
      if (retarget(state, world, a) || a.target.kind !== 'bed') {
        const bed = a.bed
        a.x = bed.inside[0]
        a.z = bed.inside[1]
        a.scale = 0.35
        beginTransition(a, 'leaving', { toX: bed.door[0], toZ: bed.door[1], toYaw: Math.atan2(bed.door[0] - a.x, bed.door[1] - a.z), dur: TENT_TIME })
      }
      break
    case 'idle':
      a.yaw += angleTo(a.yaw, a.target.yaw) * Math.min(1, dt * TURN_SPEED * 0.5)
      if (retarget(state, world, a)) plan(state, world, a, t)
      break
    case 'waiting':
      if (retarget(state, world, a) || t >= a.waitUntil) plan(state, world, a, t)
      break
    case 'walking':
      if (retarget(state, world, a)) plan(state, world, a, t)
      else walk(state, world, a, t, dt)
      break
    default:
      break
  }
}

// Kalan yolun parçaları (en fazla len m): [[x0, z0, x1, z1], ...].
function pathSegments(b, len = 2.5) {
  const out = []
  let px = b.x
  let pz = b.z
  let left = len
  for (let i = b.pathI; b.path && i < b.path.length && left > 0; i++) {
    const [qx, qz] = b.path[i]
    out.push([px, pz, qx, qz])
    left -= Math.hypot(qx - px, qz - pz)
    px = qx
    pz = qz
  }
  if (!out.length) out.push([b.x, b.z, b.x, b.z])
  return out
}

// Karşıdan gelene yol vermek için kenara çekilir: b'nin yolundan uzak, en yakın boş yere yürür.
function sidestep(state, world, a, b, t) {
  const blockers = blockersFor(state, a)
  const refuge = findRefuge(world.nav, [a.x, a.z], pathSegments(b), blockers, YIELD_CLEAR)
  if (!refuge) return false
  const path = findPath(world.nav, [a.x, a.z], refuge, blockers)
  if (!path || path.length < 2) return false
  a.path = path
  a.pathI = 1
  a.mode = 'walking'
  a.detour = true
  a.headOnSince = 0
  if (!a.waitedSince) {
    a.waitedSince = t
    a.waitX = a.x
    a.waitZ = a.z
  }
  return true
}

function walk(state, world, a, t, dt) {
  const target = a.path[a.pathI]
  const dx = target[0] - a.x
  const dz = target[1] - a.z
  const d = Math.hypot(dx, dz)
  const dirX = dx / Math.max(d, 1e-6)
  const dirZ = dz / Math.max(d, 1e-6)
  a.dirX = dirX
  a.dirZ = dirZ

  // Yürüyen kimseye MIN_GAP'ten, duran kimseye PASS_GAP'ten fazla yaklaşılmaz. Yürüyen biri
  // önümüzdeyse: aynı yöne gidiyorsa beklenir; karşı karşıyaysa sırası sonra olan (ya da uzun süre
  // bekleyen öncelikli) kenara çekilir. Duran biri yoldaysa etrafından yeni yol aranır.
  const stepLen = Math.min(d, WALK_SPEED * dt)
  const nx = a.x + dirX * stepLen
  const nz = a.z + dirZ * stepLen
  const force = a.waitedSince && t - a.waitedSince > FORCE_AFTER
  if (!force) {
    for (const b of state.agents.values()) {
      if (b === a || b.mode === 'seated' || b.mode === 'inside') continue
      const near = Math.hypot(b.x - nx, b.z - nz)
      const now = Math.hypot(b.x - a.x, b.z - a.z)
      if (near >= (b.mode === 'walking' ? MIN_GAP : PASS_GAP) || near >= now) continue
      if (b.mode === 'walking') {
        const toB = [(b.x - a.x) / now, (b.z - a.z) / now]
        const headOn = dirX * toB[0] + dirZ * toB[1] > 0.3 && -(b.dirX * toB[0] + b.dirZ * toB[1]) > 0.3
        if (headOn) {
          if (!a.headOnSince) a.headOnSince = t
          const yields = a.order > b.order || t - a.headOnSince > HEAD_ON_PATIENCE
          if (yields && !a.detour && sidestep(state, world, a, b, t)) return
          wait(a, t, yields ? 0.35 : 0.25)
        } else wait(a, t, 0.2 + 0.2 * frac(a.seed))
      } else if (b.mode === 'waiting' && b.order > a.order && !b.detour && sidestep(state, world, b, a, t)) {
        // bekleyen, sırası sonra olan kişi yol verir
        wait(a, t, 0.3)
      } else if (b.mode === 'idle' && sameSpot(a, b) && shiftOver(state, world, a)) {
        // aynı mola yerinde duran, içerideki yere kayar
        wait(a, t, 0.6)
      } else if (t >= a.nextReplan) {
        a.nextReplan = t + 0.6
        plan(state, world, a, t)
      } else wait(a, t, 0.3)
      return
    }
  }

  a.headOnSince = 0
  a.x = nx
  a.z = nz
  if (a.waitedSince && Math.hypot(a.x - a.waitX, a.z - a.waitZ) > 0.4) {
    a.waitedSince = 0
    a.switched = false
  }
  a.phase += stepLen * STRIDE
  if (d > 1e-3) a.yaw += angleTo(a.yaw, Math.atan2(dirX, dirZ)) * Math.min(1, dt * TURN_SPEED)
  if (d - stepLen < 1e-3) {
    a.pathI++
    if (a.pathI >= a.path.length) {
      if (a.detour) {
        // kenara çekildi: karşıdaki geçsin, sonra yeniden yol ara
        a.detour = false
        a.path = null
        wait(a, t, 0.9)
      } else arrive(a)
    }
  }
}

// ---------------------------------------------------------------- pozlar

function focusPose(b, t, seed) {
  // ana hareket ~24 sn, ara hareket ~7 sn
  const act = frac((t + seed * 13) / 31) < 0.77 ? b.focus[0] : b.focus[1]
  const sit = b.sit
  switch (act) {
    case 'type':
      return typePose(sit, t, seed)
    case 'tap':
      return tapPose(sit, t, seed)
    case 'deskRead':
      return deskReadPose(sit, t, seed)
    case 'write':
      return writePose(sit, t, seed, b.tool)
    case 'tablet':
      return readPose(sit, t, seed, 'tablet')
    case 'think':
      return thinkPose(sit, t, seed)
    default:
      return readPose(sit, t, seed, 'book')
  }
}

function awayPose(b, t, seed) {
  switch (b.away) {
    case 'desk':
      return sleepDeskPose(b.sit, t, seed)
    case 'newspaper':
      return sleepLeanPose(b.sit, t, seed, 'newspaper')
    case 'bookChest':
      return sleepLeanPose(b.sit, t, seed, 'bookChest')
    default:
      return sleepLeanPose(b.sit, t, seed)
  }
}

// Mola yerindeki oturak, yatak ya da bant üstündeki hareket.
function stationPose(seat, activity, t, seed) {
  const pose = activity.sit?.pose
  const sit = { y: seat.position[1], slope: true, front: seat.front }
  if (seat.kind === 'lie') return liePose(sit, t, seed, frac(seed) < 0.5 ? 'bookChest' : null)
  if (seat.kind === 'mount') return pose === 'vr' ? vrPose(t, seed) : runPose(t, seed)
  return loungePose(sit, t, seed, activity.sit?.prop ?? null)
}

// Avatarın o anki hedef pozu.
function targetPose(a, t) {
  const seed = a.seed
  switch (a.mode) {
    case 'walking':
      return walkPose(a.phase)
    case 'idle': {
      const act = a.target.activity
      return (STAND_POSES[act?.stand] ?? STAND_POSES.look)(t, seed, act?.prop)
    }
    case 'sitting':
      return a.trans.onto.home ? sitPose(a.seat.behavior.sit, t, seed) : stationPose(a.trans.onto, a.target.activity ?? {}, t, seed)
    case 'seated':
      break
    default:
      return standPose(t, seed)
  }
  if (!a.on.home) return stationPose(a.on, a.target.activity ?? {}, t, seed)
  const b = a.seat.behavior
  const status = a.occ.status
  if (status === 'away') return awayPose(b, t, seed)
  if (status === 'break') return sitPose(b.sit, t, seed)
  return focusPose(b, t, seed)
}

// ---------------------------------------------------------------- etiketler

const project = new Vector3()

// Etiket: durum noktası (renk ve biçimle: odakta yuvarlak, molada baklava, uzakta hilal); açıkken
// yanında ad (uzaktaysa kaç dakikadır).
function updateLabel(state, a, head, camera, size, open) {
  const labels = state.labels
  if (!labels) return
  let el = labels.items.get(a.id)
  if (!el) {
    el = document.createElement('div')
    el.className = 'avatar-label'
    el.dataset.id = a.id
    el.innerHTML = '<span class="avatar-label__dot"></span><span class="avatar-label__text"></span>'
    labels.layer.appendChild(el)
    labels.items.set(a.id, el)
  }
  const o = a.occ
  const minutes = o.status === 'away' && o.since ? Math.floor((Date.now() - o.since) / 60000) : 0
  const name = o.me ? 'Sen' : o.name
  const text = `${name}${minutes > 0 ? ` · ${minutes} dk` : ''}`
  const title = `${name} · ${STATUS_LABELS[o.status]}${minutes > 0 ? ` · ${minutes} dk` : ''}`
  const cls = `avatar-label avatar-label--${o.status}${o.me ? ' avatar-label--me' : ''}${open ? ' avatar-label--open' : ''}`
  if (el.dataset.text !== text) {
    el.dataset.text = text
    el.lastChild.textContent = text
    el.w = 0
  }
  if (el.title !== title) {
    el.title = title
    el.setAttribute('aria-label', title)
  }
  if (el.className !== cls) {
    el.className = cls
    el.w = 0
  }
  project.set(head.x, head.y + 0.18, head.z).project(camera)
  el.x = ((project.x + 1) / 2) * size.width
  el.y = ((1 - project.y) / 2) * size.height
}

// Üst üste binen etiketleri yukarı iter (öndekiler, yani ekranda alttakiler yerinde kalır).
function spreadLabels(state) {
  const labels = state.labels
  if (!labels) return
  const list = [...labels.items.values()].sort((p, q) => q.y - p.y)
  const placed = []
  for (const el of list) {
    if (!el.w) {
      el.w = el.offsetWidth || 14
      el.h = el.offsetHeight || 14
    }
    let y = el.y
    for (let moved = true, guard = 0; moved && guard < 12; guard++) {
      moved = false
      for (const p of placed) {
        if (Math.abs(p.x - el.x) < (p.w + el.w) / 2 + 2 && y > p.y - p.h - 2 && y < p.y + el.h + 2) {
          y = p.y - p.h - 3
          moved = true
        }
      }
    }
    placed.push({ x: el.x, y, w: el.w, h: el.h })
    el.style.transform = `translate(${el.x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`
  }
}
