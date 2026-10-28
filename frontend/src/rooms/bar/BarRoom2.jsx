import BarScene from './BarScene'

// 2 kişi · 6x5.5 · 2 tabureli bar tezgâhı; arka bar, müzik kutusu, saksı.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 8202,
  counter: { x: 3.18, length: 2.1, stools: 2 },
  wall: [
    { type: 'door', at: 0.83 },
    { type: 'jukebox', at: 5.35 },
  ],
  windows: [2.6, 4.4],
  props: [
    { type: 'plant', x: 5.55, z: 3 },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 4.65 },
  ],
}

export default function BarRoom2(props) {
  return <BarScene layout={LAYOUT} {...props} />
}
