import { Euler, Quaternion } from 'three'
import { pick } from '../core/voxel'

// Bar temasının voxel parçaları. Birim ≈ 1 metre.
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür. Duvar parçalarında orijin duvar yüzeyinin dibi, +z odanın içi.
// fx: hareket eden kutular ({ view, room, lit, steams }); bunlar katmanlara değil BarEffect'e gider.
// view grubu (yağmur, camdaki damlalar) camın gün zamanı rengini alır, room grubu (neon, müzik
// kutusu ışıkları, mum alevi) kendi renginde parlar, lit grubu (vantilatör kanatları) ışık alır.

export const WALL = 0.25
export const FLOOR_BOTTOM = -0.3
export const WALL_HEIGHT = 3.0
// Tezgâh arka kenarının arka duvara uzaklığı: arada arka bar dolabı ve barmen koridoru.
export const COUNTER_Z = 1.3
const STOOL_HEIGHT = 0.74
const SEAT_HEIGHT = 0.48
const TABLE_HEIGHT = 0.76
const COUNTER_HEIGHT = 1.06
const COUNTER_DEPTH = 0.62
// Taburenin tezgâh arka kenarına uzaklığı (tezgâh üstü 0.85'te biter, dizler altına girer).
const STOOL_Z = 1.0
const BACKBAR_DEPTH = 0.5
const WAINSCOT = 1.0
const CROWN = 2.86
const SILL = 1.05
const WINDOW_TOP = 2.45
const WINDOW_WIDTH = 1.0
const VIEW_DEPTH = -0.18
const GLASS_PLANE = -0.06
const GLASS = { layer: 'glass' }
const BULB = { layer: 'bulb' }
const NIGHT = { layer: 'night' }

export const C = {
  body: '#2a3a31',
  plankGap: '#3a2616',
  planks: ['#7a5232', '#6f4a2c', '#84593a', '#744e30'],
  paint: '#2f4a3e',
  wood: '#5a3a22',
  woodDark: '#3e2716',
  woodLight: '#8a5c36',
  woodRed: '#6b3a24',
  crown: '#2a1b10',
  brass: '#d4a245',
  brassDark: '#a87b2c',
  iron: '#2b2b2e',
  leather: '#7a2430',
  leatherLight: '#8f3340',
  counterTop: '#2b1a10',
  mirror: '#aebfc4',
  bottle: ['#2f7d4a', '#b8661f', '#cfe6e8', '#3a6fd1', '#a3242b', '#6b4a1f', '#e0c060'],
  label: ['#f2e8d0', '#e8d9b0', '#ffffff'],
  shelfLed: '#ffcf8a',
  neon: ['#ff4fa3', '#4ff0ff', '#ffb347', '#7dff8a'],
  neonDim: ['#7a2a52', '#2a6a72', '#7a5a2a', '#3a7a42'],
  felt: '#2f7a4a',
  ball: ['#f2c230', '#2f6fd6', '#d23b3b', '#7a3fb0', '#f07f2d', '#2f9a4a', '#7a2a1a'],
  black: '#1d1d1f',
  cream: '#efe4c8',
  red: '#b83232',
  green: '#2e8a4f',
  board: '#2d3a32',
  chalk: '#e9e6dc',
  paper: '#f4eedf',
  ink: '#3a4a6a',
  cover: ['#8e2b2b', '#2f5a45', '#2f3f6a'],
  drink: { coffee: '#4a2f22', lemon: '#f3e27a', cola: '#4a1f12' },
  white: '#f2efe8',
  sky: ['#b7c7d3', '#a3b6c6'],
  brick: ['#7c4a3a', '#86513f', '#73443a'],
  facadeTrim: '#5c3a2f',
  pane: '#2a3240',
  litPane: '#ffd27a',
  lamp: '#ffe2a8',
  street: '#3a3d44',
  rain: '#dbe7f0',
  rug: '#5a2a2a',
  plant: ['#4f8a3c', '#5e9a45', '#447a35'],
  pot: '#a65d3a',
  soil: '#3a2a1e',
  candle: '#f3ead6',
  flame: ['#ffb84a', '#fff2b0'],
  jukebox: '#8a2b2b',
  chrome: '#d8dde2',
  grille: '#2b2224',
  steel: '#b9c0c6',
  steelDark: '#7c858d',
  shade: '#24503a',
  frosted: '#e6dcc2',
  fridge: '#9fc3cf',
  exit: '#3fe07a',
}

// Efekt kutusu: katmana değil efekt listesine gider. Merkez ve dönüş dünyada saklanır.
function fxBox(f, x, y, z, w, h, d, color, { rot, ...extra } = {}) {
  const quat = f.worldRotation()
  if (rot) quat.multiply(new Quaternion().setFromEuler(new Euler(rot[0], rot[1], rot[2])))
  return { center: f.point(x + w / 2, y + h / 2, z + d / 2), quat, size: [w, h, d], color, ...extra }
}

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

// Ahşap döşeme: x boyunca 1.8 m'lik tahtalar, sıra sıra kaydırılmış; aralarda koyu derz.
export function floor(f, width, depth) {
  f.box(0, FLOOR_BOTTOM, 0, width, -0.03 - FLOOR_BOTTOM, depth, C.plankGap)
  const row = 0.3
  const board = 1.8
  for (let z = 0, r = 0; z < depth - 1e-3; z += row, r++) {
    const d = Math.min(row, depth - z)
    for (let x = -((r % 3) * board) / 3; x < width - 1e-3; x += board) {
      const x0 = Math.max(0, x)
      const x1 = Math.min(width, x + board)
      if (x1 - x0 < 0.05) continue
      f.box(x0 + 0.006, -0.03, z + 0.006, x1 - x0 - 0.012, 0.03, d - 0.012, C.planks[(r + Math.round(x / board)) & 3])
    }
  }
}

