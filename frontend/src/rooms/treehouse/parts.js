import { Euler, Quaternion, Vector3 } from 'three'
import { pick } from '../core/voxel'

// Ağaç ev temasının voxel parçaları. Birim ≈ 1 metre.
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür. Duvar parçalarında orijin duvar yüzeyinin dibi, +z odanın içi.
// fx: hareket eden kutular ({ view, night, room, lit, steams }); bunlar katmanlara değil
// TreehouseEffect'e gider. view (pencereden düşen yapraklar) camın gün zamanı rengini alır, night
// (ateş böcekleri) yalnızca akşam/gece görünür, room (yanıp sönen ampuller, alevler, kavanozdaki
// ateş böcekleri) kendi renginde parlar, lit (hamak, rüzgâr çanı, kuş, içeri süzülen yapraklar)
// ışık alır.

export const WALL = 0.25
export const FLOOR_BOTTOM = -0.3
export const WALL_HEIGHT = 3.0
// Dalların ve yaprak kümelerinin en üstü (kadraj için).
export const CANOPY_TOP = 4.05
export const TRUNK_R = 0.45
// Kapağın zemindeki deliği: kapak merkezine göre ±half, arka duvardan z0..z1 (tahta sıralarına denk).
export const HATCH_HOLE = { half: 0.35, z0: 0.3, z1: 0.9 }
const ROW = 0.3
const TABLE_HEIGHT = 0.75
const STOOL_HEIGHT = 0.44
const SEAT_HEIGHT = 0.46
const CUSHION_HEIGHT = 0.21
const LOW_TABLE = 0.36
const DESK_DEPTH = 0.55
// Pencere masası taburesinin duvara uzaklığı.
const DESK_STOOL = 0.85
const BOARD = 0.25
const CAP = 2.88
const SILL = 1.0
const WINDOW_TOP = 2.25
const WINDOW_WIDTH = 0.8
const VIEW_DEPTH = -0.18
// Süs ampullerinin asıldığı çivilerin yüksekliği.
const STRING_Y = 2.74
const TAU = Math.PI * 2
const GLASS = { layer: 'glass' }
const NIGHT = { layer: 'night' }
const X_AXIS = new Vector3(1, 0, 0)

export const C = {
  plankGap: '#4a3220',
  planks: ['#a8794a', '#9c6f43', '#b08252', '#a07448'],
  hole: '#24180f',
  body: '#4a3322',
  boards: ['#8c6239', '#82593a', '#946a40'],
  log: '#6e4a2b',
  logDark: '#553820',
  cap: '#5e3f24',
  desk: '#b5875a',
  bark: ['#5c4330', '#4f392a', '#674c36'],
  barkDark: '#3d2c1f',
  cut: '#d9b98a',
  cutDark: '#b8915e',
  leaf: ['#5e9a3c', '#6fae47', '#4c8634', '#82bd56'],
  fallLeaf: ['#d98a2b', '#c8552e', '#e3b23c', '#8fb54a'],
  sky: ['#d3e9f2', '#b9d9ec'],
  farTrunk: '#8d9c86',
  farLeaf: '#a6c98f',
  nearLeaf: ['#4f8a38', '#5f9c40', '#3f7a30'],
  bush: '#4a8034',
  moon: '#f6f2d6',
  star: '#fff8e0',
  rope: '#cfae73',
  iron: '#3a3734',
  brass: '#c99a3e',
  brassDark: '#9a7430',
  hammock: ['#ece0c4', '#c8573a', '#ece0c4', '#3f8a8a'],
  crate: '#b88a55',
  crateDark: '#9a7044',
  book: ['#9a3b2e', '#2f5f7a', '#c9a24a', '#4f7a3a', '#7a4a8a', '#d8cfb6'],
  paper: '#f3ecd9',
  map: '#e6d3a8',
  ink: '#3a4a6a',
  red: '#b83a2e',
  cover: ['#8e3b2b', '#2f6a55', '#2f4a7a'],
  raincoat: '#e8c13a',
  hat: '#c9a35e',
  cushion: ['#d0743c', '#4f86a8', '#c9a23a', '#8a4f7a'],
  cushionTop: ['#e08a50', '#6a9cbc', '#d8b450', '#9c6290'],
  rug: ['#a8573a', '#e0c79a'],
  kilim: ['#8a3a2a', '#d8b47a', '#8a3a2a', '#3f6f6a'],
  jar: '#cfe3e0',
  lid: '#8a6a3a',
  firefly: '#e8ff7a',
  wire: '#3a3328',
  fairyBase: '#9a8a62',
  fairy: ['#ffd27a', '#ffb35c', '#fff0c0', '#ffc0a0'],
  candle: '#f3ead6',
  flame: ['#ffb84a', '#fff2b0'],
  mug: '#f2efe8',
  enamel: '#2f6f9a',
  drink: { cocoa: '#5a3626', lemon: '#f3e27a', tea: '#9a5a22' },
  marshmallow: '#fbf6ec',
  copper: '#c46a3a',
  cookie: '#c08a4a',
  cream: '#e8dcc0',
  honey: '#e0a030',
  pot: '#b0603a',
  soil: '#3a2a1e',
  bird: '#7a5236',
  breast: '#e07a3a',
  beak: '#f0b030',
  eye: '#141414',
  birdhouse: '#c4553a',
}

// Efekt kutusu: katmana değil efekt listesine gider. Merkez ve dönüş dünyada saklanır.
function fxBox(f, x, y, z, w, h, d, color, { rot, ...extra } = {}) {
  const quat = f.worldRotation()
  if (rot) quat.multiply(new Quaternion().setFromEuler(new Euler(rot[0], rot[1], rot[2])))
  return { center: f.point(x + w / 2, y + h / 2, z + d / 2), quat, size: [w, h, d], color, ...extra }
}

const axisOf = (f, x, y, z) => f.point(x, y, z).sub(f.point(0, 0, 0)).toArray()

// a'dan b'ye uzanan t kalınlığında çubuk: [x, y, z, w, h, d, rot] (f.box / fxBox argümanları).
function stickSpec(a, b, t) {
  const A = new Vector3(...a)
  const dir = new Vector3(...b).sub(A)
  const len = dir.length()
  const e = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(X_AXIS, dir.normalize()))
  const c = A.addScaledVector(dir, len / 2)
  return [c.x - len / 2, c.y - t / 2, c.z - t / 2, len, t, t, [e.x, e.y, e.z]]
}

function stick(f, a, b, t, color, opts = {}) {
  const [x, y, z, w, h, d, rot] = stickSpec(a, b, t)
  f.box(x, y, z, w, h, d, color, { ...opts, rot })
}

function fxStick(f, a, b, t, color) {
  const [x, y, z, w, h, d, rot] = stickSpec(a, b, t)
  return fxBox(f, x, y, z, w, h, d, color, { rot })
}

// xy düzleminde r yarıçaplı disk: step yüksekliğinde yatay şeritler (z: arka yüz, d: kalınlık).
function disk(f, cx, cy, z, r, step, d, color, opts) {
  for (let y = -r; y < r - 1e-3; y += step) {
    const h = Math.min(step, r - y)
    const c = y + h / 2
    const half = Math.sqrt(Math.max(r * r - c * c, 0))
    f.box(cx - half, cy + y, z, 2 * half, h, d, color, opts)
  }
}

