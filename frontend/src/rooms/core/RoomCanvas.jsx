import { Canvas, useFrame, useThree } from '@react-three/fiber'
import './quietClock'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
    // lookAt dünya matrisini dönüşten önce günceller; aynı karede kamerayla izdüşüm yapanlar (avatar
    // etiketleri) eski dönüşü görmesin
    camera.updateMatrixWorld()
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
 * toolbar: 'full' (varsayılan; zoom + dört gün zamanı düğmesi) ya da 'compact' (zoom + katlanır gün zamanı
 *          menüsü, sağ altta; oda oluşturma gibi asıl eylemin sahne dışında olduğu sayfalar için).
 * hint: sol alttaki ipucu yazısı (varsayılan: sürükleme ve çift tık).
 * canvasStyle: 3D çizim alanının stili; arka plan tüm kutuyu doldururken sahneyi daraltmak için
 *              ({ width: 'calc(100% - 400px)' } gibi). Verilmezse sahne kutunun tamamını kullanır.
 */
// Kompakt araç çubuğunda yakınlaştırma büyüteçle gösterilir: aynı sayfadaki kapasite seçicinin
// −/+ düğmeleriyle karışmasın (sitenin ikon dili: 24 px ızgara, 2 px çizgi, yuvarlak uçlar).
function ZoomGlyph({ sign }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d={sign === 'in' ? 'M15.5 15.5 21 21M7.5 10.5h6M10.5 7.5v6' : 'M15.5 15.5 21 21M7.5 10.5h6'} />
    </svg>
  )
}

// Katlanır gün zamanı seçici (toolbar="compact"): düğme o anki seçimi gösterir, menü yukarı açılır;
// seçim, dışarı tıklama ya da Esc kapatır.
function TimeMenu({ mode, onChange }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="room-canvas__time" ref={root}>
      {open && (
        <div id={menuId} className="room-canvas__time-menu" role="group" aria-label="Gün zamanı">
          {TIME_MODES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                onChange(m)
                setOpen(false)
                trigger.current?.focus()
              }}
            >
              <svg className="room-canvas__time-check" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {TIME_LABELS[m]}
            </button>
          ))}
        </div>
      )}
      <button
        ref={trigger}
        type="button"
        className="room-canvas__time-btn"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Gün zamanı: ${TIME_LABELS[mode]}`}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <span>{TIME_LABELS[mode]}</span>
        <svg className="room-canvas__time-chev" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>
    </div>
  )
}

export default function RoomCanvas({
  bounds,
  lamps = [],
  presets,
  defaultTimeOfDay = 'auto',
  className = '',
  style,
  canvasStyle,
  toolbar = 'full',
  hint = 'Sürükle: döndür · Çift tık: sıfırla',
  children,
}) {
  const [mode, setMode] = useState(defaultTimeOfDay)
  const compact = toolbar === 'compact'
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
        style={canvasStyle}
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

      {compact ? (
        <div className="room-canvas__ui room-canvas__toolbar room-canvas__toolbar--compact" role="toolbar" aria-label="Sahne kontrolleri">
          <div className="room-canvas__group">
            <button type="button" aria-label="Yakınlaştır" onClick={() => zoomBy(ZOOM_STEP)}>
              <ZoomGlyph sign="in" />
            </button>
            <button type="button" aria-label="Uzaklaştır" onClick={() => zoomBy(1 / ZOOM_STEP)}>
              <ZoomGlyph sign="out" />
            </button>
            <button type="button" onClick={resetView}>
              Sıfırla
            </button>
          </div>
          <TimeMenu mode={mode} onChange={setMode} />
        </div>
      ) : (
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
      )}

      <p className="room-canvas__hint">{hint}</p>
    </div>
  )
}