// Duvar kaplaması [u0, u1] aralığında ~1 m'lik modüller; rows: [y0, y1] satırları.
function panels(f, u0, u1, rows, color, depth = 0.02) {
  const n = Math.max(1, Math.round((u1 - u0) / 1.0))
  const w = (u1 - u0) / n
  for (let i = 0; i < n; i++) {
    for (const [y0, y1] of rows) f.box(u0 + i * w + 0.015, y0, -0.02, w - 0.03, y1 - y0, depth, color)
  }
}

// Duvarın ortak katmanları: zemin altı gövde, süpürgelik, lambri üstü bordür, tavan silmesi ve
// üst kapak. Orijin duvarın iç yüzü, u boyunca. Lambri ve boya panelleri ayrıca çizilir.
function wallShell(f, from, length) {
  f.box(from, FLOOR_BOTTOM, -WALL, length - from, -FLOOR_BOTTOM, WALL, C.body)
  f.box(0, 0, -0.02, length, 0.14, 0.05, C.woodDark)
  f.box(0, WAINSCOT - 0.02, -0.02, length, 0.06, 0.055, C.woodDark)
  f.box(0, CROWN, -0.02, length, WALL_HEIGHT - CROWN, 0.08, C.crown)
  f.box(from, WALL_HEIGHT, -WALL, length - from, 0.04, WALL, C.crown)
}

// Lambri (alt ahşap kaplama) [u0, u1] aralığında; panel aralıkları dikey çizgi gibi görünür.
function wainscot(f, u0, u1) {
  const n = Math.max(1, Math.round((u1 - u0) / 0.6))
  const w = (u1 - u0) / n
  for (let i = 0; i < n; i++) f.box(u0 + i * w + 0.01, 0.14, -0.02, w - 0.02, WAINSCOT - 0.16, 0.035, C.wood)
}

// Arka duvar: z = 0 boyunca, x = -WALL'dan width'e. Alt yarı lambri, üst yarı koyu yeşil boya.
export function backWall(f, width) {
  wallShell(f, -WALL, width)
  f.box(-WALL, 0, -WALL, width + WALL, WALL_HEIGHT, WALL - 0.02, C.body)
  wainscot(f, 0, width)
  panels(f, 0, width, [[WAINSCOT + 0.04, CROWN]], C.paint)
}

// Sol duvar: verilen merkezlerde (u, 0 = ön kenar) sürgülü pencereler; arkada yağmurlu sokak.
// Her pencerenin pervazında küçük bir saksı.
export function windowWall(f, length, windows, rnd, fx) {
  const half = WINDOW_WIDTH / 2
  const spans = windows.map((u) => [u - half, u + half]).sort((p, q) => p[0] - q[0])
  const t = WALL - 0.02
  wallShell(f, 0, length)
  let body = 0
  let paint = 0
  for (const [a, b] of spans) {
    f.box(body, 0, -WALL, a - body, WALL_HEIGHT, t, C.body)
    f.box(a, 0, -WALL, b - a, SILL, t, C.body)
    f.box(a, WINDOW_TOP, -WALL, b - a, WALL_HEIGHT - WINDOW_TOP, t, C.body)
    if (a - 0.06 - paint > 0.1) panels(f, paint, a - 0.06, [[WAINSCOT + 0.04, CROWN]], C.paint)
    panels(f, a - 0.06, b + 0.06, [[WINDOW_TOP + 0.1, CROWN]], C.paint)
    body = b
    paint = b + 0.06
  }
  f.box(body, 0, -WALL, length - body, WALL_HEIGHT, t, C.body)
  if (length - paint > 0.1) panels(f, paint, length, [[WAINSCOT + 0.04, CROWN]], C.paint)
  wainscot(f, 0, length)
  spans.forEach(([a, b], i) => sashWindow(f, a, b, i, rnd, fx))
}