// xz düzleminde r yarıçaplı disk (kütük kesiti, halı).
function diskXZ(f, y, r, step, h, color) {
  for (let z = -r; z < r - 1e-3; z += step) {
    const d = Math.min(step, r - z)
    const c = z + d / 2
    const half = Math.sqrt(Math.max(r * r - c * c, 0))
    f.box(-half, y, z, 2 * half, h, d, color)
  }
}

// Dikey silindir (kütük, gövde): n kenarlı; kenarlar dışa bakan döndürülmüş kutular, içte hizalı
// çekirdek. Kenarların renkleri sırayla değişir, kabuk dikey çizgili görünür.
function cylinder(f, y0, h, r, n, colors, depth) {
  const side = 2 * r * Math.tan(Math.PI / n) + 0.01
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU
    f.frame(Math.sin(a) * (r - depth / 2), y0, Math.cos(a) * (r - depth / 2), a).box(-side / 2, 0, -depth / 2, side, h, depth, colors[k % colors.length])
  }
  const core = r * 1.3
  f.box(-core / 2, y0, -core / 2, core, h - 0.004, core, colors[0])
}

// Yaprak kümesi: farklı yeşillerde, birbirine geçmiş dört kutu.
function leafCluster(f, x, y, z, s, rnd) {
  const parts = [
    [0, 0, 0, 1, 0.62, 1],
    [-0.38, -0.12, 0.17, 0.62, 0.5, 0.66],
    [0.33, 0.1, -0.21, 0.66, 0.5, 0.6],
    [0.06, 0.29, 0.09, 0.56, 0.4, 0.56],
  ]
  parts.forEach(([dx, dy, dz, w, h, d], i) => {
    const j = 0.04 * (rnd() - 0.5)
    const dd = d * (0.96 + 0.08 * rnd())
    f.box(x + (dx + j - w / 2) * s, y + (dy - h / 2) * s, z + (dz - j - dd / 2) * s, w * s, h * s, dd * s, C.leaf[(i + Math.floor(rnd() * 4)) % C.leaf.length])
  })
}

// ---------------------------------------------------------------- yapı

// Döşeme: x boyunca 2 m'lik tahtalar, sıra sıra kaydırılmış; aralarda koyu derz. hole: [x0, x1,
// z0, z1] kapak deliği (z sınırları ROW katı); deliğin dibi koyu. Ön ve sağ kesik kenarda kiriş başları.
export function floor(f, width, depth, hole) {
  const slab = (x0, x1, z0, z1) => {
    if (x1 - x0 > 1e-3 && z1 - z0 > 1e-3) f.box(x0, FLOOR_BOTTOM, z0, x1 - x0, -0.03 - FLOOR_BOTTOM, z1 - z0, C.plankGap)
  }
  if (hole) {
    const [hx0, hx1, hz0, hz1] = hole
    slab(0, width, 0, hz0)
    slab(0, width, hz1, depth)
    slab(0, hx0, hz0, hz1)
    slab(hx1, width, hz0, hz1)
    f.box(hx0, FLOOR_BOTTOM, hz0, hx1 - hx0, 0.02, hz1 - hz0, C.hole)
  } else {
    slab(0, width, 0, depth)
  }
  const board = 2.0
  for (let z = 0, r = 0; z < depth - 1e-3; z += ROW, r++) {
    const d = Math.min(ROW, depth - z)
    const cut = hole && z + 1e-3 >= hole[2] && z + d <= hole[3] + 1e-3
    for (let x = -((r % 3) * board) / 3, k = 0; x < width - 1e-3; x += board, k++) {
      let spans = [[Math.max(0, x), Math.min(width, x + board)]]
      if (cut) spans = spans.flatMap(([a, b]) => [[a, Math.min(b, hole[0])], [Math.max(a, hole[1]), b]])
      for (const [x0, x1] of spans) {
        if (x1 - x0 < 0.05) continue
        f.box(x0 + 0.006, -0.03, z + 0.006, x1 - x0 - 0.012, 0.03, d - 0.012, C.planks[(r + k) & 3])
      }
    }
  }
  for (let x = 0.3; x < width - 0.1; x += 0.6) f.box(x - 0.06, -0.26, depth, 0.12, 0.18, 0.04, C.logDark)
  for (let z = 0.3; z < depth - 0.1; z += 0.6) f.box(width, -0.26, z - 0.06, 0.04, 0.18, 0.12, C.logDark)
}

// Yatay tahta kaplama [u0, u1] boyunca: 0.25'lik sıralar, derzler sıra sıra kaydırılmış.
// openings: [[a, b, y0, y1]] tahtasız açıklıklar (pencereler).
function boards(f, u0, u1, openings = []) {
  for (let r = 0, y = 0; y < CAP - 1e-3; r++, y += BOARD) {
    const h = Math.min(BOARD, CAP - y)
    let segs = [[u0, u1]]
    for (const [a, b, y0, y1] of openings) {
      if (y >= y1 - 1e-3 || y + h <= y0 + 1e-3) continue
      segs = segs.flatMap(([s, e]) => [[s, Math.min(e, a)], [Math.max(s, b), e]]).filter(([s, e]) => e - s > 0.02)
    }
    const shift = ((r * 2) % 3) * 0.73
    for (const [s, e] of segs) {
      for (let x = s - shift, k = 0; x < e - 1e-3; x += 2.2, k++) {
        const x0 = Math.max(s, x)
        const x1 = Math.min(e, x + 2.2)
        if (x1 - x0 < 0.05) continue
        f.box(x0 + 0.004, y + 0.006, -0.02, x1 - x0 - 0.008, h - 0.012, 0.02, C.boards[(r + k) % C.boards.length])
      }
    }
  }
}

// Duvarın ortak katmanları: zemin altı gövde, süpürgelik, tepe kirişi ve üst kapak.
function wallShell(f, from, length) {
  f.box(from, FLOOR_BOTTOM, -WALL, length - from, -FLOOR_BOTTOM, WALL, C.body)
  f.box(0, 0, -0.02, length, 0.1, 0.05, C.logDark)
  f.box(0, CAP, -0.02, length, WALL_HEIGHT - CAP, 0.08, C.cap)
  f.box(from, WALL_HEIGHT, -WALL, length - from, 0.04, WALL, C.cap)
}

// Arka duvar: z = 0 boyunca, x = -WALL'dan width'e. Köşede ve sağ uçta kütük direk.
export function backWall(f, width) {
  wallShell(f, -WALL, width)
  f.box(-WALL, 0, -WALL, width + WALL, WALL_HEIGHT, WALL - 0.02, C.body)
  boards(f, 0, width)
  f.box(0, 0, 0, 0.12, CAP, 0.12, C.log)
  f.box(width - 0.14, 0, -WALL, 0.16, WALL_HEIGHT + 0.06, WALL + 0.1, C.log)
}

