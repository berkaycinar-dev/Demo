import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Color, Matrix4, Quaternion, Vector3 } from 'three'
import { useTimeOfDay } from '../core/roomContext'

const BOX = new BoxGeometry()
const TAU = Math.PI * 2
const GULL_WING = [0.05, 0.009, 0.002]
const GULL_COLOR = '#ffffff'

const matrix = new Matrix4()
const position = new Vector3()
const offset = new Vector3()
const scale = new Vector3()
const wing = new Quaternion()
const roll = new Quaternion()
const Z = new Vector3(0, 0, 1)

// Vapur iki uç arasında yavaşlayarak döner; yelkenliler yerinde salınır.
const moverOffset = (m, t) =>
  m.pingPong ? m.travel * (0.5 - 0.5 * Math.cos((TAU * t) / m.period + m.phase)) : m.travel * Math.sin((TAU * t) / m.period + m.phase)

function writeView(glass, night, view, t, animated) {
  let g = 0
  let n = 0
  for (const m of view.movers) {
    offset.copy(m.axis).multiplyScalar(animated ? moverOffset(m, t) : moverOffset(m, 0))
    for (const item of m.glass) {
      glass.setMatrixAt(g++, matrix.compose(position.copy(item.center).add(offset), item.quat, scale.fromArray(item.size)))
    }
    for (const item of m.night) {
      night.setMatrixAt(n++, matrix.compose(position.copy(item.center).add(offset), item.quat, scale.fromArray(item.size)))
    }
  }
  // Martı: yavaş bir sekiz çizerek süzülür, kanatlarını arada çırpar.
  for (const gull of view.gulls) {
    const a = animated ? (TAU * t) / gull.period + gull.phase : gull.phase
    offset.copy(gull.axis).multiplyScalar(gull.amplitude * Math.sin(a))
    offset.y += 0.04 * Math.sin(2 * a)
    const flap = 0.35 + (animated ? 0.3 * Math.max(0, Math.sin(t * 7 + gull.phase)) : 0)
    // side 1 sol kanat (-u), -1 sağ kanat; ikisi de yukarı kalkık (V)
    for (const side of [1, -1]) {
      wing.copy(gull.quat).multiply(roll.setFromAxisAngle(Z, -side * flap))
      position.set(-side * GULL_WING[0] / 2, GULL_WING[1] / 2, GULL_WING[2] / 2).applyQuaternion(wing)
      position.add(gull.origin).add(offset)
      glass.setMatrixAt(g++, matrix.compose(position, wing, scale.fromArray(GULL_WING)))
    }
  }
  for (const tw of view.twinkles) {
    const on = !animated || (t * tw.rate + tw.phase) % 1 < tw.duty
    if (on) scale.fromArray(tw.size)
    else scale.setScalar(1e-4)
    night.setMatrixAt(n++, matrix.compose(tw.center, tw.quat, scale))
  }
  glass.instanceMatrix.needsUpdate = true
  night.instanceMatrix.needsUpdate = true
}

/**
 * Deniz manzarasındaki canlılık: vapur gidip gelir, yelkenliler salınır, martılar süzülür,
 * karşı kıyıdaki bazı ışıklar ve fener yanıp söner. view: buildTeaGarden'ın view çıktısı.
 * Kareyi TeaGardenScene'deki ortak zamanlayıcı ister; animated=false iken her şey ilk
 * konumunda sabit durur.
 */
export default function SeaViewEffect({ view, animated = true }) {
  const preset = useTimeOfDay()
  const glassRef = useRef(null)
  const nightRef = useRef(null)
  const glassCount = view.movers.reduce((s, m) => s + m.glass.length, 0) + view.gulls.length * 2
  const nightCount = view.movers.reduce((s, m) => s + m.night.length, 0) + view.twinkles.length

  useLayoutEffect(() => {
    const color = new Color()
    let g = 0
    let n = 0
    for (const m of view.movers) {
      for (const item of m.glass) glassRef.current.setColorAt(g++, color.set(item.color))
      for (const item of m.night) nightRef.current.setColorAt(n++, color.set(item.color))
    }
    for (let i = 0; i < view.gulls.length * 2; i++) glassRef.current.setColorAt(g++, color.set(GULL_COLOR))
    for (const tw of view.twinkles) nightRef.current.setColorAt(n++, color.set(tw.color))
    glassRef.current.instanceColor.needsUpdate = true
    nightRef.current.instanceColor.needsUpdate = true
    writeView(glassRef.current, nightRef.current, view, 0, false)
  }, [view])

  useFrame(({ clock }) => {
    if (animated) writeView(glassRef.current, nightRef.current, view, clock.elapsedTime, true)
  })

  return (
    <>
      <instancedMesh ref={glassRef} args={[BOX, undefined, glassCount]} frustumCulled={false}>
        <meshBasicMaterial color={preset.glass} />
      </instancedMesh>
      <instancedMesh
        ref={nightRef}
        args={[BOX, undefined, nightCount]}
        frustumCulled={false}
        visible={preset.nightLights > 0}
      >
        <meshBasicMaterial transparent opacity={preset.nightLights} />
      </instancedMesh>
    </>
  )
}
