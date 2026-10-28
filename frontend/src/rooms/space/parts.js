import { pick } from '../core/voxel'

// Uzay istasyonu temasının voxel parçaları. Birim ≈ 1 metre.
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür. Duvar parçalarında orijin duvar yüzeyinin dibi, +z odanın içi.
// fx: hareket eden ve yanıp sönen kutuların listesi ({ movers, blinkers, holos }); bunlar
// katmanlara değil StationEffect'e gider.

export const WALL = 0.25
export const FLOOR_BOTTOM = -0.36
export const WALL_HEIGHT = 3.0
export const SEAT_HEIGHT = 0.5
const SEAT_WIDTH = 0.85
const TABLE_DEPTH = 1.1
const TABLE_HEIGHT = 0.76
const PENDANT_HEIGHT = 2.45
const SILL = 0.6
const WINDOW_TOP = 2.5
const PANEL_TOP = 2.6
// Pencere boşluğunun duvar uçlarından payı; uydu bu payların içinde (duvarda) kaybolur.
const WINDOW_MARGIN = 0.45
const VIEW_DEPTH = -0.18
const GLASS = { layer: 'glass' }
const BULB = { layer: 'bulb' }
const NIGHT = { layer: 'night' }
const FULL_PANELS = [
  [0.14, 1.05],
  [1.1, PANEL_TOP],
]

export const C = {
  hullDark: '#454c57',
  seam: '#9aa3ae',
  panel: ['#e4e8ed', '#dbe0e6'],
  panelBand: '#c7ced7',
  trim: '#3b414b',
  kick: '#2f343c',
  plates: ['#6b7380', '#707886', '#67707c', '#737b88'],
  stripe: '#f07f2d',
  hazard: '#f2b134',
  hazardDark: '#2a2d33',
  led: '#a6ecff',
  guide: '#5ee0ff',
  white: '#eef1f5',
  steel: '#b7bec7',
  steelDark: '#7f8893',
  dark: '#2a2e35',
  screenBody: '#1c2027',
  screen: '#0f1c33',
  scan: '#2c7c99',
  ui: ['#5ee0ff', '#7dffb0', '#ffd166', '#ff7b72'],
  accent: '#2f6fd6',
  orange: '#f07f2d',
  orangeLight: '#f59a52',
  handrail: '#e8b23a',
  door: '#cfd5dd',
  space: '#060a18',
  stars: ['#ffffff', '#d6e4ff', '#fff1d0'],
  ocean: '#2563b8',
  oceanLight: '#3d82d4',
  atmosphere: '#8fd2ff',
  land: ['#5e9448', '#7d8f4a', '#b7a06a'],
  cloud: '#f2f6fa',
  cityLights: '#ffd98a',
  moon: '#d4d4da',
  moonShade: '#a5a5ae',
  foil: '#d4a63a',
  solar: '#23417e',
  beacon: '#ff4a4a',
  leaves: ['#4caf50', '#3f9a45', '#66bb55'],
  fruit: '#e5484d',
  grow: '#ff6ad5',
  tray: '#e9edf2',
  soil: '#3a2f28',
  suit: '#eceff3',
  suitShade: '#d2d8df',
  visor: '#d9a43a',
  flag: ['#c0392b', '#2f6fd6'],
  bags: ['#e8e2d4', '#ddd6c6', '#e4e7ea'],
  strap: '#5b6370',
  pouch: '#c7ccd3',
}

// Efekt kutusu: katmana değil efekt listesine gider. Merkez ve dönüş dünyada saklanır.
function fxBox(f, x, y, z, w, h, d, color, extra) {
  return { center: f.point(x + w / 2, y + h / 2, z + d / 2), quat: f.worldRotation(), size: [w, h, d], color, ...extra }
}

// Çerçevenin yerel +x yönü (dünyada); kayan parçaların ekseni.
const axisX = (f) => f.point(1, 0, 0).sub(f.point(0, 0, 0)).toArray()

// ---------------------------------------------------------------- yapı

// Metal döşeme plakaları; aralardaki koyu gövde ek yeri gibi görünür. Ön kenarlarda turuncu
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

// Arka duvar: z = 0 boyunca, x = -WALL'dan width'e.
export function backWall(f, width) {
  wallShell(f, -WALL, width)
  f.box(-WALL, 0, -WALL, width + WALL, WALL_HEIGHT, WALL - 0.02, C.seam)
  panels(f, 0, width, FULL_PANELS)
}

