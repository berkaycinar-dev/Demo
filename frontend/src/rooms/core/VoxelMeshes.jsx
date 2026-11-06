import { useCallback, useLayoutEffect, useRef } from 'react'
import Interactives from './Interactives'
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

// onReady(name, mesh, sorted): çizim sırasındaki kutular ve mesh bildirilir; tıklanabilir eşyalar
// (Interactives) kendi kutularını buradan bulup oynatır.
function InstancedLayer({ items, geometry, onReady, name, children, ...props }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    const matrix = new Matrix4()
    const scale = new Vector3()
    const color = new Color()
    const sorted = frontToBack(items)
    onReady(name, mesh, sorted)
    sorted.forEach((item, i) => {
      mesh.setMatrixAt(i, matrix.compose(item.center, item.quat, scale.fromArray(item.size)))
      mesh.setColorAt(i, color.set(item.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items, onReady, name])

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} {...props}>
      {children}
    </instancedMesh>
  )
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Oda katmanlarını çizer: solid + glass + bulb + glow (+ akşam/gece night) = en fazla 5 draw call.
// Tıklanabilir eşya varsa (lamba, bitki, makine) iki çağrı daha: görünmez çarpışma kutuları ve buhar.
// reducedMotion: true iken lamba anında açılıp kapanır, bitki ve makine kıpırdamaz.
export default function VoxelMeshes({ layers, reducedMotion }) {
  const preset = useTimeOfDay()
  const { solid, glass, bulb, glow, night } = layers
  const registry = useRef({})
  const interactives = layers.interactives ?? []
  const onReady = useCallback((name, mesh, sorted) => {
    registry.current[name] = { mesh, items: sorted }
  }, [])
  const getLayer = useCallback((name) => registry.current[name], [])

  return (
    <>
      {solid.length > 0 && (
        <InstancedLayer items={solid} geometry={BOX} onReady={onReady} name="solid" castShadow receiveShadow>
          <meshLambertMaterial />
        </InstancedLayer>
      )}
      {glass.length > 0 && (
        <InstancedLayer items={glass} geometry={BOX} onReady={onReady} name="glass">
          <meshBasicMaterial color={preset.glass} />
        </InstancedLayer>
      )}
      {bulb.length > 0 && (
        <InstancedLayer items={bulb} geometry={BOX} onReady={onReady} name="bulb">
          <meshBasicMaterial color={preset.bulb} />
        </InstancedLayer>
      )}
      {glow.length > 0 && (
        <InstancedLayer items={glow} geometry={FLAT_PLANE} onReady={onReady} name="glow" renderOrder={1}>
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
        <InstancedLayer items={night} geometry={BOX} onReady={onReady} name="night" visible={preset.nightLights > 0}>
          <meshBasicMaterial transparent opacity={preset.nightLights} />
        </InstancedLayer>
      )}
      {interactives.length > 0 && (
        <Interactives getLayer={getLayer} interactives={interactives} layers={layers} animated={!(reducedMotion ?? prefersReducedMotion())} />
      )}
    </>
  )
}