// Sol duvar: verilen merkezlerde (u, 0 = ön kenar) açık pencereler; ardında orman.
export function windowWall(f, length, windows, rnd, fx) {
  const half = WINDOW_WIDTH / 2
  const spans = windows.map((u) => [u - half, u + half]).sort((p, q) => p[0] - q[0])
  const t = WALL - 0.02
  wallShell(f, 0, length)
  let body = 0
  for (const [a, b] of spans) {
    f.box(body, 0, -WALL, a - body, WALL_HEIGHT, t, C.body)
    f.box(a, 0, -WALL, b - a, SILL, t, C.body)
    f.box(a, WINDOW_TOP, -WALL, b - a, WALL_HEIGHT - WINDOW_TOP, t, C.body)
    body = b
  }
  f.box(body, 0, -WALL, length - body, WALL_HEIGHT, t, C.body)
  boards(f, 0, length, spans.map(([a, b]) => [a, b, SILL, WINDOW_TOP]))
  f.box(-0.02, 0, -WALL, 0.16, WALL_HEIGHT + 0.06, WALL + 0.1, C.log)
  spans.forEach(([a, b], i) => treeWindow(f, a, b, i, rnd, fx))
}

// Açık pencere: kütük kasa, pervazda eğrelti saksısı, ardında orman manzarası (gök, uzak gövdeler,
// yapraklar, önden geçen dal), düşen yapraklar ve gece ateş böcekleri. İlk pencerede rüzgâr çanı.
function treeWindow(f, a, b, index, rnd, fx) {
  const H = WINDOW_TOP - SILL
  const mid = (a + b) / 2
  const w = b - a
  f.box(a - 0.1, SILL - 0.06, -0.08, w + 0.2, 0.072, 0.2, C.log)
  f.box(a - 0.1, WINDOW_TOP, -0.08, w + 0.2, 0.1, 0.13, C.log)
  for (const x of [a - 0.08, b - 0.005]) f.box(x, SILL, -0.08, 0.085, H, 0.12, C.logDark)

  // pervazda eğrelti
  const pu = index % 2 === 0 ? b - 0.17 : a + 0.05
  const py = SILL + 0.012
  f.box(pu, py, 0.0, 0.12, 0.1, 0.1, C.pot)
  f.box(pu + 0.01, py + 0.1, 0.01, 0.1, 0.005, 0.08, C.soil)
  f.box(pu - 0.03, py + 0.1, 0.02, 0.09, 0.03, 0.06, C.leaf[0], { rot: [0, 0, 0.5] })
  f.box(pu + 0.06, py + 0.1, 0.015, 0.09, 0.03, 0.06, C.leaf[1], { rot: [0, 0, -0.5] })
  f.box(pu + 0.03, py + 0.1, 0.03, 0.06, 0.13, 0.04, C.leaf[3])

  // Orman: katmanlar önden arkaya 1 mm aralıklı; aynı düzleme düşen farklı renkli yüzler
  // kamera dönünce titrer.
  const v = VIEW_DEPTH
  f.box(a, SILL, v - 0.014, w, H * 0.6, 0.002, C.sky[0], GLASS)
  f.box(a, SILL + H * 0.6, v - 0.014, w, H * 0.4, 0.002, C.sky[1], GLASS)
  if (index === 0) {
    f.box(a + w * 0.62, SILL + H * 0.7, v - 0.012, 0.13, 0.13, 0.001, C.moon, NIGHT)
  }
  for (const [su, sy] of [[0.18, 0.86], [0.41, 0.74], [0.84, 0.9]]) {
    f.box(a + w * su, SILL + H * sy, v - 0.012, 0.018, 0.018, 0.001, C.star, NIGHT)
  }
  for (const tu of [0.24 + 0.1 * rnd(), 0.62 + 0.12 * rnd()]) f.box(a + w * tu, SILL, v - 0.011, 0.08, H, 0.001, C.farTrunk, GLASS)
  f.box(a, SILL + H * 0.62, v - 0.01, w * 0.55, H * 0.24, 0.001, C.farLeaf, GLASS)
  f.box(a + w * 0.4, SILL + H * 0.5, v - 0.01, w * 0.6, H * 0.2, 0.001, C.farLeaf, GLASS)
  // üstten sarkan ve alttan yükselen yapraklar
  const tops = [[0, 0.3, 0.24], [0.3, 0.38, 0.16], [0.68, 0.32, 0.26]]
  tops.forEach(([u0, uw, hh], i) => f.box(a + w * u0, WINDOW_TOP - H * hh, v - 0.008, w * uw, H * hh, 0.001, C.nearLeaf[i], GLASS))
  f.box(a, SILL, v - 0.008, w * 0.45, H * 0.16, 0.001, C.bush, GLASS)
  f.box(a + w * 0.55, SILL, v - 0.008, w * 0.45, H * 0.1, 0.001, C.bush, GLASS)
  // önden geçen dal ve üzerindeki yapraklar
  const by = SILL + H * (0.45 + 0.1 * rnd())
  f.box(a - 0.05, by, v - 0.006, w + 0.1, 0.035, 0.001, C.bark[1], { ...GLASS, rot: [0, 0, index % 2 ? 0.18 : -0.18] })
  for (const lu of [0.2, 0.5, 0.78]) {
    f.box(a + w * lu, by + 0.02 + (index % 2 ? lu - 0.5 : 0.5 - lu) * w * 0.18, v - 0.005, 0.07, 0.05, 0.001, pick(rnd, C.nearLeaf), GLASS)
  }

  // Düşen yapraklar: üst kasanın içinden başlar, pervazın içinde kaybolur; yana salınıp döner.
  for (let i = 0; i < 4; i++) {
    const travel = H + 0.3
    fx.view.movers.push({
      items: [fxBox(f, a + 0.1 + (i / 4) * (w - 0.2) + 0.05 * rnd(), WINDOW_TOP + 0.08, v - 0.003, 0.05, 0.034, 0.001, pick(rnd, C.fallLeaf))],
      axis: [0, -1, 0],
      travel,
      period: travel / (0.16 + 0.06 * rnd()),
      phase: rnd(),
      sway: axisOf(f, 0.08, 0, 0),
      swayPeriod: 2.2 + rnd(),
      flutter: { axis: axisOf(f, 0, 0, 1), amp: 0.7 },
    })
  }
  // Gece ateş böcekleri: yaprakların önünde dolaşır.
  for (let i = 0; i < 3; i++) {
    fx.night.wanderers.push({
      ...fxBox(f, a + w * (0.25 + 0.25 * i) - 0.013, SILL + H * (0.3 + 0.35 * rnd()), v - 0.0025, 0.026, 0.026, 0.001, C.firefly),
      amp: axisOf(f, 0.16, 0.14, 0),
      phase: rnd() * TAU,
    })
  }

  if (index === 0) windChime(f, mid, fx)
}

// Rüzgâr çanı: pencere kasasının ortasından sarkar, odaya doğru salınır (fx.lit).
function windChime(f, u, fx) {
  const y = WINDOW_TOP
  const items = [
    fxBox(f, u - 0.003, y - 0.1, -0.003, 0.006, 0.1, 0.006, C.rope),
    fxBox(f, u - 0.06, y - 0.12, -0.04, 0.12, 0.02, 0.08, C.log),
    fxBox(f, u - 0.003, y - 0.36, -0.003, 0.006, 0.24, 0.006, C.rope),
    fxBox(f, u - 0.025, y - 0.42, -0.004, 0.05, 0.07, 0.008, C.log),
  ]
  ;[[-0.045, 0.2], [-0.015, 0.26], [0.015, 0.23], [0.045, 0.17]].forEach(([du, len], i) => {
    items.push(fxBox(f, u + du - 0.007, y - 0.13 - len, (i % 2) * 0.02 - 0.017, 0.014, len, 0.014, C.brass))
  })
  fx.lit.swingers.push({ items, pivot: f.point(u, y, 0).toArray(), axis: axisOf(f, 1, 0, 0), amp: 0.16, period: 2.6, phase: 0 })
}