// Sol duvar: boydan boya gözlem penceresi ve arkasında uzay. Yerel u duvar boyunca (0 = ön kenar),
// iç yüzey v = 0. Uydu ve parlayan yıldızlar fx listesine gider.
export function observationWall(f, length, rnd, fx) {
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

  // Kasa: pervaz, kayıtlar ve pahlı köşeler (lomboz görünümü). Hiçbir yüz duvar gövdesiyle aynı
  // düzlemde değil (kamera dönünce titreşmesin): pervaz duvarın 1 cm üstüne çıkar, yan kasalar
  // boşluğun içinde durur, pahlar pervaz/başlık kalınlığında kalır ve panellerin arkasına gizlenir.
  const panes = Math.max(2, Math.round((b - a) / 1.4))
  const pw = (b - a) / panes
  f.box(a - 0.06, SILL - 0.12, -0.17, b - a + 0.12, 0.13, 0.29, C.trim)
  f.box(a - 0.06, WINDOW_TOP, -0.17, b - a + 0.12, 0.12, 0.21, C.trim)
  for (const u of [a, b - 0.06]) f.box(u, SILL, -0.17, 0.06, WINDOW_TOP - SILL, 0.21, C.trim)
  for (let i = 1; i < panes; i++) f.box(a + i * pw - 0.06, SILL, -0.17, 0.12, WINDOW_TOP - SILL, 0.22, C.trim)
  for (let i = 0; i <= panes; i++) {
    for (const y of [SILL, WINDOW_TOP]) {
      f.box(a + i * pw - 0.08, y - 0.08, -0.17, 0.16, 0.16, 0.165, C.trim, { rot: [0, 0, Math.PI / 4] })
    }
  }

  spaceView(f, a, b, rnd, fx)
}

// Pencereden görünen uzay: yıldızlar, alt kısımda kavisli ufkuyla gezegen (okyanus, kıta, bulut,
// atmosfer çizgisi; akşam/gece şehir ışıkları), üstte ay ve yavaşça geçen bir uydu.
function spaceView(f, a, b, rnd, fx) {
  const v = VIEW_DEPTH
  const length = b - a
  const height = WINDOW_TOP - SILL
  // Katmanlar önden arkaya en az 1 mm aralıkla: şehir ışıkları v, bulut v-0.003, kıta / açık bant /
  // ay gölgesi v-0.005, okyanus / atmosfer / ay / yıldız v-0.006, zemin v-0.008. Aynı düzleme düşen
  // farklı renkli yüzler kamera dönünce titrer.
  f.box(a, SILL, v - 0.012, length, height, 0.004, C.space, GLASS)

  const R = Math.max(3.4, length * 0.8)
  const cu = a + length * 0.58
  const top = 0.72
  const surface = (u) => (Math.abs(u - cu) >= R ? -1 : top - (R - Math.sqrt(R * R - (u - cu) ** 2)))

  // Sütun sütun okyanus; kıtalar birkaç sütuna yayılan mercek biçimli lekeler, bulutlar yatay
  // şeritler. Ufka yakın bant açık mavi, üstünde atmosfer çizgisi.
  const step = 0.1
  let run = 0
  let runLength = 0
  let mid = 0
  let thick = 0
  let color = C.land[0]
  for (let u = a; u < b - 1e-3; u += step) {
    const w = Math.min(step, b - u)
    const s = surface(u + w / 2)
    if (s < 0.04) continue
    f.box(u, SILL, v - 0.008, w, s, 0.002, C.ocean, GLASS)
    f.box(u, SILL + s - Math.min(0.07, s * 0.4), v - 0.006, w, Math.min(0.07, s * 0.4), 0.001, C.oceanLight, GLASS)
    f.box(u, SILL + s, v - 0.008, w, 0.03, 0.002, C.atmosphere, GLASS)
    if (run === 0 && s > 0.3 && rnd() < 0.14) {
      runLength = run = 4 + Math.floor(rnd() * 5)
      mid = 0.3 + rnd() * 0.2
      thick = 0.3 + rnd() * 0.2
      color = pick(rnd, C.land)
    }
    if (run > 0) {
      const k = runLength - run--
      const half = (s * thick * Math.sin((Math.PI * (k + 0.5)) / runLength)) / 2
      const y0 = SILL + s * mid - half
      const y1 = Math.min(SILL + s * mid + half, SILL + s - 0.09)
      if (y1 > y0 + 0.02) {
        f.box(u, y0, v - 0.006, w, y1 - y0, 0.001, color, GLASS)
        if (k % 2 === 1) f.box(u + 0.04, (y0 + y1) / 2, v - 0.002, 0.02, 0.02, 0.002, C.cityLights, NIGHT)
      }
    }
    const cw = 0.2 + rnd() * 0.25
    const cy = SILL + s * (0.2 + rnd() * 0.5)
    const below = Math.min(s, surface(u + cw))
    if (rnd() < 0.1 && u + cw < b && cy + 0.06 < SILL + below - 0.05) {
      f.box(u, cy, v - 0.004, cw, 0.025, 0.001, C.cloud, GLASS)
    }
  }

  // ay: basamaklı disk ve kraterler
  const mu = a + length * 0.2
  const my = WINDOW_TOP - 0.62
  const mr = 0.17
  for (let y = -mr; y < mr - 1e-3; y += 0.04) {
    const c = y + 0.02
    const half = Math.sqrt(Math.max(mr * mr - c * c, 0))
    f.box(mu - half, my + y, v - 0.008, 2 * half, 0.04, 0.002, C.moon, GLASS)
  }
  for (const [x, y, s] of [[-0.07, 0.04, 0.05], [0.05, -0.06, 0.04], [0.03, 0.07, 0.03]]) {
    f.box(mu + x, my + y, v - 0.006, s, s, 0.001, C.moonShade, GLASS)
  }

  // yıldızlar (gezegen ve ayın önüne düşenler çizilmez); bir kısmı parıldar
  const quat = f.worldRotation()
  const count = Math.round(length * 14)
  const placed = []
  for (let i = 0; i < count; i++) {
    const u = a + 0.04 + rnd() * (length - 0.08)
    const y = SILL + 0.04 + rnd() * (height - 0.08)
    const s = 0.016 + rnd() * 0.018
    const color = pick(rnd, C.stars)
    if (y - SILL < surface(u) + 0.08 || Math.hypot(u - mu, y - my) < mr + 0.04) continue
    if (placed.some(([pu, py]) => Math.abs(pu - u) < 0.04 && Math.abs(py - y) < 0.04)) continue
    placed.push([u, y])
    if (rnd() < 0.25) {
      fx.blinkers.push({ center: f.point(u, y, v + 0.001), quat, size: [s, s, 0.002], color, rate: 0.2 + rnd() * 0.4, duty: 0.7, phase: rnd() })
    } else {
      f.box(u - s / 2, y - s / 2, v - 0.008, s, s, 0.002, color, GLASS)
    }
  }

  // Uydu: pencerenin üst bandında önden arkaya süzülür; uçlarda duvarın içinde kaybolur.
  const sy = WINDOW_TOP - 0.2
  const su = a - 0.22
  const sv = v + 0.004
  const travel = length + 0.44
  fx.movers.push({
    items: [
      fxBox(f, su - 0.06, sy - 0.05, sv, 0.12, 0.1, 0.004, C.foil),
      fxBox(f, su - 0.2, sy - 0.035, sv, 0.13, 0.07, 0.004, C.solar),
      fxBox(f, su + 0.07, sy - 0.035, sv, 0.13, 0.07, 0.004, C.solar),
      fxBox(f, su - 0.07, sy - 0.006, sv + 0.001, 0.14, 0.012, 0.004, C.steelDark),
    ],
    axis: axisX(f),
    travel,
    period: travel / 0.12,
    phase: rnd(),
  })
}

