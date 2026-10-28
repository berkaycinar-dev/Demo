import { Euler, Quaternion } from 'three'
import { pick } from '../core/voxel'

// Sualtı araştırma üssü temasının voxel parçaları. Birim ≈ 1 metre.
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür. Duvar parçalarında orijin duvar yüzeyinin dibi, +z odanın içi.
// fx: hareket eden kutular ({ view, room, steams }); bunlar katmanlara değil ReefEffect'e gider.
// view grubundakiler (balık, yosun, kabarcık) suyun gün zamanı rengini alır, room grubundakiler
// (denizanası, sonar, durum ışıkları) kendi renginde parlar.

export const WALL = 0.25
export const FLOOR_BOTTOM = -0.36
export const WALL_HEIGHT = 3.0
export const SEAT_HEIGHT = 0.5
const SEAT_WIDTH = 0.85
const TABLE_DEPTH = 1.1
const TABLE_HEIGHT = 0.76
const PENDANT_HEIGHT = 2.45
const SILL = 0.45
const WINDOW_TOP = 2.5
const PANEL_TOP = 2.6
// Cam boşluğunun duvar uçlarından payı; balıklar bu payların içinde (duvarda) kaybolur.
const WINDOW_MARGIN = 0.45
// Camın arkasındaki deniz duvar kalınlığının içinde sığ bir dioramadır: su fonu BACK'te, kum,
// yosun, balık ve kabarcıklar onunla cam (GLASS_PLANE) arasında. Kamera dönünce öndekiler daha
// çok kayar, derinlik hissi verir.
const BACK = -WALL + 0.005
const GLASS_PLANE = -0.064
const TAU = Math.PI * 2
const GLASS = { layer: 'glass' }
const BULB = { layer: 'bulb' }
const NIGHT = { layer: 'night' }
const FULL_PANELS = [
  [0.14, 1.05],
  [1.1, PANEL_TOP],
]

export const C = {
  hullDark: '#2b3d4b',
  seam: '#8aa2b2',
  panel: ['#dbe7ee', '#d1dfe8'],
  panelBand: '#b8cad7',
  trim: '#263848',
  kick: '#1e2c38',
  plates: ['#59727f', '#5f7987', '#546d7a', '#647e8c'],
  stripe: '#f2c230',
  hazard: '#f2c230',
  hazardDark: '#23303a',
  led: '#a8f0ff',
  guide: '#5ee8e0',
  white: '#eef4f7',
  steel: '#b2c0ca',
  steelDark: '#76889a',
  dark: '#1f2c36',
  copper: '#c8834a',
  copperDark: '#9c6034',
  brass: '#d6a542',
  pipe: '#3f6f7f',
  yellow: '#f2c230',
  yellowDark: '#c99a1c',
  teal: '#2aa3b4',
  tealLight: '#6fd3de',
  screenBody: '#18252e',
  screen: '#0d2230',
  sonar: '#082a24',
  sonarLine: ['#4dffb0', '#2fc88a', '#1c8f63'],
  sonarDim: '#1d8a64',
  ui: ['#5ee0ff', '#7dffb0', '#ffd166', '#ff7b72'],
  door: '#c9d6df',
  porthole: '#174a75',
  water: ['#5cbcd8', '#47a8cc', '#3893be', '#2c7eae', '#22699a', '#1b5684'],
  ray: ['#8fd8ec', '#6fc6e0'],
  glare: '#cdeff8',
  sand: ['#d8c69a', '#cfbc8e', '#e0d1a6'],
  rock: ['#56636e', '#4b5762', '#63707b'],
  coral: ['#ff7f7a', '#ff9f5a', '#c86bd8', '#f25c8a', '#ffd166'],
  kelp: ['#5a8a3a', '#6b973e', '#4c793b'],
  blade: ['#7aa84a', '#86b04e'],
  bubble: '#dff6ff',
  fish: { silver: '#d6e5ee', blue: '#2f6fd6', orange: '#ff8a3d', yellow: '#ffd23f', white: '#ffffff', fin: '#8fb3c9', eye: '#18222b' },
  turtle: ['#6b7b3a', '#55652f', '#a3ad6e'],
  jelly: ['#f2b6ff', '#ffc2dc', '#b4ecff'],
  plankton: ['#7ffcff', '#a8ffe0', '#c7f4ff'],
  canvas: '#8797a3',
  canvasShade: '#74838e',
  boots: '#2a3138',
  counter: '#3c5464',
  tile: '#c9e7ed',
  grout: '#9cc7d0',
  mug: ['#eef4f7', '#2aa3b4', '#f2c230'],
  coffee: '#4a2f22',
  jar: '#9fd6e0',
  glowJar: ['#7dffd0', '#7fe6ff', '#d6a8ff'],
  specimen: ['#ff8a3d', '#f4e3c3', '#f25c8a', '#c86bd8', '#d6e5ee'],
  tankWater: '#4fb2c8',
  frond: ['#5f8f3a', '#7a9a3c', '#4f7f45', '#b5485d'],
  grow: '#9ff4ff',
  tank: ['#62c9e0', '#45afd0', '#2f92bd'],
  lens: '#123247',
  buoy: '#f0552d',
}

// Efekt kutusu: katmana değil efekt listesine gider. Merkez ve dönüş dünyada saklanır.
function fxBox(f, x, y, z, w, h, d, color, { rot, ...extra } = {}) {
  const quat = f.worldRotation()
  if (rot) quat.multiply(new Quaternion().setFromEuler(new Euler(rot[0], rot[1], rot[2])))
  return { center: f.point(x + w / 2, y + h / 2, z + d / 2), quat, size: [w, h, d], color, ...extra }
}

// Çerçevenin yerel bir yönü (dünyada); kayan ve dönen parçaların ekseni.
const axisOf = (f, x, y, z) => f.point(x, y, z).sub(f.point(0, 0, 0)).toArray()

// xy düzleminde r yarıçaplı disk: step yüksekliğinde yatay şeritler (z: arka yüz, d: kalınlık).
function disk(f, cx, cy, z, r, step, d, color, opts) {
  for (let y = -r; y < r - 1e-3; y += step) {
    const h = Math.min(step, r - y)
    const c = y + h / 2
    const half = Math.sqrt(Math.max(r * r - c * c, 0))
    f.box(cx - half, cy + y, z, 2 * half, h, d, color, opts)
  }
}

// ---------------------------------------------------------------- yapı

// Metal döşeme plakaları; aralardaki koyu gövde ek yeri gibi görünür. Ön kenarlarda sarı
// modül şeridi, duvar diplerinde gece yanan yönlendirme LED'i.
export function floor(f, width, depth, rnd) {
  f.box(0, FLOOR_BOTTOM, 0, width, -0.04 - FLOOR_BOTTOM, depth, C.hullDark)
  const tile = 0.75
  for (let x = 0; x < width - 1e-3; x += tile) {
    for (let z = 0; z < depth - 1e-3; z += tile) {
      const w = Math.min(tile, width - x)
      const d = Math.min(tile, depth - z)
      f.box(x + 0.012, -0.04, z + 0.012, w - 0.024, 0.04, d - 0.024, pick(rnd, C.plates))
    }
  }
  f.box(0, -0.22, depth, width, 0.06, 0.005, C.stripe)
  f.box(width, -0.22, 0, 0.005, 0.06, depth, C.stripe)
  f.box(0.04, 0, 0.03, width - 0.04, 0.006, 0.025, C.guide, NIGHT)
  f.box(0.03, 0, 0.055, 0.025, 0.006, depth - 0.055, C.guide, NIGHT)
}

// Duvar kaplaması [u0, u1] aralığında ~1 m'lik modüller; rows: [y0, y1] panel satırları.
function panels(f, u0, u1, rows) {
  const n = Math.max(1, Math.round((u1 - u0) / 1.0))
  const w = (u1 - u0) / n
  for (let i = 0; i < n; i++) {
    for (const [y0, y1] of rows) {
      f.box(u0 + i * w + 0.015, y0, -0.02, w - 0.03, y1 - y0, 0.02, C.panel[i % 2])
    }
  }
}

