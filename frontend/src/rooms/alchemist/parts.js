import { Euler, Quaternion, Vector3 } from 'three'
import { pick } from '../core/voxel'

// Simyacı odası temasının voxel parçaları: eski bir taş kulenin içinde gizemli bir çalışma odası.
// Birim ≈ 1 metre. Tasarım dili: kaba taş duvar ve döşeme, koyu meşe kirişler ve mobilyalar,
// pirinç ve dövme demir, kadife; iksirler ve rünler kendi renginde parlar (bulb katmanı; tema bulb
// rengini beyaz tutar).
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür. Duvar parçalarında orijin duvar yüzeyinin dibi, +z odanın içi.
// fx: hareket eden kutular ({ view, night, room, lit, mist, steams }); bunlar katmanlara değil
// AlchemyEffect'e gider. view (bulutlar) camın gün zamanı rengini alır, night (parıldayan yıldızlar)
// yalnızca akşam/gece görünür, room (alev, kabarcık, rün, kıvılcım, kristal) kendi renginde parlar,
// lit (süzülen kitap ve mumlar, baykuş, gök küresi kolları) ışık alır, mist (kazan dumanı) yarı
// saydamdır.

export const WALL = 0.3
export const FLOOR_BOTTOM = -0.3
export const WALL_HEIGHT = 3.0
const TABLE_HEIGHT = 0.76
const SEAT_HEIGHT = 0.5
const ROW_H = 0.325
// Taş sıralarının bittiği, duvar kirişinin başladığı yükseklik.
const CAP = 2.85
const SILL = 0.975
const WINDOW_TOP = 2.275
const ARCH_TOP = WINDOW_TOP + ROW_H
const WINDOW_WIDTH = 0.7
const VIEW_DEPTH = -0.22
const DESK_DEPTH = 0.55
// Pencere masası sandalyesinin duvara uzaklığı.
const DESK_CHAIR = 0.92
const TAU = Math.PI * 2
const GLASS = { layer: 'glass' }
const BULB = { layer: 'bulb' }
const NIGHT = { layer: 'night' }
const X_AXIS = new Vector3(1, 0, 0)

// Büyülü ışıklar ve iksir renkleri.
export const M = {
  green: '#7dff6a',
  violet: '#b98aff',
  cyan: '#6ae8ff',
  red: '#ff5a6a',
  amber: '#ffb347',
  pink: '#ff7ad8',
  gold: '#ffd76a',
}

// Nokta ışık renkleri (RoomCanvas lamba başına renk alır).
export const LIGHT = { candle: '#ffb066', cauldron: '#8dff7a', crystal: '#b58aff' }

export const C = {
  mortar: '#4a453e',
  stone: ['#7a756c', '#857f75', '#6f6a62', '#8c867b'],
  dressed: '#9a9284',
  floorMortar: '#3a3631',
  flag: ['#6b665d', '#76706a', '#625e57', '#706a61'],
  beam: '#3e2818',
  wood: '#5e3d26',
  woodDark: '#4a3020',
  woodLight: '#7a5232',
  iron: '#2e2c2a',
  ironLight: '#4a4744',
  brass: '#c9a24a',
  copper: '#b0623a',
  velvet: '#6e1f2a',
  velvetLight: '#842a36',
  parchment: '#e8d8b0',
  ink: '#2a2420',
  book: ['#6b2a1e', '#2f4a2a', '#3a2a4a', '#7a5a2a', '#4a1e2a', '#2a3a5a', '#5a4a3a'],
  bone: '#e6dcc4',
  glass: '#cfe3e0',
  cork: '#a87a4a',
  candle: '#efe4c8',
  flame: ['#ffb84a', '#fff2b0'],
  blueFlame: ['#4ab8ff', '#c8f0ff'],
  ember: '#ff7a2a',
  ash: '#2a2622',
  log: '#4a3222',
  herb: ['#5a7a3a', '#7a8a4a', '#6a5a3a'],
  clay: '#a8623a',
  tea: '#7a4a22',
  rug: ['#2a2f5a', '#c9a24a', '#5a1f2a'],
  crystal: '#c9b0ff',
  owl: '#6a4a30',
  owlBelly: '#d8c4a0',
  owlFace: '#e8d8b8',
  beak: '#d89a3a',
  planet: ['#4a8ad8', '#d8603a', '#e8d070'],
  sky: ['#cfe0ee', '#a9c4de'],
  moon: '#f6f2d6',
  star: '#fff8e0',
  mountain: ['#7a8aa0', '#5a6a7e'],
  pine: '#2e4434',
  cloud: '#f4f6fa',
  lead: '#2a2a2e',
}

// Efekt kutusu: katmana değil efekt listesine gider. Merkez ve dönüş dünyada saklanır.
function fxBox(f, x, y, z, w, h, d, color, { rot, ...extra } = {}) {
  const quat = f.worldRotation()
  if (rot) quat.multiply(new Quaternion().setFromEuler(new Euler(rot[0], rot[1], rot[2])))
  return { center: f.point(x + w / 2, y + h / 2, z + d / 2), quat, size: [w, h, d], color, ...extra }
}

const axisOf = (f, x, y, z) => f.point(x, y, z).sub(f.point(0, 0, 0)).toArray()

// a'dan b'ye uzanan t kalınlığında çubuk (ayak, boru, kemer taşı).
function stick(f, a, b, t, color, opts = {}) {
  const A = new Vector3(...a)
  const dir = new Vector3(...b).sub(A)
  const len = dir.length()
  const e = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(X_AXIS, dir.clone().normalize()))
  const c = A.addScaledVector(dir, 0.5)
  f.box(c.x - len / 2, c.y - t / 2, c.z - t / 2, len, t, t, color, { ...opts, rot: [e.x, e.y, e.z] })
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

// xz düzleminde r yarıçaplı disk (masa üstü, halı, sıvı yüzeyi).
function diskXZ(f, y, r, step, h, color, opts) {
  for (let z = -r; z < r - 1e-3; z += step) {
    const d = Math.min(step, r - z)
    const c = z + d / 2
    const half = Math.sqrt(Math.max(r * r - c * c, 0))
    f.box(-half, y, z, 2 * half, h, d, color, opts)
  }
}

// Dikey n kenarlı silindir halkası: kenarlar dışa bakan döndürülmüş kutular. core: içi dolu.
function cylinder(f, y0, h, r, n, colors, depth, core = true) {
  const side = 2 * r * Math.tan(Math.PI / n) + 0.01
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + Math.PI / n
    f.frame(Math.sin(a) * (r - depth / 2), y0, Math.cos(a) * (r - depth / 2), a).box(-side / 2, 0, -depth / 2, side, h, depth, colors[k % colors.length])
  }
  if (core) f.box(-r * 0.65, y0, -r * 0.65, r * 1.3, h - 0.004, r * 1.3, colors[0])
}

// Yatay halka (n parça), y yüksekliğinde r yarıçaplı. add: (çerçeve, x, y, z, w, h, d) çizer.
function ring(f, y, r, n, t, add) {
  const len = 2 * r * Math.tan(Math.PI / n) + 0.004
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU
    add(f.frame(Math.sin(a) * r, y, Math.cos(a) * r, a), -len / 2, 0, -t / 2, len, t, t)
  }
}

