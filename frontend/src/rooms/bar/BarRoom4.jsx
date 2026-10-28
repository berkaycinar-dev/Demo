import BarScene from './BarScene'

// 4 kişi · 7.5x6 · 2 tabureli bar tezgâhı, yuvarlak masa; arka bar, müzik kutusu, dart, saksı.
const LAYOUT = {
  width: 7.5,
  depth: 6,
  seed: 8204,
  counter: { x: 4.97, length: 2.1, stools: 2 },
  wall: [
    { type: 'door', at: 0.83 },
    { type: 'darts', at: 2.66 },
    { type: 'jukebox', at: 6.85 },
  ],
  windows: [2.6, 4.6],
  tables: [
    { x: 3.6, z: 4.3 },
  ],
  props: [
    { type: 'plant', x: 7.05, z: 3 },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 5.15 },
  ],
}

export default function BarRoom4(props) {
  return <BarScene layout={LAYOUT} {...props} />
}
