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
const TABLE_HEIGHT = 0.76
const PENDANT_HEIGHT = 2.4
const PANEL_TOP = 2.6
// Lomboz: sekizgen açıklık, PORT_R iç yarıçap (kenar ortasına), merkezi PORT_Y yüksekliğinde.
// Açıklık ilk panel sırasının üstünde başlar.
export const PORT_R = 0.6
const PORT_Y = 1.7
const PORT_RING = 0.14
// Lombozun arkasındaki deniz duvar kalınlığının içinde sığ bir dioramadır: su fonu BACK'te, kum,
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

// Gövde duvarı: [from, length] boyunca, ports: lomboz merkezleri (u). Lomboz açıklıklarında duvar
// gövdesi ve panel yoktur; köşeler sekizgene pahlanır, arkada deniz dioraması görünür. pipes: tepe
// bandının önünde bakır ve çelik boru hattı, aralıklı kelepçelerle.
function hullWall(f, from, length, ports, rnd, fx, pipes) {
  wallShell(f, from, length)
  const t = WALL - 0.02
  const y0 = PORT_Y - PORT_R
  const y1 = PORT_Y + PORT_R
  const holes = [...ports].sort((a, b) => a - b).map((u) => [u - PORT_R, u + PORT_R])
  f.box(from, 0, -WALL, length - from, y0, t, C.seam)
  f.box(from, y1, -WALL, length - from, WALL_HEIGHT - y1, t, C.seam)
  let u = from
  for (const [a, b] of [...holes, [length, length]]) {
    if (a > u) f.box(u, y0, -WALL, a - u, y1 - y0, t, C.seam)
    u = b
  }
  // paneller: alt sıra boydan boya, üst sıra lombozların arasında ve üstünde
  panels(f, 0, length, [FULL_PANELS[0]])
  u = 0
  for (const [a, b] of [...holes, [length, length]]) {
    if (a > u + 0.05) panels(f, u, a, [FULL_PANELS[1]])
    if (b < length) panels(f, a, b, [[y1, PANEL_TOP]])
    u = b
  }
  ports.forEach((u, i) => porthole(f, u, rnd, fx, i))

  if (!pipes) return
  f.box(0, 2.76, 0.02, length, 0.08, 0.08, C.copper)
  f.box(0, 2.68, 0.03, length, 0.05, 0.05, C.pipe)
  const clamps = Math.max(2, Math.round(length / 1.4))
  for (let i = 0; i < clamps; i++) {
    const x = ((i + 0.5) * length) / clamps
    if (holes.some(([a, b]) => x > a - 0.1 && x < b + 0.1)) continue
    f.box(x - 0.025, 2.66, 0, 0.05, 0.2, 0.12, C.steelDark)
  }
}

// Arka duvar: z = 0 boyunca, x = -WALL'dan width'e; ports: lomboz merkezleri (x).
export function backWall(f, width, ports, rnd, fx) {
  hullWall(f, -WALL, width, ports, rnd, fx, true)
}

// Sol duvar: yerel u duvar boyunca (0 = ön kenar), iç yüzey v = 0; ports: lomboz merkezleri (u).
export function leftWall(f, length, ports, rnd, fx) {
  hullWall(f, 0, length, ports, rnd, fx, false)
}

// Lomboz; u merkezde. Açıklığın köşelerinde sekizgen pahlar (panel renginde), önde cıvatalı pirinç
// çerçeve, camda parıltı; arkasında deniz (seaView). i: lombozun sırası, balık sürüsünü seçer.
function porthole(f, u, rnd, fx, i) {
  const R = PORT_R
  const cut = (2 * R) / (2 + Math.SQRT2)
  const k = cut * Math.SQRT2
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      f.box(u + sx * R - k / 2, PORT_Y + sy * R - k / 2, -0.06, k, k, 0.056, C.panel[0], { rot: [0, 0, Math.PI / 4] })
    }
  }
  const mid = R + 0.02
  const seg = 2 * (mid + PORT_RING / 2) * Math.tan(Math.PI / 8)
  for (let e = 0; e < 8; e++) {
    const a = (e * Math.PI) / 4
    f.frame(u + Math.cos(a) * mid, PORT_Y + Math.sin(a) * mid, 0, 0, 0, a + Math.PI / 2).box(-seg / 2, -PORT_RING / 2, -0.03, seg, PORT_RING, 0.09, C.brass)
    const b = a + Math.PI / 8
    const r = (mid + 0.01) / Math.cos(Math.PI / 8)
    f.box(u + Math.cos(b) * r - 0.02, PORT_Y + Math.sin(b) * r - 0.02, 0.06, 0.04, 0.04, 0.012, C.copperDark)
  }
  f.box(u - 0.3, PORT_Y - 0.05, GLASS_PLANE, 0.03, 0.5, 0.002, C.glare, { ...GLASS, rot: [0, 0, -0.6] })
  f.box(u - 0.18, PORT_Y + 0.02, GLASS_PLANE, 0.016, 0.28, 0.002, C.glare, { ...GLASS, rot: [0, 0, -0.6] })
  seaView(f, u - R, u + R, rnd, fx, PORT_Y - R, PORT_Y + R, i)
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

