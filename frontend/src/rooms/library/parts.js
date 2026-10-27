import { pick } from '../core/voxel'

// Kütüphane temasının voxel parçaları. Birim ≈ 1 metre.
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür.

export const WALL = 0.25
export const FLOOR_BOTTOM = -0.32
export const SEAT_HEIGHT = 0.5
const SILL = 0.95
const WINDOW_TOP = 2.7
const SHELF_DEPTH = 0.42
const TABLE_HEIGHT = 0.76

export const C = {
  wall: '#cbb693',
  wallCap: '#d6c8ad',
  wainscot: '#4a2817',
  molding: '#603822',
  floorBase: '#6b4224',
  planks: ['#b47c47', '#a9723f', '#bb8650', '#a46c3b'],
  wood: '#3f2314',
  woodDark: '#2c170b',
  woodMid: '#5c341d',
  woodLight: '#7d4c2b',
  leather: '#2f5c3d',
  brass: '#c99b3d',
  lampGreen: '#2c6b45',
  lampGreenDark: '#225435',
  paper: '#efe6d0',
  cream: '#e8dcc2',
  ink: '#262220',
  books: [
    '#8e2a2a', '#a23a2c', '#6e1f2e', '#7d2630',
    '#2f5d3a', '#24503a', '#3d6e4a',
    '#1f4060', '#2a3556',
    '#c9a03b', '#e3d6b8', '#7a4a2a',
  ],
  rug: '#8a2522',
  rugField: '#a3302b',
  rugTrim: '#c58d3d',
  cushion: '#2f5470',
  mustard: '#c99a2e',
  leaves: ['#4f8a3a', '#5f9c45', '#3f7530'],
  pot: '#b65a33',
  potRim: '#9e4a2a',
  soil: '#3a2414',
  steel: '#c5c9ce',
  steelDark: '#9ea3a9',
  porcelain: '#f1ede4',
  tea: '#9c3a1a',
  ocean: '#2f6f9e',
  land: '#5b9a45',
  armchair: '#6e2a22',
  armchairLight: '#833529',
  marble: '#ddd8cf',
  marbleDark: '#c4bdb1',
}

// ---------------------------------------------------------------- yapı

export function floor(f, width, depth, rnd) {
  f.box(0, FLOOR_BOTTOM, 0, width, -0.06 - FLOOR_BOTTOM, depth, C.floorBase)
  const row = 0.5
  for (let z = 0; z < depth - 1e-3; z += row) {
    const d = Math.min(row, depth - z)
    let x = 0
    let length = 0.4 + rnd() * 1.6
    while (x < width - 1e-3) {
      const w = Math.min(length, width - x)
      f.box(x, -0.06, z, w, 0.06, d, pick(rnd, C.planks))
      x += w
      length = 1.6 + rnd() * 1.4
    }
  }
}

// Arka duvar z = 0 boyunca, sol duvar x = 0 boyunca. Ön iki duvar kesik (izometrik görünüm).
// windows: sol duvardaki pencereler [{ at: z merkezi, width }]
export function walls(f, width, depth, height, windows = []) {
  const lowerHeight = SILL - FLOOR_BOTTOM

  // arka duvar
  f.box(-WALL, FLOOR_BOTTOM, -WALL, width + WALL, lowerHeight, WALL, C.wainscot)
  f.box(-WALL, SILL, -WALL, width + WALL, height - SILL, WALL, C.wall)
  f.box(-WALL, height, -WALL, width + WALL, 0.05, WALL, C.wallCap)
  f.box(0, SILL, 0, width, 0.06, 0.035, C.molding)

  // sol duvar, pencere boşluklarıyla
  f.box(-WALL, FLOOR_BOTTOM, 0, WALL, lowerHeight, depth, C.wainscot)
  f.box(-WALL, height, 0, WALL, 0.05, depth, C.wallCap)
  const openings = windows
    .map(({ at, width: w = 1.1 }) => [at - w / 2, at + w / 2])
    .sort((a, b) => a[0] - b[0])
  let z = 0
  for (const [a, b] of openings) {
    if (a > z) {
      f.box(-WALL, SILL, z, WALL, height - SILL, a - z, C.wall)
      f.box(0, SILL, z, 0.035, 0.06, a - z, C.molding)
    }
    // komşu parçalara 2 cm taşır: aynı renkli üst üste yüzler görünmez, birleşim çatlağını kapatır
    f.box(-WALL, WINDOW_TOP, a - 0.02, WALL, height - WINDOW_TOP, b - a + 0.04, C.wall)
    windowFrame(f, a, b)
    z = b
  }
  if (z < depth) {
    f.box(-WALL, SILL, z, WALL, height - SILL, depth - z, C.wall)
    f.box(0, SILL, z, 0.035, 0.06, depth - z, C.molding)
  }
}

