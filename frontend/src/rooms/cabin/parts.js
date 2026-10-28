import { pick } from '../core/voxel'

// Dağ evi temasının voxel parçaları. Birim ≈ 1 metre.
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür.

export const WALL = 0.28
export const FLOOR_BOTTOM = -0.32
export const WALL_HEIGHT = 3.3
export const SEAT_HEIGHT = 0.5
const BENCH_HEIGHT = 0.46
const LOG = 0.3
const CHINK = 0.03
const SILL = 0.9
const WINDOW_TOP = 2.4
const TABLE_HEIGHT = 0.76
const GLASS = { layer: 'glass' }
const BULB = { layer: 'bulb' }

export const C = {
  logs: ['#b9824a', '#ad7742', '#c08a52', '#a87140'],
  chinking: '#e1d2b5',
  endGrain: '#dcb57f',
  endRing: '#b98a55',
  logCut: '#c39461',
  foundation: '#77736d',
  floorBase: '#4f3420',
  planks: ['#7d5434', '#744c2e', '#86593a', '#6d472b'],
  wood: '#5a3720',
  woodDark: '#3e2414',
  woodLight: '#8a5a33',
  tableTop: ['#a06a3a', '#986337', '#a8723f'],
  frame: '#6b4426',
  trim: '#7a4e2b',
  stones: ['#8d8a85', '#7b7873', '#9a968f', '#6f6c68', '#a39e95', '#857f78'],
  flagstones: ['#8a857e', '#7d7872', '#958f87'],
  mortar: '#4b4743',
  soot: '#1c1512',
  ember: '#ff5a14',
  flameOuter: '#ff7a1e',
  flameMid: '#ffa530',
  flameCore: '#ffe28c',
  barks: ['#5b3b22', '#4e321d', '#654328'],
  iron: '#2d2a28',
  brass: '#c99b3d',
  plaidRed: '#a52a24',
  wool: '#efe6d6',
  sage: '#7c8f6a',
  sageLight: '#8da07a',
  rust: '#a5552e',
  rustLight: '#b8643a',
  mustard: '#c99a2e',
  mustardLight: '#d8ab40',
  fur: '#e4dccd',
  furShade: '#d6ccba',
  rug: ['#6b4a32', '#e6d9bf', '#a24a2c', '#7c8f6a', '#e6d9bf', '#a24a2c'],
  enamel: '#c0392b',
  cocoa: '#4a2a18',
  laptop: '#b8bcc2',
  screen: '#a9cbea',
  paper: '#efe6d0',
  ink: '#262220',
  books: ['#8e2a2a', '#2f5d3a', '#2a3556', '#c9a03b', '#e3d6b8', '#6e4a2a', '#4a6b7a'],
  pine: ['#2f5a3e', '#3a6a48', '#264c34'],
  sky: '#b9d4ea',
  snow: '#ffffff',
  rock: '#8693a3',
  frost: '#f3f7fa',
  ski: '#c0392b',
  skiBlue: '#2a5a8a',
  guitar: '#c4843f',
  coat: '#3d4a5a',
  antler: '#e2d3b5',
}

// ---------------------------------------------------------------- yapı

export function floor(f, width, depth, rnd) {
  f.box(0, FLOOR_BOTTOM, 0, width, -0.06 - FLOOR_BOTTOM, depth, C.floorBase)
  const row = 0.4
  for (let z = 0; z < depth - 1e-3; z += row) {
    const d = Math.min(row, depth - z)
    let x = 0
    let length = 0.3 + rnd() * 1.4
    while (x < width - 1e-3) {
      const w = Math.min(length, width - x)
      f.box(x, -0.06, z, w, 0.06, d, pick(rnd, C.planks))
      x += w
      length = 1.2 + rnd() * 1.4
    }
  }
}

function solidSpans(length, openings) {
  const spans = []
  let u = 0
  for (const [a, b] of openings) {
    if (a > u) spans.push([u, a])
    u = b
  }
  if (u < length) spans.push([u, length])
  return spans
}

