import UnderwaterScene from './UnderwaterScene'

// 4 kişi · 7.5x6 · 4 kişilik yuvarlak sonar masası; basınç kapısı, dalış giysisi, kahve köşesi, yosun bahçesi, batiskaflı dalış havuzu, denizanası tankı.
const LAYOUT = {
  width: 7.5,
  depth: 6,
  seed: 9104,
  back: [
    { type: 'port', at: 0.9 },
    { type: 'port', at: 2.62 },
    { type: 'suit', at: 3.98 },
    { type: 'galley', at: 5.17 },
    { type: 'kelp', at: 6.65, length: 1.2 },
  ],
  left: [
    { type: 'hatch', z: 1.55 },
    { type: 'port', z: 3 },
  ],
  table: { x: 4.3, z: 3.15, seats: 4 },
  props: [
    { type: 'jellies', x: 6.85, z: 2.6, facing: '-x' },
    { type: 'moonpool', x: 1.25, z: 4.75, facing: '+x' },
  ],
}

export default function UnderwaterRoom4(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