// Pencere kasası (pervaz, kayıtlar), arkasındaki sokak manzarası, yağmur ve camdaki damlalar.
function sashWindow(f, a, b, index, rnd, fx) {
  const H = WINDOW_TOP - SILL
  const mid = (a + b) / 2
  const transom = SILL + H * 0.62
  f.box(a - 0.08, SILL - 0.06, -0.07, b - a + 0.16, 0.08, 0.21, C.woodDark)
  f.box(a - 0.08, WINDOW_TOP, -0.07, b - a + 0.16, 0.1, 0.11, C.woodDark)
  for (const x of [a - 0.06, b - 0.05]) f.box(x, SILL, -0.07, 0.11, H, 0.11, C.woodDark)
  f.box(mid - 0.025, SILL, -0.07, 0.05, H, 0.1, C.woodDark)
  f.box(a + 0.05, transom, -0.07, b - a - 0.1, 0.05, 0.1, C.woodDark)

  // saksı
  f.box(mid - 0.06, SILL + 0.02, 0.01, 0.12, 0.11, 0.11, C.pot)
  f.box(mid - 0.05, SILL + 0.13, 0.02, 0.1, 0.005, 0.09, C.soil)
  f.box(mid - 0.08, SILL + 0.13, 0.03, 0.08, 0.12, 0.06, C.plant[0], { rot: [0, 0, 0.35] })
  f.box(mid, SILL + 0.13, 0.025, 0.08, 0.14, 0.06, C.plant[1], { rot: [0, 0, -0.3] })
  f.box(mid - 0.03, SILL + 0.14, 0.05, 0.06, 0.16, 0.05, C.plant[2])

  // Sokak: katmanlar önden arkaya 1 mm aralıklı (gök, cephe, pencereler ve kaldırım, gece yanan
  // pencereler, sokak lambası direği, lamba camı, gece lamba hâlesi). Aynı düzleme düşen farklı
  // renkli yüzler kamera dönünce titrer.
  const v = VIEW_DEPTH
  const w = b - a
  f.box(a, SILL, v - 0.012, w, H * 0.82, 0.002, C.sky[0], GLASS)
  f.box(a, SILL + H * 0.82, v - 0.012, w, H * 0.18, 0.002, C.sky[1], GLASS)
  const fh = H * 0.74
  f.box(a, SILL, v - 0.009, w, fh, 0.002, C.brick[index % C.brick.length], GLASS)
  f.box(a, SILL + fh - 0.05, v - 0.007, w, 0.05, 0.001, C.facadeTrim, GLASS)
  f.box(a, SILL, v - 0.007, w, 0.07, 0.001, C.street, GLASS)
  for (const pu of [a + w * 0.27, a + w * 0.73]) {
    for (const py of [SILL + fh - 0.36, SILL + fh - 0.72]) {
      f.box(pu - 0.08, py, v - 0.007, 0.16, 0.24, 0.001, C.pane, GLASS)
      if (rnd() < 0.6) f.box(pu - 0.07, py + 0.01, v - 0.006, 0.14, 0.22, 0.001, C.litPane, NIGHT)
    }
  }
  const pu = index % 2 === 0 ? a + w * 0.12 : b - w * 0.12
  f.box(pu - 0.012, SILL + 0.07, v - 0.005, 0.024, 0.88, 0.001, C.street, GLASS)
  f.box(pu - 0.05, SILL + 0.95, v - 0.005, 0.1, 0.04, 0.001, C.street, GLASS)
  f.box(pu - 0.035, SILL + 0.91, v - 0.004, 0.07, 0.04, 0.001, C.lamp, GLASS)
  f.box(pu - 0.07, SILL + 0.86, v - 0.003, 0.14, 0.1, 0.001, C.lamp, NIGHT)

  // Yağmur: üst kasanın içinden başlar, pervazın içinde kaybolur.
  for (let i = 0; i < 10; i++) {
    const ru = a + 0.03 + rnd() * (w - 0.06)
    const travel = H + 0.4
    fx.view.movers.push({
      items: [fxBox(f, ru, WINDOW_TOP + 0.06, v, 0.006, 0.12, 0.002, C.rain)],
      axis: [0, -1, 0],
      travel,
      period: travel / 1.6,
      phase: rnd(),
    })
  }
  // Camdaki damlalar: üst kanatta yavaşça süzülür, kayıta varmadan küçülerek kaybolur.
  for (const du of [0.13, 0.36, 0.64, 0.86]) {
    const y0 = WINDOW_TOP - 0.1 - rnd() * 0.12
    const travel = y0 - transom - 0.1
    fx.view.movers.push({
      items: [
        fxBox(f, a + du * w - 0.007, y0, GLASS_PLANE, 0.014, 0.018, 0.003, C.rain),
        fxBox(f, a + du * w - 0.003, y0 + 0.018, GLASS_PLANE, 0.006, 0.05, 0.002, C.rain),
      ],
      axis: [0, -1, 0],
      travel,
      period: travel / 0.05,
      phase: rnd(),
      fade: 0.2,
    })
  }
}

// ---------------------------------------------------------------- arka duvar

// Giriş kapısı; orijin kapının ortası. Panelli ahşap kanat, buzlu cam, pirinç kol ve tekmelik,
// üstte yeşil çıkış tabelası, önde paspas.
export function entryDoor(f) {
  const W = 0.95
  const H = 2.15
  const J = 0.1
  f.box(-W / 2 - J, 0, -0.02, J, H + J, 0.12, C.woodDark)
  f.box(W / 2, 0, -0.02, J, H + J, 0.12, C.woodDark)
  f.box(-W / 2, H, -0.02, W, J, 0.12, C.woodDark)
  f.box(-W / 2 + 0.005, 0.01, -0.02, W - 0.01, H - 0.01, 0.06, C.woodRed)
  for (const x of [-0.38, 0.06]) f.box(x, 0.2, 0.04, 0.32, 0.72, 0.012, C.wood)
  f.box(-0.36, 1.15, 0.04, 0.72, 0.82, 0.004, C.frosted, GLASS)
  f.box(-0.015, 1.15, 0.044, 0.03, 0.82, 0.01, C.woodDark)
  f.box(-0.36, 1.545, 0.044, 0.72, 0.03, 0.01, C.woodDark)
  f.box(0.32, 0.98, 0.04, 0.035, 0.13, 0.05, C.brass)
  f.box(-W / 2 + 0.03, 0.03, 0.04, W - 0.06, 0.12, 0.004, C.brass)
  f.box(-0.18, H + J + 0.08, -0.02, 0.36, 0.14, 0.06, C.iron)
  f.box(-0.15, H + J + 0.11, 0.04, 0.3, 0.08, 0.003, C.exit, BULB)
  f.box(-0.5, 0, 0.14, 1.0, 0.012, 0.55, C.rug)
}

