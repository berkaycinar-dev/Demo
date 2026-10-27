import { pick } from '../core/voxel'

// Plaza yazılım ofisi temasının voxel parçaları. Birim ≈ 1 metre.
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür.

export const WALL = 0.2
export const FLOOR_BOTTOM = -0.32
export const WALL_HEIGHT = 3.2
export const SEAT_HEIGHT = 0.5
const DESK_HEIGHT = 0.74
const SEAT_WIDTH = 1.3
const DESK_DEPTH = 0.75
const PENDANT_HEIGHT = 2.55
const GLASS = { layer: 'glass' }
const BULB = { layer: 'bulb' }
const NIGHT = { layer: 'night' }

export const C = {
  wall: '#ebe8e3',
  wallCap: '#d6d2cb',
  baseboard: '#4a4e55',
  concrete: '#5d6168',
  carpet: ['#8f959c', '#979da3', '#8a9097', '#9ba1a6'],
  aluminum: '#a3aab2',
  aluminumDark: '#5a6068',
  column: '#f0eee9',
  deskTop: '#f3f2ee',
  metal: '#3a3d42',
  felt: '#5f8078',
  cabinet: '#f4f3ef',
  groove: '#d6d3cc',
  screenBody: '#1b1d22',
  screen: '#1f2636',
  code: ['#7aa2f7', '#9ece6a', '#e0af68', '#bb9af7', '#7dcfff', '#f7768e'],
  keyboard: '#2a2d33',
  keys: '#d9dbe0',
  mesh: '#2b2e33',
  seats: ['#34495e', '#2f3640', '#3d5a5a'],
  oak: '#c49a6c',
  oakDark: '#a87e52',
  slatBacking: '#3b3f45',
  sofa: '#7d8590',
  sofaLight: '#8d95a0',
  accents: ['#e07a5f', '#3d85c6', '#f2cc8f', '#81b29a'],
  pot: '#f2f0ec',
  soil: '#3a2a1e',
  leaves: ['#3f7d4a', '#4c8f57', '#2f6b3c'],
  steel: '#c5c9ce',
  steelDark: '#8e949b',
  porcelain: '#f4f2ee',
  sticky: ['#ffe066', '#ff8fab', '#8ce99a', '#74c0fc'],
  whiteboard: '#fbfbf9',
  tvScreen: '#151a24',
  ink: '#262626',
  paper: '#efeeea',
  books: ['#34495e', '#e07a5f', '#81b29a', '#f2cc8f', '#3d85c6', '#5c5f66'],
  sky: '#cfe3f2',
  buildingFar: ['#aebccb', '#b9c5d2', '#a3b2c2'],
  buildingNear: ['#7b8a9c', '#6f7f92', '#8695a6', '#5f6f82'],
  windowBand: '#dbe7f1',
  cityLights: ['#ffd98a', '#ffe9b8', '#cfe6ff'],
  beacon: '#ff3b30',
  cursor: '#e6e6e6',
  tableGreen: '#2f6f5e',
  water: '#9fd3f5',
}

// ---------------------------------------------------------------- yapı

export function floor(f, width, depth, rnd) {
  f.box(0, FLOOR_BOTTOM, 0, width, -0.04 - FLOOR_BOTTOM, depth, C.concrete)
  const tile = 0.6
  for (let x = 0; x < width - 1e-3; x += tile) {
    for (let z = 0; z < depth - 1e-3; z += tile) {
      f.box(x, -0.04, z, Math.min(tile, width - x), 0.04, Math.min(tile, depth - z), pick(rnd, C.carpet))
    }
  }
}

// Arka duvar: z = 0 boyunca, x = -WALL'dan width'e.
export function backWall(f, width) {
  f.box(-WALL, FLOOR_BOTTOM, -WALL, width + WALL, -FLOOR_BOTTOM, WALL, C.concrete)
  f.box(-WALL, 0, -WALL, width + WALL, WALL_HEIGHT, WALL, C.wall)
  f.box(-WALL, WALL_HEIGHT, -WALL, width + WALL, 0.03, WALL, C.wallCap)
  f.box(0, 0, 0, width, 0.08, 0.015, C.baseboard)
}

