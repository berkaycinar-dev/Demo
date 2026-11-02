import { BONES, HIP_HEIGHT } from './model'

// Procedural pozlar: her poz { hipY, hipX, hipZ, bones: [[rx, ry, rz] × kemik sayısı], show }
// döndürür. hipY: kalça ekleminin yerden yüksekliği (dünya), hipX / hipZ: köke göre yana ve ileri
// kayma. show: görünen eşya (model.PROPS). t saniye, seed avatarlar aynı anda aynı hareketi
// yapmasın diye.
//
// Dönüş yönleri (kemiğin kendi ekseninde): rx < 0 kolu / bacağı öne kaldırır, gövdede rx > 0 öne
// eğer; rz > 0 sol kolu dışa, sağ kolu içe açar; ry > 0 başı sola çevirir.
//
// Oturuşlar `sit` nesnesiyle verilir: { y: oturma yüksekliği, low?: bağdaş (minder), slope?:
// uyluklar öne eğik (kütük, kanepe), rise?: önündeki masanın oturaktan yüksekliği }.

const N = BONES.length
const zero = () => Array.from({ length: N }, () => [0, 0, 0])
const [HIPS, TORSO, HEAD, ARM_L, FORE_L, ARM_R, FORE_R, THIGH_L, SHIN_L, THIGH_R, SHIN_R] = BONES.map((_, i) => i)
const TAU = Math.PI * 2
const HALF_PI = Math.PI / 2

// 0 → 1 → 0 nabız: period saniyelik döngünün ilk `len` saniyesinde.
const pulse = (t, period, len, offset = 0) => {
  const c = (((t + offset) % period) + period) % period
  return c < len ? Math.sin((c / len) * Math.PI) : 0
}
const cycle = (t, period, offset = 0) => ((((t + offset) % period) + period) % period) / period

function base(hipY = HIP_HEIGHT) {
  const bones = zero()
  bones[ARM_L][2] = 0.06
  bones[ARM_R][2] = -0.06
  return { hipY, hipX: 0, hipZ: 0, bones, show: null }
}

// Nefes: gövde ve baş çok hafif iner kalkar.
function breathe(p, t, seed, k = 1) {
  const w = Math.sin(t * 1.6 + seed) * k
  p.bones[TORSO][0] += 0.015 * w
  p.bones[HEAD][0] -= 0.01 * w
  return p
}

const set = (p, bone, rx = 0, ry = 0, rz = 0) => {
  p.bones[bone][0] = rx
  p.bones[bone][1] = ry
  p.bones[bone][2] = rz
}

// Sol ve sağ kol birlikte: rz sol kol için verilir, sağda aynalanır.
const arms = (p, armX, armZ, foreX, foreZ = 0) => {
  set(p, ARM_L, armX, 0, armZ)
  set(p, ARM_R, armX, 0, -armZ)
  set(p, FORE_L, foreX, 0, foreZ)
  set(p, FORE_R, foreX, 0, -foreZ)
}

// Kollar arkada kenetli (manzara izleme, vitrine eğilme).
function handsBehind(p) {
  arms(p, 0.5, -0.05, 0.25, -1.2)
}

// Sağ elde göğüs önünde tutulan kap: ağza kaldırma döngüsü (k: 0 → 1 → 0).
function sipArm(p, k) {
  set(p, ARM_R, -0.3 - 0.6 * k, 0, 0.15 + 0.25 * k)
  set(p, FORE_R, -1.4 - 0.15 * k, 0, 0.6 + 0.05 * k)
  p.bones[HEAD][0] -= 0.2 * k
  p.bones[HEAD][1] *= 1 - k
}

// Dizler bükük çömelme; derin: kalça topuklara yakın.
function squat(p, depth = 1) {
  set(p, THIGH_L, -1.25 - 0.65 * depth, 0, 0.18)
  set(p, THIGH_R, -1.25 - 0.65 * depth, 0, -0.18)
  set(p, SHIN_L, 1.0 + 1.3 * depth)
  set(p, SHIN_R, 1.0 + 1.3 * depth)
  p.hipY = HIP_HEIGHT - 0.06 - 0.27 * depth
  p.hipZ = -0.06 * depth
}

export function standPose(t = 0, seed = 0) {
  return breathe(base(), t, seed)
}

// Yürüyüş: bacaklar ve kollar zıt salınır, kalça iki adımda bir hafifçe yükselir.
export function walkPose(phase) {
  const p = base()
  const s = Math.sin(phase)
  p.bones[THIGH_L][0] = 0.55 * s
  p.bones[THIGH_R][0] = -0.55 * s
  p.bones[SHIN_L][0] = Math.max(0, -s) * 0.7
  p.bones[SHIN_R][0] = Math.max(0, s) * 0.7
  p.bones[ARM_L][0] = -0.45 * s
  p.bones[ARM_R][0] = 0.45 * s
  p.bones[FORE_L][0] = -0.25
  p.bones[FORE_R][0] = -0.25
  p.bones[TORSO][1] = 0.06 * s
  p.bones[TORSO][0] = 0.05
  p.hipY = HIP_HEIGHT + 0.022 * Math.abs(Math.cos(phase))
  return p
}