// Süs ampulleri: duvar boyunca [u0, u1] çivilerden sarkan tel ve ampuller. Ampulün sönük tabanı
// solid katmanda, yanan hâli fx.room'da; her ampul kendi aralığında kısa süre söner.
export function fairyLights(f, u0, u1, rnd, fx) {
  const nails = Math.max(1, Math.round((u1 - u0) / 1.4))
  const span = (u1 - u0) / nails
  const z = 0.05
  for (let i = 0; i < nails; i++) {
    const s0 = u0 + i * span
    const m = Math.max(2, Math.round(span / 0.3))
    const pts = Array.from({ length: m + 1 }, (_, j) => {
      const s = j / m
      return [s0 + s * span, STRING_Y - 0.13 * 4 * s * (1 - s), z]
    })
    for (let j = 0; j < m; j++) stick(f, pts[j], pts[j + 1], 0.008, C.wire)
    for (let j = 1; j < m; j++) {
      const [u, y] = pts[j]
      f.box(u - 0.012, y - 0.05, z - 0.012, 0.024, 0.04, 0.024, C.fairyBase)
      fx.room.blinkers.push(fxBox(f, u - 0.019, y - 0.056, z - 0.019, 0.038, 0.05, 0.038, pick(rnd, C.fairy), { rate: 0.15 + 0.12 * rnd(), duty: 0.78, phase: rnd() }))
    }
  }
  for (let i = 0; i <= nails; i++) f.box(u0 + i * span - 0.015, STRING_Y - 0.01, -0.02, 0.03, 0.03, 0.08, C.iron)
}

// ---------------------------------------------------------------- arka duvar

// Giriş kapağı; orijin arka duvarda kapağın ortası. Zemindeki delikten yukarı çıkan merdiven,
// duvara yaslanmış açık kapak, üstte askılık (yağmurluk, hasır şapka, halat).
export function hatch(f) {
  const { half, z0, z1 } = HATCH_HOLE
  f.box(-half - 0.06, 0, z0, 0.06, 0.025, z1 - z0, C.logDark)
  f.box(half, 0, z0, 0.06, 0.025, z1 - z0, C.logDark)
  f.box(-half - 0.06, 0, z0 - 0.06, 2 * half + 0.12, 0.025, 0.06, C.logDark)
  f.box(-half - 0.06, 0, z1, 2 * half + 0.12, 0.025, 0.06, C.logDark)
  // merdiven
  for (const x of [-0.29, 0.24]) f.box(x, FLOOR_BOTTOM + 0.02, z0 + 0.03, 0.05, 0.8 - FLOOR_BOTTOM, 0.05, C.log)
  for (const y of [-0.14, 0.18, 0.48]) f.box(-0.24, y, z0 + 0.04, 0.48, 0.035, 0.03, C.log)
  // açık kapak
  for (let i = 0; i < 3; i++) f.box(-half + i * 0.235 + 0.003, 0, z0 - 0.1, 0.229, 0.64, 0.04, C.boards[i])
  for (const y of [0.14, 0.5]) f.box(-half + 0.04, y, z0 - 0.06, 2 * half - 0.08, 0.06, 0.02, C.logDark)
  f.box(-0.04, 0.32, z0 - 0.04, 0.08, 0.08, 0.012, C.iron)
  // askılık
  f.box(-0.42, 1.55, 0, 0.84, 0.08, 0.03, C.logDark)
  for (const x of [-0.28, 0, 0.28]) f.box(x - 0.015, 1.57, 0.03, 0.03, 0.03, 0.09, C.log)
  f.box(-0.43, 1.4, 0.035, 0.3, 0.17, 0.09, C.raincoat)
  f.box(-0.4, 0.86, 0.04, 0.24, 0.54, 0.075, C.raincoat)
  for (const x of [-0.42, -0.18]) f.box(x, 0.98, 0.045, 0.04, 0.44, 0.075, '#d4ad2a')
  f.box(-0.33, 1.48, 0.125, 0.1, 0.12, 0.012, '#d4ad2a')
  f.box(-0.14, 1.46, 0.03, 0.28, 0.025, 0.1, C.hat)
  f.box(-0.08, 1.485, 0.04, 0.16, 0.08, 0.08, C.hat)
  f.box(-0.08, 1.485, 0.12, 0.16, 0.02, 0.004, C.red)
  disk(f, 0.28, 1.4, 0.03, 0.13, 0.026, 0.05, C.rope)
  disk(f, 0.28, 1.4, 0.08, 0.06, 0.024, 0.004, C.logDark)
}

// Ahşap kasa; orijin sol alt arka köşe. Önü açık.
function crate(f, x, y, w, h, d) {
  f.box(x, y, 0, w, 0.025, d, C.crate)
  f.box(x, y + h - 0.025, 0, w, 0.025, d, C.crate)
  f.box(x, y + 0.025, 0, 0.025, h - 0.05, d, C.crateDark)
  f.box(x + w - 0.025, y + 0.025, 0, 0.025, h - 0.05, d, C.crateDark)
  f.box(x + 0.025, y + 0.025, 0, w - 0.05, h - 0.05, 0.02, C.crateDark)
}

function crateBooks(f, x, y, w, rnd) {
  let bx = x + 0.035
  const end = x + w - 0.04 - 0.1 * rnd()
  while (bx < end - 0.04) {
    const bw = 0.035 + rnd() * 0.025
    const bh = 0.2 + rnd() * 0.12
    f.box(bx, y + 0.025, 0.05, bw, bh, 0.22 + rnd() * 0.04, pick(rnd, C.book))
    bx += bw + 0.004
  }
}

