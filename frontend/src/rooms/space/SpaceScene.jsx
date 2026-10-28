import { useMemo } from 'react'
import AnimationTicker from '../core/AnimationTicker'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import { buildSpace } from './buildSpace'
import StationEffect from './StationEffect'

// İstasyonun aydınlatma döngüsü: gündüz soğuk beyaz, akşam sıcak loş, gece mavi gece modu.
// Pencereden giren ışık yıldızın ışığıdır. glass manzarayı renklendirir; uzay her saatte görünsün
// diye hiç kararmaz.
const SPACE_PRESETS = {
  day: {
    background: '#dfe5ec',
    sky: '#f4f8ff',
    ground: '#7d8796',
    hemi: 2.1,
    sun: { color: '#f4f8ff', intensity: 2.3, azimuth: -62, elevation: 48 },
    lampColor: '#eef6ff',
    lamp: 1.6,
    glow: 0.12,
    glass: '#ffffff',
    bulb: '#f2f6ff',
  },
  evening: {
    background: '#ddd3e6',
    sky: '#ffe2c8',
    ground: '#5e5866',
    lampColor: '#ffdcb4',
    lamp: 3,
    glow: 0.35,
    glass: '#f6e8ff',
    bulb: '#fff0dc',
  },
  night: {
    background: '#0d1220',
    sky: '#6676a8',
    ground: '#22252e',
    hemi: 1.35,
    sun: { color: '#9db2ff', intensity: 0.5, azimuth: -60, elevation: 35 },
    lampColor: '#d2e6ff',
    lamp: 4.5,
    glow: 0.6,
    glass: '#d0dbff',
    bulb: '#ffffff',
  },
}

// Hologram ve uydu yavaş; saniyede 12 kare akıcı görünür. Tek zamanlayıcı tüm efekti çizer.
const ANIMATION_FPS = 12

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Uzay istasyonu temasının ortak sahnesi. SpaceRoom1..10 bunu kendi yerleşimiyle çağırır.
 * Prop'lar diğer temalarla aynıdır: onSpotClick, reducedMotion, children, defaultTimeOfDay,
 * className, style. reducedMotion: true iken hologram, uydu ve yanıp sönen ışıklar durur.
 */
export default function SpaceScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildSpace(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={SPACE_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      <StationEffect fx={room.fx} animated={animated} />
      {animated && <AnimationTicker fps={ANIMATION_FPS} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
