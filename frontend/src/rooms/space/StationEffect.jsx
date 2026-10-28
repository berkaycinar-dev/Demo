import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'

const BOX = new BoxGeometry()
const TAU = Math.PI * 2
// Hareketi azalt açıkken kayan parçalar bu konumda durur (uydu pencerenin ortasına yakın).
const STILL_PROGRESS = 0.4

// Hologram: projektörün üstünde dönen voxel gezegen (dilimlerden küre, parlak kıta lekeleri),
// eğik yörünge halkası ve halkada dolaşan uydu. Yarı saydam; gündüz de gece de okunur.
const GLOBE_Y = 0.56
const GLOBE_R = 0.26
const RING_R = 0.42
const RING_TILT = 0.4
const SPIN = { globe: 0.6, ring: 0.15, moon: 0.9 }
const HOLO_OPACITY = 0.6

function holoParts() {
  const parts = []
  const add = (kind, x, y, z, w, h, color, yaw = 0) => parts.push({ kind, pos: new Vector3(x, y, z), size: [w, h, w], color, yaw })
  const beam = GLOBE_Y - GLOBE_R
  for (const x of [-0.05, 0.05]) add('static', x, beam / 2, 0, 0.02, beam, '#7fe6ff')
  for (const y of [-0.2, -0.12, -0.04, 0.04, 0.12, 0.2]) {
    add('globe', 0, y, 0, 2 * Math.sqrt(GLOBE_R * GLOBE_R - y * y) * 0.9, 0.08, '#3cc6ee')
  }
  for (const [lat, lon, w] of [[0.3, 0.5, 0.12], [-0.25, 1.9, 0.1], [0.55, 3.1, 0.08], [-0.4, 4.2, 0.12], [0.05, 5.3, 0.1]]) {
    const r = GLOBE_R * 0.92
    add('globe', r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(lon), w, 0.06, '#c4f6ff', -lon)
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU
    add('ring', Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R, 0.022, 0.022, '#7fe6ff')
  }
  add('moon', RING_R, 0, 0, 0.06, 0.06, '#e6fbff')
  return parts
}
const HOLO = holoParts()

const matrix = new Matrix4()
const position = new Vector3()
const offset = new Vector3()
const scale = new Vector3()
const quat = new Quaternion()
const spin = new Quaternion()
const tilt = new Quaternion().setFromEuler(new Euler(RING_TILT, 0, 0))
const Y = new Vector3(0, 1, 0)

function writeBasic(mesh, fx, t, animated) {
  let i = 0
  for (const m of fx.movers) {
    const progress = animated ? (t / m.period + m.phase) % 1 : STILL_PROGRESS
    offset.fromArray(m.axis).multiplyScalar(m.travel * progress)
    for (const item of m.items) {
      mesh.setMatrixAt(i++, matrix.compose(position.copy(item.center).add(offset), item.quat, scale.fromArray(item.size)))
    }
  }
  for (const b of fx.blinkers) {
    const on = !animated || (t * b.rate + b.phase) % 1 < b.duty
    if (on) scale.fromArray(b.size)
    else scale.setScalar(1e-4)
    mesh.setMatrixAt(i++, matrix.compose(b.center, b.quat, scale))
  }
  mesh.instanceMatrix.needsUpdate = true
}

function writeHolo(mesh, holos, t) {
  let i = 0
  holos.forEach((origin, h) => {
    const globe = t * SPIN.globe + h
    const ring = t * SPIN.ring
    const moon = t * SPIN.moon + h * 2
    for (const part of HOLO) {
      if (part.kind === 'static') {
        position.copy(part.pos)
        quat.setFromAxisAngle(Y, part.yaw)
      } else if (part.kind === 'globe') {
        position.copy(part.pos).applyAxisAngle(Y, globe)
        position.y += GLOBE_Y
        quat.setFromAxisAngle(Y, part.yaw + globe)
      } else {
        const a = part.kind === 'ring' ? ring : moon
        spin.setFromAxisAngle(Y, -a)
        position.copy(part.pos).applyQuaternion(spin).applyQuaternion(tilt)
        position.y += GLOBE_Y
        quat.copy(tilt).multiply(spin)
      }
      position.x += origin[0]
      position.y += origin[1]
      position.z += origin[2]
      mesh.setMatrixAt(i++, matrix.compose(position, quat, scale.fromArray(part.size)))
    }
  })
  mesh.instanceMatrix.needsUpdate = true
}

/**
 * İstasyondaki küçük hareketler: pencerede süzülen uydu, ekranda kayan tarama çizgisi, yanıp
 * sönen tuşlar / durum ışıkları / yıldızlar ve masadaki dönen hologram. fx: buildSpace çıktısı.
 * Kareyi SpaceScene'deki ortak zamanlayıcı ister; animated=false iken her şey sabit durur.
 */
export default function StationEffect({ fx, animated = true }) {
  const basic = useRef(null)
  const holo = useRef(null)
  const basicCount = fx.movers.reduce((s, m) => s + m.items.length, 0) + fx.blinkers.length
  const holoCount = fx.holos.length * HOLO.length

  useLayoutEffect(() => {
    const color = new Color()
    let i = 0
    for (const m of fx.movers) for (const item of m.items) basic.current.setColorAt(i++, color.set(item.color))
    for (const b of fx.blinkers) basic.current.setColorAt(i++, color.set(b.color))
    basic.current.instanceColor.needsUpdate = true
    writeBasic(basic.current, fx, 0, false)
    if (holo.current) {
      i = 0
      for (let h = 0; h < fx.holos.length; h++) for (const part of HOLO) holo.current.setColorAt(i++, color.set(part.color))
      holo.current.instanceColor.needsUpdate = true
      writeHolo(holo.current, fx.holos, 0)
    }
  }, [fx])

  useFrame(({ clock }) => {
    if (!animated) return
    const t = clock.elapsedTime
    writeBasic(basic.current, fx, t, true)
    if (holo.current) writeHolo(holo.current, fx.holos, t)
  })

  return (
    <>
      <instancedMesh ref={basic} args={[BOX, undefined, basicCount]} frustumCulled={false}>
        <meshBasicMaterial />
      </instancedMesh>
      {holoCount > 0 && (
        <instancedMesh ref={holo} args={[BOX, undefined, holoCount]} frustumCulled={false} renderOrder={2}>
          <meshBasicMaterial transparent opacity={HOLO_OPACITY} depthWrite={false} />
        </instancedMesh>
      )}
    </>
  )
}