function windowFrame(f, a, b) {
  const h = WINDOW_TOP - SILL
  const x = -WALL / 2 - 0.05
  const t = 0.07
  f.box(-WALL / 2 - 0.01, SILL, a, 0.02, h, b - a, '#ffffff', { layer: 'glass' })
  f.box(x, SILL, a, 0.1, t, b - a, C.woodDark)
  f.box(x, WINDOW_TOP - t, a, 0.1, t, b - a, C.woodDark)
  f.box(x, SILL, a, 0.1, h, t, C.woodDark)
  f.box(x, SILL, b - t, 0.1, h, t, C.woodDark)
  f.box(x, SILL, (a + b) / 2 - 0.03, 0.1, h, 0.06, C.woodDark)
  f.box(x, SILL + h / 3 - 0.025, a, 0.1, 0.05, b - a, C.woodDark)
  f.box(x, SILL + (2 * h) / 3 - 0.025, a, 0.1, 0.05, b - a, C.woodDark)
  // iç denizlik
  f.box(0, SILL - 0.06, a - 0.08, 0.14, 0.06, b - a + 0.16, C.woodMid)
}

export function rug(f, w, d) {
  f.box(0, 0, 0, w, 0.012, d, C.rug)
  f.box(0.18, 0.012, 0.18, w - 0.36, 0.006, d - 0.36, C.rugField)
  const inset = 0.34
  const t = 0.05
  const y = 0.018
  f.box(inset, y, inset, w - 2 * inset, 0.003, t, C.rugTrim)
  f.box(inset, y, d - inset - t, w - 2 * inset, 0.003, t, C.rugTrim)
  f.box(inset, y, inset + t, t, 0.003, d - 2 * inset - 2 * t, C.rugTrim)
  f.box(w - inset - t, y, inset + t, t, 0.003, d - 2 * inset - 2 * t, C.rugTrim)
  const mw = Math.min(1, w * 0.3)
  const md = Math.min(0.7, d * 0.3)
  f.box(w / 2 - mw / 2, y, d / 2 - md / 2, mw, 0.003, md, C.rug)
  f.box(w / 2 - mw / 4, y + 0.003, d / 2 - md / 4, mw / 2, 0.002, md / 2, C.rugTrim)
}

// ---------------------------------------------------------------- raflar

