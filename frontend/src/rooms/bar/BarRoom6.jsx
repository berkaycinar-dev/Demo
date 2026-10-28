import BarScene from './BarScene'

// 6 kişi · 8.5x7 · 2 tabureli bar tezgâhı, 1 sedir, yuvarlak masa; arka bar, müzik kutusu, dart, saksı.
const LAYOUT = {
  width: 8.5,
  depth: 7,
  seed: 8206,
  counter: { x: 5.64, length: 2.1, stools: 2 },
  wall: [
    { type: 'door', at: 0.83 },
    { type: 'darts', at: 2.99 },
    { type: 'jukebox', at: 7.85 },
  ],
  windows: [2.9, 5.3],
  booths: [2.9],
  tables: [
    { x: 4, z: 4.6 },
  ],
  props: [
    { type: 'plant', x: 8.05, z: 3 },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 6.15 },
  ],
}

export default function BarRoom6(props) {
  return <BarScene layout={LAYOUT} {...props} />
}
