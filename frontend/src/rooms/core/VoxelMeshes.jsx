import { useLayoutEffect, useRef } from 'react'
import { AdditiveBlending, BoxGeometry, Color, Matrix4, Vector3 } from 'three'
import { FLAT_PLANE, getGlowTexture } from './glow'
import { useTimeOfDay } from './roomContext'

// Tüm odalar aynı geometriyi paylaşır; GPU'ya bir kez yüklenir.
const BOX = new BoxGeometry()

// Varsayılan izometrik kameradan sahneye bakışın tersi (45° azimut, 33° yükseklik; RoomCanvas ile
// aynı). Kamera yalnızca ±40° döndüğü için bu yöne göre yapılan sıralama her açıda geçerli kalır.
const TOWARD_CAMERA = new Vector3(1, Math.SQRT2 * Math.tan((33 * Math.PI) / 180), 1).normalize()

// Kutuları kameraya yakından uzağa sıralar. Önce çizilen ön kutular derinliği doldurur; arkadaki
// zemin ve duvar pikselleri derinlik testinde elenir, ışık/gölge hesabı boşa tekrarlanmaz
// (overdraw). Büyük odada yakınlaşınca GPU süresi yarıya iner.
const frontToBack = (items) =>
  items
    .map((item) => [item.center.dot(TOWARD_CAMERA), item])
    .sort((a, b) => b[0] - a[0])
    .map(([, item]) => item)

function InstancedLayer({ items, geometry, children, ...props }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    const matrix = new Matrix4()
    const scale = new Vector3()
    const color = new Color()
    frontToBack(items).forEach((item, i) => {
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

// Oda katmanlarını çizer: solid + glass + bulb + glow (+ akşam/gece night) = en fazla 5 draw call.
export default function VoxelMeshes({ layers }) {
  const preset = useTimeOfDay()
  const { solid, glass, bulb, glow, night } = layers

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
      {night.length > 0 && (
        <InstancedLayer items={night} geometry={BOX} visible={preset.nightLights > 0}>
          <meshBasicMaterial transparent opacity={preset.nightLights} />
        </InstancedLayer>
      )}
    </>
  )
}