// Boydan boya cam cephe ve arkasında şehir. Yerel u duvar boyunca, iç yüzey v = 0.
export function glassWall(f, length, rnd, room) {
  const sill = 0.1
  const head = WALL_HEIGHT - 0.12
  f.box(0, FLOOR_BOTTOM, -WALL, length, -FLOOR_BOTTOM, WALL, C.concrete)
  f.box(0, 0, -WALL, length, sill, WALL, C.aluminumDark)
  f.box(0, head, -WALL, length, WALL_HEIGHT - head, WALL, C.aluminumDark)
  f.box(0, WALL_HEIGHT, -WALL, length, 0.03, WALL, C.wallCap)
  skyline(f, length, sill, head, rnd, room)
  const bays = Math.max(1, Math.round(length / 1.25))
  for (let i = 0; i <= bays; i++) {
    const u = Math.min(Math.max((i * length) / bays - 0.03, 0), length - 0.06)
    f.box(u, sill, -WALL + 0.03, 0.06, head - sill, WALL - 0.01, C.aluminum)
  }
}

// Uzak ve yakın bina sıraları; yakın binalarda kat bantları, akşam/gece yanan pencereler
// (night katmanı) ve yüksek binaların tepesinde yanıp sönen ikaz lambası.
function skyline(f, length, y0, top, rnd, room) {
  const v = -0.12
  f.box(0, y0, v - 0.006, length, top - y0, 0.006, C.sky, GLASS)

  let u = 0
  while (u < length - 0.05) {
    const w = Math.min(0.35 + rnd() * 0.6, length - u)
    const h = Math.min(0.9 + rnd() * 1.7, top - y0)
    f.box(u, y0, v, w, h, 0.004, pick(rnd, C.buildingFar), GLASS)
    for (let k = 0; k < 4; k++) {
      f.box(u + 0.05 + rnd() * (w - 0.12), y0 + 0.1 + rnd() * (h - 0.2), v + 0.004, 0.035, 0.03, 0.002, pick(rnd, C.cityLights), NIGHT)
    }
    u += w + rnd() * 0.15
  }

  u = rnd() * 0.3
  while (u < length - 0.25) {
    const w = Math.min(0.4 + rnd() * 0.7, length - u)
    const h = 0.4 + rnd() * 1.3
    f.box(u, y0, v + 0.006, w, h, 0.004, pick(rnd, C.buildingNear), GLASS)
    for (let y = y0 + 0.08; y < y0 + h - 0.08; y += 0.12) {
      f.box(u + 0.04, y, v + 0.01, w - 0.08, 0.04, 0.002, C.windowBand, GLASS)
      for (let x = u + 0.05; x < u + w - 0.1; x += 0.09) {
        if (rnd() < 0.3) f.box(x, y, v + 0.013, 0.05, 0.04, 0.002, pick(rnd, C.cityLights), NIGHT)
      }
    }
    if (h > 1.2) {
      room.blinkers.push({
        center: f.point(u + w / 2, y0 + h + 0.02, v + 0.012),
        quat: f.worldRotation(),
        size: [0.04, 0.04, 0.004],
        color: C.beacon,
        rate: 0.5,
        duty: 0.2,
      })
    }
    u += w + 0.05 + rnd() * 0.25
  }
}

// Yapısal kolon (plaza); orijin sol-arka köşe.
export function column(f, size = 0.4) {
  f.box(0, 0, 0, size, WALL_HEIGHT, size, C.column)
  f.box(-0.01, 0, -0.01, size + 0.02, 0.08, size + 0.02, C.baseboard)
}

// ---------------------------------------------------------------- çalışma alanı