// Koşu bandında koşu: geniş adım, dirsekler bükük, gövde öne eğik.
export function runPose(t, seed) {
  const phase = t * 11 + seed
  const p = base()
  const s = Math.sin(phase)
  p.bones[THIGH_L][0] = 0.75 * s - 0.1
  p.bones[THIGH_R][0] = -0.75 * s - 0.1
  p.bones[SHIN_L][0] = 0.3 + Math.max(0, -s) * 1.1
  p.bones[SHIN_R][0] = 0.3 + Math.max(0, s) * 1.1
  set(p, ARM_L, -0.6 * s, 0, 0.12)
  set(p, ARM_R, 0.6 * s, 0, -0.12)
  p.bones[FORE_L][0] = -1.4
  p.bones[FORE_R][0] = -1.4
  p.bones[TORSO][0] = 0.15
  p.bones[TORSO][1] = 0.08 * s
  p.hipY = HIP_HEIGHT - 0.03 + 0.04 * Math.abs(Math.cos(phase))
  return p
}

// ---------------------------------------------------------------- oturuş

// Oturma iskeleti. Sandalyede uyluklar öne, baldırlar aşağı; eğik oturakta (kütük, kanepe) uyluklar
// hafif aşağı; minderde bağdaş.
function seated(sit) {
  const p = base(sit.y + 0.065)
  if (sit.low) {
    set(p, THIGH_L, -HALF_PI + 0.12, 0, 0.6)
    set(p, THIGH_R, -HALF_PI + 0.06, 0, -0.6)
    set(p, SHIN_L, 0, 0, -2.35)
    set(p, SHIN_R, 0, 0, 2.35)
    p.hipZ = -0.02
    return p
  }
  const a = sit.slope ? 0.3 : 0
  set(p, THIGH_L, -HALF_PI + a, 0, 0.08)
  set(p, THIGH_R, -HALF_PI + a, 0, -0.08)
  set(p, SHIN_L, HALF_PI - a - 0.12)
  set(p, SHIN_R, HALF_PI - a - 0.12)
  p.hipZ = -0.03
  return p
}

// Masaya göre öne eğilme: alçak masada (minder) daha çok.
const deskLean = (sit) => (sit.rise != null && sit.rise < 0.22 ? 0.42 : 0)

export function sitPose(sit, t = 0, seed = 0) {
  const p = seated(sit)
  arms(p, -0.35, 0.06, -0.6)
  return breathe(p, t, seed)
}

// ---------------------------------------------------------------- odakta

// Klavyede yazma: öne eğik gövde, eller masada, parmaklar sırayla vurur, baş ara ara ekrana yaklaşır.
export function typePose(sit, t, seed) {
  const p = seated(sit)
  const lean = deskLean(sit)
  p.bones[TORSO][0] = 0.14 + lean
  p.bones[HEAD][0] = 0.05 + 0.05 * Math.sin(t * 0.4 + seed) - lean * 0.6
  for (const [arm, fore, sign, off] of [[ARM_L, FORE_L, 1, 0], [ARM_R, FORE_R, -1, Math.PI]]) {
    p.bones[arm][0] = -0.95 + lean * 0.5
    p.bones[arm][2] = -0.18 * sign
    p.bones[fore][0] = -0.62 + 0.07 * Math.max(0, Math.sin(t * 11 + off + seed))
  }
  return breathe(p, t, seed, 0.5)
}

// Masadaki ekrana dokunma: sağ el yavaşça kaydırır, sol el masanın kenarında.
export function tapPose(sit, t, seed) {
  const p = seated(sit)
  p.bones[TORSO][0] = 0.18
  p.bones[HEAD][0] = 0.3 + 0.05 * Math.sin(t * 0.5 + seed)
  set(p, ARM_L, -0.85, 0, -0.22)
  set(p, FORE_L, -0.7)
  const swipe = Math.sin(t * 1.3 + seed)
  const tap = pulse(t, 2.4, 0.3, seed)
  set(p, ARM_R, -0.95 + 0.08 * tap, 0, 0.1 + 0.14 * swipe)
  set(p, FORE_R, -0.55 + 0.12 * tap)
  return breathe(p, t, seed, 0.5)
}

// Masadaki açık kitabı okuma: kollar kitabın iki yanında, baş eğik; ~8 sn'de bir sağ el sayfa çevirir.
export function deskReadPose(sit, t, seed) {
  const p = seated(sit)
  const lean = deskLean(sit)
  p.bones[TORSO][0] = 0.24 + lean
  p.bones[HEAD][0] = 0.42 + 0.04 * Math.sin(t * 0.5 + seed) - lean * 0.4
  p.bones[HEAD][1] = 0.08 * Math.sin(t * 0.21 + seed)
  const flip = pulse(t, 8, 1.1, seed * 3)
  set(p, ARM_L, -0.8 + lean * 0.5, 0, -0.2)
  set(p, FORE_L, -0.75)
  set(p, ARM_R, -0.8 + lean * 0.5 - 0.25 * flip, 0, 0.2 + 0.32 * flip)
  set(p, FORE_R, -0.75 - 0.2 * flip)
  return breathe(p, t, seed, 0.5)
}

// Not alma: sağ el kalemle küçük daireler çizer, sol el masada, baş deftere eğik.
export function writePose(sit, t, seed, tool = 'pen') {
  const p = seated(sit)
  const lean = deskLean(sit)
  p.bones[TORSO][0] = 0.18 + lean
  p.bones[HEAD][0] = 0.3 - lean * 0.4
  p.bones[HEAD][1] = -0.1
  set(p, ARM_L, -0.85 + lean * 0.5, 0, -0.25)
  set(p, FORE_L, -0.7)
  set(p, ARM_R, -0.95 + lean * 0.5 + 0.05 * Math.sin(t * 5 + seed), 0, 0.2 + 0.04 * Math.cos(t * 5 + seed))
  set(p, FORE_R, -0.6)
  p.show = tool
  return breathe(p, t, seed, 0.5)
}

