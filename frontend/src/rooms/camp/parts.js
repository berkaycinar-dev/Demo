import { pick } from '../core/voxel'

// Göl kenarında gece kampı temasının voxel parçaları. Birim ≈ 1 metre.
// Her parça bir çerçeveye (f) çizilir; aksi belirtilmedikçe orijin parçanın zemindeki merkezi,
// ön yüzü yerel +z yönüdür. Açıklık [0, width] x [0, depth]; solunda göl (x < 0), arkasında
// orman şeridi (z < 0) vardır.

export const FLOOR_BOTTOM = -0.42
export const SHORE = 1.0
export const FOREST = 0.7
export const SEAT_HEIGHT = 0.42
export const SKY_TOP = 3.6
const WATER_LEVEL = -0.1
const GLASS = { layer: 'glass' }
const BULB = { layer: 'bulb' }
const NIGHT = { layer: 'night' }
// RoomCanvas ile aynı kamera yükseklik açısı; yıldızları kadraja sığdırmak için.
const ELEVATION = (33 * Math.PI) / 180

export const C = {
  grass: ['#6f9a4a', '#77a352', '#68924a', '#7eaa58', '#6a9446'],
  dirt: ['#9c7a52', '#a6835a', '#93714b', '#ab8a62'],
  soil: '#6e4e34',
  soilDark: '#5a3f2a',
  rock: ['#8d9196', '#7d8186', '#9da1a5', '#73777c'],
  rockDark: '#585c61',
  sand: ['#d8c59a', '#cfbb8e', '#e0cfa6'],
  water: '#4f93b8',
  waterLight: '#8cc3dc',
  bark: '#6b4a32',
  barkDark: '#553a27',
  woodCut: '#d9b27c',
  woodRing: '#b98c58',
  plank: ['#a8794e', '#9a6d45', '#b3845a'],
  pine: ['#2f5d3a', '#356843', '#2a5434', '#3b7049'],
  pineLight: '#467d52',
  birchBark: '#ece8df',
  birchMark: '#2e2e2e',
  birchLeaf: ['#8fbf55', '#9ccb60', '#7fb04c'],
  bush: ['#4f7f3f', '#5e8f48', '#466f39'],
  flowers: ['#f2d14a', '#e8566b', '#f4f1e8', '#9b7fc4'],
  mushroomCap: '#c8432f',
  mushroomDot: '#f6efe4',
  mushroomStem: '#efe6d2',
  reed: '#7f9a4f',
  cattail: '#6b4a2e',
  lilyPad: '#5f9a4a',
  ash: '#4a4644',
  charcoal: '#2b2826',
  ember: ['#ff7a1a', '#ffb02e'],
  tents: { orange: '#e07a3a', green: '#4f8a5b', blue: '#3d7ea6', yellow: '#e2b43c', red: '#c8453b' },
  tentDark: '#2a2a2e',
  fabric: ['#3d7ea6', '#c8453b', '#4f8a5b', '#e2b43c'],
  metal: '#3a3d42',
  steel: '#c5c9ce',
  enamel: ['#2f6aa3', '#c8453b', '#4f8a5b'],
  enamelRim: '#f4f2ee',
  cooler: '#3d7ea6',
  white: '#f4f2ee',
  canoe: '#d9622b',
  canoeInner: '#e9b77d',
  rope: '#cdb48a',
  hammock: ['#e07a3a', '#f2d14a', '#3d7ea6', '#f4f1e8'],
  sign: '#a8794e',
  ink: '#3b2a1c',
  bread: '#c98a4b',
  marshmallow: '#fbf6ee',
  star: ['#ffffff', '#fff3c4', '#cfe0ff'],
  moon: '#f6f2d8',
  moonGlade: '#f3e7b0',
}

// Sekizgene yakın gövde: düz kutu + 45° dönük küçük kutu (kütük, taş, kazan).
function oct(f, y, size, h, color, layer) {
  f.box(-size / 2, y, -size / 2, size, h, size, color, { layer })
  const s = size * 0.76
  f.box(-s / 2, y, -s / 2, s, h, s, color, { layer, rot: [0, Math.PI / 4, 0] })
}

// ---------------------------------------------------------------- zemin, göl, orman

