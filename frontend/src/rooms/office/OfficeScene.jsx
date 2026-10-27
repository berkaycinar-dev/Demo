import { useMemo } from 'react'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import BlinkEffect from './BlinkEffect'
import { buildOffice } from './buildOffice'

// Plaza ofisi: tavan armatürleri gündüz de yanık, ışık nötr beyaz; gece içerisi aydınlık,
// dışarıda şehir ışıkları.
const OFFICE_PRESETS = {
  day: {
    background: '#e6e9ed',
    sky: '#f4f7fb',
    ground: '#8a8f96',
    hemi: 2.2,
    lampColor: '#fff4e2',
    lamp: 2,
    glow: 0.12,
    glass: '#eef4f9',
    bulb: '#f7f7f5',
  },
  evening: {
    background: '#e9d6cc',
    lampColor: '#ffe9cc',
    lamp: 3.5,
    glow: 0.3,
    glass: '#f6c29c',
    bulb: '#fff3e0',
  },
  night: {
    background: '#151a26',
    sky: '#7d8bb5',
    ground: '#2b2b33',
    hemi: 1.5,
    lampColor: '#fff1dc',
    lamp: 5,
    glow: 0.5,
    glass: '#25304b',
    bulb: '#ffffff',
  },
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Yazılım ofisi temasının ortak sahnesi. OfficeRoom1..10 bunu kendi yerleşimiyle çağırır.
 * Prop'lar CabinScene ile aynıdır: onSpotClick, reducedMotion, children, defaultTimeOfDay,
 * className, style. reducedMotion: true iken imleç ve ikaz lambaları yanıp sönmez.
 */
export default function OfficeScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildOffice(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={OFFICE_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      {room.blinkers.length > 0 && <BlinkEffect items={room.blinkers} animated={animated} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
