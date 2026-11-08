import { useMemo } from 'react'
import AnimationTicker from '../core/AnimationTicker'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import SteamEffect from '../core/SteamEffect'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import AlchemyEffect from './AlchemyEffect'
import { buildAlchemist } from './buildAlchemist'

// Taş kulede loş bir oda: gündüz dar pencerelerden soğuk ışık, akşam kehribar, gece mavi ay ışığı;
// içeriyi mumlar, kazan (yeşil) ve kristal küre (mor) aydınlatır. Lambalar kendi rengini taşır, bu
// yüzden lampColor beyaz; bulb da beyaz, iksirler ve rünler kendi renginde parlar. glass pencere
// manzarasını renklendirir.
const ALCHEMIST_PRESETS = {
  day: {
    background: '#d6d0c4',
    sky: '#f2eee4',
    ground: '#5a5048',
    hemi: 1.7,
    sun: { color: '#f2f4ff', intensity: 1.9, azimuth: -62, elevation: 46 },
    lampColor: '#ffffff',
    lamp: 1.0,
    glow: 0.25,
    nightLights: 0,
    glass: '#ffffff',
    bulb: '#ffffff',
  },
  evening: {
    background: '#5a4a5a',
    sky: '#ffc89a',
    ground: '#3a2e2a',
    hemi: 1.2,
    sun: { color: '#ffa060', intensity: 1.6, azimuth: -74, elevation: 22 },
    lampColor: '#ffffff',
    lamp: 2.8,
    glow: 0.55,
    nightLights: 0.6,
    glass: '#f0a888',
    bulb: '#ffffff',
  },
  night: {
    background: '#100e16',
    sky: '#4a5280',
    ground: '#18141a',
    hemi: 1.15,
    sun: { color: '#9aa8ff', intensity: 0.45, azimuth: -55, elevation: 40 },
    lampColor: '#ffffff',
    lamp: 5,
    glow: 0.85,
    nightLights: 1,
    glass: '#2c3458',
    bulb: '#ffffff',
  },
}

// Alevler, kabarcıklar ve süzülen eşyalar için saniyede 12 kare yeterli. Tek zamanlayıcı tüm
// efekti çizer.
const ANIMATION_FPS = 12

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Simyacı odası temasının ortak sahnesi. AlchemistRoom1..10 bunu kendi yerleşimiyle çağırır.
 * Prop'lar diğer temalarla aynıdır: onSpotClick, reducedMotion, children, defaultTimeOfDay,
 * className, style. reducedMotion: true iken alevler, kabarcıklar, duman, süzülen kitap ve mumlar,
 * baykuş, rünler ve buhar durur.
 */
export default function AlchemistScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildAlchemist(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={ALCHEMIST_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      <AlchemyEffect fx={room.fx} animated={animated} />
      {room.fx.steams.length > 0 && <SteamEffect steams={room.fx.steams} animated={animated} />}
      {animated && <AnimationTicker fps={ANIMATION_FPS} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