// ---------------------------------------------------------------- arka duvar

// Hava kilidi; orijin kapının ortası. Sürgülü çift kanat ve lombozlar, sağda tuş paneli (durum
// ışığı yanıp söner), üstte uyarı tabelası, önde ikaz şeritli eşik.
export function hatch(f, fx) {
  const W = 1.0
  const H = 2.05
  const J = 0.12
  f.box(-W / 2 - J, 0, -0.02, J, H + J, 0.12, C.trim)
  f.box(W / 2, 0, -0.02, J, H + J, 0.12, C.trim)
  f.box(-W / 2, H, -0.02, W, J, 0.12, C.trim)
  for (const s of [-1, 1]) f.box(s * (W / 2) - 0.11, H - 0.11, -0.02, 0.22, 0.22, 0.12, C.trim, { rot: [0, 0, Math.PI / 4] })

  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -W / 2 : 0
    const cx = s * (W / 4)
    f.box(x0 + 0.005, 0.03, -0.02, W / 2 - 0.01, H - 0.03, 0.05, C.door)
    f.box(x0 + 0.005, 0.32, 0.03, W / 2 - 0.01, 0.06, 0.004, C.hazard)
    f.box(cx - 0.12, 1.32, 0.03, 0.24, 0.24, 0.008, C.trim)
    f.box(cx - 0.12, 1.32, 0.03, 0.24, 0.24, 0.008, C.trim, { rot: [0, 0, Math.PI / 4] })
    f.box(cx - 0.085, 1.355, 0.038, 0.17, 0.17, 0.004, C.space, GLASS)
    f.box(cx - 0.085, 1.355, 0.038, 0.17, 0.17, 0.004, C.space, { ...GLASS, rot: [0, 0, Math.PI / 4] })
    f.box(s < 0 ? -0.12 : 0.08, 0.85, 0.03, 0.04, 0.32, 0.035, C.steelDark)
  }

  // eşik
  const T = W + 2 * J
  f.box(-T / 2, 0, 0.1, T, 0.02, 0.2, C.hazardDark)
  for (let i = 0; i < 7; i += 2) f.box(-T / 2 + (i * T) / 7, 0.02, 0.1, T / 7, 0.004, 0.2, C.hazard)

  // tabela ve tuş paneli
  f.box(-0.32, H + J + 0.07, -0.02, 0.64, 0.14, 0.05, C.screenBody)
  f.box(-0.28, H + J + 0.1, 0.03, 0.56, 0.08, 0.003, C.ui[2], BULB)
  const k = W / 2 + J + 0.07
  f.box(k, 1.05, -0.02, 0.17, 0.27, 0.05, C.screenBody)
  f.box(k + 0.025, 1.17, 0.03, 0.12, 0.08, 0.003, C.screen, BULB)
  for (let i = 0; i < 3; i++) f.box(k + 0.025 + i * 0.045, 1.08, 0.03, 0.03, 0.05, 0.006, C.steel)
  fx.blinkers.push(fxBox(f, k + 0.065, 1.27, 0.03, 0.04, 0.025, 0.006, C.ui[1], { rate: 0.5, duty: 0.75, phase: 0 }))
}

