import { useLayoutEffect, useRef } from 'react'
import { AdditiveBlending, BoxGeometry, Color, Matrix4, Vector3 } from 'three'
import { FLAT_PLANE, getGlowTexture } from './glow'
import { useTimeOfDay } from './roomContext'

// Tüm odalar aynı geometriyi paylaşır; GPU'ya bir kez yüklenir.
const BOX = new BoxGeometry()

function InstancedLayer({ items, geometry, children, ...props }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    const matrix = new Matrix4()
    const scale = new Vector3()
    const color = new Color()
    items.forEach((item, i) => {
      mesh.setMatrixAt(i, matrix.compose(item.center, item.quat, scale.fromArray(item.size)))
      mesh.setColorAt(i, color.set(item.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} {...props}>
      {children}
    </instancedMesh>
  )
}

// Oda katmanlarını çizer: solid + glass + bulb + glow = en fazla 4 draw call.
export default function VoxelMeshes({ layers }) {
  const preset = useTimeOfDay()
  const { solid, glass, bulb, glow } = layers

  return (
    <>
      {solid.length > 0 && (
        <InstancedLayer items={solid} geometry={BOX} castShadow receiveShadow>
          <meshLambertMaterial />
        </InstancedLayer>
      )}
      {glass.length > 0 && (
        <InstancedLayer items={glass} geometry={BOX}>
          <meshBasicMaterial color={preset.glass} />
        </InstancedLayer>
      )}
      {bulb.length > 0 && (
        <InstancedLayer items={bulb} geometry={BOX}>
          <meshBasicMaterial color={preset.bulb} />
        </InstancedLayer>
      )}
      {glow.length > 0 && (
        <InstancedLayer items={glow} geometry={FLAT_PLANE} renderOrder={1}>
          <meshBasicMaterial
            map={getGlowTexture()}
            color={preset.lampColor}
            opacity={preset.glow}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </InstancedLayer>
      )}
    </>
  )
}