// Lombozun arkasındaki deniz ([a, b] x [y0, y1]): arkada yukarıdan aşağı koyulaşan su bantları ve
// eğik ışık huzmeleri, dipte iki sıra kum tepeciği, kaya ve mercanlar; aralarında salınan
// yosunlar, geçen balık sürüsü (school: SCHOOLS sırası), yükselen kabarcıklar, süzülen denizanası.
// Açıklığın dışına taşanlar duvar gövdesinin içinde kalır. Gece suyun rengi koyulaşır; plankton
// (night) ve denizanaları ışır.
function seaView(f, a, b, rnd, fx, y0, y1, school) {
  const length = b - a
  const height = y1 - y0
  const bh = height / C.water.length
  C.water.forEach((color, i) => f.box(a - 0.01, y1 - (i + 1) * bh, BACK, length + 0.02, bh, 0.004, color, GLASS))

  const rays = 2
  for (let i = 0; i < rays; i++) {
    const u = a + ((i + 0.3 + rnd() * 0.4) * length) / rays
    const w = 0.06 + rnd() * 0.05
    const ray = f.frame(u, y1, BACK + 0.006, 0, 0, 0.3)
    ray.box(-w / 2, -0.45, 0, w, 0.55, 0.002, C.ray[0], GLASS)
    ray.box(-w / 2, -0.85, 0, w, 0.4, 0.002, C.ray[1], GLASS)
  }

  // kum: arka sıra yüksek, ön sıra alçak tepecikler
  const dune = (u, k) => 0.5 + 0.3 * Math.sin(u * 1.9 + k) + 0.2 * Math.sin(u * 0.7 + 2.3 * k)
  const backH = (u) => 0.1 + 0.18 * dune(u, 0.4)
  const frontH = (u) => 0.04 + 0.1 * dune(u, 2.1)
  const step = 0.15
  for (let u = a; u < b - 1e-3; u += step) {
    const w = Math.min(step, b - u)
    f.box(u, y0, BACK, w, backH(u + w / 2), -0.155 - BACK, pick(rnd, C.sand), GLASS)
    f.box(u, y0, -0.155, w, frontH(u + w / 2), 0.085, pick(rnd, C.sand), GLASS)
  }

  const rocks = Math.max(2, Math.round(length / 1.5))
  for (let i = 0; i < rocks; i++) {
    const u = a + 0.15 + ((i + rnd() * 0.6) * (length - 0.45)) / rocks
    const w = 0.14 + rnd() * 0.14
    const h = 0.07 + rnd() * 0.08
    const y = y0 + frontH(u + w / 2) - 0.04
    f.box(u, y, -0.15, w, h, 0.06, pick(rnd, C.rock), GLASS)
    f.box(u + w * 0.3, y + h - 0.01, -0.145, w * 0.5, 0.05, 0.045, pick(rnd, C.rock), GLASS)
  }

  // mercanlar: ön sırada küçük, arka sırada büyük; dallı ya da yuvarlak
  const corals = Math.max(3, Math.round(length / 0.7))
  for (let i = 0; i < corals; i++) {
    const u = a + 0.12 + ((i + rnd()) * (length - 0.24)) / corals
    const color = pick(rnd, C.coral)
    const front = i % 2 === 0
    const y = y0 + (front ? frontH(u) : backH(u)) - 0.02
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
    strands.push({ u, v: -0.215, base: y0 + backH(u) - 0.03, height: (0.45 + rnd() * 0.45) * height, w: 0.035 })
  }
  const frontKelp = Math.max(1, Math.round(length / 1.8))
  for (let i = 0; i < frontKelp; i++) {
    const u = a + 0.2 + ((i + 0.3 + rnd() * 0.4) * (length - 0.4)) / frontKelp
    strands.push({ u, v: -0.088, base: y0 + frontH(u) - 0.02, height: (0.25 + rnd() * 0.2) * height, w: 0.045 })
  }
  for (const s of strands) kelpStrand(f, fx, s, rnd)

  // Balık sürüleri: her balık duvar payının içinden çıkar, camın önünden geçip öbür uçta duvara
  // girer ve baştan döner (duvarın dışına hiç taşmaz). Aynı hız ve kaydırılmış faz sürüyü bir arada
  // tutar; duvara yaklaşan balık küçülerek kaybolur.
  const axis = axisOf(f, 1, 0, 0)
  const s = SCHOOLS[school % SCHOOLS.length]
  const dir = school % 2 === 0 ? 1 : -1
  const pad = 0.2
  const travel = length + 2 * pad
  const y = y0 + 0.35 + rnd() * (height - 0.75)
  const start = dir > 0 ? a - pad : b + pad
  const phase = rnd()
  const bob = { axis: [0, 1, 0], amp: 0.03, period: 3.5 + rnd() }
  for (let k = 0; k < s.count; k++) {
    const du = k * 0.13 + rnd() * 0.05
    const dy = (rnd() - 0.5) * (s.count > 2 ? 0.2 : 0.08)
    fx.view.movers.push({
      items: fishBoxes(f, start, y + dy, -0.175 + (k % 2) * 0.014, dir, s.size, s.body, s.stripe),
      axis: axis.map((c) => c * dir),
      travel,
      period: travel / s.speed,
      phase: phase - du / travel,
      fade: 0.3 / travel,
      bob,
    })
  }
  if (school === 1) seaTurtle(f, fx, a, b, y1, axis, rnd)

  // kabarcıklar: kumdaki deliklerden yükselip camın üst kasasında kaybolur
  const vents = 1
  for (let i = 0; i < vents; i++) {
    const u = a + ((i + 0.3 + rnd() * 0.4) * length) / vents
    const yb = y0 + frontH(u) - 0.02
    const travel = y1 + 0.1 - yb
    for (let k = 0; k < 4; k++) {
      const s = 0.018 + rnd() * 0.014
      fx.view.movers.push({
        items: [fxBox(f, u - s / 2, yb, -0.112, s, s, 0.004, C.bubble)],
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
    const y = y0 + 0.55 + rnd() * (height - 0.85)
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
    const y = y0 + 0.4 + rnd() * (height - 0.45)
    const s = 0.012 + rnd() * 0.012
    f.box(u, y, -0.23 + rnd() * 0.12, s, s, 0.004, pick(rnd, C.plankton), NIGHT)
  }
}

// Deniz kaplumbağası: kabuk, karın, baş ve yüzgeçler; uzun camlarda tek başına, çok yavaş geçer.
function seaTurtle(f, fx, a, b, y1, axis, rnd) {
  const dir = rnd() < 0.5 ? 1 : -1
  const pad = 0.24
  const u = dir > 0 ? a - pad : b + pad
  const y = y1 - 0.4
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

// ---------------------------------------------------------------- duvar donanımı

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
  const k = W / 2 + J + 0.075
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

  const m = f.interactive('machine', -0.2, 0.93, 0.1, 0, { puff: { at: [0, 0.17, 0.25], kind: 'steam' } })
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
    // her kattaki yosunlar ayrı eşya: tıklanınca yerlerinde salınır
    const g = f.interactive('plant', 0, y + 0.2, 0, 0, { each: true })
    const n = Math.floor((L - 0.14) / 0.16)
    const pitch = (L - 0.14) / n
    for (let k = 0; k < n; k++) {
      const x = -L / 2 + 0.07 + (k + 0.5) * pitch
      const h = 0.18 + rnd() * 0.17
      const color = pick(rnd, C.frond)
      g.box(x - 0.02, 0, 0.18 + (k % 2) * 0.08, 0.04, h, 0.03, color)
      g.box(x + (k % 2 ? -0.07 : 0.015), h * 0.5, 0.185 + (k % 2) * 0.08, 0.055, 0.05, 0.02, color)
    }
  })
}

// ---------------------------------------------------------------- çalışma alanı

// Lomboz masası; orijin duvar dibinde lombozun ortası, yerel +z odanın içi. Duvara dayalı tabla,
// yanlarda dolap ayakları, lombozun altında LED şerit; önünde lomboza bakan döner koltuk.
// light: masanın üstüne nokta ışık ekle.
export function portDesk(f, room, light) {
  const W = 1.0
  const D = 0.56
  const H = TABLE_HEIGHT
  for (const x of [-W / 2, W / 2 - 0.08]) f.box(x, 0, 0.04, 0.08, H - 0.05, D - 0.06, C.steelDark)
  f.box(-W / 2 + 0.08, H - 0.2, 0.04, W - 0.16, 0.15, D - 0.1, C.steel)
  f.box(-W / 2 - 0.02, H - 0.05, 0.02, W + 0.04, 0.05, D, C.white)
  f.box(-W / 2, H - 0.035, D + 0.02, W, 0.02, 0.006, C.tealLight, BULB)
  f.box(-0.35, PORT_Y - PORT_R - 0.11, 0.035, 0.7, 0.025, 0.03, C.led, BULB)
  f.glow(-W / 2, H + 0.003, 0.02, W, D)
  if (light) room.lights.push(f.point(0, 1.55, 0.6).toArray())

  const seat = f.frame(0, 0, D + 0.4, Math.PI)
  labChair(seat)
  room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing(), desk: 'screen', kind: 'chair' })
  tablet(seat.frame(0, H, 0.4), room.seats.length - 1)
}

