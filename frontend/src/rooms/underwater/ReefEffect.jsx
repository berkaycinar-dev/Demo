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
const countOf = (g) =>
  g.movers.reduce((s, m) => s + m.items.length, 0) + g.spinners.reduce((s, sp) => s + sp.items.length, 0) + g.blinkers.length

// movers: eksen boyunca döngüyle kayar (balık, kabarcık) ya da wave ile salınır (yosun,
// denizanası); fade: döngünün başında ve sonunda bu oranda büyüyüp küçülür (birden belirip
// kaybolmasın); bob ikinci bir eksende yumuşak salınım ekler. spinners: pivot çevresinde döner
// (sonar tarama çizgisi, masa akvaryumundaki balıklar). blinkers: yanıp söner.
function write(mesh, g, t, animated) {
  let i = 0
  for (const m of g.movers) {
    const p = t / m.period + m.phase
    let k = 1
    if (m.wave) {
      offset.fromArray(m.axis).multiplyScalar(m.travel * Math.sin(TAU * p))
    } else {
      const progress = frac(p)
      offset.fromArray(m.axis).multiplyScalar(m.travel * progress)
      if (m.fade) k = Math.max(Math.min(1, progress / m.fade, (1 - progress) / m.fade), 1e-4)
    }
    if (m.bob) offset.addScaledVector(axis.fromArray(m.bob.axis), m.bob.amp * Math.sin(TAU * (t / m.bob.period + m.phase)))
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
  for (const m of g.movers) for (const item of m.items) mesh.setColorAt(i++, color.set(item.color))
  for (const s of g.spinners) for (const item of s.items) mesh.setColorAt(i++, color.set(item.color))
  for (const b of g.blinkers) mesh.setColorAt(i++, color.set(b.color))
  mesh.instanceColor.needsUpdate = true
}

/**
 * Üsteki küçük hareketler: camın ardında geçen balık sürüleri ve kaplumbağa, salınan yosunlar,
 * yükselen kabarcıklar, süzülen denizanaları; içeride denizanası tankı, masa akvaryumu, dönen
 * sonar çizgisi, havuzdaki parıltılar ve yanıp sönen ışıklar. fx: buildUnderwater çıktısı.
 * view grubu suyun gün zamanı rengini alır (gece koyulaşır), room grubu kendi renginde parlar.
 * Kareyi UnderwaterScene'deki ortak zamanlayıcı ister; animated=false iken her şey sabit durur.
 */
export default function ReefEffect({ fx, animated = true }) {
  const preset = useTimeOfDay()
  const view = useRef(null)
  const room = useRef(null)
  const viewCount = countOf(fx.view)
  const roomCount = countOf(fx.room)

  useLayoutEffect(() => {
    paint(view.current, fx.view)
    paint(room.current, fx.room)
    write(view.current, fx.view, 0, false)
    write(room.current, fx.room, 0, false)
  }, [fx])

  useFrame(({ clock }) => {
    if (!animated) return
    const t = clock.elapsedTime
    write(view.current, fx.view, t, true)
    write(room.current, fx.room, t, true)
  })

  return (
    <>
      <instancedMesh ref={view} args={[BOX, undefined, viewCount]} frustumCulled={false}>
        <meshBasicMaterial color={preset.glass} />
      </instancedMesh>
      <instancedMesh ref={room} args={[BOX, undefined, roomCount]} frustumCulled={false}>
        <meshBasicMaterial />
      </instancedMesh>
    </>
  )
}