// Titrek alev (fx.room); orijin fitilin ucu.
function flame(f, fx, x, y, z, s = 1, colors = C.flame) {
  fx.room.pulsers.push({
    items: [
      fxBox(f, x - 0.014 * s, y, z - 0.014 * s, 0.028 * s, 0.05 * s, 0.028 * s, colors[0]),
      fxBox(f, x - 0.008 * s, y + 0.005 * s, z - 0.008 * s, 0.016 * s, 0.03 * s, 0.016 * s, colors[1]),
    ],
    amp: 0.2,
    period: 0.75 + 0.3 * Math.abs(Math.sin(x * 7 + z * 3)),
    phase: Math.abs(Math.sin(x * 13 + y * 5 + z * 11)),
  })
}

// Mum; orijin tabanın ortası. h: mum boyu.
function candle(f, fx, x, y, z, h = 0.12) {
  f.box(x - 0.022, y, z - 0.022, 0.044, h, 0.044, C.candle)
  f.box(x - 0.026, y + h * 0.55, z - 0.026, 0.008, h * 0.35, 0.012, C.candle)
  flame(f, fx, x, y + h + 0.004, z)
}

// ---------------------------------------------------------------- yapı

// Döşeme: harç tabanı üstünde sıra sıra kaydırılmış, boyları değişen büyük döşeme taşları.
export function floor(f, width, depth, rnd) {
  f.box(0, FLOOR_BOTTOM, 0, width, -0.04 - FLOOR_BOTTOM, depth, C.floorMortar)
  const row = 0.75
  for (let z = 0, r = 0; z < depth - 1e-3; z += row, r++) {
    const d = Math.min(row, depth - z)
    let x = -(r % 2) * 0.45
    while (x < width - 1e-3) {
      const w = 0.75 + rnd() * 0.4
      const x0 = Math.max(0, x)
      const x1 = Math.min(width, x + w)
      if (x1 - x0 > 0.08) f.box(x0 + 0.012, -0.04, z + 0.012, x1 - x0 - 0.024, 0.04, d - 0.024, pick(rnd, C.flag))
      x += w
    }
  }
}

// Kaba taş örgü [u0, u1] boyunca: 0.325'lik sıralar, sıra sıra kaydırılmış farklı boylarda taşlar,
// bazıları 1 cm dışarı taşar (duvara asılan düz eşyalar en az 1.2 cm önde durur). openings: [[a, b, y0, y1]] taşsız açıklıklar.
function masonry(f, u0, u1, rnd, openings = []) {
  for (let r = 0, y = 0; y < CAP - 1e-3; r++, y += ROW_H) {
    const h = Math.min(ROW_H, CAP - y)
    let segs = [[u0, u1]]
    for (const [a, b, y0, y1] of openings) {
      if (y >= y1 - 1e-3 || y + h <= y0 + 1e-3) continue
      segs = segs.flatMap(([s, e]) => [[s, Math.min(e, a)], [Math.max(s, b), e]]).filter(([s, e]) => e - s > 0.04)
    }
    for (const [s, e] of segs) {
      for (let x = s - (r % 2) * 0.3; x < e - 1e-3; ) {
        const w = 0.42 + rnd() * 0.35
        const x0 = Math.max(s, x)
        const x1 = Math.min(e, x + w)
        const out = rnd() < 0.3 ? 0.01 : 0
        if (x1 - x0 > 0.06) f.box(x0 + 0.008, y + 0.008, -0.03, x1 - x0 - 0.016, h - 0.016, 0.03 + out, pick(rnd, C.stone))
        x += w
      }
    }
  }
}

// Duvarın ortak katmanları: zemin altı gövde, taşların üstünde meşe duvar kirişi ve üst kapak.
function wallShell(f, from, length) {
  f.box(from, FLOOR_BOTTOM, -WALL, length - from, -FLOOR_BOTTOM, WALL, C.mortar)
  f.box(0.005, CAP, -0.04, length - 0.01, WALL_HEIGHT - 0.01 - CAP, 0.16, C.beam)
  f.box(from, WALL_HEIGHT, -WALL, length - from, 0.04, WALL, C.dressed)
}

// Arka duvar: z = 0 boyunca, x = -WALL'dan width'e. Taş konsollara oturan kiriş başları 1.8 m'de bir,
// köşede meşe direk.
export function backWall(f, width, rnd) {
  wallShell(f, -WALL, width)
  f.box(-WALL, 0, -WALL, width + WALL, WALL_HEIGHT, WALL - 0.03, C.mortar)
  masonry(f, 0, width, rnd)
  for (let x = 0.9; x < width - 0.3; x += 1.8) {
    f.box(x - 0.085, 2.62, -0.04, 0.17, CAP - 2.62, 0.6, C.beam)
    f.box(x - 0.1, 2.44, -0.03, 0.2, 0.18, 0.2, C.dressed)
  }
  f.box(0, 0, 0, 0.16, CAP, 0.16, C.beam)
}

// Sol duvar: verilen merkezlerde (u, 0 = ön kenar) sivri kemerli kurşun çerçeveli pencereler;
// ardında dağlar ve uzak bir kule. Pencereler arasında kirişten sarkan kuru ot demetleri.
export function windowWall(f, length, windows, rnd, fx) {
  const half = WINDOW_WIDTH / 2
  const spans = windows.map((u) => [u - half, u + half]).sort((p, q) => p[0] - q[0])
  const t = WALL - 0.03
  wallShell(f, 0, length)
  let body = 0
  const openings = []
  for (const [a, b] of spans) {
    f.box(body, 0, -WALL, a - body, WALL_HEIGHT, t, C.mortar)
    f.box(a, 0, -WALL, b - a, SILL, t, C.mortar)
    f.box(a, WINDOW_TOP, -WALL, 0.1, WALL_HEIGHT - WINDOW_TOP, t, C.mortar)
    f.box(b - 0.1, WINDOW_TOP, -WALL, 0.1, WALL_HEIGHT - WINDOW_TOP, t, C.mortar)
    f.box(a + 0.1, ARCH_TOP, -WALL, b - a - 0.2, WALL_HEIGHT - ARCH_TOP, t, C.mortar)
    openings.push([a, b, SILL, WINDOW_TOP], [a + 0.1, b - 0.1, WINDOW_TOP, ARCH_TOP])
    body = b
  }
  f.box(body, 0, -WALL, length - body, WALL_HEIGHT, t, C.mortar)
  masonry(f, 0, length, rnd, openings)
  f.box(-0.02, 0, -WALL, 0.18, CAP, WALL + 0.16, C.beam)
  spans.forEach(([a, b], i) => lancetWindow(f, a, b, i, rnd, fx))
  for (let i = 1; i < spans.length; i++) {
    const gap = spans[i][0] - spans[i - 1][1]
    if (gap > 0.9) herbBundles(f, spans[i - 1][1] + 0.25, spans[i][0] - 0.25, 0.1, rnd)
  }
}

// Kirişten sarkan kuru ot demetleri [u0, u1] boyunca, duvar yüzeyinden z kadar önde.
function herbBundles(f, u0, u1, z, rnd) {
  const n = Math.max(1, Math.floor((u1 - u0) / 0.2))
  for (let i = 0; i < n; i++) {
    const u = u0 + ((i + 0.5) * (u1 - u0)) / n
    const len = 0.12 + rnd() * 0.12
    f.box(u - 0.004, CAP - 0.1, z - 0.004, 0.008, 0.1, 0.008, C.parchment)
    f.box(u - 0.04, CAP - 0.1 - len, z - 0.03, 0.08, len, 0.06, pick(rnd, C.herb))
    f.box(u - 0.025, CAP - 0.12, z - 0.02, 0.05, 0.03, 0.04, C.cork)
  }
}