// Dikili uzay giysisi (EVA); orijin duvar dibi, giysi destek direğine asılı.
export function evaSuit(f) {
  f.box(-0.04, 0.04, -0.02, 0.08, 1.4, 0.06, C.steelDark)
  const s = f.frame(0, 0, 0.3)
  s.box(-0.3, 0, -0.3, 0.6, 0.04, 0.55, C.trim)
  for (const x of [-0.14, 0.03]) {
    s.box(x, 0.04, -0.08, 0.11, 0.1, 0.22, C.suitShade)
    s.box(x + 0.005, 0.14, -0.07, 0.1, 0.34, 0.13, C.suit)
    s.box(x, 0.48, -0.075, 0.11, 0.05, 0.14, C.suitShade)
    s.box(x + 0.005, 0.53, -0.07, 0.1, 0.32, 0.13, C.suit)
    s.box(x + 0.005, 0.3, 0.06, 0.1, 0.03, 0.004, C.flag[0])
  }
  s.box(-0.17, 0.85, -0.09, 0.34, 0.08, 0.17, C.suitShade)
  s.box(-0.19, 0.93, -0.11, 0.38, 0.42, 0.21, C.suit)
  s.box(-0.2, 0.9, -0.26, 0.4, 0.5, 0.15, C.suitShade)
  s.box(-0.1, 1.05, 0.1, 0.2, 0.12, 0.05, C.steel)
  s.box(-0.07, 1.12, 0.15, 0.04, 0.025, 0.004, C.ui[1], BULB)
  s.box(0.0, 1.12, 0.15, 0.04, 0.025, 0.004, C.ui[2], BULB)
  for (const side of [-1, 1]) {
    const x = side < 0 ? -0.3 : 0.19
    s.box(x, 1.22, -0.08, 0.11, 0.12, 0.15, C.suitShade)
    s.box(x + 0.005, 0.9, -0.065, 0.1, 0.32, 0.12, C.suit)
    s.box(x + 0.01, 0.8, -0.055, 0.09, 0.1, 0.1, C.dark)
  }
  s.box(-0.302, 1.12, -0.03, 0.004, 0.06, 0.09, C.flag[1])
  s.box(-0.07, 1.35, -0.07, 0.14, 0.04, 0.14, C.suitShade)
  s.box(-0.13, 1.39, -0.13, 0.26, 0.25, 0.25, C.suit)
  s.box(-0.1, 1.42, 0.115, 0.2, 0.16, 0.02, C.visor)
  s.box(-0.11, 1.64, -0.11, 0.22, 0.03, 0.21, C.suit)
}