// Kasa kitaplık; orijin ortası. İki sıra kasa, en üstte ortada bir kasa; solunda ateş böceği
// kavanozu (kavanozdaki böcekler fx.room'da gezinip yanıp söner), sağında saksı. Duvarda iğneli
// yaprak çizimleri ve bir harita.
export function crateShelf(f, rnd, fx) {
  const W = 0.44
  const H = 0.42
  const D = 0.34
  for (let row = 0; row < 2; row++) {
    for (const x of [-0.45, 0.01]) {
      crate(f, x, row * H, W, H, D)
      crateBooks(f, x, row * H, W, rnd)
    }
  }
  crate(f, -0.22, 2 * H, W, H, D)
  for (let i = 0; i < 3; i++) f.box(-0.18 + i * 0.01, 2 * H + 0.025 + i * 0.05, 0.05, 0.3 - i * 0.04, 0.05, 0.24, C.book[(i * 2) % C.book.length])

  // ateş böceği kavanozu
  const jx = -0.355
  const y = 2 * H
  f.box(jx - 0.075, y, 0.08, 0.15, 0.012, 0.15, C.jar, GLASS)
  for (const [dx, dz] of [[-0.075, 0.08], [0.065, 0.08], [-0.075, 0.22], [0.065, 0.22]]) f.box(jx + dx, y + 0.012, dz, 0.01, 0.2, 0.01, C.jar, GLASS)
  f.box(jx - 0.08, y + 0.212, 0.075, 0.16, 0.03, 0.16, C.lid)
  f.box(jx - 0.01, y + 0.242, 0.145, 0.02, 0.01, 0.02, C.rope)
  for (let i = 0; i < 4; i++) {
    fx.room.wanderers.push({
      ...fxBox(f, jx - 0.01, y + 0.08 + 0.03 * i, 0.145, 0.02, 0.02, 0.02, C.firefly),
      amp: [0.035, 0.05, 0.035],
      phase: i * 1.7,
    })
  }
  f.glow(jx - 0.12, y + 0.002, 0.03, 0.24, 0.26)

  // saksı
  f.box(0.26, y, 0.09, 0.15, 0.14, 0.15, C.pot)
  f.box(0.27, y + 0.14, 0.1, 0.13, 0.005, 0.13, C.soil)
  ;[[-0.5, 0.0], [0.5, 0.0], [0, 0.45], [0, -0.45]].forEach(([rz, rx], i) => {
    f.box(0.3, y + 0.14, 0.14, 0.07, 0.24, 0.05, C.leaf[i % C.leaf.length], { rot: [rx, 0, rz] })
  })

  // duvarda çizimler ve harita
  f.box(-0.42, 1.5, 0, 0.26, 0.34, 0.004, C.paper)
  f.box(-0.3, 1.56, 0.004, 0.02, 0.2, 0.002, C.bark[0])
  for (const [dx, dy, r] of [[-0.06, 0.08, 0.6], [0.04, 0.12, -0.6], [-0.05, 0.16, 0.5]]) f.box(-0.29 + dx, 1.56 + dy, 0.004, 0.06, 0.03, 0.002, C.leaf[0], { rot: [0, 0, r] })
  f.box(-0.08, 1.62, 0, 0.5, 0.36, 0.004, C.map)
  for (let i = 0; i < 6; i++) f.box(0.0 + i * 0.06, 1.7 + Math.sin(i * 1.3) * 0.06 + 0.06, 0.004, 0.03, 0.012, 0.002, C.red)
  f.box(0.3, 1.82, 0.004, 0.04, 0.04, 0.002, C.leaf[2])
  for (const [x, y2] of [[-0.3, 1.82], [0.16, 1.96]]) f.box(x, y2, 0.004, 0.015, 0.015, 0.008, C.red)
}

// Kakao köşesi; orijin tezgâhın ortası. Kasa tezgâh, kamp ocağında bakır çaydanlık (buharı
// tüter), kurabiye ve bal kavanozu; duvarda kupa askısı ve kavanoz rafı.
export function cocoaCorner(f, fx) {
  const W = 1.0
  const D = 0.45
  const H = 0.86
  f.box(-W / 2, 0, 0, W, 0.08, D - 0.03, C.logDark)
  crate(f, -W / 2, 0.08, W / 2 - 0.01, H - 0.12, D - 0.02)
  crate(f, 0.01, 0.08, W / 2 - 0.01, H - 0.12, D - 0.02)
  for (const x of [-W / 2, 0.01]) f.box(x + 0.025, 0.44, 0.02, W / 2 - 0.06, 0.02, D - 0.06, C.crate)
  // alt gözler: odun ve kozalak sepeti, üst gözler: kavanozlar ve kupalar
  for (let i = 0; i < 3; i++) {
    const y = 0.15 + (i % 2) * 0.075
    const z = 0.12 + (i >> 1) * 0.15 + (i % 2) * 0.07
    stick(f, [-0.44 + 0.02 * i, y, z], [-0.08 - 0.03 * i, y, z], 0.08, C.bark[i])
  }
  f.box(0.08, 0.105, 0.08, 0.34, 0.14, 0.26, C.crate)
  for (const [x, z] of [[0.12, 0.12], [0.22, 0.2], [0.32, 0.11], [0.17, 0.25]]) f.box(x, 0.245, z, 0.07, 0.07, 0.07, C.bark[2])
  ;[C.honey, C.cookie, C.red].forEach((color, i) => {
    f.box(-0.4 + i * 0.13, 0.46, 0.06, 0.1, 0.14, 0.1, color)
    f.box(-0.405 + i * 0.13, 0.6, 0.055, 0.11, 0.025, 0.11, C.lid)
  })
  for (let i = 0; i < 3; i++) f.box(0.08 + i * 0.13, 0.46, 0.08, 0.1, 0.09, 0.1, [C.mug, C.enamel, C.mug][i])
  f.box(-W / 2 - 0.02, H - 0.04, -0.01, W + 0.04, 0.04, D + 0.04, C.desk)

  // ocak ve çaydanlık
  f.box(-0.4, H, 0.1, 0.26, 0.05, 0.24, C.iron)
  f.box(-0.37, H + 0.05, 0.13, 0.2, 0.012, 0.18, '#242220')
  f.box(-0.355, H + 0.062, 0.14, 0.17, 0.12, 0.15, C.copper)
  f.box(-0.335, H + 0.182, 0.16, 0.13, 0.03, 0.11, C.copper)
  f.box(-0.29, H + 0.212, 0.2, 0.04, 0.02, 0.03, C.iron)
  stick(f, [-0.19, H + 0.12, 0.215], [-0.12, H + 0.18, 0.215], 0.025, C.copper)
  for (const x of [-0.33, -0.21]) f.box(x, H + 0.21, 0.205, 0.015, 0.06, 0.01, C.iron)
  f.box(-0.33, H + 0.26, 0.205, 0.135, 0.015, 0.01, C.iron)
  fx.steams.push(f.point(-0.11, H + 0.2, 0.215).toArray())

  // kurabiye ve bal kavanozları
  f.box(0.02, H, 0.12, 0.16, 0.2, 0.16, C.cream)
  f.box(0.01, H + 0.2, 0.11, 0.18, 0.025, 0.18, C.lid)
  f.box(0.06, H + 0.225, 0.16, 0.08, 0.02, 0.08, C.cookie)
  f.box(0.05, H + 0.04, 0.28, 0.1, 0.1, 0.02, C.cookie, { rot: [0.2, 0, 0] })
  f.box(0.26, H, 0.15, 0.11, 0.13, 0.11, C.honey)
  f.box(0.255, H + 0.13, 0.145, 0.12, 0.025, 0.12, C.lid)
  f.box(0.28, H + 0.05, 0.26, 0.07, 0.05, 0.002, C.paper)

  // kupa askısı ve raf
  f.box(-0.45, 1.36, 0, 0.9, 0.05, 0.03, C.logDark)
  ;[C.enamel, C.red, C.mug].forEach((color, i) => {
    const x = -0.3 + i * 0.3
    f.box(x - 0.008, 1.32, 0.03, 0.016, 0.05, 0.03, C.iron)
    f.box(x - 0.05, 1.19, 0.03, 0.1, 0.11, 0.1, color)
    f.box(x - 0.015, 1.3, 0.06, 0.03, 0.025, 0.04, color)
  })
  f.box(-0.45, 1.68, 0, 0.9, 0.03, 0.18, C.desk)
  for (const x of [-0.42, 0.39]) f.box(x, 1.55, 0, 0.03, 0.13, 0.15, C.logDark)
  ;[C.honey, C.cookie, C.red, C.leaf[1]].forEach((color, i) => {
    const x = -0.36 + i * 0.2
    f.box(x, 1.71, 0.04, 0.12, 0.14, 0.11, color)
    f.box(x - 0.004, 1.82, 0.036, 0.128, 0.04, 0.118, C.jar, GLASS)
    f.box(x - 0.005, 1.86, 0.035, 0.13, 0.025, 0.12, C.lid)
  })
}

