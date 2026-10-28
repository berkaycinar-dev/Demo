import { useMemo } from 'react'
import AnimationTicker from '../core/AnimationTicker'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import SteamEffect from '../core/SteamEffect'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import { buildLibrary } from './buildLibrary'
import ClockEffect from './ClockEffect'

// Buhar ve saniye ibresi yavaş; saniyede 10 kare yeter. Tek zamanlayıcı ikisini birlikte çizer.
const ANIMATION_FPS = 10

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Kütüphane temasının ortak sahnesi. LibraryRoom1..10 bunu kendi yerleşimiyle çağırır.
 *
 * onSpotClick(spot): zemindeki mola halkasına tıklanınca { id, label, position }
 * reducedMotion: true iken çay buharı ve saat ibreleri durur (varsayılan: işletim sistemi tercihi)
 * children: sahne içine eklenecek 3D içerik (ör. avatarlar); useRoom() ile
 *           koltuklara (seats) ve mola noktalarına (spots) erişebilir.
 * Diğer prop'lar (defaultTimeOfDay, className, style) RoomCanvas'a gider.
 */
export default function LibraryScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildLibrary(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      {room.steams.length > 0 && <SteamEffect steams={room.steams} animated={animated} />}
      {room.clocks.length > 0 && <ClockEffect clocks={room.clocks} animated={animated} />}
      {animated && <AnimationTicker fps={ANIMATION_FPS} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