// Kontrol paneli; orijin ortası. Altta dolap ve eğik tuş paneli, duvarda yörünge haritalı ana
// ekran (tarama çizgisi kayar) ve yanlarda grafik ekranları. Bazı tuşlar yanıp söner.
export function controlConsole(f, length, rnd, fx) {
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
        fx.blinkers.push(fxBox(p, x, 0, 0.07 + r * 0.12, 0.06, 0.012, 0.05, color, { rate: 0.4 + ((i * 7 + r) % 5) * 0.15, duty: 0.55, phase: (i * 0.37) % 1 }))
      } else {
        p.box(x, 0, 0.07 + r * 0.12, 0.06, 0.012, 0.05, color, BULB)
      }
    }
  }

  // ana ekran
  const w = Math.min(1.1, L * 0.5)
  const h = 0.62
  const y0 = 1.35
  f.box(-w / 2 - 0.03, y0 - 0.03, -0.02, w + 0.06, h + 0.06, 0.06, C.screenBody)
  f.box(-w / 2, y0, 0.04, w, h, 0.003, C.screen, BULB)
  f.box(-w / 2 + 0.02, y0 + h / 2, 0.043, w - 0.04, 0.004, 0.002, C.scan, BULB)
  f.box(-0.002, y0 + 0.02, 0.043, 0.004, h - 0.04, 0.002, C.scan, BULB)
  const rx = w * 0.34
  const ry = h * 0.3
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2
    f.box(Math.cos(t) * rx - 0.012, y0 + h / 2 + Math.sin(t) * ry - 0.012, 0.044, 0.024, 0.024, 0.002, C.ui[0], BULB)
  }
  f.box(-0.05, y0 + h / 2 - 0.05, 0.044, 0.1, 0.1, 0.002, C.oceanLight, BULB)
  f.box(-0.035, y0 + h / 2 - 0.02, 0.045, 0.04, 0.05, 0.002, C.ui[1], BULB)
  fx.blinkers.push(fxBox(f, rx * 0.7 - 0.02, y0 + h / 2 + ry * 0.71 - 0.02, 0.045, 0.04, 0.04, 0.003, C.ui[3], { rate: 1, duty: 0.5, phase: 0 }))
  fx.movers.push({
    items: [fxBox(f, -w / 2, y0, 0.049, 0.012, h, 0.002, C.ui[0])],
    axis: axisX(f),
    travel: w - 0.012,
    period: 4,
    phase: 0,
  })

  // yan ekranlar: çubuk grafikler
  const sw = Math.min(0.42, (L - w) / 2 - 0.12)
  if (sw < 0.2) return
  for (const s of [-1, 1]) {
    const cx = s * (w / 2 + 0.1 + sw / 2)
    f.box(cx - sw / 2 - 0.02, 1.48, -0.02, sw + 0.04, 0.36, 0.05, C.screenBody)
    f.box(cx - sw / 2, 1.5, 0.03, sw, 0.32, 0.003, C.screen, BULB)
    const bars = Math.floor((sw - 0.04) / 0.06)
    for (let i = 0; i < bars; i++) {
      const bh = 0.06 + rnd() * 0.2
      f.box(cx - sw / 2 + 0.03 + i * 0.06, 1.53, 0.034, 0.035, bh, 0.002, s < 0 ? C.ui[1] : C.ui[2], BULB)
    }
  }
}

// Yiyecek-içecek otomatı; orijin ortası. Ekran, servis nişinde içecek poşeti, tuşlar, durum ışığı.
export function dispenser(f, fx) {
  f.box(-0.4, 0, 0, 0.8, 0.08, 0.5, C.kick)
  f.box(-0.4, 0.08, 0, 0.8, 1.82, 0.52, C.white)
  f.box(-0.4, 1.6, 0.52, 0.8, 0.05, 0.004, C.accent)
  f.box(-0.3, 1.26, 0.52, 0.6, 0.27, 0.01, C.screenBody)
  f.box(-0.27, 1.29, 0.53, 0.54, 0.21, 0.003, C.screen, BULB)
  for (let i = 0; i < 3; i++) f.box(-0.24, 1.44 - i * 0.055, 0.533, 0.3 - i * 0.06, 0.025, 0.002, C.ui[i], BULB)
  f.box(0.14, 1.32, 0.533, 0.1, 0.1, 0.002, C.orange, BULB)
  f.box(-0.22, 0.75, 0.52, 0.44, 0.38, 0.006, C.dark)
  f.box(-0.25, 0.72, 0.52, 0.5, 0.03, 0.1, C.steel)
  f.box(-0.03, 1.04, 0.52, 0.06, 0.05, 0.05, C.steelDark)
  f.box(-0.06, 0.75, 0.53, 0.12, 0.16, 0.04, C.pouch)
  f.box(-0.01, 0.91, 0.545, 0.012, 0.06, 0.012, C.orange)
  for (let i = 0; i < 3; i++) f.box(0.28, 0.98 - i * 0.08, 0.52, 0.06, 0.05, 0.012, C.ui[i], BULB)
  fx.blinkers.push(fxBox(f, 0.29, 1.68, 0.52, 0.04, 0.03, 0.006, C.ui[1], { rate: 0.6, duty: 0.6, phase: 0.3 }))
  f.box(-0.33, 1.9, 0.06, 0.32, 0.16, 0.36, C.bags[0])
  f.box(-0.335, 1.96, 0.06, 0.33, 0.02, 0.362, C.strap)
}

