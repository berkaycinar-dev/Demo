import { createVoxelBuilder, pick } from '../core/voxel'

// Deniz kenarı çay bahçesi temasının voxel parçaları. Birim ≈ 1 metre.
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür.

export const WALL = 0.2
export const FLOOR_BOTTOM = -0.32
export const WALL_HEIGHT = 3.0
export const SEAT_HEIGHT = 0.45
// Korkuluk dikmeleri, fener direkleri ve ampul zincirlerinin bağlandığı yükseklik.
export const POST_HEIGHT = 2.6
const TABLE_HEIGHT = 0.62
const TABLE_SIZE = 0.66
const CHAIR_DISTANCE = 0.58
const PARAPET = 0.5
const HORIZON = 1.45
// Manzara paneli uç dikmelerin arkasında başlar ve biter.
const VIEW_INSET = 0.06
const GLASS = { layer: 'glass' }
const BULB = { layer: 'bulb' }
const NIGHT = { layer: 'night' }

export const C = {
  plaster: '#f1e9dc',
  plasterShade: '#e4d8c5',
  stone: ['#a99b86', '#9b8d79', '#b5a791', '#a39177'],
  stoneLight: '#dacfbd',
  mortar: '#cfc3b0',
  grout: '#8d8170',
  paving: ['#cbb99e', '#c1af94', '#d4c4aa', '#baa88c', '#c8b293'],
  tile: '#b8573a',
  tileDark: '#9a4630',
  wood: '#8b5a3c',
  woodDark: '#6b4430',
  woodLight: '#b07a52',
  door: '#2f7f86',
  doorDark: '#256a70',
  shutter: '#3f7a5a',
  shutterDark: '#33664a',
  frame: '#f2ede4',
  iron: '#2e3133',
  wire: '#3a3a3a',
  awning: ['#c8453b', '#f3ece1'],
  brass: '#d0a54a',
  brassDark: '#a8812f',
  copper: '#b8693d',
  copperDark: '#8f4f2c',
  lokum: ['#f3c6d0', '#f6f1e6'],
  chalkboard: '#2b2f2e',
  chalk: '#ece9e1',
  chalkYellow: '#f2d478',
  cartRed: '#c8362c',
  cartRedDark: '#9c2a22',
  cartYellow: '#f2c14e',
  sesame: '#f1dfb2',
  lavender: '#9b7fc4',
  daisy: '#f4f1e8',
  poolDeep: '#2f6f86',
  water: '#6fb3c9',
  lilyPad: '#5f9a4a',
  lily: '#f3b6c8',
  goldfish: '#f07a2a',
  ebony: '#2a1d16',
  porcelain: '#f6f3ee',
  saucerRim: '#b8322a',
  tea: '#a8361a',
  teaLight: '#c4532a',
  glassRim: '#dfe8e6',
  steel: '#c5c9ce',
  marble: '#ece6db',
  marbleShade: '#d6cfc2',
  tileBlue: '#2f6aa3',
  tileWhite: '#eef1f4',
  cloth: '#f4efe6',
  cloths: { red: '#c0392b', blue: '#2e6fa7', green: '#4f8a5b' },
  chairs: ['#7a4b2f', '#5b7f5a', '#3f6f8f'],
  wicker: '#d9b779',
  wickerDark: '#b8955a',
  tavla: '#7a4a26',
  tavlaFelt: '#e8d9b8',
  points: ['#8b2e1e', '#2f2a26'],
  simit: '#c07a3c',
  jars: ['#e4c46a', '#8a5a3a', '#7aa05a'],
  pot: '#b5653d',
  potDark: '#9a5332',
  soil: '#4a3424',
  leaves: ['#4f7f3f', '#5e8f48', '#3f6d35', '#6a9a50'],
  leafLight: '#82b05e',
  olive: ['#8a9a6b', '#7d8f5e', '#97a777'],
  bark: ['#b8ad97', '#9c917b', '#d2c7b1', '#8a7f6a'],
  flowers: ['#d6334a', '#e8566b', '#c2357a'],
  bougainvillea: ['#c2357a', '#d94b92', '#b02a6a'],
  tins: ['#3d7ea6', '#c8553d', '#e9c46a', '#7a9e7e'],
  kilim: ['#b5392e', '#2f4f7a', '#d9a441', '#efe4cf', '#6b2a3a'],
  cat: '#e3964f',
  catStripe: '#c4753a',
  catNose: '#e8909a',
  catEye: '#9bc53d',
  catWhite: '#f6efe4',
  bulbs: ['#ffffff', '#fff1d6', '#ffe4c0'],
  // manzara
  sky: '#a9d4ef',
  skyLow: '#cfe7f4',
  cloud: '#ffffff',
  sea: '#3f86a8',
  seaLight: '#6fb2cc',
  seaFoam: '#d4ecf3',
  shore: ['#8fae95', '#7f9f86', '#9cb8a0'],
  houses: ['#f1e4d0', '#e8c9a8', '#d99b7a', '#f5efe6', '#e6d7bf'],
  mosque: '#ebe3d6',
  rock: '#6f6a62',
  hull: '#2b2b2b',
  lights: ['#ffd98a', '#ffe9b8', '#ffcf7a'],
  moon: '#f6f2d8',
  moonGlade: '#f3e7b0',
}

// Sekizgene yakın gövde: düz kutu + 45° dönük küçük kutu (semaver, kaplar).
function oct(f, y, size, h, color) {
  f.box(-size / 2, y, -size / 2, size, h, size, color)
  const s = size * 0.76
  f.box(-s / 2, y, -s / 2, s, h, s, color, { rot: [0, Math.PI / 4, 0] })
}

// ---------------------------------------------------------------- yapı

// Taş döşeme: şaşırtmalı sıralar, aralarında derz.
export function floor(f, width, depth, rnd) {
  f.box(0, FLOOR_BOTTOM, 0, width, -0.04 - FLOOR_BOTTOM, depth, C.grout)
  const L = 0.5
  const D = 0.4
  for (let row = 0, z = 0; z < depth - 1e-3; row++, z += D) {
    const d = Math.min(D, depth - z)
    for (let x = row % 2 ? -L / 2 : 0; x < width - 1e-3; x += L) {
      const x0 = Math.max(x, 0)
      const x1 = Math.min(x + L, width)
      f.box(x0 + 0.01, -0.04, z + 0.01, x1 - x0 - 0.02, 0.04, d - 0.02, pick(rnd, C.paving))
    }
  }
}

// Duvar dibinde iki sıra düzensiz taş; orijin taş sırasının sol-alt köşesi (duvar yüzeyi).
function stoneCourse(f, length, height, rnd) {
  f.box(0, 0, 0, length, height, 0.012, C.mortar)
  const rowH = height / 2
  for (let row = 0; row < 2; row++) {
    let u = row ? -0.12 : 0
    while (u < length - 0.02) {
      const w = 0.26 + rnd() * 0.3
      const u0 = Math.max(u, 0)
      const u1 = Math.min(u + w, length)
      if (u1 - u0 > 0.06) f.box(u0 + 0.01, row * rowH + 0.01, 0.012, u1 - u0 - 0.02, rowH - 0.02, 0.02, pick(rnd, C.stone))
      u += w
    }
  }
}

// Kahvehane cephesi: z = 0 boyunca, x = -WALL'dan width'e. Badanalı sıva, taş subasman,
// üstte kiremit saçak.
export function backWall(f, width, rnd) {
  f.box(-WALL, FLOOR_BOTTOM, -WALL, width + WALL, -FLOOR_BOTTOM, WALL, C.stone[1])
  f.box(-WALL, 0, -WALL, width + WALL, WALL_HEIGHT, WALL, C.plaster)
  stoneCourse(f, width, 0.46, rnd)
  // eskimiş badana lekeleri
  for (let i = 0; i < Math.round(width / 1.6); i++) {
    const w = 0.25 + rnd() * 0.45
    f.box(rnd() * (width - w), 0.7 + rnd() * 1.6, 0, w, 0.12 + rnd() * 0.3, 0.004, C.plasterShade)
  }
  f.box(-WALL, WALL_HEIGHT, -WALL, width + WALL, 0.05, WALL + 0.05, C.stoneLight)
  f.box(-WALL, WALL_HEIGHT + 0.05, -WALL, width + WALL, 0.06, WALL + 0.32, C.tile)
  for (let u = -WALL + 0.04; u < width - 0.06; u += 0.17) {
    f.box(u, WALL_HEIGHT + 0.11, -WALL, 0.09, 0.04, WALL + 0.32, C.tileDark)
  }
}

