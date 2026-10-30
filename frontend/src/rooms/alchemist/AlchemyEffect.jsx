import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Color, Matrix4, Quaternion, Vector3 } from 'three'
import { useTimeOfDay } from '../core/roomContext'

const BOX = new BoxGeometry()
const TAU = Math.PI * 2

const matrix = new Matrix4()
const position = new Vector3()
const offset = new Vector3()
const pivot = new Vector3()
const scale = new Vector3()
const axis = new Vector3()
const turn = new Quaternion()
const quat = new Quaternion()

const frac = (v) => v - Math.floor(v)
const itemCount = (list) => list.reduce((s, x) => s + x.items.length, 0)
const countOf = (g) =>
  itemCount(g.movers) + itemCount(g.spinners) + itemCount(g.swingers) + itemCount(g.pulsers) + g.wanderers.length + g.blinkers.length

// movers: eksen boyunca döngüyle kayar (kabarcık, kıvılcım, duman, bulut, süzülen kitap ve mum);
// sway: üstüne eklenen salınım vektörü, flutter: kendi ekseni çevresinde sallanma, fade: döngünün
// başında ve sonunda bu oranda büyüyüp küçülür. spinners: pivot çevresinde döner (gök küresi).
// swingers: pivot çevresinde sarkaç gibi gidip gelir (baykuşun başı). pulsers: boyu nabız gibi
// uzayıp kısalır (alev); uniform ise her yönde büyür (kristal çekirdeği). wanderers: merkez
// çevresinde gezinip aralıklı yanar (ışıltı). blinkers: yanıp söner (rün, yıldız).
function write(mesh, g, t, animated) {
  let i = 0
  for (const m of g.movers) {
    const progress = frac(t / m.period + m.phase)
    const k = m.fade ? Math.max(Math.min(1, progress / m.fade, (1 - progress) / m.fade), 1e-4) : 1
    const sway = TAU * (t / (m.swayPeriod ?? 1) + m.phase)
    offset.fromArray(m.axis).multiplyScalar(m.travel * progress)
    if (m.sway) offset.add(axis.fromArray(m.sway).multiplyScalar(Math.sin(sway)))
    if (m.flutter) turn.setFromAxisAngle(axis.fromArray(m.flutter.axis), m.flutter.amp * Math.sin(sway * 0.5))
    else turn.identity()
    for (const item of m.items) {
      scale.fromArray(item.size).multiplyScalar(k)
      mesh.setMatrixAt(i++, matrix.compose(position.copy(item.center).add(offset), quat.copy(turn).multiply(item.quat), scale))
    }
  }
  for (const s of g.spinners) {
    turn.setFromAxisAngle(axis.fromArray(s.axis), TAU * (t / s.period + s.phase))
    for (const item of s.items) {
      position.copy(item.center).sub(s.pivot).applyQuaternion(turn).add(s.pivot)
      mesh.setMatrixAt(i++, matrix.compose(position, quat.copy(turn).multiply(item.quat), scale.fromArray(item.size)))
    }
  }
  for (const s of g.swingers) {
    turn.setFromAxisAngle(axis.fromArray(s.axis), s.amp * Math.sin(TAU * (t / s.period + s.phase)))
    pivot.fromArray(s.pivot)
    for (const item of s.items) {
      position.copy(item.center).sub(pivot).applyQuaternion(turn).add(pivot)
      mesh.setMatrixAt(i++, matrix.compose(position, quat.copy(turn).multiply(item.quat), scale.fromArray(item.size)))
    }
  }
  for (const p of g.pulsers) {
    // iki farklı hızdaki dalganın toplamı: düzenli değil, titrek görünür
    const w = Math.sin(TAU * (t / p.period + p.phase)) * 0.6 + Math.sin(TAU * (t / (p.period * 0.37) + p.phase)) * 0.4
    for (const item of p.items) {
      scale.fromArray(item.size)
      if (p.uniform) {
        scale.multiplyScalar(1 + p.amp * w)
      } else {
        scale.y *= 1 + p.amp * w
        scale.x *= 1 - 0.4 * p.amp * w
        scale.z *= 1 - 0.4 * p.amp * w
      }
      mesh.setMatrixAt(i++, matrix.compose(item.center, item.quat, scale))
    }
  }
  for (const w of g.wanderers) {
    const [ax, ay, az] = w.amp
    position.set(
      w.center.x + ax * Math.sin(t * 0.55 + w.phase),
      w.center.y + ay * Math.sin(t * 0.8 + w.phase * 1.3),
      w.center.z + az * Math.cos(t * 0.55 + w.phase),
    )
    if (!animated || Math.sin(t * 2.1 + w.phase * 5) > -0.3) scale.fromArray(w.size)
    else scale.setScalar(1e-4)
    mesh.setMatrixAt(i++, matrix.compose(position, w.quat, scale))
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
  for (const list of [g.movers, g.spinners, g.swingers, g.pulsers]) {
    for (const x of list) for (const item of x.items) mesh.setColorAt(i++, color.set(item.color))
  }
  for (const list of [g.wanderers, g.blinkers]) for (const x of list) mesh.setColorAt(i++, color.set(x.color))
  mesh.instanceColor.needsUpdate = true
}

function Group({ group, animated, visible = true, children }) {
  const ref = useRef(null)
  const count = countOf(group)

  useLayoutEffect(() => {
    if (!ref.current) return
    paint(ref.current, group)
    write(ref.current, group, 0, false)
  }, [group])

  useFrame(({ clock }) => {
    if (animated && visible && ref.current) write(ref.current, group, clock.elapsedTime, true)
  })

  if (count === 0) return null
  return (
    <instancedMesh ref={ref} args={[BOX, undefined, count]} frustumCulled={false} visible={visible}>
      {children}
    </instancedMesh>
  )
}

/**
 * Simyacı odasındaki hareketler: pencerelerde süzülen bulutlar (view, camın gün zamanı rengini
 * alır), gece parıldayan yıldızlar (night), mum ve ocak alevleri, kıvılcımlar, kazandaki ve
 * şişelerdeki kabarcıklar, imbikten damlayan iksir, sırayla yanan rünler, kristal çekirdeği,
 * ışıltılar, baykuşun gözleri (room, kendi renginde parlar), süzülen kitaplar ve mumlar, baykuşun
 * dönen başı, gök küresinin gezegenleri (lit, ışık alır), kazandan yükselen yeşil duman (mist,
 * yarı saydam).
 * fx: buildAlchemist çıktısı. Kareyi AlchemistScene'deki ortak zamanlayıcı ister; animated=false
 * iken her şey sabit durur.
 */
export default function AlchemyEffect({ fx, animated = true }) {
  const preset = useTimeOfDay()
  return (
    <>
      <Group group={fx.view} animated={animated}>
        <meshBasicMaterial color={preset.glass} />
      </Group>
      <Group group={fx.night} animated={animated} visible={preset.nightLights > 0}>
        <meshBasicMaterial transparent opacity={preset.nightLights} />
      </Group>
      <Group group={fx.room} animated={animated}>
        <meshBasicMaterial />
      </Group>
      <Group group={fx.lit} animated={animated}>
        <meshLambertMaterial />
      </Group>
      <Group group={fx.mist} animated={animated}>
        <meshBasicMaterial transparent opacity={0.35} depthWrite={false} />
      </Group>
    </>
  )
}