// Dart köşesi; orijin panonun altı. Açık kapaklı dolapta halkalı dart tahtası ve saplanmış üç
// dart, kapakların içinde tebeşir skor tahtaları, zeminde pirinç atış çizgisi.
export function dartboard(f) {
  const cy = 1.73
  f.box(-0.42, cy - 0.43, -0.02, 0.84, 0.86, 0.08, C.woodDark)
  for (const s of [-1, 1]) {
    const x = s < 0 ? -0.84 : 0.42
    f.box(x, cy - 0.43, -0.02, 0.42, 0.86, 0.05, C.woodDark)
    f.box(x + 0.04, cy - 0.39, 0.03, 0.34, 0.78, 0.004, C.board)
    for (let i = 0; i < 4; i++) f.box(x + 0.08, cy + 0.25 - i * 0.14, 0.034, 0.12 + ((i * 7) % 3) * 0.04, 0.012, 0.002, C.chalk)
  }
  disk(f, 0, cy, 0.06, 0.25, 0.04, 0.03, C.black)
  disk(f, 0, cy, 0.09, 0.2, 0.04, 0.003, C.red)
  disk(f, 0, cy, 0.093, 0.185, 0.037, 0.003, C.cream)
  disk(f, 0, cy, 0.096, 0.125, 0.025, 0.003, C.green)
  disk(f, 0, cy, 0.099, 0.11, 0.022, 0.003, C.cream)
  for (let i = 0; i < 4; i++) f.box(-0.185, cy - 0.006, 0.102, 0.37, 0.012, 0.002, C.black, { rot: [0, 0, (i * Math.PI) / 4] })
  f.box(-0.035, cy - 0.035, 0.104, 0.07, 0.07, 0.003, C.green)
  f.box(-0.016, cy - 0.016, 0.107, 0.032, 0.032, 0.003, C.red)
  for (const [x, y] of [[0.06, 0.08], [-0.09, -0.03], [0.02, -0.12]]) {
    f.box(x - 0.005, cy + y - 0.005, 0.1, 0.01, 0.01, 0.1, C.steel)
    f.box(x - 0.02, cy + y - 0.003, 0.19, 0.04, 0.006, 0.03, C.brass)
    f.box(x - 0.003, cy + y - 0.02, 0.19, 0.006, 0.04, 0.03, C.brass)
  }
  f.box(-0.3, 0, 1.5, 0.6, 0.004, 0.04, C.brass)
}

// Müzik kutusu; orijin ortası. Basamaklı kemerli gövde, plak penceresi, seçim paneli, krom
// ızgara, üstte çerçeveli plak afişi. Kemer boyunca ışık tüpleri (sönük taban + fx'te yürüyen
// renkli ışık).
export function jukebox(f, fx) {
  const W = 0.8
  const D = 0.55
  f.box(-W / 2, 0, 0.02, W, 0.1, D - 0.02, C.woodDark)
  f.box(-W / 2, 0.1, 0.02, W, 1.05, D - 0.04, C.jukebox)
  f.box(-W / 2 + 0.05, 1.15, 0.02, W - 0.1, 0.12, D - 0.06, C.jukebox)
  f.box(-W / 2 + 0.14, 1.27, 0.02, W - 0.28, 0.1, D - 0.08, C.jukebox)
  f.box(-W / 2 + 0.26, 1.37, 0.02, W - 0.52, 0.07, D - 0.1, C.jukebox)
  const front = D - 0.02
  f.box(-0.24, 0.78, front, 0.48, 0.32, 0.004, C.pane, GLASS)
  disk(f, 0, 0.94, front + 0.004, 0.11, 0.022, 0.002, C.black, GLASS)
  f.box(-0.03, 0.91, front + 0.006, 0.06, 0.06, 0.002, C.red, BULB)
  f.box(-0.26, 0.62, front, 0.52, 0.12, 0.004, C.cream, BULB)
  for (let i = 0; i < 6; i++) f.box(-0.22 + i * 0.08, 0.66, front + 0.004, 0.04, 0.03, 0.012, C.chrome)
  f.box(-0.26, 0.18, front, 0.52, 0.38, 0.004, C.grille)
  for (let i = 0; i < 6; i++) f.box(-0.22 + i * 0.085, 0.2, front + 0.004, 0.015, 0.34, 0.006, C.chrome)

  // ışık tüpleri: sol kenar yukarı, kemer, sağ kenar aşağı
  const points = []
  for (let i = 0; i < 4; i++) points.push([-0.36, 0.3 + i * 0.25])
  for (let i = 1; i < 6; i++) {
    const a = Math.PI - (i * Math.PI) / 6
    points.push([Math.cos(a) * 0.3, 1.15 + Math.sin(a) * 0.29])
  }
  for (let i = 3; i >= 0; i--) points.push([0.36, 0.3 + i * 0.25])
  points.forEach(([x, y], k) => {
    const c = k % 3
    f.box(x - 0.03, y - 0.03, front, 0.06, 0.06, 0.004, C.neonDim[c], BULB)
    fx.room.blinkers.push(fxBox(f, x - 0.032, y - 0.032, front + 0.004, 0.064, 0.064, 0.003, C.neon[c], { rate: 0.7, duty: 0.4, phase: -k / points.length }))
  })

  // plak afişi
  f.box(-0.28, 1.68, -0.02, 0.56, 0.74, 0.05, C.woodDark)
  f.box(-0.24, 1.72, 0.03, 0.48, 0.66, 0.004, C.cream)
  disk(f, 0, 2.0, 0.034, 0.17, 0.034, 0.003, C.black)
  disk(f, 0, 2.0, 0.037, 0.06, 0.03, 0.003, C.red)
  f.box(-0.18, 1.77, 0.034, 0.36, 0.05, 0.003, C.red)
}