// Duvar gövdesi, süpürgelik, tepe bandı ve tavan LED şeridi. Orijin duvarın iç yüzü, u boyunca.
function wallShell(f, from, length) {
  f.box(from, FLOOR_BOTTOM, -WALL, length - from, -FLOOR_BOTTOM, WALL, C.hullDark)
  f.box(0, 0, -0.02, length, 0.12, 0.02, C.kick)
  f.box(0, PANEL_TOP + 0.03, -0.02, length, 0.03, 0.035, C.led, BULB)
  f.box(0, PANEL_TOP + 0.06, -0.02, length, WALL_HEIGHT - PANEL_TOP - 0.06, 0.02, C.panelBand)
  f.box(from, WALL_HEIGHT, -WALL, length - from, 0.04, WALL, C.trim)
}

// Arka duvar: z = 0 boyunca, x = -WALL'dan width'e. Tepe bandının önünde bakır ve çelik boru
// hattı, aralıklı kelepçelerle.
export function backWall(f, width) {
  wallShell(f, -WALL, width)
  f.box(-WALL, 0, -WALL, width + WALL, WALL_HEIGHT, WALL - 0.02, C.seam)
  panels(f, 0, width, FULL_PANELS)
  f.box(0, 2.76, 0.02, width, 0.08, 0.08, C.copper)
  f.box(0, 2.68, 0.03, width, 0.05, 0.05, C.pipe)
  const clamps = Math.max(2, Math.round(width / 1.4))
  for (let i = 0; i < clamps; i++) {
    const x = ((i + 0.5) * width) / clamps
    f.box(x - 0.025, 2.66, 0, 0.05, 0.2, 0.12, C.steelDark)
  }
}

// Sol duvar: boydan boya akvaryum camı ve arkasında deniz. Yerel u duvar boyunca (0 = ön kenar),
// iç yüzey v = 0. Balık, yosun, kabarcık ve denizanaları fx listesine gider.
export function aquariumWall(f, length, rnd, fx) {
  const a = WINDOW_MARGIN
  const b = length - WINDOW_MARGIN
  const t = WALL - 0.02
  wallShell(f, 0, length)
  f.box(0, 0, -WALL, a, WALL_HEIGHT, t, C.seam)
  f.box(b, 0, -WALL, length - b, WALL_HEIGHT, t, C.seam)
  f.box(a, 0, -WALL, b - a, SILL, t, C.seam)
  f.box(a, WINDOW_TOP, -WALL, b - a, WALL_HEIGHT - WINDOW_TOP, t, C.seam)
  panels(f, 0, a, FULL_PANELS)
  panels(f, b, length, FULL_PANELS)
  panels(f, a, b, [[0.14, SILL - 0.14]])

  // Kasa: alt pervaz odaya taşar, kayıtlar camın önünde. Hiçbir yüz duvar gövdesiyle aynı düzlemde
  // değil; pahlı köşeler kasanın arkasında kalır.
  const panes = Math.max(2, Math.round((b - a) / 1.6))
  const pw = (b - a) / panes
  f.box(a - 0.06, SILL - 0.12, -0.07, b - a + 0.12, 0.13, 0.19, C.trim)
  f.box(a - 0.06, WINDOW_TOP, -0.07, b - a + 0.12, 0.12, 0.11, C.trim)
  for (const u of [a, b - 0.06]) f.box(u, SILL, -0.07, 0.06, WINDOW_TOP - SILL, 0.11, C.trim)
  for (let i = 1; i < panes; i++) f.box(a + i * pw - 0.05, SILL, -0.07, 0.1, WINDOW_TOP - SILL, 0.12, C.trim)
  for (let i = 0; i <= panes; i++) {
    for (const y of [SILL, WINDOW_TOP]) {
      f.box(a + i * pw - 0.08, y - 0.08, -0.07, 0.16, 0.16, 0.065, C.trim, { rot: [0, 0, Math.PI / 4] })
    }
  }
  // camdaki eğik parıltı çizgileri
  for (let i = 0; i < panes; i++) {
    const u = a + i * pw
    f.box(u + pw * 0.22, SILL + 0.9, GLASS_PLANE, 0.035, 0.75, 0.002, C.glare, { ...GLASS, rot: [0, 0, -0.55] })
    f.box(u + pw * 0.22 + 0.12, SILL + 1.0, GLASS_PLANE, 0.018, 0.4, 0.002, C.glare, { ...GLASS, rot: [0, 0, -0.55] })
  }

  seaView(f, a, b, rnd, fx)
}

// Balık: gövde, renk şeridi, göz ve elmas kuyruk; burnu +u (dir 1) ya da -u (dir -1) yönünde.
function fishBoxes(f, u, y, v, dir, size, body, stripe) {
  const L = 0.1 * size
  const H = 0.045 * size
  const T = 0.034 * size
  return [
    fxBox(f, u - L / 2, y - H / 2, v, L, H, 0.012, body),
    fxBox(f, u - 0.01 * size - dir * 0.008 * size, y - H / 2, v + 0.012, 0.02 * size, H, 0.002, stripe),
    fxBox(f, u + dir * (L / 2 - 0.018 * size) - 0.006 * size, y + 0.004 * size, v + 0.012, 0.012 * size, 0.012 * size, 0.002, C.fish.eye),
    fxBox(f, u - dir * (L / 2 + 0.008 * size) - T / 2, y - T / 2, v + 0.002, T, T, 0.008, body, { rot: [0, 0, Math.PI / 4] }),
  ]
}

const SCHOOLS = [
  { count: 7, size: 0.75, body: C.fish.silver, stripe: C.fish.fin, speed: 0.16 },
  { count: 3, size: 1.1, body: C.fish.orange, stripe: C.fish.white, speed: 0.1 },
  { count: 5, size: 0.9, body: C.fish.blue, stripe: C.fish.yellow, speed: 0.13 },
  { count: 2, size: 1.35, body: C.fish.yellow, stripe: C.fish.fin, speed: 0.08 },
]

// Salınan yosun: 0.2 m'lik gövde parçaları ve dönüşümlü yapraklar. Her parça ayrı bir dalga
// hareketi; genlik tepeye doğru büyür, faz yukarı doğru gecikir.
function kelpStrand(f, fx, { u, v, base, height, w }, rnd) {
  const seg = 0.2
  const n = Math.max(2, Math.round(height / seg))
  const period = 5.5 + rnd() * 2.5
  const phase = rnd()
  const color = pick(rnd, C.kelp)
  const axis = axisOf(f, 1, 0, 0)
  for (let k = 0; k < n; k++) {
    const y = base + k * seg
    const items = [fxBox(f, u - w / 2, y, v, w, seg + 0.005, 0.01, color)]
    if (k > 0) {
      const left = k % 2 === 0
      items.push(fxBox(f, left ? u - w / 2 - 0.07 : u + w / 2 - 0.005, y + 0.04, v + 0.002, 0.075, 0.05, 0.006, pick(rnd, C.blade)))
    }
    const travel = 0.008 + 0.075 * Math.pow(k / (n - 1), 1.5)
    fx.view.movers.push({ items, axis, travel, period, phase: phase - k * 0.035, wave: true })
  }
}

