import BarScene from './BarScene'

// 7 kişi · 9.5x7.5 · 3 tabureli bar tezgâhı, 1 sedir, yuvarlak masa; arka bar, müzik kutusu, dart, saksı.
const LAYOUT = {
  width: 9.5,
  depth: 7.5,
  seed: 8207,
  counter: { x: 6.18, length: 2.85, stools: 3 },
  wall: [
    { type: 'door', at: 0.83 },
    { type: 'darts', at: 3.07 },
    { type: 'jukebox', at: 8.85 },
  ],
  windows: [2.9, 5.5],
  booths: [2.9],
  tables: [
    { x: 4.4, z: 4.8 },
  ],
  props: [
    { type: 'plant', x: 9.05, z: 3 },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 6.65 },
  ],
}

export default function BarRoom7(props) {
  return <BarScene layout={LAYOUT} {...props} />
}
