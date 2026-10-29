import { Euler, Quaternion, Vector3 } from 'three'
import { pick } from '../core/voxel'

// Siber Loft temasının voxel parçaları: megakentte bir kulenin üst katı. Birim ≈ 1 metre.
// Tasarım dili: koyu metal ve mat siyah gövdeler, beyaz kabuklu mobilyalar, camgöbeği ve
// eflatun neon çizgiler. Neonlar bulb katmanında (tema bulb rengini beyaz tutar, renkler olduğu
// gibi parlar).
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür. Duvar parçalarında orijin duvar yüzeyinin dibi, +z odanın içi.
// fx: hareket eden kutular ({ view, room, lit, steams }); bunlar katmanlara değil CyberEffect'e
// gider. view (uçan araçların gövdesi) camın gün zamanı rengini alır, room (neon, LED, hologram,
// ekran) kendi renginde parlar, lit (drone) ışık alır.

export const WALL = 0.25
export const FLOOR_BOTTOM = -0.3
export const WALL_HEIGHT = 3.0
const TABLE_HEIGHT = 0.74
const SEAT_HEIGHT = 0.47
const LOUNGE_SEAT = 0.38
const LOW_TABLE = 0.4
const CROWN = 2.86
const SILL = 0.3
const WINDOW_TOP = 2.7
const VIEW_DEPTH = -0.18
const DESK_DEPTH = 0.55
// Pencere masası sandalyesinin duvara uzaklığı.
const DESK_CHAIR = 0.98
const TAU = Math.PI * 2
const GLASS = { layer: 'glass' }
const BULB = { layer: 'bulb' }
const NIGHT = { layer: 'night' }
const X_AXIS = new Vector3(1, 0, 0)

// Neon renkleri ve sönük hâlleri.
export const N = {
  cyan: '#3ff4ff',
  magenta: '#ff3fd2',
  violet: '#a46bff',
  amber: '#ffb347',
  red: '#ff3b4f',
  green: '#4dff9a',
  white: '#e8fbff',
  yellow: '#ffe14f',
}

// Nokta ışık renkleri (RoomCanvas lamba başına renk alır).
export const LIGHT = { magenta: '#ff5ad8', cyan: '#5af0ff', amber: '#ffb36b' }

export const C = {
  floor: '#151821',
  seam: '#1d6b78',
  body: '#10131b',
  panel: ['#1b202b', '#1e2430'],
  trim: '#2a3140',
  metal: '#3a4250',
  metalLight: '#8a95a8',
  chrome: '#c8d2e0',
  black: '#0b0c12',
  shell: '#e6eaf0',
  cushion: '#b8287a',
  cushionCyan: '#1b8fa0',
  tableTop: '#141a26',
  screen: '#081826',
  screenLine: '#123c48',
  radar: ['#1f8a5a', '#08160f'],
  rack: '#1a1e28',
  blade: '#262c38',
  door: '#2b3242',
  doorDark: '#1c2230',
  hazard: '#e8c13a',
  vending: '#2a1438',
  display: '#fff3dc',
  product: ['#ff6b4a', '#4ad8ff', '#ffd84a', '#7cff6b', '#ff4fa3', '#f2efe8'],
  rug: '#1a1426',
  sky: ['#c9d3e6', '#aab4da', '#8f90c8'],
  farTower: '#7a82a2',
  tower: ['#4a5272', '#3c4462'],
  litWindow: ['#ffd27a', '#7af0ff', '#ff9ad8', '#fff3c4'],
  car: '#2a2f45',
  mug: '#f2efe8',
  coffee: '#3a2418',
  milkTea: '#d8bf98',
  boba: '#2a1a14',
  can: '#1c1f2c',
  plant: ['#3f8a4a', '#4fa05a', '#2f7a3e'],
  bark: '#5a4030',
  moss: '#2f6a34',
}

// Efekt kutusu: katmana değil efekt listesine gider. Merkez ve dönüş dünyada saklanır.
function fxBox(f, x, y, z, w, h, d, color, { rot, ...extra } = {}) {
  const quat = f.worldRotation()
  if (rot) quat.multiply(new Quaternion().setFromEuler(new Euler(rot[0], rot[1], rot[2])))
  return { center: f.point(x + w / 2, y + h / 2, z + d / 2), quat, size: [w, h, d], color, ...extra }
}

const axisOf = (f, x, y, z) => f.point(x, y, z).sub(f.point(0, 0, 0)).toArray()

// a'dan b'ye uzanan t kalınlığında çubuk (kablo, kol, ayak).
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

// xz düzleminde r yarıçaplı disk (masa üstü, platform).
function diskXZ(f, y, r, step, h, color, opts) {
  for (let z = -r; z < r - 1e-3; z += step) {
    const d = Math.min(step, r - z)
    const c = z + d / 2
    const half = Math.sqrt(Math.max(r * r - c * c, 0))
    f.box(-half, y, z, 2 * half, h, d, color, opts)
  }
}

// Yatay halka (n parça), y yüksekliğinde r yarıçaplı. add: (çerçeve, x, y, z, w, h, d) çizer.
function ring(f, y, r, n, t, add) {
  const len = 2 * r * Math.tan(Math.PI / n) + 0.004
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU
    add(f.frame(Math.sin(a) * r, y, Math.cos(a) * r, a), -len / 2, 0, -t / 2, len, t, t)
  }
}

// ---------------------------------------------------------------- yapı