// Arka bar; orijin dolabın ortası. Alt dolapta ahşap ve camlı soğutucu kapakları, tezgâhında
// espresso makinesi ve ters dizili bardaklar; üstte ayna önünde ışıklı şişe rafları,
// en üstte "BAR" neon tabelası (A harfi arada titrer).
export function backBar(f, length, rnd, fx) {
  const L = length
  const D = BACKBAR_DEPTH
  f.box(-L / 2, 0, 0, L, 0.1, D - 0.04, C.woodDark)
  f.box(-L / 2, 0.1, 0, L, 0.82, D, C.wood)
  const doors = Math.max(2, Math.round(L / 0.6))
  const dw = L / doors
  for (let k = 0; k < doors; k++) {
    const x = -L / 2 + k * dw
    if (k % 3 === 1) {
      f.box(x + 0.04, 0.16, D, dw - 0.08, 0.68, 0.004, C.fridge, GLASS)
      for (const y of [0.22, 0.52]) {
        for (let i = 0; i < 4; i++) f.box(x + 0.08 + (i * (dw - 0.16)) / 4, y, D + 0.004, 0.05, 0.2, 0.002, C.bottle[(k + i) % C.bottle.length], BULB)
      }
    } else {
      f.box(x + 0.05, 0.18, D, dw - 0.1, 0.62, 0.012, C.woodLight)
    }
    f.box(x + dw - 0.08, 0.5, D + 0.012, 0.025, 0.1, 0.03, C.brass)
  }
  f.box(-L / 2 - 0.02, 0.92, 0, L + 0.04, 0.04, D + 0.03, C.counterTop)

  // espresso makinesi ve bardaklar
  const m = f.frame(-L / 2 + 0.32, 0.96, 0.08)
  m.box(-0.22, 0, 0, 0.44, 0.3, 0.3, C.steel)
  m.box(-0.22, 0.3, 0, 0.44, 0.03, 0.3, C.steelDark)
  for (const x of [-0.11, 0.11]) {
    m.box(x - 0.04, 0.17, 0.3, 0.08, 0.06, 0.06, C.brass)
    m.box(x - 0.03, 0, 0.3, 0.06, 0.07, 0.06, C.white)
  }
  m.box(0.17, 0.1, 0.3, 0.02, 0.15, 0.02, C.steelDark)
  const glasses = Math.floor((L - 0.85) / 0.1)
  for (let i = 0; i < glasses; i++) f.box(-L / 2 + 0.66 + i * 0.1, 0.96, 0.2, 0.07, 0.11, 0.07, C.fridge, GLASS)

  // ayna, raflar ve şişeler
  f.box(-L / 2 + 0.06, 1.2, 0, L - 0.12, 1.16, 0.01, C.mirror, GLASS)
  for (const x of [-L / 2, L / 2 - 0.06]) f.box(x, 1.14, 0, 0.06, 1.28, 0.04, C.woodDark)
  f.box(-L / 2, 1.14, 0, L, 0.06, 0.04, C.woodDark)
  f.box(-L / 2, 2.36, 0, L, 0.06, 0.04, C.woodDark)
  for (const y of [1.4, 1.73, 2.06]) {
    f.box(-L / 2 + 0.06, y - 0.03, 0.01, L - 0.12, 0.03, 0.19, C.woodDark)
    f.box(-L / 2 + 0.1, y - 0.034, 0.12, L - 0.2, 0.004, 0.03, C.shelfLed, BULB)
    const n = Math.floor((L - 0.2) / 0.11)
    for (let k = 0; k < n; k++) {
      const x = -L / 2 + 0.1 + k * 0.11 + 0.02
      const h = 0.14 + rnd() * 0.09
      const color = pick(rnd, C.bottle)
      f.box(x, y, 0.06, 0.065, h, 0.065, color)
      f.box(x + 0.02, y + h, 0.08, 0.025, 0.06, 0.025, color)
      if (k % 2 === 0) f.box(x + 0.008, y + h * 0.3, 0.125, 0.05, h * 0.35, 0.002, pick(rnd, C.label))
    }
  }
  f.glow(-L / 2, 0.963, 0, L, D)

  // neon tabela: 4x5 piksel harfler
  const GLYPHS = {
    B: ['XXX.', 'X..X', 'XXX.', 'X..X', 'XXX.'],
    A: ['.XX.', 'X..X', 'XXXX', 'X..X', 'X..X'],
    R: ['XXX.', 'X..X', 'XXX.', 'X.X.', 'X..X'],
  }
  const s = 0.058
  const word = 'BAR'
  const width = word.length * 4 * s + (word.length - 1) * s
  const y0 = 2.47
  f.box(-width / 2 - 0.08, y0 - 0.08, -0.02, width + 0.16, 5 * s + 0.15, 0.045, C.crown)
  ;[...word].forEach((ch, li) => {
    const x0 = -width / 2 + li * 5 * s
    GLYPHS[ch].forEach((line, r) => {
      ;[...line].forEach((cell, c) => {
        if (cell !== 'X') return
        const flicker = ch === 'A' ? { rate: 0.23, duty: 0.9, phase: 0.4 } : { rate: 0.1, duty: 1, phase: 0 }
        fx.room.blinkers.push(fxBox(f, x0 + c * s + 0.006, y0 + (4 - r) * s + 0.006, 0.035, s - 0.012, s - 0.012, 0.02, C.neon[0], flicker))
      })
    })
  })
  fx.room.blinkers.push(fxBox(f, -width / 2, y0 - 0.05, 0.035, width, 0.02, 0.02, C.neon[1], { rate: 0.1, duty: 1, phase: 0 }))
}

// ---------------------------------------------------------------- çalışma alanı