// Sivri kemerli pencere: yontma taş pervaz ve söveler, iki eğik kemer taşı ve kilit taşı,
// kurşun kafes; ardında gök, dağlar, çam siluetleri, ikinci pencerede uzak bir kule, süzülen
// bulutlar; gece ay ve parıldayan yıldızlar.
function lancetWindow(f, a, b, index, rnd, fx) {
  const H = WINDOW_TOP - SILL
  const w = b - a
  const mid = (a + b) / 2
  f.box(a - 0.1, SILL - 0.07, -0.08, w + 0.2, 0.082, 0.2, C.dressed)
  f.box(a - 0.1, SILL, -0.08, 0.105, H, 0.11, C.dressed)
  f.box(b - 0.005, SILL, -0.08, 0.105, H, 0.11, C.dressed)
  stick(f, [a - 0.03, WINDOW_TOP, -0.02], [mid, ARCH_TOP + 0.08, -0.02], 0.11, C.dressed)
  stick(f, [b + 0.03, WINDOW_TOP, -0.02], [mid, ARCH_TOP + 0.08, -0.02], 0.11, C.dressed)
  f.box(mid - 0.06, ARCH_TOP, -0.08, 0.12, 0.16, 0.12, C.dressed)
  // kurşun kafes
  for (const u of [a + w / 3, a + (2 * w) / 3]) f.box(u - 0.008, SILL, -0.075, 0.016, H, 0.012, C.lead)
  for (let y = SILL + H / 5; y < WINDOW_TOP - 0.05; y += H / 5) f.box(a, y - 0.008, -0.074, w, 0.016, 0.01, C.lead)

  // Manzara: katmanlar önden arkaya 1 mm aralıklı.
  const v = VIEW_DEPTH
  f.box(a, SILL, v - 0.014, w, H * 0.55, 0.002, C.sky[0], GLASS)
  f.box(a, SILL + H * 0.55, v - 0.014, w, H * 0.45, 0.002, C.sky[1], GLASS)
  f.box(a + 0.1, WINDOW_TOP, v - 0.014, w - 0.2, ARCH_TOP - WINDOW_TOP, 0.002, C.sky[1], GLASS)
  if (index === 0) f.box(a + w * 0.58, SILL + H * 0.74, v - 0.012, 0.11, 0.11, 0.001, C.moon, NIGHT)
  for (let i = 0; i < 4; i++) {
    fx.night.blinkers.push(fxBox(f, a + 0.06 + rnd() * (w - 0.12), SILL + H * (0.6 + 0.35 * rnd()), v - 0.012, 0.016, 0.016, 0.001, C.star, { rate: 0.3 + 0.3 * rnd(), duty: 0.7, phase: rnd() }))
  }
  // dağlar
  ;[[0, 0.45, 0.42], [0.35, 0.4, 0.55], [0.68, 0.32, 0.38]].forEach(([u0, uw, hh]) => f.box(a + w * u0, SILL, v - 0.011, w * uw, H * hh, 0.001, C.mountain[0], GLASS))
  f.box(a, SILL, v - 0.009, w, H * 0.2, 0.001, C.mountain[1], GLASS)
  if (index % 2 === 1) {
    const tx = a + w * 0.66
    f.box(tx, SILL + H * 0.2, v - 0.008, 0.05, H * 0.32, 0.001, C.pine, GLASS)
    f.box(tx - 0.012, SILL + H * 0.52, v - 0.008, 0.074, 0.03, 0.001, C.pine, GLASS)
    f.box(tx + 0.008, SILL + H * 0.55, v - 0.008, 0.034, 0.05, 0.001, C.pine, GLASS)
    f.box(tx + 0.017, SILL + H * 0.42, v - 0.007, 0.016, 0.024, 0.001, M.amber, NIGHT)
  }
  // çam siluetleri
  for (let i = 0; i < 4; i++) {
    const px = a + 0.04 + i * (w - 0.08) / 3.5 + 0.03 * rnd()
    const ph = H * (0.16 + 0.1 * rnd())
    f.box(px - 0.035, SILL, v - 0.006, 0.07, ph * 0.55, 0.001, C.pine, GLASS)
    f.box(px - 0.022, SILL + ph * 0.55, v - 0.006, 0.044, ph * 0.3, 0.001, C.pine, GLASS)
    f.box(px - 0.01, SILL + ph * 0.85, v - 0.006, 0.02, ph * 0.15, 0.001, C.pine, GLASS)
  }
  // bulutlar: duvar gövdesinin içinden çıkıp öbür yanda yine gövdeye girer
  for (let i = 0; i < 2; i++) {
    const travel = w + 0.5
    const y = SILL + H * (0.7 + 0.15 * i)
    fx.view.movers.push({
      items: [fxBox(f, a - 0.4, y, v - 0.005, 0.22, 0.05, 0.001, C.cloud), fxBox(f, a - 0.35, y + 0.04, v - 0.005, 0.12, 0.04, 0.001, C.cloud)],
      axis: axisOf(f, 1, 0, 0),
      travel,
      period: travel / (0.04 + 0.02 * rnd()),
      phase: rnd(),
    })
  }
}

// Duvar şamdanı; orijin duvarda şamdanın altı. Dövme demir kol, tabak, mum.
export function sconce(f, fx) {
  f.box(-0.05, 1.55, 0, 0.1, 0.24, 0.02, C.iron)
  f.box(-0.015, 1.62, 0.02, 0.03, 0.03, 0.14, C.iron)
  f.box(-0.06, 1.62, 0.12, 0.12, 0.015, 0.12, C.iron)
  candle(f, fx, 0, 1.635, 0.18, 0.14)
  f.glow(-0.45, 0.004, 0.02, 0.9, 0.7, LIGHT.candle)
}

// ---------------------------------------------------------------- arka duvar

// Kemerli kapı; orijin kapının ortası. Ortası yükselen tahta kanat, demir kuşaklar ve çiviler,
// halka tokmak; yontma taş söveler ve basamaklı kemer.
export function archDoor(f) {
  const heights = [2.0, 2.14, 2.22, 2.14, 2.0]
  const pw = 0.2
  heights.forEach((h, i) => f.box(-0.5 + i * pw + 0.004, 0, -0.03, pw - 0.008, h, 0.07, i % 2 ? C.wood : C.woodDark))
  for (const y of [0.4, 1.55]) {
    f.box(-0.5, y, 0.04, 1.0, 0.06, 0.012, C.iron)
    for (let i = 0; i < 5; i++) f.box(-0.43 + i * 0.2, y + 0.015, 0.052, 0.03, 0.03, 0.01, C.ironLight)
  }
  disk(f, 0.3, 1.0, 0.04, 0.06, 0.02, 0.012, C.iron)
  disk(f, 0.3, 1.0, 0.052, 0.035, 0.0175, 0.004, C.wood)
  // söveler ve kemer
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const wide = k % 2 ? 0.2 : 0.15
      f.box(s < 0 ? -0.5 - wide : 0.5, k * 0.34, -0.03, wide, 0.34 - 0.01, 0.1, C.dressed)
    }
  }
  ;[[-0.62, 2.04, 0.22], [-0.42, 2.18, 0.22], [-0.2, 2.26, 0.4], [0.2, 2.18, 0.22], [0.4, 2.04, 0.22]].forEach(([x, y, w]) => {
    f.box(x, y, -0.03, w - 0.01, 0.2, 0.1, C.dressed)
  })
}