// Döşeme: koyu levha, metrelik karolar arasında sönük camgöbeği derzler; ön ve sağ kesik kenarda
// neon şerit (kat havada asılı gibi).
export function floor(f, width, depth) {
  f.box(0, FLOOR_BOTTOM, 0, width, -FLOOR_BOTTOM, depth, C.floor)
  for (let x = 1; x < width - 0.2; x += 1) f.box(x - 0.008, 0, 0, 0.016, 0.003, depth, C.seam, BULB)
  for (let z = 1; z < depth - 0.2; z += 1) f.box(0, 0, z - 0.008, width, 0.003, 0.016, C.seam, BULB)
  f.box(0, -0.13, depth, width, 0.03, 0.012, N.cyan, BULB)
  f.box(width, -0.13, 0, 0.012, 0.03, depth, N.cyan, BULB)
}

// Duvar kaplaması [u0, u1] aralığında ~1.2 m'lik koyu paneller.
function panels(f, u0, u1, y0, y1) {
  const n = Math.max(1, Math.round((u1 - u0) / 1.2))
  const w = (u1 - u0) / n
  for (let i = 0; i < n; i++) f.box(u0 + i * w + 0.015, y0, -0.02, w - 0.03, y1 - y0, 0.02, C.panel[i % 2])
}

// Duvarın ortak katmanları: zemin altı gövde, LED çizgili süpürgelik, altında eflatun LED olan
// tavan silmesi ve üst kapak.
function wallShell(f, from, length) {
  f.box(from, FLOOR_BOTTOM, -WALL, length - from, -FLOOR_BOTTOM, WALL, C.body)
  f.box(0, 0, -0.02, length, 0.12, 0.05, C.trim)
  f.box(0, 0.05, 0.03, length, 0.015, 0.006, C.seam, BULB)
  f.box(0, CROWN, -0.02, length, WALL_HEIGHT - CROWN, 0.07, C.trim)
  f.box(0, CROWN - 0.02, 0.02, length, 0.02, 0.03, N.magenta, BULB)
  f.box(from, WALL_HEIGHT, -WALL, length - from, 0.04, WALL, C.trim)
}

// Arka duvar: z = 0 boyunca, x = -WALL'dan width'e.
export function backWall(f, width) {
  wallShell(f, -WALL, width)
  f.box(-WALL, 0, -WALL, width + WALL, WALL_HEIGHT, WALL - 0.02, C.body)
  panels(f, 0, width, 0.12, CROWN)
}

// Sol duvar: [a, b] (u, 0 = ön kenar) aralığında yerden tavana panoramik pencere; ardında gece
// kenti. Pencerenin altında LED'li basamak, dikmeler 1.5 m'de bir.
export function windowWall(f, length, a, b, rnd, fx) {
  const t = WALL - 0.02
  wallShell(f, 0, length)
  f.box(0, 0, -WALL, a, WALL_HEIGHT, t, C.body)
  f.box(a, 0, -WALL, b - a, SILL, t, C.body)
  f.box(a, WINDOW_TOP, -WALL, b - a, WALL_HEIGHT - WINDOW_TOP, t, C.body)
  f.box(b, 0, -WALL, length - b, WALL_HEIGHT, t, C.body)
  if (a - 0.1 > 0.2) panels(f, 0, a - 0.1, 0.12, CROWN)
  if (length - b - 0.1 > 0.2) panels(f, b + 0.1, length, 0.12, CROWN)

  f.box(a - 0.1, 0.12, -0.08, b - a + 0.2, SILL - 0.108, 0.16, C.trim)
  f.box(a - 0.1, SILL - 0.04, 0.08, b - a + 0.2, 0.015, 0.006, N.cyan, BULB)
  f.box(a - 0.1, WINDOW_TOP, -0.08, b - a + 0.2, CROWN - 0.02 - WINDOW_TOP, 0.12, C.trim)
  f.box(a - 0.1, SILL, -0.08, 0.105, WINDOW_TOP - SILL, 0.12, C.trim)
  f.box(b - 0.005, SILL, -0.08, 0.105, WINDOW_TOP - SILL, 0.12, C.trim)
  const n = Math.max(1, Math.round((b - a) / 1.5))
  for (let i = 1; i < n; i++) {
    const u = a + (i * (b - a)) / n
    f.box(u - 0.025, SILL, -0.07, 0.05, WINDOW_TOP - SILL, 0.08, C.trim)
  }
  skyline(f, a, b, rnd, fx)
}