// Elde kitap ya da tablet okuma: eller gövdenin önünde, baş eğik; arada sayfa çevirir.
// sit null ise ayakta okur.
export function readPose(sit, t, seed, prop = 'book') {
  const p = sit ? seated(sit) : standPose(t, seed)
  const flip = pulse(t, 7, 0.9, seed * 2)
  p.bones[HEAD][0] = 0.32 + 0.04 * Math.sin(t * 0.5 + seed)
  set(p, ARM_L, -0.55, 0, -0.38)
  set(p, FORE_L, -1.25)
  set(p, ARM_R, -0.55 - 0.15 * flip, 0, 0.38 + 0.12 * flip)
  set(p, FORE_R, -1.25 - 0.3 * flip)
  p.show = prop
  return breathe(p, t, seed, 0.6)
}

// Düşünme: dirsek önde (masada masaya dayalı), el çenede, gözler yukarıda; öbür el masada ya da
// kucakta.
export function thinkPose(sit, t, seed) {
  const p = seated(sit)
  const desk = sit.rise != null
  p.bones[TORSO][0] = desk ? 0.2 : 0.08
  p.bones[HEAD][0] = -0.12 + 0.05 * Math.sin(t * 0.3 + seed)
  p.bones[HEAD][1] = 0.2 * Math.sin(t * 0.17 + seed)
  p.bones[HEAD][2] = 0.1
  set(p, ARM_R, -0.9, 0, 0.35)
  set(p, FORE_R, -1.8, 0.4, 0.8)
  if (desk) {
    set(p, ARM_L, -0.85, 0, -0.25)
    set(p, FORE_L, -0.75)
  } else lapHand(p, ARM_L, FORE_L, 1)
  return breathe(p, t, seed)
}

// Kucaktaki el (side: 1 sol, -1 sağ).
function lapHand(p, arm, fore, side) {
  set(p, arm, -0.55, 0, -0.25 * side)
  set(p, fore, -0.3, -0.7 * side, -0.3 * side)
}

// ---------------------------------------------------------------- uzakta

// Masada uyuma: kolların üstüne kapanmış, baş yana dönük.
export function sleepDeskPose(sit, t, seed) {
  const p = seated(sit)
  const w = Math.sin(t * 0.9 + seed)
  const low = sit.rise != null && sit.rise < 0.22
  p.bones[TORSO][0] = (low ? 1.15 : 0.95) + 0.025 * w
  set(p, HEAD, 0.25, 0, 0.45)
  set(p, ARM_L, -1.35, 0, -0.55)
  set(p, FORE_L, -0.3, -1.2)
  set(p, ARM_R, -1.35, 0, 0.55)
  set(p, FORE_R, -0.3, 1.2)
  return p
}

// Arkaya yaslanıp uyuma: eller kucakta, baş yana düşük, yavaş nefes. prop: 'newspaper' (gazete
// yüzde, baş arkada), 'bookChest' (açık kitap göğüste, eller üstünde).
export function sleepLeanPose(sit, t, seed, prop = null) {
  const p = seated(sit)
  const w = Math.sin(t * 0.9 + seed)
  p.bones[TORSO][0] = -0.22 + 0.02 * w
  if (prop === 'newspaper') set(p, HEAD, -0.3, 0, 0.08)
  else set(p, HEAD, 0.28 + 0.03 * w, 0.15, 0.45)
  if (prop === 'bookChest') {
    set(p, ARM_L, -0.45, 0, -0.1)
    set(p, FORE_L, -1.35, 0, -0.5)
    set(p, ARM_R, -0.45, 0, 0.1)
    set(p, FORE_R, -1.35, 0, 0.5)
  } else {
    lapHand(p, ARM_L, FORE_L, 1)
    lapHand(p, ARM_R, FORE_R, -1)
  }
  p.show = prop
  return p
}

// ---------------------------------------------------------------- molada, oturarak

// Rahat oturuş: arkaya yaslanır, bacak bacak üstüne atar. prop: elde içecek (yudumlar), 'phone'
// (telefona bakar), 'book' (okur) ya da yok (kollar yanlarda, etrafı seyreder).
export function loungePose(sit, t, seed, prop = null) {
  if (prop === 'book') {
    const p = readPose(sit, t, seed, 'book')
    p.bones[TORSO][0] -= 0.12
    return p
  }
  const p = seated(sit)
  p.bones[TORSO][0] = -0.14
  p.bones[HEAD][1] = 0.35 * Math.sin(t * 0.3 + seed)
  if (!sit.low) {
    set(p, THIGH_R, -HALF_PI - 0.18, 0, 0.12)
    set(p, SHIN_R, HALF_PI - 0.25)
  }
  set(p, ARM_L, -0.3, 0, -0.1)
  set(p, FORE_L, -0.9)
  if (prop === 'phone') {
    set(p, ARM_R, -0.25, 0, 0.2)
    set(p, FORE_R, -1.55, 0, 0.65)
    p.bones[HEAD][0] = 0.4
    p.bones[HEAD][1] = 0
  } else if (prop) {
    sipArm(p, pulse(t, 7, 1.6, seed * 2))
  } else {
    set(p, ARM_R, -0.3, 0, 0.1)
    set(p, FORE_R, -0.9)
  }
  p.show = prop
  return breathe(p, t, seed)
}

