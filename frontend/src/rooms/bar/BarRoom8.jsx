import BarScene from './BarScene'

// 8 kişi · 10x8 · 4 tabureli bar tezgâhı, 1 sedir, yuvarlak masa; arka bar, müzik kutusu, dart, bilardo.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 8208,
  counter: { x: 6.39, length: 3.6, stools: 4 },
  wall: [
    { type: 'door', at: 0.83 },
    { type: 'darts', at: 2.99 },
    { type: 'jukebox', at: 9.35 },
  ],
  windows: [2.9, 5.2, 7],
  booths: [2.9],
  tables: [
    { x: 4.6, z: 4.9 },
  ],
  props: [
    { type: 'pool', x: 8.6, z: 5, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 7.15 },
  ],
}

export default function BarRoom8(props) {
  return <BarScene layout={LAYOUT} {...props} />
}
