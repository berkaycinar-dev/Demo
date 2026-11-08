import UnderwaterScene from './UnderwaterScene'

// 5 kişi · 8x6.5 · 5 kişilik yuvarlak sonar masası; basınç kapısı, dalış giysisi, kahve köşesi, yosun bahçesi, batiskaflı dalış havuzu, denizanası tankı, tüp kafesi.
const LAYOUT = {
  width: 8,
  depth: 6.5,
  seed: 9105,
  back: [
    { type: 'port', at: 0.9 },
    { type: 'port', at: 2.69 },
    { type: 'suit', at: 4.13 },
    { type: 'galley', at: 5.39 },
    { type: 'kelp', at: 7.05, length: 1.4 },
  ],
  left: [
    { type: 'hatch', z: 1.55 },
    { type: 'port', z: 3.2 },
  ],
  table: { x: 4.6, z: 3.45, seats: 5 },
  props: [
    { type: 'jellies', x: 7.35, z: 2.6, facing: '-x' },
    { type: 'moonpool', x: 1.25, z: 5.25, facing: '+x' },
    { type: 'tanks', x: 7.5, z: 4.9 },
  ],
}

export default function UnderwaterRoom5(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
