import { Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import {
  CLOTH_COLORS,
  EYE_COLORS,
  HAIR_COLORS,
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
export function buildAvatarParts(config, { props, seed = 0 } = {}) {
  const skin = colorOf(SKIN_TONES, config.skin)
  const hair = colorOf(HAIR_COLORS, config.hairColor)
  const eye = colorOf(EYE_COLORS, config.eyes)
  const top = colorOf(CLOTH_COLORS, config.topColor)
  const bottom = colorOf(CLOTH_COLORS, config.bottomColor)
  const shoe = colorOf(SHOE_COLORS, config.shoes)
  const acc = colorOf(CLOTH_COLORS, config.accessoryColor)
  const has = (a) => config.accessories.includes(a)
  const hat = has('beanie') || has('cap')
  const want = (p) => !props || props.has(p)
  const pickBy = (list, salt) => list[Math.abs(Math.floor(seed * 7919 + salt)) % list.length]
  const parts = []
  const scale = new Vector3()
  // c: kutu merkezi, s: boy (tasarım biriminde, kemiğe göre)
  const add = (bone, c, s, color, extra = {}) => {
    const q = extra.rot ? new Quaternion().setFromEuler(new Euler(...extra.rot)) : new Quaternion()
    const m = new Matrix4().compose(new Vector3(...c).multiplyScalar(SCALE), q, scale.set(...s).multiplyScalar(SCALE))
    parts.push({ bone: BONE_INDEX[bone], matrix: m, color, show: extra.show })
  }

  // ---------------- gövde ve kıyafet (gövde: x ±0.19, y 0..0.42, z ±0.11)
  const longSleeves = config.top !== 'tshirt'
  add('torso', [0, 0.21, 0], [0.38, 0.42, 0.22], top)
  if (config.top === 'hoodie') {
    add('torso', [0, 0.4, -0.12], [0.3, 0.12, 0.08], darker(top, 0.12))
    add('torso', [0, 0.1, 0.113], [0.22, 0.1, 0.014], darker(top, 0.15))
    for (const x of [-0.04, 0.04]) add('torso', [x, 0.33, 0.114], [0.012, 0.09, 0.012], '#f2f2f2')
  } else if (config.top === 'sweater') {
    add('torso', [0, 0.415, 0], [0.22, 0.04, 0.2], darker(top, 0.18))
    add('torso', [0, 0.025, 0], [0.39, 0.04, 0.23], darker(top, 0.18))
  } else if (config.top === 'shirt') {
    for (const s of [-1, 1]) add('torso', [s * 0.05, 0.4, 0.1], [0.08, 0.05, 0.03], lighter(top, 0.45), { rot: [0, 0, s * 0.35] })
    add('torso', [0, 0.2, 0.112], [0.012, 0.3, 0.012], darker(top, 0.25))
  } else if (config.top === 'jacket') {
    add('torso', [0, 0.215, 0.112], [0.1, 0.39, 0.012], '#f2efe8')
    for (const s of [-1, 1]) add('torso', [s * 0.07, 0.32, 0.116], [0.04, 0.16, 0.012], darker(top, 0.25), { rot: [0, 0, s * 0.3] })
  } else {
    add('torso', [0, 0.405, 0.1], [0.14, 0.02, 0.03], darker(top, 0.2))
  }
  if (has('scarf')) {
    add('torso', [0, 0.43, 0], [0.32, 0.07, 0.27], acc)
    add('torso', [0.075, 0.3, 0.13], [0.07, 0.18, 0.03], acc)
    add('torso', [0.075, 0.205, 0.13], [0.076, 0.016, 0.036], darker(acc, 0.2))
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

  // kalça ve bacaklar (kalça: x ±0.17, y -0.09..0.03)
  if (config.bottom === 'skirt') {
    add('hips', [0, -0.08, 0], [0.39, 0.2, 0.25], bottom)
    add('hips', [0, -0.177, 0], [0.4, 0.02, 0.26], darker(bottom, 0.2))
  } else {
    add('hips', [0, -0.03, 0], [0.34, 0.12, 0.2], bottom)
    add('hips', [0, 0.02, 0], [0.35, 0.03, 0.21], darker(bottom, 0.3))
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
  // yüz (ön yüz z = 0.165)
  for (const s of [-1, 1]) {
    add('head', [s * 0.075, 0.2, 0.166], [0.052, 0.062, 0.012], eye)
    add('head', [s * 0.075 + 0.012, 0.215, 0.172], [0.018, 0.018, 0.004], '#ffffff')
    add('head', [s * 0.078, 0.258, 0.168], [0.072, 0.018, 0.012], darker(hair, 0.1))
    add('head', [s * 0.125, 0.135, 0.166], [0.045, 0.025, 0.008], mix(skin, '#e8607a', 0.35))
  }
  add('head', [0, 0.108, 0.167], [0.07, 0.016, 0.01], '#7a3a3a')

  // sakal
  if (config.beard !== 'none') {
    const b = darker(hair, 0.05)
    add('head', [0, 0.132, 0.174], [0.13, 0.026, 0.02], b)
    if (config.beard === 'goatee') add('head', [0, 0.06, 0.17], [0.08, 0.07, 0.024], b)
    if (config.beard === 'short' || config.beard === 'full') {
      const full = config.beard === 'full'
      // ön yüz: kısa 0.17, gür 0.18; ağız her ikisinin önünde
      add('head', [0, full ? 0.05 : 0.06, 0.12], [0.35, full ? 0.13 : 0.09, full ? 0.12 : 0.1], b)
      for (const s of [-1, 1]) add('head', [s * 0.165, 0.15, 0.06], [0.03, 0.14, 0.13], b)
      add('head', [0, 0.108, full ? 0.185 : 0.176], [0.07, 0.016, 0.008], '#7a3a3a')
    }
  }

  // saç (top: şapka varken gizlenen tepe parçaları). Tepe başın önünden 7 mm taşar: alın çizgisi
  // başın ön yüzüyle aynı düzlemde kalmaz.
  const H = (c, s, extra = {}) => {
    if (extra.top && hat) return
    add('head', c, s, hair, extra)
  }
  const style = config.hairStyle
  if (style === 'short' || style === 'bun' || style === 'ponytail' || style === 'long') {
    H([0, 0.385, -0.0015], [0.36, 0.06, 0.347], { top: true })
    H([0, 0.265, -0.165], [0.36, 0.23, 0.04])
    for (const s of [-1, 1]) H([s * 0.176, 0.2975, -0.03], [0.03, 0.135, 0.28])
    H([0.045, 0.34, 0.167], [0.26, 0.05, 0.03], { top: true })
  }
  if (style === 'long') {
    H([0, 0.125, -0.172], [0.37, 0.43, 0.06])
    for (const s of [-1, 1]) H([s * 0.187, 0.14, -0.02], [0.04, 0.32, 0.28])
  }
  if (style === 'bun') H([0, 0.46, -0.07], [0.16, 0.12, 0.16], { top: true })
  if (style === 'ponytail') {
    H([0, 0.29, -0.2], [0.08, 0.06, 0.06])
    H([0, 0.14, -0.22], [0.1, 0.24, 0.09])
  }
  if (style === 'curly') {
    H([0, 0.385, 0], [0.4, 0.09, 0.37], { top: true })
    H([0, 0.255, -0.175], [0.39, 0.25, 0.06])
    for (const s of [-1, 1]) H([s * 0.19, 0.28, -0.02], [0.05, 0.2, 0.3])
    ;[[-0.12, 0.44, 0.08, 0.1], [0.1, 0.452, 0.04, 0.095], [-0.02, 0.447, -0.1, 0.105], [0.13, 0.434, -0.12, 0.09], [-0.15, 0.43, -0.08, 0.098], [0.0, 0.444, 0.12, 0.092]].forEach(([x, y, z, s]) =>
      H([x, y, z], [s, s * 0.7, s], { top: true }),
    )
    H([0.06, 0.32, 0.178], [0.24, 0.05, 0.03], { top: true })
  }
  if (style === 'buzz') {
    H([0, 0.372, 0.001], [0.35, 0.03, 0.342], { top: true })
    H([0, 0.28, -0.166], [0.35, 0.18, 0.02])
  }

  // aksesuarlar. Şapkalar en geniş saçtan (kıvırcık hariç) büyüktür: arkadan saç taşmaz.
  if (has('beanie')) {
    add('head', [0, 0.395, -0.005], [0.41, 0.12, 0.41], acc)
    add('head', [0, 0.325, -0.005], [0.42, 0.05, 0.42], darker(acc, 0.18))
    add('head', [0, 0.485, -0.005], [0.08, 0.06, 0.08], lighter(acc, 0.4))
  }
  if (has('cap')) {
    add('head', [0, 0.385, -0.01], [0.39, 0.09, 0.37], acc)
    add('head', [0, 0.35, 0.235], [0.3, 0.02, 0.13], darker(acc, 0.15))
    add('head', [0, 0.436, -0.01], [0.04, 0.012, 0.04], darker(acc, 0.3))
  }
  if (has('headphones')) {
    // bant başın ya da şapkanın üstünden geçer; yan çubuklar saçın ve şapkanın dışında
    const bandY = has('beanie') ? 0.47 : hat ? 0.452 : style === 'curly' ? 0.445 : 0.43
    const barX = hat || style === 'curly' ? 0.222 : 0.2
    add('head', [0, bandY, 0], [barX * 2, 0.035, 0.064], '#2a2a2e')
    for (const s of [-1, 1]) {
      add('head', [s * barX, (bandY + 0.25) / 2, 0], [0.024, bandY - 0.25, 0.045], '#2a2a2e')
      add('head', [s * (barX + 0.008), 0.2, 0], [0.06, 0.12, 0.11], acc)
    }
  }
  if (has('glasses')) {
    const g = '#1e1e22'
    for (const s of [-1, 1]) {
      const x = s * 0.075
      add('head', [x, 0.238, 0.176], [0.1, 0.012, 0.012], g)
      add('head', [x, 0.165, 0.176], [0.1, 0.012, 0.012], g)
      add('head', [x - 0.044, 0.2, 0.176], [0.012, 0.085, 0.012], g)
      add('head', [x + 0.044, 0.2, 0.176], [0.012, 0.085, 0.012], g)
      add('head', [s * 0.178, 0.226, 0.08], [0.012, 0.012, 0.18], g)
    }
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
  return parts
}