// Duvara dayalı kitaplık dizisi. Orijin sol-arka köşe, u = yerel x boyunca uzunluk.
export function shelfRun(f, length, height, rnd, { ladders = [] } = {}) {
  const sections = Math.max(1, Math.round(length / 1.15))
  const sectionWidth = length / sections
  const D = SHELF_DEPTH
  const top = height - 0.12
  const bottom = 0.14

  f.box(0, 0, 0, length, top, 0.04, C.woodDark)
  f.box(0, 0, 0.04, length, bottom, D - 0.06, C.wood)
  f.box(-0.04, top, 0, length + 0.08, 0.12, D + 0.04, C.wood)
  for (let i = 0; i <= sections; i++) {
    const u = Math.min(Math.max(i * sectionWidth - 0.035, 0), length - 0.07)
    f.box(u, 0, 0.04, 0.07, top, D - 0.04, C.wood)
  }

  const levels = 5
  const gap = (top - bottom) / levels
  for (let level = 0; level < levels; level++) {
    const y = bottom + level * gap
    if (level > 0) f.box(0, y - 0.035, 0.04, length, 0.035, D - 0.05, C.woodMid)
    for (let i = 0; i < sections; i++) {
      bookRow(f, i * sectionWidth + 0.035, (i + 1) * sectionWidth - 0.035, y, gap - 0.07, D, rnd)
    }
  }

  if (ladders.length > 0) {
    f.box(0.05, top - 0.3, D + 0.04, length - 0.1, 0.03, 0.03, C.brass)
    for (const u of ladders) ladder(f.frame(u, 0, D + 0.7), top - 0.28, 0.66)
  }
}

function bookRow(f, u0, u1, y, maxHeight, shelfDepth, rnd) {
  const front = shelfDepth - 0.04
  let u = u0 + 0.01
  while (u < u1 - 0.05) {
    const r = rnd()
    if (r < 0.06) {
      u += 0.08 + rnd() * 0.12
      continue
    }
    if (r < 0.11 && u1 - u > 0.32) {
      // yatık kitap yığını
      const w = 0.22 + rnd() * 0.06
      let stackY = y
      const count = 2 + Math.floor(rnd() * 3)
      for (let k = 0; k < count; k++) {
        const h = 0.04 + rnd() * 0.03
        f.box(u + rnd() * 0.02, stackY, front - 0.24, w, h, 0.24, pick(rnd, C.books))
        stackY += h
      }
      u += w + 0.03
      continue
    }
    const w = 0.05 + rnd() * 0.06
    if (u + w > u1) break
    const h = maxHeight * (0.62 + rnd() * 0.36)
    const d = 0.22 + rnd() * 0.08
    f.box(u, y, front - d, w, h, d, pick(rnd, C.books))
    if (rnd() < 0.22) f.box(u, y + h * 0.78, front, w, 0.018, 0.006, C.brass)
    u += w
  }
}

// Kayan kütüphane merdiveni; orijin ayak hizası, üst ucu -z yönünde rafa yaslanır.
function ladder(f, height, lean) {
  const length = Math.hypot(height, lean)
  const l = f.frame(0, 0, 0, 0, -Math.atan2(lean, height))
  l.box(-0.25, 0, -0.025, 0.05, length, 0.05, C.woodMid)
  l.box(0.2, 0, -0.025, 0.05, length, 0.05, C.woodMid)
  for (let y = 0.3; y < length - 0.1; y += 0.32) {
    l.box(-0.2, y, -0.02, 0.4, 0.035, 0.04, C.woodLight)
  }
  l.box(-0.27, length - 0.04, -0.05, 0.54, 0.04, 0.05, C.brass)
}

// ---------------------------------------------------------------- masalar