// Açıklık ve orman şeridi çimen, clearings ([x, z, r]) içi toprak; altında toprak ve kaya
// katmanları (diorama kesiti). Solda göl: taban, su, yüzeyde ışıltı çizgileri.
export function ground(f, width, depth, rnd, clearings) {
  const z0 = -FOREST
  f.box(-SHORE, FLOOR_BOTTOM, z0, width + SHORE, 0.14, depth - z0, C.rockDark)
  f.box(0, FLOOR_BOTTOM + 0.14, z0, width, -0.06 - FLOOR_BOTTOM - 0.14, depth - z0, C.soil)
  const tile = 0.5
  for (let x = 0; x < width - 1e-3; x += tile) {
    for (let z = z0; z < depth - 1e-3; z += tile) {
      const w = Math.min(tile, width - x)
      const d = Math.min(tile, depth - z)
      const dirt = clearings.some(([cx, cz, r]) => Math.hypot(x + w / 2 - cx, z + d / 2 - cz) < r)
      f.box(x, -0.06, z, w, 0.06, d, pick(rnd, dirt ? C.dirt : C.grass))
    }
  }
  f.box(-SHORE, FLOOR_BOTTOM + 0.14, z0, SHORE, 0.1, depth - z0, C.soilDark)
  f.box(-SHORE, FLOOR_BOTTOM + 0.24, z0, SHORE, WATER_LEVEL - FLOOR_BOTTOM - 0.24, depth - z0, C.water, GLASS)
  for (let i = 0; i < (depth - z0) * 2.5; i++) {
    const w = 0.08 + rnd() * 0.2
    f.box(-SHORE + 0.05 + rnd() * (SHORE - 0.35), WATER_LEVEL, z0 + rnd() * (depth - z0 - w), 0.01 + rnd() * 0.03, 0.002, w, C.waterLight, GLASS)
  }
}

// Kıyı: suya taşan taşlar, sazlık ve nilüferler; x = 0 boyunca.
export function shoreline(f, depth, rnd, skip = []) {
  const free = (z) => skip.every(([a, b]) => z < a || z > b)
  for (let z = -FOREST + 0.2; z < depth - 0.1; z += 0.35 + rnd() * 0.3) {
    if (!free(z)) continue
    const s = 0.12 + rnd() * 0.14
    f.box(-0.12 - rnd() * 0.12, WATER_LEVEL - 0.05, z, s, 0.1 + rnd() * 0.06, s, pick(rnd, C.rock), { rot: [0, rnd(), 0] })
    if (rnd() < 0.5) reeds(f.frame(-0.25 - rnd() * 0.2, WATER_LEVEL, z + 0.15), rnd)
  }
  for (let i = 0; i < depth / 2; i++) {
    const z = rnd() * (depth - 0.4) + 0.2
    if (!free(z)) continue
    f.box(-0.75 + rnd() * 0.35, WATER_LEVEL, z, 0.16, 0.004, 0.16, C.lilyPad, { rot: [0, rnd(), 0] })
  }
}

function reeds(f, rnd) {
  for (let i = 0; i < 5; i++) {
    const x = (rnd() - 0.5) * 0.2
    const z = (rnd() - 0.5) * 0.2
    const h = 0.4 + rnd() * 0.35
    f.box(x, 0, z, 0.02, h, 0.02, C.reed, { rot: [(rnd() - 0.5) * 0.2, 0, (rnd() - 0.5) * 0.2] })
    if (i < 2) f.box(x - 0.01, h - 0.12, z - 0.01, 0.04, 0.1, 0.04, C.cattail)
  }
}

// Arkadaki orman şeridi: çamlar, arada huş, çalı ve taşlar.
export function forest(root, width, rnd) {
  let x = 0.25
  while (x < width - 0.2) {
    const z = -0.4 + (rnd() - 0.5) * 0.3
    if (rnd() < 0.3) birch(root.frame(x, 0, z), rnd, 2.2 + rnd() * 0.5)
    else pine(root.frame(x, 0, z), rnd, 2.2 + rnd() * 0.8)
    if (rnd() < 0.6) bush(root.frame(x + 0.4, 0, 0.05 + rnd() * 0.15), rnd)
    if (rnd() < 0.25) rock(root.frame(x + 0.35, 0, -0.05), rnd)
    x += 0.85 + rnd() * 0.4
  }
}