// Bench masa grubu; orijin grubun merkezi. back: duvar tarafındaki koltuklar (kameraya bakar),
// front: karşı sıradaki koltuklar. Masaların üstünde sarkıt LED armatür.
export function deskPod(center, { back = 0, front = 0 }, rnd, room) {
  const seats = Math.max(back, front)
  const length = seats * SEAT_WIDTH
  const depth = front > 0 ? DESK_DEPTH * 2 : DESK_DEPTH
  const H = DESK_HEIGHT
  const f = center.frame(-length / 2, 0, -depth / 2)

  for (let row = 0; row * DESK_DEPTH < depth - 1e-3; row++) {
    for (let i = 0; i < seats; i++) {
      f.box(i * SEAT_WIDTH + 0.005, H - 0.03, row * DESK_DEPTH + 0.004, SEAT_WIDTH - 0.01, 0.03, DESK_DEPTH - 0.008, C.deskTop)
    }
  }
  for (let i = 0; i <= seats; i++) {
    const u = Math.min(Math.max(i * SEAT_WIDTH - 0.03, 0.02), length - 0.08)
    f.box(u, 0, 0.1, 0.06, H - 0.03, depth - 0.2, C.metal)
    f.box(u - 0.02, 0, 0.06, 0.1, 0.03, depth - 0.12, C.metal)
  }
  f.box(0.06, H - 0.12, depth / 2 - 0.04, length - 0.12, 0.06, 0.08, C.metal)
  if (front > 0) f.box(0, H, depth / 2 - 0.02, length, 0.42, 0.04, C.felt)

  const seatsAt = (count) => Array.from({ length: count }, (_, i) => (length * (i + 0.5)) / count)
  for (const u of seatsAt(back)) {
    const c = f.frame(u, 0, -0.42)
    officeChair(c, rnd)
    room.seats.push({ position: c.point(0, SEAT_HEIGHT, 0).toArray(), yaw: c.facing() })
    workstation(f.frame(u, H, 0), rnd, room)
  }
  for (const u of seatsAt(front)) {
    const c = f.frame(u, 0, depth + 0.42, Math.PI)
    officeChair(c, rnd)
    room.seats.push({ position: c.point(0, SEAT_HEIGHT, 0).toArray(), yaw: c.facing() })
    workstation(f.frame(u, H, depth, Math.PI), rnd, room)
  }

  pendant(f.frame(length / 2, 0, depth / 2), Math.min(length - 0.3, 2.6))
  f.glow(0, H + 0.003, 0, length, depth)
  room.lights.push(f.point(length / 2, PENDANT_HEIGHT - 0.15, depth / 2).toArray())
}

// Masa üstü; t'nin orijini oturanın önündeki masa kenarı, +z masanın içine.
function workstation(t, rnd, room) {
  t.box(-0.21, 0, 0.1, 0.42, 0.018, 0.14, C.keyboard)
  t.box(-0.19, 0.018, 0.115, 0.38, 0.004, 0.11, C.keys)
  t.box(0.28, 0, 0.13, 0.06, 0.02, 0.1, C.keyboard)

  // Monitörler oturana dönük, ikili düzende hafif içe açılı.
  if (rnd() < 0.65) {
    monitor(t.frame(-0.29, 0, 0.55, Math.PI - 0.25), rnd, room)
    monitor(t.frame(0.29, 0, 0.55, Math.PI + 0.25), rnd, room)
  } else {
    monitor(t.frame(-0.08, 0, 0.55, Math.PI), rnd, room)
    laptop(t.frame(0.45, 0, 0.36, 0.4))
  }

  const r = rnd()
  if (r < 0.5) {
    t.box(-0.45, 0, 0.2, 0.08, 0.1, 0.08, pick(rnd, [C.porcelain, ...C.accents]))
    t.box(-0.44, 0.098, 0.21, 0.06, 0.004, 0.06, '#3a2416')
  } else if (r < 0.75) {
    t.box(-0.48, 0, 0.32, 0.1, 0.09, 0.1, C.pot)
    t.box(-0.5, 0.09, 0.3, 0.14, 0.1, 0.14, pick(rnd, C.leaves))
  } else {
    t.box(-0.48, 0, 0.15, 0.2, 0.012, 0.26, pick(rnd, C.books))
    t.box(-0.47, 0.012, 0.16, 0.18, 0.004, 0.24, C.paper)
  }
}