// Denize bakan kenar: alçak taş korkuluk, demir parmaklık, ahşap dikmeler, üst kiriş ve arkada
// deniz manzarası. Yerel u kenar boyunca, iç yüzey v = 0, dışarısı -v. posts: dikmelerin u konumları.
export function seaEdge(f, length, posts, rnd, room) {
  f.box(0, FLOOR_BOTTOM, -WALL, length, -FLOOR_BOTTOM, WALL, C.stone[1])
  f.box(0, 0, -WALL, length, PARAPET, WALL, C.plaster)
  stoneCourse(f, length, PARAPET - 0.04, rnd)
  f.box(0, PARAPET, -WALL - 0.03, length, 0.05, WALL + 0.06, C.stoneLight)
  // Manzara uç dikmelerin arkasından başlar; kenarı hiçbir kamera açısında dışarı taşmaz.
  seaView(f.frame(VIEW_INSET, 0, 0), length - 2 * VIEW_INSET, rnd, room)

  const top = PARAPET + 0.05
  f.box(0, top + 0.38, -0.125, length, 0.035, 0.05, C.iron)
  f.box(0, top + 0.05, -0.115, length, 0.02, 0.03, C.iron)
  for (let u = 0.08; u < length - 0.04; u += 0.16) f.box(u, top, -0.11, 0.018, 0.38, 0.018, C.iron)

  for (const u of posts) {
    const u0 = Math.min(Math.max(u - 0.06, 0), length - 0.12)
    // uç dikmeler manzara panelinin dış yüzünü de örter
    const end = u0 < 0.01 || u0 > length - 0.13
    f.box(u0, top, end ? -0.215 : -0.17, 0.12, POST_HEIGHT - top, end ? 0.165 : 0.12, C.wood)
  }
  f.box(0, POST_HEIGHT, -0.215, length, 0.1, 0.18, C.wood)
}

// Manzara: gökyüzü, deniz, karşı kıyıda tepeler ve evler; denizde fener, vapur, yelkenliler.
// Cam katmanında olduğu için rengi gün zamanıyla kararır; gece ışıkları night katmanında.
// Vapur, yelkenliler, martılar ve yanıp sönen ışıklar room.view'e eklenir (SeaViewEffect çizer).
// Derinlik sırası (v'den öne): gök/deniz, dalga, tepe/bulut, ev, ev ışığı, cami, ay, yelkenli,
// vapur, martı; aynı derinlikte üst üste binen parça yok.
function seaView(f, length, rnd, room) {
  const bottom = PARAPET
  const top = POST_HEIGHT + 0.05
  const v = -0.2
  f.box(0, bottom, v, length, HORIZON - bottom, 0.003, C.sea, GLASS)
  f.box(0, HORIZON, v, length, 0.55, 0.003, C.skyLow, GLASS)
  f.box(0, HORIZON + 0.55, v, length, top - HORIZON - 0.55, 0.003, C.sky, GLASS)

  // dalga çizgileri: aşağıdakiler (yakın) daha uzun
  for (let i = 0; i < length * 7; i++) {
    const y = bottom + 0.06 + rnd() * (HORIZON - bottom - 0.1)
    const near = 1 - (y - bottom) / (HORIZON - bottom)
    const w = 0.05 + rnd() * 0.12 + near * 0.2
    f.box(rnd() * (length - w), y, v + 0.003, w, 0.008, 0.002, pick(rnd, [C.seaLight, C.seaLight, C.seaFoam]), GLASS)
  }
  f.box(0, HORIZON - 0.012, v + 0.003, length, 0.012, 0.002, C.seaLight, GLASS)

  // karşı kıyı: tepeler, üzerlerinde evler; akşam/gece evlerin yarısı yanar, bir kısmı yanıp söner
  let u = -rnd() * 0.4
  while (u < length) {
    const w = 0.7 + rnd() * 1.1
    const h = 0.14 + rnd() * 0.26
    const color = pick(rnd, C.shore)
    const u0 = Math.max(u, 0)
    const u1 = Math.min(u + w, length)
    const t0 = Math.max(u + w * 0.2, 0)
    const t1 = Math.min(u + w * 0.8, length)
    if (u1 > u0) f.box(u0, HORIZON, v + 0.004, u1 - u0, h * 0.6, 0.002, color, GLASS)
    if (t1 > t0) f.box(t0, HORIZON, v + 0.004, t1 - t0, h, 0.002, color, GLASS)
    for (let k = 0; k < Math.round(w * 6); k++) {
      const x = u + 0.04 + rnd() * (w - 0.1)
      if (x < 0.02 || x > length - 0.08) continue
      const hx = x > t0 && x < t1 - 0.06 ? h : h * 0.6
      const y = HORIZON + 0.01 + rnd() * Math.max(hx - 0.07, 0.01)
      f.box(x, y, v + 0.006, 0.05, 0.035, 0.002, pick(rnd, C.houses), GLASS)
      if (rnd() < 0.5) {
        const light = [x + 0.008, y + 0.005, v + 0.008, 0.034, 0.026, 0.002, pick(rnd, C.lights)]
        if (rnd() < 0.3) twinkle(f, room, light, 0.04 + rnd() * 0.08, rnd() < 0.5 ? 0.85 : 0.4, rnd)
        else f.box(...light, NIGHT)
      }
    }
    u += w * (0.6 + rnd() * 0.3)
  }
  // sahil yolu lambaları
  for (let x = 0.05; x < length - 0.05; x += 0.1) {
    if (rnd() < 0.6) f.box(x, HORIZON + 0.004, v + 0.008, 0.03, 0.022, 0.002, pick(rnd, C.lights), NIGHT)
  }
  if (length > 4.5) mosque(f, 0.25 * length + rnd() * 0.4 * length, HORIZON + 0.06, v + 0.01)
  if (length > 3.5) lighthouse(f, 0.65 * length + rnd() * 0.25 * length, HORIZON - 0.32, v + 0.0065, rnd, room)

  // gökyüzü: bulutlar; gece ay ve denizdeki yakamozu (ay iki dikme arasına denk gelsin diye ortada)
  for (let i = 0; i < Math.max(2, Math.round(length / 2.5)); i++) {
    const x = rnd() * (length - 0.7)
    const y = HORIZON + 0.45 + rnd() * 0.55
    f.box(x, y, v + 0.004, 0.45 + rnd() * 0.2, 0.06, 0.002, C.cloud, GLASS)
    f.box(x + 0.1, y + 0.05, v + 0.004, 0.25, 0.06, 0.002, C.cloud, GLASS)
  }
  const mu = length * (0.4 + rnd() * 0.2)
  const my = top - 0.35
  f.box(mu - 0.09, my - 0.06, v + 0.012, 0.18, 0.12, 0.002, C.moon, NIGHT)
  f.box(mu - 0.06, my - 0.09, v + 0.012, 0.12, 0.18, 0.002, C.moon, NIGHT)
  for (let i = 0; i < 7; i++) {
    const w = 0.05 + i * 0.035
    f.box(mu - w / 2 + (rnd() - 0.5) * 0.06, HORIZON - 0.05 - i * 0.12, v + 0.005, w, 0.016, 0.001, C.moonGlade, NIGHT)
  }

  // Hareketliler panelin içinde kalır: vapur iki uç arasında gidip gelir, yelkenliler ve
  // martılar kendi yerlerinde salınır.
  const ferryTravel = Math.max(length - 0.7, 0.3)
  const ferryMotion = {
    travel: ferryTravel,
    period: Math.max(90, (2 * ferryTravel) / 0.07),
    phase: rnd() * Math.PI * 2,
    pingPong: true,
  }
  moving(f, room, ferryMotion, (g) => ferry(g, 0.1, HORIZON - 0.2, v + 0.016))
  for (let i = 0; i < Math.max(1, Math.round(length / 4)); i++) {
    const at = 0.32 + rnd() * Math.max(length - 0.8, 0)
    const y = HORIZON - 0.1 - rnd() * 0.12
    moving(f, room, { travel: 0.3, period: 40 + rnd() * 30, phase: rnd() * Math.PI * 2 }, (g) =>
      sailboat(g, at, y, v + 0.012),
    )
  }
  for (let i = 0; i < Math.max(2, Math.round(length / 3)); i++) {
    room.view.gulls.push({
      origin: f.point(0.35 + rnd() * Math.max(length - 0.7, 0), HORIZON + 0.3 + rnd() * 0.75, v + 0.02),
      quat: f.worldRotation(),
      axis: f.point(1, 0, 0).sub(f.point(0, 0, 0)),
      amplitude: 0.25,
      period: 16 + rnd() * 12,
      phase: rnd() * Math.PI * 2,
    })
  }
}