const TAN8 = Math.tan(Math.PI / 8)

// Yatay sekizgen; orijin merkezi, a kenar ortasına uzaklık. Düz kenarlar ±x, ±z ve köşegenlerde.
function octagon(f, y, a, h, color, opts = {}) {
  f.box(-a, y, -a * TAN8, 2 * a, h, 2 * a * TAN8, color, opts)
  f.box(-a * TAN8, y, -a, 2 * a * TAN8, h, 2 * a, color, opts)
  const b = 2 * a * TAN8
  f.box(-b / 2, y, -a, b, h, 2 * a, color, { ...opts, rot: [0, Math.PI / 4, 0] })
  f.box(-a, y, -b / 2, 2 * a, h, b, color, { ...opts, rot: [0, Math.PI / 4, 0] })
}

// Yuvarlak sonar masası; orijin ortası, n koltuk çevrede eşit aralıkla, hepsi masaya bakar (ilki
// sol-arkada, kameraya dönük). Sekizgen beyaz tabla ve altında camgöbeği LED, ortada sonar ekranı
// (tarama çizgisi döner, geçtiği hedefler yanar), üstünde masanın çevresinde yavaşça yüzen balina
// hologramı; zeminde sekizgen güverte levhası, tavanda kubbe lamba (nokta ışık).
export function sonarTable(f, n, room, fx) {
  const R = n <= 2 ? 0.5 : n <= 4 ? 0.62 : n === 5 ? 0.75 : 0.85
  const H = TABLE_HEIGHT
  const rs = R + 0.42
  octagon(f, 0, rs + 0.5, 0.008, C.counter)
  octagon(f, 0.008, 0.36, 0.04, C.trim)
  f.box(-0.12, 0.048, -0.12, 0.24, H - 0.14, 0.24, C.steelDark)
  octagon(f, H - 0.1, R * 0.55, 0.04, C.steel)
  octagon(f, H - 0.06, R + 0.03, 0.024, C.tealLight, BULB)
  octagon(f, H - 0.036, R, 0.036, C.white)

  // sonar ekranı
  const S = Math.max(0.15, R - 0.36)
  octagon(f, H, S + 0.04, 0.006, C.screenBody)
  octagon(f, H + 0.006, S, 0.003, C.sonar, BULB)
  const axis = axisOf(f, 0, 1, 0)
  const pivot = f.point(0, 0, 0)
  C.sonarLine.forEach((color, i) => {
    fx.room.spinners.push({ items: [fxBox(f, 0, H + 0.01 + i * 0.0006, -0.005, S * 0.95, 0.0015, 0.01, color)], pivot, axis, period: 4, phase: -i * 0.025 })
  })
  for (let i = 0; i < 3; i++) {
    const r = S * (0.35 + 0.18 * i)
    const t = 1.1 + i * 2.1
    fx.room.blinkers.push(fxBox(f, Math.cos(t) * r - 0.012, H + 0.01, -Math.sin(t) * r - 0.012, 0.024, 0.002, 0.024, C.ui[2], { rate: 0.25, duty: 0.35, phase: t / TAU }))
  }

  // balina hologramı: masanın üstünde yavaşça daire çizer (burnu +z, dönüş yönüne)
  const w = f.frame(Math.max(0.2, S), 1.22, 0)
  const whale = [
    fxBox(w, -0.06, -0.04, -0.12, 0.12, 0.08, 0.24, C.tealLight),
    fxBox(w, -0.045, -0.035, 0.12, 0.09, 0.06, 0.06, C.tealLight),
    fxBox(w, -0.03, -0.02, -0.2, 0.06, 0.04, 0.08, C.tealLight),
    fxBox(w, -0.07, -0.005, -0.27, 0.14, 0.012, 0.05, C.tealLight),
    fxBox(w, -0.13, -0.03, 0.02, 0.07, 0.008, 0.05, C.tealLight, { rot: [0, 0.4, -0.3] }),
    fxBox(w, 0.06, -0.03, 0.02, 0.07, 0.008, 0.05, C.tealLight, { rot: [0, -0.4, 0.3] }),
  ]
  fx.room.spinners.push({ items: whale, pivot, axis, period: 18, phase: 0 })

  domeLamp(f)
  f.glow(-R, H + 0.003, -R, 2 * R, 2 * R)
  room.lights.push(f.point(0, PENDANT_HEIGHT - 0.2, 0).toArray())

  for (let i = 0; i < n; i++) {
    const a = -0.75 * Math.PI + (i * TAU) / n
    const seat = f.frame(Math.sin(a) * rs, 0, Math.cos(a) * rs, a + Math.PI)
    labChair(seat)
    room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing(), desk: 'screen', kind: 'chair' })
    tablet(seat.frame(0, H, rs - R), room.seats.length - 1)
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

