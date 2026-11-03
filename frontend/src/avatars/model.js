import { Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import {
  CLOTH_COLORS,
  DEFAULT_AVATAR,
  EAR_COVERING,
  EYE_COLORS,
  HAIR_COLORS,
  HEADPHONE_HATS,
  METALS,
  SHOE_COLORS,
  SKIN_TONES,
  colorOf,
} from './options'

// Voxel avatar: kutulardan oluşan, kemiklere bağlı parçalar. Ölçüler aşağıda tasarım biriminde
// yazılır ve SCALE ile küçültülür; ayakta boy ~1.2 m. Avatar +z yönüne bakar; sağ eli -x, sol eli
// +x tarafındadır. Kemikler ebeveynden önce gelir; pivot ebeveyne göre eklem noktasıdır. Pozlar
// (poses.js) her kemiğe [rx, ry, rz] dönüşü verir.
export const SCALE = 0.85
const RAW_BONES = [
  { name: 'hips', parent: -1, pivot: [0, 0.55, 0] },
  { name: 'torso', parent: 0, pivot: [0, 0.02, 0] },
  { name: 'head', parent: 1, pivot: [0, 0.44, 0] },
  { name: 'armL', parent: 1, pivot: [0.245, 0.38, 0] },
  { name: 'foreL', parent: 3, pivot: [0, -0.2, 0] },
  { name: 'armR', parent: 1, pivot: [-0.245, 0.38, 0] },
  { name: 'foreR', parent: 5, pivot: [0, -0.2, 0] },
  { name: 'thighL', parent: 0, pivot: [0.095, 0, 0] },
  { name: 'shinL', parent: 7, pivot: [0, -0.28, 0] },
  { name: 'thighR', parent: 0, pivot: [-0.095, 0, 0] },
  { name: 'shinR', parent: 9, pivot: [0, -0.28, 0] },
]
export const BONES = RAW_BONES.map((b) => ({ ...b, pivot: b.pivot.map((v) => v * SCALE) }))
export const BONE_INDEX = Object.fromEntries(BONES.map((b, i) => [b.name, i]))
// Kalça ekleminin yerden yüksekliği (ayakta).
export const HIP_HEIGHT = 0.55 * SCALE
// Başın tepesi, kökten (ayakta) yükseklik; etiketler bunun üstünde durur.
export const HEAD_TOP = 1.42 * SCALE
// Başın tepesi, baş kemiğine göre (ölçeklenmiş).
export const HEAD_CROWN = 0.5 * SCALE

// Elde tutulan ve giyilen eşyalar; parça yalnızca pozun istediği etiketle görünür.
export const PROPS = [
  'book', 'bookChest', 'tablet', 'pen', 'quill', 'mug', 'teaGlass', 'paperCup', 'simit', 'ramen', 'phone',
  'dart', 'cue', 'paddle', 'ladle', 'flask', 'vr', 'watering', 'rod', 'stone', 'newspaper',
]

// Kitap kapakları: herkesin kitabı farklı renkte olsun diye kişiye göre seçilir.
const BOOK_COVERS = ['#7a2a24', '#24503a', '#2a3556', '#8a5a1e', '#5a2a5e', '#1f5a66', '#a0522d', '#3d3d3d']
const MUG_COLORS = ['#f2efe8', '#d9534f', '#3a7bd5', '#f0ad4e', '#5cb85c', '#2a2a2e']

const mix = (a, b, k) => `#${new Color(a).lerp(new Color(b), k).getHexString()}`
const darker = (c, k = 0.28) => mix(c, '#000000', k)
const lighter = (c, k = 0.3) => mix(c, '#ffffff', k)

/**
 * Yapılandırmadan parça listesi: [{ bone, matrix, color, show? }]. matrix kemiğe göre kutunun
 * konumu, boyu (ve varsa dönüşü); show verilen parçalar yalnızca o eşya gösterilirken görünür.
 * options.props: kurulacak eşya etiketleri (verilmezse hepsi); options.seed: kitap ve kupa rengi.
 *
 * Üst üste binen yüzeyler aynı düzleme denk gelmez: her kaplama parçası altındaki yüzeyden en az
 * 4 mm dışarı taşar (z-fighting olmasın; avatars/README "Çakışma denetimi").
 */
export function buildAvatarParts(avatar, { props, seed = 0 } = {}) {
  const config = { ...DEFAULT_AVATAR, ...avatar }
  const skin = colorOf(SKIN_TONES, config.skin)
  const hair = colorOf(HAIR_COLORS, config.hairColor)
  const eye = colorOf(EYE_COLORS, config.eyes)
  const top = colorOf(CLOTH_COLORS, config.topColor)
  const bottom = colorOf(CLOTH_COLORS, config.bottomColor)
  const shoe = colorOf(SHOE_COLORS, config.shoes)
  const acc = colorOf(CLOTH_COLORS, config.accessoryColor)
  const hatColor = colorOf(CLOTH_COLORS, config.hatColor)
  const metal = colorOf(METALS, config.metal)
  const want = (p) => !props || props.has(p)
  const pickBy = (list, salt) => list[Math.abs(Math.floor(seed * 7919 + salt)) % list.length]
  const parts = []
  // başın (şapka, saç dahil) en üstü; etiket ve zZz bunun üstünde durur
  let crown = 0.5
  const scale = new Vector3()
  // c: kutu merkezi, s: boy (tasarım biriminde, kemiğe göre)
  const add = (bone, c, s, color, extra = {}) => {
    const q = extra.rot ? new Quaternion().setFromEuler(new Euler(...extra.rot)) : new Quaternion()
    const m = new Matrix4().compose(new Vector3(...c).multiplyScalar(SCALE), q, scale.set(...s).multiplyScalar(SCALE))
    parts.push({ bone: BONE_INDEX[bone], matrix: m, color, show: extra.show })
    if (bone === 'head' && !extra.show) crown = Math.max(crown, c[1] + s[1] / 2)
  }
  // min/max aralıklarıyla kutu
  const box = (bone, x, y, z, color, extra) => add(bone, [(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2], [x[1] - x[0], y[1] - y[0], z[1] - z[0]], color, extra)

  // ---------------- gövde ve kıyafet (gövde: x ±0.19, y 0..0.42, z ±0.11; kadında bel 0.33 geniş)
  const female = config.body === 'female'
  const waist = female ? 0.33 : 0.38
  const longSleeves = config.top !== 'tshirt'
  if (female) {
    add('torso', [0, 0.29, 0], [0.37, 0.26, 0.22], top)
    add('torso', [0, 0.085, 0], [waist, 0.17, 0.22], top)
  } else add('torso', [0, 0.21, 0], [0.38, 0.42, 0.22], top)
  if (config.top === 'hoodie') {
    add('torso', [0, 0.4, -0.12], [0.3, 0.12, 0.08], darker(top, 0.12))
    add('torso', [0, 0.1, 0.113], [0.22, 0.1, 0.014], darker(top, 0.15))
    for (const x of [-0.04, 0.04]) add('torso', [x, 0.33, 0.114], [0.012, 0.09, 0.012], '#f2f2f2')
  } else if (config.top === 'sweater') {
    add('torso', [0, 0.415, 0], [0.22, 0.04, 0.2], darker(top, 0.18))
    add('torso', [0, 0.025, 0], [waist + 0.01, 0.04, 0.23], darker(top, 0.18))
  } else if (config.top === 'shirt') {
    for (const s of [-1, 1]) add('torso', [s * 0.05, 0.4, 0.1], [0.08, 0.05, 0.03], lighter(top, 0.45), { rot: [0, 0, s * 0.35] })
    add('torso', [0, 0.2, 0.112], [0.012, 0.3, 0.012], darker(top, 0.25))
  } else if (config.top === 'jacket') {
    add('torso', [0, 0.215, 0.112], [0.1, 0.39, 0.012], '#f2efe8')
    for (const s of [-1, 1]) add('torso', [s * 0.07, 0.32, 0.116], [0.04, 0.16, 0.012], darker(top, 0.25), { rot: [0, 0, s * 0.3] })
  } else {
    add('torso', [0, 0.405, 0.1], [0.14, 0.02, 0.03], darker(top, 0.2))
  }
  const neck = config.neck
  if (neck === 'scarf') {
    add('torso', [0, 0.43, 0], [0.32, 0.07, 0.27], acc)
    add('torso', [0.075, 0.3, 0.13], [0.07, 0.18, 0.03], acc)
    add('torso', [0.075, 0.205, 0.13], [0.076, 0.016, 0.036], darker(acc, 0.2))
  } else if (neck === 'bowtie') {
    // papyon: ortada düğüm, iki yanda kanat (yakanın önünde)
    box('torso', [-0.018, 0.018], [0.378, 0.412], [0.112, 0.142], darker(acc, 0.25))
    for (const s of [-1, 1]) {
      box('torso', sx(s, 0.018, 0.075), [0.37, 0.42], [0.112, 0.136], acc)
      box('torso', sx(s, 0.06, 0.075), [0.362, 0.428], [0.112, 0.132], acc)
    }
  } else if (neck === 'tie') {
    box('torso', [-0.025, 0.025], [0.36, 0.405], [0.112, 0.138], darker(acc, 0.25))
    box('torso', [-0.03, 0.03], [0.14, 0.36], [0.112, 0.128], acc)
    box('torso', [-0.02, 0.02], [0.11, 0.14], [0.112, 0.128], acc)
    for (const y of [0.31, 0.25, 0.19]) box('torso', [-0.034, 0.034], [y - 0.007, y + 0.007], [0.12, 0.132], lighter(acc, 0.35))
  } else if (neck === 'necklace') {
    // V biçiminde zincir, ucunda taşlı madalyon
    for (const s of [-1, 1]) {
      add('torso', [s * 0.065, 0.375, 0.122], [0.01, 0.08, 0.008], metal, { rot: [0, 0, s * 0.75] })
      add('torso', [s * 0.022, 0.335, 0.122], [0.008, 0.045, 0.008], metal, { rot: [0, 0, s * 0.35] })
    }
    box('torso', [-0.017, 0.017], [0.285, 0.322], [0.116, 0.13], metal)
    box('torso', [-0.008, 0.008], [0.294, 0.313], [0.128, 0.135], '#d04a6a')
  }

  // kollar
  for (const side of ['L', 'R']) {
    const arm = `arm${side}`
    const fore = `fore${side}`
    if (longSleeves) {
      add(arm, [0, -0.09, 0], [0.11, 0.22, 0.11], top)
      add(fore, [0, -0.1, 0], [0.1, 0.2, 0.1], top)
      add(fore, [0, -0.1875, 0], [0.108, 0.035, 0.108], darker(top, config.top === 'sweater' ? 0.18 : 0.08))
    } else {
      add(arm, [0, -0.04, 0], [0.12, 0.12, 0.12], top)
      add(arm, [0, -0.14, 0], [0.095, 0.12, 0.095], skin)
      add(fore, [0, -0.1, 0], [0.09, 0.2, 0.09], skin)
    }
    add(fore, [0, -0.245, 0], [0.09, 0.09, 0.09], skin)
  }
  // bilek (sol önkol, kolun dış yüzü +x): bant kolun 7 mm dışında, kadran bandın dışında
  if (config.wrist !== 'none') {
    const hb = longSleeves ? 0.057 : 0.052
    const band = config.wrist === 'bracelet' ? metal : config.wrist === 'smartwatch' ? '#1e1e24' : darker(acc, 0.2)
    const [y0, y1] = config.wrist === 'bracelet' ? [-0.163, -0.15] : [-0.166, -0.144]
    box('foreL', [-hb, hb], [y0, y1], [-hb, hb], band)
    if (config.wrist === 'watch') {
      box('foreL', [hb - 0.004, hb + 0.01], [-0.175, -0.135], [-0.02, 0.02], metal)
      box('foreL', [hb + 0.008, hb + 0.014], [-0.17, -0.14], [-0.015, 0.015], '#f4f1e8')
    } else if (config.wrist === 'smartwatch') {
      box('foreL', [hb - 0.004, hb + 0.01], [-0.178, -0.132], [-0.022, 0.022], '#1e1e24')
      box('foreL', [hb + 0.008, hb + 0.014], [-0.172, -0.138], [-0.016, 0.016], '#5ad0ff')
    } else box('foreL', [hb - 0.004, hb + 0.01], [-0.168, -0.145], [-0.012, 0.012], '#d04a6a')
  }

  // kalça ve bacaklar (kalça: x ±0.17, y -0.09..0.03; kadında ±0.18)
  const hipW = female ? 0.36 : 0.34
  if (config.bottom === 'skirt') {
    add('hips', [0, -0.08, 0], [hipW + 0.05, 0.2, 0.25], bottom)
    add('hips', [0, -0.177, 0], [hipW + 0.06, 0.02, 0.26], darker(bottom, 0.2))
  } else {
    add('hips', [0, -0.03, 0], [hipW, 0.12, 0.2], bottom)
    add('hips', [0, 0.02, 0], [hipW + 0.01, 0.03, 0.21], darker(bottom, 0.3))
  }
  for (const side of ['L', 'R']) {
    const thigh = `thigh${side}`
    const shin = `shin${side}`
    add(thigh, [0, -0.14, 0], [0.145, 0.28, 0.16], config.bottom === 'skirt' ? skin : bottom)
    add(shin, [0, -0.1, 0], [0.13, 0.2, 0.14], config.bottom === 'pants' ? bottom : skin)
    add(shin, [0, -0.235, 0.02], [0.14, 0.07, 0.2], shoe)
    add(shin, [0, -0.266, 0.02], [0.146, 0.016, 0.206], darker(shoe, 0.35))
  }

  // ---------------- baş (baş: x ±0.17, y 0.03..0.37, z -0.155..0.165)
  add('head', [0, 0.02, 0], [0.12, 0.06, 0.12], skin)
  add('head', [0, 0.2, 0.005], [0.34, 0.34, 0.32], skin)
  for (const s of [-1, 1]) add('head', [s * 0.18, 0.19, 0], [0.03, 0.07, 0.06], darker(skin, 0.08))
  // yüz (ön yüz z = 0.165). Erkekte kalın düz kaş; kadında ince, dışa doğru kalkan kaş ve kirpik.
  for (const s of [-1, 1]) {
    add('head', [s * 0.075, 0.2, 0.166], [0.052, 0.062, 0.012], eye)
    add('head', [s * 0.075 + 0.012, 0.215, 0.172], [0.018, 0.018, 0.004], '#ffffff')
    const brow = darker(hair, 0.1)
    if (female) {
      box('head', sx(s, 0.045, 0.092), [0.25, 0.262], [0.162, 0.174], brow)
      box('head', sx(s, 0.088, 0.118), [0.256, 0.268], [0.162, 0.174], brow)
      box('head', sx(s, 0.097, 0.11), [0.224, 0.236], [0.166, 0.175], '#241a18')
    } else box('head', sx(s, 0.038, 0.118), [0.246, 0.27], [0.162, 0.174], brow)
    add('head', [s * 0.125, 0.135, 0.166], [0.045, 0.025, 0.008], mix(skin, '#e8607a', female ? 0.45 : 0.35))
  }
  const lips = female ? mix('#c4545e', skin, 0.25) : '#7a3a3a'
  if (female) box('head', [-0.04, 0.04], [0.099, 0.118], [0.162, 0.173], lips)
  else add('head', [0, 0.108, 0.167], [0.07, 0.016, 0.01], lips)

  // sakal ve bıyık (yalnızca erkek bedende)
  const beard = female ? 'none' : config.beard
  const stache = female ? 'none' : config.mustache
  const fur = darker(hair, 0.05)
  const furDark = darker(hair, 0.22)
  if (beard === 'stubble') {
    // kirli sakal: tenin rengine karışan ince katman
    const st = mix(skin, hair, 0.45)
    box('head', [-0.155, 0.155], [0.03, 0.098], [0.163, 0.171], st)
    box('head', [-0.15, 0.15], [0.024, 0.034], [0.0, 0.171], st)
    for (const s of [-1, 1]) box('head', sx(s, 0.164, 0.176), [0.03, 0.2], [0.0, 0.16], st)
  } else if (beard === 'goatee') {
    box('head', [-0.045, 0.045], [0.03, 0.098], [0.163, 0.19], fur)
    box('head', [-0.04, 0.04], [0.004, 0.03], [0.12, 0.188], fur)
  } else if (beard === 'chinstrap') {
    box('head', [-0.155, 0.155], [0.03, 0.062], [0.163, 0.178], fur)
    box('head', [-0.15, 0.15], [0.022, 0.034], [0.0, 0.178], fur)
    for (const s of [-1, 1]) box('head', sx(s, 0.164, 0.18), [0.03, 0.215], [0.0, 0.16], fur)
  } else if (beard === 'sideburns') {
    for (const s of [-1, 1]) {
      box('head', sx(s, 0.164, 0.179), [0.1, 0.28], [0.04, 0.124], fur)
      box('head', sx(s, 0.12, 0.179), [0.1, 0.14], [0.1, 0.176], fur)
    }
  } else if (beard === 'short' || beard === 'full' || beard === 'long') {
    const big = beard !== 'short'
    const front = big ? 0.186 : 0.176
    // yan kenar: kısa sakal saçın yanlarının içinde (0.179), gür sakal dışında (0.197)
    const side = big ? 0.197 : 0.179
    box('head', [-side, side], [big ? -0.005 : 0.012, 0.1], [big ? 0.04 : 0.06, front], fur)
    for (const s of [-1, 1]) {
      box('head', sx(s, 0.152, side), [0.08, 0.24], [-0.015, 0.128], fur)
      box('head', sx(s, 0.105, side), [0.08, 0.12], [0.1, front - 0.002], fur)
    }
    if (big) box('head', [-0.11, 0.11], [-0.035, -0.005], [0.06, front - 0.004], furDark)
    // uzun sakal göğse iner; masaya eğilen başta masaya değmeyecek boyda
    if (beard === 'long') {
      box('head', [-0.12, 0.12], [-0.095, -0.03], [0.09, front - 0.006], fur)
      box('head', [-0.075, 0.075], [-0.135, -0.095], [0.1, front - 0.012], fur)
      box('head', [-0.04, 0.04], [-0.155, -0.135], [0.105, front - 0.016], furDark)
    }
    // ağız sakalın önünde
    box('head', [-0.035, 0.035], [0.1, 0.116], [front - 0.006, front + 0.008], lips)
  }
  if (stache === 'classic') box('head', [-0.065, 0.065], [0.118, 0.142], [0.164, 0.184], fur)
  else if (stache === 'pencil') box('head', [-0.06, 0.06], [0.12, 0.129], [0.164, 0.18], fur)
  else if (stache === 'chevron') {
    box('head', [-0.075, 0.075], [0.116, 0.15], [0.164, 0.19], fur)
    for (const s of [-1, 1]) box('head', sx(s, 0.05, 0.08), [0.102, 0.116], [0.164, 0.188], fur)
  } else if (stache === 'handlebar') {
    box('head', [-0.05, 0.05], [0.118, 0.138], [0.164, 0.186], fur)
    for (const s of [-1, 1]) {
      box('head', sx(s, 0.05, 0.1), [0.122, 0.134], [0.164, 0.184], fur)
      box('head', sx(s, 0.094, 0.114), [0.134, 0.16], [0.166, 0.188], fur)
    }
  } else if (stache === 'horseshoe') {
    box('head', [-0.065, 0.065], [0.118, 0.14], [0.164, 0.188], fur)
    for (const s of [-1, 1]) box('head', sx(s, 0.042, 0.068), [0.03, 0.12], [0.164, 0.186], fur)
  }

  // saç: hairParts kutuları; top: şapka (örten başlık) varken gizlenen tepe parçaları. Alın çizgisi
  // başın ön yüzünün 7 mm önünde (aynı düzlemde kalmaz).
  const hatDef = HAT_KINDS[config.hat] ?? HAT_KINDS.none
  const hairBoxes = hairParts(config.hairStyle, female, { hair, light: mix(hair, '#f0d8a8', 0.13), dark: darker(hair, 0.2), shaved: mix(skin, hair, 0.55), tie: darker(hair, 0.55) })
  const shown = hairBoxes.filter((h) => !(h.top && hatDef.covers))
  for (const h of shown) box('head', h.x, h.y, h.z, h.color)
  // başın tepesindeki saç yüksekliği: tepenin ortasını örten geniş parçaların üstü (taç, kedi kulağı
  // bunun üstüne oturur; diken, ibik gibi dar parçalar sayılmaz)
  const crownY = Math.max(
    0.37,
    ...shown.filter((h) => h.x[1] - h.x[0] >= 0.2 && h.x[0] < 0 && h.x[1] > 0 && h.z[0] < 0 && h.z[1] > 0).map((h) => h.y[1]),
  )
  // orta çizgideki en yüksek saç (kulaklık bandı bunun üstünden geçer)
  const ridgeY = Math.max(0.37, ...shown.filter((h) => h.z[0] < 0.04 && h.z[1] > -0.04 && h.x[0] < 0.16 && h.x[1] > -0.16).map((h) => h.y[1]))

  // saçın y0..y1 arasındaki dış sınırı (+7 mm): taç ve çiçek tacı bunu dıştan sarar
  const fit = (y0, y1) => {
    const near = shown.filter((h) => h.y[1] > y0 && h.y[0] < y1)
    const f = { x: 0.17, front: 0.165, back: -0.155 }
    for (const h of near) {
      f.x = Math.max(f.x, h.x[1], -h.x[0])
      f.front = Math.max(f.front, h.z[1])
      f.back = Math.min(f.back, h.z[0])
    }
    return { x: f.x + 0.007, front: f.front + 0.007, back: f.back - 0.007 }
  }

  // başlık
  hatDef.build({ box, sx, color: hatColor, metal, crownY, fit })

  // kulaklık: bant saçın / şapkanın üstünden, yan çubuklar saçın dışından geçer
  if (config.headphones && HEADPHONE_HATS.includes(config.hat)) {
    const bandY = config.hat === 'beanie' ? 0.47 : config.hat === 'cap' ? 0.452 : ridgeY + 0.021
    const sideHair = shown.filter((h) => h.z[0] < 0.03 && h.z[1] > -0.03 && h.y[1] > 0.25 && h.y[0] < bandY)
    const barX = Math.max(config.hat === 'none' ? 0.2 : 0.222, ...sideHair.map((h) => Math.max(h.x[1], -h.x[0]) + 0.017))
    add('head', [0, bandY, 0], [barX * 2, 0.035, 0.064], '#2a2a2e')
    for (const s of [-1, 1]) {
      add('head', [s * barX, (bandY + 0.25) / 2, 0], [0.024, bandY - 0.25, 0.045], '#2a2a2e')
      add('head', [s * (barX + 0.008), 0.2, 0], [0.06, 0.12, 0.11], acc)
    }
  }

  // küpe: kulak memesinin altında; saç kulağı örtüyorsa ya da kulaklık takılıysa yok
  if (config.earrings !== 'none' && !EAR_COVERING.includes(config.hairStyle) && !config.headphones) {
    for (const s of [-1, 1]) {
      if (config.earrings === 'studs') {
        box('head', sx(s, 0.192, 0.204), [0.158, 0.172], [-0.007, 0.007], metal)
        box('head', sx(s, 0.202, 0.208), [0.161, 0.169], [-0.004, 0.004], '#d04a6a')
      } else if (config.earrings === 'hoops') {
        box('head', sx(s, 0.194, 0.206), [0.146, 0.156], [-0.022, 0.022], metal)
        for (const z of [-1, 1]) box('head', sx(s, 0.194, 0.206), [0.104, 0.15], z < 0 ? [-0.03, -0.02] : [0.02, 0.03], metal)
        box('head', sx(s, 0.194, 0.206), [0.094, 0.106], [-0.03, 0.03], metal)
      } else {
        box('head', sx(s, 0.192, 0.204), [0.158, 0.17], [-0.006, 0.006], metal)
        box('head', sx(s, 0.195, 0.201), [0.122, 0.158], [-0.003, 0.003], metal)
        box('head', sx(s, 0.19, 0.206), [0.092, 0.122], [-0.012, 0.012], '#4ab0c8')
      }
    }
  }

  // gözlük (çerçeve ön yüzü 0.182; gözün önünde)
  const g = config.glasses === 'sun' ? '#141418' : '#1e1e22'
  if (config.glasses === 'square' || config.glasses === 'sun') {
    for (const s of [-1, 1]) {
      const x = s * 0.075
      add('head', [x, 0.238, 0.176], [0.1, 0.012, 0.012], g)
      add('head', [x, 0.165, 0.176], [0.1, 0.012, 0.012], g)
      add('head', [x - 0.044, 0.2, 0.176], [0.012, 0.085, 0.012], g)
      add('head', [x + 0.044, 0.2, 0.176], [0.012, 0.085, 0.012], g)
      add('head', [s * 0.178, 0.226, 0.08], [0.012, 0.012, 0.18], g)
      if (config.glasses === 'sun') {
        box('head', [x - 0.039, x + 0.039], [0.171, 0.233], [0.171, 0.178], '#2a2c3a')
        box('head', [x + 0.008, x + 0.028], [0.21, 0.224], [0.176, 0.183], '#6a7aa0')
      }
    }
    add('head', [0, 0.215, 0.176], [0.03, 0.012, 0.012], g)
  } else if (config.glasses === 'round' || config.glasses === 'monocle') {
    const rim = config.glasses === 'monocle' ? metal : g
    for (const s of config.glasses === 'monocle' ? [-1] : [-1, 1]) {
      const x = s * 0.075
      box('head', [x - 0.026, x + 0.026], [0.243, 0.255], [0.17, 0.182], rim)
      box('head', [x - 0.026, x + 0.026], [0.145, 0.157], [0.17, 0.182], rim)
      for (const d of [-1, 1]) {
        box('head', [x + d * 0.05 - 0.006, x + d * 0.05 + 0.006], [0.175, 0.225], [0.17, 0.182], rim)
        for (const e of [-1, 1]) box('head', [x + d * 0.036 - 0.009, x + d * 0.036 + 0.009], [0.2 + e * 0.036 - 0.009, 0.2 + e * 0.036 + 0.009], [0.17, 0.182], rim)
      }
      if (config.glasses === 'round') box('head', sx(s, 0.172, 0.184), [0.22, 0.232], [-0.01, 0.17], rim)
    }
    if (config.glasses === 'round') box('head', [-0.025, 0.025], [0.212, 0.222], [0.17, 0.182], g)
    else box('head', [-0.135, -0.125], [0.06, 0.15], [0.171, 0.178], metal)
  }

  // ---------------- eşyalar
  const book = pickBy(BOOK_COVERS, 1)
  const mug = pickBy(MUG_COLORS, 3)
  const paper = '#f4eedf'
  // açık kitap: gövdenin önünde, yüze eğik; sırt ortada, iki sayfa hafif V
  if (want('book')) {
    const o = { show: 'book', rot: [-0.5, 0, 0] }
    add('torso', [0, 0.28, 0.3], [0.34, 0.016, 0.23], book, o)
    for (const s of [-1, 1]) add('torso', [s * 0.081, 0.293, 0.303], [0.154, 0.018, 0.204], paper, { show: 'book', rot: [-0.5, 0, s * -0.12] })
    add('torso', [0, 0.288, 0.3], [0.012, 0.02, 0.23], darker(book, 0.2), o)
  }
  // kitap göğüste, açık yüzü aşağı (koltukta uyurken)
  if (want('bookChest')) {
    for (const s of [-1, 1]) add('torso', [s * 0.07, 0.25, 0.13], [0.15, 0.2, 0.014], book, { show: 'bookChest', rot: [0, s * 0.35, 0] })
    add('torso', [0, 0.25, 0.155], [0.014, 0.21, 0.02], darker(book, 0.2), { show: 'bookChest' })
  }
  if (want('tablet')) {
    add('torso', [0, 0.29, 0.29], [0.26, 0.02, 0.18], '#1e2028', { show: 'tablet', rot: [-0.95, 0, 0] })
    add('torso', [0, 0.298, 0.297], [0.23, 0.008, 0.15], '#5ae0ff', { show: 'tablet', rot: [-0.95, 0, 0] })
  }
  if (want('pen')) add('foreR', [0, -0.29, 0.03], [0.012, 0.012, 0.14], '#2a2a40', { show: 'pen' })
  if (want('quill')) {
    add('foreR', [0, -0.29, 0.06], [0.01, 0.01, 0.16], '#3a2a20', { show: 'quill' })
    add('foreR', [0, -0.29, 0.1], [0.018, 0.05, 0.12], '#f2efe8', { show: 'quill', rot: [0.3, 0, 0] })
  }
  // elde dik tutulan kaplar: kol yataya yakınken ağzı yukarı bakar (önkolun +z'si yukarı)
  const upright = [Math.PI / 2, 0, 0]
  if (want('mug')) {
    add('foreR', [0, -0.26, 0.085], [0.075, 0.095, 0.075], mug, { show: 'mug', rot: upright })
    add('foreR', [0, -0.26, 0.1345], [0.06, 0.004, 0.06], '#4a2f22', { show: 'mug', rot: upright })
    add('foreR', [0.05, -0.26, 0.085], [0.025, 0.05, 0.02], mug, { show: 'mug', rot: upright })
  }
  if (want('teaGlass')) {
    add('foreR', [0, -0.25, 0.075], [0.045, 0.07, 0.045], '#a8401c', { show: 'teaGlass', rot: upright })
    add('foreR', [0, -0.25, 0.112], [0.052, 0.008, 0.052], '#e8d9c0', { show: 'teaGlass', rot: upright })
    add('foreR', [0, -0.25, 0.038], [0.075, 0.006, 0.075], '#c43c3c', { show: 'teaGlass', rot: upright })
  }
  if (want('paperCup')) {
    add('foreR', [0, -0.255, 0.08], [0.06, 0.09, 0.06], '#f6f6f2', { show: 'paperCup', rot: upright })
    add('foreR', [0, -0.255, 0.127], [0.066, 0.008, 0.066], '#6aa8d8', { show: 'paperCup', rot: upright })
  }
  // simit: susamlı halka, elin üstünde dik (önkol yataykenki dikey düzlemde)
  if (want('simit')) {
    const sim = '#b5651d'
    for (const [x, z, w, d] of [[0, 0.16, 0.16, 0.04], [0, 0.04, 0.16, 0.04], [0.06, 0.1, 0.04, 0.08], [-0.06, 0.1, 0.04, 0.08]]) {
      add('foreR', [x, -0.27, z], [w, 0.045, d], sim, { show: 'simit' })
    }
  }
  // ramen: sol elde kâse, sağ elde çubuklar
  if (want('ramen')) {
    add('foreL', [0, -0.25, 0.09], [0.13, 0.08, 0.13], '#d9534f', { show: 'ramen', rot: upright })
    add('foreL', [0, -0.25, 0.13], [0.11, 0.006, 0.11], '#f0d08a', { show: 'ramen', rot: upright })
    for (const x of [-0.012, 0.012]) add('foreR', [x, -0.29, 0.07], [0.008, 0.008, 0.2], '#c8a06a', { show: 'ramen' })
  }
  if (want('phone')) {
    add('foreR', [0, -0.28, 0.045], [0.07, 0.13, 0.012], '#1e2028', { show: 'phone' })
    add('foreR', [0, -0.28, 0.052], [0.058, 0.11, 0.004], '#7ad0ff', { show: 'phone' })
  }
  if (want('dart')) {
    add('foreR', [0, -0.29, 0.06], [0.014, 0.014, 0.12], '#c8ccd2', { show: 'dart' })
    add('foreR', [0, -0.29, -0.01], [0.04, 0.004, 0.03], '#d9534f', { show: 'dart' })
  }
  // bilardo ıstakası: sağ elden önkol doğrultusunda ileri uzanır, kabzası elde
  if (want('cue')) {
    add('foreR', [0, -0.78, 0.01], [0.022, 1.05, 0.022], '#c8a06a', { show: 'cue' })
    add('foreR', [0, -0.27, 0.01], [0.034, 0.16, 0.034], '#3a2a20', { show: 'cue' })
    add('foreR', [0, -1.31, 0.01], [0.026, 0.02, 0.026], '#eef2f5', { show: 'cue' })
  }
  if (want('paddle')) {
    add('foreR', [0, -0.33, 0], [0.03, 0.08, 0.03], '#8a5a36', { show: 'paddle' })
    add('foreR', [0, -0.43, 0], [0.15, 0.15, 0.016], '#c43c3c', { show: 'paddle' })
  }
  // kepçe: kazanı karıştırmak için uzun sap, elden aşağı (önkol yataykenki -z) uzanır
  if (want('ladle')) {
    add('foreR', [0, -0.28, -0.24], [0.025, 0.025, 0.56], '#6b4a2e', { show: 'ladle' })
    add('foreR', [0, -0.28, -0.53], [0.09, 0.05, 0.05], '#4a3a2e', { show: 'ladle' })
  }
  if (want('flask')) {
    add('foreR', [0, -0.27, 0.08], [0.08, 0.09, 0.08], '#9b59d0', { show: 'flask', rot: upright })
    add('foreR', [0, -0.27, 0.15], [0.03, 0.05, 0.03], '#cfe8f0', { show: 'flask', rot: upright })
  }
  if (want('vr')) {
    add('head', [0, 0.22, 0.2], [0.3, 0.11, 0.09], '#2a2a2e', { show: 'vr' })
    add('head', [0, 0.22, 0.247], [0.26, 0.07, 0.006], '#e04aa8', { show: 'vr' })
    add('head', [0, 0.23, -0.005], [0.355, 0.03, 0.345], '#2a2a2e', { show: 'vr' })
  }
  if (want('watering')) {
    add('foreR', [0, -0.34, 0.06], [0.08, 0.12, 0.16], '#4a8a5a', { show: 'watering' })
    add('foreR', [0, -0.31, 0.18], [0.025, 0.025, 0.12], '#4a8a5a', { show: 'watering', rot: [-0.5, 0, 0] })
  }
  // olta: sağ elden 45° öne ve yukarı (önkol yataykenki -y ile +z arası)
  if (want('rod')) {
    add('foreR', [0, -0.73, 0.46], [0.016, 0.016, 1.3], '#5a4030', { show: 'rod', rot: [Math.PI / 4, 0, 0] })
    add('foreR', [0, -0.3, 0.05], [0.04, 0.04, 0.04], '#9a9a9a', { show: 'rod' })
  }
  if (want('stone')) add('foreR', [0, -0.3, 0.04], [0.05, 0.025, 0.04], '#8a8a8a', { show: 'stone' })
  // gazete: uyurken yüzü örter
  if (want('newspaper')) {
    for (const s of [-1, 1]) add('head', [s * 0.09, 0.215, 0.19], [0.19, 0.28, 0.01], '#ece6d6', { show: 'newspaper', rot: [0, s * -0.35, 0] })
    add('head', [-0.09, 0.27, 0.198], [0.12, 0.03, 0.004], '#3a3a3a', { show: 'newspaper', rot: [0, 0.35, 0] })
  }
  parts.crown = crown * SCALE
  return parts
}

// ---------------------------------------------------------------- saç modelleri

// [a, b] aralığının x'te aynası: sağ taraf (s = -1) için [-b, -a].
const sx = (s, a, b) => (s > 0 ? [a, b] : [-b, -a])

/**
 * Saç kutuları, baş kemiğine göre min/max aralıklarıyla: { x, y, z, color, top }. top: örten şapka
 * varken gizlenen tepe parçası. c: renkler (hair, light, dark, shaved, tie). Baş x ±0.17, y 0.03..0.37,
 * z -0.155..0.165; kaşlar y 0.246..0.27 (perçem alt ucu 0.27'nin üstünde kalır).
 */
function hairParts(style, female, c) {
  const out = []
  const P = (x, y, z, opts = {}) => out.push({ x, y, z, color: c[opts.tone ?? 'hair'], top: !!opts.top })
  const cap = (y0 = 0.355, y1 = 0.415) => P([-0.18, 0.18], [y0, y1], [-0.175, 0.172], { top: true })
  const back = (y0 = 0.2) => P([-0.18, 0.18], [y0, 0.38], [-0.185, -0.145])
  const sides = (y0 = 0.23, out1 = 0.191) => {
    for (const s of [-1, 1]) P(sx(s, 0.161, out1), [y0, 0.365], [-0.17, 0.11])
  }
  // favori: erkekte kulağın önünde kısa
  const burns = () => {
    if (!female) for (const s of [-1, 1]) P(sx(s, 0.163, 0.188), [0.19, 0.235], [0.06, 0.115])
  }
  // ortadan ayrılmış perçem, iki yanda yüzü çerçeveleyen tutamlar (uzun saçlar)
  const centerFringe = (frame = 0) => {
    for (const s of [-1, 1]) {
      P(sx(s, 0.008, 0.18), [0.318, 0.372], [0.166, 0.182], { top: true })
      P(sx(s, 0.1, 0.18), [0.29, 0.318], [0.166, 0.182], { top: true })
      if (frame) P(sx(s, 0.135, 0.18), [frame, 0.29], [0.166, 0.182])
    }
  }
  // traşlı yanlar ve ense (undercut, mohikan)
  const shavedSides = (top = 0.375) => {
    for (const s of [-1, 1]) P(sx(s, 0.145, 0.176), [0.2, top], [-0.161, 0.115], { tone: 'shaved' })
    P([-0.176, 0.176], [0.12, top], [-0.161, -0.13], { tone: 'shaved' })
  }

  switch (style) {
    case 'short':
      cap()
      back()
      sides()
      burns()
      // sağa taranmış perçem, uçları basamaklı
      P([-0.18, 0.12], [0.318, 0.372], [0.166, 0.182], { top: true })
      P([0.12, 0.18], [0.335, 0.372], [0.166, 0.182], { top: true })
      ;[[-0.165, 0.298], [-0.095, 0.304], [-0.025, 0.31]].forEach(([x, y]) => P([x, x + 0.06], [y, 0.318], [0.168, 0.18], { top: true }))
      for (const x of [-0.07, 0.01]) P([x, x + 0.035], [0.41, 0.421], [-0.06, 0.13], { tone: 'light', top: true })
      break
    case 'sidepart':
      // sol tarafta ayrık çizgi (başın derisi görünür), sağ taraf kabarık
      P([0.035, 0.18], [0.355, 0.412], [-0.175, 0.172], { top: true })
      P([-0.18, 0.025], [0.355, 0.432], [-0.175, 0.176], { top: true })
      P([-0.18, 0.025], [0.322, 0.432], [0.17, 0.188], { top: true })
      P([0.035, 0.18], [0.338, 0.412], [0.166, 0.18], { top: true })
      P([-0.06, 0.025], [0.308, 0.322], [0.172, 0.186], { top: true })
      for (const x of [-0.14, -0.07]) P([x, x + 0.035], [0.428, 0.438], [-0.1, 0.16], { tone: 'light', top: true })
      back(0.19)
      sides(0.225, 0.186)
      burns()
      break
    case 'quiff':
      P([-0.178, 0.178], [0.355, 0.405], [-0.172, 0.17], { top: true })
      P([-0.15, 0.15], [0.39, 0.47], [-0.02, 0.2], { top: true })
      P([-0.16, 0.16], [0.39, 0.44], [-0.16, -0.02], { top: true })
      P([-0.15, 0.15], [0.345, 0.39], [0.165, 0.186], { top: true })
      for (const x of [-0.09, 0.03]) P([x, x + 0.045], [0.466, 0.478], [0.05, 0.19], { tone: 'light', top: true })
      back(0.18)
      sides(0.21, 0.183)
      burns()
      break
    case 'spiky': {
      cap()
      back()
      sides()
      burns()
      P([-0.17, 0.17], [0.33, 0.372], [0.166, 0.182], { top: true })
      const spikes = [[-0.11, -0.11], [0.0, -0.12], [0.11, -0.1], [-0.12, 0.0], [0.0, 0.0], [0.12, 0.01], [-0.1, 0.11], [0.02, 0.12], [0.12, 0.12]]
      spikes.forEach(([x, z], i) => {
        const h = 0.035 + (i % 3) * 0.012
        P([x - 0.04, x + 0.04], [0.405, 0.405 + h], [z - 0.04, z + 0.04], { top: true })
        P([x - 0.018, x + 0.018], [0.4 + h, 0.44 + h], [z - 0.013, z + 0.019], { tone: 'light', top: true })
      })
      break
    }
    case 'undercut':
      shavedSides()
      P([-0.15, 0.15], [0.355, 0.44], [-0.168, 0.18], { top: true })
      P([-0.15, 0.03], [0.335, 0.375], [0.168, 0.196], { top: true })
      P([-0.15, -0.06], [0.312, 0.335], [0.17, 0.19], { top: true })
      for (const x of [-0.08, 0.02]) P([x, x + 0.035], [0.436, 0.446], [-0.12, 0.15], { tone: 'light', top: true })
      break
    case 'manbun':
      cap()
      back()
      sides(0.225, 0.186)
      burns()
      P([-0.17, 0.17], [0.34, 0.4], [0.166, 0.18], { top: true })
      P([-0.06, 0.06], [0.38, 0.48], [-0.2, -0.08], { top: true })
      P([-0.04, 0.04], [0.476, 0.488], [-0.18, -0.1], { tone: 'light', top: true })
      P([-0.065, 0.065], [0.38, 0.4], [-0.205, -0.075], { tone: 'tie', top: true })
      break
    case 'mohawk':
      shavedSides()
      P([-0.176, 0.176], [0.36, 0.376], [-0.161, 0.171], { tone: 'shaved', top: true })
      P([-0.045, 0.045], [0.37, 0.5], [-0.17, 0.14], { top: true })
      P([-0.045, 0.045], [0.37, 0.53], [0.06, 0.19], { top: true })
      P([-0.03, 0.03], [0.496, 0.508], [-0.15, 0.05], { tone: 'light', top: true })
      P([-0.03, 0.03], [0.526, 0.538], [0.08, 0.18], { tone: 'light', top: true })
      break
    case 'buzz':
      P([-0.175, 0.175], [0.357, 0.387], [-0.17, 0.172], { top: true })
      P([-0.175, 0.175], [0.19, 0.37], [-0.176, -0.156])
      for (const s of [-1, 1]) P(sx(s, 0.166, 0.176), [0.24, 0.37], [-0.16, 0.1])
      break
    case 'curly': {
      P([-0.2, 0.2], [0.34, 0.43], [-0.185, 0.185], { top: true })
      P([-0.195, 0.195], [0.13, 0.38], [-0.2, -0.15])
      for (const s of [-1, 1]) P(sx(s, 0.165, 0.215), [0.18, 0.37], [-0.17, 0.09])
      // bukleler: tepede, alında, yanlarda ve ensede
      const curls = [
        [-0.13, 0.45, 0.1, 0.09, 1], [0.0, 0.462, 0.125, 0.084, 1], [0.13, 0.452, 0.08, 0.09, 1], [-0.14, 0.46, -0.03, 0.094, 1],
        [0.02, 0.47, -0.005, 0.1, 1], [0.14, 0.456, -0.05, 0.088, 1], [-0.1, 0.452, -0.14, 0.09, 1], [0.08, 0.448, -0.15, 0.092, 1],
        [-0.1, 0.33, 0.183, 0.06, 1], [0.03, 0.326, 0.188, 0.054, 1], [0.13, 0.335, 0.183, 0.06, 1],
        [-0.21, 0.22, 0.0, 0.066, 0], [0.21, 0.22, 0.0, 0.066, 0], [-0.205, 0.3, -0.1, 0.074, 0], [0.205, 0.3, -0.1, 0.074, 0],
        [-0.1, 0.2, -0.212, 0.08, 0], [0.1, 0.205, -0.212, 0.08, 0], [0.0, 0.3, -0.222, 0.082, 0],
      ]
      curls.forEach(([x, y, z, s, top], i) => P([x - s / 2, x + s / 2], [y - s * 0.38, y + s * 0.38], [z - s / 2, z + s / 2], { top: !!top, tone: i % 3 === 1 ? 'light' : 'hair' }))
      break
    }
    case 'afro':
      P([-0.25, 0.25], [0.24, 0.345], [-0.26, 0.06])
      P([-0.26, 0.26], [0.34, 0.52], [-0.27, 0.2], { top: true })
      P([-0.22, 0.22], [0.515, 0.6], [-0.23, 0.16], { top: true })
      P([-0.14, 0.14], [0.595, 0.635], [-0.15, 0.09], { top: true })
      for (const [x, y, z] of [[-0.17, 0.46, 0.198], [0.09, 0.4, 0.198], [0.2, 0.56, 0.0], [-0.2, 0.44, -0.2]]) {
        P([x - 0.04, x + 0.04], [y - 0.035, y + 0.035], [z - 0.04 + (z > 0.1 ? 0.012 : 0), z + 0.04], { tone: 'light', top: true })
      }
      break
    case 'long':
      // uzun kısımlar şapkanın altında kalır (y < 0.34); üstte normal yan ve arka
      cap()
      back()
      sides()
      P([-0.185, 0.185], [-0.09, 0.34], [-0.202, -0.142])
      for (const s of [-1, 1]) P(sx(s, 0.167, 0.207), [-0.06, 0.33], [-0.17, 0.11])
      centerFringe(0.2)
      P([-0.18, 0.18], [-0.12, -0.09], [-0.198, -0.146], { tone: 'light' })
      for (const s of [-1, 1]) P(sx(s, 0.17, 0.204), [-0.09, -0.06], [-0.165, 0.105], { tone: 'light' })
      break
    case 'wavy': {
      cap()
      back()
      sides()
      // dalgalı: yan ve arka basamaklar dışa içe kayar, uçlar kıvrılır
      const waves = [[0.225, 0.33, 0.207], [0.12, 0.22, 0.217], [0.02, 0.12, 0.207], [-0.08, 0.02, 0.219]]
      waves.forEach(([y0, y1, w]) => {
        for (const s of [-1, 1]) P(sx(s, 0.167, w), [y0, y1], [-0.17, 0.11 - (w > 0.21 ? 0.01 : 0)])
        P([-0.188, 0.188], [y0, y1], [w > 0.21 ? -0.214 : -0.204, -0.142])
      })
      for (const s of [-1, 1]) P(sx(s, 0.17, 0.212), [-0.13, -0.08], [-0.165, 0.09], { tone: 'light' })
      P([-0.17, 0.17], [-0.13, -0.08], [-0.21, -0.146], { tone: 'light' })
      // yana taranmış perçem
      P([-0.18, 0.1], [0.32, 0.372], [0.166, 0.182], { top: true })
      P([0.1, 0.18], [0.29, 0.372], [0.166, 0.182], { top: true })
      for (const s of [-1, 1]) P(sx(s, 0.135, 0.18), [0.18, 0.29], [0.166, 0.182])
      break
    }
    case 'bob':
      cap()
      back()
      sides()
      P([-0.2, 0.2], [0.07, 0.34], [-0.21, -0.145])
      for (const s of [-1, 1]) P(sx(s, 0.167, 0.215), [0.07, 0.33], [-0.17, 0.13])
      // düz kesik perçem
      P([-0.17, 0.17], [0.29, 0.372], [0.166, 0.184], { top: true })
      P([-0.2, 0.2], [0.05, 0.075], [-0.205, -0.15], { tone: 'dark' })
      for (const s of [-1, 1]) P(sx(s, 0.171, 0.219), [0.05, 0.075], [-0.165, 0.125], { tone: 'dark' })
      break
    case 'pixie':
      cap(0.35, 0.41)
      back(0.17)
      sides(0.2, 0.185)
      P([-0.17, 0.06], [0.3, 0.372], [0.166, 0.186], { top: true })
      P([-0.17, -0.06], [0.272, 0.3], [0.168, 0.184], { top: true })
      P([0.06, 0.17], [0.33, 0.372], [0.166, 0.18], { top: true })
      for (const x of [-0.11, -0.03]) P([x, x + 0.035], [0.406, 0.416], [-0.04, 0.15], { tone: 'light', top: true })
      break
    case 'ponytail':
      cap()
      back()
      sides()
      centerFringe()
      P([-0.05, 0.05], [0.31, 0.37], [-0.218, -0.175], { tone: 'tie' })
      P([-0.045, 0.045], [0.24, 0.33], [-0.25, -0.19])
      P([-0.055, 0.055], [0.1, 0.24], [-0.265, -0.2])
      P([-0.04, 0.04], [0.0, 0.1], [-0.255, -0.205], { tone: 'light' })
      break
    case 'bun':
      cap()
      back()
      sides()
      centerFringe()
      P([-0.075, 0.075], [0.41, 0.53], [-0.14, 0.01], { top: true })
      P([-0.085, 0.085], [0.41, 0.445], [-0.15, 0.02], { tone: 'dark', top: true })
      P([-0.05, 0.05], [0.526, 0.538], [-0.12, -0.01], { tone: 'light', top: true })
      break
    case 'pigtails':
      cap()
      back()
      sides()
      centerFringe()
      for (const s of [-1, 1]) {
        // kulaklık kapağının (z ±0.055) arkasında
        P(sx(s, 0.18, 0.23), [0.26, 0.31], [-0.125, -0.065], { tone: 'tie' })
        P(sx(s, 0.185, 0.245), [0.1, 0.262], [-0.13, -0.06])
        P(sx(s, 0.19, 0.24), [0.04, 0.1], [-0.125, -0.065], { tone: 'light' })
      }
      break
    case 'braid':
      cap()
      back()
      sides()
      centerFringe()
      for (let i = 0; i < 5; i++) {
        const y1 = 0.32 - i * 0.085
        const x = i % 2 ? 0.012 : -0.012
        P([x - 0.038, x + 0.038], [y1 - 0.085, y1], [-0.235, -0.165], { tone: i % 2 ? 'dark' : 'hair' })
      }
      P([-0.03, 0.03], [-0.13, -0.105], [-0.228, -0.172], { tone: 'tie' })
      P([-0.035, 0.035], [-0.18, -0.13], [-0.23, -0.17], { tone: 'light' })
      break
    default:
      break
  }
  return out
}

// ---------------------------------------------------------------- başlıklar

// covers: tepedeki saçı örter (saçın tepe parçaları gizlenir). build: kutuları ekler; crownY başın
// tepesindeki saçın üstü (örtmeyen başlıklar buna oturur).
const HAT_KINDS = {
  none: { covers: false, build: () => {} },
  beanie: {
    covers: true,
    build: ({ box, color }) => {
      box('head', [-0.205, 0.205], [0.335, 0.455], [-0.21, 0.2], color)
      box('head', [-0.21, 0.21], [0.3, 0.35], [-0.215, 0.205], darker(color, 0.18))
      box('head', [-0.04, 0.04], [0.455, 0.515], [-0.045, 0.035], lighter(color, 0.4))
    },
  },
  cap: {
    covers: true,
    build: ({ box, color }) => {
      box('head', [-0.195, 0.195], [0.34, 0.43], [-0.195, 0.175], color)
      box('head', [-0.15, 0.15], [0.34, 0.36], [0.17, 0.3], darker(color, 0.15))
      box('head', [-0.02, 0.02], [0.43, 0.442], [-0.03, 0.01], darker(color, 0.3))
    },
  },
  beret: {
    covers: true,
    build: ({ box, color }) => {
      box('head', [-0.2, 0.2], [0.345, 0.4], [-0.205, 0.19], color)
      box('head', [-0.24, 0.16], [0.4, 0.44], [-0.21, 0.18], color)
      box('head', [-0.21, 0.13], [0.44, 0.456], [-0.18, 0.15], lighter(color, 0.12))
      box('head', [-0.06, -0.035], [0.456, 0.48], [-0.03, -0.005], darker(color, 0.3))
    },
  },
  fedora: {
    covers: true,
    build: ({ box, color }) => {
      box('head', [-0.29, 0.29], [0.335, 0.355], [-0.28, 0.27], color)
      box('head', [-0.2, 0.2], [0.355, 0.47], [-0.205, 0.19], color)
      for (const s of [-1, 1]) box('head', sx(s, 0.025, 0.19), [0.47, 0.5], [-0.17, 0.16], color)
      box('head', [-0.206, 0.206], [0.36, 0.4], [-0.211, 0.196], darker(color, 0.45))
    },
  },
  tophat: {
    covers: true,
    build: ({ box, color }) => {
      box('head', [-0.28, 0.28], [0.335, 0.355], [-0.28, 0.27], darker(color, 0.25))
      box('head', [-0.2, 0.2], [0.355, 0.66], [-0.205, 0.19], darker(color, 0.25))
      box('head', [-0.206, 0.206], [0.36, 0.41], [-0.211, 0.196], color)
    },
  },
  cowboy: {
    covers: true,
    build: ({ box, sx, color }) => {
      const band = darker(color, 0.45)
      box('head', [-0.36, 0.36], [0.33, 0.35], [-0.33, 0.31], color)
      for (const s of [-1, 1]) box('head', sx(s, 0.31, 0.38), [0.35, 0.4], [-0.3, 0.28], color)
      box('head', [-0.2, 0.2], [0.35, 0.52], [-0.21, 0.19], color)
      for (const s of [-1, 1]) box('head', sx(s, 0.03, 0.2), [0.52, 0.55], [-0.18, 0.16], color)
      box('head', [-0.206, 0.206], [0.355, 0.395], [-0.216, 0.196], band)
      box('head', [-0.12, -0.08], [0.36, 0.39], [0.192, 0.204], '#c9ced6')
    },
  },
  wizard: {
    covers: true,
    build: ({ box, color }) => {
      box('head', [-0.3, 0.3], [0.33, 0.35], [-0.3, 0.29], color)
      const cone = [[0.2, 0.35, 0.45, -0.21, 0.19], [0.15, 0.45, 0.55, -0.17, 0.13], [0.11, 0.55, 0.64, -0.15, 0.07], [0.075, 0.64, 0.72, -0.15, 0.0], [0.045, 0.72, 0.79, -0.16, -0.07]]
      for (const [w, y0, y1, z0, z1] of cone) box('head', [-w, w], [y0, y1], [z0, z1], color)
      box('head', [-0.025, 0.025], [0.78, 0.82], [-0.2, -0.14], lighter(color, 0.3))
      box('head', [-0.206, 0.206], [0.355, 0.39], [-0.216, 0.196], '#e8c84a')
      // ay ve yıldızlar
      box('head', [-0.13, -0.09], [0.4, 0.44], [0.186, 0.197], '#f2e27a')
      box('head', [0.03, 0.065], [0.48, 0.515], [0.126, 0.137], '#f2e27a')
      box('head', [-0.06, -0.032], [0.58, 0.608], [0.066, 0.076], '#f2e27a')
    },
  },
  viking: {
    covers: true,
    build: ({ box, sx }) => {
      const iron = '#8e959e'
      const dark = '#5e646c'
      box('head', [-0.205, 0.205], [0.33, 0.39], [-0.215, 0.195], dark)
      box('head', [-0.195, 0.195], [0.39, 0.46], [-0.205, 0.185], iron)
      box('head', [-0.15, 0.15], [0.46, 0.5], [-0.16, 0.14], iron)
      box('head', [-0.02, 0.02], [0.395, 0.51], [-0.21, 0.19], dark)
      box('head', [-0.02, 0.02], [0.24, 0.39], [0.19, 0.212], iron)
      for (const x of [-0.14, -0.07, 0.07, 0.14]) box('head', [x - 0.012, x + 0.012], [0.352, 0.368], [0.193, 0.203], '#c9ced6')
      for (const s of [-1, 1]) {
        box('head', sx(s, 0.19, 0.26), [0.4, 0.46], [-0.04, 0.04], '#efe6cf')
        box('head', sx(s, 0.25, 0.3), [0.45, 0.52], [-0.035, 0.035], '#efe6cf')
        box('head', sx(s, 0.28, 0.32), [0.51, 0.58], [-0.03, 0.03], '#efe6cf')
        box('head', sx(s, 0.29, 0.316), [0.575, 0.62], [-0.02, 0.02], '#cfc2a0')
      }
    },
  },
  crown: {
    covers: false,
    build: ({ box, sx, metal, crownY, fit }) => {
      const y0 = crownY - 0.015
      const y1 = crownY + 0.07
      // halka saçı dıştan sarar; 3 cm kalınlık
      const { x: X, front: F, back: B } = fit(y0, y1)
      const W = 0.03
      box('head', [-X, X], [y0, y1], [F - W, F], metal)
      box('head', [-X, X], [y0, y1], [B, B + W], metal)
      for (const s of [-1, 1]) box('head', sx(s, X - W, X), [y0, y1], [B + W - 0.002, F - W + 0.002], metal)
      // sivri uçlar: önde ve arkada beşer, yanlarda ikişer
      ;[-0.8, -0.4, 0, 0.4, 0.8].forEach((k, i) => {
        const h = i % 2 ? 0.035 : 0.06
        const x = k * (X - 0.03)
        box('head', [x - 0.017, x + 0.017], [y1, y1 + h], [F - W + 0.003, F - 0.003], metal)
        box('head', [x - 0.017, x + 0.017], [y1, y1 + h], [B + 0.003, B + W - 0.003], metal)
      })
      const mid = (F + B) / 2
      for (const s of [-1, 1]) for (const d of [-0.065, 0.065]) box('head', sx(s, X - W + 0.003, X - 0.003), [y1, y1 + 0.045], [mid + d - 0.017, mid + d + 0.017], metal)
      box('head', [-0.021, 0.021], [y0 + 0.015, y0 + 0.048], [F - 0.004, F + 0.008], '#d02a3a')
      for (const s of [-1, 1]) box('head', sx(s, X - 0.004, X + 0.008), [y0 + 0.018, y0 + 0.045], [mid - 0.016, mid + 0.016], '#2a6ad0')
    },
  },
  catears: {
    covers: false,
    build: ({ box, sx, color, crownY, fit }) => {
      const T = crownY
      const band = fit(T - 0.008, T + 0.014).x
      box('head', [-band, band], [T - 0.008, T + 0.014], [-0.025, 0.006], darker(color, 0.35))
      for (const s of [-1, 1]) {
        // ölçüler yarım milimetre kaydırılmış: diken ve buklelerin yüzleriyle aynı düzleme düşmez
        box('head', sx(s, 0.0535, 0.1555), [T + 0.0045, T + 0.0715], [-0.0355, 0.0145], color)
        box('head', sx(s, 0.0695, 0.1405), [T + 0.0715, T + 0.1135], [-0.0325, 0.0115], color)
        box('head', sx(s, 0.0885, 0.1215), [T + 0.1135, T + 0.1455], [-0.0285, 0.0075], color)
        box('head', sx(s, 0.0775, 0.1305), [T + 0.0155, T + 0.0905], [0.0145, 0.0235], '#f2a0b4')
      }
    },
  },
  flowers: {
    covers: false,
    build: ({ box, sx, crownY, fit }) => {
      const y0 = crownY - 0.012
      const vine = '#4a8a4a'
      const { x: X, front: F, back: B } = fit(y0, y0 + 0.022)
      box('head', [-X, X], [y0, y0 + 0.022], [F - 0.025, F], vine)
      box('head', [-X, X], [y0, y0 + 0.022], [B, B + 0.025], vine)
      for (const s of [-1, 1]) box('head', sx(s, X - 0.025, X), [y0, y0 + 0.022], [B + 0.023, F - 0.023], vine)
      // çiçekler: dört yaprak ve sarı göbek
      const petals = ['#f2a0b4', '#f4f1e8', '#b8a0e8', '#f2a0b4', '#f4f1e8']
      ;[[-0.1, F + 0.004, 'z'], [0.0, F + 0.006, 'z'], [0.1, F + 0.004, 'z'], [-1, 0.06, 'x'], [1, 0.06, 'x']].forEach(([a, b, axis], i) => {
        const col = petals[i]
        const y = y0 + 0.01
        if (axis === 'z') {
          box('head', [a - 0.028, a + 0.028], [y - 0.014, y + 0.014], [b - 0.01, b + 0.008], col)
          box('head', [a - 0.014, a + 0.014], [y - 0.028, y + 0.028], [b - 0.01, b + 0.008], col)
          box('head', [a - 0.01, a + 0.01], [y - 0.01, y + 0.01], [b, b + 0.014], '#f2c84a')
        } else {
          const s = Math.sign(a)
          box('head', sx(s, X - 0.01, X + 0.008), [y - 0.014, y + 0.014], [b - 0.028, b + 0.028], col)
          box('head', sx(s, X - 0.01, X + 0.008), [y - 0.028, y + 0.028], [b - 0.014, b + 0.014], col)
          box('head', sx(s, X, X + 0.014), [y - 0.01, y + 0.01], [b - 0.01, b + 0.01], '#f2c84a')
        }
      })
    },
  },
}
