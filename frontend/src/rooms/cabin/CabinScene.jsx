import { useMemo } from 'react'
import AnimationTicker from '../core/AnimationTicker'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import SteamEffect from '../core/SteamEffect'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import { buildCabin } from './buildCabin'
import FireEffect from './FireEffect'
import SnowEffect from './SnowEffect'

// Dışarısı karlı: gündüz soğuk mavi-gri arka plan, akşam pembe gün batımı, gece lacivert.
const CABIN_PRESETS = {
  day: { background: '#e3e8ed', glass: '#eef5fb' },
  evening: { background: '#e8d3c6', glass: '#f6bb94' },
  night: { background: '#1a1f2e', glass: '#2c3b60' },
}

// Ateş titremesi için saniyede 15 kare; kar ve buhar aynı kareleri kullanır.
const ANIMATION_FPS = 15

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Dağ evi temasının ortak sahnesi. CabinRoom1..10 bunu kendi yerleşimiyle çağırır.
 * Prop'lar LibraryScene ile aynıdır: onSpotClick, children, defaultTimeOfDay, className, style.
 * reducedMotion: true iken ateş, kar ve buhar durur (varsayılan: işletim sistemi tercihi).
 */
export default function CabinScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildCabin(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={CABIN_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      {room.fires.length > 0 && <FireEffect fires={room.fires} animated={animated} />}
      {room.snow.length > 0 && <SnowEffect windows={room.snow} animated={animated} />}
      {room.steams.length > 0 && <SteamEffect steams={room.steams} animated={animated} />}
      {animated && <AnimationTicker fps={ANIMATION_FPS} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
