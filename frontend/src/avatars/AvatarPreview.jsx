import { Canvas, useFrame, useThree } from '@react-three/fiber'
import '../rooms/core/quietClock'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { BONE_INDEX, SCALE, buildAvatarParts } from './model'
import { OVER_HEAD } from './options'
import { GESTURES, STAND_POSES, deskReadPose, gesturePose, sleepDeskPose, standPose, typePose, walkPose, writePose } from './poses'
import { computeBones, createBoneMatrices, headTop, writeParts } from './render'
import './AvatarPreview.css'

const BOX = new BoxGeometry()
const SEAT_Y = 0.47
const DESK_Y = 0.75
const DESK_Z = 0.23
// Oturuş ve masa ölçüleri (poses.js `sit`): masanın ön kenarı ve masadaki eşya (dizüstü ya da kitap).
const SIT = {
  read: { y: SEAT_Y, rise: DESK_Y - SEAT_Y, edge: DESK_Z, near: 0.29, far: 0.51, item: DESK_Y + 0.016 - SEAT_Y },
  type: { y: SEAT_Y, rise: DESK_Y - SEAT_Y, edge: DESK_Z, near: 0.28, far: 0.46, item: DESK_Y + 0.015 - SEAT_Y },
}
// Molada sırayla gösterilen hareketler (her biri 7 sn).
const BREAK_CYCLE = [['sip', 'mug'], ['phone'], ['stretch'], ['dance'], ['view']]
const FPS = 24
const YAW_PER_PIXEL = 0.01
// bundan az kayan basış sürükleme değil tıklamadır
const CLICK_SLOP = 4
const DEG = Math.PI / 180
// Kamera odakları (bölge × poz): bakılan nokta (anchor: Figure'ın her karede yazdığı konum; tam boy
// sabit noktaya bakar), bakış yüksekliği (derece), görünen alan (genişlik, yükseklik; m) ve masadaki
// başın kameraya kalkması (lift: 0 kalkmaz, 1 tam kalkar; uyurken baş yana yatık kalır).
//   odakta / uzakta: masa başında; ayak ve alt odağı alçaktan, masanın altından bakar; bilek yukarıdan.
//   molada / yürüyüş: ayakta; ayak ve alt odağı yukarıdan, bilek ve yüz göz hizasından.
const SEATED = {
  full: { elev: 24, span: [2.3, 1.9] },
  face: { anchor: 'head', elev: 12, span: [0.95, 0.75], lift: 1 },
  hat: { anchor: 'hat', elev: 14, span: [1, 0.8], lift: 1 },
  chest: { anchor: 'chest', elev: 14, span: [0.95, 0.75], lift: 1 },
  wrist: { anchor: 'wrist', elev: 28, span: [0.75, 0.6], lift: 1 },
  upper: { anchor: 'upper', elev: 18, span: [1.3, 1.05], lift: 0.6 },
  legs: { anchor: 'legs', elev: 7, span: [1.35, 1.08] },
  feet: { anchor: 'feet', elev: 5, span: [1.3, 1.05] },
}
const STANDING = {
  full: { elev: 24, span: [2.3, 1.9] },
  face: { anchor: 'head', elev: 10, span: [0.9, 0.72] },
  hat: { anchor: 'hat', elev: 12, span: [1, 0.8] },
  chest: { anchor: 'chest', elev: 12, span: [0.9, 0.72] },
  wrist: { anchor: 'wrist', elev: 14, span: [0.8, 0.64] },
  upper: { anchor: 'upper', elev: 16, span: [1.3, 1.04] },
  legs: { anchor: 'legs', elev: 16, span: [1.05, 0.84] },
  feet: { anchor: 'feet', elev: 18, span: [1.0, 0.8] },
}
const VIEWS = {
  focus: SEATED,
  // uyurken: baş kolların üstünde, yüz kameraya yarı döner; yukarıdan bakılır
  away: {
    ...SEATED,
    face: { anchor: 'head', elev: 26, span: [0.95, 0.75], lift: 0.55 },
    hat: { anchor: 'hat', elev: 30, span: [1.05, 0.84], lift: 0.55 },
    chest: { anchor: 'chest', elev: 24, span: [1.05, 0.84], lift: 0.55 },
    wrist: { anchor: 'wrist', elev: 32, span: [0.8, 0.64], lift: 0.55 },
    upper: { anchor: 'upper', elev: 28, span: [1.35, 1.08], lift: 0.4 },
  },
  break: STANDING,
  // yürürken bacaklar salınır: alt ve ayak odağı daha geniş
  walk: { ...STANDING, legs: { anchor: 'legs', elev: 14, span: [1.15, 0.92] }, feet: { anchor: 'feet', elev: 14, span: [1.15, 0.92] } },
}
const viewOf = (mode, focus) => (VIEWS[mode] ?? SEATED)[focus] ?? SEATED.full
const FULL_TARGET = new Vector3(0, 0.62, 0)
// geçişin hızı (1/sn) ve kameranın artık kendiliğinden kare istemediği yakınlık
const EASE = 5
const SETTLED = 0.002
const { hips: HIPS, torso: TORSO, head: HEAD, foreL: FORE_L, shinL: SHIN_L, shinR: SHIN_R } = BONE_INDEX

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Önizleme sahnesinin sabit kutuları: platform, sandalye, masa ve masa üstü (etkinliğe göre).
function sceneBoxes(withDesk, activity) {
  const out = []
  const add = (x, y, z, w, h, d, color) => out.push({ c: [x + w / 2, y + h / 2, z + d / 2], s: [w, h, d], color })
  // basamaklı yuvarlak platform
  for (const [r, y, color] of [[1.05, 0, '#d9d2c4'], [0.95, 0.04, '#e9e3d6']]) {
    for (let z = -r; z < r - 1e-3; z += 0.1) {
      const c = z + 0.05
      const half = Math.sqrt(Math.max(r * r - c * c, 0))
      add(-half, y - 0.04, z, 2 * half, 0.04, 0.1, color)
    }
  }
  if (!withDesk) return out
  const wood = '#8a5a36'
  const dark = '#5e3a22'
  // sandalye (oturan +z yönüne bakar)
  for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) add(x - 0.02, 0, z - 0.02, 0.04, SEAT_Y - 0.04, 0.04, dark)
  add(-0.21, SEAT_Y - 0.04, -0.21, 0.42, 0.04, 0.42, wood)
  for (const x of [-0.19, 0.15]) add(x, SEAT_Y, -0.22, 0.04, 0.42, 0.04, dark)
  add(-0.17, SEAT_Y + 0.25, -0.215, 0.34, 0.14, 0.03, wood)
  // masa (ön kenarı DESK_Z); eşyalar SIT ölçüleriyle aynı yerde
  add(-0.55, DESK_Y - 0.04, DESK_Z, 1.1, 0.04, 0.55, wood)
  for (const x of [-0.5, 0.46]) for (const z of [0.27, 0.72]) add(x, 0, z, 0.04, DESK_Y - 0.04, 0.04, dark)
  if (activity === 'type') {
    // dizüstü: klavye tabanı, tuş alanı, dik ekran
    add(-0.17, DESK_Y, 0.28, 0.34, 0.015, 0.18, '#c8ccd2')
    add(-0.15, DESK_Y + 0.015, 0.33, 0.3, 0.003, 0.1, '#3a3d44')
    add(-0.15, DESK_Y + 0.015, 0.295, 0.08, 0.002, 0.03, '#9aa0a8')
    add(-0.17, DESK_Y + 0.015, 0.46, 0.34, 0.22, 0.012, '#c8ccd2')
    add(-0.15, DESK_Y + 0.035, 0.458, 0.3, 0.18, 0.003, '#5ad0ff')
  } else {
    add(-0.21, DESK_Y, 0.29, 0.42, 0.01, 0.22, '#7a2a24')
    add(-0.2, DESK_Y + 0.01, 0.3, 0.195, 0.006, 0.2, '#f4eedf')
    add(0.005, DESK_Y + 0.01, 0.3, 0.195, 0.006, 0.2, '#f4eedf')
  }
  add(0.3, DESK_Y, 0.4, 0.08, 0.09, 0.08, '#f2efe8')
  add(0.31, DESK_Y + 0.09, 0.41, 0.06, 0.003, 0.06, '#4a2f22')
  // masa lambası
  add(-0.44, DESK_Y, 0.55, 0.12, 0.02, 0.12, '#2e2c2a')
  add(-0.39, DESK_Y + 0.02, 0.6, 0.02, 0.3, 0.02, '#2e2c2a')
  add(-0.45, DESK_Y + 0.3, 0.52, 0.14, 0.08, 0.16, '#e8a03a')
  return out
}

