import { useLayoutEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  Matrix4,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { useTimeOfDay } from './roomContext'

// Tüm odalar aynı geometriyi paylaşır; GPU'ya bir kez yüklenir.
const BOX = new BoxGeometry()
const FLAT_PLANE = new PlaneGeometry().rotateX(-Math.PI / 2)

let glowTexture
function getGlowTexture() {
  if (glowTexture) return glowTexture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.45)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  glowTexture = new CanvasTexture(canvas)
  glowTexture.colorSpace = SRGBColorSpace
  return glowTexture
}

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