// Gece kenti: gök bantları, uzak ve yakın kuleler (gece pencere şeritleri yanar), tepelerinde
// kırmızı ikaz lambaları, hologram reklam panoları ve iki şeritte ters yönde akan uçan araçlar.
// Katmanlar önden arkaya 0.5-1 mm aralıklı; aynı düzleme düşen farklı renkli yüzler titrer.
function skyline(f, a, b, rnd, fx) {
  const v = VIEW_DEPTH
  const H = WINDOW_TOP - SILL
  const w = b - a
  f.box(a, SILL, v - 0.014, w, H * 0.4, 0.002, C.sky[0], GLASS)
  f.box(a, SILL + H * 0.4, v - 0.014, w, H * 0.3, 0.002, C.sky[1], GLASS)
  f.box(a, SILL + H * 0.7, v - 0.014, w, H * 0.3, 0.002, C.sky[2], GLASS)
  for (let u = a - 0.1; u < b; u += 0.22 + rnd() * 0.25) {
    f.box(u, SILL, v - 0.012, 0.2 + rnd() * 0.25, H * (0.3 + rnd() * 0.35), 0.001, C.farTower, GLASS)
  }
  let k = 0
  for (let u = a - 0.05; u < b - 0.1; u += 0.42 + rnd() * 0.3, k++) {
    const tw = Math.min(0.26 + rnd() * 0.24, b + 0.05 - u)
    const th = H * (0.3 + rnd() * 0.58)
    const z = v - (k % 2 ? 0.009 : 0.0105)
    f.box(u, SILL, z, tw, th, 0.001, C.tower[k % 2], GLASS)
    for (let y = SILL + 0.1; y < SILL + th - 0.08; y += 0.09) {
      if (rnd() < 0.55) f.box(u + 0.035, y, z + 0.001, tw - 0.07, 0.025, 0.0005, pick(rnd, C.litWindow), NIGHT)
    }
    if (th > H * 0.72) {
      f.box(u + tw / 2 - 0.006, SILL + th, z, 0.012, 0.1, 0.001, C.tower[k % 2], GLASS)
      fx.room.blinkers.push(fxBox(f, u + tw / 2 - 0.015, SILL + th + 0.1, z, 0.03, 0.03, 0.001, N.red, { rate: 0.45, duty: 0.35, phase: rnd() }))
    }
    if (k % 4 === 1 && tw > 0.3) {
      // hologram reklam panosu: iki renk sırayla yanar
      const by = SILL + th * (0.45 + 0.2 * rnd())
      f.box(u + 0.025, by - 0.02, z + 0.0016, tw - 0.05, 0.24, 0.0005, C.black, GLASS)
      fx.room.blinkers.push(fxBox(f, u + 0.035, by - 0.01, z + 0.0022, tw - 0.07, 0.2, 0.0005, N.magenta, { rate: 0.25, duty: 0.5, phase: 0 }))
      fx.room.blinkers.push(fxBox(f, u + 0.035, by - 0.01, z + 0.0028, tw - 0.07, 0.2, 0.0005, N.cyan, { rate: 0.25, duty: 0.5, phase: 0.5 }))
    }
  }
  // uçan araçlar: duvar gövdesinin içinden çıkıp öbür uçta yine gövdeye girer
  for (const [ly, dir, count] of [[SILL + H * 0.5, 1, 3], [SILL + H * 0.66, -1, 2]]) {
    for (let i = 0; i < count; i++) {
      const travel = w + 0.6
      const x0 = dir > 0 ? a - 0.46 : b + 0.3
      const motion = { axis: axisOf(f, dir, 0, 0), travel, period: travel / (0.45 + 0.15 * rnd()), phase: i / count + 0.1 * rnd() }
      fx.view.movers.push({
        ...motion,
        items: [fxBox(f, x0, ly, v - 0.005, 0.16, 0.035, 0.001, C.car), fxBox(f, x0 + 0.04, ly + 0.035, v - 0.005, 0.08, 0.02, 0.001, C.car)],
      })
      const tail = dir > 0 ? x0 : x0 + 0.135
      const head = dir > 0 ? x0 + 0.14 : x0
      fx.room.movers.push({
        ...motion,
        items: [fxBox(f, tail, ly + 0.01, v - 0.0035, 0.025, 0.014, 0.001, N.red), fxBox(f, head, ly + 0.012, v - 0.0035, 0.02, 0.012, 0.001, N.white)],
      })
    }
  }
}

// ---------------------------------------------------------------- arka duvar

// Zırhlı kayar kapı; orijin kapının ortası. İki kanat, ortada neon derz, altta ikaz şeridi;
// kasada LED'ler, sağda tarayıcılı tuş takımı, üstte durum lambası, eşikte ışık çizgisi.
export function blastDoor(f, fx) {
  const W = 1.2
  const H = 2.3
  f.box(-W / 2 - 0.14, 0, -0.02, 0.14, H + 0.16, 0.1, C.trim)
  f.box(W / 2, 0, -0.02, 0.14, H + 0.16, 0.1, C.trim)
  f.box(-W / 2, H, -0.02, W, 0.16, 0.1, C.trim)
  f.box(-W / 2 - 0.03, 0.12, 0.08, 0.02, H - 0.12, 0.006, N.cyan, BULB)
  f.box(W / 2 + 0.01, 0.12, 0.08, 0.02, H - 0.12, 0.006, N.cyan, BULB)
  f.box(-W / 2 - 0.03, H + 0.06, 0.08, W + 0.06, 0.02, 0.006, N.cyan, BULB)
  for (const x of [-W / 2, 0.004]) {
    f.box(x, 0, -0.02, W / 2 - 0.004, H, 0.06, C.door)
    for (const y of [0.62, 1.42, 2.02]) f.box(x + 0.04, y, 0.04, W / 2 - 0.084, 0.03, 0.004, C.doorDark)
  }
  f.box(-0.006, 0.26, 0.04, 0.012, H - 0.36, 0.006, N.cyan, BULB)
  f.box(-W / 2, 0.06, 0.04, W, 0.16, 0.004, C.black)
  for (let i = 0; i < 9; i++) f.box(-W / 2 + 0.06 + i * 0.13, 0.08, 0.044, 0.045, 0.12, 0.003, C.hazard, { rot: [0, 0, 0.55] })
  // tuş takımı ve tarayıcı
  const kx = W / 2 + 0.04
  f.box(kx, 1.1, 0.08, 0.09, 0.24, 0.02, C.black)
  f.box(kx + 0.01, 1.24, 0.1, 0.07, 0.08, 0.003, C.screenLine, BULB)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) f.box(kx + 0.012 + c * 0.024, 1.13 + r * 0.045, 0.1, 0.018, 0.03, 0.004, C.seam, BULB)
  }
  fx.room.movers.push({ items: [fxBox(f, kx + 0.01, 1.243, 0.104, 0.07, 0.006, 0.002, N.cyan)], axis: [0, 1, 0], travel: 0.068, period: 1.4, phase: 0, fade: 0.15 })
  fx.room.blinkers.push(fxBox(f, -0.05, H + 0.24, 0, 0.1, 0.04, 0.014, N.green, { rate: 0.4, duty: 0.75, phase: 0 }))
  f.box(-W / 2, 0, 0.08, W, 0.006, 0.04, N.cyan, BULB)
  f.glow(-0.7, 0.008, 0.1, 1.4, 0.9, N.cyan)
}