// Hamakta sırtüstü yatma: kalça kemiği yatar (gövde -z, bacaklar +z yönünde), baş yastıkta hafif
// kalkık, kitap göğüste ya da eller ensede.
export function liePose(sit, t, seed, prop = null) {
  const p = base(sit.y + 0.09)
  const w = Math.sin(t * 0.8 + seed)
  // hamak kavisi: kalça en altta, gövde ve bacaklar ~20° yukarı
  set(p, HIPS, -HALF_PI + 0.35)
  p.bones[TORSO][0] = 0.01 * w
  p.bones[HEAD][0] = 0.3
  p.bones[HEAD][2] = 0.15 * Math.sin(t * 0.13 + seed)
  set(p, THIGH_L, -0.85, 0, 0.06)
  set(p, SHIN_L, 0.45)
  set(p, THIGH_R, -0.7, 0, -0.06)
  set(p, SHIN_R, 0.2)
  if (prop === 'bookChest') {
    set(p, ARM_L, -0.45, 0, -0.1)
    set(p, FORE_L, -1.35, 0, -0.5)
    set(p, ARM_R, -0.45, 0, 0.1)
    set(p, FORE_R, -1.35, 0, 0.5)
  } else {
    // eller ensede: kollar başın üstüne, dirsekler yana
    set(p, ARM_L, -2.6, 0, 0.75)
    set(p, FORE_L, -2.0)
    set(p, ARM_R, -2.6, 0, -0.75)
    set(p, FORE_R, -2.0)
  }
  p.show = prop
  return p
}

// ---------------------------------------------------------------- molada, ayakta

// Etrafa bakınma, ara ara gerinme.
export function lookPose(t, seed) {
  const p = standPose(t, seed)
  p.bones[HEAD][1] = 0.45 * Math.sin(t * 0.35 + seed)
  arms(p, 0, 0.12, -0.15)
  const k = pulse(t, 14, 2, seed * 3)
  if (k) stretchArms(p, k)
  return p
}

function stretchArms(p, k) {
  p.bones[ARM_L][0] = -2.8 * k
  p.bones[ARM_R][0] = -2.8 * k
  p.bones[ARM_L][2] = 0.06 + 0.25 * k
  p.bones[ARM_R][2] = -0.06 - 0.25 * k
  p.bones[FORE_L][0] *= 1 - k
  p.bones[FORE_R][0] *= 1 - k
  p.bones[TORSO][0] -= 0.12 * k
  p.bones[HEAD][0] -= 0.3 * k
}

// Gerinme ve esneme (~9 sn'de bir), arada omuz çevirme.
export function stretchPose(t, seed) {
  const p = standPose(t, seed)
  p.bones[HEAD][1] = 0.3 * Math.sin(t * 0.35 + seed)
  stretchArms(p, pulse(t, 9, 2, seed * 3))
  const roll = pulse(t, 9, 1.4, seed * 3 + 4.5)
  p.bones[ARM_L][0] += 0.4 * Math.sin(roll * TAU) * roll
  p.bones[ARM_R][0] += 0.4 * Math.sin(roll * TAU) * roll
  return p
}

// İçecek: elde kap, ~6 sn'de bir yudum.
export function sipPose(t, seed, prop = 'mug') {
  const p = standPose(t, seed)
  p.bones[HEAD][1] = 0.4 * Math.sin(t * 0.35 + seed)
  arms(p, 0, 0.1, -0.15)
  sipArm(p, pulse(t, 6, 1.6, seed * 2))
  p.show = prop
  return p
}

// Yemek: simit (elden ısırır) ya da ramen (sol elde kâse, sağ elde çubuklarla ağza).
export function eatPose(t, seed, prop) {
  const p = standPose(t, seed)
  const k = pulse(t, 4, 1.2, seed * 2)
  p.bones[HEAD][1] = 0.2 * Math.sin(t * 0.3 + seed)
  if (prop === 'ramen') {
    set(p, ARM_L, -0.35, 0, -0.25)
    set(p, FORE_L, -1.45, 0, -0.5)
    set(p, ARM_R, -0.4 - 0.35 * k, 0, 0.3 + 0.1 * k)
    set(p, FORE_R, -1.3 - 0.6 * k)
    p.bones[HEAD][0] = 0.3 - 0.15 * k
  } else {
    set(p, ARM_L, 0, 0, 0.1)
    set(p, FORE_L, -0.15)
    sipArm(p, k)
  }
  p.show = prop
  return p
}

// Manzara izleme: eller arkada, baş yavaşça döner, ara ara ağırlık bir ayağa geçer.
export function viewPose(t, seed) {
  const p = standPose(t, seed)
  handsBehind(p)
  p.bones[HEAD][1] = 0.4 * Math.sin(t * 0.22 + seed)
  p.bones[HEAD][0] = -0.05 + 0.05 * Math.sin(t * 0.17 + seed)
  const shift = Math.sin(t * 0.25 + seed * 2)
  p.hipX = 0.025 * shift
  p.bones[TORSO][2] = -0.03 * shift
  return p
}

// Cama yakın izleme: bir el ara ara cama / gördüğü şeye uzanır.
export function glassPose(t, seed) {
  const p = viewPose(t, seed)
  const k = pulse(t, 7, 3, seed * 2)
  if (k) {
    const s = Math.min(1, k * 1.6)
    set(p, ARM_R, -1.45 * s + 0.5 * (1 - s), 0, -0.06 - 0.1 * s)
    set(p, FORE_R, -0.2 * s + 0.25 * (1 - s), 0, -1.2 * (1 - s))
    p.bones[HEAD][1] = -0.15 * s + p.bones[HEAD][1] * (1 - s)
  }
  return p
}