// Kubbe lamba; orijin altındaki zemin. Tavana kabloyla asılı çelik kubbe, altı parlar.
function domeLamp(f) {
  const y = PENDANT_HEIGHT
  octagon(f, y, 0.26, 0.06, C.steel)
  octagon(f, y + 0.06, 0.16, 0.08, C.steel)
  octagon(f, y - 0.008, 0.22, 0.008, '#ffffff', BULB)
  f.box(-0.006, y + 0.14, -0.006, 0.012, WALL_HEIGHT - y - 0.14, 0.012, C.dark)
}

// ---------------------------------------------------------------- zemin eşyaları

// Denizanası tankı; orijin ortası, dünya eksenine hizalı çizilir (içten aydınlık arka camlar hep
// kameranın karşısında kalsın, ön camlar açık). Işıklı kaide ve kapak, kumda taş; içinde süzülen
// üç denizanası ve yükselen kabarcıklar (fx.room).
export function jellyTank(root, fx) {
  // akvaryum ışığı tıklanınca kapanır / açılır (denizanaları yüzmeye devam eder)
  const f = root.interactive('lamp')
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

// Lomboz altı kanepe; orijin duvar dibinde ortası, oturan +z'ye bakar. Kaide, oturak ve sırt
// minderleri, iki yanda kolçak; sağ yanda üstünde kupa olan sehpa.
export function sofa(f, length) {
  const L = length
  f.box(-L / 2, 0, 0.04, L, 0.08, 0.66, C.trim)
  f.box(-L / 2, 0.08, 0.04, L, 0.3, 0.68, C.white)
  const n = Math.max(2, Math.round(L / 0.8))
  const w = (L - 0.2) / n
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + 0.1 + i * w
    f.box(x + 0.01, 0.38, 0.2, w - 0.02, 0.08, 0.5, C.teal)
    f.box(x + 0.02, 0.38, 0.04, w - 0.04, 0.42, 0.16, C.tealLight, { rot: [-0.12, 0, 0] })
  }
  for (const x of [-L / 2, L / 2 - 0.1]) f.box(x, 0.38, 0.04, 0.1, 0.22, 0.68, C.white)
  f.box(-0.12 - L / 4, 0.46, 0.08, 0.24, 0.2, 0.08, C.yellow, { rot: [-0.25, 0.25, 0] })

  const t = f.frame(L / 2 + 0.32, 0, 0.36)
  octagon(t, 0, 0.18, 0.03, C.trim)
  t.box(-0.03, 0.03, -0.03, 0.06, 0.42, 0.06, C.steelDark)
  octagon(t, 0.45, 0.22, 0.03, C.white)
  mug(t.frame(0, 0.48, 0), -0.04, 0, C.mug[1])
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
// su yüzeyi (deniz manzarasıyla aynı rengi alır) ve parıldayan dalgacıklar; sol ve arka kenarda
// (duvar tarafı) korkuluk ve can simidi, sağda iniş merdiveni. Suda yüzen sarı batiskaf: önde
// kubbe cam ve farlar, üstte kule, arkada dönen pervane.
export function moonPool(f, fx, rnd) {
  const R = 0.82
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
    const r = R * 0.55 + rnd() * (R * 0.35)
    const t = rnd() * TAU
    fx.view.blinkers.push(fxBox(f, Math.cos(t) * r - 0.03, WATER, Math.sin(t) * r - 0.01, 0.06, 0.004, 0.02, C.glare, { rate: 0.3 + rnd() * 0.3, duty: 0.45, phase: rnd() }))
  }

  // korkuluk: sol (-x), sol-arka ve arka (-z) kenar
  const vertex = (k) => {
    const a = ((k + 0.5) * Math.PI) / 4
    const r = (R + 0.05) / Math.cos(Math.PI / 8)
    return [Math.cos(a) * r, Math.sin(a) * r]
  }
  for (const k of [3, 4, 5, 6]) {
    const [x, z] = vertex(k)
    f.box(x - 0.02, H + 0.03, z - 0.02, 0.04, 0.92, 0.04, C.yellow)
  }
  for (const i of [4, 5, 6]) {
    const e = edge(i)
    e.box(-seg / 2, H + 0.9, -0.02, seg, 0.04, 0.04, C.yellow)
    e.box(-seg / 2, H + 0.45, -0.015, seg, 0.03, 0.03, C.yellowDark)
  }
  const ladder = edge(1)
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

  // batiskaf: burnu yerel +x'te, havuzun içinde hafif çapraz
  const sub = f.frame(0, WATER - 0.1, 0, -0.45)
  sub.box(-0.42, 0, -0.2, 0.84, 0.34, 0.4, C.yellow)
  sub.box(-0.36, -0.05, -0.14, 0.72, 0.44, 0.28, C.yellow)
  sub.box(-0.423, 0.24, -0.203, 0.846, 0.04, 0.406, C.yellowDark)
  sub.box(0.42, 0.04, -0.15, 0.08, 0.28, 0.3, C.dark)
  sub.box(0.5, 0.08, -0.11, 0.06, 0.2, 0.22, C.lens, GLASS)
  for (const z of [-0.17, 0.13]) sub.box(0.42, 0.3, z, 0.08, 0.05, 0.04, '#ffffff', BULB)
  sub.box(-0.12, 0.39, -0.1, 0.26, 0.14, 0.2, C.yellow)
  sub.box(-0.1, 0.53, -0.08, 0.22, 0.02, 0.16, C.steel)
  sub.box(-0.01, 0.55, -0.01, 0.02, 0.12, 0.02, C.dark)
  for (const z of [-0.205, 0.201]) sub.box(-0.12, 0.16, z, 0.12, 0.08, 0.004, C.porthole, GLASS)
  sub.box(-0.54, 0.08, -0.12, 0.12, 0.2, 0.24, C.dark)
  fx.room.spinners.push({
    items: [fxBox(sub, -0.575, 0.17, -0.11, 0.012, 0.03, 0.22, C.steelDark), fxBox(sub, -0.575, 0.07, -0.015, 0.012, 0.22, 0.03, C.steelDark)],
    pivot: sub.point(-0.57, 0.185, 0),
    axis: axisOf(sub, 1, 0, 0),
    period: 1.6,
    phase: 0,
  })
}