// Kütük duvar. Yerel u boyunca uzanır, iç yüzey v = 0'da, kalınlık -v yönünde.
// openings: [[u0, u1]] pencere boşlukları. cutEnd: 'start' | 'end', kütük kesitinin göründüğü uç.
export function logWall(f, length, openings, cutEnd, rnd, room) {
  const sorted = [...openings].sort((a, b) => a[0] - b[0])
  f.box(0, FLOOR_BOTTOM, -WALL, length, -FLOOR_BOTTOM, WALL, C.foundation)
  for (let y = 0; y < WALL_HEIGHT - 1e-3; y += LOG) {
    const inWindow = y >= SILL - 1e-3 && y < WINDOW_TOP - 1e-3
    for (const [a, b] of inWindow ? solidSpans(length, sorted) : [[0, length]]) {
      f.box(a, y, -WALL + 0.04, b - a, CHINK, WALL - 0.06, C.chinking)
      f.box(a, y + CHINK, -WALL, b - a, LOG - CHINK, WALL, pick(rnd, C.logs))
    }
    const u = cutEnd === 'start' ? -0.012 : length
    f.box(u, y + CHINK, -WALL, 0.012, LOG - CHINK, WALL, C.endGrain)
    const ring = cutEnd === 'start' ? -0.016 : length
    f.box(ring, y + 0.1, -WALL + 0.08, 0.016, 0.1, WALL - 0.16, C.endRing)
  }
  for (const [a, b] of sorted) snowyWindow(f, a, b, room)
}

// Pencere ve dışarıdaki karlı manzara. Manzara cam katmanında: rengi gün zamanıyla çarpılır,
// gece kendiliğinden kararır. Camın ardında yağan kar SnowEffect'te (alanı room.snow'a).
function snowyWindow(f, a, b, room) {
  const w = b - a
  const h = WINDOW_TOP - SILL
  const glass = -WALL / 2

  f.box(a, SILL, glass - 0.012, w, h, 0.012, C.sky, GLASS)
  const peak = (center, width, height, offset) => {
    const steps = 5
    for (let i = 0; i < steps; i++) {
      const sw = width * (1 - i / steps)
      const color = i >= steps - 2 ? C.snow : C.rock
      f.box(a + center - sw / 2, SILL + h * 0.2 + (i * height) / steps, glass + offset, sw, height / steps, 0.003, color, GLASS)
    }
  }
  peak(w * 0.32, w * 0.62, h * 0.55, 0)
  peak(w * 0.74, w * 0.48, h * 0.4, 0.003)
  f.box(a, SILL, glass + 0.006, w, h * 0.24, 0.003, C.snow, GLASS)
  for (const [x, s] of [[0.12, 1], [0.25, 0.7], [0.86, 0.85]]) {
    const ph = h * 0.3 * s
    const pw = w * 0.16 * s
    for (let i = 0; i < 3; i++) {
      const sw = pw * (1 - i / 3)
      f.box(a + w * x - sw / 2, SILL + h * 0.16 + (i * ph) / 3, glass + 0.009, sw, ph / 3, 0.003, C.pine[0], GLASS)
    }
  }

  // kasa, kayıt ve iç pervaz
  const t = 0.07
  const fz = glass - 0.04
  room.snow.push({
    origin: f.point(a + t, SILL + t, glass + 0.02),
    across: f.point(1, 0, 0).sub(f.point(0, 0, 0)),
    width: w - 2 * t,
    height: h - 2 * t,
    quat: f.worldRotation(),
  })
  f.box(a, SILL, fz, w, t, 0.08, C.frame)
  f.box(a, WINDOW_TOP - t, fz, w, t, 0.08, C.frame)
  f.box(a, SILL, fz, t, h, 0.08, C.frame)
  f.box(b - t, SILL, fz, t, h, 0.08, C.frame)
  f.box((a + b) / 2 - 0.03, SILL, fz, 0.06, h, 0.08, C.frame)
  f.box(a, SILL + h / 2 - 0.03, fz, w, 0.06, 0.08, C.frame)
  f.box(a - 0.1, SILL - 0.1, 0, 0.1, h + 0.2, 0.04, C.trim)
  f.box(b, SILL - 0.1, 0, 0.1, h + 0.2, 0.04, C.trim)
  f.box(a - 0.14, WINDOW_TOP, 0, w + 0.28, 0.12, 0.05, C.trim)
  f.box(a - 0.14, SILL - 0.04, glass, w + 0.28, 0.06, -glass + 0.14, C.trim)

  // camın altındaki buzlanma
  for (const [u0, u1] of [[a + t, (a + b) / 2 - 0.03], [(a + b) / 2 + 0.03, b - t]]) {
    f.box(u0, SILL + t, glass + 0.041, u1 - u0, 0.035, 0.005, C.frost)
    f.box(u0, SILL + t + 0.035, glass + 0.041, 0.06, 0.04, 0.005, C.frost)
    f.box(u1 - 0.05, SILL + t + 0.035, glass + 0.041, 0.05, 0.03, 0.005, C.frost)
  }
}