// Masa üstü; orijin oturanın önündeki masa kenarı, +z masanın içine. Açık defter, kalem ve
// sırayla kahve (buharı tüter), limonata ya da kola.
function studyItems(t, i, fx) {
  t.box(-0.17, 0, 0.06, 0.34, 0.01, 0.22, C.cover[i % C.cover.length])
  t.box(-0.16, 0.01, 0.07, 0.155, 0.006, 0.2, C.paper)
  t.box(0.005, 0.01, 0.07, 0.155, 0.006, 0.2, C.paper)
  for (let k = 0; k < 3; k++) t.box(-0.14, 0.016, 0.11 + k * 0.045, 0.11, 0.001, 0.006, C.ink)
  t.box(0.05, 0.016, 0.1, 0.01, 0.008, 0.14, C.brass)
  const kind = i % 3
  if (kind === 0) {
    t.box(0.19, 0, 0.1, 0.12, 0.008, 0.12, C.white)
    t.box(0.21, 0.008, 0.12, 0.08, 0.07, 0.08, C.white)
    t.box(0.22, 0.078, 0.13, 0.06, 0.003, 0.06, C.drink.coffee)
    t.box(0.29, 0.03, 0.15, 0.025, 0.035, 0.02, C.white)
    fx.steams.push(t.point(0.25, 0.09, 0.16).toArray())
  } else {
    const drink = kind === 1 ? C.drink.lemon : C.drink.cola
    t.box(0.22, 0, 0.13, 0.065, 0.14, 0.065, drink)
    t.box(0.215, 0.14, 0.125, 0.075, 0.008, 0.075, C.fridge, GLASS)
    t.box(0.25, 0.14, 0.15, 0.008, 0.08, 0.008, kind === 1 ? C.red : C.white)
  }
}

// Bar taburesi; oturan +z yönüne bakar, alçak sırtlık -z tarafında.
export function barStool(f) {
  for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) {
    f.box(x - 0.018, 0, z - 0.018, 0.036, STOOL_HEIGHT - 0.06, 0.036, C.iron)
  }
  for (const s of [-1, 1]) {
    f.box(-0.17, 0.26, s * 0.15 - 0.0125, 0.34, 0.025, 0.025, C.brass)
    f.box(s * 0.15 - 0.0125, 0.26, -0.17, 0.025, 0.025, 0.34, C.brass)
  }
  f.box(-0.19, STOOL_HEIGHT - 0.06, -0.19, 0.38, 0.03, 0.38, C.iron)
  f.box(-0.18, STOOL_HEIGHT - 0.03, -0.18, 0.36, 0.06, 0.36, C.leather)
  for (const x of [-0.15, 0.12]) f.box(x, STOOL_HEIGHT + 0.03, -0.19, 0.03, 0.2, 0.03, C.iron)
  f.box(-0.17, STOOL_HEIGHT + 0.14, -0.215, 0.34, 0.11, 0.04, C.leather)
}

// Ahşap kahve sandalyesi; oturan +z yönüne bakar.
export function cafeChair(f) {
  for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
    f.box(x - 0.02, 0, z - 0.02, 0.04, 0.44, 0.04, C.woodDark)
  }
  f.box(-0.21, 0.44, -0.21, 0.42, 0.04, 0.42, C.woodLight)
  f.box(-0.18, 0.48, -0.17, 0.36, 0.025, 0.33, C.leather)
  for (const x of [-0.2, 0.16]) f.box(x, 0.48, -0.22, 0.04, 0.44, 0.04, C.woodDark)
  for (const x of [-0.07, 0.03]) f.box(x, 0.5, -0.215, 0.04, 0.3, 0.025, C.woodLight)
  f.box(-0.21, 0.8, -0.225, 0.42, 0.1, 0.04, C.woodLight)
}

