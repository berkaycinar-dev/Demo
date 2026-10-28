import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Color, Matrix4, Quaternion, Vector3 } from 'three'

const BOX = new BoxGeometry()
const TAU = Math.PI * 2
// Akrep, yelkovan, saniye: kadrandan farklı derinlikte ki üst üste binince titremesin.
const HANDS = [
  { width: 0.03, length: 0.1, depth: 0.062, color: '#262220' },
  { width: 0.022, length: 0.15, depth: 0.068, color: '#262220' },
  { width: 0.008, length: 0.16, depth: 0.074, color: '#b8322a' },
]
const TAIL = 0.025
const Z = new Vector3(0, 0, 1)

const matrix = new Matrix4()
const position = new Vector3()
const scale = new Vector3()
const quat = new Quaternion()
const turn = new Quaternion()

// Saniye ibresi saniyede bir atlar; yelkovan ve akrep akar.
function handAngles(now) {
  const s = now.getSeconds()
  const m = now.getMinutes() + s / 60
  const h = (now.getHours() % 12) + m / 60
  return [(h / 12) * TAU, (m / 60) * TAU, (s / 60) * TAU]
}

function writeHands(mesh, clocks, now) {
  const angles = handAngles(now)
  let i = 0
  for (const clock of clocks) {
    HANDS.forEach((hand, k) => {
      quat.copy(clock.quat).multiply(turn.setFromAxisAngle(Z, -angles[k]))
      position.set(0, hand.length / 2 - TAIL, hand.depth + 0.003).applyQuaternion(quat).add(clock.center)
      mesh.setMatrixAt(i++, matrix.compose(position, quat, scale.set(hand.width, hand.length, 0.006)))
    })
  }
  mesh.instanceMatrix.needsUpdate = true
}

/**
 * Duvar saatlerinin ibreleri; bilgisayarın saatini gösterir. clocks: [{ center, quat }].
 * Kareyi LibraryScene'deki ortak zamanlayıcı ister; animated=false iken ibreler açılış anındaki
 * saatte durur.
 */
export default function ClockEffect({ clocks, animated = true }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const color = new Color()
    let i = 0
    for (let c = 0; c < clocks.length; c++) for (const hand of HANDS) ref.current.setColorAt(i++, color.set(hand.color))
    ref.current.instanceColor.needsUpdate = true
    writeHands(ref.current, clocks, new Date())
  }, [clocks])

  useFrame(() => {
    if (animated) writeHands(ref.current, clocks, new Date())
  })

  return (
    <instancedMesh ref={ref} args={[BOX, undefined, clocks.length * HANDS.length]} frustumCulled={false}>
      <meshLambertMaterial />
    </instancedMesh>
  )
}