// Sunucu kabinleri; orijin ikisinin ortası. Her kabinde sekiz bıçak sunucu ve yanıp sönen
// durum LED'leri, kenarlarda eflatun şerit, tepeden tavana kablolar.
export function serverRacks(f, rnd, fx) {
  for (const x0 of [-0.62, 0.02]) {
    f.box(x0, 0, 0.02, 0.6, 2.0, 0.48, C.rack)
    f.box(x0 + 0.03, 0.08, 0.5, 0.54, 1.84, 0.01, C.black)
    f.box(x0, 0.1, 0.5, 0.022, 1.84, 0.012, N.magenta, BULB)
    for (let r = 0; r < 8; r++) {
      const y = 0.14 + r * 0.22
      f.box(x0 + 0.05, y, 0.51, 0.5, 0.17, 0.012, C.blade)
      f.box(x0 + 0.22, y + 0.06, 0.522, 0.25, 0.05, 0.003, C.black)
      for (let k = 0; k < 3; k++) {
        const color = pick(rnd, [N.green, N.cyan, N.amber, N.green])
        fx.room.blinkers.push(fxBox(f, x0 + 0.08 + k * 0.035, y + 0.07, 0.522, 0.018, 0.018, 0.004, color, { rate: 0.3 + rnd() * 1.4, duty: 0.3 + rnd() * 0.6, phase: rnd() }))
      }
    }
    f.box(x0, 2.0, 0.02, 0.6, 0.03, 0.48, C.trim)
    f.box(x0 + 0.05, 2.03, 0.1, 0.5, 0.005, 0.3, N.violet, BULB)
  }
  ;[[-0.45, N.cyan], [-0.1, C.metal], [0.3, N.magenta]].forEach(([x, color], i) => {
    stick(f, [x, 2.03, 0.25 - i * 0.05], [x + 0.08, CROWN, 0.04], 0.035, color, color === C.metal ? {} : BULB)
  })
}

// Veri duvarı; orijin ekranın ortası (duvarda). Çerçeveli dev ekranda sol yanda zıplayan
// çubuk grafik, ortada dönen radar taraması ve bip noktaları, sağda kayan kayıt satırları; altında
// ayakta kullanılan holo klavyeli konsol.
export function dataWall(f, rnd, fx) {
  const W = 2.2
  const y0 = 1.05
  const H = 1.25
  f.box(-W / 2 - 0.04, y0 - 0.04, -0.02, W + 0.08, H + 0.08, 0.06, C.trim)
  f.box(-W / 2, y0, 0.04, W, H, 0.004, C.screen, BULB)
  f.box(-W / 2 + 0.06, y0 + H - 0.1, 0.044, W - 0.12, 0.025, 0.002, N.cyan, BULB)
  f.box(-W / 2 + 0.06, y0 + H - 0.06, 0.044, 0.3, 0.02, 0.002, N.magenta, BULB)

  // çubuk grafik
  for (let i = 0; i < 9; i++) {
    fx.room.bars.push({
      items: [fxBox(f, -W / 2 + 0.08 + i * 0.075, y0 + 0.1, 0.046, 0.05, 0.6, 0.003, i % 3 === 2 ? N.magenta : N.cyan)],
      period: 0.9 + rnd() * 0.9,
      phase: rnd(),
    })
  }
  f.box(-W / 2 + 0.06, y0 + 0.08, 0.044, 0.7, 0.01, 0.002, C.seam, BULB)

  // radar
  const cx = 0.02
  const cy = y0 + 0.56
  disk(f, cx, cy, 0.044, 0.38, 0.038, 0.001, C.radar[0], BULB)
  disk(f, cx, cy, 0.045, 0.365, 0.0365, 0.001, C.radar[1], BULB)
  disk(f, cx, cy, 0.046, 0.25, 0.025, 0.001, C.radar[0], BULB)
  disk(f, cx, cy, 0.047, 0.235, 0.0235, 0.001, C.radar[1], BULB)
  f.box(cx - 0.36, cy - 0.003, 0.048, 0.72, 0.006, 0.001, C.radar[0], BULB)
  f.box(cx - 0.003, cy - 0.36, 0.0485, 0.006, 0.72, 0.001, C.radar[0], BULB)
  const sweep = []
  ;[[0, N.green], [-0.18, '#2fb06a'], [-0.36, '#1f7a4a']].forEach(([roll, color]) => {
    sweep.push(fxBox(f.frame(cx, cy, 0.05, 0, 0, roll), 0, -0.005, 0, 0.35, 0.01, 0.002, color))
  })
  fx.room.spinners.push({ items: sweep, pivot: f.point(cx, cy, 0.05), axis: axisOf(f, 0, 0, -1), period: 3.2, phase: 0 })
  for (let i = 0; i < 4; i++) {
    const a = rnd() * TAU
    const r = 0.08 + rnd() * 0.26
    fx.room.blinkers.push(fxBox(f, cx + Math.cos(a) * r - 0.012, cy + Math.sin(a) * r - 0.012, 0.052, 0.024, 0.024, 0.002, N.green, { rate: 0.31, duty: 0.4, phase: rnd() }))
  }

  // kayan kayıt satırları
  for (let i = 0; i < 7; i++) {
    fx.room.movers.push({
      items: [fxBox(f, 0.48, y0 + 0.1, 0.046, 0.15 + rnd() * 0.4, 0.022, 0.002, pick(rnd, [N.cyan, N.white, N.cyan, N.magenta]))],
      axis: [0, 1, 0],
      travel: H - 0.3,
      period: 7,
      phase: i / 7,
      fade: 0.12,
    })
  }

  // konsol
  for (const x of [-0.5, 0.44]) f.box(x, 0, 0.12, 0.06, 0.86, 0.06, C.metal)
  f.box(-0.6, 0.86, 0.06, 1.2, 0.05, 0.42, C.shell)
  f.box(-0.5, 0.91, 0.14, 1.0, 0.003, 0.24, C.screenLine, BULB)
  for (let r = 0; r < 3; r++) f.box(-0.47, 0.913, 0.17 + r * 0.07, 0.94, 0.002, 0.008, C.seam, BULB)
  f.box(-0.6, 0.875, 0.48, 1.2, 0.015, 0.006, N.cyan, BULB)
  f.glow(-0.6, 0.915, 0.06, 1.2, 0.42, N.cyan)
}