// Bar tezgâhı; orijin tezgâhın arka kenarının ortası (barmen tarafı), +z müşteri tarafı. Panelli
// ahşap gövde, taşkın koyu tezgâh, pirinç ayak borusu, bira muslukları, üstte sarkıt lambalar;
// önünde tabureler, her taburenin önünde defter ve içecek.
export function barCounter(f, { length, stools }, room, fx) {
  const L = length
  const D = COUNTER_DEPTH
  f.box(-L / 2, 0, 0, L, COUNTER_HEIGHT - 0.06, D, C.wood)
  const n = Math.max(2, Math.round(L / 0.5))
  for (let i = 0; i < n; i++) f.box(-L / 2 + (i * L) / n + 0.04, 0.16, D, L / n - 0.08, 0.72, 0.015, C.woodLight)
  f.box(-L / 2, 0, D, L, 0.12, 0.03, C.woodDark)
  f.box(-L / 2 - 0.05, COUNTER_HEIGHT - 0.06, -0.05, L + 0.1, 0.06, D + 0.28, C.counterTop)
  f.box(-L / 2 + 0.1, 0.22, D + 0.14, L - 0.2, 0.04, 0.04, C.brass)
  for (const x of [-L / 2 + 0.15, 0, L / 2 - 0.17]) f.box(x, 0.23, D + 0.03, 0.02, 0.02, 0.11, C.brassDark)

  // bira muslukları (barmen tarafında)
  const tx = L / 2 - 0.35
  f.box(tx - 0.16, COUNTER_HEIGHT, 0.12, 0.32, 0.02, 0.14, C.iron)
  f.box(tx - 0.03, COUNTER_HEIGHT, 0.17, 0.06, 0.32, 0.06, C.brass)
  f.box(tx - 0.15, COUNTER_HEIGHT + 0.28, 0.17, 0.3, 0.05, 0.06, C.brass)
  ;[C.red, C.cream, C.green].forEach((color, i) => {
    f.box(tx - 0.11 + i * 0.1, COUNTER_HEIGHT + 0.33, 0.18, 0.03, 0.14, 0.03, color)
    f.box(tx - 0.105 + i * 0.1, COUNTER_HEIGHT + 0.2, 0.2, 0.02, 0.08, 0.02, C.brassDark)
  })

  // sarkıt lambalar
  const lamps = Math.max(1, Math.round(L / 1.0))
  for (let i = 0; i < lamps; i++) {
    const x = -L / 2 + ((i + 0.5) * L) / lamps
    f.box(x - 0.005, 2.32, 0.4, 0.01, WALL_HEIGHT - 2.32, 0.01, C.iron)
    f.box(x - 0.12, 2.18, 0.28, 0.24, 0.14, 0.24, C.shade)
    f.box(x - 0.08, 2.32, 0.32, 0.16, 0.04, 0.16, C.shade)
    f.box(x - 0.09, 2.175, 0.31, 0.18, 0.006, 0.18, '#ffffff', BULB)
  }
  f.glow(-L / 2, COUNTER_HEIGHT + 0.003, -0.05, L, D + 0.28)
  room.lights.push(f.point(0, 1.7, 0.6).toArray())

  const pitch = Math.min(0.75, (L - 0.3) / stools)
  for (let i = 0; i < stools; i++) {
    const s = f.frame((i - (stools - 1) / 2) * pitch, 0, STOOL_Z, Math.PI)
    barStool(s)
    room.seats.push({ position: s.point(0, STOOL_HEIGHT, 0).toArray(), yaw: s.facing() })
    studyItems(s.frame(0, COUNTER_HEIGHT, STOOL_Z - D - 0.23), room.seats.length - 1, fx)
  }
}

// Pencere altı sedir; orijin sol duvar dibinde masanın ortası, yerel +x odanın içi. Masa duvara
// dik, iki yanında yüksek sırtlı deri sedirler (karşılıklı iki kişi), duvar ucunda yeşil abajurlu
// banker lambası. light: lambayı nokta ışık olarak ekle.
export function booth(f, room, fx, light) {
  f.box(0.06, TABLE_HEIGHT - 0.05, -0.36, 1.12, 0.05, 0.72, C.woodRed)
  f.box(0.45, 0, -0.25, 0.4, 0.04, 0.5, C.iron)
  f.box(0.6, 0.04, -0.06, 0.12, TABLE_HEIGHT - 0.09, 0.12, C.iron)
  for (const s of [-1, 1]) {
    const inner = s > 0 ? 0.45 : -0.93
    const back = s > 0 ? 0.93 : -1.05
    f.box(0.02, 0, inner, 1.24, 0.38, 0.48, C.wood)
    f.box(0.04, 0.38, inner + 0.01, 1.2, 0.1, 0.46, C.leather)
    f.box(0.02, 0, back, 1.24, 1.15, 0.12, C.wood)
    f.box(0.04, 0.5, s > 0 ? 0.87 : -0.93, 1.2, 0.55, 0.06, C.leatherLight)
    f.box(0, 1.15, back - 0.01, 1.28, 0.04, 0.14, C.woodDark)
    const seat = f.frame(0.62, 0, s * 0.68, s > 0 ? Math.PI : 0)
    room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing() })
    studyItems(seat.frame(0, TABLE_HEIGHT, 0.32), room.seats.length - 1, fx)
  }
  f.box(0.12, TABLE_HEIGHT, -0.07, 0.14, 0.02, 0.14, C.brass)
  f.box(0.18, TABLE_HEIGHT + 0.02, -0.01, 0.02, 0.26, 0.02, C.brass)
  f.box(0.1, TABLE_HEIGHT + 0.28, -0.14, 0.18, 0.08, 0.28, C.shade)
  f.box(0.12, TABLE_HEIGHT + 0.275, -0.12, 0.14, 0.006, 0.24, '#ffffff', BULB)
  f.glow(0.06, TABLE_HEIGHT + 0.003, -0.36, 1.12, 0.72)
  if (light) room.lights.push(f.point(0.5, 1.5, 0).toArray())
}

// xz düzleminde r yarıçaplı disk (yuvarlak masa üstü).
function diskXZ(f, y, r, step, h, color) {
  for (let z = -r; z < r - 1e-3; z += step) {
    const d = Math.min(step, r - z)
    const c = z + d / 2
    const half = Math.sqrt(Math.max(r * r - c * c, 0))
    f.box(-half, y, z, 2 * half, h, d, color)
  }
}

// Yuvarlak kahve masası; orijin ortası. Ortada titrek alevli mum, iki yanda (±x) sandalye,
// tepede ışıklı tavan vantilatörü.
export function roundTable(f, room, fx) {
  const R = 0.45
  f.box(-0.3, 0, -0.04, 0.6, 0.04, 0.08, C.iron)
  f.box(-0.04, 0, -0.3, 0.08, 0.04, 0.6, C.iron)
  f.box(-0.04, 0.04, -0.04, 0.08, TABLE_HEIGHT - 0.08, 0.08, C.iron)
  diskXZ(f, TABLE_HEIGHT - 0.04, R, 0.09, 0.04, C.woodRed)
  f.box(-0.05, TABLE_HEIGHT, -0.05, 0.1, 0.012, 0.1, C.brass)
  f.box(-0.025, TABLE_HEIGHT + 0.012, -0.025, 0.05, 0.08, 0.05, C.candle)
  fx.room.pulsers.push({
    items: [
      fxBox(f, -0.016, TABLE_HEIGHT + 0.095, -0.016, 0.032, 0.05, 0.032, C.flame[0]),
      fxBox(f, -0.009, TABLE_HEIGHT + 0.1, -0.009, 0.018, 0.03, 0.018, C.flame[1]),
    ],
    amp: 0.18,
    period: 0.9,
    phase: 0,
  })
  for (const s of [-1, 1]) {
    const seat = f.frame(s * 0.68, 0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2)
    cafeChair(seat)
    room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing() })
    studyItems(seat.frame(0, TABLE_HEIGHT, 0.23), room.seats.length - 1, fx)
  }
  ceilingFan(f, fx)
  room.lights.push(f.point(0, 2.3, 0).toArray())
}