// ---------------------------------------------------------------- şömine

// Rastgele genişlikte taş sıraları; aradaki derzlerden koyu harç görünür.
function stoneFace(f, x0, x1, y0, y1, front, rnd) {
  f.box(x0, y0, 0, x1 - x0, y1 - y0, front - 0.03, C.mortar)
  const rowHeight = 0.22
  let row = 0
  for (let y = y0; y < y1 - 1e-3; y += rowHeight, row++) {
    const h = Math.min(rowHeight, y1 - y)
    let x = x0
    let w = (row % 2 ? 0.14 : 0.26) + rnd() * 0.08
    while (x < x1 - 1e-3) {
      const bw = Math.min(w, x1 - x)
      const depth = front + (rnd() - 0.5) * 0.04
      f.box(x, y, 0, Math.max(bw - 0.014, 0.02), h - 0.014, depth, pick(rnd, C.stones))
      x += bw
      w = 0.22 + rnd() * 0.16
    }
  }
}

// Alevler şömine orijinine göre [x, z, genişlik, yükseklik, renk]; tabanları FLAME_BASE'de.
// Çizimi ve titremesi FireEffect.jsx'te.
export const FLAME_BASE = 0.24
export const FLAMES = [
  [-0.18, 0.33, 0.12, 0.28, C.flameOuter],
  [-0.04, 0.31, 0.14, 0.42, C.flameOuter],
  [0.12, 0.33, 0.12, 0.34, C.flameOuter],
  [0.24, 0.34, 0.08, 0.2, C.flameOuter],
  [-0.1, 0.43, 0.09, 0.2, C.flameMid],
  [0.05, 0.43, 0.1, 0.27, C.flameMid],
  [-0.02, 0.5, 0.07, 0.13, C.flameCore],
  [0.1, 0.5, 0.06, 0.1, C.flameCore],
]

// Taş şömine; orijin arka duvarın ortası. Ateşin konumunu room.fires'a yazar
// (alev, ışık ve ışık havuzu FireEffect'te canlandırılır).
export function fireplace(f, rnd, room) {
  const D = 0.62

  // ocak taşı
  f.box(-1.15, 0, 0, 2.3, 0.12, 1.0, C.mortar)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 2; j++) {
      f.box(-1.15 + i * 0.575, 0.1, j * 0.5, 0.56, 0.03, 0.486, pick(rnd, C.flagstones))
    }
  }

  stoneFace(f, -0.95, -0.5, 0.13, 1.4, D, rnd)
  stoneFace(f, 0.5, 0.95, 0.13, 1.4, D, rnd)
  stoneFace(f, -0.5, 0.5, 0.9, 1.4, D, rnd)
  f.box(-1.08, 1.4, 0, 2.16, 0.16, D + 0.14, C.woodDark)
  stoneFace(f, -0.68, 0.68, 1.56, WALL_HEIGHT, 0.44, rnd)

  // ocak içi
  f.box(-0.5, 0.13, 0, 1.0, 0.77, 0.16, C.soot)
  f.box(-0.5, 0.13, 0.16, 0.03, 0.77, D - 0.2, C.soot)
  f.box(0.47, 0.13, 0.16, 0.03, 0.77, D - 0.2, C.soot)
  f.box(-0.47, 0.13, 0.16, 0.94, 0.004, D - 0.16, C.soot)

  // ızgara, odunlar ve köz
  f.box(-0.32, 0.13, 0.24, 0.04, 0.08, 0.32, C.iron)
  f.box(0.28, 0.13, 0.24, 0.04, 0.08, 0.32, C.iron)
  f.box(-0.34, 0.2, 0.26, 0.68, 0.11, 0.11, C.barks[0])
  f.box(-0.3, 0.19, 0.4, 0.62, 0.1, 0.1, C.barks[1], { rot: [0, 0.15, 0] })
  f.box(-0.28, 0.134, 0.2, 0.56, 0.03, 0.34, C.ember, BULB)
  room.fires.push(f.point(0, 0, 0).toArray())

  // şömine rafı süsleri
  const m = f.frame(0, 1.56, 0.4)
  for (const [x, h] of [[-0.88, 0.16], [-0.76, 0.11]]) {
    m.box(x, 0, -0.03, 0.06, h, 0.06, C.wool)
    m.box(x + 0.02, h, -0.01, 0.02, 0.045, 0.02, C.flameCore, BULB)
  }
  m.box(-0.42, 0, -0.04, 0.08, 0.09, 0.08, C.enamel)
  m.box(0.16, 0, -0.03, 0.07, 0.08, 0.07, C.barks[2])
  m.box(0.27, 0, 0.0, 0.06, 0.07, 0.06, C.barks[0])
  m.box(0.55, 0, -0.12, 0.24, 0.2, 0.03, C.wood, { rot: [-0.15, 0, 0] })
  m.box(0.57, 0.02, -0.095, 0.2, 0.16, 0.012, C.sage, { rot: [-0.15, 0, 0] })

  antlers(f.frame(0, 2.3, 0.46))
}