// Okuma masası; orijin sol-arka köşe. back: duvar tarafındaki koltuk sayısı (kameraya bakar),
// front: ön taraftaki koltuk sayısı. Koltuklar ve ışık konumu room'a yazılır.
export function readingTable(f, { length, depth, back = 0, front = 0 }, rnd, room) {
  const H = TABLE_HEIGHT
  f.box(0, H - 0.06, 0, length, 0.06, depth, C.wood)
  f.box(0.1, H, 0.1, length - 0.2, 0.006, depth - 0.2, C.leather)
  f.box(0.06, H - 0.16, 0.06, length - 0.12, 0.1, depth - 0.12, C.woodDark)
  f.box(0.12, 0.12, depth / 2 - 0.03, length - 0.24, 0.05, 0.06, C.woodDark)
  const legU = [0.05, length - 0.15]
  if (length > 2.8) legU.push(length / 2 - 0.05)
  for (const u of legU) {
    f.box(u, 0, 0.05, 0.1, H - 0.06, 0.1, C.woodDark)
    f.box(u, 0, depth - 0.15, 0.1, H - 0.06, 0.1, C.woodDark)
  }

  const seatsAt = (count) => Array.from({ length: count }, (_, i) => (length * (i + 0.5)) / count)
  const backSeats = seatsAt(back)
  const frontSeats = seatsAt(front)

  for (const u of backSeats) seat(f, u, -0.3, 0, H, rnd, room)
  for (const u of frontSeats) seat(f, u, depth + 0.3, Math.PI, H, rnd, room)

  // Lambalar: iki yanlı masada orta hatta, tek yanlıda koltuk aralarında.
  let lampSpots
  if (front > 0) {
    lampSpots = (back >= front ? backSeats : frontSeats).map((u) => [u, depth / 2])
  } else if (back > 1) {
    lampSpots = backSeats.slice(1).map((u, i) => [(u + backSeats[i]) / 2, depth * 0.62])
  } else {
    lampSpots = [[Math.max(0.25, backSeats[0] - 0.5), depth * 0.55]]
  }
  for (const [u, v] of lampSpots) {
    bankerLamp(f.frame(u, H + 0.006, v))
    // ışık havuzu masanın dışına taşmasın
    const u0 = Math.max(0, u - 0.6)
    const v0 = Math.max(0, v - 0.5)
    f.glow(u0, H + 0.01, v0, Math.min(length, u + 0.6) - u0, Math.min(depth, v + 0.5) - v0)
  }

  room.lights.push(f.point(length / 2, H + 0.5, depth / 2).toArray())
}

function seat(f, u, v, yaw, tableHeight, rnd, room) {
  const c = f.frame(u, 0, v, yaw)
  chair(c)
  room.seats.push({ position: c.point(0, SEAT_HEIGHT, 0).toArray(), yaw: c.facing() })

  // masadaki eşyalar, koltuğa bakan kenardan masanın içine doğru (+z)
  const t = f.frame(u, tableHeight + 0.006, yaw === 0 ? 0 : v - 0.3, yaw)
  openBook(t, rnd)
  const r = rnd()
  if (r < 0.4) {
    t.box(0.3, 0, 0.14, 0.16, 0.012, 0.22, '#e9e4d8')
    t.box(0.33, 0.012, 0.17, 0.012, 0.012, 0.16, '#d9a63a')
  } else if (r < 0.7) {
    t.box(-0.42, 0, 0.18, 0.08, 0.1, 0.08, C.porcelain)
    t.box(-0.41, 0.1, 0.19, 0.06, 0.002, 0.06, '#3a2416')
  } else {
    let y = 0
    for (let k = 0; k < 3; k++) {
      const h = 0.04 + rnd() * 0.02
      t.box(0.28 + rnd() * 0.03, y, 0.12 + rnd() * 0.03, 0.2, h, 0.26, pick(rnd, C.books))
      y += h
    }
  }
}

function openBook(t, rnd) {
  t.box(-0.21, 0, 0.12, 0.42, 0.012, 0.28, pick(rnd, ['#6e1f2e', '#24503a', '#2a3556']))
  t.box(-0.2, 0.012, 0.13, 0.195, 0.02, 0.26, C.paper)
  t.box(0.005, 0.012, 0.13, 0.195, 0.02, 0.26, C.paper)
}

// Koltuk; oturan +z yönüne bakar, sırtlık -z tarafında.
export function chair(f, color = C.wood) {
  for (const [x, z] of [[-0.21, -0.21], [0.16, -0.21], [-0.21, 0.16], [0.16, 0.16]]) {
    f.box(x, 0, z, 0.05, 0.42, 0.05, color)
  }
  f.box(-0.23, 0.42, -0.23, 0.46, 0.05, 0.46, color)
  f.box(-0.2, 0.47, -0.19, 0.4, 0.03, 0.39, C.leather)
  f.box(-0.23, 0.47, -0.23, 0.05, 0.45, 0.05, color)
  f.box(0.18, 0.47, -0.23, 0.05, 0.45, 0.05, color)
  f.box(-0.23, 0.9, -0.24, 0.46, 0.09, 0.06, color)
  f.box(-0.07, 0.5, -0.225, 0.04, 0.4, 0.03, color)
  f.box(0.03, 0.5, -0.225, 0.04, 0.4, 0.03, color)
}

