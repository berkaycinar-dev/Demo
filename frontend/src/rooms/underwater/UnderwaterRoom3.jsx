import UnderwaterScene from './UnderwaterScene'

// 3 kişi · 7x6 · 2+1 araştırma masası; kahve köşesi, denizanası tankı.
const LAYOUT = {
  width: 7,
  depth: 6,
  seed: 9103,
  table: { x: 3.5, z: 3.65, back: 2, front: 1, ends: 0 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.29 },
    { type: 'sonar', at: 3.57, length: 1.4 },
    { type: 'galley', at: 5.02 },
    { type: 'kelp', at: 6.25, length: 1 },
  ],
  props: [
    { type: 'jellies', x: 6.35, z: 2.5, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Akvaryum camı', x: 0.85, z: 5.15 },
  ],
}

export default function UnderwaterRoom3(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
