import { useMemo } from 'react'
import AnimationTicker from '../core/AnimationTicker'
import RoomCanvas from '../core/RoomCanvas'
import SpotRings from '../core/SpotRings'
import SteamEffect from '../core/SteamEffect'
import VoxelMeshes from '../core/VoxelMeshes'
import { RoomContext } from '../core/roomContext'
import { buildTeaGarden } from './buildTeaGarden'
import SeaViewEffect from './SeaViewEffect'

// Buhar ve manzaradaki hareketler yavaş; saniyede 12 kare akıcı görünür. Tek zamanlayıcı ikisini
// birlikte çizer, sahnenin geri kalanı boşta ek kare istemez.
const ANIMATION_FPS = 12

// Açık hava: gündüz deniz mavisi arka plan, ampuller sönük; akşam gün batımı, gece ampul
// zincirleri ve karşı kıyının ışıkları. glass manzarayı (gökyüzü, deniz) renklendirir.
const TEAGARDEN_PRESETS = {
  day: {
    background: '#dcebf2',
    sky: '#fff8ea',
    ground: '#a88a66',
    lamp: 0.3,
    glow: 0,
    glass: '#ffffff',
    bulb: '#e6e0d2',
  },
  evening: {
    background: '#efd2bd',
    lampColor: '#ffc978',
    lamp: 2.8,
    glow: 0.5,
    glass: '#f7c39c',
    bulb: '#ffe0a0',
  },
  night: {
    background: '#121a2b',
    lampColor: '#ffc56e',
    lamp: 5,
    glow: 0.75,
    glass: '#2a3a5c',
    bulb: '#ffe6a8',
  },
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Çay bahçesi temasının ortak sahnesi. TeaGardenRoom1..10 bunu kendi yerleşimiyle çağırır.
 * Prop'lar diğer temalarla aynıdır: onSpotClick, reducedMotion, children, defaultTimeOfDay,
 * className, style. reducedMotion: true iken buhar ve manzaradaki hareketler durur.
 */
export default function TeaGardenScene({ layout, onSpotClick, reducedMotion, children, ...canvasProps }) {
  const room = useMemo(() => buildTeaGarden(layout), [layout])
  const animated = !(reducedMotion ?? prefersReducedMotion())

  return (
    <RoomCanvas bounds={room.bounds} lamps={room.lights} presets={TEAGARDEN_PRESETS} {...canvasProps}>
      <VoxelMeshes layers={room.layers} />
      {room.steams.length > 0 && <SteamEffect steams={room.steams} animated={animated} />}
      <SeaViewEffect view={room.view} animated={animated} />
      {animated && <AnimationTicker fps={ANIMATION_FPS} />}
      <SpotRings spots={room.spots} onSpotClick={onSpotClick} />
      <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
    </RoomCanvas>
  )
}
