import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Vector3 } from 'three'
import { TimeOfDayContext } from './roomContext'
import { TIME_LABELS, TIME_MODES, TIME_PRESETS, timeOfDayForHour } from './timeOfDay'
import './RoomCanvas.css'

// İzometrik kamera: 45° azimut, sabit yükseklik açısı. Sürükleme yalnızca azimutu değiştirir.
const BASE_AZIMUTH = Math.PI / 4
const ELEVATION = (33 * Math.PI) / 180
const CAMERA_DISTANCE = 80
const YAW_LIMIT = 0.7
const YAW_PER_PIXEL = 0.006
const DRAG_THRESHOLD = 4
const ZOOM_STEP = 1.2
const ZOOM_MIN = 0.7
const ZOOM_MAX = 2.5
const FIT_MARGIN = 0.9
const SHADOW_MAP_SIZE = 2048
// Maliyet piksel sayısıyla büyür; 2x ekranda 1.5 + MSAA voxel sahnede gözle ayırt edilmez ama
// GPU süresini ~%45 düşürür.
const MAX_DPR = 1.5

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

function useCurrentHour() {
  const [hour, setHour] = useState(() => new Date().getHours())
  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(id)
  }, [])
  return hour
}

// Oda kutusunu varsayılan açıdan ekrana sığdıran zoom ve kameranın bakacağı merkez.
// Ortografik izdüşümde kutu merkezine göre simetrik olduğu için merkez = kutu merkezi.
function frameRoom(bounds, size) {
  const min = new Vector3(...bounds.min)
  const max = new Vector3(...bounds.max)
  const target = min.clone().add(max).multiplyScalar(0.5)
  const sinAz = Math.sin(BASE_AZIMUTH)
  const cosAz = Math.cos(BASE_AZIMUTH)
  const sinEl = Math.sin(ELEVATION)
  const right = new Vector3(cosAz, 0, -sinAz)
  const up = new Vector3(-sinEl * sinAz, Math.cos(ELEVATION), -sinEl * cosAz)
  const corner = new Vector3()
  let halfWidth = 0
  let halfHeight = 0
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z).sub(target)
    halfWidth = Math.max(halfWidth, Math.abs(corner.dot(right)))
    halfHeight = Math.max(halfHeight, Math.abs(corner.dot(up)))
  }
  const fit = Math.min(size.width / (2 * halfWidth), size.height / (2 * halfHeight)) * FIT_MARGIN
  return { target, fit }
}

function CameraRig({ bounds, view }) {
  const size = useThree((s) => s.size)
  const { target, fit } = useMemo(() => frameRoom(bounds, size), [bounds, size])

  // frameloop="demand": bu yalnızca bir kare istendiğinde çalışır, boşta CPU/GPU harcamaz.
  useFrame(({ camera }) => {
    const { yaw, zoom } = view.current
    const azimuth = BASE_AZIMUTH + yaw
    const flat = Math.cos(ELEVATION) * CAMERA_DISTANCE
    camera.position.set(
      target.x + Math.sin(azimuth) * flat,
      target.y + Math.sin(ELEVATION) * CAMERA_DISTANCE,
      target.z + Math.cos(azimuth) * flat,
    )
    camera.lookAt(target)
    const nextZoom = fit * zoom
    if (camera.zoom !== nextZoom) {
      camera.zoom = nextZoom
      camera.updateProjectionMatrix()
    }
  })

  return null
}

// Güneş/ay + gökyüzü + lamba ışıkları. Gölge haritası yalnızca ışık değişince yeniden çizilir
// (gl.shadowMap.autoUpdate = false); kamera dönerken dünya sabit kaldığı için gerek yok.
function Lighting({ bounds, preset, lamps }) {
  const sun = useRef(null)
  const getState = useThree((s) => s.get)
  const { center, radius } = useMemo(() => {
    const min = new Vector3(...bounds.min)
    const max = new Vector3(...bounds.max)
    return {
      center: min.clone().add(max).multiplyScalar(0.5),
      radius: min.distanceTo(max) / 2,
    }
  }, [bounds])
  const { azimuth, elevation } = preset.sun
  const sunPosition = useMemo(() => {
    const az = (azimuth * Math.PI) / 180
    const el = (elevation * Math.PI) / 180
    const dir = new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    return dir.multiplyScalar(radius + 20).add(center)
  }, [azimuth, elevation, center, radius])

  useLayoutEffect(() => {
    const light = sun.current
    light.target.position.copy(center)
    light.target.updateMatrixWorld()
    const cam = light.shadow.camera
    cam.left = cam.bottom = -radius
    cam.right = cam.top = radius
    cam.near = 1
    cam.far = 2 * radius + 40
    cam.updateProjectionMatrix()
  }, [center, radius])

  useLayoutEffect(() => {
    const state = getState()
    state.gl.shadowMap.needsUpdate = true
    state.invalidate()
  }, [sunPosition, getState])

  return (
    <>
      <hemisphereLight color={preset.sky} groundColor={preset.ground} intensity={preset.hemi} />
      <directionalLight
        ref={sun}
        position={sunPosition}
        color={preset.sun.color}
        intensity={preset.sun.intensity}
        castShadow
        shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={3}
      />
      {lamps.map((lamp, i) => (
        <pointLight
          key={i}
          position={Array.isArray(lamp) ? lamp : lamp.position}
          color={lamp.color ?? preset.lampColor}
          intensity={preset.lamp}
          distance={4.5}
          decay={2}
        />
      ))}
    </>
  )
}

