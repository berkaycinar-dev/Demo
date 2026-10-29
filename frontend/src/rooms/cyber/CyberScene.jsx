import { useMemo } from 'react'
import AnimationTicker from '../core/AnimationTicker'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import SteamEffect from '../core/SteamEffect'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import { buildCyber } from './buildCyber'
import CyberEffect from './CyberEffect'

// Megakentte kule katı: gündüz dumanlı soluk gök, akşam mor-turuncu, gece lacivert ve tam neon.
// Lambalar kendi rengini taşır (eflatun, camgöbeği, kehribar), bu yüzden lampColor beyaz; bulb da
// beyaz, neonlar gün boyu kendi renginde parlar. glass kent manzarasını renklendirir.
const CYBER_PRESETS = {
  day: {
    background: '#c3ccd8',
    sky: '#eef3ff',
    ground: '#3a3f4a',
    hemi: 1.9,
    sun: { color: '#e6efff', intensity: 1.8, azimuth: -62, elevation: 48 },
    lampColor: '#ffffff',
    lamp: 0.9,
    glow: 0.25,
    nightLights: 0,
    glass: '#ffffff',
    bulb: '#ffffff',
  },
  evening: {
    background: '#4a3552',
    sky: '#ffb89a',
    ground: '#2a2030',
    hemi: 1.3,
    sun: { color: '#ff9a6a', intensity: 1.6, azimuth: -74, elevation: 22 },
    lampColor: '#ffffff',
    lamp: 2.8,
    glow: 0.55,
    nightLights: 0.7,
    glass: '#f0a0b4',
    bulb: '#ffffff',
  },
  night: {
    background: '#0a0c16',
    sky: '#4a4f8a',
    ground: '#120c1a',
    hemi: 0.9,
    sun: { color: '#8a9cff', intensity: 0.4, azimuth: -55, elevation: 40 },
    lampColor: '#ffffff',
    lamp: 5,
    glow: 0.85,
    nightLights: 1,
    glass: '#3a3f78',
    bulb: '#ffffff',
  },
}

// LED'ler, araçlar ve hologram için saniyede 12 kare yeterli. Tek zamanlayıcı tüm efekti çizer.
const ANIMATION_FPS = 12

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Siber Loft temasının ortak sahnesi. CyberRoom1..10 bunu kendi yerleşimiyle çağırır. Prop'lar
 * diğer temalarla aynıdır: onSpotClick, reducedMotion, children, defaultTimeOfDay, className, style.
 * reducedMotion: true iken araçlar, LED'ler, hologram, drone ve buhar durur.
 */
export default function CyberScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildCyber(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={CYBER_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      <CyberEffect fx={room.fx} animated={animated} />
      {room.fx.steams.length > 0 && <SteamEffect steams={room.fx.steams} animated={animated} />}
      {animated && <AnimationTicker fps={ANIMATION_FPS} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