// Hamak; orijin sol direğin dibi, yerel +x gövdeye doğru. length: direkten gövde yüzeyine,
// back: arka duvara uzaklık.
// Direk duvara bir payandayla bağlı; sağ ip gövdeye sarılı. Çizgili bez, yastık ve açık kitap
// hamakla birlikte yavaşça salınır (fx.lit).
export function hammock(f, length, back, fx) {
  f.box(-0.07, 0, -0.07, 0.14, 2.42, 0.14, C.log)
  f.box(-0.09, 2.42, -0.09, 0.18, 0.04, 0.18, C.logDark)
  f.box(-0.05, 2.28, -back, 0.1, 0.1, back - 0.07, C.logDark)
  f.box(0.07, 1.36, -0.03, 0.04, 0.08, 0.06, C.iron)

  // gövdeye sarılı ip
  const R = TRUNK_R + 0.012
  const n = 12
  const side = 2 * R * Math.tan(Math.PI / n) + 0.008
  const trunk = f.frame(length + TRUNK_R, 0, 0)
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU
    trunk.frame(Math.sin(a) * (R - 0.0125), 1.36, Math.cos(a) * (R - 0.0125), a).box(-side / 2, 0, -0.0125, side, 0.05, 0.025, C.rope)
  }

  const items = []
  const anchors = [[0.11, 1.4, 0], [length, 1.4, 0]]
  const x0 = 0.42
  const x1 = length - 0.42
  for (const [bx, [ax, ay, az]] of [[x0, anchors[0]], [x1, anchors[1]]]) {
    items.push(fxBox(f, bx - 0.02, 0.98, -0.38, 0.04, 0.04, 0.76, C.log))
    for (const z of [-0.36, 0, 0.36]) items.push(fxStick(f, [ax, ay, az], [bx, 1.0, z], 0.012, C.rope))
  }
  const sag = (s) => 1.0 - 0.42 * 4 * s * (1 - s)
  const N = 10
  for (let i = 0; i < N; i++) {
    const s0 = i / N
    const s1 = (i + 1) / N
    const xa = x0 + s0 * (x1 - x0)
    const xb = x0 + s1 * (x1 - x0)
    const ya = sag(s0)
    const yb = sag(s1)
    const len = Math.hypot(xb - xa, yb - ya) + 0.012
    const roll = Math.atan2(yb - ya, xb - xa)
    items.push(fxBox(f, (xa + xb) / 2 - len / 2, (ya + yb) / 2 - 0.025, -0.35, len, 0.025, 0.7, C.hammock[i % C.hammock.length], { rot: [0, 0, roll] }))
  }
  const on = (s, w, h, d, dz, color) => {
    const x = x0 + s * (x1 - x0)
    const slope = -0.42 * 4 * (1 - 2 * s) / (x1 - x0)
    items.push(fxBox(f, x - w / 2, sag(s), dz - d / 2, w, h, d, color, { rot: [0, 0, Math.atan(slope)] }))
  }
  on(0.14, 0.26, 0.1, 0.44, 0, C.cushionTop[1])
  on(0.58, 0.2, 0.012, 0.26, -0.13, C.paper)
  on(0.58, 0.2, 0.012, 0.26, 0.13, C.paper)
  on(0.58, 0.22, 0.006, 0.54, 0, C.cover[0])
  on(0.82, 0.28, 0.04, 0.6, 0, C.cushion[0])
  fx.lit.swingers.push({ items, pivot: f.point(0, 1.4, 0).toArray(), axis: axisOf(f, 1, 0, 0), amp: 0.07, period: 3.6, phase: 0 })
}

// ---------------------------------------------------------------- ağaç

// Ağaç gövdesi; orijin gövde merkezinin zemini. Zemini delip çıkan kabuklu gövde, döşemeye
// yayılan kökler, gövdeye çakılmış basamaklar, dal ucunda asılı fener (nokta ışık), +x yüzünde
// kuş evi ve başını sallayan kuş; tepede duvarın arkasına uzanan dallar ve yaprak kümeleri,
// duvarın üstünden sarkan sarmaşık. back: arka duvara uzaklık, reach: dalların sola uzanımı.
export function trunk(f, rnd, fx, room, { back, reach }) {
  const R = TRUNK_R
  const top = 3.3
  cylinder(f, FLOOR_BOTTOM, top - FLOOR_BOTTOM, R, 12, C.bark, 0.12)
  for (let i = 0; i < 7; i++) {
    const a = rnd() * TAU
    const y0 = 0.2 + rnd() * 1.6
    f.frame(Math.sin(a) * R, y0, Math.cos(a) * R, a).box(-0.025, 0, -0.02, 0.05, 0.6 + rnd() * 0.9, 0.035, C.barkDark)
  }
  f.frame(Math.sin(0.5) * R, 1.25, Math.cos(0.5) * R, 0.5).box(-0.06, 0, -0.01, 0.12, 0.16, 0.03, C.barkDark)
  // kökler (arka duvara doğru olanlar hariç)
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + 0.3
    if (Math.cos(a) < -0.55) continue
    const dir = [Math.sin(a), Math.cos(a)]
    const out = R + 0.28 + 0.12 * rnd()
    stick(f, [dir[0] * (R - 0.08), 0.24, dir[1] * (R - 0.08)], [dir[0] * out, -0.02, dir[1] * out], 0.13, C.bark[k % 3])
  }
  // basamaklar
  for (let i = 0; i < 5; i++) {
    const y = 0.95 + i * 0.36
    f.box(-0.17, y, R - 0.02, 0.34, 0.04, 0.09, C.log)
    for (const x of [-0.11, 0.09]) f.box(x, y + 0.04, R + 0.04, 0.02, 0.004, 0.02, C.iron)
  }

  // dal ucunda fener
  const la = -0.9
  const ld = [Math.sin(la), Math.cos(la)]
  stick(f, [ld[0] * (R - 0.06), 2.36, ld[1] * (R - 0.06)], [ld[0] * (R + 0.4), 2.44, ld[1] * (R + 0.4)], 0.07, C.bark[2])
  const lx = ld[0] * (R + 0.32)
  const lz = ld[1] * (R + 0.32)
  f.box(lx - 0.004, 2.18, lz - 0.004, 0.008, 0.24, 0.008, C.iron)
  const lamp = f.frame(lx, 1.94, lz)
  lantern(lamp, fx)
  room.lights.push(lamp.point(0, 0.12, 0).toArray())

  // kuş evi ve kuş
  const ba = Math.PI / 2 - 0.3
  const bh = f.frame(Math.sin(ba) * (R - 0.02), 1.85, Math.cos(ba) * (R - 0.02), ba)
  bh.box(-0.1, 0, 0, 0.2, 0.24, 0.18, C.birdhouse)
  bh.box(-0.13, 0.24, -0.02, 0.26, 0.03, 0.24, C.cap)
  disk(bh, 0, 0.14, 0.18, 0.035, 0.014, 0.004, C.hole)
  bh.box(-0.006, 0.05, 0.18, 0.012, 0.012, 0.07, C.log)
  bh.box(-0.04, 0.27, 0.05, 0.08, 0.07, 0.12, C.bird)
  bh.box(-0.035, 0.272, 0.17, 0.07, 0.055, 0.012, C.breast)
  bh.box(-0.025, 0.3, -0.04, 0.05, 0.015, 0.09, C.bird, { rot: [-0.4, 0, 0] })
  fx.lit.swingers.push({
    items: [
      fxBox(bh, -0.032, 0.33, 0.12, 0.064, 0.06, 0.064, C.bird),
      fxBox(bh, -0.033, 0.335, 0.17, 0.066, 0.03, 0.016, C.breast),
      fxBox(bh, -0.008, 0.35, 0.184, 0.016, 0.014, 0.032, C.beak),
      fxBox(bh, -0.036, 0.365, 0.15, 0.072, 0.012, 0.012, C.eye),
    ],
    pivot: bh.point(0, 0.33, 0.13).toArray(),
    axis: axisOf(bh, 1, 0, 0),
    amp: 0.32,
    period: 1.9,
    phase: 0.3,
  })

  // dallar ve yapraklar: çoğu duvarın üstünde ve arkasında
  const branches = [
    [[-0.05, 2.95, -0.1], [-1.5, 3.5, -0.75], 0.2],
    [[0.05, 3.0, -0.05], [0.45, 3.6, -0.7], 0.17],
    [[-0.05, 3.1, 0.05], [-0.75, 3.7, 0.2], 0.15],
    [[-1.0, 3.32, -0.5], [-2.3, 3.4, -0.55], 0.12],
  ]
  for (const [a, b, t] of branches) stick(f, a, b, t, C.bark[1])
  const clusters = [
    [0, 3.55, 0, 1.1],
    [-1.55, 3.6, -0.8, 1.0],
    [-2.35, 3.48, -0.6, 0.85],
    [0.5, 3.7, -0.72, 0.85],
    [-0.78, 3.82, 0.15, 0.8],
    [-0.75, 3.62, -0.55, 0.95],
  ]
  // geniş odalarda arka duvar boyunca uzanan dal
  for (let x = -3.3; x > -reach; x -= 1.0) clusters.push([x, 3.45 + 0.1 * rnd(), -0.6, 0.8])
  if (reach > 2.8) stick(f, [-2.2, 3.36, -0.55], [-reach + 0.3, 3.42, -0.6], 0.1, C.bark[1])
  for (const [x, y, z, s] of clusters) leafCluster(f, x, y, z, s, rnd)

  // duvarın üstünden sarkan sarmaşık
  const wz = -back + 0.075
  for (let k = 0; k < 4; k++) {
    const x = -0.95 - k * 0.6 - 0.1 * rnd()
    const len = 0.32 + 0.3 * rnd()
    f.box(x - 0.008, WALL_HEIGHT + 0.03 - len, wz - 0.008, 0.016, len, 0.016, C.leaf[2])
    for (let y = WALL_HEIGHT - 0.06; y > WALL_HEIGHT + 0.04 - len; y -= 0.11) {
      for (const s of [-1, 1]) f.box(x + (s > 0 ? 0.004 : -0.064), y, wz - 0.005, 0.06, 0.04, 0.012, C.leaf[(k + (s > 0 ? 1 : 3)) % C.leaf.length], { rot: [0, 0, s * 0.45] })
    }
  }
  for (let x = -0.6, k = 0; x > -3.0; x -= 0.34, k++) {
    f.box(x - 0.16, WALL_HEIGHT + 0.04, -back - 0.2, 0.31, 0.06 + 0.04 * rnd(), 0.28 + 0.03 * (k % 2), C.leaf[k % C.leaf.length])
  }
}