// Eğilip aşağı bakma (vitrin).
export function lookDownPose(t, seed) {
  const p = standPose(t, seed)
  handsBehind(p)
  p.bones[TORSO][0] = 0.35
  p.bones[HEAD][0] = 0.4 + 0.05 * Math.sin(t * 0.4 + seed)
  p.bones[HEAD][1] = 0.25 * Math.sin(t * 0.2 + seed)
  return p
}

// Çömelip aşağı bakma (zemin penceresi, dalış havuzu); kollar dizlerde.
export function kneelLookPose(t, seed) {
  const p = base()
  squat(p, 1)
  p.bones[TORSO][0] = 0.55
  p.bones[HEAD][0] = 0.45 + 0.05 * Math.sin(t * 0.4 + seed)
  p.bones[HEAD][1] = 0.3 * Math.sin(t * 0.25 + seed)
  arms(p, -1.05, -0.1, -0.35)
  return breathe(p, t, seed, 0.5)
}

// Çömelip çadırda bir şey arama.
export function crouchPose(t, seed) {
  const p = base()
  squat(p, 0.85)
  p.bones[TORSO][0] = 0.6
  p.bones[HEAD][0] = 0.1
  const r = Math.sin(t * 3 + seed)
  set(p, ARM_L, -1.2 + 0.15 * r, 0, -0.1)
  set(p, FORE_L, -0.3)
  set(p, ARM_R, -1.2 - 0.15 * r, 0, 0.1)
  set(p, FORE_R, -0.3)
  return p
}

// Ayakta panel kullanma (konsol, sonar); wall: dikey ekranı kaydırma (veri duvarı).
export function panelPose(t, seed, wall = false) {
  const p = standPose(t, seed)
  p.bones[HEAD][1] = 0.3 * Math.sin(t * 0.3 + seed)
  if (wall) {
    const s = Math.sin(t * 0.9 + seed)
    p.bones[HEAD][0] = -0.12
    set(p, ARM_R, -1.75, 0, 0.1 + 0.35 * s)
    set(p, FORE_R, -0.25)
    set(p, ARM_L, -0.2 - 0.9 * pulse(t, 5, 2, seed), 0, 0.12)
    set(p, FORE_L, -0.3)
    return p
  }
  p.bones[TORSO][0] = 0.08
  p.bones[HEAD][0] = 0.3
  // eller göğüs hizasında panelin üstünde, parmaklar sırayla dokunur
  for (const [arm, fore, sign, off] of [[ARM_L, FORE_L, 1, 0], [ARM_R, FORE_R, -1, 1.7]]) {
    set(p, arm, -0.8, 0, (-0.15 + 0.08 * Math.sin(t * 0.7 + off + seed)) * sign)
    set(p, fore, -1.05 + 0.12 * Math.max(0, Math.sin(t * 6 + off + seed)), 0, -0.3 * sign)
  }
  return p
}

// Pano: çene elde düşünme, ara ara uzanıp not yapıştırma.
export function boardPose(t, seed) {
  const p = standPose(t, seed)
  p.bones[HEAD][0] = -0.15
  p.bones[HEAD][1] = 0.2 * Math.sin(t * 0.25 + seed)
  set(p, ARM_L, -0.35, 0, -0.3)
  set(p, FORE_L, -1.5, 0, -0.9)
  const k = pulse(t, 8, 1.8, seed * 2)
  set(p, ARM_R, -0.75 - 1.6 * k, 0, 0.32 * (1 - k))
  set(p, FORE_R, -2.1 * (1 - k) - 0.15 * k)
  return p
}

// Kart kataloğu: eğilip çekmecedeki kartları karıştırma.
export function browsePose(t, seed) {
  const p = standPose(t, seed)
  p.bones[TORSO][0] = 0.3
  p.bones[HEAD][0] = 0.45
  const f = Math.max(0, Math.sin(t * 4 + seed))
  set(p, ARM_L, -0.75, 0, -0.18)
  set(p, FORE_L, -0.55)
  set(p, ARM_R, -0.8, 0, 0.12)
  set(p, FORE_R, -0.5 - 0.25 * f)
  return p
}

// Şöminede el ısıtma: eller ateşe uzanır, ara ara ovuşturulur.
export function warmPose(t, seed) {
  const p = standPose(t, seed)
  p.bones[HEAD][0] = 0.1
  const rub = pulse(t, 5, 1.6, seed * 2)
  const r = Math.sin(t * 14) * rub
  set(p, ARM_L, -1.15 + 0.2 * rub, 0, -0.18 - 0.1 * rub + 0.06 * r)
  set(p, FORE_L, -0.35 - 0.5 * rub)
  set(p, ARM_R, -1.15 + 0.2 * rub, 0, 0.18 + 0.1 * rub + 0.06 * r)
  set(p, FORE_R, -0.35 - 0.5 * rub)
  return p
}