// Kamera odağa (focus) yumuşak geçer: bakılan nokta, bakış yüksekliği ve yakınlık birlikte kayar.
// anchorsRef: Figure'ın her karede yazdığı bölge konumları. Hareket azaltılmışsa anında geçer.
function CameraRig({ view, mode, focus, anchorsRef, animated }) {
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const cur = useRef(null)
  // odak ya da poz değişince ilk kareyi iste (hareket azaltılmışken başka kare istenmez)
  useEffect(() => invalidate(), [focus, mode, invalidate])
  useFrame(({ camera, invalidate }, dt) => {
    const f = viewOf(mode, focus)
    const a = anchorsRef.current
    const target = f.anchor ? a[f.anchor] : FULL_TARGET
    // başlık odağı uzun şapkayı (silindir, büyücü) da sığdırır
    const tall = f.anchor === 'hat' ? Math.max(1, (a.hatSize + 0.3) / 0.73) : 1
    const zoom = Math.min(size.width / (f.span[0] * tall), size.height / (f.span[1] * tall))
    const goal = { x: target.x, y: target.y, z: target.z, elev: f.elev * DEG, zoom }
    if (!cur.current) cur.current = { ...goal }
    const c = cur.current
    const k = animated ? 1 - Math.exp(-Math.min(dt, 0.1) * EASE) : 1
    let gap = 0
    for (const key of ['x', 'y', 'z', 'elev']) {
      gap = Math.max(gap, Math.abs(goal[key] - c[key]))
      c[key] += (goal[key] - c[key]) * k
    }
    gap = Math.max(gap, Math.abs(goal.zoom / c.zoom - 1))
    c.zoom *= (goal.zoom / c.zoom) ** k
    // geçiş sürerken kare iste (animasyonsuz pozda da); oturduktan sonra Ticker yeter
    if (gap > SETTLED) invalidate()
    const az = Math.PI / 4 + view.current.yaw
    const flat = Math.cos(c.elev) * 10
    camera.position.set(c.x + Math.sin(az) * flat, c.y + Math.sin(c.elev) * 10, c.z + Math.cos(az) * flat)
    camera.lookAt(c.x, c.y, c.z)
    if (camera.zoom !== c.zoom) {
      camera.zoom = c.zoom
      camera.updateProjectionMatrix()
    }
  })
  return null
}

