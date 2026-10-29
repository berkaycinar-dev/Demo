import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Color, Matrix4, Quaternion, Vector3 } from 'three'
import { useTimeOfDay } from '../core/roomContext'

const BOX = new BoxGeometry()
const TAU = Math.PI * 2

const matrix = new Matrix4()
const position = new Vector3()
const offset = new Vector3()
const scale = new Vector3()
const axis = new Vector3()
const turn = new Quaternion()
const quat = new Quaternion()

const frac = (v) => v - Math.floor(v)
const itemCount = (list) => list.reduce((s, x) => s + x.items.length, 0)
const countOf = (g) => itemCount(g.movers) + itemCount(g.spinners) + itemCount(g.bars) + g.blinkers.length

// movers: eksen boyunca döngüyle kayar (uçan araç, kayan satır, tarama halkası); sway: üstüne
// eklenen salınım vektörü (drone), fade: döngünün başında ve sonunda bu oranda büyüyüp küçülür.
// spinners: pivot çevresinde döner (hologram küre, radar). bars: tabanı sabit, boyu iki dalganın
// toplamıyla değişir (çubuk grafik). blinkers: yanıp söner (LED, neon, ikaz lambası, reklam).
function write(mesh, g, t, animated) {
  let i = 0
  for (const m of g.movers) {
    const progress = frac(t / m.period + m.phase)
    const k = m.fade ? Math.max(Math.min(1, progress / m.fade, (1 - progress) / m.fade), 1e-4) : 1
    offset.fromArray(m.axis).multiplyScalar(m.travel * progress)
    if (m.sway) offset.add(axis.fromArray(m.sway).multiplyScalar(Math.sin(TAU * (t / m.swayPeriod + m.phase))))
    for (const item of m.items) {
      scale.fromArray(item.size).multiplyScalar(k)
      mesh.setMatrixAt(i++, matrix.compose(position.copy(item.center).add(offset), item.quat, scale))
    }
  }
  for (const s of g.spinners) {
    turn.setFromAxisAngle(axis.fromArray(s.axis), TAU * (t / s.period + s.phase))
    for (const item of s.items) {
      position.copy(item.center).sub(s.pivot).applyQuaternion(turn).add(s.pivot)
      mesh.setMatrixAt(i++, matrix.compose(position, quat.copy(turn).multiply(item.quat), scale.fromArray(item.size)))
    }
  }
  for (const b of g.bars) {
    const w = animated ? 0.5 + 0.3 * Math.sin(TAU * (t / b.period + b.phase)) + 0.2 * Math.sin(TAU * (t / (b.period * 0.41) + b.phase)) : 0.6
    const k = Math.max(0.08, w)
    for (const item of b.items) {
      scale.fromArray(item.size)
      position.copy(item.center)
      position.y += (item.size[1] * (k - 1)) / 2
      scale.y *= k
      mesh.setMatrixAt(i++, matrix.compose(position, item.quat, scale))
    }
  }
  for (const b of g.blinkers) {
    if (!animated || frac(t * b.rate + b.phase) < b.duty) scale.fromArray(b.size)
    else scale.setScalar(1e-4)
    mesh.setMatrixAt(i++, matrix.compose(b.center, b.quat, scale))
  }
  mesh.instanceMatrix.needsUpdate = true
}

function paint(mesh, g) {
  const color = new Color()
  let i = 0
  for (const list of [g.movers, g.spinners, g.bars]) {
    for (const x of list) for (const item of x.items) mesh.setColorAt(i++, color.set(item.color))
  }
  for (const b of g.blinkers) mesh.setColorAt(i++, color.set(b.color))
  mesh.instanceColor.needsUpdate = true
}

function Group({ group, animated, children }) {
  const ref = useRef(null)
  const count = countOf(group)

  useLayoutEffect(() => {
    if (!ref.current) return
    paint(ref.current, group)
    write(ref.current, group, 0, false)
  }, [group])

  useFrame(({ clock }) => {
    if (animated && ref.current) write(ref.current, group, clock.elapsedTime, true)
  })

  if (count === 0) return null
  return (
    <instancedMesh ref={ref} args={[BOX, undefined, count]} frustumCulled={false}>
      {children}
    </instancedMesh>
  )
}

/**
 * Siber Loft'taki hareketler: pencerede akan uçan araçların gövdeleri (view, camın gün zamanı
 * rengini alır); araç farları, ikaz lambaları, reklam panoları, sunucu LED'leri, "ODAK" neonu,
 * veri duvarındaki grafik/radar/satırlar, holo ekranlar, dönen hologram küreler, tarama halkaları
 * (room, kendi renginde parlar); süzülen drone gövdesi (lit, ışık alır).
 * fx: buildCyber çıktısı. Kareyi CyberScene'deki ortak zamanlayıcı ister; animated=false iken her
 * şey sabit durur.
 */
export default function CyberEffect({ fx, animated = true }) {
  const preset = useTimeOfDay()
  return (
    <>
      <Group group={fx.view} animated={animated}>
        <meshBasicMaterial color={preset.glass} />
      </Group>
      <Group group={fx.room} animated={animated}>
        <meshBasicMaterial />
      </Group>
      <Group group={fx.lit} animated={animated}>
        <meshLambertMaterial />
      </Group>
    </>
  )
}
