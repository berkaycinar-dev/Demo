import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Color, Matrix4, Quaternion, Vector3 } from 'three'
import { useTimeOfDay } from '../core/roomContext'

const BOX = new BoxGeometry()
const FIREFLY_SIZE = 0.035
const FIREFLY_COLOR = '#d8ff6a'

const matrix = new Matrix4()
const position = new Vector3()
const scale = new Vector3()
const rotation = new Quaternion()

// Ateş böcekleri yavaşça süzülüp aralıklı yanar; yıldızların bir kısmı parıldar.
function writeNightLife(mesh, fireflies, twinkles, t, animated) {
  let i = 0
  for (const { origin, phase } of fireflies) {
    const [x, y, z] = origin
    position.set(
      x + 0.3 * Math.sin(t * 0.45 + phase),
      y + 0.15 * Math.sin(t * 0.7 + phase * 1.3),
      z + 0.3 * Math.cos(t * 0.38 + phase),
    )
    const on = !animated || Math.sin(t * 1.6 + phase * 5) > -0.2
    mesh.setMatrixAt(i++, matrix.compose(position, rotation, scale.setScalar(on ? FIREFLY_SIZE : 1e-4)))
  }
  for (const star of twinkles) {
    const on = !animated || (t * star.rate + star.phase) % 1 < 0.75
    position.fromArray(star.center)
    if (on) scale.fromArray(star.size)
    else scale.setScalar(1e-4)
    mesh.setMatrixAt(i++, matrix.compose(position, rotation, scale))
  }
  mesh.instanceMatrix.needsUpdate = true
}

/**
 * Gecenin canlılığı: ateş böcekleri ve parıldayan yıldızlar. Yalnızca akşam/gece görünür
 * (nightLights), gündüz hiç çizilmez. Kareyi CampScene'deki ortak zamanlayıcı ister;
 * animated=false iken sabit durur.
 */
export default function NightLifeEffect({ fireflies, twinkles, animated = true }) {
  const preset = useTimeOfDay()
  const ref = useRef(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    const color = new Color()
    let i = 0
    for (let k = 0; k < fireflies.length; k++) mesh.setColorAt(i++, color.set(FIREFLY_COLOR))
    for (const star of twinkles) mesh.setColorAt(i++, color.set(star.color))
    mesh.instanceColor.needsUpdate = true
    writeNightLife(mesh, fireflies, twinkles, 0, false)
  }, [fireflies, twinkles])

  useFrame(({ clock }) => {
    if (animated && preset.nightLights > 0) writeNightLife(ref.current, fireflies, twinkles, clock.elapsedTime, true)
  })

  return (
    <instancedMesh
      ref={ref}
      args={[BOX, undefined, fireflies.length + twinkles.length]}
      frustumCulled={false}
      visible={preset.nightLights > 0}
    >
      <meshBasicMaterial transparent opacity={preset.nightLights} />
    </instancedMesh>
  )
}