// Manzarada hareket eden parça: ayrı bir oluşturucuda f ile aynı dünya dönüşümünde çizilir;
// SeaViewEffect her karede yerel u ekseni boyunca kaydırır.
function moving(f, room, motion, draw) {
  const { root, layers } = createVoxelBuilder()
  const o = f.point(0, 0, 0)
  draw(root.frame(o.x, o.y, o.z, f.facing()))
  room.view.movers.push({ glass: layers.glass, night: layers.night, axis: f.point(1, 0, 0).sub(o), ...motion })
}

// Yanıp sönen gece ışığı; box: [x, y, z, w, h, d, renk]. rate: Hz, duty: yanık kalma oranı.
function twinkle(f, room, [x, y, z, w, h, d, color], rate, duty, rnd) {
  room.view.twinkles.push({
    center: f.point(x + w / 2, y + h / 2, z + d / 2),
    quat: f.worldRotation(),
    size: [w, h, d],
    color,
    rate,
    duty,
    phase: rnd(),
  })
}

function mosque(f, u, y, v) {
  f.box(u, y - 0.06, v, 0.34, 0.12, 0.002, C.mosque, GLASS)
  f.box(u + 0.08, y + 0.06, v, 0.18, 0.04, 0.002, C.mosque, GLASS)
  f.box(u + 0.11, y + 0.1, v, 0.12, 0.03, 0.002, C.mosque, GLASS)
  f.box(u + 0.14, y + 0.13, v, 0.06, 0.02, 0.002, C.mosque, GLASS)
  for (const x of [u - 0.03, u + 0.35]) {
    f.box(x, y - 0.06, v, 0.022, 0.34, 0.002, C.mosque, GLASS)
    f.box(x + 0.004, y + 0.28, v, 0.014, 0.04, 0.002, C.mosque, GLASS)
  }
}

// Kayalıkta deniz feneri; gece ışığı yavaşça yanıp söner.
function lighthouse(f, u, y, v, rnd, room) {
  f.box(u - 0.14, y, v, 0.28, 0.05, 0.002, C.rock, GLASS)
  f.box(u - 0.04, y + 0.05, v, 0.08, 0.2, 0.002, C.porcelain, GLASS)
  f.box(u - 0.04, y + 0.12, v + 0.001, 0.08, 0.03, 0.002, C.awning[0], GLASS)
  f.box(u - 0.03, y + 0.25, v, 0.06, 0.04, 0.002, C.porcelain, GLASS)
  f.box(u - 0.045, y + 0.29, v, 0.09, 0.02, 0.002, C.awning[0], GLASS)
  twinkle(f, room, [u - 0.025, y + 0.255, v + 0.002, 0.05, 0.03, 0.002, C.lights[0]], 0.25, 0.4, rnd)
}

// İstanbul vapuru: siyah karina, beyaz gövde, tek baca; gece pencereleri yanar.
function ferry(f, u, y, v) {
  f.box(u, y, v, 0.56, 0.03, 0.002, C.hull, GLASS)
  f.box(u + 0.02, y + 0.03, v, 0.52, 0.05, 0.002, C.porcelain, GLASS)
  f.box(u + 0.1, y + 0.08, v, 0.34, 0.045, 0.002, C.porcelain, GLASS)
  f.box(u + 0.25, y + 0.125, v, 0.05, 0.06, 0.002, C.porcelain, GLASS)
  f.box(u + 0.25, y + 0.165, v + 0.001, 0.05, 0.02, 0.002, C.hull, GLASS)
  for (let i = 0; i < 6; i++) f.box(u + 0.06 + i * 0.075, y + 0.045, v + 0.002, 0.03, 0.018, 0.002, C.lights[1], NIGHT)
}

function sailboat(f, u, y, v) {
  f.box(u, y, v, 0.16, 0.025, 0.002, C.porcelain, GLASS)
  f.box(u + 0.075, y + 0.025, v, 0.008, 0.16, 0.002, C.hull, GLASS)
  for (const [x, yy, w] of [[0.02, 0.03, 0.05], [0.03, 0.08, 0.04], [0.045, 0.13, 0.025]]) {
    f.box(u + x, y + yy, v + 0.001, w, 0.05, 0.002, C.porcelain, GLASS)
  }
}

// ---------------------------------------------------------------- ışık

// Ampul zinciri: x boyunca iki uç arasında sarkan tel ve ampuller; her ampulün tam altında
// zeminde bir ışık havuzu. from/to: [x, y, z] (aynı z). Ortasına bir nokta ışık eklenir.
export function stringLights(root, from, to, rnd, room) {
  const [x0, y0, z] = from
  const [x1, y1] = to
  const span = x1 - x0
  const sag = Math.min(0.45, 0.05 * span + 0.12)
  const at = (t) => [x0 + span * t, y0 + (y1 - y0) * t - sag * 4 * t * (1 - t)]

  const segments = Math.max(4, Math.round(span / 0.5))
  for (let i = 0; i < segments; i++) {
    const [ax, ay] = at(i / segments)
    const [bx, by] = at((i + 1) / segments)
    const length = Math.hypot(bx - ax, by - ay)
    root
      .frame((ax + bx) / 2, (ay + by) / 2, z, 0, 0, Math.atan2(by - ay, bx - ax))
      .box(-length / 2 - 0.005, -0.006, -0.006, length + 0.01, 0.012, 0.012, C.wire)
  }
  const bulbs = Math.max(3, Math.round(span / 0.95))
  for (let k = 0; k < bulbs; k++) {
    const [x, y] = at((k + 0.5) / bulbs)
    root.box(x - 0.016, y - 0.05, z - 0.016, 0.032, 0.05, 0.032, C.iron)
    root.box(x - 0.036, y - 0.13, z - 0.036, 0.072, 0.082, 0.072, pick(rnd, C.bulbs), BULB)
    root.glow(x - 0.5, 0.004, z - 0.5, 1.0, 1.0)
  }
  const [mx, my] = at(0.5)
  room.lights.push([mx, my - 0.3, z])
}

// Sokak feneri direği; ampul zincirinin sağ ucu bağlanır. Orijin direk tabanı.
export function lampPost(f) {
  f.box(-0.1, 0, -0.1, 0.2, 0.22, 0.2, C.iron)
  f.box(-0.04, 0.22, -0.04, 0.08, POST_HEIGHT - 0.22, 0.08, C.iron)
  f.box(-0.06, 1.1, -0.06, 0.12, 0.05, 0.12, C.iron)
  const y = POST_HEIGHT
  f.box(-0.09, y, -0.09, 0.18, 0.03, 0.18, C.iron)
  f.box(-0.065, y + 0.03, -0.065, 0.13, 0.18, 0.13, '#ffffff', BULB)
  for (const [x, z] of [[-0.08, -0.08], [0.06, -0.08], [-0.08, 0.06], [0.06, 0.06]]) {
    f.box(x, y + 0.03, z, 0.02, 0.18, 0.02, C.iron)
  }
  f.box(-0.1, y + 0.21, -0.1, 0.2, 0.03, 0.2, C.iron)
  f.box(-0.05, y + 0.24, -0.05, 0.1, 0.05, 0.1, C.iron)
  f.glow(-0.55, 0.004, -0.55, 1.1, 1.1)
}

// Duvar feneri; orijin duvarda kolun yüksekliği. Zemine ışık havuzu düşer.
export function lantern(f, height) {
  f.box(-0.02, 0.04, 0, 0.04, 0.03, 0.24, C.iron)
  f.box(-0.03, -0.12, 0, 0.06, 0.16, 0.03, C.iron)
  const l = f.frame(0, 0, 0.22)
  l.box(-0.08, -0.24, -0.08, 0.16, 0.02, 0.16, C.iron)
  l.box(-0.06, -0.22, -0.06, 0.12, 0.2, 0.12, '#ffffff', BULB)
  for (const [x, z] of [[-0.075, -0.075], [0.055, -0.075], [-0.075, 0.055], [0.055, 0.055]]) {
    l.box(x, -0.22, z, 0.02, 0.2, 0.02, C.iron)
  }
  l.box(-0.09, -0.02, -0.09, 0.18, 0.03, 0.18, C.iron)
  l.box(-0.04, 0.01, -0.04, 0.08, 0.03, 0.08, C.iron)
  f.glow(-0.6, -height + 0.004, 0.05, 1.2, 1.0)
}