// Kitaplık; orijin ortası. Altı rafta eski ciltler, yer yer yatık kitaplar, tomarlar, kafatası,
// kavanoz; önünde süzülüp yavaşça dönen iki kitap (fx.lit).
export function bookshelf(f, rnd, fx) {
  const W = 1.6
  const H = 2.4
  const D = 0.45
  f.box(-W / 2, 0, 0, W, 0.1, D, C.woodDark)
  f.box(-W / 2, 0.1, 0, 0.06, H - 0.1, D, C.wood)
  f.box(W / 2 - 0.06, 0.1, 0, 0.06, H - 0.1, D, C.wood)
  f.box(-W / 2 + 0.06, 0.1, 0, W - 0.12, H - 0.1, 0.02, C.woodDark)
  f.box(-W / 2 - 0.03, H, -0.01, W + 0.06, 0.07, D + 0.04, C.woodDark)
  const shelves = [0.1, 0.48, 0.86, 1.24, 1.62, 2.0]
  shelves.forEach((y, s) => {
    if (s > 0) f.box(-W / 2 + 0.06, y - 0.03, 0.02, W - 0.12, 0.03, D - 0.03, C.wood)
    let x = -W / 2 + 0.08
    const end = W / 2 - 0.08
    const special = s === 2 ? 'skull' : s === 4 ? 'scrolls' : s === 1 ? 'jar' : null
    const specialAt = -0.1 + rnd() * 0.4
    while (x < end - 0.05) {
      if (special && x > specialAt && x < specialAt + 0.1) {
        if (special === 'skull') {
          f.box(x, y, 0.12, 0.13, 0.11, 0.15, C.bone)
          f.box(x + 0.02, y, 0.27, 0.09, 0.05, 0.02, C.bone)
          for (const ex of [0.025, 0.075]) f.box(x + ex, y + 0.055, 0.27, 0.03, 0.03, 0.004, C.ink)
          candle(f, fx, x + 0.065, y + 0.11, 0.2, 0.06)
        } else if (special === 'scrolls') {
          for (let k = 0; k < 3; k++) stick(f, [x, y + 0.035 + k * 0.05, 0.1 + k * 0.05], [x + 0.2, y + 0.035 + k * 0.05, 0.1 + k * 0.05], 0.05, C.parchment)
        } else {
          f.box(x, y, 0.15, 0.12, 0.16, 0.12, pick(rnd, [M.green, M.violet, M.cyan]), BULB)
          f.box(x - 0.005, y + 0.16, 0.145, 0.13, 0.03, 0.13, C.cork)
        }
        x += 0.24
        continue
      }
      if (rnd() < 0.08 && x < end - 0.3) {
        // yatık kitap yığını
        for (let k = 0; k < 2 + Math.floor(rnd() * 2); k++) f.box(x, y + k * 0.045, 0.06, 0.24 - k * 0.02, 0.045, 0.3, pick(rnd, C.book))
        x += 0.27
        continue
      }
      const bw = 0.045 + rnd() * 0.04
      const bh = 0.22 + rnd() * 0.11
      const color = pick(rnd, C.book)
      const bz = 0.05 + rnd() * 0.04
      f.box(x, y, bz, bw, bh, 0.3, color)
      if (bw > 0.065) f.box(x + 0.01, y + bh * 0.7, bz + 0.3, bw - 0.02, 0.015, 0.003, C.brass)
      x += bw + 0.004
    }
  })
  // süzülen kitaplar
  ;[[-0.35, 1.95, 0.0], [0.3, 2.2, 1.7]].forEach(([x, y, phase], i) => {
    const color = C.book[(i * 3) % C.book.length]
    fx.lit.movers.push({
      items: [fxBox(f, x - 0.12, y, 0.75, 0.24, 0.05, 0.17, color, { rot: [0.3, 0.4 + i, 0.1] })],
      axis: [0, 1, 0],
      travel: 0,
      period: 1,
      phase,
      sway: [0.03, 0.07, 0.02],
      swayPeriod: 3.2 + i,
      flutter: { axis: axisOf(f, 0, 1, 0), amp: 0.5 },
    })
  })
}

// Baykuş; orijin ayaklarının ortası. Başı yavaşça sağa sola döner (gövde lit, gözler room).
function owl(f, fx) {
  f.box(-0.08, 0, -0.07, 0.16, 0.2, 0.14, C.owl)
  f.box(-0.055, 0.03, 0.07, 0.11, 0.13, 0.01, C.owlBelly)
  f.box(-0.09, 0.04, -0.06, 0.02, 0.13, 0.11, C.woodDark)
  f.box(0.07, 0.04, -0.06, 0.02, 0.13, 0.11, C.woodDark)
  for (const x of [-0.04, 0.02]) f.box(x, -0.01, 0.0, 0.02, 0.02, 0.08, C.beak)
  const motion = { pivot: f.point(0, 0.26, 0).toArray(), axis: axisOf(f, 0, 1, 0), amp: 0.6, period: 6.5, phase: 0.2 }
  fx.lit.swingers.push({
    ...motion,
    items: [
      fxBox(f, -0.075, 0.2, -0.065, 0.15, 0.13, 0.13, C.owl),
      fxBox(f, -0.06, 0.215, 0.065, 0.12, 0.1, 0.008, C.owlFace),
      fxBox(f, -0.075, 0.33, -0.02, 0.03, 0.05, 0.03, C.owl),
      fxBox(f, 0.045, 0.33, -0.02, 0.03, 0.05, 0.03, C.owl),
      fxBox(f, -0.01, 0.235, 0.073, 0.02, 0.03, 0.02, C.beak),
    ],
  })
  fx.room.swingers.push({
    ...motion,
    items: [fxBox(f, -0.045, 0.265, 0.073, 0.03, 0.03, 0.006, M.gold), fxBox(f, 0.015, 0.265, 0.073, 0.03, 0.03, 0.006, M.gold)],
  })
}

// İksir dolabı; orijin ortası. Altta çekmeceli dolap ve tezgâh, üstte üç açık rafta parlayan
// iksir şişeleri (ağzı açık olanlardan kabarcık yükselir); owl: tepeye baykuş kondur.
export function potionCabinet(f, rnd, fx, withOwl) {
  const W = 1.2
  const D = 0.5
  f.box(-W / 2, 0, 0, W, 0.9, D, C.woodDark)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = -W / 2 + 0.05 + c * 0.37
      const y = 0.08 + r * 0.27
      f.box(x, y, D, 0.33, 0.24, 0.015, C.wood)
      f.box(x + 0.14, y + 0.1, D + 0.015, 0.05, 0.03, 0.025, C.brass)
    }
  }
  f.box(-W / 2 - 0.03, 0.9, -0.01, W + 0.06, 0.05, D + 0.05, C.wood)
  f.box(-W / 2, 0.95, 0, 0.05, 1.2, 0.3, C.wood)
  f.box(W / 2 - 0.05, 0.95, 0, 0.05, 1.2, 0.3, C.wood)
  f.box(-W / 2 + 0.05, 0.95, 0, W - 0.1, 1.2, 0.02, C.woodDark)
  f.box(-W / 2 - 0.02, 2.15, -0.01, W + 0.04, 0.05, 0.33, C.woodDark)
  const colors = [M.green, M.violet, M.cyan, M.red, M.amber, M.pink]
  ;[1.0, 1.4, 1.8].forEach((y, s) => {
    f.box(-W / 2 + 0.05, y - 0.025, 0.02, W - 0.1, 0.025, 0.27, C.wood)
    for (let i = 0; i < 6; i++) {
      const x = -W / 2 + 0.1 + i * 0.17
      const color = colors[(i + s * 2) % colors.length]
      const kind = (i + s) % 3
      if (kind === 0) {
        f.box(x, y, 0.1, 0.11, 0.1, 0.11, color, BULB)
        f.box(x + 0.035, y + 0.1, 0.135, 0.04, 0.07, 0.04, C.glass)
      } else if (kind === 1) {
        f.box(x + 0.02, y, 0.12, 0.07, 0.2, 0.07, color, BULB)
        f.box(x + 0.035, y + 0.2, 0.135, 0.04, 0.05, 0.04, C.glass)
        f.box(x + 0.03, y + 0.25, 0.13, 0.05, 0.03, 0.05, C.cork)
        continue
      } else {
        f.box(x + 0.01, y, 0.11, 0.09, 0.14, 0.09, color, BULB)
        f.box(x + 0.03, y + 0.14, 0.13, 0.05, 0.04, 0.05, C.glass)
        f.box(x + 0.025, y + 0.18, 0.125, 0.06, 0.03, 0.06, C.cork)
        continue
      }
      // ağzı açık şişeden yükselen kabarcıklar
      for (let k = 0; k < 2; k++) {
        fx.room.movers.push({
          items: [fxBox(f, x + 0.04 + k * 0.01, y + 0.17, 0.145, 0.018, 0.018, 0.018, color)],
          axis: [0, 1, 0],
          travel: 0.16,
          period: 1.4 + rnd(),
          phase: rnd(),
          fade: 0.3,
        })
      }
    }
    f.glow(-W / 2 + 0.05, y + 0.002, 0.02, W - 0.1, 0.27, colors[s * 2])
  })
  if (withOwl) owl(f.frame(0.32, 2.2, 0.2), fx)
}