// Fener; orijin tabanın ortası. Demir taban, köşe çubukları, şapka ve kulp; içinde titrek alevli
// mum (fx.room).
export function lantern(f, fx) {
  f.box(-0.07, 0, -0.07, 0.14, 0.025, 0.14, C.iron)
  for (const [x, z] of [[-0.07, -0.07], [0.055, -0.07], [-0.07, 0.055], [0.055, 0.055]]) f.box(x, 0.025, z, 0.015, 0.17, 0.015, C.iron)
  f.box(-0.08, 0.195, -0.08, 0.16, 0.03, 0.16, C.iron)
  f.box(-0.05, 0.225, -0.05, 0.1, 0.03, 0.1, C.iron)
  f.box(-0.035, 0.255, -0.004, 0.07, 0.04, 0.008, C.iron)
  f.box(-0.025, 0.025, -0.025, 0.05, 0.07, 0.05, C.candle)
  fx.room.pulsers.push({
    items: [fxBox(f, -0.014, 0.1, -0.014, 0.028, 0.05, 0.028, C.flame[0]), fxBox(f, -0.008, 0.105, -0.008, 0.016, 0.03, 0.016, C.flame[1])],
    amp: 0.2,
    period: 0.8 + 0.2 * Math.abs(Math.sin(f.point(0, 0, 0).x)),
    phase: f.point(0, 0, 0).z,
  })
}

// ---------------------------------------------------------------- çalışma alanı

// Masa üstü; orijin oturanın önündeki masa kenarı, +z masanın içine. Açık defter, kalem ve
// sırayla kakao (buharı tüter), limonata kavanozu ya da emaye kupada çay.
function studyItems(t, i, fx) {
  t.box(-0.17, 0, 0.06, 0.34, 0.01, 0.22, C.cover[i % C.cover.length])
  t.box(-0.16, 0.01, 0.07, 0.155, 0.006, 0.2, C.paper)
  t.box(0.005, 0.01, 0.07, 0.155, 0.006, 0.2, C.paper)
  for (let k = 0; k < 3; k++) t.box(-0.14, 0.016, 0.11 + k * 0.045, 0.11, 0.001, 0.006, C.ink)
  t.box(0.05, 0.016, 0.1, 0.01, 0.008, 0.14, C.raincoat)
  const kind = i % 3
  if (kind === 0) {
    t.box(0.2, 0, 0.11, 0.09, 0.09, 0.09, C.mug)
    t.box(0.21, 0.09, 0.12, 0.07, 0.003, 0.07, C.drink.cocoa)
    t.box(0.225, 0.093, 0.135, 0.03, 0.015, 0.03, C.marshmallow)
    t.box(0.29, 0.03, 0.145, 0.025, 0.035, 0.02, C.mug)
    fx.steams.push(t.point(0.245, 0.1, 0.155).toArray())
  } else if (kind === 1) {
    t.box(0.21, 0, 0.12, 0.08, 0.13, 0.08, C.drink.lemon)
    t.box(0.205, 0.13, 0.115, 0.09, 0.02, 0.09, C.jar, GLASS)
    t.box(0.245, 0.15, 0.15, 0.01, 0.07, 0.01, C.red)
  } else {
    t.box(0.2, 0, 0.11, 0.09, 0.08, 0.09, C.enamel)
    t.box(0.21, 0.08, 0.12, 0.07, 0.003, 0.07, C.drink.tea)
    t.box(0.29, 0.025, 0.145, 0.025, 0.035, 0.02, C.enamel)
    t.box(0.2, 0.083, 0.115, 0.004, 0.003, 0.08, C.mug)
  }
}

// Kütük tabure; orijin ortası.
function stumpStool(f) {
  cylinder(f, 0, STOOL_HEIGHT - 0.03, 0.17, 8, C.bark, 0.07)
  diskXZ(f, STOOL_HEIGHT - 0.03, 0.185, 0.074, 0.03, C.cut)
  f.box(-0.03, STOOL_HEIGHT, -0.03, 0.06, 0.003, 0.06, C.cutDark)
}