// Veri akışı sütunu; orijin duvarda sütunun ortası. Kenarları neon koyu şerit, içinde yukarı akan
// camgöbeği pikseller. Arka duvardaki geniş boşlukları doldurur.
export function dataStream(f, rnd, fx) {
  f.box(-0.08, 0.3, 0, 0.16, 2.3, 0.03, C.black)
  f.box(-0.08, 0.3, 0.03, 0.012, 2.3, 0.004, N.magenta, BULB)
  f.box(0.068, 0.3, 0.03, 0.012, 2.3, 0.004, N.cyan, BULB)
  f.box(-0.035, 0.36, 0.03, 0.07, 2.18, 0.002, C.screen, BULB)
  for (let i = 0; i < 6; i++) {
    const x = i % 2 ? -0.025 : 0.0
    fx.room.movers.push({
      items: [fxBox(f, x, 0.38, 0.032, 0.025, 0.04, 0.002, i % 3 === 2 ? N.white : N.cyan)],
      axis: [0, 1, 0],
      travel: 2.08,
      period: 3 + rnd(),
      phase: i / 6 + 0.05 * rnd(),
      fade: 0.08,
    })
  }
}

// Drone yuvası; orijin duvarda yuvanın ortası. Şarj plakası ve halka; önünde süzülen drone
// (gövde ışık alır, gözü ve alt ışığı parlar; hepsi birlikte yavaşça iner kalkar).
export function droneDock(f, fx) {
  f.box(-0.25, 1.0, 0, 0.5, 0.5, 0.03, C.trim)
  disk(f, 0, 1.25, 0.03, 0.18, 0.03, 0.004, N.cyan, BULB)
  disk(f, 0, 1.25, 0.034, 0.15, 0.03, 0.003, C.black)
  f.box(-0.03, 1.22, 0.037, 0.06, 0.06, 0.18, C.metal)
  const motion = { axis: [0, 1, 0], travel: 0, period: 1, phase: 0, sway: [0.03, 0.05, 0.02], swayPeriod: 2.8 }
  const y = 1.3
  const z = 0.5
  const lit = [
    fxBox(f, -0.11, y, z - 0.11, 0.22, 0.05, 0.22, C.shell),
    fxBox(f, -0.06, y + 0.05, z - 0.06, 0.12, 0.03, 0.12, C.metalLight),
    fxBox(f, -0.2, y + 0.015, z - 0.015, 0.4, 0.02, 0.03, C.metal, { rot: [0, Math.PI / 4, 0] }),
    fxBox(f, -0.2, y + 0.015, z - 0.015, 0.4, 0.02, 0.03, C.metal, { rot: [0, -Math.PI / 4, 0] }),
  ]
  for (const [dx, dz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) {
    lit.push(fxBox(f, dx - 0.065, y + 0.035, z + dz - 0.065, 0.13, 0.008, 0.13, C.metal))
  }
  fx.lit.movers.push({ ...motion, items: lit })
  fx.room.movers.push({
    ...motion,
    items: [fxBox(f, -0.025, y + 0.012, z + 0.11, 0.05, 0.025, 0.006, N.red), fxBox(f, -0.07, y - 0.006, z - 0.07, 0.14, 0.006, 0.14, N.cyan)],
  })
}

// "ODAK" neon tabelası; orijin tabelanın alt ortası (duvarda). 4x5 piksel harfler, A arada titrer.
function neonSign(f, fx) {
  const GLYPHS = {
    O: ['.XX.', 'X..X', 'X..X', 'X..X', '.XX.'],
    D: ['XXX.', 'X..X', 'X..X', 'X..X', 'XXX.'],
    A: ['.XX.', 'X..X', 'XXXX', 'X..X', 'X..X'],
    K: ['X..X', 'X.X.', 'XX..', 'X.X.', 'X..X'],
  }
  const s = 0.05
  const word = 'ODAK'
  const width = word.length * 4 * s + (word.length - 1) * s
  f.box(-width / 2 - 0.06, 0, -0.02, width + 0.12, 5 * s + 0.1, 0.05, C.black)
  ;[...word].forEach((ch, li) => {
    const x0 = -width / 2 + li * 5 * s
    GLYPHS[ch].forEach((line, r) => {
      ;[...line].forEach((cell, c) => {
        if (cell !== 'X') return
        const flicker = ch === 'A' ? { rate: 0.21, duty: 0.88, phase: 0.3 } : { rate: 0.1, duty: 1, phase: 0 }
        fx.room.blinkers.push(fxBox(f, x0 + c * s + 0.005, 0.05 + (4 - r) * s + 0.005, 0.03, s - 0.01, s - 0.01, 0.015, N.magenta, flicker))
      })
    })
  })
}

// Ramen otomatı; orijin duvarda otomatın ortası. Işıklı vitrinde dört raf ürün, yanda ödeme ekranı, köşelerde
// eflatun neon, alt teslim gözünde buharı tüten erişte kabı, tepede "ODAK" neon tabelası.
// Önüne kehribar nokta ışık düşer.
export function vendingMachine(f, rnd, fx, room) {
  const W = 0.9
  const H = 2.05
  const D = 0.6
  f.box(-W / 2, 0, 0, W, H, D, C.vending)
  f.box(-0.39, 0.75, D, 0.58, 1.05, 0.004, C.display, BULB)
  for (let r = 0; r < 4; r++) {
    const y = 0.8 + r * 0.25
    f.box(-0.39, y, D + 0.004, 0.58, 0.015, 0.06, C.metalLight)
    for (let i = 0; i < 4; i++) f.box(-0.37 + i * 0.14, y + 0.015, D + 0.008, 0.1, 0.14 + rnd() * 0.05, 0.05, pick(rnd, C.product))
  }
  f.box(-W / 2 + 0.03, H - 0.2, D, W - 0.06, 0.15, 0.004, N.cyan, BULB)
  for (let i = 0; i < 5; i++) f.box(-0.3 + i * 0.13, H - 0.16, D + 0.004, 0.08, 0.07, 0.002, C.black)
  for (const x of [-W / 2, W / 2 - 0.03]) f.box(x, 0.05, D, 0.03, H - 0.1, 0.008, N.magenta, BULB)
  f.box(0.24, 1.3, D, 0.16, 0.2, 0.004, C.screenLine, BULB)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) f.box(0.25 + c * 0.05, 1.08 + r * 0.06, D, 0.035, 0.04, 0.008, C.metalLight)
  }
  f.box(-0.39, 0.22, D, 0.58, 0.22, 0.004, C.black)
  f.box(-0.39, 0.2, D, 0.58, 0.02, 0.12, C.metalLight)
  f.box(-0.15, 0.22, D + 0.02, 0.1, 0.1, 0.08, C.mug)
  f.box(-0.15, 0.27, D + 0.1, 0.1, 0.03, 0.002, N.red)
  fx.steams.push(f.point(-0.1, 0.33, D + 0.06).toArray())
  neonSign(f.frame(0, H + 0.14, 0), fx)
  room.lights.push({ position: f.point(0, 1.3, D + 0.35).toArray(), color: LIGHT.amber })
  f.glow(-0.6, 0.008, D, 1.2, 0.8, N.amber)
}