// Monitör; orijin ayak tabanı, ekran yerel +z'ye bakar. Son kod satırının sonunda imleç yanıp söner.
function monitor(m, rnd, room) {
  const w = 0.56
  const h = 0.33
  const y0 = 0.17
  m.box(-0.1, 0, -0.08, 0.2, 0.012, 0.14, C.metal)
  m.box(-0.02, 0.012, -0.05, 0.04, 0.2, 0.025, C.metal)
  m.box(-w / 2, y0, -0.02, w, h, 0.025, C.screenBody)
  m.box(-w / 2 + 0.015, y0 + 0.015, 0.005, w - 0.03, h - 0.03, 0.003, C.screen, BULB)

  let y = y0 + h - 0.045
  let cursor = [0, y]
  for (let i = 0; i < 7 && y > y0 + 0.03; i++) {
    const indent = Math.floor(rnd() * 3) * 0.03
    const x = -w / 2 + 0.04 + indent
    const len = Math.min(0.08 + rnd() * 0.28, w / 2 - 0.06 - x)
    m.box(x, y, 0.008, len, 0.012, 0.002, pick(rnd, C.code), BULB)
    cursor = [x + len + 0.012, y]
    y -= 0.035
  }
  room.blinkers.push({
    center: m.point(cursor[0], cursor[1] + 0.006, 0.0105),
    quat: m.worldRotation(),
    size: [0.012, 0.018, 0.002],
    color: C.cursor,
    rate: 1,
    duty: 0.5,
  })
}

// Dizüstü; orijin taban merkezi, ekran ve klavye yerel -z'ye (oturana) bakar.
function laptop(t) {
  t.box(-0.16, 0, -0.11, 0.32, 0.018, 0.22, C.steelDark)
  const s = t.frame(0, 0.018, 0.11, 0, 0.25)
  s.box(-0.16, 0, -0.012, 0.32, 0.21, 0.012, C.steelDark)
  s.box(-0.145, 0.015, -0.015, 0.29, 0.18, 0.003, C.screen, BULB)
  s.box(-0.12, 0.13, -0.017, 0.14, 0.01, 0.002, C.code[1], BULB)
  s.box(-0.12, 0.1, -0.017, 0.2, 0.01, 0.002, C.code[0], BULB)
}

// Ergonomik ofis koltuğu; oturan +z yönüne bakar, sırtlık -z tarafında.
export function officeChair(f, rnd) {
  const seat = pick(rnd, C.seats)
  f.box(-0.3, 0.05, -0.03, 0.6, 0.04, 0.06, C.metal)
  f.box(-0.03, 0.05, -0.3, 0.06, 0.04, 0.6, C.metal)
  for (const [x, z] of [[-0.3, 0], [0.3, 0], [0, -0.3], [0, 0.3]]) {
    f.box(x - 0.03, 0, z - 0.03, 0.06, 0.05, 0.06, C.ink)
  }
  f.box(-0.03, 0.09, -0.03, 0.06, 0.3, 0.06, C.steel)
  f.box(-0.24, 0.39, -0.22, 0.48, 0.08, 0.46, C.metal)
  f.box(-0.22, 0.47, -0.2, 0.44, 0.03, 0.42, seat)
  f.box(-0.03, 0.42, -0.28, 0.06, 0.25, 0.04, C.metal)
  f.box(-0.23, 0.6, -0.31, 0.46, 0.52, 0.05, C.mesh)
  f.box(-0.2, 0.7, -0.27, 0.4, 0.09, 0.02, seat)
  for (const x of [-0.27, 0.24]) {
    f.box(x + 0.005, 0.44, -0.04, 0.025, 0.17, 0.03, C.metal)
    f.box(x, 0.61, -0.15, 0.035, 0.03, 0.24, C.ink)
  }
}

// Sarkıt lineer LED armatür; orijin masanın ortası (zemin seviyesi), tavana kablolarla asılı.
function pendant(f, length) {
  const y = PENDANT_HEIGHT
  f.box(-length / 2, y, -0.06, length, 0.05, 0.12, C.aluminum)
  f.box(-length / 2 + 0.03, y - 0.008, -0.045, length - 0.06, 0.01, 0.09, '#ffffff', BULB)
  // üstteki tavan aydınlatma şeridi; izometrik açıdan armatürün lamba olduğu okunur
  f.box(-length / 2 + 0.03, y + 0.05, -0.03, length - 0.06, 0.008, 0.06, '#ffffff', BULB)
  for (const x of [-length / 2 + 0.15, length / 2 - 0.16]) {
    f.box(x, y + 0.05, -0.004, 0.008, WALL_HEIGHT - y - 0.05, 0.008, C.ink)
  }
}

