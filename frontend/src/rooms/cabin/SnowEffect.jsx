import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Matrix4, Vector3 } from 'three'

const BOX = new BoxGeometry()
const FLAKES = 9
const FLAKE = [0.022, 0.022, 0.004]
const GOLDEN = 0.618034

const matrix = new Matrix4()
const position = new Vector3()
const scale = new Vector3().fromArray(FLAKE)

// Her tane camın üstünden altına süzülür, hafifçe yana salınır; altta kaybolup üstte yeniden belirir.
// Taneler pencere kasasının arkasında kalır, kayıtların ardından geçerken görünmez.
function writeSnow(mesh, windows, t) {
  let i = 0
  windows.forEach((w, n) => {
    for (let k = 0; k < FLAKES; k++) {
      const seed = n * FLAKES + k
      const speed = 0.12 + ((seed * GOLDEN) % 1) * 0.08
      const fall = (t * speed + ((seed * 0.37) % 1)) % 1
      const u = w.width * ((k * GOLDEN + n * 0.29) % 1) + 0.03 * Math.sin(t * 1.3 + seed)
      const y = w.height * (1 - fall)
      position.copy(w.across).multiplyScalar(Math.min(Math.max(u, 0.012), w.width - 0.012)).add(w.origin)
      position.y += Math.min(Math.max(y, 0.012), w.height - 0.012)
      mesh.setMatrixAt(i++, matrix.compose(position, w.quat, scale))
    }
  })
  mesh.instanceMatrix.needsUpdate = true
}

/**
 * Karlı pencerelerin ardında yağan kar. windows: [{ origin, across, width, height, quat }]
 * (camın sol-alt köşesi, cam boyunca birim yön, cam ölçüleri). Kareyi CabinScene'deki ortak
 * zamanlayıcı ister; animated=false iken taneler havada sabit durur.
 */
export default function SnowEffect({ windows, animated = true }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    writeSnow(ref.current, windows, 0)
  }, [windows])

  useFrame(({ clock }) => {
    if (animated) writeSnow(ref.current, windows, clock.elapsedTime)
  })

  return (
    <instancedMesh ref={ref} args={[BOX, undefined, windows.length * FLAKES]} frustumCulled={false}>
      <meshBasicMaterial color="#ffffff" />
    </instancedMesh>
  )
}