// Camın arkasındaki deniz: arkada yukarıdan aşağı koyulaşan su bantları ve eğik ışık huzmeleri,
// dipte iki sıra kum tepeciği, kaya ve mercanlar; aralarında salınan yosunlar, geçen balık
// sürüleri ve deniz kaplumbağası, yükselen kabarcıklar, süzülen denizanaları. Gece suyun rengi
// koyulaşır; plankton (night) ve denizanaları ışır.
function seaView(f, a, b, rnd, fx) {
  const length = b - a
  const height = WINDOW_TOP - SILL
  const bh = height / C.water.length
  C.water.forEach((color, i) => f.box(a - 0.01, WINDOW_TOP - (i + 1) * bh, BACK, length + 0.02, bh, 0.004, color, GLASS))

  const rays = Math.max(2, Math.round(length / 1.2))
  for (let i = 0; i < rays; i++) {
    const u = a + ((i + 0.3 + rnd() * 0.4) * length) / rays
    const w = 0.07 + rnd() * 0.06
    const ray = f.frame(u, WINDOW_TOP, BACK + 0.006, 0, 0, 0.3)
    ray.box(-w / 2, -0.55, 0, w, 0.85, 0.002, C.ray[0], GLASS)
    ray.box(-w / 2, -1.15, 0, w, 0.6, 0.002, C.ray[1], GLASS)
  }

  // kum: arka sıra yüksek, ön sıra alçak tepecikler
  const dune = (u, k) => 0.5 + 0.3 * Math.sin(u * 1.9 + k) + 0.2 * Math.sin(u * 0.7 + 2.3 * k)
  const backH = (u) => 0.1 + 0.18 * dune(u, 0.4)
  const frontH = (u) => 0.04 + 0.1 * dune(u, 2.1)
  const step = 0.15
  for (let u = a; u < b - 1e-3; u += step) {
    const w = Math.min(step, b - u)
    f.box(u, SILL, BACK, w, backH(u + w / 2), -0.155 - BACK, pick(rnd, C.sand), GLASS)
    f.box(u, SILL, -0.155, w, frontH(u + w / 2), 0.085, pick(rnd, C.sand), GLASS)
  }

  const rocks = Math.max(2, Math.round(length / 1.5))
  for (let i = 0; i < rocks; i++) {
    const u = a + 0.15 + ((i + rnd() * 0.6) * (length - 0.45)) / rocks
    const w = 0.14 + rnd() * 0.14
    const h = 0.07 + rnd() * 0.08
    const y = SILL + frontH(u + w / 2) - 0.04
    f.box(u, y, -0.15, w, h, 0.06, pick(rnd, C.rock), GLASS)
    f.box(u + w * 0.3, y + h - 0.01, -0.145, w * 0.5, 0.05, 0.045, pick(rnd, C.rock), GLASS)
  }

  // mercanlar: ön sırada küçük, arka sırada büyük; dallı ya da yuvarlak
  const corals = Math.max(3, Math.round(length / 0.7))
  for (let i = 0; i < corals; i++) {
    const u = a + 0.12 + ((i + rnd()) * (length - 0.24)) / corals
    const color = pick(rnd, C.coral)
    const front = i % 2 === 0
    const y = SILL + (front ? frontH(u) : backH(u)) - 0.02
    const v = front ? -0.121 : -0.2
    if (rnd() < 0.55) {
      const n = 3 + Math.floor(rnd() * 2)
      for (let k = 0; k < n; k++) {
        const h = (front ? 0.07 : 0.13) + rnd() * 0.12
        const x = u + (k - (n - 1) / 2) * 0.045
        f.box(x - 0.012, y, v, 0.024, h, 0.024, color, GLASS)
        f.box(x - 0.022, y + h - 0.02, v - 0.004, 0.044, 0.024, 0.032, color, GLASS)
      }
    } else {
      const w = 0.12 + rnd() * 0.1
      f.box(u - w / 2, y, v - 0.009, w, 0.07 + rnd() * 0.04, 0.05, color, GLASS)
    }
  }

  const strands = []
  const backKelp = Math.max(3, Math.round(length / 0.55))
  for (let i = 0; i < backKelp; i++) {
    const u = a + 0.08 + ((i + 0.2 + rnd() * 0.6) * (length - 0.16)) / backKelp
    strands.push({ u, v: -0.215, base: SILL + backH(u) - 0.03, height: 0.9 + rnd() * 0.9, w: 0.035 })
  }
  const frontKelp = Math.max(1, Math.round(length / 1.8))
  for (let i = 0; i < frontKelp; i++) {
    const u = a + 0.2 + ((i + 0.3 + rnd() * 0.4) * (length - 0.4)) / frontKelp
    strands.push({ u, v: -0.088, base: SILL + frontH(u) - 0.02, height: 0.45 + rnd() * 0.4, w: 0.045 })
  }
  for (const s of strands) kelpStrand(f, fx, s, rnd)

  // Balık sürüleri: her balık duvar payının içinden çıkar, camın önünden geçip öbür uçta duvara
  // girer ve baştan döner (duvarın dışına hiç taşmaz). Aynı hız ve kaydırılmış faz sürüyü bir arada
  // tutar; duvara yaklaşan balık küçülerek kaybolur.
  const axis = axisOf(f, 1, 0, 0)
  const schools = Math.min(SCHOOLS.length, 1 + Math.floor(length / 2))
  const pad = 0.2
  const travel = length + 2 * pad
  for (let i = 0; i < schools; i++) {
    const s = SCHOOLS[i]
    const dir = i % 2 === 0 ? 1 : -1
    const y = SILL + 0.6 + ((i + 0.5) * (height - 0.95)) / schools
    const v = i % 2 === 0 ? -0.175 : -0.135
    const start = dir > 0 ? a - pad : b + pad
    const phase = rnd()
    const bob = { axis: [0, 1, 0], amp: 0.03, period: 3.5 + rnd() }
    for (let k = 0; k < s.count; k++) {
      const du = k * 0.13 + rnd() * 0.05
      const dy = (rnd() - 0.5) * (s.count > 2 ? 0.2 : 0.08)
      fx.view.movers.push({
        items: fishBoxes(f, start, y + dy, v + (k % 2) * 0.014, dir, s.size, s.body, s.stripe),
        axis: axis.map((c) => c * dir),
        travel,
        period: travel / s.speed,
        phase: phase - du / travel,
        fade: 0.3 / travel,
        bob,
      })
    }
  }
  if (length > 5) seaTurtle(f, fx, a, b, axis, rnd)

  // kabarcıklar: kumdaki deliklerden yükselip camın üst kasasında kaybolur
  const vents = Math.max(2, Math.round(length / 2.4))
  for (let i = 0; i < vents; i++) {
    const u = a + ((i + 0.3 + rnd() * 0.4) * length) / vents
    const y0 = SILL + frontH(u) - 0.02
    const travel = WINDOW_TOP + 0.1 - y0
    for (let k = 0; k < 4; k++) {
      const s = 0.018 + rnd() * 0.014
      fx.view.movers.push({
        items: [fxBox(f, u - s / 2, y0, -0.112, s, s, 0.004, C.bubble)],
        axis: [0, 1, 0],
        travel,
        period: travel / 0.28,
        phase: k / 4 + rnd() * 0.08,
        fade: 0.08,
        bob: { axis, amp: 0.012, period: 1.3 + rnd() * 0.4 },
      })
    }
  }

  // denizanaları: yavaşça yükselip alçalır, yana süzülür; gece suyun içinde parlar
  const jellies = Math.max(1, Math.round(length / 3.5))
  for (let i = 0; i < jellies; i++) {
    const u = a + ((i + 0.5) * length) / jellies + (rnd() - 0.5) * 0.4
    const y = SILL + 1.0 + rnd() * (height - 1.4)
    const color = C.jelly[i % C.jelly.length]
    const items = [
      fxBox(f, u - 0.055, y, -0.165, 0.11, 0.05, 0.03, color),
      fxBox(f, u - 0.035, y + 0.05, -0.16, 0.07, 0.025, 0.02, color),
    ]
    for (const [x, h] of [[-0.035, 0.1], [0, 0.14], [0.035, 0.09]]) items.push(fxBox(f, u + x - 0.004, y - h, -0.155, 0.008, h, 0.004, color))
    fx.room.movers.push({
      items,
      axis: [0, 1, 0],
      travel: 0.09,
      period: 6 + rnd() * 2,
      phase: rnd(),
      wave: true,
      bob: { axis, amp: 0.12, period: 15 + rnd() * 5 },
    })
  }

  // plankton: gece parlayan noktalar
  const specks = Math.round(length * 7)
  for (let i = 0; i < specks; i++) {
    const u = a + 0.05 + rnd() * (length - 0.1)
    const y = SILL + 0.4 + rnd() * (height - 0.45)
    const s = 0.012 + rnd() * 0.012
    f.box(u, y, -0.23 + rnd() * 0.12, s, s, 0.004, pick(rnd, C.plankton), NIGHT)
  }
}

// Deniz kaplumbağası: kabuk, karın, baş ve yüzgeçler; uzun camlarda tek başına, çok yavaş geçer.
function seaTurtle(f, fx, a, b, axis, rnd) {
  const dir = rnd() < 0.5 ? 1 : -1
  const pad = 0.24
  const u = dir > 0 ? a - pad : b + pad
  const y = WINDOW_TOP - 0.55
  const v = -0.105
  const part = (du, dy, w, h, dv, d, color, roll = 0) =>
    fxBox(f, u + dir * du - w / 2, y + dy - h / 2, v + dv, w, h, d, color, roll ? { rot: [0, 0, dir * roll] } : {})
  const items = [
    part(0, 0, 0.26, 0.09, 0, 0.03, C.turtle[0]),
    part(0, 0.06, 0.18, 0.04, 0.004, 0.022, C.turtle[1]),
    part(-0.05, 0.005, 0.05, 0.04, 0.03, 0.002, C.turtle[1]),
    part(0.05, 0.005, 0.05, 0.04, 0.03, 0.002, C.turtle[1]),
    part(0, -0.055, 0.22, 0.025, 0.006, 0.02, C.turtle[2]),
    part(0.16, 0.005, 0.07, 0.05, 0.006, 0.02, C.turtle[2]),
    part(0.07, -0.075, 0.13, 0.03, 0.02, 0.012, C.turtle[2], -0.5),
    part(-0.11, -0.06, 0.07, 0.025, 0.02, 0.012, C.turtle[2], 0.4),
  ]
  const travel = b - a + 2 * pad
  fx.view.movers.push({
    items,
    axis: axis.map((c) => c * dir),
    travel,
    period: travel / 0.05,
    phase: rnd(),
    fade: 0.4 / travel,
    bob: { axis: [0, 1, 0], amp: 0.06, period: 6 },
  })
}