// Yakın odakta masadaki karakter başını kaldırıp kameraya bakar (lift 0..1 arası geçiş). Uyurken
// (keepRoll) baş yana yatık kalır, yüz kameraya döner.
function liftHead(pose, lift, camYaw, keepRoll) {
  if (lift < 1e-3) return pose
  const b = pose.bones
  const pitch = b[HIPS][0] + b[TORSO][0]
  const yaw = Math.atan2(Math.sin(camYaw), Math.cos(camYaw)) - b[HIPS][1] - b[TORSO][1]
  const look = [-pitch - 0.12, Math.max(-0.55, Math.min(0.55, yaw * 0.6)), keepRoll ? b[HEAD][2] : 0]
  const head = b[HEAD].map((v, i) => v + (look[i] - v) * lift)
  return { ...pose, bones: b.map((r, i) => (i === HEAD ? head : r)) }
}

// Değişiklik tepkisi (Figure): başta çöküş, toparlanırken hafif uzama, sonra durur; esneme yaylanması
// yok. Oturanda pivot oturak, genlik yarım (ayaklar yerden az kalkar); ayakta pivot zemin.
const SETTLE_MS = { soft: 320, strong: 480 }
const SETTLE_AMP = { soft: 0.045, strong: 0.08 }
const HOP = 0.05
function settle(group, reaction, seated, invalidate) {
  const r = reaction.current
  if (!r || !group) return
  const kind = r.strong ? 'strong' : 'soft'
  const p = (performance.now() - r.start) / SETTLE_MS[kind]
  if (p >= 1) {
    reaction.current = null
    group.scale.set(1, 1, 1)
    group.position.y = 0
    invalidate()
    return
  }
  const amp = SETTLE_AMP[kind] * (seated ? 0.5 : 1)
  const f = -amp * Math.cos(p * Math.PI * 1.5) * (1 - p) ** 2
  const sy = 1 + f
  const hop = r.strong && !seated && p > 0.15 && p < 0.75 ? HOP * Math.sin((Math.PI * (p - 0.15)) / 0.6) : 0
  group.scale.set(1 - f * 0.5, sy, 1 - f * 0.5)
  group.position.y = (seated ? SEAT_Y : 0) * (1 - sy) + hop
  invalidate()
}

