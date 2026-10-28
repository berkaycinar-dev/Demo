import { useMemo } from 'react'
import AnimationTicker from '../core/AnimationTicker'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import SteamEffect from '../core/SteamEffect'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import { buildUnderwater } from './buildUnderwater'
import ReefEffect from './ReefEffect'

// Üssün aydınlatma döngüsü: gündüz yüzeyden süzülen serin mavi ışık, akşam sıcak loş lambalar,
// gece lacivert. Işık akvaryum camından gelir. glass deniz manzarasını ve havuz suyunu
// renklendirir: gündüz berrak, akşam mor-mavi, gece koyu lacivert.
const UNDERWATER_PRESETS = {
  day: {
    background: '#d6e6ee',
    sky: '#e8f7ff',
    ground: '#4f6b80',
    hemi: 2.0,
    sun: { color: '#d4f0ff', intensity: 2.1, azimuth: -62, elevation: 55 },
    lampColor: '#e6f6ff',
    lamp: 1.5,
    glow: 0.12,
    glass: '#ffffff',
    bulb: '#eafcff',
  },
  evening: {
    background: '#ccd5e6',
    sky: '#c9dcff',
    ground: '#4d5468',
    hemi: 1.6,
    sun: { color: '#9fc0f0', intensity: 1.5, azimuth: -70, elevation: 35 },
    lampColor: '#ffdcb4',
    lamp: 3,
    glow: 0.35,
    glass: '#c3cdf0',
    bulb: '#fff0dc',
  },
  night: {
    background: '#0b1622',
    sky: '#4f6f9c',
    ground: '#1c2530',
    hemi: 1.3,
    sun: { color: '#7fa6ff', intensity: 0.45, azimuth: -60, elevation: 40 },
    lampColor: '#c4e8ff',
    lamp: 4.5,
    glow: 0.6,
    glass: '#4d6496',
    bulb: '#ffffff',
  },
}

// Balık, yosun ve denizanası yavaş; saniyede 12 kare akıcı görünür. Tek zamanlayıcı tüm efekti çizer.
const ANIMATION_FPS = 12

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Sualtı araştırma üssü temasının ortak sahnesi. UnderwaterRoom1..10 bunu kendi yerleşimiyle
 * çağırır. Prop'lar diğer temalarla aynıdır: onSpotClick, reducedMotion, children,
 * defaultTimeOfDay, className, style. reducedMotion: true iken balıklar, yosunlar, kabarcıklar,
 * sonar ve kahve buharı durur.
 */
export default function UnderwaterScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildUnderwater(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={UNDERWATER_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      <ReefEffect fx={room.fx} animated={animated} />
      {room.fx.steams.length > 0 && <SteamEffect steams={room.fx.steams} animated={animated} />}
      {animated && <AnimationTicker fps={ANIMATION_FPS} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
