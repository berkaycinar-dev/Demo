import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Matrix4, Quaternion, Vector3 } from 'three'

const BOX = new BoxGeometry()
const PUFFS = 5
const PUFF_LIFE = 2.6
const RISE = 0.5

const matrix = new Matrix4()
const position = new Vector3()
const scale = new Vector3()
const rotation = new Quaternion()

// Her bulutçuk yükselirken büyür, sona doğru küçülerek kaybolur; hafifçe yana salınır.
function writeSteam(mesh, steams, t, animated) {
  let i = 0
  steams.forEach(([sx, sy, sz], s) => {
    for (let k = 0; k < PUFFS; k++) {
      const life = ((animated ? t / PUFF_LIFE : 0) + k / PUFFS + s * 0.37) % 1
      const fade = life > 0.7 ? (1 - life) / 0.3 : 1
      const size = (0.05 + 0.09 * life) * fade
      position.set(
        sx + 0.06 * life * Math.sin(t * 1.1 + k * 2.1),
        sy + life * RISE,
        sz + 0.04 * life * Math.sin(t * 0.8 + k * 1.3),
      )
      mesh.setMatrixAt(i++, matrix.compose(position, rotation, scale.setScalar(Math.max(size, 1e-4))))
    }
  })
  mesh.instanceMatrix.needsUpdate = true
}

/**
 * Semaverden yükselen buhar. steams: buhar çıkış noktaları [[x, y, z], ...].
 * Kareyi TeaGardenScene'deki ortak zamanlayıcı ister; animated=false iken (hareketi azalt)
 * bulutçuklar sabit durur.
 */
export default function SteamEffect({ steams, animated = true }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    writeSteam(ref.current, steams, 0, false)
  }, [steams])

  useFrame(({ clock }) => {
    if (animated) writeSteam(ref.current, steams, clock.elapsedTime, true)
  })

  return (
    <instancedMesh ref={ref} args={[BOX, undefined, steams.length * PUFFS]} frustumCulled={false}>
      <meshLambertMaterial color="#f7f6f2" transparent opacity={0.55} depthWrite={false} />
    </instancedMesh>
  )
}