// ---------------------------------------------------------------- çalışma alanı

// Masa üstü; orijin oturanın önündeki masa kenarı, +z masanın içine. Işıklı ekranlı holo tablet,
// kalem ve sırayla sentetik kahve (buharı tüter), enerji içeceği ya da baloncuklu çay.
function studyItems(t, i, fx) {
  t.box(-0.17, 0, 0.06, 0.32, 0.012, 0.22, C.black)
  t.box(-0.155, 0.012, 0.075, 0.29, 0.002, 0.19, C.screenLine, BULB)
  for (let k = 0; k < 3; k++) t.box(-0.135, 0.0145, 0.1 + k * 0.045, 0.12 + (k % 2) * 0.08, 0.001, 0.008, k === 0 ? N.magenta : N.cyan, BULB)
  t.box(0.17, 0.012, 0.09, 0.008, 0.008, 0.15, C.chrome)
  const kind = i % 3
  if (kind === 0) {
    t.box(0.2, 0, 0.11, 0.08, 0.09, 0.08, C.mug)
    t.box(0.198, 0.05, 0.108, 0.084, 0.012, 0.084, N.cyan, BULB)
    t.box(0.21, 0.09, 0.12, 0.06, 0.003, 0.06, C.coffee)
    fx.steams.push(t.point(0.24, 0.1, 0.15).toArray())
  } else if (kind === 1) {
    t.box(0.21, 0, 0.12, 0.06, 0.13, 0.06, C.can)
    t.box(0.208, 0.04, 0.118, 0.064, 0.04, 0.064, N.magenta, BULB)
    t.box(0.225, 0.13, 0.135, 0.03, 0.006, 0.03, C.metalLight)
  } else {
    t.box(0.205, 0, 0.115, 0.075, 0.14, 0.075, C.milkTea)
    for (const [x, z] of [[0.215, 0.12], [0.25, 0.135], [0.23, 0.165]]) t.box(x, 0.004, z - 0.006, 0.022, 0.022, 0.008, C.boba)
    t.box(0.2, 0.14, 0.11, 0.085, 0.01, 0.085, C.shell)
    t.box(0.238, 0.15, 0.148, 0.01, 0.1, 0.01, N.magenta)
  }
}

// Kapsül sandalye; oturan +z yönüne bakar. Tek ayak, beyaz kabuk, eflatun minder, başlıkta LED.
export function podChair(f) {
  diskXZ(f, 0, 0.24, 0.08, 0.03, C.metal)
  f.box(-0.03, 0.03, -0.03, 0.06, 0.34, 0.06, C.chrome)
  f.box(-0.25, 0.37, -0.24, 0.5, 0.07, 0.48, C.shell)
  f.box(-0.22, 0.44, -0.2, 0.44, 0.04, 0.4, C.cushion)
  f.box(-0.2, 0.44, -0.3, 0.4, 0.55, 0.07, C.shell)
  for (const x of [-0.24, 0.2]) f.box(x, 0.44, -0.3, 0.04, 0.38, 0.18, C.shell)
  f.box(-0.17, 0.5, -0.235, 0.34, 0.4, 0.02, C.cushion)
  f.box(-0.12, 0.93, -0.23, 0.24, 0.015, 0.006, N.cyan, BULB)
}