// ---------------------------------------------------------------- mola alanları

// Kahve barı; orijin sol-arka köşe (duvara dayalı), u = uzunluk.
export function coffeeBar(f, length) {
  f.box(0.02, 0, 0.02, length - 0.04, 0.08, 0.52, C.ink)
  f.box(0, 0.08, 0, length, 0.78, 0.6, C.cabinet)
  for (let u = 0.6; u < length - 0.1; u += 0.6) f.box(u, 0.1, 0.6, 0.006, 0.72, 0.004, C.groove)
  f.box(-0.02, 0.86, 0, length + 0.04, 0.04, 0.63, C.oak)
  const top = 0.9

  // espresso makinesi
  const m = f.frame(0.4, top, 0.3)
  m.box(-0.2, 0, -0.2, 0.4, 0.34, 0.36, C.steel)
  m.box(-0.18, 0.08, 0.16, 0.36, 0.18, 0.02, C.ink)
  for (const x of [-0.1, 0.06]) m.box(x, 0.1, 0.17, 0.05, 0.05, 0.07, C.steelDark)
  m.box(-0.18, 0, 0.12, 0.36, 0.03, 0.12, C.steelDark)
  m.box(-0.16, 0.34, -0.16, 0.08, 0.06, 0.08, C.porcelain)
  m.box(-0.05, 0.34, -0.16, 0.08, 0.06, 0.08, C.porcelain)

  // öğütücü, fincanlar, meyve kâsesi
  f.box(0.72, top, 0.18, 0.14, 0.32, 0.18, C.ink)
  f.box(0.74, top + 0.32, 0.2, 0.1, 0.1, 0.14, '#8a6a4a')
  for (let i = 0; i < 3; i++) f.box(0.98 + i * 0.1, top, 0.2 + (i % 2) * 0.12, 0.08, 0.09, 0.08, C.accents[i])
  if (length > 1.8) {
    f.box(length - 0.55, top, 0.2, 0.3, 0.06, 0.24, C.porcelain)
    for (const [x, color] of [[0.06, '#e9c46a'], [0.14, '#e76f51'], [0.1, '#8ab17d']]) {
      f.box(length - 0.55 + x, top + 0.06, 0.28, 0.08, 0.07, 0.08, color)
    }
  }

  // duvarda yüzer raf
  f.box(0.1, 1.5, 0, length - 0.2, 0.04, 0.26, C.oak)
  for (let i = 0; i < Math.floor((length - 0.4) / 0.2); i++) {
    f.box(0.2 + i * 0.2, 1.54, 0.08, 0.1, i % 3 === 0 ? 0.16 : 0.1, 0.1, i % 3 === 0 ? '#c9dde0' : C.accents[i % 4])
  }
}

export function waterCooler(f) {
  f.box(-0.16, 0, -0.16, 0.32, 0.95, 0.32, C.cabinet)
  f.box(-0.1, 0.6, 0.16, 0.2, 0.12, 0.02, C.steelDark)
  f.box(-0.12, 0.95, -0.12, 0.24, 0.36, 0.24, C.water)
  f.box(-0.05, 1.31, -0.05, 0.1, 0.05, 0.1, C.water)
}

export function sofa(f, rnd) {
  for (const x of [-0.95, 0.9]) {
    f.box(x, 0, -0.38, 0.05, 0.14, 0.05, C.metal)
    f.box(x, 0, 0.33, 0.05, 0.14, 0.05, C.metal)
  }
  f.box(-1, 0.14, -0.42, 2, 0.24, 0.84, C.sofa)
  f.box(-0.86, 0.38, -0.24, 0.85, 0.1, 0.64, C.sofaLight)
  f.box(0.01, 0.38, -0.24, 0.85, 0.1, 0.64, C.sofaLight)
  f.box(-1, 0.38, -0.42, 0.14, 0.24, 0.84, C.sofa)
  f.box(0.86, 0.38, -0.42, 0.14, 0.24, 0.84, C.sofa)
  f.box(-1, 0.38, -0.42, 2, 0.46, 0.18, C.sofa)
  f.box(-0.78, 0.48, -0.24, 0.32, 0.28, 0.12, pick(rnd, C.accents), { rot: [-0.25, 0, 0] })
  f.box(0.46, 0.48, -0.24, 0.32, 0.28, 0.12, pick(rnd, C.accents), { rot: [-0.25, 0, 0] })
}