// Zar karışması (Figure, shuffle = { start, ms }): görünümler hızla değişirken her değişimde kısa bir
// çöküp-açılma ("pop"); ayaktaysa karakter karışma boyunca bir tur döner (yavaşlayarak durur). Oturanda
// dönüş yok (masaya girmesin). Bitince güçlü yerleşme tepkisi (settle) oynar.
const POP_MS = 90
const POP_AMP = 0.07
function shuffleStep(group, shuffle, swapAt, seated) {
  const now = performance.now()
  const q = Math.min(1, (now - swapAt) / POP_MS)
  const f = -POP_AMP * Math.sin(Math.PI * q) * (seated ? 0.5 : 1)
  const sy = 1 + f
  group.scale.set(1 - f * 0.5, sy, 1 - f * 0.5)
  group.position.y = (seated ? SEAT_Y : 0) * (1 - sy)
  const p = Math.min(1, (now - shuffle.start) / shuffle.ms)
  group.rotation.y = seated ? 0 : Math.PI * 2 * (1 - (1 - p) ** 3)
}

function Ticker({ animated }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!animated) return undefined
    const id = setInterval(() => invalidate(), 1000 / FPS)
    return () => clearInterval(id)
  }, [animated, invalidate])
  return null
}

const zParts = [
  new Matrix4().compose(new Vector3(0, 0.05, 0), new Quaternion(), new Vector3(0.12, 0.024, 0.02)),
  new Matrix4().compose(new Vector3(0, 0, 0), new Quaternion().setFromEuler(new Euler(0, 0, 0.72)), new Vector3(0.15, 0.022, 0.02)),
  new Matrix4().compose(new Vector3(0, -0.05, 0), new Quaternion(), new Vector3(0.12, 0.024, 0.02)),
]

// bölge noktaları, kemiğe göre: baş ortası, boyun, göğüs, sol bilek (saatin dış yüzü), uyluk üstü
// (ayakta; oturunca kucak), ayak
const HEAD_CENTER = new Vector3(0, 0.2 * SCALE, 0)
const NECK_POINT = new Vector3(0, 0.36 * SCALE, 0.04 * SCALE)
const TORSO_MID = new Vector3(0, 0.3 * SCALE, 0)
const WRIST_POINT = new Vector3(0.05 * SCALE, -0.16 * SCALE, 0)
const LEGS_POINT = new Vector3(0, -0.18 * SCALE, 0.04 * SCALE)
const SHOE_CENTER = new Vector3(0, -0.2 * SCALE, 0.02 * SCALE)

// Saç seçerken saçı örten başlık ve kafa üstü kulaklık (bant + kulak kapları) önizlemede çizilmez.
const bareHead = (avatar) => ({ ...avatar, hat: 'none', headphones: OVER_HEAD.includes(avatar.headphones) ? 'none' : avatar.headphones })

