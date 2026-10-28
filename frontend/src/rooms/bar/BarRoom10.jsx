import BarScene from './BarScene'

// 10 kişi · 11x9 · 4 tabureli bar tezgâhı, 2 sedir, yuvarlak masa; arka bar, müzik kutusu, dart, bilardo.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 8210,
  counter: { x: 6.99, length: 4, stools: 4 },
  wall: [
    { type: 'door', at: 0.83 },
    { type: 'darts', at: 3.19 },
    { type: 'jukebox', at: 10.35 },
  ],
  windows: [2.9, 5.1, 7.5],
  booths: [2.9, 5.1],
  tables: [
    { x: 5, z: 5.4 },
  ],
  props: [
    { type: 'pool', x: 9.6, z: 5.5, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 8.15 },
  ],
}

export default function BarRoom10(props) {
  return <BarScene layout={LAYOUT} {...props} />
}
