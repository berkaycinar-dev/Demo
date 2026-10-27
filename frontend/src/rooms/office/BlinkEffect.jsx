import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Color, Matrix4, Vector3 } from 'three'

const BOX = new BoxGeometry()
// Yanıp sönme için saniyede 4 kare yeter; sahnenin geri kalanı boştayken çizilmez.
const BLINK_FPS = 4

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
 * animated=false iken (hareketi azalt) hepsi sabit yanar ve hiç kare istemez.
 */
export default function BlinkEffect({ items, animated = true }) {
  const ref = useRef(null)
  const invalidate = useThree((s) => s.invalidate)

  useLayoutEffect(() => {
    const mesh = ref.current
    const color = new Color()
    items.forEach((item, i) => mesh.setColorAt(i, color.set(item.color)))
    mesh.instanceColor.needsUpdate = true
    writeBlinkers(mesh, items, 0, false)
  }, [items])

  useEffect(() => {
    if (!animated) return
    const id = setInterval(() => invalidate(), 1000 / BLINK_FPS)
    return () => clearInterval(id)
  }, [animated, invalidate])

  useFrame(({ clock }) => {
    if (animated) writeBlinkers(ref.current, items, clock.elapsedTime, true)
  })

  return (
    <instancedMesh ref={ref} args={[BOX, undefined, items.length]} frustumCulled={false}>
      <meshBasicMaterial />
    </instancedMesh>
  )
}