// Katmanlı çam; orijin gövde dibi.
export function pine(f, rnd, height = 3) {
  const h = height
  f.box(-0.08, 0, -0.08, 0.16, h * 0.3, 0.16, C.bark)
  for (let i = 0; i < 4; i++) {
    const s = (0.95 - i * 0.2) * (h / 3)
    f.box(-s / 2, h * (0.18 + i * 0.18), -s / 2, s, h * 0.22, s, pick(rnd, C.pine), { rot: [0, i % 2 ? Math.PI / 4 : 0, 0] })
  }
  f.box(-0.08, h * 0.88, -0.08, 0.16, h * 0.12, 0.16, C.pineLight)
}

// Huş: beyaz gövdede kara izler, açık yeşil yuvarlak taç.
export function birch(f, rnd, height = 2.6) {
  f.box(-0.06, 0, -0.06, 0.12, height * 0.78, 0.12, C.birchBark)
  for (let i = 0; i < 4; i++) {
    const y = 0.3 + i * height * 0.15
    f.box(-0.04 + (i % 2) * 0.04, y, 0.06, 0.05, 0.025, 0.004, C.birchMark)
    f.box(0.06, y + 0.12, -0.03 + (i % 2) * 0.03, 0.004, 0.025, 0.05, C.birchMark)
  }
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2
    const r = rnd() * 0.35
    const s = 0.35 + rnd() * 0.25
    f.box(Math.sin(a) * r - s / 2, height * 0.62 + rnd() * height * 0.25, Math.cos(a) * r - s / 2, s, s * 0.8, s, pick(rnd, C.birchLeaf))
  }
}

export function bush(f, rnd) {
  for (let i = 0; i < 3; i++) {
    const s = 0.22 + rnd() * 0.18
    f.box(-s / 2 + (rnd() - 0.5) * 0.25, 0, -s / 2 + (rnd() - 0.5) * 0.2, s, s * 0.8, s, pick(rnd, C.bush))
  }
  if (rnd() < 0.4) f.box(-0.03, 0.2, 0.08, 0.05, 0.05, 0.05, pick(rnd, C.flowers))
}

export function rock(f, rnd) {
  const s = 0.2 + rnd() * 0.2
  f.box(-s / 2, 0, -s / 2, s, s * 0.6, s * 0.8, pick(rnd, C.rock), { rot: [0, rnd() * 1.5, 0] })
  f.box(-s / 4 + 0.08, 0, -s / 4, s / 2, s * 0.35, s / 2, pick(rnd, C.rock), { rot: [0, rnd(), 0] })
}

// Kırmızı benekli mantar öbeği ve çiçekler.
export function mushrooms(f, rnd) {
  for (let i = 0; i < 3; i++) {
    const x = (rnd() - 0.5) * 0.3
    const z = (rnd() - 0.5) * 0.3
    const h = 0.06 + rnd() * 0.06
    f.box(x - 0.015, 0, z - 0.015, 0.03, h, 0.03, C.mushroomStem)
    f.box(x - 0.045, h, z - 0.045, 0.09, 0.035, 0.09, C.mushroomCap)
    f.box(x - 0.015, h + 0.035, z - 0.02, 0.02, 0.003, 0.02, C.mushroomDot)
  }
  for (let i = 0; i < 4; i++) {
    const x = (rnd() - 0.5) * 0.5
    const z = (rnd() - 0.5) * 0.5
    f.box(x, 0, z, 0.012, 0.1, 0.012, C.reed)
    f.box(x - 0.02, 0.1, z - 0.02, 0.05, 0.03, 0.05, pick(rnd, C.flowers))
  }
}

// ---------------------------------------------------------------- gece gökyüzü