// ---------------------------------------------------------------- arka duvar

// Kahvehane kapısı (çift kanat, üstü camlı); orijin kapı ortası, zemin.
export function door(f) {
  const W = 1.0
  const H = 2.15
  for (const x of [-W / 2 - 0.12, W / 2]) f.box(x, 0, 0, 0.12, H, 0.06, C.stoneLight)
  f.box(-W / 2 - 0.14, H, 0, W + 0.28, 0.14, 0.07, C.stoneLight)
  f.box(-W / 2 - 0.16, 0, 0, W + 0.32, 0.06, 0.32, C.stoneLight)
  for (const x of [-W / 2, 0.005]) {
    const w = W / 2 - 0.005
    f.box(x, 0.06, 0, w, H - 0.06, 0.03, C.door)
    f.box(x + 0.07, 0.2, 0.03, w - 0.14, 0.7, 0.008, C.doorDark)
    f.box(x + 0.07, 1.08, 0.03, w - 0.14, 0.9, 0.006, '#7d8f99', GLASS)
    f.box(x + 0.09, 1.1, 0.034, w - 0.18, 0.86, 0.004, C.lights[2], NIGHT)
    f.box(x + w / 2 - 0.015, 1.08, 0.036, 0.03, 0.9, 0.008, C.door)
  }
  for (const x of [-0.06, 0.03]) f.box(x, 1.0, 0.03, 0.03, 0.1, 0.04, C.brass)
}

// Ahşap kepenkli pencere, altında saksılı çiçeklik; orijin pencere ortası, denizlik yüksekliği.
export function shutteredWindow(f, rnd) {
  const W = 0.9
  const H = 1.0
  f.box(-W / 2 - 0.08, -0.05, 0, W + 0.16, 0.05, 0.12, C.stoneLight)
  f.box(-W / 2 - 0.06, H, 0, W + 0.12, 0.08, 0.05, C.stoneLight)
  f.box(-W / 2, 0, 0.002, W, H, 0.01, '#6f8593', GLASS)
  f.box(-W / 2 + 0.05, 0.05, 0.012, W - 0.1, H - 0.1, 0.004, C.lights[2], NIGHT)
  f.box(-W / 2, 0, 0.01, W, 0.05, 0.03, C.frame)
  f.box(-W / 2, H - 0.05, 0.01, W, 0.05, 0.03, C.frame)
  f.box(-W / 2, 0, 0.01, 0.05, H, 0.03, C.frame)
  f.box(W / 2 - 0.05, 0, 0.01, 0.05, H, 0.03, C.frame)
  f.box(-0.02, 0, 0.016, 0.04, H, 0.024, C.frame)
  f.box(-W / 2, H * 0.55, 0.016, W, 0.04, 0.024, C.frame)
  // açık kepenkler
  for (const x of [-W / 2 - W / 2 - 0.03, W / 2 + 0.03]) {
    f.box(x, 0, 0.005, W / 2, H, 0.03, C.shutter)
    for (let y = 0.08; y < H - 0.05; y += 0.1) f.box(x + 0.04, y, 0.035, W / 2 - 0.08, 0.035, 0.006, C.shutterDark)
  }
  // çiçeklik
  f.box(-W / 2 + 0.02, -0.27, 0.02, W - 0.04, 0.2, 0.2, C.wood)
  for (let i = 0; i < 5; i++) {
    const x = -W / 2 + 0.08 + i * 0.17
    f.box(x - 0.06, -0.07, 0.04, 0.14, 0.1, 0.14, pick(rnd, C.leaves))
    f.box(x - 0.03, 0.02, 0.07, 0.07, 0.06, 0.07, pick(rnd, C.flowers))
  }
}

// Mermer çeşme: kemerli niş, pirinç lüle, taş yalak; orijin çeşme ortası, zemin.
export function fountain(f) {
  f.box(-0.45, 0, 0, 0.9, 1.65, 0.12, C.marble)
  f.box(-0.5, 1.65, 0, 1.0, 0.08, 0.18, C.marbleShade)
  f.box(-0.3, 0.55, 0.12, 0.6, 0.75, 0.006, C.marbleShade)
  f.box(-0.2, 1.3, 0.12, 0.4, 0.08, 0.006, C.marbleShade)
  f.box(-0.24, 1.44, 0.12, 0.48, 0.14, 0.006, C.stoneLight)
  for (let i = 0; i < 3; i++) f.box(-0.2, 1.47 + i * 0.035, 0.127, 0.4 - i * 0.08, 0.012, 0.002, '#8f8574')
  f.box(-0.03, 0.82, 0.12, 0.06, 0.06, 0.04, C.brassDark)
  f.box(-0.018, 0.8, 0.16, 0.036, 0.036, 0.1, C.brass)
  f.box(-0.42, 0, 0.12, 0.84, 0.4, 0.34, C.marble)
  f.box(-0.36, 0.4, 0.17, 0.72, 0.004, 0.24, '#7fb6c9')
  f.box(-0.44, 0.36, 0.1, 0.88, 0.04, 0.38, C.marbleShade)
}

// Duvara tırmanan begonvil; orijin saksı ortası, duvar dibi.
export function bougainvillea(f, rnd) {
  f.box(-0.2, 0, 0.02, 0.4, 0.34, 0.3, C.pot)
  f.box(-0.22, 0.3, 0.0, 0.44, 0.05, 0.34, C.potDark)
  f.box(-0.17, 0.35, 0.04, 0.34, 0.01, 0.26, C.soil)
  let x = 0
  for (let y = 0.35; y < 2.5; y += 0.3) {
    const nx = x + (rnd() - 0.5) * 0.2
    f.box(Math.min(x, nx) - 0.02, y, 0.05, Math.abs(nx - x) + 0.04, 0.32, 0.04, C.woodDark)
    x = nx
  }
  for (let i = 0; i < 22; i++) {
    const a = rnd()
    const y = 1.0 + a * 1.75
    const spread = 0.25 + a * 0.75
    const cx = x + (rnd() - 0.5) * 2 * spread
    const s = 0.12 + rnd() * 0.14
    const color = rnd() < 0.55 ? pick(rnd, C.bougainvillea) : pick(rnd, C.leaves)
    f.box(cx - s / 2, y, 0.03 + rnd() * 0.06, s, s * 0.8, 0.06, color)
  }
}

// Çay ocağı; orijin sol-arka köşe (duvara dayalı), u = uzunluk. Çini önlü tezgâh, pirinç
// semaver, tepside ince belli bardaklar, arkada kavanoz rafı, üstte çizgili tente.
export function teaCounter(f, length, rnd, room) {
  const D = 0.62
  const H = 0.95
  f.box(0.02, 0, 0.02, length - 0.04, 0.08, D - 0.06, C.woodDark)
  f.box(0, 0.08, 0, length, H - 0.12, D, C.wood)
  // çini: üstte ve altta mavi bordür, ortada baklava motifli beyaz karolar
  const tile = 0.15
  const cols = Math.floor((length - 0.1) / tile)
  const u0 = (length - cols * tile) / 2
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < 5; j++) {
      const u = u0 + i * tile
      const y = 0.13 + j * tile
      const border = j === 0 || j === 4
      f.box(u + 0.005, y + 0.005, D, tile - 0.01, tile - 0.01, 0.006, border ? C.tileBlue : C.tileWhite)
      if (!border) {
        f.box(u + tile / 2 - 0.035, y + tile / 2 - 0.035, D + 0.006, 0.07, 0.07, 0.002, C.tileBlue, { rot: [0, 0, Math.PI / 4] })
      }
    }
  }
  f.box(-0.02, H - 0.04, 0, length + 0.04, 0.04, D + 0.03, C.marble)

  samovar(f.frame(0.4, H, 0.36), room)
  const tray = f.frame(0.98, H, 0.32)
  tray.box(-0.23, 0, -0.17, 0.46, 0.015, 0.34, C.brass)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) teaGlass(tray.frame(-0.14 + i * 0.14, 0.015, -0.07 + j * 0.14))
  }
  if (length > 1.8) hangingTray(f.frame(1.5, H, 0.36))
  // tabak yığını ve şekerlik
  const right = length - 0.3
  for (let i = 0; i < 5; i++) f.box(right - 0.05, H + i * 0.012, 0.2, 0.1, 0.01, 0.1, i % 2 ? C.saucerRim : C.porcelain)
  sugarBowl(f.frame(right + 0.12, H, 0.42))

  // kavanoz rafı
  const shelf = 1.85
  f.box(0.1, shelf, 0, length - 0.2, 0.04, 0.24, C.woodDark)
  for (let u = 0.2; u < length - 0.3; u += 0.22) {
    f.box(u, shelf + 0.04, 0.05, 0.14, 0.18, 0.14, '#e6eef0')
    f.box(u + 0.02, shelf + 0.04, 0.07, 0.1, 0.12, 0.1, pick(rnd, C.jars))
    f.box(u + 0.02, shelf + 0.22, 0.07, 0.1, 0.03, 0.1, C.brassDark)
  }
  awning(f.frame(length / 2, 0, 0), length + 0.3)
}