function Figure({ avatar, mode, activity, animated, view, focus, anchorsRef, apiRef, hideHeadwear, shuffle }) {
  // hideHeadwear: yalnızca önizlemede başlıksız ve kafa üstü kulaklıksız çizer (kayıtlı avatar değişmez,
  // tepki tetiklenmez)
  const parts = useMemo(() => buildAvatarParts(hideHeadwear ? bareHead(avatar) : avatar), [avatar, hideHeadwear])
  const statics = useMemo(() => sceneBoxes(mode === 'focus' || mode === 'away', activity), [mode, activity])
  const meshRef = useRef(null)
  const sceneRef = useRef(null)
  const zzzRef = useRef(null)
  const bones = useMemo(() => createBoneMatrices(), [])
  const invalidate = useThree((s) => s.invalidate)
  const lift = useRef(0)
  const scratch = useMemo(() => new Vector3(), [])
  // Görünüm değişince karakter yeni parçayı "üstüne alır": kısa bir çöküp toparlanma. Birden çok alan
  // birden değişirse (rastgele, kombin, varsayılan) daha belirgin; ayaktaysa küçük bir sıçrama da eklenir.
  // İlk yüklemede ve ad değişiminde tepki yok; hareket azaltılmışsa hiç yok.
  const bodyRef = useRef(null)
  const reaction = useRef(null)
  const prevLook = useRef(null)
  // zar karışması: son görünüm değişiminin zamanı (pop bundan sayılır)
  const swapAt = useRef(0)
  const shuffling = animated && !!shuffle
  const wasShuffling = useRef(false)
  useEffect(() => {
    if (shuffling) {
      wasShuffling.current = true
      return
    }
    if (!wasShuffling.current) return
    // karışma bitti: dönüş sıfırlanır, güçlü yerleşme oynar
    wasShuffling.current = false
    if (bodyRef.current) bodyRef.current.rotation.y = 0
    reaction.current = { start: performance.now(), strong: true }
    invalidate()
  }, [shuffling, invalidate])
  // Jest (poses.js GESTURES): gözlük ya da başlık takılınca eliyle düzeltir; karaktere tıklanınca
  // kameraya dönüp el sallar.
  const gesture = useRef(null)
  const play = (kind, opts) => {
    const g = gesture.current
    if (g && g.kind === kind && performance.now() - g.start < 500) return
    gesture.current = { kind, opts, start: performance.now() }
    invalidate()
  }
  useEffect(() => {
    const look = { ...avatar, name: '' }
    const prev = prevLook.current
    prevLook.current = look
    if (!prev || !animated) return
    if (shuffling) {
      swapAt.current = performance.now()
      reaction.current = null
      invalidate()
      return
    }
    const changed = Object.keys(look).filter((k) => JSON.stringify(look[k]) !== JSON.stringify(prev[k]))
    if (!changed.length) return
    reaction.current = { start: performance.now(), strong: changed.length > 2 }
    // tek tek takılan gözlük ya da başlık (rastgele / kombin değil)
    if (changed.length <= 2 && changed.includes('glasses') && look.glasses !== 'none') play('glasses')
    else if (changed.length <= 2 && changed.includes('hat') && look.hat !== 'none') play('hat', { brim: look.hat === 'cap' })
    invalidate()
  }, [avatar, animated, invalidate]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    apiRef.current = {
      // ekrandaki nokta (NDC) karakterin üstündeyse el sallar
      poke(raycaster) {
        const mesh = meshRef.current
        if (!animated || !mesh) return false
        mesh.boundingSphere = null
        if (!raycaster.intersectObject(mesh, false).length) return false
        play('wave')
        return true
      },
    }
  })

  useLayoutEffect(() => {
    const color = new Color()
    parts.forEach((p, i) => meshRef.current.setColorAt(i, color.set(p.color)))
    meshRef.current.instanceColor.needsUpdate = true
    invalidate()
  }, [parts, invalidate])

  useLayoutEffect(() => {
    const m = new Matrix4()
    const color = new Color()
    statics.forEach((b, i) => {
      sceneRef.current.setMatrixAt(i, m.compose(new Vector3(...b.c), new Quaternion(), new Vector3(...b.s)))
      sceneRef.current.setColorAt(i, color.set(b.color))
    })
    sceneRef.current.instanceMatrix.needsUpdate = true
    sceneRef.current.instanceColor.needsUpdate = true
    invalidate()
  }, [statics, invalidate])

  useFrame(({ clock }, dt) => {
    const t = animated ? clock.elapsedTime : 0
    let pose
    if (mode === 'focus') {
      // kitap modunda masadaki açık kitabı okur, arada not alır
      if (activity === 'type') pose = typePose(SIT.type, t, 0.3)
      else pose = Math.floor(t / 8) % 2 ? writePose(SIT.read, t, 0.3) : deskReadPose(SIT.read, t, 0.3)
    } else if (mode === 'away') pose = sleepDeskPose(SIT[activity] ?? SIT.read, t, 0.3)
    else if (mode === 'walk') pose = walkPose(t * 8.2)
    else if (mode === 'break') {
      const [act, prop] = BREAK_CYCLE[Math.floor(t / 7) % BREAK_CYCLE.length]
      pose = STAND_POSES[act](t, 0.3, prop)
    } else pose = standPose(t, 0.3)
    const camYaw = Math.PI / 4 + view.current.yaw
    const g = gesture.current
    const ge = g ? (performance.now() - g.start) / 1000 : 0
    if (g && ge >= GESTURES[g.kind]) gesture.current = null
    // el sallarken masadaki de ayaktaki de başını kameraya çevirir
    const want = Math.max(viewOf(mode, focus).lift ?? 0, gesture.current?.kind === 'wave' ? 1 : 0)
    const ease = animated ? 1 - Math.exp(-Math.min(dt, 0.1) * EASE) : 1
    lift.current += (want - lift.current) * ease
    if (Math.abs(want - lift.current) > SETTLED) invalidate()
    pose = liftHead(pose, lift.current, camYaw, mode === 'away')
    if (gesture.current) {
      pose = gesturePose(pose, g.kind, ge, g.opts)
      invalidate()
    }
    computeBones(bones, pose, 0, 0, 0)
    const a = anchorsRef.current
    a.head.copy(HEAD_CENTER).applyMatrix4(bones[HEAD])
    a.chest.copy(NECK_POINT).applyMatrix4(bones[TORSO])
    a.upper.copy(TORSO_MID).applyMatrix4(bones[TORSO])
    a.wrist.copy(WRIST_POINT).applyMatrix4(bones[FORE_L])
    a.legs.copy(LEGS_POINT).applyMatrix4(bones[HIPS])
    a.feet.copy(SHOE_CENTER).applyMatrix4(bones[SHIN_L]).add(scratch.copy(SHOE_CENTER).applyMatrix4(bones[SHIN_R])).multiplyScalar(0.5)
    a.feet.y += 0.06
    writeParts(meshRef.current, 0, parts, bones, pose.show)
    meshRef.current.instanceMatrix.needsUpdate = true
    if (shuffling && bodyRef.current) {
      shuffleStep(bodyRef.current, shuffle, swapAt.current, mode === 'focus' || mode === 'away')
      invalidate()
    } else settle(bodyRef.current, reaction, mode === 'focus' || mode === 'away', invalidate)

    const head = headTop(bones, new Vector3(), parts.crown)
    // başlık odağı: baş ortası ile tepe (şapka dahil) arası
    a.hat.copy(a.head).lerp(head, 0.5)
    a.hatSize = head.distanceTo(a.head) + HEAD_CENTER.y
    const m = new Matrix4()
    const zm = new Matrix4()
    let k = 0
    for (let g = 0; g < 3; g++) {
      if (mode !== 'away') {
        for (let p = 0; p < 3; p++) zzzRef.current.setMatrixAt(k++, m.makeScale(0, 0, 0))
        continue
      }
      const life = (t * 0.32 + g / 3) % 1
      const fade = Math.max(0.001, Math.min(1, life / 0.15, (1 - life) / 0.25))
      m.compose(new Vector3(head.x + 0.12 + 0.18 * life, head.y + 0.05 + 0.55 * life, head.z), new Quaternion().setFromEuler(new Euler(0, camYaw, 0)), new Vector3().setScalar((0.8 + 0.5 * life) * fade))
      for (const part of zParts) zzzRef.current.setMatrixAt(k++, zm.multiplyMatrices(m, part))
    }
    zzzRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={sceneRef} key={statics.length} args={[BOX, undefined, statics.length]} frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
      <group ref={bodyRef}>
        <instancedMesh ref={meshRef} key={parts.length} args={[BOX, undefined, parts.length]} frustumCulled={false}>
          <meshLambertMaterial />
        </instancedMesh>
      </group>
      <instancedMesh ref={zzzRef} args={[BOX, undefined, 9]} frustumCulled={false}>
        <meshBasicMaterial color="#9aa8d8" />
      </instancedMesh>
    </>
  )
}