function antlers(f) {
  f.box(-0.15, -0.2, 0, 0.3, 0.36, 0.04, C.woodDark)
  for (const side of [-1, 1]) {
    const beam = f.frame(side * 0.06, 0.06, 0.06, 0, 0, -side * 0.55)
    beam.box(-0.025, 0, -0.025, 0.05, 0.48, 0.05, C.antler)
    beam.frame(0, 0.2, 0, 0, 0, side * 0.9).box(-0.02, 0, -0.02, 0.04, 0.16, 0.04, C.antler)
    beam.frame(0, 0.34, 0, 0, 0, side * 0.9).box(-0.02, 0, -0.02, 0.04, 0.13, 0.04, C.antler)
  }
}

// Demir askıda istiflenmiş odun; kesitler +z'ye bakar.
export function firewood(f, rnd) {
  const W = 0.8
  const D = 0.42
  for (const z of [-D / 2, D / 2 - 0.03]) {
    f.box(-W / 2 - 0.03, 0, z, 0.03, 0.95, 0.03, C.iron)
    f.box(W / 2, 0, z, 0.03, 0.95, 0.03, C.iron)
    f.box(-W / 2 - 0.03, 0, z, W + 0.06, 0.03, 0.03, C.iron)
  }
  const s = 0.15
  for (let row = 0; row < 6; row++) {
    const offset = row % 2 ? s / 2 : 0
    for (let i = 0; i < 5; i++) {
      const x = -W / 2 + offset + i * s + 0.005
      if (x + s > W / 2 + 1e-3) break
      const y = 0.03 + row * (s - 0.006)
      f.box(x, y, -D / 2, s - 0.006, s - 0.006, D, pick(rnd, C.barks))
      f.box(x + 0.012, y + 0.012, D / 2, s - 0.03, s - 0.03, 0.006, C.logCut)
    }
  }
}

// ---------------------------------------------------------------- masalar

// Kalın tahta çiftlik masası; orijin sol-arka köşe. back: duvar tarafındaki sandalyeler
// (kameraya bakar), front: ön taraftaki banka oturanlar.
export function farmTable(f, { length, depth, back = 0, front = 0 }, rnd, room) {
  const H = TABLE_HEIGHT
  for (let i = 0; i < 3; i++) {
    f.box(0, H - 0.09, (i * depth) / 3, length, 0.09, depth / 3 - 0.008, pick(rnd, C.tableTop))
  }
  f.box(0.08, H - 0.2, 0.08, length - 0.16, 0.11, depth - 0.16, C.wood)
  const legU = [0.06, length - 0.2]
  if (length > 2.8) legU.push(length / 2 - 0.07)
  for (const u of legU) {
    f.box(u, 0, 0.06, 0.14, H - 0.09, 0.14, C.wood)
    f.box(u, 0, depth - 0.2, 0.14, H - 0.09, 0.14, C.wood)
  }
  f.box(0.12, 0.14, depth / 2 - 0.04, length - 0.24, 0.08, 0.08, C.wood)

  const seatsAt = (count) => Array.from({ length: count }, (_, i) => (length * (i + 0.5)) / count)
  const backSeats = seatsAt(back)
  const frontSeats = seatsAt(front)

  for (const u of backSeats) {
    const c = f.frame(u, 0, -0.3)
    chair(c)
    room.seats.push({ position: c.point(0, SEAT_HEIGHT, 0).toArray(), yaw: c.facing() })
    deskItems(f.frame(u, H, 0), rnd)
  }
  if (front > 0) {
    bench(f.frame(0.1, 0, depth + 0.12), length - 0.2)
    for (const u of frontSeats) {
      const c = f.frame(u, 0, depth + 0.3, Math.PI)
      room.seats.push({ position: c.point(0, BENCH_HEIGHT, 0).toArray(), yaw: c.facing() })
      deskItems(f.frame(u, H, depth, Math.PI), rnd)
    }
  }

  // Fenerler: iki yanlı masada orta hatta, tek yanlıda koltuk aralarında.
  let lanterns
  if (front > 0) {
    lanterns = (back >= front ? backSeats : frontSeats).map((u) => [u, depth / 2])
  } else if (back > 1) {
    lanterns = backSeats.slice(1).map((u, i) => [(u + backSeats[i]) / 2, depth * 0.62])
  } else {
    lanterns = [[Math.max(0.2, backSeats[0] - 0.45), depth * 0.6]]
  }
  for (const [u, v] of lanterns) {
    lantern(f.frame(u, H, v))
    const u0 = Math.max(0, u - 0.55)
    const v0 = Math.max(0, v - 0.45)
    f.glow(u0, H + 0.004, v0, Math.min(length, u + 0.55) - u0, Math.min(depth, v + 0.45) - v0)
  }

  room.lights.push(f.point(length / 2, H + 0.5, depth / 2).toArray())
}

