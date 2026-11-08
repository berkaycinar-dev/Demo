import { Canvas, useFrame, useThree } from '@react-three/fiber'
import '../rooms/core/quietClock'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, Color, Matrix4, Quaternion, Vector3 } from 'three'
import { buildAvatarParts } from './model'
import { randomAvatar } from './options'
import {
  STAND_POSES,
  deskReadPose,
  liePose,
  loungePose,
  readPose,
  sleepDeskPose,
  sleepLeanPose,
  tapPose,
  thinkPose,
  typePose,
  walkPose,
  writePose,
} from './poses'
import { computeBones, createBoneMatrices, headTop, writeParts } from './render'
import { seededRandom } from '../rooms/core/voxel'
import './AvatarLab.css'

const BOX = new BoxGeometry()
const GAP = 1.7
const FPS = 24
// masanın ön kenarı ve masadaki kitap sahnedeki kutularla aynı (sceneBoxes)
const CHAIR = { y: 0.5, rise: 0.28, edge: 0.25 }
const DESK_BOOK = { ...CHAIR, near: 0.3, far: 0.58, item: 0.312 }
const LOW = { y: 0.21, low: true, rise: 0.16, edge: 0.3 }
const LOG = { y: 0.42, slope: true }
const SOFA = { y: 0.48, slope: true }

const PROP_OF = { sip: 'mug', eat: 'simit' }
const SCENE_OF = { run: 'treadmill', pool: 'pool', pingpong: 'pingpong' }

// [ad, poz (t, seed), sahne]: sahne avatarın altına konan basit kutular.
const ALL = [
  ['Klavye', (t, s) => typePose(CHAIR, t, s), 'desk'],
  ['Ekrana dokunma', (t, s) => tapPose(CHAIR, t, s), 'desk'],
  ['Masadaki kitap', (t, s) => deskReadPose(DESK_BOOK, t, s), 'deskBook'],
  ['Not alma', (t, s) => writePose(CHAIR, t, s), 'desk'],
  ['Tüy kalem', (t, s) => writePose(CHAIR, t, s, 'quill'), 'desk'],
  ['Elde kitap', (t, s) => readPose(LOG, t, s), 'log'],
  ['Tablet', (t, s) => readPose(CHAIR, t, s, 'tablet'), 'chair'],
  ['Düşünme', (t, s) => thinkPose(CHAIR, t, s), 'desk'],
  ['Minderde yazma', (t, s) => writePose(LOW, t, s), 'low'],
  ['Masada uyku', (t, s) => sleepDeskPose(CHAIR, t, s), 'desk'],
  ['Yaslanıp uyku', (t, s) => sleepLeanPose(CHAIR, t, s), 'chair'],
  ['Gazete', (t, s) => sleepLeanPose(CHAIR, t, s, 'newspaper'), 'chair'],
  ['Kitap göğüste', (t, s) => sleepLeanPose(SOFA, t, s, 'bookChest'), 'sofa'],
  ['Kanepe, kupa', (t, s) => loungePose(SOFA, t, s, 'mug'), 'sofa'],
  ['Kanepe, telefon', (t, s) => loungePose(SOFA, t, s, 'phone'), 'sofa'],
  ['Hamak', (t, s) => liePose({ y: 0.65 }, t, s), 'hammock'],
  ['Hamak, kitap', (t, s) => liePose({ y: 0.65 }, t, s, 'bookChest'), 'hammock'],
  ['Yürüyüş', (t) => walkPose(t * 8.2), null],
  ...Object.keys(STAND_POSES).map((name) => [name, (t, s) => STAND_POSES[name](t, s, PROP_OF[name]), SCENE_OF[name] ?? null]),
]
// ?only=Klavye,sip gibi: yalnızca bu hareketler (yakın inceleme).
const ONLY = new URLSearchParams(window.location.search).get('only')?.split(',')
const SHOWN = ONLY ? ALL.filter(([name]) => ONLY.includes(name)) : ALL
const COLS = Math.min(ONLY ? 4 : 8, SHOWN.length)
const ZOOM = Number(new URLSearchParams(window.location.search).get('zoom')) || 1

function sceneBoxes(kind) {
  const out = []
  const add = (x, y, z, w, h, d, color) => out.push({ c: [x + w / 2, y + h / 2, z + d / 2], s: [w, h, d], color })
  const wood = '#8a5a36'
  if (kind === 'desk' || kind === 'deskBook' || kind === 'chair') {
    add(-0.21, CHAIR.y - 0.05, -0.21, 0.42, 0.05, 0.42, wood)
    add(-0.21, CHAIR.y, -0.25, 0.42, 0.45, 0.04, wood)
    for (const [x, z] of [[-0.19, -0.19], [0.15, -0.19], [-0.19, 0.15], [0.15, 0.15]]) add(x, 0, z, 0.04, CHAIR.y - 0.05, 0.04, '#5e3a22')
  }
  if (kind === 'desk' || kind === 'deskBook') {
    const top = CHAIR.y + CHAIR.rise
    add(-0.55, top - 0.04, 0.25, 1.1, 0.04, 0.55, wood)
    for (const x of [-0.5, 0.46]) add(x, 0, 0.7, 0.04, top - 0.04, 0.04, '#5e3a22')
    if (kind === 'deskBook') {
      add(-0.21, top, 0.3, 0.42, 0.012, 0.28, '#24503a')
      add(-0.2, top + 0.012, 0.31, 0.195, 0.02, 0.26, '#f4eedf')
      add(0.005, top + 0.012, 0.31, 0.195, 0.02, 0.26, '#f4eedf')
    }
  }
  if (kind === 'log') add(-0.5, 0, -0.14, 1.0, LOG.y, 0.28, '#6b4a2e')
  if (kind === 'low') {
    add(-0.3, 0, -0.28, 0.6, LOW.y - 0.03, 0.56, '#c06a3a')
    add(-0.4, 0, 0.3, 0.8, LOW.y + LOW.rise, 0.5, wood)
  }
  if (kind === 'sofa') {
    add(-0.5, 0, -0.3, 1.0, SOFA.y, 0.6, '#5a6e8a')
    add(-0.5, SOFA.y, -0.42, 1.0, 0.45, 0.14, '#5a6e8a')
  }
  if (kind === 'hammock') {
    // kavisli bez: ortası alçak, uçları yüksek (kamp hamağı gibi)
    for (let i = 0; i < 10; i++) {
      const z0 = -1.0 + i * 0.2
      const sag = (z) => 1.2 - 0.55 * (1 - (z / 1.0) ** 2)
      add(-0.3, sag(z0 + 0.1) - 0.03, z0, 0.6, 0.03, 0.2, i % 2 ? '#d9534f' : '#f2efe8')
    }
  }
  if (kind === 'pool') add(-0.6, 0, 0.35, 1.2, 0.81, 1.6, '#2e6b45')
  if (kind === 'pingpong') add(-0.6, 0.72, 0.4, 1.2, 0.04, 1.4, '#2f5e7a')
  if (kind === 'treadmill') add(-0.36, 0, -0.85, 0.72, 0.18, 1.7, '#3a3d44')
  return out
}

