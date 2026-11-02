import UnderwaterScene from './UnderwaterScene'

// 6 kişi · 8.5x7 · 6 kişilik yuvarlak sonar masası; basınç kapısı, dalış giysisi, kahve köşesi, yosun bahçesi, lomboz altı kanepe, batiskaflı dalış havuzu, denizanası tankı, tüp kafesi.
const LAYOUT = {
  width: 8.5,
  depth: 7,
  seed: 9106,
  back: [
    { type: 'port', at: 0.9 },
    { type: 'port', at: 2.77 },
    { type: 'suit', at: 4.28 },
    { type: 'galley', at: 5.62 },
    { type: 'kelp', at: 7.45, length: 1.6 },
  ],
  left: [
    { type: 'hatch', z: 1.55 },
    { type: 'sofa', z: 3.55, length: 1.6 },
  ],
  table: { x: 5, z: 3.75, seats: 6 },
  props: [
    { type: 'jellies', x: 7.85, z: 2.6, facing: '-x' },
    { type: 'moonpool', x: 1.25, z: 5.75, facing: '+x' },
    { type: 'tanks', x: 8, z: 5.4 },
  ],
}

export default function UnderwaterRoom6(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