// Pencere masası; orijin duvar dibinde pencerenin ortası, yerel +z odanın içi. Duvara çakılı
// tahta masa, alt raf, masada fener; önünde pencereye bakan kütük tabure. light: feneri nokta
// ışık olarak ekle.
export function windowDesk(f, room, fx, light) {
  f.box(-0.5, TABLE_HEIGHT - 0.045, 0, 1.0, 0.045, DESK_DEPTH, C.desk)
  f.box(-0.48, TABLE_HEIGHT - 0.12, 0, 0.96, 0.075, 0.03, C.logDark)
  for (const x of [-0.44, 0.37]) f.box(x, 0, DESK_DEPTH - 0.11, 0.07, TABLE_HEIGHT - 0.045, 0.07, C.log)
  f.box(-0.43, 0.2, 0.03, 0.86, 0.03, DESK_DEPTH - 0.1, C.desk)
  f.box(-0.3, 0.23, 0.08, 0.26, 0.05, 0.2, C.book[1])
  f.box(-0.28, 0.28, 0.1, 0.22, 0.04, 0.17, C.book[2])
  lantern(f.frame(0.36, TABLE_HEIGHT, 0.24), fx)
  f.glow(-0.5, TABLE_HEIGHT + 0.003, 0, 1.0, DESK_DEPTH)
  if (light) room.lights.push(f.point(0.3, 1.3, 0.35).toArray())

  const seat = f.frame(0, 0, DESK_STOOL, Math.PI)
  stumpStool(seat)
  room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing() })
  studyItems(seat.frame(0, TABLE_HEIGHT, DESK_STOOL - DESK_DEPTH), room.seats.length - 1, fx)
}

// Kütük masa; orijin ortası. Kalın kütük ayak, kabuk kenarlı kesit tabla, iki yanda (±x) kütük
// tabure, tepede asılı fener. light: feneri nokta ışık olarak ekle.
export function stumpTable(f, room, fx, light) {
  cylinder(f, 0, 0.66, 0.24, 8, C.bark, 0.08)
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + 0.6
    stick(f, [Math.sin(a) * 0.18, 0.16, Math.cos(a) * 0.18], [Math.sin(a) * 0.42, -0.02, Math.cos(a) * 0.42], 0.09, C.bark[k % 3])
  }
  diskXZ(f, 0.66, 0.46, 0.092, 0.06, C.barkDark)
  diskXZ(f, 0.72, 0.43, 0.086, 0.03, C.cut)
  f.glow(-0.43, TABLE_HEIGHT + 0.003, -0.43, 0.86, 0.86)

  f.box(-0.004, 2.12, -0.004, 0.008, WALL_HEIGHT - 2.12, 0.008, C.iron)
  const lamp = f.frame(0, 1.84, 0)
  lantern(lamp, fx)
  if (light) room.lights.push(lamp.point(0, 0.05, 0).toArray())

  for (const s of [-1, 1]) {
    const seat = f.frame(s * 0.66, 0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2)
    stumpStool(seat)
    room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing() })
    studyItems(seat.frame(0, TABLE_HEIGHT, 0.23), room.seats.length - 1, fx)
  }
}

// Kilim; [x0, x1] x [z0, z1] dikdörtgeni (kütük masaların altı). Koyu kırmızı kenar, açık zemin,
// iç çizgi ve ortada sıra hâlinde baklava desenleri.
export function kilim(f, x0, z0, x1, z1) {
  const w = x1 - x0
  const d = z1 - z0
  f.box(x0, 0, z0, w, 0.01, d, C.kilim[0])
  f.box(x0 + 0.12, 0.01, z0 + 0.12, w - 0.24, 0.003, d - 0.24, C.kilim[1])
  f.box(x0 + 0.2, 0.013, z0 + 0.2, w - 0.4, 0.002, d - 0.4, C.kilim[2])
  f.box(x0 + 0.25, 0.015, z0 + 0.25, w - 0.5, 0.002, d - 0.5, C.kilim[1])
  const n = Math.max(2, Math.round((w - 0.6) / 0.5))
  for (let i = 0; i < n; i++) {
    const x = x0 + 0.3 + ((i + 0.5) * (w - 0.6)) / n
    for (const z of [z0 + 0.4, z1 - 0.4]) f.box(x - 0.07, 0.017, z - 0.07, 0.14, 0.002, 0.14, C.kilim[i % 2 ? 0 : 3], { rot: [0, Math.PI / 4, 0] })
  }
}

// Minder köşesi; orijin ortası. Halkalı yuvarlak halı, kasadan alçak masa, iki yanda (±z)
// karşılıklı yer minderleri, köşede yer feneri ve kitap yığını.
export function cushionNook(f, room, fx) {
  diskXZ(f, 0, 1.0, 0.1, 0.012, C.rug[0])
  diskXZ(f, 0.012, 0.8, 0.1, 0.004, C.rug[1])
  diskXZ(f, 0.016, 0.6, 0.1, 0.004, C.rug[0])
  f.box(-0.36, 0.02, -0.26, 0.72, LOW_TABLE - 0.05, 0.52, C.crateDark)
  for (const x of [-0.34, 0.02]) f.box(x, 0.06, 0.26, 0.32, LOW_TABLE - 0.13, 0.012, C.crate)
  f.box(-0.4, LOW_TABLE - 0.03, -0.3, 0.8, 0.03, 0.6, C.desk)

  for (const s of [-1, 1]) {
    const seat = f.frame(0, 0.02, s * 0.72, s > 0 ? Math.PI : 0)
    const i = room.seats.length
    seat.box(-0.3, 0, -0.28, 0.6, 0.15, 0.56, C.cushion[i % C.cushion.length])
    seat.box(-0.27, 0.15, -0.25, 0.54, 0.035, 0.5, C.cushionTop[i % C.cushionTop.length])
    room.seats.push({ position: seat.point(0, CUSHION_HEIGHT - 0.02, 0).toArray(), yaw: seat.facing() })
    studyItems(seat.frame(0, LOW_TABLE - 0.02, 0.42), i, fx)
  }

  lantern(f.frame(0.72, 0.016, -0.5), fx)
  f.glow(0.42, 0.02, -0.8, 0.6, 0.6)
  for (let i = 0; i < 3; i++) f.box(-0.82 + i * 0.012, 0.016 + i * 0.05, 0.38 - i * 0.01, 0.26 - i * 0.03, 0.05, 0.2, C.book[(i + 3) % C.book.length])
}

// ---------------------------------------------------------------- zemin eşyaları

// Teleskop; orijin üçayağın ortası, dünya eksenine hizalı. Pirinç tüp +x yönünde gökyüzüne
// bakar, göz merceği -x tarafında.
export function telescope(f) {
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + Math.PI / 6
    stick(f, [0, 1.0, 0], [Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34], 0.035, C.log)
  }
  f.box(-0.05, 0.98, -0.05, 0.1, 0.06, 0.1, C.iron)
  stick(f, [-0.3, 1.0, 0], [0.42, 1.42, 0], 0.1, C.brass)
  stick(f, [0.36, 1.385, 0], [0.48, 1.455, 0], 0.125, C.brassDark)
  stick(f, [-0.3, 1.0, 0], [-0.4, 0.95, 0], 0.045, C.iron)
  stick(f, [-0.08, 1.2, 0.0], [0.12, 1.32, 0.0], 0.03, C.iron)
}