// Telefona bakma: sağ elde telefon, baş eğik, başparmak ara ara dokunur.
export function phonePose(t, seed) {
  const p = standPose(t, seed)
  p.bones[HEAD][0] = 0.42
  p.bones[HEAD][1] = 0.06 * Math.sin(t * 0.4 + seed)
  set(p, ARM_L, 0.05, 0, 0.1)
  set(p, FORE_L, -0.2)
  set(p, ARM_R, -0.25, 0, 0.2)
  set(p, FORE_R, -1.55 - 0.06 * pulse(t, 1.3, 0.25, seed), 0, 0.65)
  p.show = 'phone'
  return p
}

// Müzik kutusunun önünde dans: tempoya göre sekme, kollar sırayla.
export function dancePose(t, seed) {
  const p = base()
  const beat = t * 2.1 * TAU + seed
  const bob = Math.abs(Math.sin(beat / 2))
  p.hipY = HIP_HEIGHT - 0.035 * bob
  set(p, THIGH_L, -0.22 * bob, 0, 0.05)
  set(p, THIGH_R, -0.22 * bob, 0, -0.05)
  set(p, SHIN_L, 0.42 * bob)
  set(p, SHIN_R, 0.42 * bob)
  const s = Math.sin(beat / 2)
  p.bones[TORSO][2] = 0.1 * s
  p.bones[TORSO][1] = 0.15 * Math.sin(beat / 4)
  p.bones[HEAD][0] = 0.12 * bob
  p.bones[HEAD][2] = -0.08 * s
  set(p, ARM_L, -1.0 - 0.5 * Math.max(0, s), 0, 0.25)
  set(p, FORE_L, -1.3)
  set(p, ARM_R, -1.0 - 0.5 * Math.max(0, -s), 0, -0.25)
  set(p, FORE_R, -1.3)
  return p
}

// Dart: nişan alıp fırlatma (~3.5 sn'de bir); atıştan sonra elde dart görünmez.
export function dartsPose(t, seed) {
  const p = standPose(t, seed)
  const c = cycle(t, 3.5, seed * 2) * 3.5
  const aim = Math.min(1, c / 1.2)
  const throwK = c > 2.0 && c < 2.35 ? (c - 2.0) / 0.35 : c >= 2.35 ? 1 : 0
  const back = c > 2.6 ? Math.min(1, (c - 2.6) / 0.6) : 0
  p.bones[HEAD][0] = -0.05
  set(p, ARM_R, -1.5 * aim * (1 - back) - 0.2 * throwK * (1 - back), 0, 0.12)
  set(p, FORE_R, (-1.4 * aim + 1.3 * throwK) * (1 - back) - 0.15 * back)
  p.bones[TORSO][0] = 0.06 * throwK * (1 - back)
  set(p, ARM_L, -0.25, 0, 0.15)
  set(p, FORE_L, -0.6)
  p.show = c < 2.2 || c > 3.2 ? 'dart' : null
  return p
}

// Bilardo: masa avatarın göğüs hizasında; hafif eğilip ıstakayı göğüs önünde masanın üstünden
// uzatır. Sol el ileride köprü, sağ el ıstakayı ileri geri sürer; ara ara doğrulup bakar.
export function poolPose(t, seed) {
  const p = standPose(t, seed)
  const look = pulse(t, 7, 2.5, seed)
  const stroke = Math.sin(t * 2.4 + seed) * (1 - look)
  p.bones[TORSO][0] = 0.18 * (1 - look)
  p.bones[HEAD][0] = 0.25
  p.bones[HEAD][1] = 0.3 * look * Math.sin(t * 0.9)
  set(p, THIGH_L, -0.2, 0, 0.1)
  set(p, SHIN_L, 0.2)
  set(p, ARM_L, -1.45, 0, -0.08)
  set(p, FORE_L, -0.15)
  set(p, ARM_R, -1.2 + 0.12 * stroke, 0, 0.3)
  set(p, FORE_R, -0.55 - 0.12 * stroke)
  p.show = 'cue'
  return p
}

// Masa tenisi: dizler bükük, raket elde, ~1.4 sn'de bir vuruş, yanlara küçük adımlar.
export function pingpongPose(t, seed) {
  const p = base()
  const c = cycle(t, 1.4, seed)
  const hit = Math.sin(c * TAU)
  // raket masa yüzeyinin üstünde (omuz hizası), gövde vuruşla döner
  p.hipY = HIP_HEIGHT - 0.03
  p.hipX = 0.08 * Math.sin(t * 0.9 + seed)
  set(p, THIGH_L, -0.3, 0, 0.15)
  set(p, THIGH_R, -0.3, 0, -0.15)
  set(p, SHIN_L, 0.5)
  set(p, SHIN_R, 0.5)
  p.bones[TORSO][0] = 0.1
  p.bones[TORSO][1] = 0.35 * hit
  p.bones[HEAD][0] = 0.05
  p.bones[HEAD][1] = -0.3 * hit
  set(p, ARM_R, -1.35 - 0.2 * Math.max(0, hit), 0, -0.35 + 0.55 * hit)
  set(p, FORE_R, -0.5)
  set(p, ARM_L, -0.7, 0, 0.3)
  set(p, FORE_L, -1.1)
  p.show = 'paddle'
  return p
}

// Teleskop: eğilip göz merceğe, eller tüpte; ara ara doğrulup çıplak gözle bakar.
export function telescopePose(t, seed) {
  const p = standPose(t, seed)
  const up = pulse(t, 11, 3, seed * 2)
  const look = 1 - up
  p.bones[TORSO][0] = 0.4 * look
  p.bones[HEAD][0] = -0.25 * look - 0.2 * up
  p.bones[HEAD][1] = 0.3 * up * Math.sin(t * 0.8)
  // eller yüzün önünde, tüpün iki yanında
  set(p, ARM_L, -1.1 * look, 0, -0.25 * look + 0.1 * up)
  set(p, FORE_L, -1.25 * look - 0.15 * up, 0, -0.4 * look)
  set(p, ARM_R, -1.1 * look, 0, 0.25 * look - 0.1 * up)
  set(p, FORE_R, -1.25 * look - 0.15 * up, 0, 0.4 * look)
  return p
}