export function coffeeTable(f, rnd) {
  f.box(-0.5, 0.36, -0.3, 1.0, 0.04, 0.6, C.oak)
  for (const [x, z] of [[-0.46, -0.26], [0.42, -0.26], [-0.46, 0.22], [0.42, 0.22]]) {
    f.box(x, 0, z, 0.04, 0.36, 0.04, C.metal)
  }
  f.box(-0.3, 0.4, -0.12, 0.26, 0.03, 0.2, pick(rnd, C.books))
  f.box(0.12, 0.4, -0.05, 0.08, 0.09, 0.08, C.porcelain)
}

export function beanBag(f, rnd) {
  const color = pick(rnd, C.accents)
  f.box(-0.36, 0, -0.36, 0.72, 0.22, 0.72, color)
  f.box(-0.3, 0.22, -0.3, 0.6, 0.12, 0.6, color)
  f.box(-0.3, 0.3, -0.36, 0.6, 0.3, 0.2, color, { rot: [-0.3, 0, 0] })
}

export function pingPong(f) {
  const W = 2.2
  const D = 1.2
  for (const x of [-W / 2 + 0.15, W / 2 - 0.25]) {
    f.box(x, 0, -D / 2 + 0.15, 0.1, 0.72, 0.1, C.metal)
    f.box(x, 0, D / 2 - 0.25, 0.1, 0.72, 0.1, C.metal)
  }
  f.box(-W / 2, 0.72, -D / 2, W, 0.04, D, C.tableGreen)
  const y = 0.76
  f.box(-W / 2, y, -D / 2, W, 0.003, 0.03, C.porcelain)
  f.box(-W / 2, y, D / 2 - 0.03, W, 0.003, 0.03, C.porcelain)
  f.box(-W / 2, y, -D / 2, 0.03, 0.003, D, C.porcelain)
  f.box(W / 2 - 0.03, y, -D / 2, 0.03, 0.003, D, C.porcelain)
  f.box(-W / 2, y, -0.008, W, 0.003, 0.016, C.porcelain)
  f.box(-0.01, y, -D / 2 - 0.05, 0.02, 0.15, D + 0.1, C.porcelain)
  f.box(-0.5, y, 0.1, 0.16, 0.012, 0.1, '#c0392b')
  f.box(0.4, y, -0.25, 0.16, 0.012, 0.1, C.ink)
  f.box(0.2, y, 0.2, 0.03, 0.03, 0.03, '#ff9f1c')
}

// Saksıda paşa kılıcı (dik yapraklar).
export function snakePlant(f, rnd) {
  f.box(-0.2, 0, -0.2, 0.4, 0.42, 0.4, C.pot)
  f.box(-0.17, 0.42, -0.17, 0.34, 0.01, 0.34, C.soil)
  for (let i = 0; i < 7; i++) {
    const x = -0.12 + rnd() * 0.24
    const z = -0.12 + rnd() * 0.24
    const h = 0.5 + rnd() * 0.6
    f.box(x - 0.03, 0.42, z - 0.015, 0.06, h, 0.03, pick(rnd, C.leaves), { rot: [0, rnd() * 3, (rnd() - 0.5) * 0.2] })
  }
}