// Pencere kapsül masası; orijin duvar dibinde masanın ortası, yerel +z odanın içi. Tek ayaklı
// beyaz tabla, önünde neon kenar, havada süzülen holo ekran (satırlar yukarı kayar), önünde
// pencereye bakan kapsül sandalye. light: eflatun nokta ışık ekle.
export function podDesk(f, room, fx, light) {
  const front = 0.05 + DESK_DEPTH
  f.box(-0.25, 0, 0.14, 0.5, 0.03, 0.4, C.black)
  f.box(-0.08, 0.03, 0.26, 0.16, TABLE_HEIGHT - 0.07, 0.16, C.metal)
  f.box(-0.55, TABLE_HEIGHT - 0.04, 0.05, 1.1, 0.04, DESK_DEPTH, C.shell)
  f.box(-0.55, TABLE_HEIGHT - 0.03, front, 1.1, 0.015, 0.006, N.cyan, BULB)
  // holo ekran
  f.box(-0.3, TABLE_HEIGHT, 0.12, 0.6, 0.025, 0.05, C.metal)
  f.box(-0.28, TABLE_HEIGHT + 0.025, 0.135, 0.56, 0.003, 0.02, N.cyan, BULB)
  f.box(-0.32, 0.86, 0.15, 0.64, 0.4, 0.006, C.screen, BULB)
  f.box(-0.32, 1.24, 0.156, 0.64, 0.012, 0.002, N.cyan, BULB)
  for (let i = 0; i < 4; i++) {
    fx.room.movers.push({
      items: [fxBox(f, -0.27, 0.9, 0.157, 0.14 + ((i * 7) % 4) * 0.07, 0.016, 0.002, i % 2 ? N.cyan : N.white)],
      axis: [0, 1, 0],
      travel: 0.3,
      period: 4,
      phase: i / 4,
      fade: 0.15,
    })
  }
  f.glow(-0.55, TABLE_HEIGHT + 0.003, 0.05, 1.1, DESK_DEPTH, N.cyan)
  if (light) room.lights.push({ position: f.point(0, 1.55, 0.55).toArray(), color: LIGHT.magenta })

  const seat = f.frame(0, 0, DESK_CHAIR, Math.PI)
  podChair(seat)
  room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing() })
  studyItems(seat.frame(0, TABLE_HEIGHT, DESK_CHAIR - front), room.seats.length - 1, fx)
}

// Hologram masası; orijin ortası. Neon şeritli tek ayak, altı parlayan yuvarlak koyu tabla,
// ortada projektör ve yavaşça dönen tel kafes küre, yukarı tırmanan tarama halkası; zemine eflatun
// ışık vurur. İki yanda (±x) kapsül sandalye. light: camgöbeği nokta ışık ekle.
export function holoTable(f, room, fx, light) {
  diskXZ(f, 0, 0.32, 0.08, 0.04, C.metal)
  f.box(-0.09, 0.04, -0.09, 0.18, TABLE_HEIGHT - 0.1, 0.18, C.black)
  for (const [x, z, w, d] of [[-0.02, 0.09, 0.04, 0.006], [0.09, -0.02, 0.006, 0.04]]) f.box(x, 0.1, z, w, TABLE_HEIGHT - 0.22, d, N.cyan, BULB)
  diskXZ(f, TABLE_HEIGHT - 0.06, 0.52, 0.104, 0.02, N.cyan, BULB)
  diskXZ(f, TABLE_HEIGHT - 0.04, 0.5, 0.1, 0.04, C.tableTop)
  diskXZ(f, TABLE_HEIGHT, 0.09, 0.045, 0.02, C.metal)
  f.box(-0.04, TABLE_HEIGHT + 0.02, -0.04, 0.08, 0.004, 0.08, N.cyan, BULB)

  // tel kafes küre: ekvator ve iki meridyen, içinde eflatun çekirdek
  const cy = 1.12
  const r = 0.17
  const seg = 2 * r * Math.tan(Math.PI / 12) + 0.004
  const globe = [fxBox(f, -0.045, cy - 0.045, -0.045, 0.09, 0.09, 0.09, N.magenta, { rot: [0.6, 0, 0.6] })]
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU
    globe.push(fxBox(f.frame(0, cy, 0, a), -seg / 2, -0.005, r - 0.005, seg, 0.01, 0.01, N.cyan))
    for (const yaw of [0, Math.PI / 2]) globe.push(fxBox(f.frame(0, cy, 0, yaw, 0, a), -seg / 2, r - 0.005, -0.005, seg, 0.01, 0.01, N.cyan))
  }
  fx.room.spinners.push({ items: globe, pivot: f.point(0, cy, 0), axis: axisOf(f, 0, 1, 0), period: 8, phase: 0 })
  const scan = []
  ring(f, TABLE_HEIGHT + 0.05, 0.22, 12, 0.008, (s, x, y, z, w, h, d) => scan.push(fxBox(s, x, y, z, w, h, d, N.cyan)))
  fx.room.movers.push({ items: scan, axis: [0, 1, 0], travel: 0.6, period: 2.6, phase: 0, fade: 0.25 })

  f.glow(-0.5, TABLE_HEIGHT + 0.003, -0.5, 1.0, 1.0, N.cyan)
  f.glow(-0.95, 0.008, -0.95, 1.9, 1.9, N.magenta)
  if (light) room.lights.push({ position: f.point(0, 1.9, 0).toArray(), color: LIGHT.cyan })

  for (const s of [-1, 1]) {
    const seat = f.frame(s * 0.75, 0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2)
    podChair(seat)
    room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing() })
    studyItems(seat.frame(0, TABLE_HEIGHT, 0.25), room.seats.length - 1, fx)
  }
}