/**
 * Avatar atölyesinin 3D önizlemesi: platformda karakter; sürükleyerek döndürülür.
 * mode: 'focus' (masada çalışır) | 'break' (ayakta mola hareketleri: içecek, telefon, gerinme, dans,
 * manzara) | 'away' (masada uyur, zZz) | 'walk' (yerinde yürür). activity: 'read' (masadaki açık
 * kitabı okur, not alır) | 'type' (dizüstü bilgisayar). focus: kamera odağı 'full' (tam boy) | 'face'
 * | 'hat' | 'chest' (boyun) | 'wrist' (sol bilek) | 'upper' (gövde) | 'legs' | 'feet'; açı ve yakınlık
 * poza göre (VIEWS). hideHeadwear: başlığı ve kafa üstü kulaklığı yalnızca önizlemede gizler (saç seçerken
 * saç görünsün). shuffle: { start, ms } zar karışması sürerken (avatar bu sürede hızla değişir), yoksa null.
 */
// hint: false ise ipucu satırı çizilmez (atölye kendi kontrol barını gösterir). resetKey her değiştiğinde
// görünüm döndürmesi sıfırlanır (çift tıkla aynı).
export default function AvatarPreview({ avatar, mode = 'focus', activity = 'read', focus = 'full', hideHeadwear = false, hint = true, resetKey = 0, shuffle = null, reducedMotion, className = '' }) {
  const animated = !(reducedMotion ?? prefersReducedMotion())
  const view = useRef({ yaw: 0 })
  const anchors = useRef({
    head: new Vector3(0, 1.05, 0),
    hat: new Vector3(0, 1.1, 0),
    hatSize: 0.45,
    chest: new Vector3(0, 0.9, 0),
    upper: new Vector3(0, 0.8, 0),
    wrist: new Vector3(0, 0.6, 0),
    legs: new Vector3(0, 0.45, 0),
    feet: new Vector3(0, 0.08, 0),
  })
  const drag = useRef(null)
  const store = useRef(null)
  const firstReset = useRef(resetKey)
  useEffect(() => {
    if (resetKey === firstReset.current) return
    view.current.yaw = 0
    store.current?.invalidate()
  }, [resetKey])
  const figure = useRef(null)
  // kısa basış karakterin üstündeyse el sallar
  const poke = (e) => {
    const s = store.current
    if (!s || !figure.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ndc = { x: ((e.clientX - rect.left) / rect.width) * 2 - 1, y: -((e.clientY - rect.top) / rect.height) * 2 + 1 }
    s.raycaster.setFromCamera(ndc, s.camera)
    figure.current.poke(s.raycaster)
  }

  return (
    <div
      className={`avatar-preview ${className}`}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY, yaw: view.current.yaw }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        view.current.yaw = drag.current.yaw + (e.clientX - drag.current.x) * YAW_PER_PIXEL
        store.current?.invalidate()
      }}
      onPointerUp={(e) => {
        const d = drag.current
        drag.current = null
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < CLICK_SLOP) poke(e)
      }}
      onDoubleClick={() => {
        view.current.yaw = 0
        store.current?.invalidate()
      }}
    >
      <Canvas
        orthographic
        frameloop="demand"
        flat
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, stencil: false }}
        camera={{ near: 0.1, far: 50 }}
        onCreated={(state) => {
          store.current = state
        }}
      >
        <CameraRig view={view} mode={mode} focus={focus} anchorsRef={anchors} animated={animated} />
        <hemisphereLight color="#fff6e8" groundColor="#8a7a68" intensity={2.2} />
        <directionalLight position={[3, 6, 4]} intensity={1.6} color="#fff1d8" />
        <Figure avatar={avatar} mode={mode} activity={activity} animated={animated} view={view} focus={focus} anchorsRef={anchors} apiRef={figure} hideHeadwear={hideHeadwear} shuffle={shuffle} />
        <Ticker animated={animated} />
      </Canvas>
      {hint && <p className="avatar-preview__hint">Sürükle: döndür · Karaktere tıkla: selam verir · Çift tık: sıfırla</p>}
    </div>
  )
}
