import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { AdditiveBlending, BoxGeometry, Color, Matrix4, Quaternion, Vector3 } from 'three'
import { FLAT_PLANE, getGlowTexture } from '../core/glow'
import { useTimeOfDay } from '../core/roomContext'

const BOX = new BoxGeometry()
// Alevler ateş orijinine göre [x, z, en, boy, renk]: altta sarı kor tabanı, üstte turuncu dilimler.
const FLAMES = [
  [0, 0, 0.22, 0.1, '#ffd45a'],
  [0, 0, 0.13, 0.38, '#ff8a1e'],
  [0.07, 0.04, 0.09, 0.24, '#ff5a14'],
  [-0.07, 0.03, 0.09, 0.27, '#ff6a14'],
  [0.02, -0.07, 0.09, 0.22, '#ff7a1a'],
  [-0.03, -0.06, 0.08, 0.2, '#ff9a2a'],
  [0.01, 0.06, 0.06, 0.3, '#ffc23a'],
]
const FLAME_BASE = 0.05
const SPARKS = 8
const SPARK_LIFE = 1.8
const SPARK_COLORS = ['#ffd27a', '#ff9a3c']
const LIGHT_HEIGHT = 0.55

// Üç sinüsün toplamı: göze rastgele gelen, kesintisiz titreme (-1..1).
const wobble = (t, seed) =>
  0.5 * Math.sin(t * 7.1 + seed) + 0.3 * Math.sin(t * 12.7 + seed * 2.3) + 0.2 * Math.sin(t * 21.3 + seed * 4.1)

const matrix = new Matrix4()
const position = new Vector3()
const scale = new Vector3()
const rotation = new Quaternion()

// Alevlerin boyunu/enini oynatır; kıvılcımlar açık havada yükselip küçülerek kaybolur.
function writeFlames(mesh, fires, t, animated) {
  let i = 0
  fires.forEach(([fx, fy, fz], fire) => {
    FLAMES.forEach(([x, z, w, h], k) => {
      const seed = fire * 10 + k
      const height = h * (animated ? 1 + 0.25 * wobble(t, seed) : 1)
      const width = w * (animated ? 1 - 0.08 * wobble(t * 1.3, seed + 5) : 1)
      const sway = animated ? 0.015 * wobble(t * 0.8, seed + 9) : 0
      position.set(fx + x + sway, fy + FLAME_BASE + height / 2, fz + z)
      mesh.setMatrixAt(i++, matrix.compose(position, rotation, scale.set(width, height, width)))
    })
    for (let k = 0; k < SPARKS; k++) {
      const seed = fire * 10 + k
      const life = (t / SPARK_LIFE + k / SPARKS) % 1
      const size = animated ? 0.04 * (1 - life) : 0
      position.set(
        fx + 0.18 * Math.sin(seed * 12.9898) + 0.08 * life * Math.sin(t * 2 + seed),
        fy + FLAME_BASE + 0.2 + life * 1.1,
        fz + 0.18 * Math.sin(seed * 78.233) + 0.06 * life * Math.cos(t * 1.7 + seed),
      )
      mesh.setMatrixAt(i++, matrix.compose(position, rotation, scale.setScalar(Math.max(size, 1e-4))))
    }
  })
  mesh.instanceMatrix.needsUpdate = true
}

/**
 * Kamp ateşi: titreyen alevler, kıvılcımlar, dalgalanan ışık ve zeminde ışık havuzu.
 * fires: ateş orijinleri [[x, y, z], ...]; radius: ışık havuzunun yarıçapı (oturak çemberi).
 * Kareyi CampScene'deki ortak zamanlayıcı ister; animated=false iken sabit durur.
 */
export default function CampfireEffect({ fires, radius, animated = true }) {
  const preset = useTimeOfDay()
  const flames = useRef(null)
  const glows = useRef(null)
  const lights = useRef([])

  useLayoutEffect(() => {
    const mesh = flames.current
    const color = new Color()
    let i = 0
    for (let f = 0; f < fires.length; f++) {
      for (const flame of FLAMES) mesh.setColorAt(i++, color.set(flame[4]))
      for (let k = 0; k < SPARKS; k++) mesh.setColorAt(i++, color.set(SPARK_COLORS[k % 2]))
    }
    mesh.instanceColor.needsUpdate = true
    writeFlames(mesh, fires, 0, false)

    const size = 2 * (radius + 0.8)
    fires.forEach(([fx, fy, fz], g) => {
      glows.current.setMatrixAt(g, matrix.compose(position.set(fx, fy + 0.01, fz), rotation, scale.set(size, 1, size)))
    })
    glows.current.instanceMatrix.needsUpdate = true
  }, [fires, radius])

  useFrame(({ clock }) => {
    if (!animated) return
    const t = clock.elapsedTime
    writeFlames(flames.current, fires, t, true)
    glows.current.material.opacity = preset.glow * (1 + 0.15 * wobble(t * 0.9, 3))
    lights.current.forEach((light, i) => {
      if (light) light.intensity = preset.lamp * (1 + 0.18 * wobble(t, 7 + i))
    })
  })

  return (
    <>
      <instancedMesh
        ref={flames}
        args={[BOX, undefined, fires.length * (FLAMES.length + SPARKS)]}
        frustumCulled={false}
      >
        <meshBasicMaterial />
      </instancedMesh>
      <instancedMesh ref={glows} args={[FLAT_PLANE, undefined, fires.length]} frustumCulled={false} renderOrder={1}>
        <meshBasicMaterial
          map={getGlowTexture()}
          color={preset.lampColor}
          opacity={preset.glow}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </instancedMesh>
      {fires.map(([fx, fy, fz], i) => (
        <pointLight
          key={i}
          ref={(light) => {
            lights.current[i] = light
          }}
          position={[fx, fy + LIGHT_HEIGHT, fz]}
          color={preset.lampColor}
          intensity={preset.lamp}
          distance={radius + 3.5}
          decay={2}
        />
      ))}
    </>
  )
}