export function bankerLamp(f) {
  f.box(-0.1, 0, -0.07, 0.2, 0.03, 0.14, C.brass)
  f.box(-0.015, 0.03, -0.015, 0.03, 0.24, 0.03, C.brass)
  f.box(-0.2, 0.26, -0.09, 0.4, 0.07, 0.18, C.lampGreen)
  f.box(-0.19, 0.33, -0.06, 0.38, 0.03, 0.12, C.lampGreenDark)
  f.box(-0.17, 0.245, -0.07, 0.34, 0.015, 0.14, '#ffffff', { layer: 'bulb' })
  f.box(0.1, 0.17, -0.005, 0.01, 0.09, 0.01, C.brass)
}

// ---------------------------------------------------------------- mobilyalar

// Pencere önü minderli bank; orijin sol-arka köşe, u = uzunluk.
export function windowBench(f, length) {
  f.box(0, 0, 0, length, 0.08, 0.55, C.woodDark)
  f.box(0.02, 0.08, 0.02, length - 0.04, 0.34, 0.52, C.wood)
  const panel = (length - 0.36) / 2
  f.box(0.12, 0.14, 0.54, panel, 0.22, 0.012, C.woodMid)
  f.box(0.24 + panel, 0.14, 0.54, panel, 0.22, 0.012, C.woodMid)
  f.box(0.04, 0.42, 0.03, length - 0.08, 0.11, 0.5, C.cushion)
  f.box(0.15, 0.53, 0.05, 0.32, 0.24, 0.12, C.mustard, { rot: [-0.3, 0, 0] })
}

export function teaCorner(f) {
  const W = 0.8
  const D = 0.5
  const H = 0.78
  const x0 = -W / 2
  const z0 = -D / 2
  for (const [x, z] of [[0.02, 0.02], [W - 0.07, 0.02], [0.02, D - 0.07], [W - 0.07, D - 0.07]]) {
    f.box(x0 + x, 0, z0 + z, 0.05, H - 0.05, 0.05, C.woodMid)
  }
  f.box(x0, H - 0.05, z0, W, 0.05, D, C.woodLight)
  f.box(x0 + 0.04, 0.22, z0 + 0.04, W - 0.08, 0.03, D - 0.08, C.woodMid)

  // çaydanlık (alt demlik çelik, üst demlik porselen)
  const k = f.frame(x0 + 0.18, H, z0 + 0.25)
  k.box(-0.12, 0, -0.12, 0.24, 0.18, 0.24, C.steel)
  k.box(-0.09, 0.18, -0.09, 0.18, 0.02, 0.18, C.steelDark)
  k.box(-0.07, 0.2, -0.07, 0.14, 0.14, 0.14, C.porcelain)
  k.box(-0.072, 0.29, -0.072, 0.144, 0.025, 0.144, '#b8322a')
  k.box(-0.015, 0.34, -0.015, 0.03, 0.03, 0.03, C.porcelain)
  k.box(0.12, 0.06, -0.02, 0.07, 0.04, 0.04, C.steel)
  k.box(-0.18, 0.08, -0.02, 0.06, 0.03, 0.04, C.woodDark)

  // tepside ince belli bardaklar ve şekerlik
  f.box(x0 + 0.36, H, z0 + 0.08, 0.4, 0.012, 0.34, C.steel)
  for (let i = 0; i < 3; i++) {
    const x = x0 + 0.39 + i * 0.11
    const z = z0 + 0.12 + (i % 2) * 0.12
    f.box(x, H + 0.012, z, 0.08, 0.01, 0.08, C.porcelain)
    f.box(x + 0.025, H + 0.022, z + 0.025, 0.03, 0.075, 0.03, C.tea)
    f.box(x + 0.02, H + 0.097, z + 0.02, 0.04, 0.012, 0.04, '#e9d9c4')
  }
  f.box(x0 + 0.62, H + 0.012, z0 + 0.32, 0.09, 0.07, 0.09, C.porcelain)
  f.box(x0 + 0.645, H + 0.082, z0 + 0.345, 0.04, 0.015, 0.04, C.porcelain)

  // alt raf
  f.box(x0 + 0.08, 0.25, z0 + 0.12, 0.16, 0.2, 0.16, '#8e2a2a')
  f.box(x0 + 0.08, 0.45, z0 + 0.12, 0.16, 0.02, 0.16, C.brass)
  f.box(x0 + 0.4, 0.25, z0 + 0.15, 0.1, 0.05, 0.1, C.porcelain)
  f.box(x0 + 0.41, 0.3, z0 + 0.16, 0.08, 0.05, 0.08, C.porcelain)
}

