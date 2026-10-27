import { useMemo } from 'react'
import AnimationTicker from '../core/AnimationTicker'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import { buildCamp } from './buildCamp'
import CampfireEffect from './CampfireEffect'
import NightLifeEffect from './NightLifeEffect'

// Açık hava: gündüz gök mavisi, akşam gün batımı, gece lacivert; gece ana ışık kamp ateşi.
// glass gölü renklendirir.
const CAMP_PRESETS = {
  day: {
    background: '#d3e8f2',
    sky: '#fff8e8',
    ground: '#6f8a4c',
    hemi: 2.0,
    lamp: 0.6,
    glow: 0.12,
    glass: '#ffffff',
    bulb: '#f2e6c4',
  },
  evening: {
    background: '#f0c9a8',
    ground: '#6a5a3c',
    lampColor: '#ffb469',
    lamp: 3.2,
    glow: 0.55,
    glass: '#f2b48a',
  },
  night: {
    background: '#0f1626',
    sky: '#4a5a8a',
    ground: '#1a1f1a',
    hemi: 1.0,
    sun: { color: '#9db2ff', intensity: 0.45, azimuth: -55, elevation: 40 },
    lampColor: '#ffa24a',
    lamp: 7,
    glow: 0.9,
    glass: '#26345a',
    bulb: '#ffd98a',
  },
}

// Ateş titremesi için saniyede 15 kare; ateş böcekleri ve yıldızlar aynı kareleri kullanır.
const ANIMATION_FPS = 15

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Göl kenarı kamp temasının ortak sahnesi. CampRoom1..10 bunu kendi yerleşimiyle çağırır.
 * Prop'lar diğer temalarla aynıdır: onSpotClick, reducedMotion, children, defaultTimeOfDay,
 * className, style. reducedMotion: true iken ateş, ateş böcekleri ve yıldızlar durur.
 */
export default function CampScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildCamp(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={CAMP_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      {room.fires.length > 0 && <CampfireEffect fires={room.fires} radius={layout.fire.radius} animated={animated} />}
      <NightLifeEffect fireflies={room.fireflies} twinkles={room.twinkles} animated={animated} />
      {animated && <AnimationTicker fps={ANIMATION_FPS} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