// Hidroponik bahçe rafı; orijin ortası. Üç kat tava, sıra sıra yeşillik (bazılarında meyve),
// her katın üstünde pembe büyüme ışığı.
export function hydroponics(f, length, rnd) {
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
    f.box(-L / 2 + 0.05, y + 0.04, 0.05, L - 0.1, 0.08, D - 0.1, C.tray)
    f.box(-L / 2 + 0.07, y + 0.12, 0.07, L - 0.14, 0.004, D - 0.14, C.soil)
    const above = i + 1 < levels.length ? levels[i + 1] : topY
    f.box(-L / 2 + 0.06, above - 0.025, 0.17, L - 0.12, 0.025, 0.12, C.grow, BULB)
    const n = Math.floor((L - 0.14) / 0.22)
    const pitch = (L - 0.14) / n
    for (let k = 0; k < n; k++) {
      const x = -L / 2 + 0.07 + (k + 0.5) * pitch
      const h = 0.12 + rnd() * 0.1
      f.box(x - 0.08, y + 0.124, 0.1, 0.16, h, 0.28, pick(rnd, C.leaves))
      f.box(x - 0.06, y + 0.124 + h, 0.14, 0.12, 0.05, 0.2, pick(rnd, C.leaves))
      if (rnd() < 0.3) f.box(x + 0.02, y + 0.124 + h - 0.06, 0.37, 0.05, 0.05, 0.04, C.fruit)
    }
  })
}

// Kargo rafı: kayışlı yük çantaları; orijin ortası.
export function cargoRack(f, length) {
  const L = length
  const levels = [0.08, 0.68, 1.28]
  for (const x of [-L / 2, L / 2 - 0.05]) f.box(x, 0, 0.02, 0.05, 1.86, 0.5, C.steelDark)
  levels.forEach((y, i) => {
    f.box(-L / 2, y - 0.04, 0.02, L, 0.04, 0.5, C.steelDark)
    const bags = Math.max(1, Math.round((L - 0.1) / 0.46))
    const bw = (L - 0.1) / bags
    for (let k = 0; k < bags; k++) {
      const x = -L / 2 + 0.05 + k * bw
      const color = C.bags[(i + k) % C.bags.length]
      f.box(x + 0.02, y, 0.05, bw - 0.04, 0.5, 0.44, color)
      f.box(x + bw / 2 - 0.02, y, 0.05, 0.04, 0.505, 0.444, C.strap)
      f.box(x + 0.06, y + 0.32, 0.49, 0.12, 0.08, 0.004, C.ui[(i + k * 2) % 4])
    }
  })
}

// ---------------------------------------------------------------- çalışma alanı

// Görev masası; orijin masanın ortası. back: duvar tarafı (kameraya bakar), front: karşı sıra,
// ends: uçlardaki koltuklar (1 = sağ uç, 2 = iki uç). Ortada holografik gezegen projektörü,
// üstte sarkıt LED armatür.
export function missionTable(c, { back = 0, front = 0, ends = 0 }, room, fx) {
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
  for (const z of [-D / 2 - 0.006, D / 2 - 0.009]) c.box(-L / 2 + 0.21, top + 0.015, z, L - 0.42, 0.02, 0.015, C.led, BULB)

  // holo projektör
  c.box(-0.2, H, -0.2, 0.4, 0.05, 0.4, C.trim)
  c.box(-0.2, H, -0.2, 0.4, 0.05, 0.4, C.trim, { rot: [0, Math.PI / 4, 0] })
  c.box(-0.11, H + 0.05, -0.11, 0.22, 0.008, 0.22, C.ui[0], BULB)
  fx.holos.push(c.point(0, H + 0.058, 0).toArray())

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
    spaceChair(seat)
    room.seats.push({ position: seat.point(0, SEAT_HEIGHT, 0).toArray(), yaw: seat.facing() })
    tablet(seat.frame(0, H, 0.42), i)
  })
}

// Masa üstü; orijin oturanın önündeki masa kenarı, +z masanın içine.
function tablet(t, i) {
  t.box(-0.17, 0, 0.08, 0.34, 0.012, 0.24, C.screenBody)
  t.box(-0.155, 0.012, 0.095, 0.31, 0.003, 0.21, C.screen, BULB)
  t.box(-0.13, 0.016, 0.24, 0.16, 0.002, 0.025, C.ui[i % 4], BULB)
  t.box(-0.13, 0.016, 0.19, 0.24, 0.002, 0.02, C.ui[(i + 1) % 4], BULB)
  t.box(-0.13, 0.016, 0.14, 0.12, 0.002, 0.02, C.ui[(i + 2) % 4], BULB)
  if (i % 2 === 0) {
    t.box(0.22, 0, 0.12, 0.08, 0.13, 0.05, C.pouch)
    t.box(0.255, 0.13, 0.14, 0.012, 0.04, 0.012, C.orange)
  }
}