/**
 * Tema bağımsız izometrik oda sahnesi: kamera, ışık, sürükle-döndür, yakınlaştırma ve
 * gün zamanı düğmeleri. Tema içeriği (voxel mesh'ler, halkalar, avatarlar) children olarak gelir.
 *
 * bounds: { min: [x, y, z], max: [x, y, z] } oda kutusu (kadraj ve gölge kamerası için)
 * lamps: nokta ışıklar [[x, y, z] | { position, color }, ...] (performans için en fazla 4); renk verilmezse
 *        gün zamanı ayarındaki lampColor
 * presets: temaya özel gün zamanı ayarları, TIME_PRESETS üzerine yazılır ({ night: { glass } } gibi)
 */
export default function RoomCanvas({
  bounds,
  lamps = [],
  presets,
  defaultTimeOfDay = 'auto',
  className = '',
  style,
  children,
}) {
  const [mode, setMode] = useState(defaultTimeOfDay)
  const hour = useCurrentHour()
  const timeOfDay = mode === 'auto' ? timeOfDayForHour(hour) : mode
  const preset = useMemo(
    () => ({ ...TIME_PRESETS[timeOfDay], ...presets?.[timeOfDay] }),
    [timeOfDay, presets],
  )

  const view = useRef({ yaw: 0, zoom: 1 })
  const store = useRef(null)
  const drag = useRef(null)

  const redraw = () => store.current?.invalidate()
  const zoomBy = (factor) => {
    view.current.zoom = clamp(view.current.zoom * factor, ZOOM_MIN, ZOOM_MAX)
    redraw()
  }
  const resetView = () => {
    view.current.yaw = 0
    view.current.zoom = 1
    redraw()
  }

  const isUi = (target) => target.closest('.room-canvas__ui') !== null

  const onPointerDown = (e) => {
    if (e.button !== 0 || isUi(e.target)) return
    drag.current = { id: e.pointerId, x: e.clientX, yaw: view.current.yaw, active: false }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    if (!d.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      // Eşik aşılınca yakala; kısa tıklamalar sahnedeki halkalara gitmeye devam eder.
      d.active = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    view.current.yaw = clamp(d.yaw + dx * YAW_PER_PIXEL, -YAW_LIMIT, YAW_LIMIT)
    redraw()
  }
  const endDrag = (e) => {
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  return (
    <div
      className={`room-canvas ${className}`}
      style={{ '--room-bg': preset.background, ...style }}
      data-time={timeOfDay}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(e) => !isUi(e.target) && resetView()}
    >
      <Canvas
        orthographic
        frameloop="demand"
        shadows="percentage"
        flat
        dpr={[1, MAX_DPR]}
        gl={{ antialias: true, alpha: true, stencil: false, powerPreference: 'high-performance' }}
        camera={{ near: 0.1, far: CAMERA_DISTANCE * 2.5 }}
        onCreated={(state) => {
          state.gl.shadowMap.autoUpdate = false
          state.gl.shadowMap.needsUpdate = true
          store.current = state
        }}
      >
        <CameraRig bounds={bounds} view={view} />
        <Lighting bounds={bounds} preset={preset} lamps={lamps} />
        <TimeOfDayContext.Provider value={preset}>{children}</TimeOfDayContext.Provider>
      </Canvas>

      <div className="room-canvas__ui room-canvas__toolbar" role="toolbar" aria-label="Sahne kontrolleri">
        <div className="room-canvas__group">
          <button type="button" aria-label="Yakınlaştır" onClick={() => zoomBy(ZOOM_STEP)}>
            +
          </button>
          <button type="button" aria-label="Uzaklaştır" onClick={() => zoomBy(1 / ZOOM_STEP)}>
            −
          </button>
          <button type="button" onClick={resetView}>
            Sıfırla
          </button>
        </div>
        <div className="room-canvas__group" role="group" aria-label="Gün zamanı">
          {TIME_MODES.map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
              {TIME_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <p className="room-canvas__hint">Sürükle: döndür · Çift tık: sıfırla</p>
    </div>
  )
}