// Pirinç semaver; orijin taban ortası. Üstünde porselen demlik; buhar noktası room.steams'e.
function samovar(f, room) {
  oct(f, 0, 0.3, 0.035, C.brassDark)
  oct(f, 0.035, 0.13, 0.09, C.brass)
  oct(f, 0.125, 0.24, 0.04, C.brassDark)
  oct(f, 0.165, 0.32, 0.34, C.brass)
  oct(f, 0.3, 0.33, 0.035, C.copper)
  // gövdedeki dikey oluklar (dört yüzde)
  for (let side = 0; side < 4; side++) {
    const s = f.frame(0, 0, 0, (side * Math.PI) / 2)
    for (const x of [-0.09, 0.08]) s.box(x, 0.18, 0.16, 0.012, 0.3, 0.004, C.brassDark)
  }
  oct(f, 0.505, 0.24, 0.04, C.brassDark)
  oct(f, 0.545, 0.15, 0.06, C.brass)
  for (const s of [-1, 1]) {
    f.box(s > 0 ? 0.15 : -0.21, 0.42, -0.02, 0.06, 0.025, 0.04, C.ebony)
    f.box(s > 0 ? 0.19 : -0.21, 0.36, -0.02, 0.025, 0.085, 0.04, C.ebony)
  }
  f.box(-0.02, 0.23, 0.14, 0.04, 0.035, 0.11, C.brassDark)
  f.box(-0.014, 0.19, 0.225, 0.028, 0.04, 0.028, C.brassDark)
  f.box(-0.04, 0.27, 0.19, 0.08, 0.02, 0.02, C.ebony)

  const p = f.frame(0, 0.605, 0)
  p.box(-0.075, 0, -0.075, 0.15, 0.11, 0.15, C.porcelain)
  p.box(-0.06, 0.11, -0.06, 0.12, 0.02, 0.12, C.porcelain)
  p.box(-0.015, 0.13, -0.015, 0.03, 0.025, 0.03, C.porcelain)
  p.box(0.07, 0.03, -0.012, 0.08, 0.025, 0.024, C.porcelain, { rot: [0, 0, 0.6] })
  p.box(-0.11, 0.02, -0.01, 0.035, 0.075, 0.02, C.porcelain)
  for (const x of [-0.05, 0.02]) p.box(x, 0.04, 0.075, 0.03, 0.03, 0.004, C.saucerRim)
  room.steams.push(p.point(0, 0.16, 0).toArray())
}

// İnce belli çay bardağı, kırmızı kenarlı tabağında; orijin tabak ortası.
export function teaGlass(f) {
  f.box(-0.052, 0, -0.052, 0.104, 0.006, 0.104, C.saucerRim)
  f.box(-0.046, 0.006, -0.046, 0.092, 0.006, 0.092, C.porcelain)
  f.box(-0.024, 0.012, -0.024, 0.048, 0.04, 0.048, C.tea)
  f.box(-0.017, 0.052, -0.017, 0.034, 0.025, 0.034, C.tea)
  f.box(-0.026, 0.077, -0.026, 0.052, 0.035, 0.052, C.teaLight)
  f.box(-0.027, 0.112, -0.027, 0.054, 0.012, 0.054, C.glassRim)
  f.box(0.026, 0.012, -0.004, 0.04, 0.004, 0.008, C.steel)
}

function hangingTray(f) {
  f.box(-0.13, 0, -0.13, 0.26, 0.012, 0.26, C.brass)
  for (const x of [-0.13, 0.12]) f.box(x, 0.012, -0.006, 0.01, 0.24, 0.012, C.brass)
  f.box(-0.13, 0.25, -0.008, 0.26, 0.016, 0.016, C.brass)
  for (const x of [-0.07, 0.07]) teaGlass(f.frame(x, 0.012, 0.055))
  teaGlass(f.frame(0, 0.012, -0.07))
}

function sugarBowl(f) {
  f.box(-0.04, 0, -0.04, 0.08, 0.06, 0.08, C.porcelain)
  f.box(-0.043, 0.06, -0.043, 0.086, 0.012, 0.086, C.saucerRim)
  f.box(-0.012, 0.072, -0.012, 0.024, 0.02, 0.024, C.porcelain)
}

// Çizgili tente; orijin duvarda tentenin ortası (zemin seviyesi). Yüksek ve kısa tutulur:
// izometrik açıda altındaki semaver ve raf görünür kalır.
function awning(f, length) {
  const y0 = 2.8
  const out = 0.7
  const drop = 0.2
  const a = f.frame(0, y0, 0, 0, Math.atan2(drop, out))
  const n = Math.max(2, Math.round(length / 0.3))
  const w = length / n
  const L = Math.hypot(out, drop)
  for (let i = 0; i < n; i++) a.box(-length / 2 + i * w, 0, 0, w, 0.02, L, C.awning[i % 2])
  const v = f.frame(0, y0 - drop, out)
  for (let i = 0; i < n; i++) {
    v.box(-length / 2 + i * w, -0.15, -0.012, w, 0.15, 0.012, C.awning[i % 2])
    v.box(-length / 2 + i * w + w * 0.2, -0.19, -0.012, w * 0.6, 0.04, 0.012, C.awning[i % 2])
  }
  const rise = 0.5
  for (const x of [-length / 2 + 0.04, length / 2 - 0.06]) {
    f.frame(x, y0 - drop - rise, 0, 0, -Math.atan2(rise, out)).box(0, -0.01, 0, 0.02, 0.02, Math.hypot(rise, out), C.iron)
  }
}

// ---------------------------------------------------------------- oturma

const SIDES = {
  back: [0, -1, 0],
  front: [0, 1, Math.PI],
  left: [-1, 0, Math.PI / 2],
  right: [1, 0, -Math.PI / 2],
}

