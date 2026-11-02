import UnderwaterScene from './UnderwaterScene'

// 2 kişi · 6x5.5 · 2 kişilik yuvarlak sonar masası; basınç kapısı, dalış giysisi, kahve köşesi, yosun bahçesi, denizanası tankı.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 9102,
  back: [
    { type: 'port', at: 0.9 },
    { type: 'suit', at: 2.4 },
    { type: 'galley', at: 3.73 },
    { type: 'kelp', at: 5.25, length: 1 },
  ],
  left: [
    { type: 'hatch', z: 1.55 },
    { type: 'port', z: 3.4 },
  ],
  table: { x: 3, z: 3.1, seats: 2 },
  props: [
    { type: 'jellies', x: 5.35, z: 2.6, facing: '-x' },
  ],
}

export default function UnderwaterRoom2(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
