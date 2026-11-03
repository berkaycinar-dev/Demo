import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { buildAvatarParts } from './model'
import { STAND_POSES, deskReadPose, sleepDeskPose, standPose, typePose, walkPose, writePose } from './poses'
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
const ELEVATION = (24 * Math.PI) / 180
const YAW_PER_PIXEL = 0.01

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

function CameraRig({ view }) {
  const size = useThree((s) => s.size)
  useFrame(({ camera }) => {
    const az = Math.PI / 4 + view.current.yaw
    const flat = Math.cos(ELEVATION) * 10
    camera.position.set(Math.sin(az) * flat, 0.75 + Math.sin(ELEVATION) * 10, Math.cos(az) * flat)
    camera.lookAt(0, 0.62, 0)
    const zoom = Math.min(size.width / 2.3, size.height / 1.9)
    if (camera.zoom !== zoom) {
      camera.zoom = zoom
      camera.updateProjectionMatrix()
    }
  })
  return null
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

function Figure({ avatar, mode, activity, animated, view }) {
  const parts = useMemo(() => buildAvatarParts(avatar), [avatar])
  const statics = useMemo(() => sceneBoxes(mode === 'focus' || mode === 'away', activity), [mode, activity])
  const meshRef = useRef(null)
  const sceneRef = useRef(null)
  const zzzRef = useRef(null)
  const bones = useMemo(() => createBoneMatrices(), [])
  const invalidate = useThree((s) => s.invalidate)

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

  useFrame(({ clock }) => {
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
    computeBones(bones, pose, 0, 0, 0)
    writeParts(meshRef.current, 0, parts, bones, pose.show)
    meshRef.current.instanceMatrix.needsUpdate = true

    const head = headTop(bones, new Vector3(), parts.crown)
    const camYaw = Math.PI / 4 + view.current.yaw
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
      <instancedMesh ref={meshRef} key={parts.length} args={[BOX, undefined, parts.length]} frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
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
 * kitabı okur, not alır) | 'type' (dizüstü bilgisayar).
 */
export default function AvatarPreview({ avatar, mode = 'focus', activity = 'read', reducedMotion, className = '' }) {
  const animated = !(reducedMotion ?? prefersReducedMotion())
  const view = useRef({ yaw: 0 })
  const drag = useRef(null)
  const store = useRef(null)

  return (
    <div
      className={`avatar-preview ${className}`}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, yaw: view.current.yaw }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        view.current.yaw = drag.current.yaw + (e.clientX - drag.current.x) * YAW_PER_PIXEL
        store.current?.invalidate()
      }}
      onPointerUp={() => {
        drag.current = null
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
        <CameraRig view={view} />
        <hemisphereLight color="#fff6e8" groundColor="#8a7a68" intensity={2.2} />
        <directionalLight position={[3, 6, 4]} intensity={1.6} color="#fff1d8" />
        <Figure avatar={avatar} mode={mode} activity={activity} animated={animated} view={view} />
        <Ticker animated={animated} />
      </Canvas>
      <p className="avatar-preview__hint">Sürükle: döndür · Çift tık: sıfırla</p>
    </div>
  )
}