export function plant(f) {
  f.box(-0.25, 0, -0.25, 0.5, 0.48, 0.5, C.pot)
  f.box(-0.28, 0.44, -0.28, 0.56, 0.08, 0.56, C.potRim)
  f.box(-0.22, 0.52, -0.22, 0.44, 0.01, 0.44, C.soil)
  f.box(-0.04, 0.52, -0.04, 0.08, 0.75, 0.08, '#4a2e18')
  const leaves = [
    [0, 1.25, 0, 0.62],
    [-0.22, 1.02, 0.14, 0.42],
    [0.22, 1.08, -0.12, 0.46],
    [0.05, 1.62, 0.04, 0.46],
    [-0.16, 1.48, -0.16, 0.34],
    [0.18, 1.45, 0.2, 0.3],
  ]
  leaves.forEach(([x, y, z, s], i) => {
    f.box(x - s / 2, y - s / 2, z - s / 2, s, s, s, C.leaves[i % C.leaves.length])
  })
}

export function globe(f) {
  for (const [x, z] of [[-0.2, -0.2], [0.15, -0.2], [-0.2, 0.15], [0.15, 0.15]]) {
    f.box(x, 0, z, 0.05, 0.62, 0.05, C.woodMid)
  }
  f.box(-0.18, 0.2, -0.18, 0.36, 0.03, 0.36, C.woodMid)
  f.box(-0.25, 0.62, -0.25, 0.5, 0.05, 0.5, C.wood)
  f.box(-0.04, 0.67, -0.04, 0.08, 0.06, 0.08, C.brass)
  const g = f.frame(0, 1.0, 0, 0.5, 0, 0.4)
  g.box(-0.02, -0.36, -0.02, 0.04, 0.72, 0.04, C.brass)
  g.box(-0.22, -0.22, -0.22, 0.44, 0.44, 0.44, C.ocean)
  g.box(-0.27, -0.16, -0.16, 0.54, 0.32, 0.32, C.ocean)
  g.box(-0.16, -0.27, -0.16, 0.32, 0.54, 0.32, C.ocean)
  g.box(-0.16, -0.16, -0.27, 0.32, 0.32, 0.54, C.ocean)
  g.box(-0.1, -0.02, 0.26, 0.2, 0.16, 0.02, C.land)
  g.box(0.02, -0.14, 0.26, 0.1, 0.12, 0.02, C.land)
  g.box(0.26, 0.0, -0.08, 0.02, 0.14, 0.18, C.land)
  g.box(-0.08, 0.26, -0.1, 0.14, 0.02, 0.16, C.land)
  g.box(-0.28, -0.08, 0.02, 0.02, 0.16, 0.12, C.land)
}

