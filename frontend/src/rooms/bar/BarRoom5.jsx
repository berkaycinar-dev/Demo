import BarScene from './BarScene'

// 5 kişi · 8x6.5 · 3 tabureli bar tezgâhı, yuvarlak masa; arka bar, müzik kutusu, dart, saksı.
const LAYOUT = {
  width: 8,
  depth: 6.5,
  seed: 8205,
  counter: { x: 5.18, length: 2.85, stools: 3 },
  wall: [
    { type: 'door', at: 0.83 },
    { type: 'darts', at: 2.57 },
    { type: 'jukebox', at: 7.35 },
  ],
  windows: [2.8, 4.9],
  tables: [
    { x: 3.8, z: 4.5 },
  ],
  props: [
    { type: 'plant', x: 7.55, z: 3 },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 5.65 },
  ],
}

export default function BarRoom5(props) {
  return <BarScene layout={LAYOUT} {...props} />
}
