import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { AdditiveBlending, BoxGeometry, Color, Matrix4, Quaternion, Vector3 } from 'three'
import { FLAT_PLANE, getGlowTexture } from '../core/glow'
import { useTimeOfDay } from '../core/roomContext'
import { FLAME_BASE, FLAMES } from './parts'

const BOX = new BoxGeometry()
// Ateş saniyede en fazla bu kadar kare ister; sürüklerken sahne zaten tam hızda çizilir.
const FIRE_FPS = 15
const SPARKS = 6
const SPARK_LIFE = 1.6
const SPARK_COLORS = ['#ffd27a', '#ff9a3c']
// Ateş orijinine göre ışık havuzları [x, y, z, w, d] ve ışık konumu.
const GLOWS = [
  [-0.85, 0.136, 0.2, 1.7, 0.8],
  [-1.3, 0.05, 1.0, 2.6, 1.3],
]
const LIGHT_OFFSET = [0, 0.6, 0.95]

// Üç sinüsün toplamı: göze rastgele gelen, kesintisiz titreme (-1..1).
const wobble = (t, seed) =>
  0.5 * Math.sin(t * 7.1 + seed) + 0.3 * Math.sin(t * 12.7 + seed * 2.3) + 0.2 * Math.sin(t * 21.3 + seed * 4.1)

const matrix = new Matrix4()
const position = new Vector3()
const scale = new Vector3()
const rotation = new Quaternion()

// Alevlerin boyunu/enini oynatır, kıvılcımları yukarı taşır (bacada kaybolurlar).
function writeFlames(mesh, fires, t, animated) {
  let i = 0
  fires.forEach(([fx, fy, fz], fire) => {
    FLAMES.forEach(([x, z, w, h], k) => {
      const seed = fire * 10 + k
      const height = h * (animated ? 1 + 0.22 * wobble(t, seed) : 1)
      const width = w * (animated ? 1 - 0.08 * wobble(t * 1.3, seed + 5) : 1)
      const sway = animated ? 0.012 * wobble(t * 0.8, seed + 9) : 0
      position.set(fx + x + sway, fy + FLAME_BASE + height / 2, fz + z)
      mesh.setMatrixAt(i++, matrix.compose(position, rotation, scale.set(width, height, width)))
    })
    for (let k = 0; k < SPARKS; k++) {
      const seed = fire * 10 + k
      const life = (t / SPARK_LIFE + k / SPARKS) % 1
      const size = animated ? 0.045 * (1 - life) : 0
      position.set(
        fx + 0.25 * Math.sin(seed * 12.9898) + 0.04 * Math.sin(t * 3 + seed),
        fy + FLAME_BASE + 0.1 + life * 0.6,
        fz + 0.38 + 0.08 * Math.sin(seed * 78.233),
      )
      mesh.setMatrixAt(i++, matrix.compose(position, rotation, scale.setScalar(Math.max(size, 1e-4))))
    }
  })
  mesh.instanceMatrix.needsUpdate = true
}

/**
 * Şömine ateşi: titreyen alevler, kıvılcımlar, dalgalanan ışık ve ışık havuzu.
 * fires: ateş orijinleri [[x, y, z], ...]. animated=false iken (hareketi azalt) sabit durur
 * ve hiç kare istemez.
 */
export default function FireEffect({ fires, animated = true }) {
  const preset = useTimeOfDay()
  const invalidate = useThree((s) => s.invalidate)
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

    const glowMesh = glows.current
    let g = 0
    for (const [fx, fy, fz] of fires) {
      for (const [x, y, z, w, d] of GLOWS) {
        position.set(fx + x + w / 2, fy + y, fz + z + d / 2)
        glowMesh.setMatrixAt(g++, matrix.compose(position, rotation, scale.set(w, 1, d)))
      }
    }
    glowMesh.instanceMatrix.needsUpdate = true
  }, [fires])

  useEffect(() => {
    if (!animated) return
    const id = setInterval(() => invalidate(), 1000 / FIRE_FPS)
    return () => clearInterval(id)
  }, [animated, invalidate])

  useFrame(({ clock }) => {
    if (!animated) return
    const t = clock.elapsedTime
    writeFlames(flames.current, fires, t, true)
    glows.current.material.opacity = preset.glow * (1 + 0.12 * wobble(t * 0.9, 3))
    lights.current.forEach((light, i) => {
      if (light) light.intensity = preset.lamp * (1 + 0.15 * wobble(t, 7 + i))
    })
  })

  return (
    <>
      <instancedMesh
        ref={flames}
        args={[BOX, undefined, fires.length * (FLAMES.length + SPARKS)]}
        frustumCulled={false}
      >
        <meshBasicMaterial color={preset.bulb} />
      </instancedMesh>
      <instancedMesh
        ref={glows}
        args={[FLAT_PLANE, undefined, fires.length * GLOWS.length]}
        frustumCulled={false}
        renderOrder={1}
      >
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
          position={[fx + LIGHT_OFFSET[0], fy + LIGHT_OFFSET[1], fz + LIGHT_OFFSET[2]]}
          color={preset.lampColor}
          intensity={preset.lamp}
          distance={4.5}
          decay={2}
        />
      ))}
    </>
  )
}
