import { useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Matrix4, RingGeometry } from 'three'
import { useTimeOfDay } from './roomContext'

const RING = new RingGeometry(0.36, 0.47, 40).rotateX(-Math.PI / 2)
const RING_Y = 0.03
const CLICK_TOLERANCE = 5

// Zemindeki mola noktası halkaları: tek InstancedMesh, tıklanınca onSpotClick(spot).
export default function SpotRings({ spots, onSpotClick }) {
  const ref = useRef(null)
  const preset = useTimeOfDay()
  const getState = useThree((s) => s.get)
  const [hovered, setHovered] = useState(false)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new Matrix4()
    spots.forEach((spot, i) => {
      mesh.setMatrixAt(i, matrix.makeTranslation(spot.position[0], RING_Y, spot.position[2]))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [spots])

  useEffect(() => {
    const canvas = getState().gl.domElement
    canvas.style.cursor = hovered ? 'pointer' : ''
    return () => {
      canvas.style.cursor = ''
    }
  }, [hovered, getState])

  if (spots.length === 0) return null

  return (
    <instancedMesh
      ref={ref}
      args={[RING, undefined, spots.length]}
      onClick={(e) => {
        if (e.delta > CLICK_TOLERANCE) return
        e.stopPropagation()
        onSpotClick?.(spots[e.instanceId])
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshBasicMaterial color={preset.ring} transparent opacity={0.75} depthWrite={false} />
    </instancedMesh>
  )
}
