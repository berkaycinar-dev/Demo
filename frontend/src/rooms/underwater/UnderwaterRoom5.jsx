import UnderwaterScene from './UnderwaterScene'

// 5 kişi · 8x6.5 · 2+2+1 araştırma masası; denizanası tankı, gözlem kamerası, tüp kafesi.
const LAYOUT = {
  width: 8,
  depth: 6.5,
  seed: 9105,
  table: { x: 3.8, z: 3.85, back: 2, front: 2, ends: 1 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.34 },
    { type: 'sonar', at: 3.87, length: 1.8 },
    { type: 'galley', at: 5.57 },
    { type: 'kelp', at: 7.05, length: 1.4 },
  ],
  props: [
    { type: 'jellies', x: 7.35, z: 2.5, facing: '-x' },
    { type: 'camera', x: 0.8, z: 3.2, facing: '-x' },
    { type: 'tanks', x: 7.4, z: 5.6 },
  ],
  spots: [
    { id: 'window', label: 'Akvaryum camı', x: 0.85, z: 5.65 },
  ],
}

export default function UnderwaterRoom5(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