// Alçak meşe dolap: yazıcı, klasörler.
export function credenza(f, rnd, length = 1.6) {
  f.box(-length / 2, 0.06, -0.22, length, 0.6, 0.44, C.oak)
  f.box(-length / 2 + 0.04, 0, -0.18, length - 0.08, 0.06, 0.36, C.metal)
  for (let i = 1; i < 3; i++) f.box(-length / 2 + (i * length) / 3, 0.08, 0.22, 0.006, 0.56, 0.004, C.oakDark)
  f.box(-length / 2 + 0.1, 0.66, -0.18, 0.5, 0.22, 0.36, C.cabinet)
  f.box(-length / 2 + 0.14, 0.88, -0.14, 0.42, 0.03, 0.26, C.metal)
  f.box(-length / 2 + 0.16, 0.76, 0.18, 0.38, 0.02, 0.06, C.paper)
  let u = length / 2 - 0.5
  for (let i = 0; i < 6; i++) {
    const w = 0.05 + rnd() * 0.03
    f.box(u, 0.66, -0.12, w, 0.24 + rnd() * 0.06, 0.26, pick(rnd, C.books))
    u += w
  }
}

// ---------------------------------------------------------------- duvar süsleri
// Orijin duvar yüzeyinde, +z odanın içine doğru.

// Kanban görev panosu: Yapılacak / Yapılıyor / Bitti sütunları ve yapışkan notlar.
export function taskBoard(f, rnd) {
  const W = 1.8
  const H = 1.0
  f.box(-W / 2, -H / 2, 0, W, H, 0.03, C.aluminum)
  f.box(-W / 2 + 0.03, -H / 2 + 0.03, 0.03, W - 0.06, H - 0.06, 0.005, C.whiteboard)
  for (const x of [-W / 6, W / 6]) f.box(x - 0.004, -H / 2 + 0.06, 0.035, 0.008, H - 0.16, 0.002, C.ink)
  ;[-W / 3, 0, W / 3].forEach((cx, col) => {
    f.box(cx - 0.18, H / 2 - 0.1, 0.035, 0.36, 0.03, 0.002, C.ink)
    const notes = col === 1 ? 3 : 2 + Math.floor(rnd() * 3)
    for (let n = 0; n < notes; n++) {
      const x = cx - 0.24 + (n % 2) * 0.26
      const y = H / 2 - 0.3 - Math.floor(n / 2) * 0.19
      f.box(x, y, 0.035, 0.2, 0.15, 0.004, pick(rnd, C.sticky), { rot: [0, 0, (rnd() - 0.5) * 0.12] })
    }
  })
  f.box(-W / 2 + 0.2, -H / 2 - 0.04, 0, W - 0.4, 0.03, 0.08, C.aluminum)
  for (const [x, color] of [[-0.3, C.ink], [-0.2, '#c0392b'], [-0.1, '#3d85c6']]) {
    f.box(x, -H / 2 - 0.01, 0.02, 0.08, 0.018, 0.018, color)
  }
}

// CI/proje panosu gösteren duvar ekranı.
export function dashboardTv(f, rnd) {
  const W = 1.3
  const H = 0.75
  f.box(-W / 2, -H / 2, 0, W, H, 0.05, C.screenBody)
  f.box(-W / 2 + 0.025, -H / 2 + 0.025, 0.05, W - 0.05, H - 0.05, 0.003, C.tvScreen, BULB)
  f.box(-W / 2 + 0.06, H / 2 - 0.1, 0.054, 0.4, 0.03, 0.002, '#c0caf5', BULB)
  for (let i = 0; i < 8; i++) {
    const h = 0.08 + rnd() * 0.24
    f.box(-W / 2 + 0.08 + i * 0.07, -H / 2 + 0.08, 0.054, 0.045, h, 0.002, C.code[0], BULB)
  }
  f.box(0.1, 0.06, 0.054, 0.22, 0.14, 0.002, C.code[1], BULB)
  f.box(0.36, 0.06, 0.054, 0.22, 0.14, 0.002, C.code[2], BULB)
  for (let i = 0; i < 6; i++) {
    f.box(0.1 + i * 0.08, -0.26 + i * 0.03 + (i % 2) * 0.03, 0.054, 0.03, 0.03, 0.002, C.code[4], BULB)
  }
}

// Ahşap çıtalı akustik duvar paneli; orijin sol-alt köşe.
export function slatPanel(f, length, height) {
  f.box(0, 0, 0, length, height, 0.02, C.slatBacking)
  for (let u = 0.03; u < length - 0.05; u += 0.11) f.box(u, 0, 0.02, 0.06, height, 0.035, C.oak)
}