// ---------------------------------------------------------------- arka duvar

// Basınç kapısı; orijin kapının ortası. Cıvatalı tek kanat, ortada sarı el çarkı, üstte pirinç
// çerçeveli lomboz, sağda tuş paneli (durum ışığı yanıp söner), üstte tabela, önde ikaz şeritli eşik.
export function pressureHatch(f, fx) {
  const W = 1.0
  const H = 2.05
  const J = 0.12
  f.box(-W / 2 - J, 0, -0.02, J, H + J, 0.12, C.trim)
  f.box(W / 2, 0, -0.02, J, H + J, 0.12, C.trim)
  f.box(-W / 2, H, -0.02, W, J, 0.12, C.trim)
  for (const s of [-1, 1]) f.box(s * (W / 2) - 0.11, H - 0.11, -0.02, 0.22, 0.22, 0.12, C.trim, { rot: [0, 0, Math.PI / 4] })

  f.box(-W / 2 + 0.005, 0.03, -0.02, W - 0.01, H - 0.03, 0.06, C.door)
  for (const y of [0.16, H - 0.2]) {
    for (const x of [-0.38, -0.13, 0.12, 0.37]) f.box(x - 0.015, y, 0.04, 0.03, 0.03, 0.01, C.steelDark)
  }
  f.box(-W / 2 + 0.005, 0.3, 0.04, W - 0.01, 0.06, 0.004, C.hazard)
  disk(f, 0, 1.58, 0.04, 0.17, 0.034, 0.02, C.brass)
  disk(f, 0, 1.58, 0.06, 0.125, 0.025, 0.003, C.porthole, GLASS)

  const w = f.frame(0, 1.0, 0.04)
  w.box(-0.04, -0.04, 0, 0.08, 0.08, 0.06, C.steelDark)
  w.box(-0.17, -0.012, 0.015, 0.34, 0.024, 0.02, C.brass)
  w.box(-0.012, -0.17, 0.015, 0.024, 0.34, 0.02, C.brass)
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    w.frame(Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0, 0, 0, a + Math.PI / 2).box(-0.07, -0.016, 0.01, 0.14, 0.032, 0.035, C.yellow)
  }

  // eşik
  const T = W + 2 * J
  f.box(-T / 2, 0, 0.1, T, 0.02, 0.2, C.hazardDark)
  for (let i = 0; i < 7; i += 2) f.box(-T / 2 + (i * T) / 7, 0.02, 0.1, T / 7, 0.004, 0.2, C.hazard)

  // tabela ve tuş paneli
  f.box(-0.32, H + J + 0.07, -0.02, 0.64, 0.14, 0.05, C.screenBody)
  f.box(-0.28, H + J + 0.1, 0.03, 0.56, 0.08, 0.003, C.tealLight, BULB)
  const k = W / 2 + J + 0.07
  f.box(k, 1.05, -0.02, 0.17, 0.27, 0.05, C.screenBody)
  f.box(k + 0.025, 1.17, 0.03, 0.12, 0.08, 0.003, C.screen, BULB)
  for (let i = 0; i < 3; i++) f.box(k + 0.025 + i * 0.045, 1.08, 0.03, 0.03, 0.05, 0.006, C.steel)
  fx.room.blinkers.push(fxBox(f, k + 0.065, 1.27, 0.03, 0.04, 0.025, 0.006, C.ui[1], { rate: 0.5, duty: 0.75, phase: 0 }))
}

// Eski tip dalış giysisi; orijin duvar dibi, giysi destek direğine asılı. Bakır başlık ve ön
// camı, pirinç göğüslük, ağırlık kemeri ve kurşun botlar; başlıktan duvara hava hortumu.
export function divingSuit(f) {
  f.box(-0.04, 0.04, -0.02, 0.08, 1.45, 0.06, C.steelDark)
  const s = f.frame(0, 0, 0.3)
  s.box(-0.3, 0, -0.3, 0.6, 0.04, 0.55, C.trim)
  for (const x of [-0.14, 0.03]) {
    s.box(x - 0.01, 0.04, -0.09, 0.13, 0.14, 0.25, C.boots)
    s.box(x + 0.005, 0.18, -0.07, 0.1, 0.3, 0.13, C.canvas)
    s.box(x, 0.48, -0.075, 0.11, 0.05, 0.14, C.canvasShade)
    s.box(x + 0.005, 0.53, -0.07, 0.1, 0.27, 0.13, C.canvas)
  }
  s.box(-0.19, 0.8, -0.11, 0.38, 0.48, 0.21, C.canvas)
  s.box(-0.195, 0.84, -0.115, 0.39, 0.07, 0.22, C.dark)
  for (const x of [-0.15, 0.05]) s.box(x, 0.835, 0.105, 0.1, 0.08, 0.02, C.yellow)
  for (const side of [-1, 1]) {
    const x = side < 0 ? -0.29 : 0.19
    s.box(x + 0.005, 0.88, -0.065, 0.1, 0.38, 0.12, C.canvas)
    s.box(x + 0.01, 0.78, -0.055, 0.09, 0.1, 0.1, C.boots)
  }
  s.box(-0.22, 1.28, -0.13, 0.44, 0.1, 0.25, C.brass)
  s.box(-0.16, 1.38, -0.15, 0.32, 0.3, 0.3, C.copper)
  s.box(-0.12, 1.68, -0.11, 0.24, 0.05, 0.22, C.copperDark)
  s.box(-0.1, 1.44, 0.15, 0.2, 0.18, 0.02, C.brass)
  s.box(-0.075, 1.465, 0.17, 0.15, 0.13, 0.004, C.porthole, GLASS)
  s.box(-0.004, 1.465, 0.174, 0.008, 0.13, 0.004, C.brass)
  s.box(0.16, 1.47, -0.06, 0.02, 0.13, 0.12, C.brass)
  s.box(0.18, 1.49, -0.04, 0.003, 0.09, 0.08, C.porthole, GLASS)
  s.box(-0.02, 1.58, -0.3, 0.04, 0.04, 0.15, C.copperDark)
}

