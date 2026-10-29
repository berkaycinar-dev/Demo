import { useMemo } from 'react'
import AnimationTicker from '../core/AnimationTicker'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import SteamEffect from '../core/SteamEffect'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import { buildTreehouse } from './buildTreehouse'
import TreehouseEffect from './TreehouseEffect'

// Ormanın içinde ağaç ev: gündüz yaprakların arasından yeşilimsi açık ışık, akşam altın rengi,
// gece koyu yeşil-lacivert; gece ana ışık fenerler ve süs ampulleri. glass orman manzarasını
// renklendirir.
const TREEHOUSE_PRESETS = {
  day: {
    background: '#dfe8d0',
    sky: '#fbf8e8',
    ground: '#7a8a52',
    hemi: 2.1,
    sun: { color: '#fff4dc', intensity: 2.3, azimuth: -62, elevation: 52 },
    lamp: 0.6,
    glow: 0.12,
    glass: '#ffffff',
    bulb: '#f6e6bc',
  },
  evening: {
    background: '#ead0a4',
    ground: '#6a5a38',
    lampColor: '#ffc06a',
    lamp: 2.8,
    glow: 0.5,
    glass: '#f2b98c',
  },
  night: {
    background: '#121a19',
    sky: '#4f6a7a',
    ground: '#1d2420',
    hemi: 1.1,
    lampColor: '#ffbb62',
    lamp: 5.5,
    glow: 0.8,
    glass: '#2c3d52',
    bulb: '#ffe0a0',
  },
}

// Yapraklar, hamak ve alevler yavaş; saniyede 12 kare yeterli. Tek zamanlayıcı tüm efekti çizer.
const ANIMATION_FPS = 12

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Ağaç ev temasının ortak sahnesi. TreehouseRoom1..10 bunu kendi yerleşimiyle çağırır. Prop'lar
 * diğer temalarla aynıdır: onSpotClick, reducedMotion, children, defaultTimeOfDay, className, style.
 * reducedMotion: true iken yapraklar, ateş böcekleri, ampuller, alevler, hamak ve buhar durur.
 */
export default function TreehouseScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildTreehouse(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={TREEHOUSE_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      <TreehouseEffect fx={room.fx} animated={animated} />
      {room.fx.steams.length > 0 && <SteamEffect steams={room.fx.steams} animated={animated} />}
      {animated && <AnimationTicker fps={ANIMATION_FPS} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
