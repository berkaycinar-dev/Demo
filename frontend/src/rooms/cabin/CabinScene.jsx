import { useMemo } from 'react'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import { buildCabin } from './buildCabin'
import FireEffect from './FireEffect'

// Dışarısı karlı: gündüz soğuk mavi-gri arka plan, akşam pembe gün batımı, gece lacivert.
const CABIN_PRESETS = {
  day: { background: '#e3e8ed', glass: '#eef5fb' },
  evening: { background: '#e8d3c6', glass: '#f6bb94' },
  night: { background: '#1a1f2e', glass: '#2c3b60' },
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Dağ evi temasının ortak sahnesi. CabinRoom1..10 bunu kendi yerleşimiyle çağırır.
 * Prop'lar LibraryScene ile aynıdır: onSpotClick, children, defaultTimeOfDay, className, style.
 * reducedMotion: true iken ateş animasyonu durur (varsayılan: işletim sistemi tercihi).
 */
export default function CabinScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildCabin(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={CABIN_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      {room.fires.length > 0 && <FireEffect fires={room.fires} animated={animated} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