function Scene() {
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const looks = useMemo(() => {
    const rnd = seededRandom(7)
    return SHOWN.map((_, i) => buildAvatarParts(randomAvatar(rnd, `L${i}`), { seed: i * 0.37 }))
  }, [])
  const statics = useMemo(
    () =>
      SHOWN.flatMap(([, , kind], i) =>
        sceneBoxes(kind).map((b) => ({ ...b, c: [b.c[0] + (i % COLS) * GAP, b.c[1], b.c[2] + Math.floor(i / COLS) * GAP] })),
      ),
    [],
  )
  const total = looks.reduce((s, l) => s + l.length, 0)
  const mesh = useRef(null)
  const scene = useRef(null)
  const bones = useMemo(() => createBoneMatrices(), [])
  const labels = useRef([])

  useLayoutEffect(() => {
    const color = new Color()
    let k = 0
    for (const parts of looks) for (const p of parts) mesh.current.setColorAt(k++, color.set(p.color))
    mesh.current.instanceColor.needsUpdate = true
    const m = new Matrix4()
    if (!statics.length) return invalidate()
    statics.forEach((b, i) => {
      scene.current.setMatrixAt(i, m.compose(new Vector3(...b.c), new Quaternion(), new Vector3(...b.s)))
      scene.current.setColorAt(i, color.set(b.color))
    })
    scene.current.instanceMatrix.needsUpdate = true
    scene.current.instanceColor.needsUpdate = true
    invalidate()
  }, [looks, statics, invalidate])

  useEffect(() => {
    const id = setInterval(() => invalidate(), 1000 / FPS)
    return () => clearInterval(id)
  }, [invalidate])

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime
    let start = 0
    const head = new Vector3()
    SHOWN.forEach(([, pose], i) => {
      const p = pose(t, i * 0.37)
      computeBones(bones, p, (i % COLS) * GAP, Math.floor(i / COLS) * GAP, 0)
      writeParts(mesh.current, start, looks[i], bones, p.show)
      start += looks[i].length
      headTop(bones, head)
      head.y += 0.25
      head.project(camera)
      const el = labels.current[i]
      if (el) el.style.transform = `translate(${(((head.x + 1) / 2) * size.width).toFixed(0)}px, ${(((1 - head.y) / 2) * size.height).toFixed(0)}px) translate(-50%, -100%)`
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  useEffect(() => {
    const host = document.querySelector('.avatar-lab__labels')
    labels.current = SHOWN.map(([name]) => {
      const el = document.createElement('div')
      el.className = 'avatar-lab__label'
      el.textContent = name
      host.appendChild(el)
      return el
    })
    return () => labels.current.forEach((el) => el.remove())
  }, [])

  return (
    <>
      {statics.length > 0 && (
        <instancedMesh ref={scene} args={[BOX, undefined, statics.length]} frustumCulled={false}>
          <meshLambertMaterial />
        </instancedMesh>
      )}
      <instancedMesh ref={mesh} args={[BOX, undefined, total]} frustumCulled={false}>
        <meshLambertMaterial />
      </instancedMesh>
    </>
  )
}

function Camera() {
  const size = useThree((s) => s.size)
  useFrame(({ camera }) => {
    const rows = Math.ceil(SHOWN.length / COLS)
    const cx = ((COLS - 1) * GAP) / 2
    const cz = ((rows - 1) * GAP) / 2
    camera.position.set(cx + 20, 18, cz + 20)
    camera.lookAt(cx, 0.4, cz)
    const zoom = Math.min(size.width / (COLS * GAP * 1.45), size.height / (rows * GAP * 1.2)) * ZOOM
    if (camera.zoom !== zoom) {
      camera.zoom = zoom
      camera.updateProjectionMatrix()
    }
  })
  return null
}

/** Geliştirme sayfası (?lab=avatars): bütün çalışma, uyku ve mola hareketleri bir arada. */
export default function AvatarLab() {
  return (
    <main className="avatar-lab">
      <Canvas orthographic frameloop="demand" flat dpr={[1, 2]} camera={{ near: 0.1, far: 100 }}>
        <Camera />
        <hemisphereLight color="#fff6e8" groundColor="#8a7a68" intensity={2.2} />
        <directionalLight position={[3, 6, 4]} intensity={1.6} color="#fff1d8" />
        <Scene />
      </Canvas>
      <div className="avatar-lab__labels" />
    </main>
  )
}
