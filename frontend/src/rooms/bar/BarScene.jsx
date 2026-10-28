import { useMemo } from 'react'
import AnimationTicker from '../core/AnimationTicker'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import SteamEffect from '../core/SteamEffect'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import BarEffect from './BarEffect'
import { buildBar } from './buildBar'

// Yağmurlu bir günde loş bar: gündüz pencereden gri-mavi ışık, lambalar sönük ama sıcak; akşam
// kehribar, gece koyu ve lambalar parlak. glass sokak manzarasını ve aynayı renklendirir.
const BAR_PRESETS = {
  day: {
    background: '#e4dccf',
    sky: '#f6f0e6',
    ground: '#8a6a4a',
    hemi: 2.2,
    sun: { color: '#e8eef5', intensity: 2.0, azimuth: -62, elevation: 50 },
    lampColor: '#ffcf86',
    lamp: 1.1,
    glow: 0.18,
    glass: '#ffffff',
    bulb: '#ffe9bf',
  },
  evening: {
    background: '#dcc4a6',
    lampColor: '#ffc06a',
    lamp: 3,
    glow: 0.5,
    glass: '#e8b48c',
    bulb: '#ffe0a0',
  },
  night: {
    background: '#17110e',
    sky: '#5a5f80',
    ground: '#2a1e18',
    lampColor: '#ffbf66',
    lamp: 5,
    glow: 0.75,
    glass: '#3a4462',
    bulb: '#ffe2a0',
  },
}

// Yağmur, alev ve vantilatör yavaş; saniyede 12 kare yeterli. Tek zamanlayıcı tüm efekti çizer.
const ANIMATION_FPS = 12

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Bar temasının ortak sahnesi. BarRoom1..10 bunu kendi yerleşimiyle çağırır. Prop'lar diğer
 * temalarla aynıdır: onSpotClick, reducedMotion, children, defaultTimeOfDay, className, style.
 * reducedMotion: true iken yağmur, neon, müzik kutusu ışıkları, mum, vantilatör ve buhar durur.
 */
export default function BarScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildBar(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={BAR_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      <BarEffect fx={room.fx} animated={animated} />
      {room.fx.steams.length > 0 && <SteamEffect steams={room.fx.steams} animated={animated} />}
      {animated && <AnimationTicker fps={ANIMATION_FPS} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