export function armchair(f) {
  for (const [x, z] of [[-0.4, -0.36], [0.34, -0.36], [-0.4, 0.3], [0.34, 0.3]]) {
    f.box(x, 0, z, 0.06, 0.1, 0.06, C.woodDark)
  }
  f.box(-0.42, 0.1, -0.38, 0.84, 0.3, 0.76, C.armchair)
  f.box(-0.3, 0.4, -0.22, 0.6, 0.1, 0.58, C.armchairLight)
  f.box(-0.42, 0.4, -0.38, 0.12, 0.26, 0.76, C.armchair)
  f.box(0.3, 0.4, -0.38, 0.12, 0.26, 0.76, C.armchair)
  f.box(-0.42, 0.4, -0.38, 0.84, 0.6, 0.16, C.armchair)
  f.box(-0.4, 0.98, -0.36, 0.8, 0.06, 0.13, C.armchairLight)
}

export function floorLamp(f) {
  f.box(-0.15, 0, -0.15, 0.3, 0.04, 0.3, C.brass)
  f.box(-0.02, 0.04, -0.02, 0.04, 1.3, 0.04, C.brass)
  f.box(-0.2, 1.3, -0.2, 0.4, 0.3, 0.4, '#ffffff', { layer: 'bulb' })
  f.box(-0.21, 1.58, -0.21, 0.42, 0.03, 0.42, C.brass)
  f.glow(-0.8, 0.035, -0.8, 1.6, 1.6)
}

export function sideTable(f, rnd) {
  f.box(-0.15, 0, -0.15, 0.3, 0.04, 0.3, C.wood)
  f.box(-0.03, 0.04, -0.03, 0.06, 0.48, 0.06, C.wood)
  f.box(-0.22, 0.52, -0.22, 0.44, 0.04, 0.44, C.woodMid)
  f.box(-0.14, 0.56, -0.12, 0.24, 0.05, 0.3, pick(rnd, C.books))
  f.box(-0.12, 0.61, -0.1, 0.2, 0.04, 0.26, pick(rnd, C.books))
  f.box(0.1, 0.56, 0.08, 0.08, 0.1, 0.08, C.porcelain)
}

export function cardCatalog(f) {
  const W = 0.9
  const H = 1.15
  const D = 0.5
  const x0 = -W / 2
  const z0 = -D / 2
  f.box(x0, 0, z0, W, 0.1, D, C.woodDark)
  f.box(x0, 0.1, z0, W, H - 0.1, D - 0.02, C.wood)
  f.box(x0 - 0.03, H, z0 - 0.02, W + 0.06, 0.05, D + 0.04, C.woodDark)
  const cols = 3
  const rows = 5
  const dw = (W - 0.08) / cols
  const dh = (H - 0.18) / rows
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = x0 + 0.04 + c * dw
      const y = 0.14 + r * dh
      f.box(x + 0.01, y + 0.01, z0 + D - 0.02, dw - 0.02, dh - 0.02, 0.02, C.woodLight)
      f.box(x + dw / 2 - 0.04, y + dh / 2 + 0.02, z0 + D, 0.08, 0.03, 0.006, C.paper)
      f.box(x + dw / 2 - 0.03, y + dh / 2 - 0.035, z0 + D, 0.06, 0.02, 0.015, C.brass)
    }
  }
  // üstünde küçük saksı
  f.box(x0 + 0.62, H + 0.05, z0 + 0.15, 0.18, 0.16, 0.18, C.pot)
  f.box(x0 + 0.6, H + 0.21, z0 + 0.13, 0.22, 0.2, 0.22, C.leaves[1])
}

export function bust(f) {
  f.box(-0.24, 0, -0.24, 0.48, 0.1, 0.48, C.marbleDark)
  f.box(-0.18, 0.1, -0.18, 0.36, 0.9, 0.36, C.marble)
  f.box(-0.24, 1.0, -0.24, 0.48, 0.08, 0.48, C.marbleDark)
  f.box(-0.2, 1.08, -0.12, 0.4, 0.18, 0.24, C.marble)
  f.box(-0.06, 1.26, -0.06, 0.12, 0.08, 0.12, C.marble)
  f.box(-0.11, 1.34, -0.12, 0.22, 0.26, 0.24, C.marble)
  f.box(-0.12, 1.5, -0.14, 0.24, 0.12, 0.2, C.marbleDark)
  f.box(-0.02, 1.42, 0.12, 0.04, 0.06, 0.03, C.marble)
}