// Sonar paneli; orijin ortası. Altta dolap ve eğik tuş paneli, duvarda yuvarlak sonar ekranı
// (tarama çizgisi döner, geçtiği hedef noktaları yanar) ve yanlarda derinlik grafikleri.
export function sonarConsole(f, length, rnd, fx) {
  const L = length
  f.box(-L / 2, 0, 0, L, 0.08, 0.5, C.kick)
  f.box(-L / 2, 0.08, 0, L, 0.74, 0.55, C.steel)
  const doors = Math.max(2, Math.round(L / 0.6))
  for (let i = 1; i < doors; i++) f.box(-L / 2 + (i * L) / doors - 0.004, 0.12, 0.55, 0.008, 0.66, 0.004, C.steelDark)
  f.box(-L / 2 - 0.02, 0.82, 0, L + 0.04, 0.04, 0.62, C.trim)
  f.box(-L / 2 + 0.05, 0.86, 0.02, L - 0.1, 0.15, 0.1, C.screenBody)
  const p = f.frame(0, 1.03, 0.08, 0, 0.6)
  p.box(-L / 2 + 0.05, -0.05, 0, L - 0.1, 0.05, 0.3, C.screenBody)
  const keys = Math.floor((L - 0.2) / 0.14)
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < keys; i++) {
      const x = -((keys - 1) * 0.14) / 2 + i * 0.14 - 0.03
      const color = C.ui[(i + r * 2) % 4]
      if ((i + r) % 5 === 2) {
        fx.room.blinkers.push(fxBox(p, x, 0, 0.07 + r * 0.12, 0.06, 0.012, 0.05, color, { rate: 0.4 + ((i * 7 + r) % 5) * 0.15, duty: 0.55, phase: (i * 0.37) % 1 }))
      } else {
        p.box(x, 0, 0.07 + r * 0.12, 0.06, 0.012, 0.05, color, BULB)
      }
    }
  }

  // sonar ekranı
  const R = 0.28
  const cy = 1.66
  const S = 2 * R + 0.12
  f.box(-S / 2, cy - S / 2, -0.02, S, S, 0.06, C.screenBody)
  disk(f, 0, cy, 0.04, R, 0.035, 0.003, C.sonar, BULB)
  for (const [r, n] of [[R * 0.45, 12], [R * 0.85, 22]]) {
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU
      f.box(Math.cos(t) * r - 0.009, cy + Math.sin(t) * r - 0.009, 0.043, 0.018, 0.018, 0.002, C.sonarDim, BULB)
    }
  }
  f.box(-R + 0.02, cy - 0.003, 0.043, 2 * R - 0.04, 0.006, 0.0015, C.sonarDim, BULB)
  f.box(-0.003, cy - R + 0.02, 0.043, 0.006, 2 * R - 0.04, 0.0015, C.sonarDim, BULB)
  const sweep = 4
  const pivot = f.point(0, cy, 0)
  const axis = axisOf(f, 0, 0, 1)
  C.sonarLine.forEach((color, i) => {
    fx.room.spinners.push({
      items: [fxBox(f, 0, cy - 0.005, 0.0475 - i * 0.0006, R * 0.95, 0.01, 0.0005, color)],
      pivot,
      axis,
      period: sweep,
      phase: -i * 0.025,
    })
  })
  // hedef noktaları: tarama çizgisi üstlerinden geçince yanar, bir süre sonra söner
  for (let i = 0; i < 3; i++) {
    const r = R * (0.3 + rnd() * 0.55)
    const t = rnd() * TAU
    fx.room.blinkers.push(fxBox(f, Math.cos(t) * r - 0.014, cy + Math.sin(t) * r - 0.014, 0.045, 0.028, 0.028, 0.002, C.ui[2], { rate: 1 / sweep, duty: 0.35, phase: -t / TAU }))
  }

  // yan ekranlar: derinlik grafikleri
  const sw = Math.min(0.42, (L - S) / 2 - 0.12)
  if (sw < 0.2) return
  for (const s of [-1, 1]) {
    const cx = s * (S / 2 + 0.1 + sw / 2)
    f.box(cx - sw / 2 - 0.02, 1.5, -0.02, sw + 0.04, 0.36, 0.05, C.screenBody)
    f.box(cx - sw / 2, 1.52, 0.03, sw, 0.32, 0.003, C.screen, BULB)
    const bars = Math.floor((sw - 0.04) / 0.06)
    for (let i = 0; i < bars; i++) {
      const bh = 0.06 + rnd() * 0.2
      f.box(cx - sw / 2 + 0.03 + i * 0.06, 1.55, 0.034, 0.035, bh, 0.002, s < 0 ? C.ui[0] : C.ui[1], BULB)
    }
  }
}

// Kupa; orijin dibinin ortası. Üstte kahve yüzeyi, yanda kulp.
function mug(f, x, z, color) {
  f.box(x - 0.04, 0, z - 0.04, 0.08, 0.09, 0.08, color)
  f.box(x - 0.03, 0.09, z - 0.03, 0.06, 0.003, 0.06, C.coffee)
  f.box(x + 0.04, 0.02, z - 0.01, 0.025, 0.05, 0.02, color)
}

// Kahve köşesi; orijin ortası. Alt dolap, tezgâh, fayans arkalık, kahve makinesi (hazır ışığı
// yanıp söner), önde buharı tüten kupa, kavanozlar ve üst dolap.
export function galley(f, fx) {
  const W = 0.9
  const D = 0.6
  f.box(-W / 2, 0, 0, W, 0.08, D - 0.05, C.kick)
  f.box(-W / 2, 0.08, 0, W, 0.8, D, C.white)
  f.box(-0.004, 0.14, D, 0.008, 0.68, 0.004, C.steelDark)
  for (const x of [-0.07, 0.04]) f.box(x, 0.66, D, 0.03, 0.12, 0.03, C.steelDark)
  f.box(-W / 2 - 0.02, 0.88, 0, W + 0.04, 0.05, D + 0.03, C.counter)
  f.box(-W / 2, 0.93, 0, W, 0.62, 0.01, C.tile)
  for (let i = 1; i < 4; i++) f.box(-W / 2, 0.93 + i * 0.155 - 0.004, 0.01, W, 0.008, 0.002, C.grout)

  const m = f.frame(-0.2, 0.93, 0.1)
  m.box(-0.15, 0, 0, 0.3, 0.04, 0.34, C.dark)
  m.box(-0.15, 0.04, 0, 0.3, 0.44, 0.14, C.steel)
  m.box(-0.15, 0.3, 0.14, 0.3, 0.18, 0.2, C.steel)
  m.box(-0.03, 0.25, 0.22, 0.06, 0.05, 0.06, C.dark)
  m.box(-0.11, 0.37, 0.34, 0.14, 0.07, 0.003, C.screen, BULB)
  fx.room.blinkers.push(fxBox(m, 0.07, 0.39, 0.34, 0.03, 0.03, 0.004, C.ui[1], { rate: 0.5, duty: 0.7, phase: 0.2 }))
  mug(m.frame(0, 0.04, 0), 0, 0.25, C.mug[2])

  const c = f.frame(0, 0.93, 0)
  mug(c, 0.2, 0.44, C.mug[1])
  fx.steams.push(c.point(0.2, 0.12, 0.44).toArray())
  c.box(0.22, 0, 0.06, 0.1, 0.16, 0.1, C.teal)
  c.box(0.22, 0.16, 0.06, 0.1, 0.02, 0.1, C.steel)
  c.box(0.34, 0, 0.06, 0.08, 0.12, 0.08, C.yellow)
  c.box(0.34, 0.12, 0.06, 0.08, 0.02, 0.08, C.steel)

  f.box(-W / 2, 1.6, 0, W, 0.55, 0.34, C.white)
  f.box(-0.004, 1.64, 0.34, 0.008, 0.47, 0.004, C.steelDark)
  for (const x of [-0.07, 0.04]) f.box(x, 1.64, 0.34, 0.03, 0.1, 0.03, C.steelDark)
  f.box(-W / 2 + 0.05, 1.585, 0.06, W - 0.1, 0.015, 0.22, C.led, BULB)
}

// Numune rafı; orijin ortası. Üç katta pirinç kapaklı kavanozlar (ön yüzünde örnek: deniz
// yıldızı, kabuk, mercan...), bazıları içten parlar; alt katta numune kasaları.
export function specimenShelf(f, length, rnd) {
  const L = length
  const D = 0.42
  const levels = [0.1, 0.62, 1.14, 1.66]
  const topY = 2.06
  for (const x of [-L / 2, L / 2 - 0.04]) f.box(x, 0, 0.02, 0.04, topY, D - 0.02, C.steelDark)
  for (const y of [...levels, topY]) {
    f.box(-L / 2, y - 0.04, 0.02, L, 0.04, D - 0.02, C.steelDark)
    f.box(-L / 2 + 0.04, y - 0.035, D, L - 0.08, 0.025, 0.004, C.white)
  }
  const crates = Math.max(1, Math.round((L - 0.1) / 0.45))
  const cw = (L - 0.1) / crates
  for (let k = 0; k < crates; k++) {
    const x = -L / 2 + 0.05 + k * cw
    f.box(x + 0.02, 0.1, 0.06, cw - 0.04, 0.3, 0.32, k % 2 === 0 ? C.yellow : C.teal)
    f.box(x + cw / 2 - 0.06, 0.3, 0.38, 0.12, 0.03, 0.02, C.dark)
  }
  let n = 0
  for (const y of levels.slice(1)) {
    const jars = Math.floor((L - 0.1) / 0.2)
    const pitch = (L - 0.1) / jars
    for (let k = 0; k < jars; k++) {
      const x = -L / 2 + 0.05 + (k + 0.5) * pitch
      const h = 0.2 + rnd() * 0.1
      const glow = n++ % 5 === 3
      f.box(x - 0.07, y, 0.12, 0.14, h, 0.16, glow ? pick(rnd, C.glowJar) : C.jar, glow ? BULB : GLASS)
      f.box(x - 0.075, y + h, 0.115, 0.15, 0.03, 0.17, C.brass)
      if (!glow) f.box(x - 0.04, y + 0.05, 0.28, 0.08, Math.min(0.1, h - 0.09), 0.003, pick(rnd, C.specimen))
    }
  }
}