// Masadaki eşyalar; t'nin orijini oturanın önündeki masa kenarı, +z masanın içine.
function deskItems(t, rnd) {
  const r = rnd()
  if (r < 0.4) {
    t.box(-0.17, 0, 0.1, 0.34, 0.02, 0.23, C.laptop)
    t.box(-0.15, 0.02, 0.12, 0.3, 0.003, 0.12, '#55595f')
    const s = t.frame(0, 0.02, 0.33, 0, 0.22)
    s.box(-0.17, 0, -0.015, 0.34, 0.23, 0.015, C.laptop)
    s.box(-0.155, 0.015, -0.018, 0.31, 0.2, 0.003, C.screen, BULB)
  } else if (r < 0.7) {
    t.box(-0.13, 0, 0.12, 0.26, 0.015, 0.2, pick(rnd, [C.sage, C.rust, C.skiBlue]))
    t.box(-0.11, 0.015, 0.13, 0.22, 0.004, 0.18, C.paper)
    t.box(0.16, 0, 0.16, 0.012, 0.012, 0.16, C.mustard)
  } else {
    t.box(-0.21, 0, 0.12, 0.42, 0.012, 0.28, pick(rnd, C.books))
    t.box(-0.2, 0.012, 0.13, 0.195, 0.02, 0.26, C.paper)
    t.box(0.005, 0.012, 0.13, 0.195, 0.02, 0.26, C.paper)
  }
  // kakao kupası, üstünde marshmallow
  t.box(0.27, 0, 0.18, 0.08, 0.1, 0.08, pick(rnd, [C.enamel, C.wool, C.sage]))
  t.box(0.28, 0.1, 0.19, 0.06, 0.004, 0.06, C.cocoa)
  t.box(0.295, 0.1, 0.2, 0.025, 0.02, 0.025, C.snow)
}

// Örgü minderli kır sandalyesi; oturan +z yönüne bakar, sırtlık -z tarafında.
export function chair(f) {
  for (const [x, z] of [[-0.22, -0.21], [0.16, -0.21], [-0.22, 0.16], [0.16, 0.16]]) {
    f.box(x, 0, z, 0.06, 0.42, 0.06, C.wood)
  }
  f.box(-0.23, 0.42, -0.22, 0.46, 0.05, 0.45, C.wood)
  f.box(-0.2, 0.47, -0.18, 0.4, 0.03, 0.38, C.plaidRed)
  f.box(-0.23, 0.47, -0.22, 0.06, 0.55, 0.06, C.wood)
  f.box(0.17, 0.47, -0.22, 0.06, 0.55, 0.06, C.wood)
  for (const y of [0.62, 0.78, 0.94]) f.box(-0.19, y, -0.21, 0.38, 0.06, 0.04, C.woodLight)
}

