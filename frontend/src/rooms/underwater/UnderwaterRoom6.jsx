import UnderwaterScene from './UnderwaterScene'

// 6 kişi · 8.5x7 · 3+3 araştırma masası; denizanası tankı, gözlem kamerası, tüp kafesi, cam önü bank.
const LAYOUT = {
  width: 8.5,
  depth: 7,
  seed: 9106,
  table: { x: 4.3, z: 3.7, back: 3, front: 3, ends: 0 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.36 },
    { type: 'sonar', at: 4.02, length: 2 },
    { type: 'galley', at: 5.84 },
    { type: 'kelp', at: 7.45, length: 1.6 },
  ],
  props: [
    { type: 'jellies', x: 7.85, z: 2.5, facing: '-x' },
    { type: 'camera', x: 0.8, z: 3.3, facing: '-x' },
    { type: 'bench', x: 0.44, z: 4.85, facing: '+x', length: 1.6 },
    { type: 'tanks', x: 7.9, z: 6.1 },
  ],
  spots: [
    { id: 'window', label: 'Akvaryum camı', x: 0.85, z: 6.15 },
  ],
}

export default function UnderwaterRoom6(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