// Simya tezgâhı; orijin ortası. Kalın meşe tezgâhta mavi alevli ocak üstünde fokurdayan balon,
// bakır boruyla damlayan imbik ve toplama şişesi, havan ve tokmak, pirinç terazi, parlayan
// kristaller, deney tüpü askısı, açık kitap; duvarda kavanoz rafı ve yıldız haritası.
export function alchemyBench(f, rnd, fx) {
  const W = 1.6
  const D = 0.62
  const T = 0.92
  for (const x of [-W / 2 + 0.06, W / 2 - 0.14]) {
    for (const z of [0.06, D - 0.14]) f.box(x, 0, z, 0.08, T - 0.06, 0.08, C.woodDark)
  }
  f.box(-W / 2 + 0.1, 0.16, 0.1, W - 0.2, 0.04, D - 0.2, C.wood)
  f.box(-W / 2, T - 0.06, 0, W, 0.06, D, C.wood)
  // ocak ve balon
  const bx = -0.45
  f.box(bx - 0.1, T, 0.18, 0.2, 0.1, 0.2, C.iron)
  flame(f, fx, bx, T + 0.1, 0.28, 1.4, C.blueFlame)
  f.box(bx - 0.11, T + 0.17, 0.17, 0.22, 0.015, 0.22, C.iron)
  f.box(bx - 0.1, T + 0.185, 0.18, 0.2, 0.12, 0.2, M.green, BULB)
  f.box(bx - 0.08, T + 0.305, 0.2, 0.16, 0.04, 0.16, C.glass)
  f.box(bx - 0.03, T + 0.345, 0.255, 0.06, 0.12, 0.05, C.glass)
  for (let k = 0; k < 3; k++) {
    fx.room.movers.push({
      items: [fxBox(f, bx - 0.012 + (k - 1) * 0.02, T + 0.31, 0.27, 0.02, 0.02, 0.02, M.green)],
      axis: [0, 1, 0],
      travel: 0.16,
      period: 0.9 + 0.3 * k,
      phase: k / 3,
      fade: 0.3,
    })
  }
  stick(f, [bx + 0.03, T + 0.44, 0.28], [0.12, T + 0.2, 0.3], 0.022, C.copper)
  // toplama şişesi ve damla
  f.box(0.09, T, 0.24, 0.12, 0.12, 0.12, M.green, BULB)
  f.box(0.12, T + 0.12, 0.27, 0.06, 0.06, 0.06, C.glass)
  fx.room.movers.push({ items: [fxBox(f, 0.11, T + 0.18, 0.29, 0.016, 0.022, 0.016, M.green)], axis: [0, -1, 0], travel: 0.05, period: 1.1, phase: 0, fade: 0.25 })
  // havan, terazi, kristaller, tüpler, kitap
  f.box(0.3, T, 0.36, 0.12, 0.08, 0.12, C.stone[3])
  f.box(0.32, T + 0.08, 0.38, 0.08, 0.004, 0.08, C.herb[1])
  stick(f, [0.36, T + 0.06, 0.42], [0.42, T + 0.2, 0.45], 0.025, C.stone[1])
  f.box(0.55, T, 0.12, 0.06, 0.03, 0.06, C.brass)
  f.box(0.575, T + 0.03, 0.135, 0.01, 0.28, 0.01, C.brass)
  f.box(0.45, T + 0.3, 0.135, 0.26, 0.012, 0.01, C.brass)
  for (const x of [0.43, 0.67]) {
    f.box(x - 0.002, T + 0.2, 0.138, 0.004, 0.1, 0.004, C.brass)
    f.box(x - 0.05, T + 0.19, 0.09, 0.1, 0.012, 0.1, C.brass)
  }
  ;[[-0.72, 0.42, 0.5], [-0.66, 0.46, -0.4], [-0.69, 0.5, 0.1]].forEach(([x, z, r], i) => {
    f.box(x, T, z, 0.04, 0.09 + i * 0.02, 0.04, i === 1 ? M.violet : M.cyan, { ...BULB, rot: [0, 0.5, r * 0.6] })
  })
  f.box(-0.25, T, 0.06, 0.24, 0.03, 0.08, C.woodDark)
  ;[M.red, M.amber, M.violet, M.cyan].forEach((color, i) => {
    f.box(-0.235 + i * 0.058, T + 0.03, 0.085, 0.03, 0.12, 0.03, color, BULB)
  })
  f.box(-0.24, T + 0.1, 0.06, 0.24, 0.015, 0.08, C.woodDark)
  f.box(-0.2, T, 0.38, 0.34, 0.012, 0.22, C.book[0])
  f.box(-0.19, T + 0.012, 0.39, 0.155, 0.006, 0.2, C.parchment)
  f.box(-0.025, T + 0.012, 0.39, 0.155, 0.006, 0.2, C.parchment)
  for (let k = 0; k < 3; k++) f.box(-0.17, T + 0.019, 0.42 + k * 0.05, 0.1, 0.001, 0.006, C.ink)
  f.box(0.0, T + 0.019, 0.43, 0.09, 0.001, 0.09, M.violet, BULB)
  f.glow(-W / 2, T + 0.003, 0, W, D, LIGHT.candle)
  // duvarda raf ve yıldız haritası
  f.box(-0.75, 1.72, 0, 0.7, 0.03, 0.2, C.wood)
  for (const x of [-0.72, -0.12]) f.box(x, 1.6, 0, 0.03, 0.12, 0.17, C.iron)
  ;[C.herb[0], M.amber, C.bone, C.herb[2]].forEach((color, i) => {
    const x = -0.7 + i * 0.16
    f.box(x, 1.75, 0.04, 0.12, 0.14, 0.11, color, color === M.amber ? BULB : {})
    f.box(x - 0.005, 1.89, 0.035, 0.13, 0.025, 0.12, C.cork)
  })
  f.box(0.1, 1.45, 0.014, 0.6, 0.6, 0.004, C.parchment)
  disk(f, 0.4, 1.75, 0.018, 0.22, 0.022, 0.002, C.ink)
  disk(f, 0.4, 1.75, 0.02, 0.2, 0.02, 0.002, '#1e2440')
  for (let i = 0; i < 9; i++) {
    const a = rnd() * TAU
    const r = rnd() * 0.17
    f.box(0.4 + Math.cos(a) * r - 0.008, 1.75 + Math.sin(a) * r - 0.008, 0.022, 0.016, 0.016, 0.002, M.gold, BULB)
  }
}