// Döner koltuk; oturan +z yönüne bakar, sırtlık -z tarafında.
export function spaceChair(f) {
  f.box(-0.28, 0.04, -0.03, 0.56, 0.04, 0.06, C.trim)
  f.box(-0.03, 0.04, -0.28, 0.06, 0.04, 0.56, C.trim)
  for (const [x, z] of [[-0.27, 0], [0.27, 0], [0, -0.27], [0, 0.27]]) f.box(x - 0.03, 0, z - 0.03, 0.06, 0.04, 0.06, C.dark)
  f.box(-0.035, 0.08, -0.035, 0.07, 0.3, 0.07, C.steel)
  f.box(-0.25, 0.38, -0.24, 0.5, 0.08, 0.48, C.white)
  f.box(-0.22, 0.46, -0.2, 0.44, 0.04, 0.42, C.accent)
  f.box(-0.24, 0.5, -0.31, 0.48, 0.62, 0.07, C.white)
  f.box(-0.2, 0.56, -0.24, 0.4, 0.48, 0.025, C.accent)
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

// Koşu bandı (yerçekimsiz ortam için bungee kemerli); koşan yerel -z'ye, konsola bakar.
export function treadmill(f) {
  const L = 1.7
  const W = 0.72
  f.box(-W / 2, 0, -L / 2, W, 0.16, L, C.steelDark)
  f.box(-W / 2 + 0.08, 0.16, -L / 2 + 0.12, W - 0.16, 0.02, L - 0.24, C.dark)
  f.box(-W / 2, 0.06, L / 2, W, 0.05, 0.004, C.stripe)
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - 0.03) - 0.025
    f.box(x, 0.16, -L / 2 + 0.08, 0.05, 0.86, 0.05, C.steel)
    f.box(x, 1.0, -L / 2 + 0.08, 0.05, 0.04, 0.62, C.steel)
    f.box(x + 0.01, 0.16, 0.05, 0.03, 0.5, 0.03, C.handrail)
    f.box(x, 0.66, 0.04, 0.05, 0.05, 0.05, C.trim)
  }
  f.box(-W / 2 + 0.03, 1.0, -L / 2 + 0.06, W - 0.06, 0.05, 0.1, C.steel)
  const p = f.frame(0, 1.05, -L / 2 + 0.1, 0, 0.5)
  p.box(-0.22, 0, -0.04, 0.44, 0.04, 0.2, C.screenBody)
  p.box(-0.18, 0.04, 0.0, 0.36, 0.003, 0.13, C.screen, BULB)
  p.box(-0.14, 0.044, 0.03, 0.18, 0.002, 0.025, C.ui[1], BULB)
  p.box(-0.14, 0.044, 0.08, 0.26, 0.002, 0.025, C.ui[0], BULB)
}

// Pencere önü minderli bank; orijin ortası, oturan +z'ye bakar. Sırt minderi pencere pervazının
// altında kalır, manzarayı kapatmaz. Pencere kasasının altında iki okuma lambası (tek ışık).
export function windowBench(f, length, room) {
  const L = length
  f.box(-L / 2, 0, -0.3, L, 0.08, 0.56, C.trim)
  f.box(-L / 2, 0.08, -0.3, L, 0.3, 0.6, C.white)
  const n = Math.max(2, Math.round(L / 0.8))
  const w = L / n
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + i * w
    f.box(x + 0.02, 0.38, -0.14, w - 0.04, 0.08, 0.42, C.orange)
    f.box(x + 0.04, 0.4, -0.29, w - 0.08, 0.16, 0.12, C.orangeLight, { rot: [-0.2, 0, 0] })
    if (i % 2 === 0) f.box(x + 0.12, 0.46, -0.17, 0.22, 0.18, 0.08, C.accent, { rot: [-0.2, 0.2, 0] })
  }
  for (const x of [-L / 4, L / 4]) {
    f.box(x - 0.12, 2.38, -0.42, 0.24, 0.12, 0.24, C.trim)
    f.box(x - 0.09, 2.375, -0.39, 0.18, 0.006, 0.18, '#ffffff', BULB)
  }
  f.glow(-L / 2, 0.465, -0.3, L, 0.6)
  room.lights.push(f.point(0, 1.7, 0.35).toArray())
}