function bench(f, length) {
  f.box(0, 0.4, 0, length, 0.06, 0.35, C.tableTop[0])
  f.box(0.12, 0, 0.04, 0.08, 0.4, 0.27, C.wood)
  f.box(length - 0.2, 0, 0.04, 0.08, 0.4, 0.27, C.wood)
  f.box(0.12, 0.15, 0.14, length - 0.24, 0.06, 0.07, C.wood)
}

export function lantern(f) {
  f.box(-0.08, 0, -0.08, 0.16, 0.025, 0.16, C.iron)
  f.box(-0.06, 0.025, -0.06, 0.12, 0.16, 0.12, '#ffffff', BULB)
  for (const [x, z] of [[-0.08, -0.08], [0.06, -0.08], [-0.08, 0.06], [0.06, 0.06]]) {
    f.box(x, 0.025, z, 0.02, 0.16, 0.02, C.iron)
  }
  f.box(-0.08, 0.185, -0.08, 0.16, 0.03, 0.16, C.iron)
  f.box(-0.05, 0.215, -0.05, 0.1, 0.03, 0.1, C.iron)
  f.box(-0.04, 0.245, -0.008, 0.08, 0.02, 0.016, C.iron)
}

// ---------------------------------------------------------------- oturma

// Pencere önü minderli oturma; orijin sol-arka köşe, u = uzunluk.
export function windowSeat(f, length) {
  f.box(0, 0, 0, length, 0.42, 0.55, C.wood)
  f.box(0.08, 0.08, 0.55, length - 0.16, 0.26, 0.012, C.woodLight)
  f.box(0.03, 0.42, 0.02, length - 0.06, 0.1, 0.52, C.wool)
  f.box(0.08, 0.52, 0.04, 0.3, 0.26, 0.12, C.plaidRed, { rot: [-0.3, 0, 0] })
  f.box(length - 0.4, 0.52, 0.04, 0.28, 0.24, 0.12, C.mustard, { rot: [-0.3, 0, 0] })
  f.box(length * 0.45, 0.52, 0.22, 0.32, 0.05, 0.26, C.sage)
  f.box(length * 0.45, 0.57, 0.24, 0.32, 0.04, 0.22, C.wool)
}

const FABRIC = {
  sage: [C.sage, C.sageLight],
  rust: [C.rust, C.rustLight],
  mustard: [C.mustard, C.mustardLight],
}

export function armchair(f, color = 'sage') {
  const [main, light] = FABRIC[color]
  for (const [x, z] of [[-0.4, -0.36], [0.34, -0.36], [-0.4, 0.3], [0.34, 0.3]]) {
    f.box(x, 0, z, 0.06, 0.1, 0.06, C.woodDark)
  }
  f.box(-0.42, 0.1, -0.38, 0.84, 0.3, 0.76, main)
  f.box(-0.3, 0.4, -0.22, 0.6, 0.12, 0.58, light)
  f.box(-0.42, 0.4, -0.38, 0.12, 0.28, 0.76, main)
  f.box(0.3, 0.4, -0.38, 0.12, 0.28, 0.76, main)
  f.box(-0.42, 0.4, -0.38, 0.84, 0.62, 0.16, main)
  // sırtlığa atılmış ekose battaniye
  f.box(-0.3, 0.62, -0.42, 0.42, 0.44, 0.05, C.plaidRed)
  f.box(-0.3, 1.0, -0.4, 0.42, 0.04, 0.2, C.plaidRed)
}

export function sofa(f) {
  const [main, light] = FABRIC.rust
  for (const x of [-0.95, 0.89]) {
    f.box(x, 0, -0.38, 0.06, 0.1, 0.06, C.woodDark)
    f.box(x, 0, 0.32, 0.06, 0.1, 0.06, C.woodDark)
  }
  f.box(-1, 0.1, -0.42, 2, 0.3, 0.84, main)
  f.box(-0.86, 0.4, -0.24, 0.85, 0.12, 0.64, light)
  f.box(0.01, 0.4, -0.24, 0.85, 0.12, 0.64, light)
  f.box(-1, 0.4, -0.42, 0.14, 0.3, 0.84, main)
  f.box(0.86, 0.4, -0.42, 0.14, 0.3, 0.84, main)
  f.box(-1, 0.4, -0.42, 2, 0.55, 0.18, main)
  f.box(-0.8, 0.52, -0.25, 0.32, 0.3, 0.12, C.wool, { rot: [-0.25, 0, 0] })
  f.box(0.45, 0.52, -0.25, 0.32, 0.3, 0.12, C.plaidRed, { rot: [-0.25, 0, 0] })
  f.box(0.1, 0.52, -0.05, 0.5, 0.05, 0.4, C.sage)
}