// Ormanın ve gölün üstünde kalan yıldızlar ve ay (night katmanı; yalnızca akşam/gece görünür).
// Yükseklikler izometrik kadrajın üst sınırını aşmayacak şekilde hesaplanır. Yıldızların bir
// kısmı room.twinkles'a gider ve NightLifeEffect'te parıldar.
export function nightSky(root, width, depth, rnd, room) {
  const k = Math.sin(ELEVATION) * Math.SQRT1_2
  const cos = Math.cos(ELEVATION)
  // ekranda yukarı yön: y * cos - (x + z) * k; kadrajın üstü sınırların sol-arka-üst köşesi
  const frameTop = SKY_TOP * cos - (-SHORE - FOREST) * k - 0.15
  const yMax = (x, z) => (frameTop + (x + z) * k) / cos

  const star = (x, y, z, plane) => {
    const s = 0.025 + rnd() * 0.03
    const box = plane === 'back' ? [x, y, z, s, s, 0.004] : [x, y, z, 0.004, s, s]
    if (rnd() < 0.2) {
      room.twinkles.push({ center: [box[0] + box[3] / 2, box[1] + box[4] / 2, box[2] + box[5] / 2], size: box.slice(3), color: pick(rnd, C.star), phase: rnd(), rate: 0.15 + rnd() * 0.25 })
    } else {
      root.box(...box, pick(rnd, C.star), NIGHT)
    }
  }
  const zBack = -FOREST - 0.6
  for (let i = 0; i < width * 5; i++) {
    const x = -SHORE + rnd() * (width + SHORE)
    const top = yMax(x, zBack)
    if (top > 2.9) star(x, 2.9 + rnd() * (top - 2.9), zBack, 'back')
  }
  const xLeft = -SHORE - 0.6
  for (let i = 0; i < depth * 4; i++) {
    const z = -FOREST + rnd() * (depth + FOREST - 0.9)
    const top = yMax(xLeft, z)
    if (top > 0.9) star(xLeft, 0.9 + rnd() * (top - 0.9), z, 'left')
  }
  // ay sol düzlemde; altında gölde yakamoz
  const mz = depth * 0.3
  const my = yMax(xLeft, mz) - 0.45
  root.box(xLeft, my - 0.1, mz - 0.15, 0.004, 0.2, 0.3, C.moon, NIGHT)
  root.box(xLeft, my - 0.15, mz - 0.1, 0.004, 0.3, 0.2, C.moon, NIGHT)
  for (let i = 0; i < 6; i++) {
    const w = 0.05 + i * 0.03
    root.box(-SHORE + 0.05 + i * 0.13, WATER_LEVEL + 0.002, mz - w / 2 + (rnd() - 0.5) * 0.05, 0.1, 0.002, w, C.moonGlade, NIGHT)
  }
}

// ---------------------------------------------------------------- kamp ateşi ve oturaklar

// Taş çemberli kamp ateşi: kül yatağı, çatılmış odunlar, korlar. Alev, kıvılcım ve ışık
// CampfireEffect'te; ateşin orijini room.fires'a eklenir. tripod: üstte asılı çaydanlık.
export function campfire(f, rnd, room, { tripod = false, marshmallow = false } = {}) {
  oct(f, 0, 0.62, 0.02, C.ash)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const s = f.frame(Math.sin(a) * 0.4, 0, Math.cos(a) * 0.4, a)
    s.box(-0.09, 0, -0.07, 0.18, 0.1 + rnd() * 0.05, 0.14, pick(rnd, C.rock))
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4
    f.frame(Math.sin(a) * 0.22, 0.02, Math.cos(a) * 0.22, a, -0.52).box(-0.035, 0, -0.035, 0.07, 0.44, 0.07, i % 2 ? C.bark : C.barkDark)
  }
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2
    const r = rnd() * 0.16
    f.box(Math.sin(a) * r - 0.025, 0.02, Math.cos(a) * r - 0.025, 0.05, 0.025, 0.05, pick(rnd, C.ember), BULB)
  }
  if (tripod) {
    const apex = 1.25
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.3
      f.frame(Math.sin(a) * 0.62, 0, Math.cos(a) * 0.62, a, -0.46).box(-0.025, 0, -0.025, 0.05, 1.38, 0.05, C.barkDark)
    }
    f.box(-0.006, 0.86, -0.006, 0.012, apex - 0.86, 0.012, C.metal)
    const k = f.frame(0, 0.72, 0)
    oct(k, 0, 0.18, 0.14, C.metal)
    k.box(-0.06, 0.14, -0.06, 0.12, 0.02, 0.12, C.metal)
    k.box(0.09, 0.05, -0.012, 0.08, 0.025, 0.024, C.metal, { rot: [0, 0, 0.6] })
    k.box(-0.09, 0.14, -0.005, 0.18, 0.01, 0.01, C.steel)
  }
  if (marshmallow) {
    // taş çemberin dışından ateşe uzanan çubuk, ucunda marşmelov
    f.frame(0.75, 0.05, 0.2, Math.PI - 0.26, 0, 0.35).box(0, -0.008, -0.008, 0.6, 0.016, 0.016, C.bark)
    f.box(0.195, 0.235, 0.035, 0.05, 0.05, 0.05, C.marshmallow)
  }
  room.fires.push(f.point(0, 0.03, 0).toArray())
}