// Kare çay masası; orijin masa ortası. sides: sandalyelerin olduğu kenarlar (back = duvar
// tarafı, kameraya bakar). cloth: 'red' | 'blue' | 'green' kareli örtü. extra: 'tavla' (yalnızca
// karşılıklı iki kişilik masada) | 'simit'.
export function teaTable(f, { sides = ['back'], cloth, extra }, rnd, room) {
  const S = TABLE_SIZE
  const H = TABLE_HEIGHT
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    f.box(x * (S / 2 - 0.07) - 0.025, 0, z * (S / 2 - 0.07) - 0.025, 0.05, H - 0.03, 0.05, C.woodDark)
  }
  f.box(-S / 2 + 0.05, H - 0.1, -S / 2 + 0.05, S - 0.1, 0.06, S - 0.1, C.woodDark)
  f.box(-S / 2, H - 0.03, -S / 2, S, 0.03, S, C.wood)
  let top = H
  if (cloth) {
    const c = S + 0.06
    f.box(-c / 2, H, -c / 2, c, 0.005, c, C.cloth)
    for (const [x, z, w, d] of [[-c / 2, -c / 2, c, 0.006], [-c / 2, c / 2 - 0.006, c, 0.006], [-c / 2, -c / 2, 0.006, c], [c / 2 - 0.006, -c / 2, 0.006, c]]) {
      f.box(x, H - 0.07, z, w, 0.07, d, C.cloth)
    }
    const n = 4
    const cell = c / n
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if ((i + j) % 2 === 0) f.box(-c / 2 + i * cell, H + 0.005, -c / 2 + j * cell, cell, 0.002, cell, C.cloths[cloth])
      }
    }
    top = H + 0.007
  }

  for (const side of sides) {
    const [dx, dz, yaw] = SIDES[side]
    const c = f.frame(dx * CHAIR_DISTANCE, 0, dz * CHAIR_DISTANCE, yaw)
    chair(c, rnd)
    room.seats.push({ position: c.point(0, SEAT_HEIGHT, 0).toArray(), yaw: c.facing() })
    teaGlass(f.frame(dx * 0.2, top, dz * 0.2, yaw).frame(0.06, 0, 0))
  }

  // Bardaklar kenarlarda; ortası tavla, simit tabağı ya da şekerlik için boş.
  if (extra === 'tavla') {
    tavla(f.frame(0, top, 0, sides.includes('back') || sides.includes('front') ? 0 : Math.PI / 2))
  } else if (extra === 'simit') {
    simitPlate(f.frame(0, top, 0))
    sugarBowl(f.frame(-0.22, top, 0.22))
  } else {
    sugarBowl(f.frame(0, top, 0))
  }
}

// Hasır oturaklı ahşap sandalye; orijin oturak ortası (zemin), oturan +z'ye bakar.
export function chair(f, rnd) {
  const wood = pick(rnd, C.chairs)
  const seat = SEAT_HEIGHT
  for (const [x, z] of [[-0.18, -0.18], [0.14, -0.18], [-0.18, 0.14], [0.14, 0.14]]) {
    f.box(x, 0, z, 0.04, seat - 0.04, 0.04, wood)
  }
  f.box(-0.17, 0.14, -0.17, 0.34, 0.025, 0.02, wood)
  f.box(-0.17, 0.14, 0.15, 0.34, 0.025, 0.02, wood)
  f.box(-0.2, seat - 0.05, -0.2, 0.4, 0.04, 0.4, wood)
  f.box(-0.18, seat - 0.01, -0.18, 0.36, 0.015, 0.36, C.wicker)
  f.box(-0.18, seat + 0.004, -0.006, 0.36, 0.002, 0.012, C.wickerDark)
  f.box(-0.006, seat + 0.004, -0.18, 0.012, 0.002, 0.36, C.wickerDark)
  for (const x of [-0.19, 0.15]) f.box(x, seat - 0.01, -0.2, 0.04, 0.47, 0.04, wood)
  f.box(-0.19, seat + 0.24, -0.195, 0.38, 0.05, 0.03, wood)
  f.box(-0.2, seat + 0.38, -0.205, 0.4, 0.08, 0.05, wood)
}

function tavla(f) {
  const W = 0.4
  const D = 0.28
  f.box(-W / 2, 0, -D / 2, W, 0.025, D, C.tavla)
  const half = W / 2 - 0.03
  for (const x0 of [-W / 2 + 0.02, 0.01]) {
    f.box(x0, 0.025, -D / 2 + 0.02, half, 0.002, D - 0.04, C.tavlaFelt)
    for (let i = 0; i < 6; i++) {
      const x = x0 + 0.005 + i * (half / 6)
      f.box(x, 0.027, -D / 2 + 0.02, 0.022, 0.002, 0.09, C.points[i % 2])
      f.box(x, 0.027, D / 2 - 0.11, 0.022, 0.002, 0.09, C.points[(i + 1) % 2])
    }
  }
  for (const [x, z, white] of [[-0.16, -0.1, 1], [-0.16, -0.07, 1], [-0.1, 0.09, 0], [-0.04, 0.09, 0], [0.05, -0.1, 1], [0.12, 0.09, 0], [0.12, 0.06, 0], [0.16, -0.1, 1]]) {
    f.box(x - 0.014, 0.029, z - 0.014, 0.028, 0.012, 0.028, white ? C.porcelain : C.ebony)
  }
  for (const x of [-0.02, 0.015]) f.box(x, 0.029, -0.01, 0.018, 0.018, 0.018, C.porcelain)
}

function simitPlate(f) {
  f.box(-0.1, 0, -0.1, 0.2, 0.01, 0.2, C.porcelain)
  const s = f.frame(0, 0.01, 0, Math.PI / 4)
  for (const [x, z, w, d] of [[-0.07, -0.07, 0.14, 0.035], [-0.07, 0.035, 0.14, 0.035], [-0.07, -0.035, 0.035, 0.07], [0.035, -0.035, 0.035, 0.07]]) {
    s.box(x, 0, z, w, 0.03, d, C.simit)
  }
}

// Kilim minderli sedir; orijin ortası, sırt -z tarafında. sini: önüne çay takımlı sini sehpa.
export function sedir(f, rnd, length = 1.8, sini = false) {
  f.box(-length / 2, 0, -0.32, length, 0.3, 0.64, C.woodDark)
  f.box(-length / 2 + 0.03, 0.3, -0.3, length - 0.06, 0.1, 0.6, C.kilim[3])
  for (let u = -length / 2 + 0.1; u < length / 2 - 0.1; u += 0.22) {
    f.box(u, 0.4, -0.3, 0.07, 0.003, 0.6, pick(rnd, [C.kilim[0], C.kilim[1], C.kilim[4]]))
  }
  const n = Math.max(2, Math.floor(length / 0.6))
  for (let i = 0; i < n; i++) {
    const x = -length / 2 + (length / n) * (i + 0.5)
    f.box(x - 0.24, 0.42, -0.3, 0.48, 0.36, 0.14, C.kilim[i % 2 ? 1 : 0], { rot: [-0.18, 0, 0] })
    f.box(x - 0.12, 0.52, -0.22, 0.24, 0.14, 0.004, C.kilim[2], { rot: [-0.18, 0, 0] })
  }
  if (sini) siniTable(f.frame(0, 0, 0.75))
}

// Katlanır ayaklı bakır sini sehpa: üstünde çift demlik, iki ince belli bardak, lokum tabağı.
export function siniTable(f) {
  for (const x of [-0.17, 0.13]) {
    for (const s of [-1, 1]) f.frame(x + 0.02, 0.2, 0, 0, s * 0.45).box(-0.02, -0.22, -0.02, 0.04, 0.44, 0.04, C.woodDark)
  }
  oct(f, 0.38, 0.66, 0.02, C.copperDark)
  oct(f, 0.4, 0.6, 0.008, C.copper)
  const top = 0.408
  // çift demlik: altta çelik su demliği, üstte porselen çay demliği
  const k = f.frame(0.02, top, -0.04)
  oct(k, 0, 0.17, 0.12, C.steel)
  k.box(0.08, 0.04, -0.015, 0.09, 0.025, 0.03, C.steel, { rot: [0, 0, 0.55] })
  k.box(-0.13, 0.05, -0.015, 0.04, 0.08, 0.03, C.ebony)
  oct(k, 0.12, 0.12, 0.08, C.porcelain)
  k.box(-0.045, 0.2, -0.045, 0.09, 0.015, 0.09, C.porcelain)
  k.box(-0.012, 0.215, -0.012, 0.024, 0.02, 0.024, C.porcelain)
  for (const x of [-0.04, 0.02]) k.box(x, 0.15, 0.058, 0.025, 0.025, 0.004, C.saucerRim)
  teaGlass(f.frame(-0.17, top, 0.12))
  teaGlass(f.frame(0.15, top, 0.14))
  f.box(-0.05, top, 0.12, 0.13, 0.01, 0.1, C.porcelain)
  for (let i = 0; i < 4; i++) {
    f.box(-0.04 + (i % 2) * 0.05, top + 0.01, 0.13 + Math.floor(i / 2) * 0.04, 0.035, 0.03, 0.035, i % 3 ? C.lokum[0] : C.lokum[1])
  }
}

