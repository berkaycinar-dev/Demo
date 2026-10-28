import BarScene from './BarScene'

// 3 kişi · 7x6 · 3 tabureli bar tezgâhı; arka bar, müzik kutusu, saksı.
const LAYOUT = {
  width: 7,
  depth: 6,
  seed: 8203,
  counter: { x: 3.68, length: 2.85, stools: 3 },
  wall: [
    { type: 'door', at: 0.83 },
    { type: 'jukebox', at: 6.35 },
  ],
  windows: [2.6, 4.6],
  props: [
    { type: 'plant', x: 6.55, z: 3 },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 5.15 },
  ],
}

export default function BarRoom3(props) {
  return <BarScene layout={LAYOUT} {...props} />
}