// Tavan vantilatörü; orijin altındaki zemin. Çubuk, pirinç motor, ışık kâsesi ve yavaş dönen
// dört ahşap kanat (fx.lit).
function ceilingFan(f, fx) {
  const y = 2.62
  f.box(-0.015, y + 0.12, -0.015, 0.03, WALL_HEIGHT - y - 0.12, 0.03, C.iron)
  f.box(-0.1, y, -0.1, 0.2, 0.12, 0.2, C.brassDark)
  f.box(-0.07, y - 0.07, -0.07, 0.14, 0.07, 0.14, C.lamp, BULB)
  const items = []
  for (let k = 0; k < 4; k++) {
    const b = f.frame(0, 0, 0, (k * Math.PI) / 2)
    items.push(fxBox(b, 0.1, y + 0.05, -0.02, 0.06, 0.02, 0.04, C.brass))
    items.push(fxBox(b, 0.16, y + 0.05, -0.065, 0.46, 0.014, 0.13, C.woodLight))
  }
  fx.lit.spinners.push({ items, pivot: f.point(0, 0, 0), axis: axisOf(f, 0, 1, 0), period: 2.6, phase: 0 })
}

// ---------------------------------------------------------------- zemin eşyaları

// Bilardo masası; orijin ortası, dünya eksenine hizalı (uzun kenar z boyunca). Yeşil çuha,
// ahşap bantlar, cepler, üçgen dizili toplar ve beyaz top, ıstaka, tebeşir; üstte uzun abajur.
export function poolTable(f) {
  for (const x of [-0.52, 0.4]) {
    for (const z of [-0.98, 0.86]) f.box(x, 0, z, 0.12, 0.56, 0.12, C.woodDark)
  }
  f.box(-0.6, 0.56, -1.1, 1.2, 0.19, 2.2, C.woodDark)
  f.box(-0.5, 0.75, -1.0, 1.0, 0.02, 2.0, C.felt)
  f.box(-0.6, 0.75, -1.1, 0.1, 0.06, 2.2, C.wood)
  f.box(0.5, 0.75, -1.1, 0.1, 0.06, 2.2, C.wood)
  f.box(-0.5, 0.75, -1.1, 1.0, 0.06, 0.1, C.wood)
  f.box(-0.5, 0.75, 1.0, 1.0, 0.06, 0.1, C.wood)
  for (const x of [-0.55, 0.43]) {
    for (const z of [-1.05, -0.06, 0.93]) f.box(x, 0.75, z, 0.12, 0.064, 0.12, C.black)
  }
  const ball = 0.055
  let k = 0
  for (let r = 0; r < 5; r++) {
    for (let i = 0; i <= r; i++) {
      const color = r === 2 && i === 1 ? C.black : C.ball[k++ % C.ball.length]
      f.box((i - r / 2) * 0.06 - ball / 2, 0.77, -0.5 - r * 0.058 - ball / 2, ball, ball, ball, color)
    }
  }
  f.box(-ball / 2, 0.77, 0.5 - ball / 2, ball, ball, ball, C.white)
  f.box(-0.01, 0.775, -0.25, 0.02, 0.02, 1.2, C.woodLight, { rot: [0, 0.28, 0] })
  f.box(0.5, 0.81, 0.6, 0.03, 0.025, 0.03, C.ball[1])
  f.box(-0.18, 1.85, -0.75, 0.36, 0.14, 1.5, C.shade)
  f.box(-0.14, 1.845, -0.7, 0.28, 0.006, 1.4, '#ffffff', BULB)
  for (const z of [-0.6, 0.6]) f.box(-0.005, 1.99, z, 0.01, WALL_HEIGHT - 1.99, 0.01, C.iron)
  f.glow(-0.5, 0.773, -1.0, 1.0, 2.0)
}

// Saksıda büyük kauçuk bitkisi; orijin ortası.
export function bigPlant(f) {
  f.box(-0.2, 0, -0.2, 0.4, 0.42, 0.4, C.pot)
  f.box(-0.22, 0.42, -0.22, 0.44, 0.05, 0.44, C.pot)
  f.box(-0.18, 0.47, -0.18, 0.36, 0.005, 0.36, C.soil)
  f.box(-0.025, 0.47, -0.025, 0.05, 0.8, 0.05, C.woodDark)
  const leaves = [
    [0.12, 0.75, 0.05, 0.5],
    [-0.13, 0.9, -0.04, -0.6],
    [0.08, 1.08, -0.1, 0.4],
    [-0.1, 1.2, 0.08, -0.45],
    [0.0, 1.32, 0.0, 0],
  ]
  leaves.forEach(([x, y, z, roll], i) => f.box(x - 0.1, y, z - 0.05, 0.2, 0.08, 0.1, C.plant[i % C.plant.length], { rot: [0, 0, roll] }))
}