// Ağaç kütüğü tabure; üstte yıllık halkaları.
export function stump(f) {
  oct(f, 0, 0.4, SEAT_HEIGHT - 0.01, C.bark)
  oct(f, SEAT_HEIGHT - 0.01, 0.34, 0.012, C.woodCut)
  oct(f, SEAT_HEIGHT + 0.002, 0.18, 0.004, C.woodRing)
  for (const [x, z] of [[-0.22, 0.05], [0.18, -0.12]]) f.box(x, 0, z, 0.06, 0.06, 0.08, C.barkDark)
}

// Yatay kütük bank (iki kişilik); kütük yerel x boyunca, iki takozun üstünde.
export function logBench(f, rnd) {
  const L = 1.1
  for (const x of [-0.38, 0.32]) f.box(x, 0, -0.14, 0.06, 0.14, 0.28, C.barkDark)
  const r = 0.14
  const y = SEAT_HEIGHT - r
  f.box(-L / 2, y - r, -r, L, 2 * r, 2 * r, C.bark)
  f.box(-L / 2, y - r * 0.7, -r * 0.7, L, 1.4 * r, 1.4 * r, C.bark, { rot: [Math.PI / 4, 0, 0] })
  f.box(-L / 2 + 0.05, y + r - 0.004, -r + 0.06, L - 0.1, 0.008, 2 * r - 0.12, C.woodCut)
  for (const x of [-L / 2 - 0.004, L / 2 - 0.004]) {
    f.box(x, y - r + 0.03, -r + 0.03, 0.008, 2 * r - 0.06, 2 * r - 0.06, C.woodCut)
    f.box(x - 0.001, y - 0.04, -0.04, 0.01, 0.08, 0.08, C.woodRing)
  }
  if (rnd() < 0.5) f.box(-0.2, y + r - 0.02, r - 0.03, 0.08, 0.06, 0.05, C.barkDark)
}

// Katlanır kamp sandalyesi: çapraz ayaklar, kumaş oturak ve sırt, kolçakta bardaklık.
export function campChair(f, rnd) {
  const fabric = pick(rnd, C.fabric)
  for (const x of [-0.24, 0.21]) {
    f.frame(x, 0.2, 0, 0, 0.6).box(0, -0.25, -0.012, 0.025, 0.5, 0.025, C.metal)
    f.frame(x, 0.2, 0, 0, -0.6).box(0, -0.25, -0.012, 0.025, 0.5, 0.025, C.metal)
    f.box(x, 0.58, -0.2, 0.03, 0.03, 0.36, fabric)
  }
  f.box(-0.22, SEAT_HEIGHT - 0.04, -0.2, 0.44, 0.05, 0.4, fabric)
  f.frame(0, SEAT_HEIGHT, -0.2, 0, -0.18).box(-0.22, 0, -0.03, 0.44, 0.48, 0.04, fabric)
  f.frame(0, SEAT_HEIGHT, -0.2, 0, -0.18).box(-0.22, 0.38, -0.035, 0.44, 0.06, 0.045, C.metal)
  f.box(0.22, 0.6, 0.06, 0.07, 0.06, 0.07, C.metal)
}

// ---------------------------------------------------------------- çadırlar ve kamp eşyası

// Çatı çadırı (üçgen kesit): iki eğimli yüz, önde açık kapı ve toplanmış kapak, ip ve kazıklar.
export function ridgeTent(f, color) {
  const w = 0.68
  const H = 1.08
  const D = 1.6
  const lean = Math.atan2(w, H)
  const L = Math.hypot(w, H)
  const dark = C.tentDark
  f.box(-w - 0.05, 0, -D / 2 - 0.05, 2 * w + 0.1, 0.012, D + 0.1, C.soilDark)
  for (const s of [-1, 1]) {
    f.box(s * w * 0.5 - 0.025, H / 2 - L / 2, -D / 2, 0.05, L, D, color, { rot: [0, 0, s * lean] })
  }
  // ön ve arka üçgenler basamaklı şeritlerle; önde koyu kapı aralığı
  const n = 8
  for (let i = 0; i < n; i++) {
    const y = (i * H) / n
    const half = w * (1 - (i + 1) / n)
    if (half <= 0.01) continue
    f.box(-half, y, -D / 2 + 0.02, 2 * half, H / n, 0.03, color)
    const door = i < 5 ? half * 0.55 : 0
    if (door > 0) {
      f.box(-half, y, D / 2 - 0.05, half - door, H / n, 0.03, color)
      f.box(door, y, D / 2 - 0.05, half - door, H / n, 0.03, color)
      f.box(-door, y, D / 2 - 0.2, 2 * door, H / n, 0.03, dark)
    } else {
      f.box(-half, y, D / 2 - 0.05, 2 * half, H / n, 0.03, color)
    }
  }
  f.box(-0.3, 0.6, D / 2 - 0.02, 0.12, 0.08, 0.06, color)
  f.box(-0.025, H - 0.02, -D / 2 - 0.06, 0.05, 0.05, D + 0.12, C.metal)
  // gergi ipleri sırtın uçlarından önde ve arkada kazıklara iner
  const out = 0.3
  for (const z of [-1, 1]) {
    f.frame(0, H, z * D / 2, z > 0 ? 0 : Math.PI, Math.atan2(H, out)).box(-0.004, -0.004, 0, 0.008, 0.008, Math.hypot(H, out), C.rope)
    f.box(-0.02, 0, z * (D / 2 + out) - 0.02, 0.04, 0.07, 0.04, C.metal)
  }
}

