import BarScene from './BarScene'

// 9 kişi · 10.5x8.5 · 3 tabureli bar tezgâhı, 2 sedir, yuvarlak masa; arka bar, müzik kutusu, dart, bilardo.
const LAYOUT = {
  width: 10.5,
  depth: 8.5,
  seed: 8209,
  counter: { x: 6.76, length: 3.4, stools: 3 },
  wall: [
    { type: 'door', at: 0.83 },
    { type: 'darts', at: 3.22 },
    { type: 'jukebox', at: 9.85 },
  ],
  windows: [2.9, 5.1, 7.3],
  booths: [2.9, 5.1],
  tables: [
    { x: 4.8, z: 5.2 },
  ],
  props: [
    { type: 'pool', x: 9.1, z: 5.3, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 7.65 },
  ],
}

export default function BarRoom9(props) {
  return <BarScene layout={LAYOUT} {...props} />
}