// Kazan karıştırma: iki el kepçede, daire çizer.
export function stirPose(t, seed) {
  const p = standPose(t, seed)
  const a = t * 2.4 + seed
  p.bones[TORSO][0] = 0.22
  p.bones[HEAD][0] = 0.35
  set(p, ARM_R, -0.95 + 0.18 * Math.sin(a), 0, 0.3 + 0.15 * Math.cos(a))
  set(p, FORE_R, -0.55)
  set(p, ARM_L, -0.95 + 0.18 * Math.sin(a), 0, -0.05 + 0.15 * Math.cos(a))
  set(p, FORE_L, -0.6, 0, -0.35)
  p.show = 'ladle'
  return p
}

// Kristal küre: eller kürenin üstünde süzülür, yavaş daireler.
export function crystalPose(t, seed) {
  const p = standPose(t, seed)
  const a = t * 1.1 + seed
  p.bones[TORSO][0] = 0.15
  p.bones[HEAD][0] = 0.4
  set(p, ARM_L, -1.05 + 0.15 * Math.sin(a), 0, -0.05 + 0.15 * Math.cos(a))
  set(p, FORE_L, -0.45)
  set(p, ARM_R, -1.05 + 0.15 * Math.sin(a + Math.PI), 0, 0.05 - 0.15 * Math.cos(a + Math.PI))
  set(p, FORE_R, -0.45)
  return p
}

// Simya tezgâhı: elde şişe, çalkalayıp ışığa tutar.
export function potionPose(t, seed) {
  const p = standPose(t, seed)
  const lift = pulse(t, 6, 2.5, seed * 2)
  const swirl = Math.sin(t * 7) * (1 - lift)
  p.bones[TORSO][0] = 0.12
  p.bones[HEAD][0] = 0.25 - 0.4 * lift
  set(p, ARM_R, -0.6 - 0.7 * lift, 0, 0.25 + 0.06 * swirl)
  set(p, FORE_R, -1.1 - 0.5 * lift, 0, 0.1 * swirl)
  set(p, ARM_L, -0.75, 0, -0.15)
  set(p, FORE_L, -0.5)
  p.show = 'flask'
  return p
}

// VR: gözlük takılı, kollar havada bir şeyleri tutup çevirir, baş etrafa bakar.
export function vrPose(t, seed) {
  const p = standPose(t, seed)
  const a = t * 1.3 + seed
  p.bones[HEAD][1] = 0.5 * Math.sin(t * 0.4 + seed)
  p.bones[HEAD][0] = -0.1 * Math.sin(t * 0.3)
  p.bones[TORSO][1] = 0.2 * Math.sin(t * 0.4 + seed)
  set(p, ARM_L, -1.3 + 0.4 * Math.sin(a), 0, 0.2 + 0.2 * Math.cos(a))
  set(p, FORE_L, -0.5)
  set(p, ARM_R, -1.3 + 0.4 * Math.sin(a + 2), 0, -0.2 - 0.2 * Math.cos(a + 2))
  set(p, FORE_R, -0.5)
  p.show = 'vr'
  return p
}

// Bitki sulama: elde kova, ara ara eğip sular.
export function waterPose(t, seed) {
  const p = standPose(t, seed)
  const pour = pulse(t, 6, 2.6, seed * 2)
  p.bones[TORSO][0] = 0.12 + 0.12 * pour
  p.bones[HEAD][0] = 0.4
  p.bones[HEAD][1] = 0.2 * Math.sin(t * 0.3 + seed)
  set(p, ARM_R, -0.5 - 0.35 * pour, 0, 0.1)
  set(p, FORE_R, -0.6, 0, -0.5 * pour)
  set(p, ARM_L, 0, 0, 0.1)
  set(p, FORE_L, -0.2)
  p.show = 'watering'
  return p
}

// Olta: iki elde kamış, ucu yukarıda; ~10 sn'de bir atış.
export function fishPose(t, seed) {
  const p = standPose(t, seed)
  const cast = pulse(t, 10, 1.4, seed * 3)
  p.bones[HEAD][0] = 0.12
  p.bones[HEAD][1] = 0.15 * Math.sin(t * 0.2 + seed)
  set(p, ARM_R, -0.75 - 1.2 * cast, 0, 0.12)
  set(p, FORE_R, -0.95 + 0.4 * cast)
  set(p, ARM_L, -0.65 - 0.9 * cast, 0, -0.3)
  set(p, FORE_L, -1.2)
  p.show = 'rod'
  return p
}

// Taş sektirme: yan koldan fırlatma (~4.5 sn'de bir); atıştan sonra elde taş yok.
export function skipPose(t, seed) {
  const p = viewPose(t, seed)
  const c = cycle(t, 4.5, seed * 2) * 4.5
  if (c < 1.6) {
    const wind = Math.min(1, c / 0.8)
    const fling = c > 1.1 ? (c - 1.1) / 0.5 : 0
    p.hipX = 0
    squatLight(p, 0.5 * wind)
    p.bones[TORSO][1] = -0.5 * wind + 0.9 * fling
    p.bones[HEAD][1] = 0.3 * wind - 0.3 * fling
    set(p, ARM_R, -0.4 * wind, 0, -1.0 * wind + 1.2 * fling)
    set(p, FORE_R, -0.5 * wind)
    set(p, ARM_L, -0.3 * wind, 0, 0.5 * wind)
    set(p, FORE_L, -0.4)
    p.show = c < 1.25 ? 'stone' : null
  }
  return p
}