// ---------------------------------------------------------------- çalışma alanı

// Masa üstü; orijin oturanın önündeki masa kenarı, +z masanın içine. Rün işaretli açık büyü kitabı,
// tüy kalem ve hokka; sırayla toprak fincanda bitki çayı (buharı tüter), parlayan iksir şişesi ya
// da pirinç kadeh.
function studyItems(t, i, fx) {
  t.box(-0.18, 0, 0.05, 0.36, 0.014, 0.24, C.book[i % C.book.length])
  t.box(-0.17, 0.014, 0.06, 0.165, 0.008, 0.22, C.parchment)
  t.box(0.005, 0.014, 0.06, 0.165, 0.008, 0.22, C.parchment)
  for (let k = 0; k < 3; k++) t.box(-0.15, 0.022, 0.1 + k * 0.045, 0.12, 0.001, 0.006, C.ink)
  t.box(0.04, 0.022, 0.1, 0.1, 0.001, 0.1, i % 2 ? M.violet : M.cyan, BULB)
  t.box(-0.26, 0, 0.12, 0.05, 0.05, 0.05, C.ink)
  t.box(-0.25, 0.05, 0.13, 0.008, 0.16, 0.008, C.bone, { rot: [0.3, 0, -0.25] })
  const kind = i % 3
  if (kind === 0) {
    t.box(0.21, 0, 0.11, 0.08, 0.08, 0.08, C.clay)
    t.box(0.22, 0.08, 0.12, 0.06, 0.003, 0.06, C.tea)
    fx.steams.push(t.point(0.25, 0.09, 0.15).toArray())
  } else if (kind === 1) {
    t.box(0.22, 0, 0.12, 0.07, 0.08, 0.07, M.pink, BULB)
    t.box(0.24, 0.08, 0.14, 0.03, 0.05, 0.03, C.glass)
    t.box(0.235, 0.13, 0.135, 0.04, 0.02, 0.04, C.cork)
  } else {
    t.box(0.22, 0, 0.12, 0.07, 0.012, 0.07, C.brass)
    t.box(0.248, 0.012, 0.148, 0.014, 0.07, 0.014, C.brass)
    t.box(0.22, 0.082, 0.12, 0.07, 0.06, 0.07, C.brass)
    t.box(0.228, 0.142, 0.128, 0.054, 0.003, 0.054, M.red)
  }
}

// Gotik sandalye; oturan +z yönüne bakar. Yüksek sivri arkalık, kadife minder.
export function gothicChair(f) {
  for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) f.box(x - 0.025, 0, z - 0.025, 0.05, 0.43, 0.05, C.woodDark)
  f.box(-0.21, 0.43, -0.21, 0.42, 0.04, 0.42, C.wood)
  f.box(-0.18, 0.47, -0.17, 0.36, 0.03, 0.34, C.velvet)
  for (const x of [-0.17, 0.17]) {
    f.box(x - 0.025, 0.47, -0.215, 0.05, 0.72, 0.05, C.woodDark)
    f.box(x - 0.03, 1.19, -0.22, 0.06, 0.06, 0.06, C.wood)
  }
  f.box(-0.145, 1.02, -0.205, 0.29, 0.1, 0.03, C.wood)
  f.box(-0.145, 0.55, -0.2, 0.29, 0.47, 0.02, C.velvetLight)
  f.box(-0.05, 1.08, -0.2, 0.1, 0.1, 0.02, C.wood, { rot: [0, 0, Math.PI / 4] })
}

// Pencere okuma masası; orijin duvar dibinde pencerenin ortası, yerel +z odanın içi. Torna ayaklı
// meşe masa, pirinç şamdanda mum, kitap yığını; önünde pencereye bakan gotik sandalye.
// light: mumu nokta ışık olarak ekle.
export function readingDesk(f, room, fx, light) {
  const front = 0.02 + DESK_DEPTH
  f.box(-0.5, TABLE_HEIGHT - 0.05, 0.02, 1.0, 0.05, DESK_DEPTH, C.wood)
  f.box(-0.46, TABLE_HEIGHT - 0.13, 0.05, 0.92, 0.08, DESK_DEPTH - 0.06, C.woodDark)
  for (const x of [-0.42, 0.42]) {
    for (const z of [0.09, front - 0.07]) {
      f.box(x - 0.035, 0, z - 0.035, 0.07, TABLE_HEIGHT - 0.13, 0.07, C.woodDark)
      f.box(x - 0.045, 0.3, z - 0.045, 0.09, 0.06, 0.09, C.wood)
    }
  }
  f.box(0.3, TABLE_HEIGHT, 0.2, 0.12, 0.012, 0.12, C.brass)
  candle(f, fx, 0.36, TABLE_HEIGHT + 0.012, 0.26, 0.14)
  for (let k = 0; k < 3; k++) f.box(-0.44 + k * 0.01, TABLE_HEIGHT + k * 0.04, 0.16, 0.22 - k * 0.03, 0.04, 0.16, C.book[(k + 2) % C.book.length])
  f.glow(-0.5, TABLE_HEIGHT + 0.003, 0.02, 1.0, DESK_DEPTH, LIGHT.candle)
  if (light) room.lights.push({ position: f.point(0.3, 1.25, 0.4).toArray(), color: LIGHT.candle })

  const seat = f.frame(0, 0, DESK_CHAIR, Math.PI)
  gothicChair(seat)
  room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing() })
  studyItems(seat.frame(0, TABLE_HEIGHT, DESK_CHAIR - front), room.seats.length - 1, fx)
}

