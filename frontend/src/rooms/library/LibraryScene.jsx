import { useMemo } from 'react'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import { buildLibrary } from './buildLibrary'

/**
 * Kütüphane temasının ortak sahnesi. LibraryRoom1..10 bunu kendi yerleşimiyle çağırır.
 *
 * onSpotClick(spot): zemindeki mola halkasına tıklanınca { id, label, position }
 * children: sahne içine eklenecek 3D içerik (ör. avatarlar); useRoom() ile
 *           koltuklara (seats) ve mola noktalarına (spots) erişebilir.
 * Diğer prop'lar (defaultTimeOfDay, className, style) RoomCanvas'a gider.
 */
export default function LibraryScene({ layout, onSpotClick, children, ...canvasProps }) {
  const room = useMemo(() => buildLibrary(layout), [layout])

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
