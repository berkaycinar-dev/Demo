import UnderwaterScene from './UnderwaterScene'

// 10 kişi · 11x9 · 4 lomboz masası, 6 kişilik yuvarlak sonar masası; basınç kapısı, dalış giysisi, kahve köşesi, yosun bahçesi, lomboz altı kanepe, batiskaflı dalış havuzu, denizanası tankı, tüp kafesi.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 9110,
  back: [
    { type: 'port', at: 0.9, desk: true },
    { type: 'port', at: 2.49, desk: true },
    { type: 'port', at: 4.09, desk: true },
    { type: 'port', at: 5.68, desk: true },
    { type: 'suit', at: 6.92 },
    { type: 'galley', at: 7.99 },
    { type: 'kelp', at: 9.75, length: 2 },
  ],
  left: [
    { type: 'hatch', z: 1.55 },
    { type: 'sofa', z: 4.3, length: 2.2 },
  ],
  table: { x: 6.5, z: 4.55, seats: 6 },
  props: [
    { type: 'jellies', x: 10.35, z: 2.6, facing: '-x' },
    { type: 'moonpool', x: 1.25, z: 7.75, facing: '+x' },
    { type: 'tanks', x: 10.5, z: 6.7 },
  ],
}

export default function UnderwaterRoom10(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
