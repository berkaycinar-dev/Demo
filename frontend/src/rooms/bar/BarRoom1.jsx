import BarScene from './BarScene'

// 1 kişi · 5x4.5 · 1 tabureli bar tezgâhı; arka bar, müzik kutusu, saksı.
const LAYOUT = {
  width: 5,
  depth: 4.5,
  seed: 8201,
  counter: { x: 2.68, length: 1.8, stools: 1 },
  wall: [
    { type: 'door', at: 0.83 },
    { type: 'jukebox', at: 4.35 },
  ],
  windows: [2.7],
  props: [
    { type: 'plant', x: 4.55, z: 3 },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 3.65 },
  ],
}

export default function BarRoom1(props) {
  return <BarScene layout={LAYOUT} {...props} />
}
