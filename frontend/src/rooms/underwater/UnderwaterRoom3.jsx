import UnderwaterScene from './UnderwaterScene'

// 3 kişi · 7x6 · 3 kişilik yuvarlak sonar masası; basınç kapısı, dalış giysisi, kahve köşesi, yosun bahçesi, denizanası tankı.
const LAYOUT = {
  width: 7,
  depth: 6,
  seed: 9103,
  back: [
    { type: 'port', at: 0.9 },
    { type: 'port', at: 2.54 },
    { type: 'suit', at: 3.83 },
    { type: 'galley', at: 4.94 },
    { type: 'kelp', at: 6.25, length: 1 },
  ],
  left: [
    { type: 'hatch', z: 1.55 },
    { type: 'port', z: 3.3 },
  ],
  table: { x: 3.6, z: 3.3, seats: 3 },
  props: [
    { type: 'jellies', x: 6.35, z: 2.6, facing: '-x' },
  ],
}

export default function UnderwaterRoom3(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
