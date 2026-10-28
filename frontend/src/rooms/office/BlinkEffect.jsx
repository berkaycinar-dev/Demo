import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Color, Matrix4, Vector3 } from 'three'

const BOX = new BoxGeometry()

const matrix = new Matrix4()
const scale = new Vector3()

function writeBlinkers(mesh, items, t, animated) {
  items.forEach((item, i) => {
    const phase = (i * 0.37) % 1
    const on = !animated || (t * item.rate + phase) % 1 < item.duty
    if (on) scale.fromArray(item.size)
    else scale.setScalar(1e-4)
    mesh.setMatrixAt(i, matrix.compose(item.center, item.quat, scale))
  })
  mesh.instanceMatrix.needsUpdate = true
}

/**
 * Yanıp sönen küçük ışıklar: monitörlerdeki imleçler, gökdelen ikaz lambaları.
 * items: [{ center, quat, size, color, rate (Hz), duty (yanık kalma oranı) }].
 * Kareyi OfficeScene'deki ortak zamanlayıcı ister; animated=false iken (hareketi azalt) hepsi sabit yanar.
 */
export default function BlinkEffect({ items, animated = true }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    const color = new Color()
    items.forEach((item, i) => mesh.setColorAt(i, color.set(item.color)))
    mesh.instanceColor.needsUpdate = true
    writeBlinkers(mesh, items, 0, false)
  }, [items])

  useFrame(({ clock }) => {
    if (animated) writeBlinkers(ref.current, items, clock.elapsedTime, true)
  })

  return (
    <instancedMesh ref={ref} args={[BOX, undefined, items.length]} frustumCulled={false}>
      <meshBasicMaterial />
    </instancedMesh>
  )
}