// Ayaklı kara tahta menü panosu (A çerçeve); yüzü +z.
export function menuBoard(f) {
  for (const [z, pitch, face] of [[0.1, -0.13, true], [-0.1, 0.13, false]]) {
    const b = f.frame(0, 0, z, 0, pitch)
    b.box(-0.25, 0, -0.015, 0.5, 0.82, 0.03, C.wood)
    if (!face) continue
    b.box(-0.21, 0.08, 0.015, 0.42, 0.68, 0.004, C.chalkboard)
    // başlık, satırlar ve köşede çay bardağı çizimi
    b.box(-0.15, 0.64, 0.019, 0.3, 0.05, 0.002, C.chalk)
    for (const [y, w] of [[0.52, 0.26], [0.44, 0.2], [0.36, 0.28], [0.28, 0.18], [0.2, 0.24]]) {
      b.box(-0.17, y, 0.019, w * 0.6, 0.018, 0.002, C.chalk)
      b.box(0.08, y, 0.019, 0.07, 0.018, 0.002, C.chalkYellow)
    }
    b.box(0.07, 0.1, 0.019, 0.05, 0.06, 0.002, C.tea)
    b.box(0.065, 0.16, 0.019, 0.06, 0.012, 0.002, C.chalk)
  }
}

// Seyyar simitçi tezgâhı: kırmızı araba, tekerlekler, camsız çerçeveli vitrin, içinde simit
// yığını. Orijin ortası, ön yüzü +z (müşteri tarafı).
export function simitCart(f) {
  const L = 0.9
  const D = 0.55
  for (const s of [-1, 1]) {
    const w = f.frame(s * (L / 2 + 0.03), 0.22, 0)
    w.box(-0.025, -0.22, -0.22, 0.05, 0.44, 0.44, C.ebony)
    w.box(-0.03, -0.17, -0.17, 0.06, 0.34, 0.34, C.cartRed)
    w.box(-0.035, -0.04, -0.04, 0.07, 0.08, 0.08, C.brass)
  }
  f.box(-L / 2, 0.24, -D / 2, L, 0.05, D, C.cartRedDark)
  f.box(-L / 2 + 0.02, 0.29, -D / 2 + 0.02, L - 0.04, 0.42, D - 0.04, C.cartRed)
  f.box(-L / 2 + 0.02, 0.6, D / 2 - 0.02, L - 0.04, 0.04, 0.006, C.cartYellow)
  f.box(-L / 2, 0.71, -D / 2, L, 0.03, D, C.cartRedDark)
  // tutma kolları ve arka ayaklar
  for (const z of [-0.18, 0.15]) {
    f.box(-L / 2 - 0.35, 0.62, z, 0.36, 0.03, 0.03, C.woodDark)
    f.box(-L / 2 + 0.03, 0, z, 0.04, 0.24, 0.04, C.woodDark)
  }
  // vitrin: köşe dikmeleri, üst çatı, ön tabela
  const y0 = 0.74
  const H = 0.42
  for (const [x, z] of [[-L / 2 + 0.02, -D / 2 + 0.02], [L / 2 - 0.05, -D / 2 + 0.02], [-L / 2 + 0.02, D / 2 - 0.05], [L / 2 - 0.05, D / 2 - 0.05]]) {
    f.box(x, y0, z, 0.03, H, 0.03, C.brass)
  }
  f.box(-L / 2 + 0.02, y0 + H, -D / 2 + 0.02, L - 0.04, 0.02, D - 0.04, C.brass)
  f.box(-L / 2 - 0.03, y0 + H + 0.02, -D / 2 - 0.03, L + 0.06, 0.05, D + 0.06, C.cartRed)
  for (let i = 0; i < 5; i++) f.box(-L / 2 + 0.05 + i * 0.19, y0 + H + 0.02, D / 2 + 0.03, 0.09, 0.05, 0.004, C.porcelain)
  f.box(-0.2, y0 + H + 0.07, -0.02, 0.4, 0.14, 0.04, C.cartYellow)
  f.box(-0.16, y0 + H + 0.11, 0.02, 0.32, 0.05, 0.003, C.cartRed)
  // simitler: alt katta 3x2, üstte 2x1
  for (const [layer, nx, nz] of [[0, 3, 2], [1, 2, 1]]) {
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const x = (i - (nx - 1) / 2) * 0.24
        const z = (j - (nz - 1) / 2) * 0.22
        simit(f.frame(x, y0 + layer * 0.045, z, 0.3 * (i + j)))
      }
    }
  }
}

// Susamlı simit; orijin ortası. Kare halka, köşeleri yuvarlansın diye 45° dönük ikinci halka.
function simit(f) {
  for (const yaw of [0, Math.PI / 4]) {
    const s = f.frame(0, 0, 0, yaw)
    for (const [x, z, w, d] of [[-0.085, -0.085, 0.17, 0.04], [-0.085, 0.045, 0.17, 0.04], [-0.085, -0.045, 0.04, 0.09], [0.045, -0.045, 0.04, 0.09]]) {
      s.box(x, 0, z, w, 0.04, d, C.simit)
    }
  }
  for (const [x, z] of [[-0.06, -0.02], [0.05, 0.03], [0.0, 0.065], [-0.02, -0.07]]) {
    f.box(x, 0.04, z, 0.012, 0.004, 0.012, C.sesame)
  }
}

// Uzun ahşap çiçeklik: sardunya, lavanta, papatya; orijin ortası.
export function planter(f, rnd, length = 2) {
  f.box(-length / 2, 0, -0.18, length, 0.38, 0.36, C.wood)
  f.box(-length / 2 - 0.02, 0.34, -0.2, length + 0.04, 0.05, 0.4, C.woodDark)
  f.box(-length / 2 + 0.03, 0.39, -0.15, length - 0.06, 0.01, 0.3, C.soil)
  for (let u = -length / 2 + 0.1; u < length / 2 - 0.1; u += 0.22) {
    const kind = Math.floor(rnd() * 3)
    f.box(u - 0.08, 0.39, -0.12 + rnd() * 0.06, 0.17, 0.12 + rnd() * 0.06, 0.17, pick(rnd, C.leaves))
    if (kind === 0) {
      f.box(u - 0.05, 0.52, -0.08, 0.1, 0.07, 0.1, pick(rnd, C.flowers))
    } else if (kind === 1) {
      for (const x of [-0.05, 0.0, 0.05]) f.box(u + x - 0.01, 0.5, -0.04 + x, 0.025, 0.14, 0.025, C.lavender)
    } else {
      for (const [x, z] of [[-0.04, -0.06], [0.04, 0.02]]) {
        f.box(u + x - 0.025, 0.52, z, 0.05, 0.012, 0.05, C.daisy)
        f.box(u + x - 0.01, 0.53, z + 0.015, 0.02, 0.006, 0.02, C.cartYellow)
      }
    }
  }
}

// Sekizgen taş kenarlı süs havuzu: ortada fıskiye, nilüferler ve kırmızı balıklar.
export function pool(f, rnd) {
  const a = 0.66
  const t = 0.12
  const s = 2 * a * Math.tan(Math.PI / 8)
  for (let k = 0; k < 8; k++) {
    const e = f.frame(0, 0, 0, (k * Math.PI) / 4)
    e.box(-s / 2 - 0.02, 0, a - t, s + 0.04, 0.34, t, C.stone[k % 2 ? 0 : 2])
    e.box(-s / 2 - 0.03, 0.34, a - t - 0.01, s + 0.06, 0.04, t + 0.02, C.stoneLight)
  }
  oct(f, 0, 2 * (a - t) + 0.04, 0.3, C.poolDeep)
  oct(f, 0.3, 2 * (a - t) + 0.04, 0.004, C.water)
  // fıskiye
  oct(f, 0.3, 0.16, 0.12, C.stoneLight)
  oct(f, 0.42, 0.1, 0.05, C.stone[2])
  f.box(-0.012, 0.47, -0.012, 0.024, 0.06, 0.024, C.brass)
  f.box(-0.008, 0.53, -0.008, 0.016, 0.1, 0.016, C.seaFoam)
  for (let i = 0; i < 3; i++) {
    const ang = rnd() * Math.PI * 2
    const r = 0.22 + rnd() * 0.18
    f.box(Math.sin(ang) * r - 0.06, 0.304, Math.cos(ang) * r - 0.06, 0.12, 0.004, 0.12, C.lilyPad)
    if (i === 0) f.box(Math.sin(ang) * r - 0.02, 0.308, Math.cos(ang) * r - 0.02, 0.04, 0.03, 0.04, C.lily)
  }
  for (let i = 0; i < 3; i++) {
    const ang = rnd() * Math.PI * 2
    const r = 0.18 + rnd() * 0.25
    f.frame(Math.sin(ang) * r, 0.296, Math.cos(ang) * r, ang).box(-0.045, 0, -0.012, 0.09, 0.006, 0.024, C.goldfish)
  }
}