// Yosun bahçesi rafı; orijin ortası. Üç katta su tankı, sıra sıra yosun ve kırmızı alg,
// her katın üstünde camgöbeği büyüme ışığı.
export function kelpFarm(f, length, rnd) {
  const L = length
  const D = 0.48
  const levels = [0.3, 0.95, 1.6]
  const topY = 2.2
  for (const x of [-L / 2, L / 2 - 0.04]) {
    for (const z of [0.02, D - 0.04]) f.box(x, 0, z, 0.04, topY, 0.04, C.steel)
  }
  f.box(-L / 2, topY, 0, L, 0.04, D, C.steel)
  levels.forEach((y, i) => {
    f.box(-L / 2, y, 0, L, 0.04, D, C.steel)
    f.box(-L / 2 + 0.05, y + 0.04, 0.05, L - 0.1, 0.16, D - 0.1, C.tankWater, GLASS)
    f.box(-L / 2 + 0.05, y + 0.2, 0.05, L - 0.1, 0.02, 0.02, C.steelDark)
    const above = i + 1 < levels.length ? levels[i + 1] : topY
    f.box(-L / 2 + 0.06, above - 0.025, 0.17, L - 0.12, 0.025, 0.12, C.grow, BULB)
    const n = Math.floor((L - 0.14) / 0.16)
    const pitch = (L - 0.14) / n
    for (let k = 0; k < n; k++) {
      const x = -L / 2 + 0.07 + (k + 0.5) * pitch
      const h = 0.18 + rnd() * 0.17
      const color = pick(rnd, C.frond)
      f.box(x - 0.02, y + 0.2, 0.18 + (k % 2) * 0.08, 0.04, h, 0.03, color)
      f.box(x + (k % 2 ? -0.07 : 0.015), y + 0.2 + h * 0.5, 0.185 + (k % 2) * 0.08, 0.055, 0.05, 0.02, color)
    }
  })
}

// ---------------------------------------------------------------- çalışma alanı

// Araştırma masası; orijin masanın ortası. back: duvar tarafı (kameraya bakar), front: karşı sıra,
// ends: uçlardaki koltuklar (1 = sağ uç, 2 = iki uç). Ortada masa akvaryumu, üstte sarkıt armatür.
export function researchTable(c, { back = 0, front = 0, ends = 0 }, room, fx) {
  const seats = Math.max(back, front, 1)
  const L = seats * SEAT_WIDTH + 0.55
  const D = TABLE_DEPTH
  const H = TABLE_HEIGHT
  const top = H - 0.06

  for (const x of L > 2.2 ? [-L / 2 + 0.6, L / 2 - 0.6] : [0]) {
    c.box(x - 0.3, 0, -0.3, 0.6, 0.04, 0.6, C.trim)
    c.box(x - 0.14, 0.04, -0.2, 0.28, top - 0.04, 0.4, C.steelDark)
  }
  c.box(-L / 2 + 0.2, top, -D / 2, L - 0.4, 0.06, D, C.white)
  for (const s of [-1, 1]) {
    c.box(s < 0 ? -L / 2 : L / 2 - 0.2, top, -D / 2 + 0.2, 0.2, 0.06, D - 0.4, C.white)
    for (const t of [-1, 1]) {
      c.box(s * (L / 2 - 0.2) - 0.1415, top, t * (D / 2 - 0.2) - 0.1415, 0.283, 0.06, 0.283, C.white, { rot: [0, Math.PI / 4, 0] })
    }
  }
  for (const z of [-D / 2 - 0.006, D / 2 - 0.009]) c.box(-L / 2 + 0.21, top + 0.015, z, L - 0.42, 0.02, 0.015, C.tealLight, BULB)

  deskAquarium(c.frame(0, H, 0), fx)

  pendant(c, Math.min(L - 0.3, 2.6))
  c.glow(-L / 2, H + 0.003, -D / 2, L, D)
  const lights = L > 3 ? [-L / 4, L / 4] : [0]
  for (const x of lights) room.lights.push(c.point(x, PENDANT_HEIGHT - 0.15, 0).toArray())

  const row = (count) => Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * SEAT_WIDTH)
  const places = [
    ...row(back).map((x) => c.frame(x, 0, -D / 2 - 0.42)),
    ...row(front).map((x) => c.frame(x, 0, D / 2 + 0.42, Math.PI)),
    ...(ends > 0 ? [c.frame(L / 2 + 0.42, 0, 0, -Math.PI / 2)] : []),
    ...(ends > 1 ? [c.frame(-L / 2 - 0.42, 0, 0, Math.PI / 2)] : []),
  ]
  places.forEach((seat, i) => {
    labChair(seat)
    room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing() })
    tablet(seat.frame(0, H, 0.42), i)
  })
}

// Masa akvaryumu; orijin tabanın ortası (masa yüzeyi), dünya eksenine hizalı. Arka iki cam su
// rengi (kameranın karşısında), ön camlar açık; kumda mercan, içinde dönen iki palyaço balığı ve
// yükselen kabarcıklar.
function deskAquarium(f, fx) {
  const A = 0.24
  const T = 0.32
  const B = 0.04
  f.box(-A - 0.02, 0, -A - 0.02, 2 * A + 0.04, B, 2 * A + 0.04, C.trim)
  f.box(-A + 0.003, B, -A + 0.003, 2 * A - 0.006, 0.04, 2 * A - 0.006, C.sand[0])
  f.box(-A, B, -A, 2 * A - 0.024, T, 0.006, C.tank[1], BULB)
  f.box(-A, B, -A + 0.006, 0.006, T, 2 * A - 0.03, C.tank[1], BULB)
  for (const x of [-A, A - 0.024]) {
    for (const z of [-A, A - 0.024]) f.box(x, B, z, 0.024, T + 0.01, 0.024, C.trim)
  }
  f.box(-A, B + T, -A, 2 * A, 0.02, 0.024, C.trim)
  f.box(-A, B + T, A - 0.024, 2 * A, 0.02, 0.024, C.trim)
  f.box(-A, B + T, -A + 0.024, 0.024, 0.02, 2 * A - 0.048, C.trim)
  f.box(A - 0.024, B + T, -A + 0.024, 0.024, 0.02, 2 * A - 0.048, C.trim)
  f.box(-0.17, B + 0.04, -0.16, 0.035, 0.12, 0.035, C.coral[0])
  f.box(-0.12, B + 0.04, -0.18, 0.05, 0.07, 0.05, C.coral[2])
  f.box(0.08, B + 0.04, -0.17, 0.09, 0.05, 0.07, C.rock[0])

  const fishAt = (x, y, dir) => [
    fxBox(f, x - 0.006, y - 0.018, -0.035, 0.012, 0.036, 0.07, C.fish.orange),
    fxBox(f, x - 0.0065, y - 0.018, -0.006, 0.013, 0.036, 0.012, C.fish.white),
    fxBox(f, x - 0.005, y - 0.014, dir * 0.047 - 0.014, 0.01, 0.028, 0.028, C.fish.orange, { rot: [Math.PI / 4, 0, 0] }),
  ]
  fx.room.spinners.push({
    items: [...fishAt(0.13, 0.2, 1), ...fishAt(-0.13, 0.16, -1)],
    pivot: f.point(0, 0, 0),
    axis: axisOf(f, 0, 1, 0),
    period: 10,
    phase: 0,
  })
  for (let k = 0; k < 3; k++) {
    fx.room.movers.push({
      items: [fxBox(f, 0.14, B + 0.08, -0.15, 0.016, 0.016, 0.016, C.bubble)],
      axis: [0, 1, 0],
      travel: T - 0.08,
      period: 1.6,
      phase: k / 3,
      fade: 0.08,
    })
  }
}

// Masa üstü; orijin oturanın önündeki masa kenarı, +z masanın içine.
function tablet(t, i) {
  t.box(-0.17, 0, 0.08, 0.34, 0.012, 0.24, C.screenBody)
  t.box(-0.155, 0.012, 0.095, 0.31, 0.003, 0.21, C.screen, BULB)
  t.box(-0.13, 0.016, 0.24, 0.16, 0.002, 0.025, C.ui[i % 4], BULB)
  t.box(-0.13, 0.016, 0.19, 0.24, 0.002, 0.02, C.ui[(i + 1) % 4], BULB)
  t.box(-0.13, 0.016, 0.14, 0.12, 0.002, 0.02, C.ui[(i + 2) % 4], BULB)
  if (i % 2 === 0) mug(t, 0.26, 0.14, C.mug[(i / 2) % C.mug.length])
}