// ---------------------------------------------------------------- eşyalar

// Kakao köşesi: dolap, emaye çaydanlık, kupalar, marshmallow kavanozu. Çaydanlığın ağzından
// çıkan buhar noktası room.steams'e.
export function cocoaCorner(f, room) {
  const W = 0.9
  const D = 0.5
  const H = 0.86
  f.box(-W / 2, 0, -D / 2, W, 0.06, D, C.woodDark)
  f.box(-W / 2 + 0.02, 0.06, -D / 2, W - 0.04, H - 0.1, D - 0.02, C.wood)
  f.box(-W / 2 + 0.06, 0.12, D / 2 - 0.02, W / 2 - 0.09, H - 0.24, 0.02, C.woodLight)
  f.box(0.03, 0.12, D / 2 - 0.02, W / 2 - 0.09, H - 0.24, 0.02, C.woodLight)
  f.box(-0.06, 0.45, D / 2, 0.025, 0.06, 0.02, C.brass)
  f.box(0.035, 0.45, D / 2, 0.025, 0.06, 0.02, C.brass)
  f.box(-W / 2 - 0.03, H - 0.04, -D / 2, W + 0.06, 0.05, D + 0.03, C.tableTop[1])

  const top = H + 0.01
  f.box(-0.36, top, -0.13, 0.28, 0.012, 0.26, C.iron)
  const k = f.frame(-0.22, top + 0.012, 0)
  k.box(-0.12, 0, -0.1, 0.24, 0.17, 0.2, C.enamel)
  k.box(-0.09, 0.17, -0.07, 0.18, 0.03, 0.14, C.enamel)
  k.box(-0.02, 0.2, -0.02, 0.04, 0.03, 0.04, C.iron)
  k.box(0.12, 0.06, -0.02, 0.08, 0.04, 0.04, C.enamel)
  k.box(-0.08, 0.23, -0.015, 0.16, 0.03, 0.03, C.iron)
  room.steams.push(k.point(0.19, 0.11, 0).toArray())
  ;[C.enamel, C.wool, C.sage].forEach((color, i) => {
    f.box(0.02 + i * 0.1, top, -0.12 + (i % 2) * 0.1, 0.08, 0.1, 0.08, color)
  })
  f.box(0.3, top, 0.02, 0.11, 0.16, 0.11, '#d4e3e6')
  f.box(0.31, top + 0.16, 0.03, 0.09, 0.03, 0.09, C.woodLight)
  f.box(0.2, top, 0.1, 0.03, 0.03, 0.03, C.snow)
}

// Fıçıda küçük köknar.
export function firPlant(f) {
  f.box(-0.25, 0, -0.25, 0.5, 0.45, 0.5, C.woodLight)
  f.box(-0.26, 0.08, -0.26, 0.52, 0.04, 0.52, C.iron)
  f.box(-0.26, 0.33, -0.26, 0.52, 0.04, 0.52, C.iron)
  f.box(-0.22, 0.45, -0.22, 0.44, 0.01, 0.44, C.cocoa)
  f.box(-0.04, 0.45, -0.04, 0.08, 0.15, 0.08, C.barks[0])
  ;[0.74, 0.58, 0.44, 0.3, 0.16].forEach((size, i) => {
    f.box(-size / 2, 0.55 + i * 0.22, -size / 2, size, 0.3, size, C.pine[i % C.pine.length])
  })
}

// Duvara yaslı kayaklar ve batonlar; orijin duvar dibi, +z odaya doğru.
export function skis(f) {
  const lean = -Math.atan2(0.28, 1.75)
  for (const x of [-0.12, -0.02]) {
    const s = f.frame(x, 0, 0.3, 0, lean)
    s.box(0, 0, -0.012, 0.075, 1.7, 0.024, C.ski)
    s.frame(0, 1.7, 0, 0, 0.5).box(0, 0, -0.012, 0.075, 0.14, 0.024, C.ski)
    s.box(-0.005, 0.72, 0.012, 0.085, 0.12, 0.04, C.iron)
  }
  for (const x of [0.14, 0.22]) {
    const p = f.frame(x, 0, 0.34, 0, lean * 1.05)
    p.box(-0.012, 0, -0.012, 0.024, 1.3, 0.024, C.iron)
    p.box(-0.06, 0.1, -0.06, 0.12, 0.012, 0.12, C.ink)
    p.box(-0.02, 1.15, -0.02, 0.04, 0.15, 0.04, C.skiBlue)
  }
}