// Kubbe çadır: kat kat daralan gövde, önde kapı, üstte çapraz direkler.
export function domeTent(f, color) {
  // ince katlar: [y, yükseklik, genişlik]; üste doğru yuvarlanarak daralır
  const tiers = [[0, 0.22, 1.4], [0.22, 0.2, 1.36], [0.42, 0.16, 1.24], [0.58, 0.14, 1.06], [0.72, 0.1, 0.82], [0.82, 0.08, 0.52]]
  oct(f, 0, 1.5, 0.012, C.soilDark)
  for (const [y, h, size] of tiers) oct(f, y, size, h, color)
  f.box(-0.23, 0, 0.6, 0.46, 0.5, 0.11, C.tentDark)
  f.box(-0.28, 0.5, 0.58, 0.56, 0.07, 0.11, color)
  // çapraz direkler: köşegen boyunca her katın dış kenarını izler (sekizgenin köşegen yarıçapı
  // kenar uzunluğunun ~0.71'i)
  for (const yaw of [Math.PI / 4, -Math.PI / 4]) {
    const p = f.frame(0, 0, 0, yaw)
    for (const [y, h, size] of tiers) {
      for (const z of [-1, 1]) p.box(-0.015, y, z * size * 0.71 - 0.015, 0.03, h, 0.03, C.metal)
    }
    p.box(-0.015, 0.9, -0.37, 0.03, 0.02, 0.74, C.metal)
  }
}

// Asma kamp feneri direği (çoban değneği biçimi); fener ışığı room.lights'a, altına ışık havuzu.
export function lanternPole(f, room) {
  const H = 1.9
  f.box(-0.03, 0, -0.03, 0.06, H, 0.06, C.metal)
  f.box(-0.03, H - 0.03, -0.03, 0.06, 0.03, 0.36, C.metal)
  f.box(-0.03, H - 0.15, 0.3, 0.06, 0.12, 0.03, C.metal)
  const l = f.frame(0, H - 0.47, 0.31)
  l.box(-0.08, 0, -0.08, 0.16, 0.04, 0.16, C.metal)
  l.box(-0.06, 0.04, -0.06, 0.12, 0.17, 0.12, '#ffffff', BULB)
  for (const [x, z] of [[-0.07, -0.07], [0.05, -0.07], [-0.07, 0.05], [0.05, 0.05]]) l.box(x, 0.04, z, 0.02, 0.17, 0.02, C.metal)
  l.box(-0.08, 0.21, -0.08, 0.16, 0.04, 0.16, C.metal)
  l.box(-0.005, 0.25, -0.05, 0.01, 0.07, 0.1, C.metal)
  f.glow(-0.65, 0.004, -0.34, 1.3, 1.3)
  room.lights.push(f.point(0, H - 0.35, 0.31).toArray())
}