// Döner koltuk; oturan +z yönüne bakar, sırtlık -z tarafında.
export function labChair(f) {
  f.box(-0.28, 0.04, -0.03, 0.56, 0.04, 0.06, C.trim)
  f.box(-0.03, 0.04, -0.28, 0.06, 0.04, 0.56, C.trim)
  for (const [x, z] of [[-0.27, 0], [0.27, 0], [0, -0.27], [0, 0.27]]) f.box(x - 0.03, 0, z - 0.03, 0.06, 0.04, 0.06, C.dark)
  f.box(-0.035, 0.08, -0.035, 0.07, 0.3, 0.07, C.steel)
  f.box(-0.25, 0.38, -0.24, 0.5, 0.08, 0.48, C.white)
  f.box(-0.22, 0.46, -0.2, 0.44, 0.04, 0.42, C.teal)
  f.box(-0.24, 0.5, -0.31, 0.48, 0.62, 0.07, C.white)
  f.box(-0.2, 0.56, -0.24, 0.4, 0.48, 0.025, C.teal)
  f.box(-0.13, 1.12, -0.3, 0.26, 0.14, 0.06, C.white)
  for (const x of [-0.27, 0.23]) {
    f.box(x, 0.46, -0.16, 0.04, 0.16, 0.04, C.steelDark)
    f.box(x - 0.005, 0.62, -0.2, 0.05, 0.035, 0.3, C.white)
  }
}

// Sarkıt LED armatür; orijin masanın ortası (zemin seviyesi), tavana kablolarla asılı.
function pendant(f, length) {
  const y = PENDANT_HEIGHT
  f.box(-length / 2, y, -0.16, length, 0.05, 0.32, C.steel)
  f.box(-length / 2 + 0.04, y - 0.008, -0.12, length - 0.08, 0.01, 0.24, '#ffffff', BULB)
  f.box(-length / 2 + 0.04, y + 0.05, -0.08, length - 0.08, 0.008, 0.16, '#ffffff', BULB)
  for (const x of [-length / 2 + 0.15, length / 2 - 0.16]) {
    f.box(x, y + 0.05, -0.004, 0.008, WALL_HEIGHT - y - 0.05, 0.008, C.dark)
  }
}

// ---------------------------------------------------------------- zemin eşyaları

// Denizanası tankı; orijin ortası, dünya eksenine hizalı çizilir (içten aydınlık arka camlar hep
// kameranın karşısında kalsın, ön camlar açık). Işıklı kaide ve kapak, kumda taş; içinde süzülen
// üç denizanası ve yükselen kabarcıklar (fx.room).
export function jellyTank(f, fx) {
  const S = 0.38
  const B = 0.32
  const T = 1.95
  f.box(-S - 0.06, 0, -S - 0.06, 2 * S + 0.12, B, 2 * S + 0.12, C.trim)
  f.box(-S - 0.06, 0.2, S + 0.06, 2 * S + 0.12, 0.03, 0.004, C.tealLight, BULB)
  f.box(S + 0.06, 0.2, -S - 0.06, 0.004, 0.03, 2 * S + 0.12, C.tealLight, BULB)
  f.box(-S + 0.003, B, -S + 0.003, 2 * S - 0.006, 0.06, 2 * S - 0.006, C.sand[0])
  f.box(-S + 0.06, B + 0.06, -S + 0.06, 0.18, 0.09, 0.14, C.rock[0])
  f.box(S - 0.2, B + 0.06, -S + 0.04, 0.1, 0.06, 0.08, C.rock[2])
  const bh = (T - B) / C.tank.length
  C.tank.forEach((color, i) => {
    const y = T - (i + 1) * bh
    f.box(-S, y, -S, 2 * S - 0.03, bh, 0.01, color, BULB)
    f.box(-S, y, -S + 0.01, 0.01, bh, 2 * S - 0.04, color, BULB)
  })
  for (const x of [-S, S - 0.03]) {
    for (const z of [-S, S - 0.03]) f.box(x, B, z, 0.03, T - B + 0.05, 0.03, C.trim)
  }
  f.box(-S - 0.06, T, -S - 0.06, 2 * S + 0.12, 0.16, 2 * S + 0.12, C.trim)
  f.box(-S + 0.03, T - 0.012, -S + 0.03, 2 * S - 0.06, 0.012, 2 * S - 0.06, C.led, BULB)
  for (const [x, h] of [[0.12, 0.5], [0.2, 0.28]]) {
    f.box(x, B + 0.55, S - 0.012, 0.015, h, 0.002, C.glare, GLASS)
    f.box(S - 0.012, B + 0.7, -x - 0.015, 0.002, h, 0.015, C.glare, GLASS)
  }
  f.glow(-0.85, 0.004, -0.85, 1.7, 1.7)

  const jellies = [
    [-0.14, 0.95, -0.12, 0],
    [0.13, 1.32, 0.06, 1],
    [-0.06, 1.55, 0.16, 2],
  ]
  for (const [x, y, z, i] of jellies) {
    const color = C.jelly[i]
    const items = [
      fxBox(f, x - 0.075, y, z - 0.075, 0.15, 0.06, 0.15, color),
      fxBox(f, x - 0.045, y + 0.06, z - 0.045, 0.09, 0.035, 0.09, color),
      fxBox(f, x - 0.015, y - 0.15, z - 0.015, 0.03, 0.15, 0.03, color),
    ]
    for (const [dx, dz, h] of [[-0.05, -0.05, 0.22], [0.05, -0.05, 0.17], [-0.05, 0.05, 0.19], [0.05, 0.05, 0.24]]) {
      items.push(fxBox(f, x + dx - 0.006, y - h, z + dz - 0.006, 0.012, h, 0.012, color))
    }
    fx.room.movers.push({
      items,
      axis: [0, 1, 0],
      travel: 0.18,
      period: 7 + i * 1.5,
      phase: i * 0.31,
      wave: true,
      bob: { axis: axisOf(f, 1, 0, 0), amp: 0.04, period: 13 + i * 2 },
    })
  }
  for (let k = 0; k < 5; k++) {
    fx.room.movers.push({
      items: [fxBox(f, 0.22, B + 0.08, -0.22, 0.025, 0.025, 0.025, C.bubble)],
      axis: [0, 1, 0],
      travel: T - B - 0.2,
      period: 5,
      phase: k / 5,
      fade: 0.08,
      bob: { axis: axisOf(f, 0, 0, 1), amp: 0.012, period: 1.5 },
    })
  }
}

// Pencere önü minderli bank; orijin ortası, oturan +z'ye bakar. Sırt minderi pencere pervazının
// önünde kalır, manzarayı kapatmaz. Cam kasasının altında bank boyunca LED okuma şeridi (tek ışık).
export function windowBench(f, length, room) {
  const L = length
  f.box(-L / 2, 0, -0.3, L, 0.08, 0.56, C.trim)
  f.box(-L / 2, 0.08, -0.3, L, 0.3, 0.6, C.white)
  const n = Math.max(2, Math.round(L / 0.8))
  const w = L / n
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + i * w
    f.box(x + 0.02, 0.38, -0.14, w - 0.04, 0.08, 0.42, C.teal)
    f.box(x + 0.04, 0.4, -0.29, w - 0.08, 0.16, 0.12, C.tealLight, { rot: [-0.2, 0, 0] })
    if (i % 2 === 0) f.box(x + 0.12, 0.46, -0.17, 0.22, 0.18, 0.08, C.yellow, { rot: [-0.2, 0.2, 0] })
  }
  f.box(-L / 2, 2.484, -0.43, L, 0.012, 0.03, '#ffffff', BULB)
  f.glow(-L / 2, 0.465, -0.3, L, 0.6)
  room.lights.push(f.point(0, 1.7, 0.35).toArray())
}