function squatLight(p, k) {
  p.hipY = HIP_HEIGHT - 0.06 * k
  set(p, THIGH_L, -0.35 * k, 0, 0.1)
  set(p, THIGH_R, -0.35 * k, 0, -0.1)
  set(p, SHIN_L, 0.6 * k)
  set(p, SHIN_R, 0.6 * k)
}

// Çeşmeden su içme: eğilir, avuçla ağza.
export function drinkPose(t, seed) {
  const p = standPose(t, seed)
  const k = pulse(t, 5, 2.2, seed * 2)
  p.bones[TORSO][0] = 0.25 + 0.55 * k
  p.bones[HEAD][0] = 0.1 - 0.3 * k
  set(p, THIGH_L, -0.15 * k, 0, 0.06)
  set(p, THIGH_R, -0.15 * k, 0, -0.06)
  set(p, ARM_R, -0.6 - 0.7 * k, 0, 0.25)
  set(p, FORE_R, -0.6 - 1.0 * k)
  set(p, ARM_L, -0.3, 0, 0.1)
  set(p, FORE_L, -0.4)
  return p
}

// İki poz arasında doğrusal geçiş (k = 0 → a, 1 → b). Görünen eşya yarıdan sonra b'ninki olur.
export function blendPose(a, b, k) {
  const bones = a.bones.map((r, i) => r.map((v, j) => v + (b.bones[i][j] - v) * k))
  const mixv = (x, y) => (x ?? 0) + ((y ?? 0) - (x ?? 0)) * k
  return { hipY: mixv(a.hipY, b.hipY), hipX: mixv(a.hipX, b.hipX), hipZ: mixv(a.hipZ, b.hipZ), bones, show: k < 0.5 ? a.show : b.show }
}

export const smooth = (k) => k * k * (3 - 2 * k)
export { TAU }

// Mola hareketleri: ad → (t, seed, prop) => poz. Mola yerleri (activities.js) bunlara bağlanır.
export const STAND_POSES = {
  look: lookPose,
  stretch: stretchPose,
  sip: sipPose,
  eat: eatPose,
  view: viewPose,
  glass: glassPose,
  lookDown: lookDownPose,
  kneelLook: kneelLookPose,
  crouch: crouchPose,
  panel: (t, seed) => panelPose(t, seed, false),
  wall: (t, seed) => panelPose(t, seed, true),
  board: boardPose,
  browse: browsePose,
  warm: warmPose,
  phone: phonePose,
  dance: dancePose,
  darts: dartsPose,
  pool: poolPose,
  pingpong: pingpongPose,
  telescope: telescopePose,
  stir: stirPose,
  crystal: crystalPose,
  potion: potionPose,
  vr: vrPose,
  water: waterPose,
  fish: fishPose,
  skip: skipPose,
  drink: drinkPose,
  read: (t, seed) => readPose(null, t, seed, 'book'),
  run: runPose,
}

// Denetim betikleri (check_avatar) için örnek pozlar.
const CHAIR = { y: 0.5, rise: 0.28 }
const LOW = { y: 0.21, low: true, rise: 0.16 }
const LOG = { y: 0.42, slope: true }
export const POSE_SAMPLES = [
  { name: 'stand', pose: standPose(0, 0) },
  { name: 'walk', pose: walkPose(1.2) },
  { name: 'walk2', pose: walkPose(4.0) },
  { name: 'sit', pose: sitPose(CHAIR) },
  { name: 'sitLow', pose: sitPose(LOW) },
  { name: 'sitLog', pose: sitPose(LOG) },
  { name: 'type', pose: typePose(CHAIR, 0.3, 0) },
  { name: 'tap', pose: tapPose(CHAIR, 1, 0) },
  { name: 'deskRead', pose: deskReadPose(CHAIR, 0.5, 0) },
  { name: 'write', pose: writePose(CHAIR, 0, 0) },
  { name: 'quill', pose: writePose(LOW, 0, 0, 'quill') },
  { name: 'read', pose: readPose(LOG, 0, 0) },
  { name: 'tablet', pose: readPose(CHAIR, 0, 0, 'tablet') },
  { name: 'think', pose: thinkPose(CHAIR, 0, 0) },
  { name: 'sleepDesk', pose: sleepDeskPose(CHAIR, 0, 0) },
  { name: 'sleepLean', pose: sleepLeanPose(CHAIR, 0, 0) },
  { name: 'newspaper', pose: sleepLeanPose(CHAIR, 0, 0, 'newspaper') },
  { name: 'bookChest', pose: sleepLeanPose(LOG, 0, 0, 'bookChest') },
  { name: 'lounge', pose: loungePose(LOG, 0.5, 0, 'mug') },
  { name: 'lie', pose: liePose({ y: 0.6 }, 0, 0) },
  ...Object.entries(STAND_POSES).map(([name, fn]) => ({ name, pose: fn(1.0, 0.3, name === 'eat' ? 'simit' : name === 'sip' ? 'mug' : undefined) })),
]