// Alçak yumurta koltuk; oturan +z yönüne bakar.
function loungeChair(f) {
  f.box(-0.32, 0, -0.3, 0.64, 0.25, 0.6, C.shell)
  f.box(-0.3, 0.004, 0.3, 0.6, 0.012, 0.006, N.cyan, BULB)
  f.box(-0.28, 0.25, -0.26, 0.56, 0.12, 0.52, C.cushionCyan)
  f.box(-0.34, 0, -0.44, 0.68, 0.88, 0.14, C.shell)
  for (const x of [-0.34, 0.26]) f.box(x, 0.25, -0.3, 0.08, 0.32, 0.48, C.shell)
  f.box(-0.26, 0.37, -0.31, 0.52, 0.46, 0.02, C.cushionCyan)
}

// Lounge; orijin ortası. Neon kenarlı halı, ışıklı alçak masa, iki yanda (±z) karşılıklı
// yumurta koltuk.
export function lounge(f, room, fx) {
  f.box(-1.0, 0, -1.3, 2.0, 0.01, 2.6, C.rug)
  for (const z of [-1.3, 1.27]) f.box(-1.0, 0.01, z, 2.0, 0.003, 0.03, N.violet, BULB)
  for (const x of [-1.0, 0.97]) f.box(x, 0.01, -1.3, 0.03, 0.003, 2.6, N.violet, BULB)
  f.box(-0.32, 0.01, -0.26, 0.64, LOW_TABLE - 0.05, 0.52, C.black)
  f.box(-0.32, 0.2, 0.26, 0.64, 0.012, 0.004, N.violet, BULB)
  f.box(-0.4, LOW_TABLE - 0.04, -0.3, 0.8, 0.04, 0.6, C.shell)
  f.glow(-0.4, LOW_TABLE + 0.003, -0.3, 0.8, 0.6, N.violet)
  for (const s of [-1, 1]) {
    const seat = f.frame(0, 0.01, s * 0.8, s > 0 ? Math.PI : 0)
    loungeChair(seat)
    room.seats.push({ position: seat.point(0, LOUNGE_SEAT, 0).toArray(), yaw: seat.facing() })
    studyItems(seat.frame(0, LOW_TABLE - 0.01, 0.5), room.seats.length - 1, fx)
  }
}

// ---------------------------------------------------------------- zemin eşyaları

// VR istasyonu; orijin platformun ortası, dünya eksenine hizalı. Neon halkalı platform, sağdaki
// direkten sarkan gözlük, platformdan yukarı tırmanan iki tarama halkası.
export function vrStation(f, fx) {
  diskXZ(f, 0, 0.55, 0.11, 0.06, C.metal)
  diskXZ(f, 0.06, 0.4, 0.1, 0.004, C.tableTop)
  ring(f, 0.06, 0.48, 20, 0.03, (s, x, y, z, w, h, d) => s.box(x, y, z, w, 0.006, d, N.cyan, BULB))
  f.box(0.5, 0, -0.04, 0.08, 2.2, 0.08, C.metal)
  f.box(0.505, 0.3, 0.04, 0.07, 1.6, 0.006, N.magenta, BULB)
  f.box(0.08, 2.15, -0.03, 0.42, 0.06, 0.06, C.metal)
  stick(f, [0.12, 2.15, 0], [0.12, 1.72, 0], 0.012, C.black)
  f.box(0.04, 1.62, -0.09, 0.16, 0.1, 0.18, C.shell)
  f.box(0.035, 1.635, -0.075, 0.005, 0.06, 0.15, N.magenta, BULB)
  for (const z of [-0.1, 0.06]) {
    f.box(0.46, 1.1, z, 0.04, 0.12, 0.04, C.shell)
    f.box(0.455, 1.2, z - 0.005, 0.05, 0.015, 0.05, N.cyan, BULB)
  }
  for (const phase of [0, 0.5]) {
    const items = []
    ring(f, 0.08, 0.46, 16, 0.012, (s, x, y, z, w, h, d) => items.push(fxBox(s, x, y, z, w, h, d, N.cyan)))
    fx.room.movers.push({ items, axis: [0, 1, 0], travel: 1.9, period: 3.6, phase, fade: 0.2 })
  }
  f.glow(-0.7, 0.07, -0.7, 1.4, 1.4, N.cyan)
}

// Bonsai teraryumu; orijin ortası. Koyu kaide, köşe dikmeleri, mor UV ışıklı kapak, içinde yosun
// ve bonsai.
export function terrarium(f) {
  f.box(-0.22, 0, -0.22, 0.44, 0.7, 0.44, C.black)
  f.box(-0.22, 0.7, -0.22, 0.44, 0.02, 0.44, C.metal)
  for (const [x, z] of [[-0.22, -0.22], [0.2, -0.22], [-0.22, 0.2], [0.2, 0.2]]) f.box(x, 0.72, z, 0.02, 0.5, 0.02, C.chrome)
  f.box(-0.23, 1.22, -0.23, 0.46, 0.04, 0.46, C.metal)
  f.box(-0.18, 1.215, -0.18, 0.36, 0.005, 0.36, N.violet, BULB)
  f.box(-0.19, 0.72, -0.19, 0.38, 0.04, 0.38, C.moss)
  stick(f, [0.0, 0.76, 0.0], [0.06, 0.94, 0.02], 0.04, C.bark)
  stick(f, [0.06, 0.94, 0.02], [-0.06, 1.04, -0.02], 0.03, C.bark)
  for (const [x, y, z, s] of [[0.06, 0.96, 0.03, 0.14], [-0.07, 1.06, -0.02, 0.16], [0.02, 1.1, 0.05, 0.11]]) {
    f.box(x - s / 2, y, z - s / 2, s, s * 0.55, s, C.plant[Math.round(s * 100) % 3])
  }
  f.glow(-0.2, 0.765, -0.2, 0.4, 0.4, N.violet)
}