// ---------------------------------------------------------------- bitkiler ve kedi

// Gövdesi alacalı çınar, çevresinde ağaç altı oturağı; orijin gövde ortası.
export function planeTree(f, rnd) {
  f.box(-0.3, 0, -0.3, 0.6, 0.1, 0.6, C.bark[1])
  f.box(-0.2, 0, -0.2, 0.4, 2.0, 0.4, C.bark[0])
  for (let i = 0; i < 8; i++) {
    const side = i % 4
    const y = 0.2 + rnd() * 1.6
    const s = 0.08 + rnd() * 0.12
    const t = -0.15 + rnd() * 0.22
    const [x, z, w, d] = [[t, 0.2, s, 0.01], [t, -0.21, s, 0.01], [0.2, t, 0.01, s], [-0.21, t, 0.01, s]][side]
    f.box(x, y, z, w, s * 1.4, d, pick(rnd, C.bark))
  }
  for (let i = 0; i < 4; i++) {
    const yaw = (i / 4) * Math.PI * 2 + rnd() * 0.6
    f.frame(0, 1.75, 0, yaw, 0.65).box(-0.06, 0, -0.06, 0.12, 0.85, 0.12, C.bark[0])
  }
  // kubbe biçimli taç: dışa doğru alçalan küçük yaprak kümeleri, üstte açık yeşil
  for (let i = 0; i < 30; i++) {
    const a = rnd() * Math.PI * 2
    const r = 0.1 + rnd() * 0.95
    const s = 0.32 + rnd() * 0.34
    const y = 2.05 + rnd() * 0.75 - r * 0.3
    const color = y > 2.45 ? pick(rnd, [C.leaves[1], C.leaves[3], C.leafLight]) : pick(rnd, C.leaves)
    f.box(Math.sin(a) * r - s / 2, y, Math.cos(a) * r - s / 2, s, s * 0.7, s, color)
  }
  // ağaç altı oturağı
  const o = 0.68
  const i = 0.3
  for (const [x, z, w, d] of [[-o, -o, 2 * o, o - i], [-o, i, 2 * o, o - i], [-o, -i, o - i, 2 * i], [i, -i, o - i, 2 * i]]) {
    f.box(x, 0.38, z, w, 0.05, d, C.woodLight)
  }
  for (const [x, z] of [[-o, -o], [o - 0.06, -o], [-o, o - 0.06], [o - 0.06, o - 0.06]]) f.box(x, 0, z, 0.06, 0.38, 0.06, C.woodDark)
}

// Büyük toprak saksıda zeytin ağacı.
export function oliveTree(f, rnd) {
  f.box(-0.26, 0, -0.26, 0.52, 0.48, 0.52, C.pot)
  f.box(-0.28, 0.44, -0.28, 0.56, 0.06, 0.56, C.potDark)
  f.box(-0.23, 0.5, -0.23, 0.46, 0.01, 0.46, C.soil)
  f.box(-0.05, 0.5, -0.05, 0.1, 0.6, 0.1, C.bark[3], { rot: [0, 0, 0.12] })
  f.box(-0.04, 1.0, -0.04, 0.08, 0.35, 0.08, C.bark[3], { rot: [0.2, 0, -0.15] })
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2
    const r = rnd() * 0.32
    const s = 0.24 + rnd() * 0.2
    f.box(Math.sin(a) * r - s / 2, 1.05 + rnd() * 0.45, Math.cos(a) * r - s / 2, s, s * 0.7, s, pick(rnd, C.olive))
  }
}

// Boyalı teneke saksıda sardunya.
export function geraniumTin(f, rnd) {
  f.box(-0.13, 0, -0.13, 0.26, 0.32, 0.26, pick(rnd, C.tins))
  f.box(-0.11, 0.32, -0.11, 0.22, 0.01, 0.22, C.soil)
  for (let i = 0; i < 4; i++) {
    const x = -0.14 + rnd() * 0.16
    const z = -0.14 + rnd() * 0.16
    f.box(x, 0.32 + rnd() * 0.08, z, 0.14, 0.1, 0.14, pick(rnd, C.leaves))
  }
  const flower = pick(rnd, C.flowers)
  for (let i = 0; i < 3; i++) {
    f.box(-0.1 + rnd() * 0.14, 0.46 + rnd() * 0.08, -0.1 + rnd() * 0.14, 0.07, 0.06, 0.07, flower)
  }
}

// Kilim minderinde yatan sarman kedi (sfenks duruşu): gövde yerel x boyunca, baş +x ucunda
// kalkık, yüzü +z'ye dönük, ön patiler öne uzanmış, kuyruk gövdenin önüne dolanmış.
// Oranlar gerçek kediye yakın: gövde ~2.5 baş boyu, baş gövde genişliğinin ~2/3'ü. Küçük ölçekte
// seçilsin diye %25 büyük. Kameraya dönük olması için yerleşimde facing ≈ 45°.
export function cat(f) {
  f.box(-0.42, 0, -0.27, 0.84, 0.07, 0.54, C.kilim[0])
  f.box(-0.37, 0.07, -0.22, 0.74, 0.004, 0.44, C.kilim[2])
  for (const [x, z] of [[-0.44, -0.29], [0.4, -0.29], [-0.44, 0.25], [0.4, 0.25]]) f.box(x, 0.02, z, 0.04, 0.03, 0.04, C.kilim[2])
  const S = 1.25
  const c = f.frame(-0.03, 0.074, -0.02)
  const b = (x, y, z, w, h, d, color) => c.box(x * S, y * S, z * S, w * S, h * S, d * S, color)
  // gövde: yuvarlatılmış somun, sırtta ve yanda tekir çizgileri
  b(-0.16, 0, -0.1, 0.3, 0.12, 0.2, C.cat)
  b(-0.18, 0, -0.08, 0.34, 0.1, 0.16, C.cat)
  b(-0.14, 0.12, -0.075, 0.25, 0.025, 0.15, C.cat)
  for (const x of [-0.11, -0.05, 0.01]) {
    b(x, 0.145, -0.065, 0.025, 0.003, 0.13, C.catStripe)
    b(x, 0.05, 0.1, 0.02, 0.06, 0.003, C.catStripe)
  }
  // boyun ve ön patiler (öne uzanmış, uçları beyaz)
  b(0.08, 0.06, -0.065, 0.1, 0.09, 0.13, C.cat)
  for (const z of [-0.06, 0.02]) {
    b(0.14, 0, z, 0.13, 0.035, 0.04, C.cat)
    b(0.27, 0, z, 0.035, 0.036, 0.04, C.catWhite)
  }
  // baş (gövde genişliğinin ~2/3'ü): yanaklar, beyaz ağız, pembe burun, yeşil gözler
  b(0.095, 0.105, -0.055, 0.13, 0.12, 0.13, C.cat)
  b(0.09, 0.115, -0.035, 0.14, 0.055, 0.1, C.cat)
  b(0.13, 0.11, 0.075, 0.06, 0.035, 0.014, C.catWhite)
  b(0.152, 0.138, 0.088, 0.016, 0.011, 0.005, C.catNose)
  for (const x of [0.109, 0.189]) {
    b(x, 0.158, 0.074, 0.022, 0.018, 0.004, C.catEye)
    b(x + 0.008, 0.158, 0.077, 0.006, 0.018, 0.003, C.ebony)
  }
  for (const x of [0.145, 0.168]) b(x, 0.225, -0.045, 0.008, 0.002, 0.09, C.catStripe)
  // sivri kulaklar, içleri pembe
  for (const x of [0.1, 0.185]) {
    b(x, 0.225, -0.025, 0.04, 0.035, 0.04, C.cat)
    b(x + 0.01, 0.26, -0.015, 0.02, 0.016, 0.02, C.cat)
    b(x + 0.01, 0.23, 0.015, 0.02, 0.026, 0.003, C.catNose)
  }
  // kuyruk: arkadan gövdenin önüne dolanır, ucu koyu
  b(-0.22, 0, -0.04, 0.05, 0.035, 0.14, C.cat)
  b(-0.2, 0, 0.1, 0.19, 0.035, 0.035, C.cat)
  b(-0.04, 0, 0.1, 0.04, 0.036, 0.035, C.catStripe)
}