// Piknik masası (sabit oturaklı); üstte kamp ocağı ve tencere, emaye kupalar, ekmek.
export function picnicTable(f, rnd) {
  const L = 1.5
  const H = 0.74
  for (const x of [-L / 2 + 0.18, L / 2 - 0.24]) {
    for (const s of [-1, 1]) f.frame(x + 0.03, H / 2, 0, 0, s * 0.42).box(-0.03, -H / 2 - 0.06, -0.03, 0.06, H + 0.08, 0.06, C.plank[1])
    f.box(x, 0.4, -0.66, 0.06, 0.04, 1.32, C.plank[1])
  }
  for (let i = 0; i < 4; i++) f.box(-L / 2, H - 0.04, -0.38 + i * 0.19, L, 0.04, 0.17, C.plank[i % 3])
  for (const z of [-0.66, 0.46]) {
    for (let i = 0; i < 2; i++) f.box(-L / 2, 0.44, z + i * 0.1, L, 0.035, 0.09, C.plank[(i + 1) % 3])
  }
  const top = H
  f.box(-0.5, top, -0.15, 0.3, 0.08, 0.22, C.metal)
  f.box(-0.45, top + 0.08, -0.1, 0.2, 0.01, 0.12, C.steel)
  oct(f.frame(-0.35, top + 0.09, -0.04), 0, 0.18, 0.12, C.steel)
  for (const [x, z] of [[0.05, 0.18], [0.3, -0.05], [0.5, 0.2]]) {
    f.box(x, top, z, 0.08, 0.09, 0.08, pick(rnd, C.enamel))
    f.box(x, top + 0.085, z, 0.08, 0.01, 0.08, C.enamelRim)
    f.box(x + 0.08, top + 0.02, z + 0.025, 0.025, 0.05, 0.03, C.enamelRim)
  }
  f.box(0.15, top, -0.3, 0.3, 0.02, 0.16, C.plank[2])
  f.box(0.18, top + 0.02, -0.28, 0.2, 0.08, 0.11, C.bread)
}

// Odun yığını ve üstünde balta saplanmış kesme kütüğü; yığın yerel x boyunca.
export function woodpile(f, rnd) {
  const rows = [4, 3, 2]
  rows.forEach((count, row) => {
    for (let i = 0; i < count; i++) {
      const z = (i - (count - 1) / 2) * 0.17
      const y = row * 0.15
      f.box(-0.45, y, z - 0.075, 0.9, 0.15, 0.15, pick(rnd, [C.bark, C.barkDark]))
      for (const x of [-0.452, 0.444]) f.box(x, y + 0.025, z - 0.05, 0.008, 0.1, 0.1, C.woodCut)
    }
  })
  const s = f.frame(0.8, 0, 0.1)
  oct(s, 0, 0.42, 0.34, C.bark)
  oct(s, 0.34, 0.36, 0.01, C.woodCut)
  s.frame(0, 0.35, 0, 0.5, 0, 0.45).box(-0.02, 0, -0.015, 0.04, 0.5, 0.03, C.woodCut)
  s.frame(0, 0.35, 0, 0.5, 0, 0.45).box(-0.06, -0.02, -0.01, 0.12, 0.08, 0.02, C.steel)
}

export function cooler(f) {
  f.box(-0.28, 0, -0.18, 0.56, 0.34, 0.36, C.cooler)
  f.box(-0.29, 0.34, -0.19, 0.58, 0.07, 0.38, C.white)
  f.box(-0.12, 0.41, -0.02, 0.24, 0.03, 0.04, C.metal)
  f.box(-0.2, 0.12, 0.18, 0.4, 0.06, 0.005, C.white)
}

// Sırt çantası, üstünde rulo uyku tulumu; sırtı -z tarafında.
export function backpack(f, rnd) {
  const color = pick(rnd, C.fabric)
  f.frame(0, 0, 0, 0, -0.15).box(-0.17, 0, -0.12, 0.34, 0.5, 0.24, color)
  f.box(-0.13, 0.08, 0.1, 0.26, 0.2, 0.08, C.tentDark)
  f.box(-0.2, 0.48, -0.12, 0.4, 0.13, 0.13, pick(rnd, C.fabric))
}