// Kondisyon bisikleti; süren +z'ye bakar (gidon ve ekran önde, sele arkada).
export function exerciseBike(f) {
  f.box(-0.25, 0, -0.55, 0.5, 0.06, 1.05, C.steelDark)
  f.box(-0.12, 0.06, 0.12, 0.24, 0.44, 0.34, C.white)
  f.box(-0.125, 0.2, 0.16, 0.25, 0.14, 0.26, C.accent)
  f.box(-0.2, 0.26, 0.0, 0.4, 0.04, 0.05, C.dark)
  for (const s of [-1, 1]) f.box(s * 0.2 - 0.05, 0.25, -0.03, 0.1, 0.03, 0.1, C.dark)
  f.box(-0.03, 0.06, -0.4, 0.06, 0.56, 0.06, C.steel)
  f.box(-0.12, 0.62, -0.5, 0.24, 0.06, 0.26, C.dark)
  f.box(-0.03, 0.5, 0.36, 0.06, 0.52, 0.06, C.steel)
  f.box(-0.26, 1.0, 0.33, 0.52, 0.04, 0.06, C.steel)
  const p = f.frame(0, 1.04, 0.36, 0, -0.6)
  p.box(-0.13, 0, -0.02, 0.26, 0.17, 0.04, C.screenBody)
  p.box(-0.11, 0.02, -0.024, 0.22, 0.13, 0.003, C.screen, BULB)
  p.box(-0.08, 0.1, -0.026, 0.12, 0.02, 0.002, C.ui[1], BULB)
}

// Teleskop; tüp yerel +z'ye (pencereye) doğru hafif yukarı bakar.
export function telescope(f) {
  // ayaklar 0.3 yarıçaptan tepede birleşir
  for (const a of [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]) {
    const leg = f.frame(Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3, a, -0.29)
    leg.box(-0.015, 0, -0.015, 0.03, 1.05, 0.03, C.steelDark)
  }
  f.box(-0.05, 1.02, -0.05, 0.1, 0.1, 0.1, C.trim)
  const tube = f.frame(0, 1.15, 0, 0, -0.32)
  tube.box(-0.07, -0.07, -0.42, 0.14, 0.14, 0.82, C.white)
  tube.box(-0.085, -0.085, 0.3, 0.17, 0.17, 0.14, C.trim)
  tube.box(-0.06, -0.06, 0.441, 0.12, 0.12, 0.003, C.space, GLASS)
  tube.box(-0.03, -0.03, -0.52, 0.06, 0.06, 0.1, C.dark)
  tube.box(-0.02, 0.07, -0.12, 0.04, 0.05, 0.28, C.steelDark)
}

// Zemin penceresi (aşağıya bakan lomboz); orijin merkezi. Pahlı kasa, altında gezegenin kenarı ve
// yıldızlar, kenarda LED şerit ve iki tutamak. Üst yüzü mola halkasının altında kalır.
export function floorWindow(f, rnd) {
  const R = 0.7
  const y = 0.016
  f.box(-R - 0.1, 0, -R - 0.1, 2 * R + 0.2, y, 2 * R + 0.2, C.trim)
  f.box(-R, y, -R, 2 * R, 0.004, 2 * R, C.space, GLASS)
  const step = 0.1
  for (let x = -R; x < R - 1e-3; x += step) {
    const dx = x + step / 2 - 0.25
    const edge = 2.1 - Math.sqrt(1.85 * 1.85 - dx * dx)
    if (edge >= R) continue
    f.box(x, y + 0.004, edge, step, 0.002, R - edge, C.ocean, GLASS)
    f.box(x, y + 0.004, edge - 0.03, step, 0.002, 0.03, C.atmosphere, GLASS)
    if (rnd() < 0.4) f.box(x, y + 0.006, edge + 0.1 + rnd() * 0.2, step, 0.001, 0.05 + rnd() * 0.1, rnd() < 0.5 ? C.cloud : pick(rnd, C.land), GLASS)
  }
  for (let i = 0; i < 12; i++) {
    const x = -R + 0.05 + rnd() * (2 * R - 0.1)
    const z = -R + 0.05 + rnd() * 0.7
    f.box(x, y + 0.004, z, 0.02, 0.002, 0.02, pick(rnd, C.stars), GLASS)
  }
  for (const [x, z] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
    f.box(x - 0.15, y, z - 0.15, 0.3, 0.008, 0.3, C.trim, { rot: [0, Math.PI / 4, 0] })
  }
  for (const s of [-1, 1]) {
    f.box(-R + 0.26, y, s * (R + 0.04) - 0.012, 2 * R - 0.52, 0.008, 0.024, C.led, BULB)
    f.box(s * (R + 0.04) - 0.012, y, -R + 0.26, 0.024, 0.008, 2 * R - 0.52, C.led, BULB)
    const h = f.frame(s * (R + 0.2), 0, 0)
    for (const z of [-0.2, 0.2]) h.box(-0.02, 0, z - 0.02, 0.04, 0.12, 0.04, C.steelDark)
    h.box(-0.025, 0.12, -0.24, 0.05, 0.04, 0.48, C.handrail)
  }
}