export function bookCart(f, rnd) {
  const W = 0.9
  const D = 0.42
  const x0 = -W / 2
  const z0 = -D / 2
  for (const [x, z] of [[0.02, 0.02], [W - 0.08, 0.02], [0.02, D - 0.08], [W - 0.08, D - 0.08]]) {
    f.box(x0 + x - 0.01, 0, z0 + z - 0.01, 0.08, 0.08, 0.08, C.ink)
    f.box(x0 + x, 0.08, z0 + z, 0.06, 0.82, 0.06, C.woodMid)
  }
  for (const y of [0.18, 0.55]) {
    f.box(x0, y, z0, W, 0.04, D, C.woodLight)
    bookRow(f.frame(x0, 0, z0), 0.06, W - 0.06, y + 0.04, 0.28, D, rnd)
  }
  f.box(x0, 0.86, z0, W, 0.04, D, C.woodLight)
  f.box(x0 + W - 0.04, 0.9, z0 + 0.1, 0.04, 0.12, 0.22, C.brass)
}

// ---------------------------------------------------------------- duvar süsleri
// Orijin duvar yüzeyinde parçanın merkezi, +z odanın içine doğru.

export function wallClock(f) {
  f.box(-0.24, -0.24, 0, 0.48, 0.48, 0.05, C.woodDark)
  f.box(-0.2, -0.2, 0.05, 0.4, 0.4, 0.01, C.cream)
  for (const [x, y] of [[-0.015, 0.15], [-0.015, -0.18], [0.15, -0.015], [-0.18, -0.015]]) {
    f.box(x, y, 0.06, 0.03, 0.03, 0.006, C.ink)
  }
  f.frame(0, 0, 0.062, 0, 0, -0.5).box(-0.012, 0, 0, 0.024, 0.15, 0.006, C.ink)
  f.frame(0, 0, 0.068, 0, 0, -2.2).box(-0.015, 0, 0, 0.03, 0.1, 0.006, C.ink)
  f.box(-0.02, -0.02, 0.06, 0.04, 0.04, 0.016, C.brass)
}

// "Sessiz salon" levhası: üstü çizili telefon.
export function quietSign(f) {
  f.box(-0.3, -0.2, 0, 0.6, 0.4, 0.04, C.woodDark)
  f.box(-0.26, -0.16, 0.04, 0.52, 0.32, 0.01, '#f2eee6')
  f.box(-0.06, -0.11, 0.05, 0.12, 0.22, 0.01, C.ink)
  f.box(-0.045, -0.08, 0.06, 0.09, 0.15, 0.004, '#5b6b7a')
  f.frame(0, 0, 0.066, 0, 0, 0.7).box(-0.21, -0.025, 0, 0.42, 0.05, 0.008, '#c0392b')
}

export function painting(f, w = 0.9, h = 0.7) {
  const iw = w - 0.14
  const ih = h - 0.14
  f.box(-w / 2, -h / 2, 0, w, h, 0.05, '#8a6a2c')
  f.box(-iw / 2, -ih / 2, 0.05, iw, ih, 0.01, '#8fb0c4')
  f.box(-iw / 2, -ih / 2, 0.06, iw, ih * 0.4, 0.008, '#4f7a3a')
  f.box(-iw / 2 + iw * 0.35, -ih / 2 + ih * 0.3, 0.06, iw * 0.45, ih * 0.25, 0.012, '#6a9450')
  f.box(iw * 0.18, ih * 0.15, 0.06, 0.09, 0.09, 0.008, '#e9c46a')
}