// Meşe çalışma masası; orijin ortası, uzun kenarı z boyunca. Sehpa ayaklar, ortada üç kollu
// şamdan, masanın üstünde süzülen üç mum; iki yanda (±x) gotik sandalye. light: nokta ışık ekle.
export function studyTable(f, room, fx, light) {
  f.box(-0.45, TABLE_HEIGHT - 0.06, -0.6, 0.9, 0.06, 1.2, C.wood)
  for (const z of [-0.42, 0.42]) {
    f.box(-0.3, 0.06, z - 0.05, 0.6, TABLE_HEIGHT - 0.12, 0.1, C.woodDark)
    f.box(-0.38, 0, z - 0.08, 0.76, 0.06, 0.16, C.woodDark)
  }
  f.box(-0.04, 0.22, -0.37, 0.08, 0.08, 0.74, C.woodDark)
  // şamdan
  f.box(-0.07, TABLE_HEIGHT, -0.07, 0.14, 0.02, 0.14, C.brass)
  f.box(-0.015, TABLE_HEIGHT + 0.02, -0.015, 0.03, 0.2, 0.03, C.brass)
  f.box(-0.015, TABLE_HEIGHT + 0.19, -0.16, 0.03, 0.03, 0.32, C.brass)
  for (const z of [-0.15, 0, 0.15]) {
    f.box(-0.03, TABLE_HEIGHT + 0.22, z - 0.03, 0.06, 0.012, 0.06, C.brass)
    candle(f, fx, 0, TABLE_HEIGHT + 0.232, z, z === 0 ? 0.14 : 0.1)
  }
  // süzülen mumlar: gövde ışık alır, alev parlar; ikisi birlikte iner kalkar
  ;[[-0.2, 1.45, -0.32], [0.16, 1.6, 0.05], [-0.06, 1.52, 0.38]].forEach(([x, y, z], i) => {
    const motion = { axis: [0, 1, 0], travel: 0, period: 1, phase: i * 0.33, sway: [0, 0.06, 0], swayPeriod: 3.4 + i * 0.5 }
    fx.lit.movers.push({ ...motion, items: [fxBox(f, x - 0.022, y, z - 0.022, 0.044, 0.16, 0.044, C.candle)] })
    fx.room.movers.push({
      ...motion,
      items: [fxBox(f, x - 0.014, y + 0.164, z - 0.014, 0.028, 0.05, 0.028, C.flame[0]), fxBox(f, x - 0.008, y + 0.169, z - 0.008, 0.016, 0.03, 0.016, C.flame[1])],
    })
  })
  f.glow(-0.45, TABLE_HEIGHT + 0.003, -0.6, 0.9, 1.2, LIGHT.candle)
  if (light) room.lights.push({ position: f.point(0, 1.55, 0).toArray(), color: LIGHT.candle })

  for (const s of [-1, 1]) {
    const seat = f.frame(s * 0.72, 0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2)
    gothicChair(seat)
    room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing() })
    studyItems(seat.frame(0, TABLE_HEIGHT, 0.27), room.seats.length - 1, fx)
  }
}

// Halı; [x0, x1] x [z0, z1] (çalışma masalarının altı). Lacivert zemin, altın kenar, kırmızı iç çerçeve.
export function rug(f, x0, z0, x1, z1) {
  f.box(x0, 0, z0, x1 - x0, 0.01, z1 - z0, C.rug[1])
  f.box(x0 + 0.08, 0.01, z0 + 0.08, x1 - x0 - 0.16, 0.003, z1 - z0 - 0.16, C.rug[0])
  f.box(x0 + 0.2, 0.013, z0 + 0.2, x1 - x0 - 0.4, 0.002, z1 - z0 - 0.4, C.rug[2])
  f.box(x0 + 0.24, 0.015, z0 + 0.24, x1 - x0 - 0.48, 0.002, z1 - z0 - 0.48, C.rug[0])
}

// Kanatlı berjer; oturan +z yönüne bakar.
function wingChair(f) {
  for (const [x, z] of [[-0.26, -0.24], [0.22, -0.24], [-0.26, 0.2], [0.22, 0.2]]) f.box(x, 0, z, 0.04, 0.1, 0.04, C.woodDark)
  f.box(-0.3, 0.1, -0.3, 0.6, 0.3, 0.58, C.velvet)
  f.box(-0.22, 0.4, -0.22, 0.44, 0.06, 0.48, C.velvetLight)
  f.box(-0.3, 0.1, -0.42, 0.6, 1.0, 0.13, C.velvet)
  for (const x of [-0.3, 0.22]) {
    f.box(x, 0.4, -0.3, 0.08, 0.22, 0.56, C.velvet)
    f.box(x, 0.62, -0.42, 0.08, 0.42, 0.22, C.velvet)
  }
  f.box(-0.22, 0.46, -0.3, 0.44, 0.58, 0.02, C.velvetLight)
}

// Okuma köşesi; orijin ortası. Yuvarlak halı, mumlu küçük yuvarlak masa, iki yanda (±z)
// karşılıklı berjer.
export function readingCorner(f, room, fx) {
  diskXZ(f, 0, 1.0, 0.1, 0.01, C.rug[2])
  diskXZ(f, 0.01, 0.82, 0.1, 0.004, C.rug[1])
  diskXZ(f, 0.014, 0.74, 0.1, 0.004, C.rug[2])
  f.box(-0.05, 0.014, -0.05, 0.1, 0.5, 0.1, C.woodDark)
  f.box(-0.2, 0.014, -0.2, 0.4, 0.04, 0.4, C.woodDark)
  diskXZ(f, 0.52, 0.32, 0.064, 0.04, C.wood)
  candle(f, fx, 0, 0.56, 0, 0.1)
  f.glow(-0.32, 0.563, -0.32, 0.64, 0.64, LIGHT.candle)
  for (const s of [-1, 1]) {
    const seat = f.frame(0, 0.014, s * 0.8, s > 0 ? Math.PI : 0)
    wingChair(seat)
    room.seats.push({ position: seat.point(0, 0.46, 0).toArray(), yaw: seat.facing() })
    studyItems(seat.frame(0, 0.546, 0.48), room.seats.length - 1, fx)
  }
}

// ---------------------------------------------------------------- zemin eşyaları

