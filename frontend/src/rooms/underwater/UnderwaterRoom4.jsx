import UnderwaterScene from './UnderwaterScene'

// 4 kişi · 7.5x6 · 2+2 araştırma masası; denizanası tankı, cam önünde gözlem kamerası.
const LAYOUT = {
  width: 7.5,
  depth: 6,
  seed: 9104,
  table: { x: 3.8, z: 3.65, back: 2, front: 2, ends: 0 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.31 },
    { type: 'sonar', at: 3.72, length: 1.6 },
    { type: 'galley', at: 5.29 },
    { type: 'kelp', at: 6.65, length: 1.2 },
  ],
  props: [
    { type: 'jellies', x: 6.85, z: 2.5, facing: '-x' },
    { type: 'camera', x: 0.8, z: 3, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Akvaryum camı', x: 0.85, z: 5.15 },
  ],
}

export default function UnderwaterRoom4(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