// Gözlem kamerası; sualtı muhafazalı kamera üç ayak üstünde, objektif yerel +z'ye (cama) bakar.
export function surveyCamera(f) {
  for (const a of [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]) {
    const leg = f.frame(Math.sin(a) * 0.28, 0, Math.cos(a) * 0.28, a, -0.27)
    leg.box(-0.015, 0, -0.015, 0.03, 1.02, 0.03, C.steelDark)
  }
  f.box(-0.05, 0.96, -0.05, 0.1, 0.1, 0.1, C.trim)
  const cam = f.frame(0, 1.16, 0, 0, -0.12)
  cam.box(-0.13, -0.1, -0.17, 0.26, 0.2, 0.3, C.yellow)
  cam.box(-0.135, -0.03, -0.12, 0.27, 0.04, 0.2, C.yellowDark)
  cam.box(-0.08, -0.08, 0.13, 0.16, 0.16, 0.08, C.dark)
  cam.box(-0.06, -0.06, 0.21, 0.12, 0.12, 0.004, C.lens, GLASS)
  cam.box(-0.11, 0.1, -0.06, 0.22, 0.03, 0.05, C.dark)
  for (const x of [-0.11, 0.07]) {
    cam.box(x, 0.13, -0.05, 0.04, 0.06, 0.1, C.steel)
    cam.box(x + 0.005, 0.135, 0.05, 0.03, 0.05, 0.004, '#ffffff', BULB)
  }
}

// Dalış tüpü; orijin dibinin ortası. Yuvarlak kesit için iki kesişen kutu, etiket bandı, vana.
function scubaTank(t, color) {
  t.box(-0.085, 0, -0.06, 0.17, 1.0, 0.12, color)
  t.box(-0.06, 0, -0.085, 0.12, 1.0, 0.17, color)
  t.box(-0.089, 0.68, -0.064, 0.178, 0.07, 0.128, C.white)
  t.box(-0.064, 0.68, -0.089, 0.128, 0.07, 0.178, C.white)
  t.box(-0.055, 1.0, -0.055, 0.11, 0.06, 0.11, color)
  t.box(-0.022, 1.06, -0.022, 0.044, 0.07, 0.044, C.steel)
  t.box(-0.05, 1.11, -0.012, 0.1, 0.022, 0.024, C.dark)
}

// Tüp kafesi; orijin ortası, dünya eksenine hizalı. Kaidede iki sıra dalış tüpü, dikmeler, üst
// çerçeve ve önde zincir.
export function tankCage(f) {
  const W = 0.86
  const D = 0.56
  f.box(-W / 2, 0, -D / 2, W, 0.06, D, C.trim)
  for (const x of [-W / 2, W / 2 - 0.04]) {
    for (const z of [-D / 2, D / 2 - 0.04]) f.box(x, 0.06, z, 0.04, 1.22, 0.04, C.steelDark)
  }
  for (const z of [-D / 2, D / 2 - 0.04]) f.box(-W / 2, 1.28, z, W, 0.04, 0.04, C.steelDark)
  for (const x of [-W / 2, W / 2 - 0.04]) f.box(x, 1.28, -D / 2 + 0.04, 0.04, 0.04, D - 0.08, C.steelDark)
  ;[-0.13, 0.13].forEach((z, r) => {
    ;[-0.27, 0, 0.27].forEach((x, i) => scubaTank(f.frame(x, 0.06, z), (r + i) % 3 === 2 ? C.teal : C.yellow))
  })
  f.box(-W / 2 + 0.04, 0.78, D / 2 - 0.03, W - 0.08, 0.03, 0.02, C.dark)
}

// Dalış havuzu (moon pool); orijin merkezi, dünya eksenine hizalı. Sekizgen yüksek kenar, içinde
// su yüzeyi (deniz manzarasıyla aynı rengi alır) ve parıldayan dalgacıklar; arkada ve sağda
// korkuluk ve can simidi, sağ-arkada iniş merdiveni, sağ-önde yüzen sarı ROV.
export function moonPool(f, fx, rnd) {
  const R = 0.72
  const H = 0.3
  const WATER = 0.2
  const seg = 2 * (R + 0.1) * Math.tan(Math.PI / 8)
  const edge = (i) => {
    const a = (i * Math.PI) / 4
    return f.frame(Math.cos(a) * (R + 0.05), 0, Math.sin(a) * (R + 0.05), Math.PI / 2 - a)
  }
  for (let i = 0; i < 8; i++) {
    const e = edge(i)
    e.box(-seg / 2, 0, -0.05, seg, H, 0.1, C.steel)
    e.box(-seg / 2, H, -0.06, seg, 0.03, 0.12, C.yellow)
  }
  // Su: kenarın iç ve dış yüzü arasındaki orta sekizgene göre yatay şeritler. Şerit köşeleri
  // dışarı taşmaz, kenarlarında zemin görünmez (şerit 7 cm'den inceyken).
  const M = R + 0.05
  for (let z = -M; z < M - 1e-3; z += 0.07) {
    const d = Math.min(0.07, M - z)
    const far = Math.max(Math.abs(z), Math.abs(z + d))
    const half = Math.min(M, M * Math.SQRT2 - far)
    f.box(-half, WATER - 0.04, z, 2 * half, 0.04, d, C.water[1], GLASS)
  }
  for (let i = 0; i < 8; i++) {
    const r = rnd() * (R - 0.15)
    const t = rnd() * TAU
    fx.view.blinkers.push(fxBox(f, Math.cos(t) * r - 0.03, WATER, Math.sin(t) * r - 0.01, 0.06, 0.004, 0.02, C.glare, { rate: 0.3 + rnd() * 0.3, duty: 0.45, phase: rnd() }))
  }

  // korkuluk: arka (-z), sağ (+x) ve aradaki çapraz kenar
  const vertex = (k) => {
    const a = ((k + 0.5) * Math.PI) / 4
    const r = (R + 0.05) / Math.cos(Math.PI / 8)
    return [Math.cos(a) * r, Math.sin(a) * r]
  }
  for (const k of [5, 6, 7, 0]) {
    const [x, z] = vertex(k)
    f.box(x - 0.02, H + 0.03, z - 0.02, 0.04, 0.92, 0.04, C.yellow)
  }
  for (const i of [6, 7, 0]) {
    const e = edge(i)
    e.box(-seg / 2, H + 0.9, -0.02, seg, 0.04, 0.04, C.yellow)
    e.box(-seg / 2, H + 0.45, -0.015, seg, 0.03, 0.03, C.yellowDark)
  }
  const ladder = edge(7)
  for (const x of [-0.17, 0.13]) {
    ladder.box(x, WATER - 0.05, -0.12, 0.04, H + 0.4 - WATER, 0.03, C.steel)
    ladder.box(x, H + 0.32, -0.12, 0.04, 0.03, 0.14, C.steel)
  }
  for (const y of [WATER + 0.02, H + 0.14]) ladder.box(-0.17, y, -0.115, 0.34, 0.025, 0.02, C.steel)
  // can simidi: arka korkuluğun iç tarafında, havuza (kameraya) bakar
  const ring = edge(6).frame(0, H + 0.42, -0.08, Math.PI)
  ring.box(-0.2, 0.32, 0, 0.4, 0.08, 0.06, C.buoy)
  ring.box(-0.2, 0, 0, 0.4, 0.08, 0.06, C.buoy)
  ring.box(-0.2, 0.08, 0, 0.08, 0.24, 0.06, C.buoy)
  ring.box(0.12, 0.08, 0, 0.08, 0.24, 0.06, C.buoy)
  for (const [x, y, w, h] of [[-0.03, 0.315, 0.06, 0.09], [-0.03, -0.005, 0.06, 0.09], [-0.205, 0.17, 0.09, 0.06], [0.115, 0.17, 0.09, 0.06]]) {
    ring.box(x, y, -0.003, w, h, 0.066, C.white)
  }

  // ROV: koyu çerçevesi suyun içinde, üstte sarı yüzdürme bloğu; objektifi ve farları öne bakar
  const rov = f.frame(0.2, WATER, 0.2, -0.5)
  rov.box(-0.21, -0.08, -0.15, 0.42, 0.12, 0.3, C.dark)
  rov.box(-0.2, 0.04, -0.14, 0.4, 0.13, 0.28, C.yellow)
  rov.box(-0.205, 0.1, -0.145, 0.41, 0.025, 0.29, C.yellowDark)
  rov.box(-0.06, 0.17, -0.02, 0.12, 0.03, 0.04, C.dark)
  for (const x of [-0.26, 0.21]) rov.box(x, -0.02, -0.08, 0.05, 0.08, 0.16, C.dark)
  rov.box(-0.07, -0.04, 0.15, 0.14, 0.1, 0.03, C.dark)
  rov.box(-0.05, -0.02, 0.18, 0.1, 0.07, 0.004, C.lens, GLASS)
  for (const x of [-0.17, 0.11]) rov.box(x, 0.0, 0.15, 0.06, 0.035, 0.004, '#ffffff', BULB)
}