// Kazan; orijin ortası, dünya eksenine hizalı. Taş halkalı ocakta yanan kütükler ve alevler,
// yukarı uçan kıvılcımlar; üç ayaklı demir kazanda fokurdayan yeşil iksir (kabarcıklar patlar),
// yükselen yeşil duman, kepçe. back: arka duvara uzaklık (duvarda ot ve kepçe askısı).
// Kazan yeşil nokta ışık verir.
export function cauldron(f, rnd, fx, room, back) {
  // ocak
  diskXZ(f, 0, 0.5, 0.1, 0.012, C.ash)
  ring(f, 0, 0.52, 11, 0.14, (s, x, y, z, w, h, d) => s.box(x + 0.01, y, z, w - 0.02, 0.12, d, pick(rnd, C.stone)))
  stick(f, [-0.3, 0.05, -0.12], [0.3, 0.07, 0.14], 0.08, C.log)
  stick(f, [-0.25, 0.07, 0.2], [0.28, 0.05, -0.18], 0.08, C.log)
  ;[[-0.12, 0.08, 0.05, 1.4], [0.1, 0.09, -0.06, 1.2], [0.0, 0.1, 0.12, 1.1], [0.05, 0.08, -0.15, 1.0]].forEach(([x, y, z, s]) => flame(f, fx, x, y, z, s * 2.2))
  for (let i = 0; i < 6; i++) {
    const a = rnd() * TAU
    fx.room.movers.push({
      items: [fxBox(f, Math.cos(a) * 0.38, 0.15, Math.sin(a) * 0.38, 0.018, 0.018, 0.018, C.ember)],
      axis: [0, 1, 0],
      travel: 0.9 + rnd() * 0.5,
      period: 1.6 + rnd(),
      phase: rnd(),
      fade: 0.3,
      sway: [0.05, 0, 0.05],
      swayPeriod: 1.3 + rnd(),
    })
  }
  // kazan: aşağıdan yukarı genişleyip ağızda daralan halkalar
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + 0.5
    stick(f, [Math.sin(a) * 0.3, 0.42, Math.cos(a) * 0.3], [Math.sin(a) * 0.36, 0, Math.cos(a) * 0.36], 0.05, C.iron)
  }
  const profile = [[0.3, 0.22], [0.39, 0.33], [0.44, 0.45], [0.45, 0.57], [0.42, 0.69]]
  profile.forEach(([r, y], i) => cylinder(f, y, 0.12, r, 10, [C.iron, C.ironLight], 0.07, i < 2))
  cylinder(f, 0.81, 0.05, 0.44, 10, [C.ironLight], 0.06, false)
  diskXZ(f, 0.775, 0.38, 0.076, 0.02, M.green, BULB)
  for (const s of [-1, 1]) f.box(s * 0.47 - 0.02, 0.66, -0.05, 0.04, 0.12, 0.1, C.iron)
  stick(f, [0.12, 0.8, 0.08], [0.5, 1.12, 0.3], 0.03, C.woodDark)
  // kabarcıklar ve duman
  for (let i = 0; i < 7; i++) {
    const a = rnd() * TAU
    const r = rnd() * 0.3
    const size = 0.03 + rnd() * 0.035
    fx.room.movers.push({
      items: [fxBox(f, Math.cos(a) * r - size / 2, 0.8, Math.sin(a) * r - size / 2, size, size, size, i % 3 ? M.green : '#c8ff9a')],
      axis: [0, 1, 0],
      travel: 0.12 + rnd() * 0.1,
      period: 0.8 + rnd() * 0.7,
      phase: rnd(),
      fade: 0.35,
    })
  }
  for (let i = 0; i < 6; i++) {
    const size = 0.14 + rnd() * 0.08
    fx.mist.movers.push({
      items: [fxBox(f, (rnd() - 0.5) * 0.3 - size / 2, 0.9, (rnd() - 0.5) * 0.3 - size / 2, size, size, size, '#9dff8a')],
      axis: [0, 1, 0],
      travel: 1.4,
      period: 4 + rnd() * 1.5,
      phase: i / 6,
      fade: 0.4,
      sway: [0.12, 0, 0.08],
      swayPeriod: 2.4 + rnd(),
    })
  }
  f.glow(-1.1, 0.006, -1.1, 2.2, 2.2, M.green)
  f.glow(-0.55, 0.014, -0.55, 1.1, 1.1, M.amber)
  room.lights.push({ position: f.point(0, 1.3, 0).toArray(), color: LIGHT.cauldron })

  // duvarda ot ve kepçe askısı
  const w = f.frame(0, 0, -back)
  w.box(-0.6, 2.32, 0, 1.2, 0.05, 0.05, C.woodDark)
  for (const x of [-0.58, 0.55]) w.box(x, 2.24, 0, 0.03, 0.1, 0.06, C.iron)
  for (let i = 0; i < 6; i++) {
    const x = -0.5 + i * 0.2
    w.box(x - 0.004, 2.18, 0.02, 0.008, 0.14, 0.008, C.parchment)
    if (i % 3 === 2) {
      w.box(x - 0.006, 1.9, 0.015, 0.012, 0.3, 0.012, C.iron)
      w.box(x - 0.05, 1.86, 0.0, 0.1, 0.05, 0.08, C.copper)
    } else {
      w.box(x - 0.045, 2.0, -0.01 + 0.035, 0.09, 0.18, 0.06, pick(rnd, C.herb))
    }
  }
}

// Kristal küre; orijin ortası, dünya eksenine hizalı. Yerde rün çemberi (işaretler sırayla yanar),
// taş sütun üstünde pirinç pençeli küre, içinde nabız gibi atan çekirdek, çevresinde dolaşan
// ışıltılar. Mor nokta ışık verir.
export function crystalBall(f, fx, room) {
  ring(f, 0, 0.68, 28, 0.03, (s, x, y, z, w, h, d) => s.box(x, y, z, w, 0.005, d, M.violet, BULB))
  ring(f, 0, 0.56, 24, 0.02, (s, x, y, z, w, h, d) => s.box(x, y, z, w, 0.005, d, M.violet, BULB))
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU
    const g = f.frame(Math.sin(a) * 0.62, 0.006, Math.cos(a) * 0.62, a)
    const flicker = { rate: 0.25, duty: 0.6, phase: -k / 8 }
    fx.room.blinkers.push(fxBox(g, -0.035, 0, -0.008, 0.07, 0.003, 0.016, M.violet, flicker))
    fx.room.blinkers.push(fxBox(g, -0.008, 0, -0.035, 0.016, 0.003, 0.07, M.violet, { ...flicker, rot: [0, k % 2 ? 0.7 : 0, 0] }))
  }
  f.box(-0.25, 0, -0.25, 0.5, 0.12, 0.5, C.dressed)
  f.box(-0.14, 0.12, -0.14, 0.28, 0.78, 0.28, C.stone[1])
  f.box(-0.22, 0.9, -0.22, 0.44, 0.08, 0.44, C.dressed)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU
    stick(f, [Math.sin(a) * 0.06, 0.98, Math.cos(a) * 0.06], [Math.sin(a) * 0.13, 1.08, Math.cos(a) * 0.13], 0.025, C.brass)
  }
  f.box(-0.08, 0.98, -0.08, 0.16, 0.03, 0.16, C.brass)
  const cy = 1.15
  f.box(-0.13, cy - 0.06, -0.13, 0.26, 0.12, 0.26, C.crystal, BULB)
  f.box(-0.09, cy - 0.12, -0.09, 0.18, 0.24, 0.18, C.crystal, BULB)
  f.box(-0.11, cy - 0.1, -0.11, 0.22, 0.2, 0.22, C.crystal, { ...BULB, rot: [0, Math.PI / 4, 0] })
  fx.room.pulsers.push({ items: [fxBox(f, -0.05, cy - 0.05, -0.05, 0.1, 0.1, 0.1, '#ffffff', { rot: [0.6, 0.6, 0] })], amp: 0.35, period: 2.4, phase: 0, uniform: true })
  for (let i = 0; i < 5; i++) {
    fx.room.wanderers.push({
      ...fxBox(f, -0.012, cy - 0.012, -0.012, 0.024, 0.024, 0.024, i % 2 ? M.violet : M.gold),
      amp: [0.3, 0.22, 0.3],
      phase: i * 1.3,
    })
  }
  f.glow(-0.75, 0.008, -0.75, 1.5, 1.5, M.violet)
  room.lights.push({ position: f.point(0, 1.45, 0).toArray(), color: LIGHT.crystal })
}

// Gök küresi (orrery); orijin ortası. Üç ayaklı yuvarlak sehpada pirinç gövde, ortada parlayan
// güneş, çevresinde farklı hızlarda dönen iki gezegen (biri ayıyla).
export function orrery(f, fx) {
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU
    stick(f, [Math.sin(a) * 0.08, 0.7, Math.cos(a) * 0.08], [Math.sin(a) * 0.26, 0, Math.cos(a) * 0.26], 0.04, C.woodDark)
  }
  diskXZ(f, 0.7, 0.3, 0.06, 0.04, C.wood)
  f.box(-0.08, 0.74, -0.08, 0.16, 0.04, 0.16, C.brass)
  f.box(-0.015, 0.78, -0.015, 0.03, 0.3, 0.03, C.brass)
  f.box(-0.05, 1.08, -0.05, 0.1, 0.1, 0.1, M.gold, BULB)
  ;[[0.2, 6, C.planet[0], 0.045, false], [0.3, 11, C.planet[1], 0.055, true]].forEach(([r, period, color, size, moon], i) => {
    const y = 1.1 + i * 0.03
    const items = [fxBox(f, 0.05, y, -0.006, r - 0.05, 0.012, 0.012, C.brass), fxBox(f, r - size / 2, y - size / 2 + 0.006, -size / 2, size, size, size, color)]
    if (moon) items.push(fxBox(f, r + 0.07, y + 0.01, -0.01, 0.02, 0.02, 0.02, C.planet[2]))
    fx.lit.spinners.push({ items, pivot: f.point(0, 0, 0), axis: axisOf(f, 0, 1, 0), period, phase: i * 0.37 })
  })
}