// İskele: kıyıdan göle uzanan tahtalar, kazıklar, uçta olta ve kova; orijin kıyı (x = 0).
export function dock(f, rnd) {
  const width = 0.9
  const from = 0.35
  const to = -SHORE + 0.12
  for (let x = to; x < from; x += 0.16) f.box(x, 0.02, -width / 2, 0.14, 0.04, width, pick(rnd, C.plank))
  for (const x of [to, to + 0.45, -0.05]) {
    for (const z of [-width / 2 - 0.02, width / 2 - 0.06]) f.box(x, FLOOR_BOTTOM + 0.24, z, 0.08, 0.16 - FLOOR_BOTTOM - 0.24, 0.08, C.barkDark)
  }
  f.box(to, 0.06, -width / 2 - 0.02, from - to, 0.04, 0.05, C.barkDark)
  f.box(to + 0.1, 0.06, width / 2 - 0.12, 0.2, 0.15, 0.2, C.metal)
  f.box(to + 0.12, 0.21, width / 2 - 0.1, 0.16, 0.01, 0.16, C.water, GLASS)
  // iskele boyunca yatırılmış olta (göl kesitinin dışına taşmasın)
  f.frame(to + 0.3, 0.06, 0.3, Math.PI / 2, 0, 0.9).box(0, 0, -0.008, 1.0, 0.016, 0.016, C.metal)
  f.box(to + 0.26, 0.06, 0.26, 0.08, 0.08, 0.08, C.metal)
}

// Kıyıya çekilmiş kano ve kürek; kano yerel x boyunca.
export function canoe(f) {
  const segs = [[-0.75, 0.16, 0.12], [-0.55, 0.3, 0.18], [-0.3, 0.38, 0.22], [0.3, 0.38, 0.22], [0.55, 0.3, 0.18]]
  for (let i = 0; i < segs.length; i++) {
    const [x, w, h] = segs[i]
    const next = i < segs.length - 1 ? segs[i + 1][0] : 0.75
    f.box(x, 0, -w / 2, next - x, h, w, C.canoe)
    if (w > 0.2) f.box(x + 0.02, h - 0.005, -w / 2 + 0.04, next - x - 0.04, 0.01, w - 0.08, C.canoeInner)
  }
  f.box(0.75, 0, -0.08, 0.12, 0.1, 0.16, C.canoe)
  f.box(-0.85, 0, -0.06, 0.1, 0.1, 0.12, C.canoe)
  for (const x of [-0.25, 0.25]) f.box(x, 0.16, -0.18, 0.06, 0.03, 0.36, C.plank[0])
  f.frame(0.1, 0.24, 0.05, 0.4).box(-0.6, 0, -0.015, 0.9, 0.025, 0.03, C.plank[2])
  f.frame(0.1, 0.24, 0.05, 0.4).box(0.3, -0.005, -0.06, 0.28, 0.03, 0.12, C.plank[2])
}

// İki huş arasında çizgili hamak; ağaçlar yerel x = ±1.3.
export function hammock(f, rnd) {
  for (const x of [-1.3, 1.3]) birch(f.frame(x, 0, 0), rnd, 2.6)
  const sag = (t) => 1.2 - 0.55 * 4 * t * (1 - t)
  const n = 10
  for (let i = 0; i < n; i++) {
    const t0 = i / n
    const t1 = (i + 1) / n
    const x0 = -1.0 + 2 * t0
    const x1 = -1.0 + 2 * t1
    const y0 = sag(t0)
    const y1 = sag(t1)
    const len = Math.hypot(x1 - x0, y1 - y0)
    f.frame((x0 + x1) / 2, (y0 + y1) / 2, 0, 0, 0, Math.atan2(y1 - y0, x1 - x0)).box(-len / 2 - 0.005, -0.015, -0.3, len + 0.01, 0.03, 0.6, C.hammock[i % C.hammock.length])
  }
  for (const s of [-1, 1]) {
    f.frame(s * 1.0, 1.2, 0, 0, 0, s > 0 ? 0.35 : -0.35).box(s > 0 ? 0 : -0.3, -0.006, -0.006, 0.3, 0.012, 0.012, C.rope)
  }
  f.box(-0.85, 1.05, -0.2, 0.3, 0.1, 0.35, C.white, { rot: [0, 0, 0.5] })
}

// Yön tabelası: dikme ve farklı yönleri gösteren tahta oklar.
export function signpost(f) {
  f.box(-0.04, 0, -0.04, 0.08, 1.45, 0.08, C.barkDark)
  for (const [y, yaw, w] of [[1.25, 0.3, 0.55], [1.05, -0.6, 0.5], [0.85, 0.9, 0.45]]) {
    const a = f.frame(0, y, 0, yaw)
    a.box(-0.05, 0, 0.045, w, 0.13, 0.03, C.sign)
    a.box(w - 0.05, 0.02, 0.045, 0.08, 0.09, 0.03, C.sign, { rot: [0, 0, Math.PI / 4] })
    a.box(0.02, 0.05, 0.076, w * 0.6, 0.025, 0.002, C.ink)
  }
}
