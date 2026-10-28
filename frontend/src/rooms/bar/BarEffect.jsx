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
const countOf = (g) => itemCount(g.movers) + itemCount(g.spinners) + itemCount(g.pulsers) + g.blinkers.length

// movers: eksen boyunca döngüyle kayar (yağmur, damla); fade: döngünün başında ve sonunda bu
// oranda büyüyüp küçülür. spinners: pivot çevresinde döner (vantilatör). pulsers: boyu nabız
// gibi uzayıp kısalır (mum alevi). blinkers: yanıp söner (neon, müzik kutusu ışıkları).
function write(mesh, g, t, animated) {
  let i = 0
  for (const m of g.movers) {
    const progress = frac(t / m.period + m.phase)
    const k = m.fade ? Math.max(Math.min(1, progress / m.fade, (1 - progress) / m.fade), 1e-4) : 1
    offset.fromArray(m.axis).multiplyScalar(m.travel * progress)
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
  for (const p of g.pulsers) {
    // iki farklı hızdaki dalganın toplamı: düzenli değil, titrek görünür
    const w = Math.sin(TAU * (t / p.period + p.phase)) * 0.6 + Math.sin(TAU * (t / (p.period * 0.37) + p.phase)) * 0.4
    for (const item of p.items) {
      scale.fromArray(item.size)
      scale.y *= 1 + p.amp * w
      scale.x *= 1 - 0.4 * p.amp * w
      scale.z *= 1 - 0.4 * p.amp * w
      mesh.setMatrixAt(i++, matrix.compose(item.center, item.quat, scale))
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
  for (const list of [g.movers, g.spinners, g.pulsers]) {
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
 * Bardaki küçük hareketler: pencerelerde yağan yağmur ve camdan süzülen damlalar (view, camın
 * gün zamanı rengini alır), titreyen "BAR" neonu, müzik kutusunda yürüyen renkli ışıklar ve mum
 * alevleri (room, kendi renginde parlar), tavan vantilatörünün kanatları (lit, ışık alır).
 * fx: buildBar çıktısı. Kareyi BarScene'deki ortak zamanlayıcı ister; animated=false iken her
 * şey sabit durur.
 */
export default function BarEffect({ fx, animated = true }) {
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