// Duvara yaslı akustik gitar.
export function guitar(f) {
  const g = f.frame(0, 0, 0.22, 0, -0.14)
  g.box(-0.2, 0.02, -0.06, 0.4, 0.34, 0.1, C.guitar)
  g.box(-0.15, 0.36, -0.06, 0.3, 0.22, 0.1, C.guitar)
  g.box(-0.05, 0.3, 0.04, 0.1, 0.1, 0.005, C.ink)
  g.box(-0.06, 0.12, 0.04, 0.12, 0.03, 0.01, C.woodDark)
  g.box(-0.03, 0.58, -0.03, 0.06, 0.55, 0.05, C.woodDark)
  g.box(-0.045, 1.13, -0.035, 0.09, 0.14, 0.05, C.woodDark)
}

// Kürk post; orijin merkez.
export function furRug(f, w, d) {
  f.box(-w / 2, 0, -d / 2, w, 0.03, d, C.fur)
  f.box(-w / 2 - 0.12, 0, -d * 0.3, 0.12, 0.025, d * 0.6, C.fur)
  f.box(w / 2, 0, -d * 0.25, 0.12, 0.025, d * 0.5, C.fur)
  f.box(-w * 0.3, 0, d / 2, w * 0.6, 0.025, 0.1, C.fur)
  f.box(-w * 0.35, 0.03, -d * 0.3, w * 0.7, 0.008, d * 0.6, C.furShade)
}

// Örgü halı; orijin sol-arka köşe, iç içe renk halkaları.
export function braidedRug(f, w, d) {
  C.rug.forEach((color, i) => {
    const inset = i * 0.18
    if (w - 2 * inset < 0.3 || d - 2 * inset < 0.3) return
    f.box(inset, i * 0.004, inset, w - 2 * inset, 0.004, d - 2 * inset, color)
  })
}

// ---------------------------------------------------------------- duvar süsleri
// Orijin duvar yüzeyinde, +z odanın içine doğru.

// Raf; orijin sol uç, y = alt rafın yüksekliği.
export function wallShelf(f, length, rnd) {
  for (const y of [0, 0.42]) {
    f.box(0, y, 0, length, 0.04, 0.24, C.woodLight)
    f.box(0.12, y - 0.14, 0, 0.04, 0.14, 0.18, C.iron)
    f.box(length - 0.16, y - 0.14, 0, 0.04, 0.14, 0.18, C.iron)
  }
  let u = 0.06
  while (u < length * 0.55) {
    const w = 0.04 + rnd() * 0.04
    f.box(u, 0.04, 0.03, w, 0.18 + rnd() * 0.12, 0.17, pick(rnd, C.books))
    u += w
  }
  f.box(length * 0.66, 0.04, 0.05, 0.1, 0.16, 0.1, '#c9dde0')
  f.box(length * 0.66 + 0.01, 0.2, 0.06, 0.08, 0.03, 0.08, C.woodLight)
  f.box(length * 0.84, 0.04, 0.08, 0.06, 0.12, 0.06, C.wool)
  f.box(length * 0.84 + 0.02, 0.16, 0.1, 0.02, 0.04, 0.02, C.flameCore, BULB)
  // üst raf: saksı ve yatık kitaplar
  f.box(0.1, 0.46, 0.05, 0.14, 0.12, 0.14, C.rust)
  f.box(0.07, 0.58, 0.02, 0.2, 0.16, 0.2, C.pine[1])
  let y = 0.46
  for (let i = 0; i < 3; i++) {
    const h = 0.04 + rnd() * 0.02
    f.box(length * 0.45, y, 0.03, 0.24, h, 0.18, pick(rnd, C.books))
    y += h
  }
  f.box(length * 0.78, 0.46, 0.08, 0.07, 0.08, 0.07, C.barks[2])
}

export function sconce(f) {
  f.box(-0.05, -0.14, 0, 0.1, 0.26, 0.03, C.iron)
  f.box(-0.015, 0.02, 0.03, 0.03, 0.03, 0.14, C.iron)
  lantern(f.frame(0, -0.22, 0.17))
}
